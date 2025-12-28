const express = require('express');
const auth = require('../middleware/auth');
const { getClient } = require('../config/supabase');

const router = express.Router();
const getToken = (req) => req.headers.authorization;

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const supabase = getClient(getToken(req));
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get Me Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
