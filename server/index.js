console.log("Starting server boot sequence...");
process.on('uncaughtException', (err) => {
  console.error("FATAL UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error("FATAL UNHANDLED REJECTION:", err);
  process.exit(1);
});

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
console.log("Environment variables loaded.");

const express = require('express'); 
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { authenticateUser, authorizeRole, authenticateAdmin, requirePermission } = require('./middleware/authenticateUser');
const { globalLimiter, loginLimiter, registerLimiter, forgotPasswordLimiter, otpLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { generateTokens, setAuthCookies, clearAuthCookies } = require('./utils/tokenHelper');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID, createHmac } = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
// Razorpay integration restored
const Razorpay = require('razorpay');
const razorpayInstance = process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('YOUR_KEY_ID') ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;
// Use Brevo API for all emails instead of Nodemailer (blocked by Render)
const transporter = {
  sendMail: async ({ to, subject, html }) => {
    if (!process.env.BREVO_API_KEY) {
      console.warn('BREVO_API_KEY is missing. Email not sent.');
      return;
    }
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'AURA STORE',
          email: process.env.GMAIL_USER || 'auraastore2@gmail.com'
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html
      })
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Brevo API Error: ${err}`);
    }
    return response;
  }
};

const sendWelcomeEmail = async (toEmail, username) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return;
  try {
    await transporter.sendMail({
      from: `"Aura Store" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `Welcome to Aura Store, ${username}! 🎉`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #e11b23;">AURA STORE</h2>
          <h3>Welcome aboard, ${username}!</h3>
          <p>We are thrilled to have you here. Your account has been successfully created.</p>
          <p>Get ready to explore our premium streetwear collections and exclusive offers.</p>
          <br/>
          <p>Happy Shopping,<br/><strong>The Aura Store Team</strong></p>
        </div>
      `,
    });
    console.log(`Welcome email sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
};

const sendTheftAlertEmail = async (toEmail, username, ip, device, location) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return;
  try {
    await transporter.sendMail({
      from: `"Aura Store Security" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `🚨 Security Alert: Unauthorized Session Attempt`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #e11b23;">AURA STORE SECURITY</h2>
          <h3>Hello, ${username}</h3>
          <p>We detected a suspicious attempt to access your account using an old or revoked session token.</p>
          <p><strong>Device:</strong> ${device}</p>
          <p><strong>IP Address:</strong> ${ip}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p>As a precaution, we have logged you out of ALL devices. Please log back in to secure your account. If you did not initiate this, please reset your password immediately.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send theft email:', err);
  }
};

const sendPasswordResetEmail = async (toEmail) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return;
  try {
    await transporter.sendMail({
      from: `"Aura Store Security" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `✅ Password Successfully Reset`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #008080; text-align: center;">AURA STORE</h2>
          <h3 style="text-align: center;">Password Reset Successful</h3>
          <p>Hello,</p>
          <p>We are writing to confirm that the password for your Aura Store account has been successfully changed.</p>
          <p>If you made this change, no further action is required.</p>
          <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-left: 4px solid #ffeeba; margin: 20px 0;">
            <p style="margin: 0;"><strong>Security Notice:</strong> If you did not authorize this change, please contact our support team immediately.</p>
          </div>
          <br/>
          <p>Best Regards,<br/><strong>The Aura Store Team</strong></p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send password reset email:', err);
  }
};

const { generateOtp, sendOtpEmail, storeOtp, verifyOtp, canRequestOtp } = require('./otpHelper');
const sendOrderEmail = async (email, orderRef, amount, items = []) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log('Gmail credentials missing. Order email not sent.');
    return;
  }

  let itemsHtml = '';
  if (items && items.length > 0) {
    itemsHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f8f9fa; text-align: left;">
            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Qty</th>
            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Price</th>
            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>${item.name}</strong><br/>
                <small>Size: ${item.size} | Color: ${item.color}</small>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">INR ${item.price}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">INR ${item.price * item.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; padding: 10px; font-weight: bold;">Grand Total:</td>
            <td style="padding: 10px; font-weight: bold; color: #e11b23;">INR ${amount}</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  try {
    await transporter.sendMail({
      from: `"Aura Store" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Invoice - Order Confirmed! #${orderRef}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h1 style="color: #e11b23; text-align: center;">AURA STORE</h1>
          <h2 style="text-align: center;">Thank you for your order!</h2>
          <p>Hi there,</p>
          <p>We've received your payment and your order is confirmed.</p>
          <p><strong>Order Reference:</strong> ${orderRef}</p>
          
          <h3>Order Details:</h3>
          ${itemsHtml}
          
          <p style="margin-top: 30px;">Your premium streetwear will be shipped shortly. We'll send you another email when it's on the way!</p>
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666; text-align: center;">This is an automated confirmation email. Please do not reply.</p>
        </div>
      `
    });
    console.log(`Order email sent successfully to ${email}`);
  } catch (error) {
    console.error('Order email sending failed:', error);
  }
};

const sendOrderStatusEmail = async (email, orderRef, status) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return;
  
  let statusMessage = '';
  let subject = '';
  
  switch(status.toLowerCase()) {
    case 'processing':
      subject = `Order Processing - #${orderRef}`;
      statusMessage = "Your order is currently being processed and prepared for shipment.";
      break;
    case 'shipped':
      subject = `Order Shipped! - #${orderRef}`;
      statusMessage = "Good news! Your order has been shipped and is on its way to you.";
      break;
    case 'out for delivery':
      subject = `Out for Delivery! - #${orderRef}`;
      statusMessage = "Your order is out for delivery today. Keep an eye out for our delivery partner!";
      break;
    case 'delivered':
      subject = `Order Delivered - #${orderRef}`;
      statusMessage = "Your order has been delivered successfully. We hope you love your new gear!";
      break;
    default:
      subject = `Order Update - #${orderRef}`;
      statusMessage = `Your order status has been updated to: <strong>${status}</strong>.`;
  }

  try {
    await transporter.sendMail({
      from: `"Aura Store" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h1 style="color: #e11b23; text-align: center;">AURA STORE</h1>
          <h2 style="text-align: center;">Order Update</h2>
          <p>Hi there,</p>
          <p>Here's an update regarding your order <strong>#${orderRef}</strong>:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #008080; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">${statusMessage}</p>
          </div>
          
          <p>You can track the full progress of your order in your profile dashboard.</p>
          <br/>
          <p>Best Regards,<br/><strong>The Aura Store Team</strong></p>
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666; text-align: center;">This is an automated tracking email.</p>
        </div>
      `
    });
    console.log(`Tracking email sent successfully to ${email} for status ${status}`);
  } catch (error) {
    console.error('Tracking email sending failed:', error);
  }
};
console.log("All modules required successfully.");

