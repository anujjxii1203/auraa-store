const express = require('express');
const { Webhook } = require('svix');
const { run } = require('../database');

const router = express.Router();

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const payload = req.body;
  const headers = req.headers;

  const svix_id = headers['svix-id'];
  const svix_timestamp = headers['svix-timestamp'];
  const svix_signature = headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Error occured -- no svix headers' });
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err.message);
    return res.status(400).json({ error: 'Error verifying webhook' });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const email = evt.data.email_addresses[0]?.email_address;
    const username = evt.data.first_name || evt.data.username || 'User';

    try {
      await run('INSERT INTO users (google_id, username, email) VALUES (?, ?, ?)', [id, username, email]);
      console.log(`User ${id} synced to local DB`);
    } catch (dbErr) {
      console.error('Failed to sync user to local DB:', dbErr);
    }
  }

  if (eventType === 'user.deleted') {
    try {
      await run('DELETE FROM users WHERE google_id = ?', [id]);
      console.log(`User ${id} deleted from local DB`);
    } catch (dbErr) {
      console.error('Failed to delete user from local DB:', dbErr);
    }
  }

  res.status(200).json({ success: true });
});

module.exports = router;
