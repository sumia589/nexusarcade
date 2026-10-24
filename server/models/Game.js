/**
 * Game Model
 * Stores full metadata for cataloged HTML5 games.
 */

const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Game title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'Game slug is required'],
      trim: true,
      unique: true,
      lowercase: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters']
    },
    longDescription: {
      type: String,
      default: ''
    },
    instructions: {
      type: String,
      default: 'Use keyboard arrows or touch controls to play.'
    },
    thumbnailUrl: {
      type: String,
      required: [true, 'Thumbnail URL is required']
    },
    bannerUrl: {
      type: String,
      default: ''
    },
    embedUrl: {
      type: String,
      required: [true, 'Playable embed URL is required']
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true
    },
    isNew: {
      type: Boolean,
      default: false,
      index: true
    },
    playCount: {
      type: Number,
      default: 0,
      index: true
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 120
    },
    badge: {
      type: String,
      default: ''
    },
    developer: {
      type: String,
      default: 'Nexus Indie Lab'
    },
    tags: {
      type: [String],
      default: []
    },
    controls: {
      desktop: { type: String, default: 'Arrow Keys / WASD, Space to Action' },
      mobile: { type: String, default: 'Touch & Drag / On-screen buttons' }
    }
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true
  }
);

// Compound text index for search functionality
gameSchema.index({ title: 'text', description: 'text', category: 'text', tags: 'text' });

module.exports = mongoose.model('Game', gameSchema);
