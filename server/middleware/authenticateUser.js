const { ClerkExpressRequireAuth, clerkClient } = require('@clerk/clerk-sdk-node');
const { get, run } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_change_me';

const clerkAuth = ClerkExpressRequireAuth({});

const authenticateUser = async (req, res, next) => {
  clerkAuth(req, res, async (err) => {
    if (err) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }
    
    try {
      const clerkUserId = req.auth.userId;
      if (!clerkUserId) {
        return res.status(401).json({ message: 'Invalid session.' });
      }

      // Find user in our local database by clerk_id (which we'll store in the google_id column for now)
      let user = await get('SELECT id, username, email, points, role FROM users WHERE google_id = ?', [clerkUserId]);
      
      if (!user) {
        // Fallback: If webhook failed, sync user on the fly
        try {
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          const username = clerkUser.firstName || clerkUser.username || 'User';
          
          const result = await run('INSERT INTO users (google_id, username, email) VALUES (?, ?, ?) RETURNING *', [clerkUserId, username, email]);
          user = await get('SELECT id, username, email, points, role FROM users WHERE id = ?', [result.lastID || result.id]);
          
          if (!user) throw new Error("Insert failed");
        } catch (syncErr) {
          console.error("Failed to sync Clerk user on the fly:", syncErr);
          // If we really can't sync, at least provide a dummy email to prevent crashes
          req.auth = { id: 'pending_sync', clerkId: clerkUserId, role: 'user', email: 'no-reply@auraastore.com' };
          return next();
        }
      }

      // Attach local user to request (important for cart, orders, etc.)
      req.auth = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token. Please log in again.' });
    }
  });
};

const authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.auth || req.auth.role !== role) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
};

const authenticateAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.cookies && req.cookies.adminToken) {
      token = req.cookies.adminToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Admin authentication required.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Not an admin token.' });
    }
    
    // Join with roles table to get permissions
    const admin = await get(`
      SELECT a.id, a.email, a.role_id, a.status, r.name as role_name, r.permissions 
      FROM admin_users a 
      LEFT JOIN roles r ON a.role_id = r.id 
      WHERE a.id = ?
    `, [decoded.id]);
    
    if (!admin || admin.status !== 'active') {
      return res.status(401).json({ message: 'Admin account inactive or deleted.' });
    }

    try {
      admin.permissions = admin.permissions ? JSON.parse(admin.permissions) : [];
    } catch {
      admin.permissions = [];
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TokenExpired', message: 'Admin session expired.' });
    }
    return res.status(401).json({ message: 'Invalid admin token.' });
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Admin authentication required.' });
    }
    if (req.admin.role_name === 'Super Admin') {
      return next(); // Super Admin has all permissions
    }
    if (!req.admin.permissions.includes(permission)) {
      return res.status(403).json({ message: `Requires permission: ${permission}` });
    }
    next();
  };
};

module.exports = { authenticateUser, authorizeRole, authenticateAdmin, requirePermission };
