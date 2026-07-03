const rateLimit = require('express-rate-limit');

// General rate limiter for all API requests
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login Limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register Limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many accounts created from this IP, please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Forgot Password Limiter
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { message: 'Too many password reset requests, please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP Limiter
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many OTP requests, please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { 
  globalLimiter, 
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  otpLimiter
};