const { all, get, initDatabase, run } = require('./database');
console.log("Database module loaded.");

const app = express();
app.set('trust proxy', 1); // Required for rate limiting on Render
const PORT = Number.parseInt(process.env.PORT, 10) || 5055;
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_change_me';
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log('CORS allowed origins:', allowedOrigins);
console.log('Environment loaded successfully');

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/api', globalLimiter);


// Serve images from client/public for development
app.use(express.static(path.join(__dirname, '../client/public')));

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// Maintenance Mode Middleware
const maintenanceModeMiddleware = asyncHandler(async (req, res, next) => {
  // Always allow admin routes so we can turn it off
  if (req.path.startsWith('/admin')) {
    return next();
  }
  
  try {
    const setting = await get("SELECT value FROM settings WHERE key = 'maintenance_mode'");
    if (setting && setting.value === 'true') {
      return res.status(503).json({ message: "Store is currently under maintenance. Please check back later." });
    }
  } catch (err) {
    console.error("Failed to check maintenance mode", err);
  }
  next();
});
app.use('/api', maintenanceModeMiddleware);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function parseGender(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === 'men' || normalized === 'male') {
    return 'Men';
  }

  if (normalized === 'women' || normalized === 'female') {
    return 'Women';
  }

  return undefined;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    points: user.points || 0,
  };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      id: user.id,
      email: user.email,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN },
  );
}

function parseAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount);
}

function sanitizeCardNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidExpiry(value) {
  const match = String(value || '').trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);

  if (!match) {
    return false;
  }

  const month = Number.parseInt(match[1], 10);
  const year = 2000 + Number.parseInt(match[2], 10);
  const expiryDate = new Date(year, month);
  const now = new Date();
  return expiryDate > new Date(now.getFullYear(), now.getMonth());
}

function normalizePaymentPayload(body) {
  const method = String(body.method || '').trim().toLowerCase();
  const amount = parseAmount(body.amount);

  if (!['card', 'upi', 'cod'].includes(method)) {
    return { error: 'Choose Card, UPI, or Cash on Delivery before placing the order.' };
  }

  if (!amount || amount <= 0) {
    return { error: 'Payment amount must be greater than zero.' };
  }

  if (method === 'card') {
    const cardNumber = sanitizeCardNumber(body.cardNumber);
    const cvv = String(body.cvv || '').trim();
    const cardName = String(body.cardName || '').trim();

    if (cardNumber.length < 12 || cardNumber.length > 19) {
      return { error: 'Enter a valid card number.' };
    }

    if (!cardName) {
      return { error: 'Name on card is required.' };
    }

    if (!isValidExpiry(body.expiry)) {
      return { error: 'Enter a valid future expiry date in MM/YY format.' };
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      return { error: 'Enter a valid CVV.' };
    }

    return {
      amount,
      method,
      metadata: {
        brand: cardNumber.startsWith('4') ? 'Visa' : 'Card',
        last4: cardNumber.slice(-4),
      },
    };
  }

  if (method === 'upi') {
    const upiId = String(body.upiId || '').trim().toLowerCase();

    if (!/^[a-z0-9.\-_]{2,}@[a-z]{2,}$/i.test(upiId)) {
      return { error: 'Enter a valid UPI ID, for example name@bank.' };
    }

    const [handle] = upiId.split('@');

    return {
      amount,
      method,
      metadata: {
        upi: `${handle.slice(0, 2)}***@${upiId.split('@')[1]}`,
      },
    };
  }

  return {
    amount,
    method,
    metadata: {
      note: 'Collect payment at delivery',
    },
  };
}

const requireAuth = authenticateUser;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

app.get('/api/debug', asyncHandler(async (req, res) => {
  try {
    const result = await all("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'products'");
    res.json(result);
  } catch(e) {
    res.json({ error: e.message });
  }
}));

const { _otpStore } = require('./otpHelper');
app.get('/api/debug/otp', (req, res) => {
  const email = req.query.email;
  if (email && _otpStore.has(email)) {
    res.json({ otp: _otpStore.get(email).otp });
  } else {
    res.json({ otps: Array.from(_otpStore.entries()) });
  }
});

// --- STOREFRONT PUBLIC SETTINGS ROUTE ---
app.get('/api/store/settings', asyncHandler(async (req, res) => {
  const settings = await all('SELECT * FROM settings');
  const settingsObj = {};
  settings.forEach(s => settingsObj[s.key] = s.value);
  res.json(settingsObj);
}));

