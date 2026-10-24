/**
 * Games API Routes
 * Public endpoints for game listing, searching, filtering, and detail fetching.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Game = require('../models/Game');

/**
 * @route   GET /api/games
 * @desc    Get all games with category filtering, search, and sorting
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, search, sort, featured, popular, isNew, limit } = req.query;

    let query = {};

    // Filter by Category
    if (category && category.toLowerCase() !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Filter by Featured / Popular / New flags
    if (featured === 'true') query.isFeatured = true;
    if (popular === 'true') query.isPopular = true;
    if (isNew === 'true') query.isNew = true;

    // Search query: matching title, category, description or tags
    if (search && search.trim() !== '') {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { playCount: -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1, ratingCount: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'title') {
      sortOption = { title: 1 };
    }

    const maxLimit = parseInt(limit, 10) || 100;
    const games = await Game.find(query).sort(sortOption).limit(maxLimit);

    res.json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/games/:idOrSlug
 * @desc    Get single game by Mongo ID or Slug, automatically increments playCount
 * @access  Public
 */
router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    let game;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      game = await Game.findByIdAndUpdate(
        idOrSlug,
        { $inc: { playCount: 1 } },
        { new: true }
      );
    } else {
      game = await Game.findOneAndUpdate(
        { slug: idOrSlug.toLowerCase() },
        { $inc: { playCount: 1 } },
        { new: true }
      );
    }

    if (!game) {
      return res.status(404).json({
        success: false,
        message: `Game not found with identifier: ${idOrSlug}`
      });
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/games/:id/play
 * @desc    Explicitly increment game play counter
 * @access  Public
 */
router.post('/:id/play', async (req, res, next) => {
  try {
    const { id } = req.params;

    let filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id.toLowerCase() };
    const game = await Game.findOneAndUpdate(filter, { $inc: { playCount: 1 } }, { new: true });

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    res.json({
      success: true,
      playCount: game.playCount
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
