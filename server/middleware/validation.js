/**
 * Input Validation & Sanitization Middleware
 * Uses express-validator to enforce data integrity and prevent XSS/injection attacks.
 */

const { body, validationResult } = require('express-validator');

// Helper to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

// Contact form validation rules
const validateContact = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 80 }).withMessage('Name cannot exceed 80 characters')
    .escape(),
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('subject')
    .optional()
    .trim()
    .escape(),
  body('message')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ min: 5, max: 3000 }).withMessage('Message must be between 5 and 3000 characters')
    .escape(),
  handleValidationErrors
];

// Score submission validation rules
const validateScore = [
  body('playerName')
    .trim()
    .notEmpty().withMessage('Player name is required')
    .isLength({ min: 2, max: 20 }).withMessage('Player name must be between 2 and 20 characters')
    .escape(),
  body('score')
    .notEmpty().withMessage('Score is required')
    .isInt({ min: 0, max: 99999999 }).withMessage('Score must be a positive integer'),
  body('gameId')
    .notEmpty().withMessage('Game ID is required')
    .isMongoId().withMessage('Invalid Game ID format'),
  handleValidationErrors
];

// Admin login validation rules
const validateAdminLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .escape(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Game creation & update validation rules
const validateGame = [
  body('title')
    .trim()
    .notEmpty().withMessage('Game title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 300 }).withMessage('Description cannot exceed 300 characters'),
  body('embedUrl')
    .trim()
    .notEmpty().withMessage('Playable embed URL is required'),
  handleValidationErrors
];

module.exports = {
  validateContact,
  validateScore,
  validateAdminLogin,
  validateGame
};
