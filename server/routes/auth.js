const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redisClient = require('../config/redis');

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

    // Clear user cache key to keep consistency
    try {
      const normalizedEmail = email.toLowerCase().trim();
      await redisClient.del(`user:email:${normalizedEmail}`);
    } catch (redisErr) {
      console.error('Redis DEL user failed:', redisErr.message);
    }

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
    const normalizedEmail = email.toLowerCase().trim();
    const cacheKey = `user:email:${normalizedEmail}`;
    let cachedUserStr = null;

    try {
      cachedUserStr = await redisClient.get(cacheKey);
    } catch (redisErr) {
      console.error('Redis GET user failed:', redisErr.message);
    }

    let user = null;
    if (cachedUserStr) {
      try {
        user = JSON.parse(cachedUserStr);
      } catch (parseErr) {
        console.error('Error parsing cached user:', parseErr);
      }
    }

    if (!user) {
      // Check if user exists in MongoDB
      const dbUser = await User.findOne({ email: normalizedEmail }).select('_id email password');
      if (!dbUser) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      user = {
        id: dbUser.id || dbUser._id.toString(),
        email: dbUser.email,
        password: dbUser.password
      };

      // Cache the user credential details in Redis (expires in 24 hours)
      try {
        await redisClient.set(cacheKey, JSON.stringify(user), { EX: 86400 });
      } catch (redisErr) {
        console.error('Redis SET user failed:', redisErr.message);
      }
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
