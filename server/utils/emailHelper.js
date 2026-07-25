async function sendReturnEmail(toEmail, orderId, productName, reason) {
  console.log(`✅ Return Requested for ${toEmail}: Order ${orderId}, Product ${productName}`);
  
  if (!process.env.BREVO_API_KEY) {
    console.log("No Brevo API key found. Skipping actual email send.");
    return;
  }

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
          email: process.env.GMAIL_USER || 'auraastore2@gmail.com'
        },
        to: [{ email: toEmail }],
        subject: 'AURA STORE - Return Request Received',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #e11b23; text-align: center;">AURA STORE</h2>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; text-align: center; margin-top: 20px;">
              <h3 style="margin: 0; color: #333;">Return Request Received</h3>
              <p style="color: #666; margin-top: 10px;">We have received your return request for <b>${productName}</b> (Order ID: ${orderId}).</p>
              <p style="color: #666;">Reason: <i>${reason}</i></p>
              <p style="color: #666; margin-top: 20px;">Our support team will review your request and get back to you within 24-48 hours with the next steps.</p>
            </div>
            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
              If you didn't request this return, please contact us immediately.
            </p>
          </div>
        `
      })
    });
    
    if (!response.ok) {
      const errData = await response.text();
      console.error('Failed to send return email:', errData);
    }
  } catch (error) {
    console.error('Error sending return email:', error);
  }
}

module.exports = {
  sendReturnEmail
};
