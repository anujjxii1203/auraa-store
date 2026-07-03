const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { run } = require('../database');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_change_me';
const ACCESS_TOKEN_EXPIRY = '15m';

const generateTokens = async (user, req, rememberMe = false, existingFamilyId = null) => {
  const accessToken = jwt.sign(
    { sub: String(user.id), id: user.id, email: user.email, username: user.username, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const familyId = existingFamilyId || crypto.randomUUID();
  
  // Expiry logic based on rememberMe
  const days = rememberMe ? 30 : 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  let ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (ip === '::1' || ip === '127.0.0.1') ip = '8.8.8.8'; // Default to a routable IP for local testing geoip

  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Parse User Agent
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser().name || 'Unknown Browser';
  const os = parser.getOS().name || 'Unknown OS';
  const deviceName = parser.getDevice().model || parser.getDevice().vendor || 'Desktop/Unknown';
  
  // Parse Location
  const geo = geoip.lookup(ip);
  const country = geo ? `${geo.city ? geo.city + ', ' : ''}${geo.country}` : 'Unknown Location';

  await run(
    `INSERT INTO refresh_tokens 
    (user_id, token_hash, family_id, device_name, browser, os, ip, country, user_agent, remember_me, expires_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, tokenHash, familyId, deviceName, browser, os, ip, country, userAgent, rememberMe ? 1 : 0, expiresAt]
  );

  return { accessToken, refreshToken, familyId, rememberMe };
};

const setAuthCookies = (res, accessToken, refreshToken, rememberMe = false) => {
  const days = rememberMe ? 30 : 7;
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
    path: '/api/auth/refresh',
    maxAge: days * 24 * 60 * 60 * 1000 // 7 or 30 days
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
};

module.exports = { generateTokens, setAuthCookies, clearAuthCookies };