app.get('/api/products', asyncHandler(async (req, res) => {
  const gender = parseGender(req.query.gender);

  if (gender === undefined) {
    res.status(400).json({ message: 'Gender filter must be either Men or Women.' });
    return;
  }

  const search = String(req.query.search || '').trim().toLowerCase();
  const where = [];
  const params = [];

  where.push('deleted_at IS NULL');

  if (gender) {
    where.push('gender = ?');
    params.push(gender);
  }

  if (search) {
    where.push('(LOWER(name) LIKE ? OR LOWER(category) LIKE ? OR LOWER(description) LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const products = await all(
    `SELECT id, name, price, image, description, category, gender, stock
     FROM products
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY id DESC`,
    params,
  );

  res.json(products);
}));

app.post('/api/products', asyncHandler(async (req, res) => {
  const { name, price, image, description, category, gender } = req.body;
  
  if (!name || !price || !image || !description || !category || !gender) {
    res.status(400).json({ message: 'All product fields are required.' });
    return;
  }

  const result = await run(
    'INSERT INTO products (name, price, image, description, category, gender) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
    [name, Number(price), image, description, category, gender]
  );

  res.status(201).json({ message: 'Product added successfully', id: result.lastID });
}));

app.get('/api/products/:id', asyncHandler(async (req, res) => {
  const productId = req.params.id;

  if (!productId || productId === 'undefined' || productId === 'null') {
    res.status(400).json({ message: 'Valid product id is required.' });
    return;
  }

  const product = await get(
    `SELECT id, name, price, image, description, category, gender, stock
     FROM products
     WHERE id = ? AND deleted_at IS NULL`,
    [productId],
  );

  if (!product) {
    res.status(404).json({ message: 'Product was not found.' });
    return;
  }

  const reviews = await all('SELECT id, username, rating, comment, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC', [productId]);
  res.json({ ...product, reviews });
}));
app.delete('/api/products/:id', requireAuth, asyncHandler(async (req, res) => {
  const productId = req.params.id;

  if (!productId || productId === 'undefined' || productId === 'null') {
    res.status(400).json({ message: 'Valid product id is required.' });
    return;
  }

  const result = await run('DELETE FROM products WHERE id = ?', [productId]);
  if (result.changes === 0) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }
  res.json({ message: 'Product deleted successfully.' });
}));

app.post('/api/reviews', requireAuth, asyncHandler(async (req, res) => {
  const { product_id, rating, comment } = req.body;
  const username = req.auth.username;

  if (!product_id || !rating || !comment) {
    res.status(400).json({ message: 'All fields are required.' });
    return;
  }

  await run(
    'INSERT INTO reviews (product_id, username, rating, comment) VALUES (?, ?, ?, ?)',
    [product_id, username, rating, comment]
  );

  res.status(201).json({ message: 'Review added successfully' });
}));

app.post('/api/register', registerLimiter, asyncHandler(async (req, res) => {
  const username = String(req.body.name || req.body.username || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!username) {
    res.status(400).json({ message: 'Full name is required to create an account.' });
    return;
  }

  if (!email || !email.includes('@')) {
    res.status(400).json({ message: 'Please enter a valid email address.' });
    return;
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({ message: 'Password must be at least 10 characters and include uppercase, lowercase, number, and special character.' });
    return;
  }

  const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);

  if (existingUser) {
    res.status(409).json({ message: 'An account already exists with this email. Please log in.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await run(
    'INSERT INTO users (username, email, password, plain_password) VALUES (?, ?, ?, ?) RETURNING id',
    [username, email, passwordHash, password]
  );
  
  let userId = result.lastID;
  if (!userId && result.rows && result.rows.length > 0) userId = result.rows[0].id;
  if (!userId && result.id) userId = result.id;
  
  const user = { id: userId, username, email };

  sendWelcomeEmail(email, username);

  const { accessToken, refreshToken } = await generateTokens(user, req);
  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    message: 'Account created successfully.',
    token: accessToken,
    user,
  });
}));

app.post('/api/login', loginLimiter, asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !email.includes('@')) {
    res.status(400).json({ message: 'Please enter the email address linked to your account.' });
    return;
  }

  if (!password) {
    res.status(400).json({ message: 'Please enter your password.' });
    return;
  }

  const user = await get('SELECT id, username, email, password FROM users WHERE email = ?', [email]);

  if (!user || !user.password) {
    res.status(401).json({ message: 'The email or password you entered is incorrect.' });
    return;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    res.status(401).json({ message: 'The email or password you entered is incorrect.' });
    return;
  }

  const rememberMe = req.body.rememberMe === true;
  const { accessToken, refreshToken } = await generateTokens(user, req, rememberMe);
  setAuthCookies(res, accessToken, refreshToken, rememberMe);

  res.json({
    message: 'Login successful.',
    token: accessToken,
    user: publicUser(user),
  });
}));

app.post('/api/auth/google', loginLimiter, asyncHandler(async (req, res) => {
  const { credential, rememberMe } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Google token is required.' });
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.VITE_GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const email = payload.email;
  const username = payload.name;
  
  if (!email) {
    return res.status(400).json({ message: 'Email not provided by Google.' });
  }

  let user = await get('SELECT id, username, email, password FROM users WHERE email = ?', [email]);
  
  if (!user) {
    // Register the user
    const randomPassword = require('crypto').randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 12);
    
    const result = await run(
      'INSERT INTO users (username, email, password, plain_password) VALUES (?, ?, ?, ?) RETURNING id',
      [username, email, passwordHash, 'GoogleAuthUser']
    );
    
    let userId = result.lastID;
    if (!userId && result.rows && result.rows.length > 0) userId = result.rows[0].id;
    if (!userId && result.id) userId = result.id;
    
    user = { id: userId, username, email };
    sendWelcomeEmail(email, username);
  }

  const isRememberMe = rememberMe === true;
  const { accessToken, refreshToken } = await generateTokens(user, req, isRememberMe);
  setAuthCookies(res, accessToken, refreshToken, isRememberMe);

  res.json({
    message: 'Google login successful.',
    token: accessToken,
    user: publicUser(user)
  });
}));

