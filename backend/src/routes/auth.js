const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Routes are now handled by Supabase Auth on frontend
// We can add profile management routes here if needed in future

router.get('/me', async (req, res) => {
  // This route is protected by auth middleware
  // We can fetch additional user details from public.users if needed
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

module.exports = router;
