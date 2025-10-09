const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Customer Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new customer user
    const user = new User({
      name,
      email,
      password, // Will be hashed by the pre-save middleware in User model
      role: 'customer'
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Customer registered successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Customer Login (for NextAuth credentials provider)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse
    });

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get customer profile
router.get('/profile/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create or update user (for OAuth providers)
router.post('/oauth', async (req, res) => {
  try {
    const { name, email, image, provider } = req.body;

    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user
      user.name = name;
      user.image = image;
      await user.save();
    } else {
      // Create new user
      user = new User({
        name,
        email,
        image,
        role: 'customer',
        provider: provider || 'google'
      });
      await user.save();
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'OAuth user processed successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('OAuth user processing error:', error);
    res.status(500).json({ error: 'OAuth processing failed' });
  }
});

module.exports = router;
