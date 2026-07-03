const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { run, get } = require('./database');

function generateOtp() {
  const otp = crypto.randomInt(100000, 1000000);
  return String(otp);
}

async function sendOtpEmail(toEmail, otp) {
  console.log(`✅ OTP for ${toEmail}: ${otp}`);
  
  try {
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
          email: process.env.GMAIL_USER || 'auraastore2@gmail.com' // Ensure this email is a verified sender in Brevo
        },
        to: [{ email: toEmail }],
        subject: 'AURA STORE - OTP Verification',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #e11b23; text-align: center;">AURA STORE</h2>
            <p>Hello,</p>
            <p>Your One-Time Password (OTP) for AURA STORE is:</p>
            <h1 style="text-align: center; font-size: 36px; letter-spacing: 5px; color: #333; background: #f5f5f5; padding: 15px; border-radius: 5px;">${otp}</h1>
            <p>This OTP is valid for <strong>5 minutes</strong>.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brevo API Error:', errorText);
    } else {
      console.log(`✅ Email sent via Brevo to ${toEmail}`);
    }
  } catch (err) {
    console.error('Failed to send OTP via Brevo:', err);
  }
}

async function canRequestOtp(email) {
  const record = await get(
    "SELECT created_at FROM otp WHERE email = ? ORDER BY created_at DESC LIMIT 1",
    [email]
  );
  if (!record) return true;

  // Convert UTC string to Date object
  const lastRequestTime = new Date(record.created_at).getTime();
  const now = Date.now();
  
  if (now - lastRequestTime < 60 * 1000) {
    return false; // Less than 60 seconds ago
  }
  return true;
}

async function storeOtp(email, otp, ttlMs = 5 * 60 * 1000) {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const otpHash = await bcrypt.hash(otp, 10);
  
  await run(
    'INSERT INTO otp (email, otp_hash, expires_at) VALUES (?, ?, ?)',
    [email, otpHash, expiresAt]
  );
}

async function verifyOtp(email, otp) {
  const record = await get(
    'SELECT * FROM otp WHERE email = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
    [email]
  );

  if (!record) return false;

  if (new Date(record.expires_at) < new Date()) {
    return false;
  }

  if (record.attempts >= 3) {
    return false; // Max attempts reached
  }

  const isValid = await bcrypt.compare(String(otp).trim(), record.otp_hash);

  if (!isValid) {
    await run('UPDATE otp SET attempts = attempts + 1 WHERE id = ?', [record.id]);
    return false;
  }

  await run('UPDATE otp SET used = TRUE WHERE id = ?', [record.id]);
  return true;
}

module.exports = {
  generateOtp,
  sendOtpEmail,
  storeOtp,
  verifyOtp,
  canRequestOtp
};
