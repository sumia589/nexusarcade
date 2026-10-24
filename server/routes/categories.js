/**
 * Categories API Routes
 * Public endpoints for listing game categories with aggregate game counts.
 */

const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Game = require('../models/Game');

/**
 * @route   GET /api/categories
 * @desc    Get all categories with active game counts
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    // Calculate game count per category via aggregation
    const counts = await Game.aggregate([
      { $group: { _id: { $toLower: '$category' }, count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach(c => {
      countMap[c._id] = c.count;
    });

    const categoriesWithCount = categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description,
      gameCount: countMap[cat.name.toLowerCase()] || 0
    }));

    res.json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
