// Auth middleware: verify JWT in Authorization: Bearer <token>

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mockDb = require('../config/mockDb');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Try to find user in MongoDB first, if it fails use mock data
    let user = null;
    try {
      user = await User.findById(payload.id).select('-password');
    } catch (err) {
      // MongoDB failed, try mock data
      user = mockDb.users[payload.id];
      if (user) {
        user = { _id: user._id, name: user.name, email: user.email };
      }
    }
    
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};
