// routes/googleAuth.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/Users'); // make sure this is imported
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'Yooo-JWT-Token';

// Step 1: Redirect to Google for authentication
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Step 2: Google callback route
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login` }),
  async (req, res) => {
    try {
      // req.user is set by passport (from config/passport.js)
      const user = req.user;

      if (!user) {
        return res.redirect(`${FRONTEND_URL}/login?error=NoUserFound`);
      }

      // Generate JWT token manually here
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

      // Redirect frontend with token
      res.redirect(`${FRONTEND_URL}/google-success?token=${token}&role=${user.role}`);
    } catch (error) {
      console.error('Error generating token for Google user:', error);
      res.redirect(`${FRONTEND_URL}/login?error=TokenGenerationFailed`);
    }
  }
);

module.exports = router;