app.post('/api/auth/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token not found.' });
  }

  const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
  const storedToken = await get('SELECT * FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);

  if (!storedToken) {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Invalid refresh token.' });
  }

  if (storedToken.revoked_at || new Date(storedToken.expires_at) < new Date()) {
    if (storedToken.revoked_at) {
      // Token Theft Detected!
      await run('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE family_id = ?', [storedToken.family_id]);
      const user = await get('SELECT id, username, email FROM users WHERE id = ?', [storedToken.user_id]);
      if (user) {
        await run('INSERT INTO audit_logs (user_id, action, details, ip) VALUES (?, ?, ?, ?)', [
          user.id, 'TOKEN_THEFT_DETECTED', JSON.stringify({ family_id: storedToken.family_id, attempted_ip: req.ip }), req.ip || 'unknown'
        ]);
        sendTheftAlertEmail(user.email, user.username, req.ip || 'unknown', storedToken.device_name || 'Unknown', storedToken.country || 'Unknown');
      }
    }
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Session expired or compromised. Please log in again.' });
  }

  const user = await get('SELECT id, username, email, points, role FROM users WHERE id = ?', [storedToken.user_id]);
  if (!user) {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'User not found.' });
  }

  await run('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?', [storedToken.id]);
  
  const { accessToken: newAccess, refreshToken: newRefresh, rememberMe } = await generateTokens(user, req, storedToken.remember_me, storedToken.family_id);
  
  setAuthCookies(res, newAccess, newRefresh, rememberMe);

  res.json({ accessToken: newAccess, token: newAccess });
}));

app.post('/api/auth/logout', requireAuth, asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
    await run('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ?', [tokenHash]);
  }
  clearAuthCookies(res);
  res.json({ message: 'Logged out successfully.' });
}));

app.post('/api/auth/logout-all', requireAuth, asyncHandler(async (req, res) => {
  await run('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ?', [req.auth.id]);
  clearAuthCookies(res);
  res.json({ message: 'Logged out of all devices successfully.' });
}));
app.get('/api/auth/sessions', requireAuth, asyncHandler(async (req, res) => {
  const sessions = await all(`
    SELECT id, device_name, browser, os, ip, country, last_active, created_at, family_id 
    FROM refresh_tokens 
    WHERE user_id = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
    ORDER BY last_active DESC
  `, [req.auth.id]);
  
  // Identify the current session from the cookie
  let currentFamilyId = null;
  if (req.cookies.refreshToken) {
    const tokenHash = require('crypto').createHash('sha256').update(req.cookies.refreshToken).digest('hex');
    const currentSession = await get('SELECT family_id FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
    if (currentSession) currentFamilyId = currentSession.family_id;
  }

  const enhancedSessions = sessions.map(s => ({
    ...s,
    isCurrent: s.family_id === currentFamilyId
  }));

  res.json(enhancedSessions);
}));

app.delete('/api/auth/sessions/:id', requireAuth, asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const session = await get('SELECT * FROM refresh_tokens WHERE id = ? AND user_id = ?', [sessionId, req.auth.id]);
  
  if (!session) {
    res.status(404).json({ message: 'Session not found or already logged out.' });
    return;
  }

  await run('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE family_id = ?', [session.family_id]);
  res.json({ message: 'Device logged out successfully.' });
}));

app.get('/api/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.auth) });
}));

app.post('/api/users/change-password-init', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword } = req.body;
  const email = req.auth.email;

  if (!currentPassword) {
    res.status(400).json({ message: 'Current password is required.' });
    return;
  }

  const user = await get('SELECT password FROM users WHERE email = ?', [email]);
  if (!user || !user.password) {
    res.status(401).json({ message: 'No account found for this email.' });
    return;
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatches) {
    res.status(401).json({ message: 'Incorrect current password.' });
    return;
  }

  const otp = generateOtp();
  await storeOtp(email, otp);
  await sendOtpEmail(email, otp);

  res.json({ message: 'OTP sent to your email.' });
}));

app.post('/api/users/change-password-verify', requireAuth, asyncHandler(async (req, res) => {
  const { newPassword, otp } = req.body;
  const email = req.auth.email;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    return;
  }

  if (!otp) {
    res.status(400).json({ message: 'OTP is required.' });
    return;
  }

  const isValidOtp = await verifyOtp(email, otp);
  if (!isValidOtp) {
    res.status(400).json({ message: 'Invalid or expired OTP.' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await run('UPDATE users SET password = ?, plain_password = ? WHERE email = ?', [passwordHash, newPassword, email]);

  res.json({ message: 'Password changed successfully.' });
}));
// Request OTP after validating credentials
app.post('/api/auth/request-otp', asyncHandler(async (req, res, next) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !email.includes('@')) {
    res.status(400).json({ message: 'Please enter a valid email address.' });
    return;
  }

  if (!password) {
    res.status(400).json({ message: 'Please enter your password.' });
    return;
  }

  const user = await get('SELECT id, username, email, password FROM users WHERE email = ?', [email]);

  if (!user || !user.password) {
    return otpLimiter(req, res, () => {
      res.status(401).json({ message: 'Incorrect email or password.' });
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return otpLimiter(req, res, () => {
      res.status(401).json({ message: 'Incorrect email or password.' });
    });
  }

  if (!(await canRequestOtp(email))) {
    res.status(429).json({ message: 'Please wait at least 60 seconds before requesting another OTP.' });
    return;
  }

  const otp = generateOtp();
  await storeOtp(email, otp);
  sendOtpEmail(email, otp).catch(err => console.error('Background email failed:', err));
  res.json({ message: `Verification OTP sent to your email.` });
}));

// Verify OTP and issue JWT
app.post('/api/auth/verify-otp', asyncHandler(async (req, res, next) => {
  const { email: rawEmail, otp } = req.body;
  const email = normalizeEmail(rawEmail);

  if (!email || !email.includes('@') || !otp) {
    res.status(400).json({ message: 'Email and OTP are required.' });
    return;
  }

  const isValidOtp = await verifyOtp(email, otp);
  if (!isValidOtp) {
    return otpLimiter(req, res, () => {
      res.status(401).json({ message: 'Invalid or expired OTP. Maximum attempts may have been reached.' });
    });
  }

  const user = await get('SELECT id, username, email, points FROM users WHERE email = ?', [email]);
  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  const rememberMe = req.body.rememberMe === true;
  const { accessToken, refreshToken } = await generateTokens(user, req, rememberMe);
  setAuthCookies(res, accessToken, refreshToken, rememberMe);

  res.json({ message: 'Login successful.', token: accessToken, user: publicUser(user) });
}));

// Google Authentication
app.post('/api/auth/google', asyncHandler(async (req, res) => {
  const { token, access_token } = req.body;
  if (!token && !access_token) {
    res.status(400).json({ message: 'Google token is required.' });
    return;
  }

  let payload = null;

  try {
    if (access_token) {
      // Handle useGoogleLogin access token
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch user info');
      payload = await response.json();
    } else {
      // Handle standard GoogleLogin credential
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.VITE_GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }
  } catch (error) {
    res.status(401).json({ message: 'Invalid Google token.' });
    return;
  }
  
  if (!payload || !payload.email) {
    res.status(401).json({ message: 'Invalid Google token payload.' });
    return;
  }

  const email = normalizeEmail(payload.email);
  let user = await get('SELECT * FROM users WHERE email = ?', [email]);

  if (!user) {
    // Create new user if they don't exist
    const username = payload.name || email.split('@')[0];
    const result = await run(
      'INSERT INTO users (username, email, google_id, role, points) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [username, email, payload.sub, 'user', 500]
    );
    user = await get('SELECT * FROM users WHERE id = ?', [result.lastID || result.id]);
    if (!user) user = { id: result.lastID, username, email, points: 500, role: 'user' };
    
    // Send welcome email in background
    sendWelcomeEmail(email, username).catch(err => console.error('Welcome email failed:', err));
  } else if (!user.google_id) {
    // Link google ID to existing account
    await run('UPDATE users SET google_id = ? WHERE id = ?', [payload.sub, user.id]);
  }

  const { accessToken, refreshToken } = await generateTokens(user, req, true);
  setAuthCookies(res, accessToken, refreshToken, true);

  res.json({ message: 'Google login successful.', token: accessToken, user: publicUser(user) });
}));

// Forgot Password - Request OTP
app.post('/api/auth/forgot-password', forgotPasswordLimiter, asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email || !email.includes('@')) {
    res.status(400).json({ message: 'Please enter a valid email address.' });
    return;
  }

  const user = await get('SELECT id, email FROM users WHERE email = ?', [email]);
  if (!user) {
    res.status(404).json({ message: 'No account found for this email.' });
    return;
  }

  if (!(await canRequestOtp(email))) {
    res.status(429).json({ message: 'Please wait at least 60 seconds before requesting another OTP.' });
    return;
  }

  const otp = generateOtp();
  await storeOtp(email, otp);
  sendOtpEmail(email, otp).catch(err => console.error('Background email failed:', err));
  
  res.json({ message: `Password reset OTP sent to your email.` });
}));

