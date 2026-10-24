/**
 * Score Model
 * Records player high-scores for leaderboard rankings.
 */

const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    playerName: {
      type: String,
      required: [true, 'Player name is required'],
      trim: true,
      maxlength: [20, 'Player name cannot exceed 20 characters']
    },
    score: {
      type: Number,
      required: [true, 'Score value is required'],
      min: [0, 'Score cannot be negative'],
      index: true
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'Game ID reference is required'],
      index: true
    },
    gameTitle: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Index to retrieve top scores quickly for a game
scoreSchema.index({ gameId: 1, score: -1 });

module.exports = mongoose.model('Score', scoreSchema);
