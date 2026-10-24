/**
 * Contact API Routes
 * Handles user contact form submissions with rate limiting and database persistence.
 */

const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { contactLimiter } = require('../middleware/rateLimiter');
const { validateContact } = require('../middleware/validation');

/**
 * @route   POST /api/contact
 * @desc    Submit user contact message / developer inquiry
 * @access  Public (Rate limited)
 */
router.post('/', contactLimiter, validateContact, async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    const savedMessage = await ContactMessage.create({
      name,
      email,
      subject: subject || 'General',
      message
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received. Our team will review it shortly.',
      data: {
        id: savedMessage._id,
        createdAt: savedMessage.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