// Forgot Password - Reset with OTP
app.post('/api/auth/reset-password', forgotPasswordLimiter, asyncHandler(async (req, res) => {
  const { email: rawEmail, otp, newPassword } = req.body;
  const email = normalizeEmail(rawEmail);

  if (!email || !otp || !newPassword) {
    res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    return;
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
  if (!passwordRegex.test(newPassword)) {
    res.status(400).json({ message: 'Password must be at least 10 characters and include uppercase, lowercase, number, and special character.' });
    return;
  }

  const isValidOtp = await verifyOtp(email, otp);
  if (!isValidOtp) {
    res.status(401).json({ message: 'Invalid or expired OTP.' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await run('UPDATE users SET password = ?, plain_password = ? WHERE email = ?', [passwordHash, newPassword, email]);

  // Send notification email
  sendPasswordResetEmail(email).catch(err => console.error('Failed to send reset email:', err));

  res.json({ message: 'Password has been reset successfully. You can now log in.' });
}));

app.delete('/api/users/me', requireAuth, asyncHandler(async (req, res) => {
  // Delete user's payments first (if any) since we don't have cascade delete
  await run('DELETE FROM payments WHERE user_id = ?', [req.auth.id]);
  
  // Delete the user
  const result = await run('DELETE FROM users WHERE id = ?', [req.auth.id]);
  
  if (result.changes === 0) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  res.json({ message: 'Account deleted successfully from database.' });
}));

app.get('/api/users', requireAuth, asyncHandler(async (req, res) => {
  const users = await all(
    'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC, id DESC',
  );

  res.json(users);
}));

app.get('/api/admin/stats', asyncHandler(async (req, res) => {
  const users = await all('SELECT id, username, email, points, created_at, plain_password FROM users ORDER BY created_at DESC');
  const products = await all('SELECT id, name, price, category, stock FROM products');
  const payments = await all('SELECT id, amount, status, method, reference, created_at, status_track FROM payments ORDER BY created_at DESC');
  const coupons = await all('SELECT * FROM coupons');
  
  res.json({
    users,
    products,
    payments,
    coupons,
    db_status: 'Connected to Supabase PostgreSQL'
  });
}));

// --- COUPON ROUTES ---
app.post('/api/coupons/validate', asyncHandler(async (req, res) => {
  const { code } = req.body;
  const coupon = await get('SELECT * FROM coupons WHERE code = ? AND active = 1', [code]);
  
  if (!coupon) {
    res.status(404).json({ message: 'Invalid or expired coupon code.' });
    return;
  }
  
  res.json(coupon);
}));

app.post('/api/admin/coupons', authenticateAdmin, requirePermission('manage_coupons'), asyncHandler(async (req, res) => {
  const { code, discount_type, discount_value } = req.body;
  await run('INSERT INTO coupons (code, discount_type, discount_value) VALUES (?, ?, ?)', [code, discount_type, discount_value]);
  res.status(201).json({ message: 'Coupon created successfully' });
}));

app.get('/api/admin/coupons', authenticateAdmin, requirePermission('manage_coupons'), asyncHandler(async (req, res) => {
  const coupons = await all('SELECT * FROM coupons WHERE deleted_at IS NULL ORDER BY created_at DESC');
  res.json(coupons);
}));
// --- ADMIN AUTH ROUTES ---
app.post('/api/admin/auth/login', loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const admin = await get('SELECT * FROM admin_users WHERE email = ?', [email]);
  if (!admin || admin.status !== 'active') {
    return res.status(401).json({ message: 'Invalid admin credentials or account inactive.' });
  }

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid admin credentials.' });
  }

  await run('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [admin.id]);
  await run('INSERT INTO audit_logs (action, details, ip) VALUES (?, ?, ?)', [
    'ADMIN_LOGIN', JSON.stringify({ admin_id: admin.id, email }), req.ip || 'unknown'
  ]);

  const token = jwt.sign({ id: admin.id, isAdmin: true }, JWT_SECRET, { expiresIn: '12h' });
  
  res.cookie('adminToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 12 * 60 * 60 * 1000 // 12 hours
  });

  const role = await get('SELECT name, permissions FROM roles WHERE id = ?', [admin.role_id]);

  res.json({
    message: 'Admin login successful.',
    admin: {
      id: admin.id,
      email: admin.email,
      role: role ? role.name : 'Unknown',
      permissions: role && role.permissions ? JSON.parse(role.permissions) : []
    },
    token
  });
}));

app.get('/api/admin/auth/me', authenticateAdmin, asyncHandler(async (req, res) => {
  res.json({
    admin: {
      id: req.admin.id,
      email: req.admin.email,
      role: req.admin.role_name,
      permissions: req.admin.permissions
    }
  });
}));

app.post('/api/admin/auth/logout', authenticateAdmin, asyncHandler(async (req, res) => {
  await run('INSERT INTO audit_logs (action, details, ip) VALUES (?, ?, ?)', [
    'ADMIN_LOGOUT', JSON.stringify({ admin_id: req.admin.id }), req.ip || 'unknown'
  ]);
  res.clearCookie('adminToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ message: 'Admin logged out successfully.' });
}));

// --- ADMIN DASHBOARD & ANALYTICS ---
app.get('/api/admin/analytics', authenticateAdmin, requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const totalRevenueRow = await get("SELECT SUM(amount) as total FROM payments WHERE status IN ('paid', 'pending') AND deleted_at IS NULL");
  const totalOrdersRow = await get("SELECT COUNT(*) as count FROM payments WHERE status IN ('paid', 'pending') AND deleted_at IS NULL");
  const totalCustomersRow = await get("SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL");
  const activeCartsRow = await get("SELECT COUNT(DISTINCT user_id) as count FROM refresh_tokens WHERE expires_at > CURRENT_TIMESTAMP");

  const payments = await all("SELECT amount, created_at FROM payments WHERE status IN ('paid', 'pending') AND deleted_at IS NULL");

  const daysMap = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Initialize last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    daysMap[dayNames[d.getDay()]] = 0;
  }

  payments.forEach(p => {
    const pDate = new Date(p.created_at + (p.created_at.includes('Z') ? '' : 'Z')); // Ensure UTC parsing
    if (pDate >= sevenDaysAgo) {
      const dayName = dayNames[pDate.getDay()];
      if (daysMap[dayName] !== undefined) {
        daysMap[dayName] += p.amount;
      }
    }
  });

  const salesGraph = Object.keys(daysMap).map(key => ({
    name: key,
    sales: daysMap[key]
  }));

  res.json({
    totalRevenue: totalRevenueRow?.total || 0,
    totalOrders: totalOrdersRow?.count || 0,
    totalCustomers: totalCustomersRow?.count || 0,
    activeCarts: activeCartsRow?.count || 0,
    salesGraph
  });
}));

