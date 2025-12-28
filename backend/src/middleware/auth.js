// Auth middleware: verify JWT in Authorization: Bearer <token>

const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await require('../config/supabase').supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid token');
    }

    console.log('AUTH MIDDLEWARE - User from Supabase:', user);
    console.log('AUTH MIDDLEWARE - User ID:', user.id);

    req.user = { id: user.id };
    next();
  } catch (err) {
    console.error('Auth Error:', err.message);
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};
