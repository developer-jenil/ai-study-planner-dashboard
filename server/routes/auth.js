const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    // Check for existing user
    let user = await User.findOne({ email }).select('_id');
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      email,
      password
    });

    // Create salt & hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create JWT token
    const payload = { id: user.id };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, // Token valid for 7 days
      (err, token) => {
        if (err) throw err;
        return res.status(201).json({
          token,
          user: {
            id: user.id,
            email: user.email
          }
        });
      }
    );
  } catch (err) {
    console.error(`Registration error: ${err.message}`);
    return res.status(500).json({ msg: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email }).select('_id email password');
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = { id: user.id };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        return res.json({
          token,
          user: {
            id: user.id,
            email: user.email
          }
        });
      }
    );
  } catch (err) {
    console.error(`Login error: ${err.message}`);
    return res.status(500).json({ msg: 'Server error during login' });
  }
});

module.exports = router;
