const jwt = require('jsonwebtoken');
const { get } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_change_me';

const authenticateUser = async (req, res, next) => {
  try {
    // 1. Get token from cookies OR Bearer token (for mobile fallback)
    let token;
    
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 3. Ensure user still exists
    const user = await get('SELECT id, username, email, points, role FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists. Please log in again.' });
    }

    // 4. Attach user to request
    req.auth = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TokenExpired', message: 'Your session has expired.' });
    }
    return res.status(401).json({ message: 'Invalid token. Please log in again.' });
  }
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
