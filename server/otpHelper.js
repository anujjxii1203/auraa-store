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
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: 'service_9o4s1gl',
        template_id: 'template_m30sd3d',
        user_id: 'AFvo6dICdofkL_HNn',
        accessToken: 'tFnWoarudO_TSroaXv7vb',
        template_params: {
          email: toEmail,
          passcode: otp
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EmailJS Error:', errorText);
    } else {
      console.log(`✅ Email sent via EmailJS to ${toEmail}`);
    }
  } catch (err) {
    console.error('Failed to send OTP via EmailJS:', err);
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
