// Auth routes: register and login

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mockDb = require('../config/mockDb');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    // Use mock data directly
    const existing = Object.values(mockDb.users).find(u => u.email === email);
    if (existing) return res.status(400).json({ message: 'User exists' });
    
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const id = mockDb.nextId.users++;
    
    mockDb.users[id] = { _id: String(id), name, email, password: hashed, createdAt: new Date() };
    const token = jwt.sign({ id: String(id) }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return res.json({ token, user: { id: String(id), name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    // Use mock data directly
    const user = Object.values(mockDb.users).find(u => u.email === email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