app.get('/api/admin/audit-logs', authenticateAdmin, requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const logs = await all(`
    SELECT * 
    FROM audit_logs 
    ORDER BY created_at DESC 
    LIMIT ?
  `, [limit]);
  
  const admins = await all('SELECT id, email FROM admin_users');
  const adminMap = {};
  admins.forEach(a => adminMap[a.id] = a.email);

  const enrichedLogs = logs.map(log => {
    let admin_email = 'Unknown';
    try {
      const details = JSON.parse(log.details || '{}');
      if (details.admin_id && adminMap[details.admin_id]) {
        admin_email = adminMap[details.admin_id];
      }
    } catch(e) {}
    return { ...log, admin_email };
  });

  res.json(enrichedLogs);
}));

// --- ORDER TRACKING ROUTES ---
app.get('/api/orders/me', requireAuth, asyncHandler(async (req, res) => {
  const orders = await all('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [req.auth.id]);
  res.json(orders);
}));

// --- ADMIN ORDER ROUTES ---
app.get('/api/admin/orders', authenticateAdmin, requirePermission('manage_orders'), asyncHandler(async (req, res) => {
  const orders = await all(`
    SELECT p.*, u.username as user_name, u.email as user_email
    FROM payments p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.deleted_at IS NULL
    ORDER BY p.created_at DESC
  `);
  res.json(orders);
}));

app.patch('/api/admin/orders/:id', authenticateAdmin, requirePermission('manage_orders'), asyncHandler(async (req, res) => {
  const { status_track } = req.body;
  await run('UPDATE payments SET status_track = ? WHERE id = ?', [status_track, req.params.id]);
  
  // Send status update email
  const order = await get('SELECT p.reference, u.email FROM payments p JOIN users u ON p.user_id = u.id WHERE p.id = ?', [req.params.id]);
  if (order && order.email) {
    await sendOrderStatusEmail(order.email, order.reference, status_track);
  }
  
  res.json({ message: 'Order status updated' });
}));

// --- ADMIN CUSTOMER ROUTES ---
app.get('/api/admin/users', authenticateAdmin, requirePermission('manage_users'), asyncHandler(async (req, res) => {
  const users = await all(`
    SELECT u.id, u.username as name, u.email, u.created_at, u.deleted_at,
           COUNT(p.id) as total_orders,
           SUM(p.amount) as ltv
    FROM users u
    LEFT JOIN payments p ON u.id = p.user_id AND p.status IN ('paid', 'pending') AND p.deleted_at IS NULL
    WHERE u.deleted_at IS NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
  res.json(users);
}));

app.delete('/api/admin/users/:id', authenticateAdmin, requirePermission('manage_users'), asyncHandler(async (req, res) => {
  await run('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
  res.json({ message: 'User deleted successfully' });
}));

// --- ADMIN SETTINGS & CMS ROUTES ---
app.get('/api/admin/settings', authenticateAdmin, requirePermission('manage_settings'), asyncHandler(async (req, res) => {
  const settings = await all('SELECT * FROM settings');
  const settingsObj = {};
  settings.forEach(s => settingsObj[s.key] = s.value);
  res.json(settingsObj);
}));

app.post('/api/admin/settings', authenticateAdmin, requirePermission('manage_settings'), asyncHandler(async (req, res) => {
  const settings = req.body; // e.g. { hero_banner_text: "Summer!" }
  
  for (const [key, value] of Object.entries(settings)) {
    // Upsert logic for SQLite
    await run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
  }
  res.json({ message: 'Settings updated successfully' });
}));

// --- ADMIN REVIEW ROUTES ---
app.get('/api/admin/reviews', authenticateAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  const reviews = await all(`
    SELECT r.*, p.name as product_name
    FROM reviews r
    LEFT JOIN products p ON r.product_id = p.id
    ORDER BY r.created_at DESC
  `);
  res.json(reviews);
}));

app.delete('/api/admin/reviews/:id', authenticateAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  await run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  res.json({ message: 'Review deleted successfully' });
}));

app.delete('/api/admin/coupons/:id', authenticateAdmin, requirePermission('manage_coupons'), asyncHandler(async (req, res) => {
  await run('UPDATE coupons SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
  res.json({ message: 'Coupon deleted successfully' });
}));

// --- ADMIN PRODUCT ROUTES ---
app.get('/api/admin/products', authenticateAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  const products = await all('SELECT * FROM products WHERE deleted_at IS NULL ORDER BY id DESC');
  res.json(products);
}));

app.patch('/api/admin/products/:id', authenticateAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  const { stock, price } = req.body;
  if (stock !== undefined && price !== undefined) {
    await run('UPDATE products SET stock = ?, price = ? WHERE id = ?', [stock, price, req.params.id]);
  } else if (stock !== undefined) {
    await run('UPDATE products SET stock = ? WHERE id = ?', [stock, req.params.id]);
  } else if (price !== undefined) {
    await run('UPDATE products SET price = ? WHERE id = ?', [price, req.params.id]);
  }
  res.json({ message: 'Product updated successfully' });
}));

app.post('/api/admin/products', authenticateAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  const { name, price, image, description, category, gender, stock } = req.body;
  
  if (!name || !price || !image || !description || !category || !gender) {
    res.status(400).json({ message: 'All required fields must be provided.' });
    return;
  }

  const stockVal = stock !== undefined ? parseInt(stock) : 10;

  await run(
    'INSERT INTO products (name, price, image, description, category, gender, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, parseInt(price), image, description, category, gender, stockVal]
  );
  
  res.status(201).json({ message: 'Product created successfully' });
}));


app.delete('/api/admin/products/:id', authenticateAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  await run('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
  res.json({ message: 'Product deleted successfully' });
}));

// --- ADMIN RBAC ROUTES ---
app.get('/api/admin/roles', authenticateAdmin, requirePermission('manage_settings'), asyncHandler(async (req, res) => {
  const roles = await all('SELECT * FROM roles ORDER BY name');
  res.json(roles);
}));

app.get('/api/admin/admin-users', authenticateAdmin, requirePermission('manage_settings'), asyncHandler(async (req, res) => {
  const users = await all(`
    SELECT a.id, a.email, a.status, a.last_login, a.created_at, r.name as role_name
    FROM admin_users a
    JOIN roles r ON a.role_id = r.id
    ORDER BY a.created_at DESC
  `);
  res.json(users);
}));

app.post('/api/admin/admin-users', authenticateAdmin, requirePermission('all_permissions'), asyncHandler(async (req, res) => {
  const { email, password, role_id } = req.body;
  if (!email || !password || !role_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const existing = await get('SELECT id FROM admin_users WHERE email = ?', [email]);
  if (existing) {
    return res.status(400).json({ message: 'Admin user already exists with this email' });
  }

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  await run('INSERT INTO admin_users (id, email, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?)', [id, email, hash, role_id, 'active']);

  // Log action
  await run('INSERT INTO audit_logs (id, admin_id, admin_email, action, entity, entity_id) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), req.admin.id, req.admin.email, 'CREATED_ADMIN', 'admin_users', id]
  );

  res.status(201).json({ message: 'Admin user created successfully' });
}));


// --- RAZORPAY ROUTES ---
app.post('/api/payments/razorpay-order', requireAuth, asyncHandler(async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (idempotencyKey) {
    const cached = await get('SELECT response_body FROM idempotency_keys WHERE key = ? AND user_id = ? AND endpoint = ?', [idempotencyKey, req.auth.id, '/api/payments/razorpay-order']);
    if (cached) {
      return res.json(JSON.parse(cached.response_body));
    }
  }

  const amount = parseAmount(req.body.amount);
  
  if (!amount || amount <= 0) {
    res.status(400).json({ message: 'Payment amount must be greater than zero.' });
    return;
  }

  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YOUR_KEY_ID')) {
    // Return a mock order if no keys configured
    const mockOrder = { id: `order_mock_${Date.now()}`, amount: amount * 100, currency: 'INR' };
    if (idempotencyKey) {
      await run('INSERT INTO idempotency_keys (key, user_id, endpoint, response_body) VALUES (?, ?, ?, ?)', [idempotencyKey, req.auth.id, '/api/payments/razorpay-order', JSON.stringify(mockOrder)]);
    }
    res.json(mockOrder);
    return;
  }

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: `rcpt_${Date.now()}`
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    if (idempotencyKey) {
      await run('INSERT INTO idempotency_keys (key, user_id, endpoint, response_body) VALUES (?, ?, ?, ?)', [idempotencyKey, req.auth.id, '/api/payments/razorpay-order', JSON.stringify(order)]);
    }
    res.json(order);
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ message: 'Failed to create Razorpay order.' });
  }
}));

app.post('/api/payments', requireAuth, asyncHandler(async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (idempotencyKey) {
    const cached = await get('SELECT response_body FROM idempotency_keys WHERE key = ? AND user_id = ? AND endpoint = ?', [idempotencyKey, req.auth.id, '/api/payments']);
    if (cached) {
      return res.status(201).json(JSON.parse(cached.response_body));
    }
  }

  const method = String(req.body.method || '').trim().toLowerCase();

  // Handle Card or UPI via Razorpay
  if (method === 'card' || method === 'upi') {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, metadata } = req.body;
    
    if (process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.includes('YOUR_KEY_SECRET')) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
         res.status(400).json({ message: 'Payment verification failed. Missing signature parameters.' });
         return;
      }
      const generatedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                 .update(razorpay_order_id + "|" + razorpay_payment_id)
                                 .digest('hex');
                                 
      if (generatedSignature !== razorpay_signature) {
        res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
        return;
      }
    }
    
    const paymentId = razorpay_payment_id || `pay_${randomUUID().replace(/-/g, '').slice(0, 18)}`;
    const reference = razorpay_order_id || `AURA-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    await run(
      `INSERT INTO payments (id, user_id, amount, method, status, reference, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paymentId, req.auth.id, amount, method, 'paid', reference, JSON.stringify(metadata || {})]
    );

    await run('INSERT INTO audit_logs (action, details, ip) VALUES (?, ?, ?)', [
      'ORDER_PLACED', JSON.stringify({ user_id: req.auth.id, payment_id: paymentId, amount, method: 'online' }), req.ip || 'unknown'
    ]);

    // Update user points
    const pointsEarned = Math.floor(amount * 0.1);
    await run('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', [pointsEarned, req.auth.id]);

    if (metadata && metadata.items && Array.isArray(metadata.items)) {
      for (const item of metadata.items) {
        if (item.id && item.quantity) {
          await run('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [item.quantity, item.id]);
        }
      }
    }

    // Send order confirmation email
    await sendOrderEmail(req.auth.email, reference, amount, metadata?.items || []);

    const responsePayload = {
      payment: {
        id: paymentId,
        amount: amount,
        method: method,
        status: 'paid',
        reference,
        metadata: metadata || {},
      },
    };

    if (idempotencyKey) {
      await run('INSERT INTO idempotency_keys (key, user_id, endpoint, response_body) VALUES (?, ?, ?, ?)', [idempotencyKey, req.auth.id, '/api/payments', JSON.stringify(responsePayload)]);
    }

    res.status(201).json(responsePayload);
    return;
  }

  // Handle Cash on Delivery (COD) payments
  if (method === 'cod') {
    const normalized = normalizePaymentPayload(req.body);
    if (normalized.error) {
      res.status(400).json({ message: normalized.error });
      return;
    }

    const { amount, metadata } = normalized;
    const paymentId = `pay_${randomUUID().replace(/-/g, '').slice(0, 18)}`;
    const reference = `AURA-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const status = 'pending';

    await run(
      `INSERT INTO payments (id, user_id, amount, method, status, reference, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paymentId, req.auth.id, amount, method, status, reference, JSON.stringify(metadata || {})]
    );

    await run('INSERT INTO audit_logs (action, details, ip) VALUES (?, ?, ?)', [
      'ORDER_PLACED', JSON.stringify({ user_id: req.auth.id, payment_id: paymentId, amount, method: 'cod' }), req.ip || 'unknown'
    ]);

    // Update user points
    const pointsEarned = Math.floor(amount * 0.1);
    await run('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', [pointsEarned, req.auth.id]);

    if (metadata && metadata.items && Array.isArray(metadata.items)) {
      for (const item of metadata.items) {
        if (item.id && item.quantity) {
          await run('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [item.quantity, item.id]);
        }
      }
    }

    // Send order confirmation email
    await sendOrderEmail(req.auth.email, reference, amount, metadata?.items || []);

    const responsePayload = {
      payment: {
        id: paymentId,
        amount,
        method,
        status,
        reference,
        metadata: metadata || {},
      },
    };

    if (idempotencyKey) {
      await run('INSERT INTO idempotency_keys (key, user_id, endpoint, response_body) VALUES (?, ?, ?, ?)', [idempotencyKey, req.auth.id, '/api/payments', JSON.stringify(responsePayload)]);
    }

    res.status(201).json(responsePayload);
    return;
  }
  
  res.status(400).json({ message: 'Unsupported payment method. Use COD, UPI, or Card.' });
}));

app.post('/api/auth/google', asyncHandler(async (req, res) => {
  const googleId = String(req.body.googleId || '').trim();
  const username = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email);

  if (!googleId) {
    res.status(400).json({ message: 'Google account id is required.' });
    return;
  }

  if (!username) {
    res.status(400).json({ message: 'Google profile name is required.' });
    return;
  }

  if (!email || !email.includes('@')) {
    res.status(400).json({ message: 'Google profile email must be valid.' });
    return;
  }

  let user = await get(
    'SELECT id, username, email, google_id, points FROM users WHERE google_id = ? OR email = ?',
    [googleId, email],
  );

  if (user) {
    if (!user.google_id) {
      await run('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
    }
  } else {
    const result = await run(
      'INSERT INTO users (username, email, google_id) VALUES (?, ?, ?) RETURNING id',
      [username, email, googleId],
    );
    user = { id: result.lastID, username, email, points: 500 };
  }

  res.json({
    message: 'Login successful.',
    token: signToken(user),
    user: publicUser(user),
  });
}));

// Fallback for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API Route ${req.method} ${req.originalUrl} was not found.` });
});

// Simple health check for root URL
app.get('/', (req, res) => {
  res.json({ message: 'Aura Store API is running perfectly!', status: 'live' });
});

// Serve frontend in production (only if it exists)
const frontendDist = path.join(__dirname, '../client/dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

app.use(errorHandler);

async function start() {
  try {
    await initDatabase();

    const server = app.listen(PORT, () => {
      console.log(`API server running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT in server/.env.`);
        process.exit(1);
      }

      console.error('Server failed to start:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
