/**
 * Scores API Routes
 * Endpoints for recording and retrieving player high scores and leaderboards.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Score = require('../models/Score');
const Game = require('../models/Game');
const { validateScore } = require('../middleware/validation');

/**
 * @route   POST /api/scores
 * @desc    Submit a new high-score for a game
 * @access  Public
 */
router.post('/', validateScore, async (req, res, next) => {
  try {
    const { playerName, score, gameId } = req.body;

    // Verify referenced game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found for the provided gameId'
      });
    }

    const newScore = await Score.create({
      playerName: playerName.trim(),
      score: parseInt(score, 10),
      gameId: game._id,
      gameTitle: game.title
    });

    res.status(201).json({
      success: true,
      message: 'Score recorded successfully!',
      data: newScore
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/scores/top
 * @desc    Get top overall scores across all games
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const scores = await Score.find()
      .populate('gameId', 'title category slug thumbnailUrl')
      .sort({ score: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: scores.length,
      data: scores
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/scores/:gameId
 * @desc    Get top 10 high-scores for a specific game (by Mongo ID or Slug)
 * @access  Public
 */
router.get('/:gameId', async (req, res, next) => {
  try {
    const { gameId } = req.params;

    let targetGameId = gameId;
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      const game = await Game.findOne({ slug: gameId.toLowerCase() });
      if (!game) {
        return res.status(404).json({ success: false, message: 'Game not found' });
      }
      targetGameId = game._id;
    }

    const scores = await Score.find({ gameId: targetGameId })
      .sort({ score: -1 })
      .limit(10);

    res.json({
      success: true,
      count: scores.length,
      data: scores
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
