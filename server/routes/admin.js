/**
 * Admin API Routes
 * Endpoints for admin authentication, game CRUD, category management, and contact message review.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Game = require('../models/Game');
const Category = require('../models/Category');
const Score = require('../models/Score');
const ContactMessage = require('../models/ContactMessage');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validateAdminLogin } = require('../middleware/validation');

/**
 * @route   POST /api/admin/login
 * @desc    Authenticate admin and return JWT
 * @access  Public (Rate limited)
 */
router.post('/login', loginLimiter, validateAdminLogin, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const payload = {
      id: admin._id,
      username: admin.username
    };

    const secret = process.env.JWT_SECRET || 'nexus_arcade_super_secret_jwt_key_2026_dev';
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/me
 * @desc    Verify admin token and return current admin profile
 * @access  Private (Admin)
 */
router.get('/me', auth, async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-passwordHash');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.json({ success: true, admin });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard metrics (counts of games, plays, messages, scores)
 * @access  Private (Admin)
 */
router.get('/stats', auth, async (req, res, next) => {
  try {
    const [totalGames, totalScores, totalMessages, unreadMessages, playAggregate] = await Promise.all([
      Game.countDocuments(),
      Score.countDocuments(),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ isRead: false }),
      Game.aggregate([{ $group: { _id: null, totalPlays: { $sum: '$playCount' } } }])
    ]);

    const totalPlays = playAggregate.length > 0 ? playAggregate[0].totalPlays : 0;

    res.json({
      success: true,
      stats: {
        totalGames,
        totalPlays,
        totalScores,
        totalMessages,
        unreadMessages
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/games
 * @desc    Get all games for admin table
 * @access  Private (Admin)
 */
router.get('/games', auth, async (req, res, next) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json({ success: true, count: games.length, data: games });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/admin/games
 * @desc    Create a new game (accepts form-data with thumbnail file or JSON)
 * @access  Private (Admin)
 */
router.post('/games', auth, upload.single('thumbnail'), async (req, res, next) => {
  try {
    const {
      title,
      slug,
      category,
      description,
      longDescription,
      instructions,
      embedUrl,
      thumbnailUrl,
      bannerUrl,
      isFeatured,
      isPopular,
      isNew,
      badge,
      developer,
      tags
    } = req.body;

    if (!title || !category || !description || !embedUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, description, and embedUrl are required fields.'
      });
    }

    // Determine thumbnail path: uploaded file takes precedence, else provided URL
    let finalThumbnail = thumbnailUrl;
    if (req.file) {
      finalThumbnail = `/uploads/${req.file.filename}`;
    }

    if (!finalThumbnail) {
      finalThumbnail = 'assets/images/thumb-space-dodge.svg';
    }

    // Generate slug from title if not explicitly provided
    const finalSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check slug uniqueness
    const existing = await Game.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A game with slug '${finalSlug}' already exists.`
      });
    }

    const parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : (tags || []);

    const newGame = await Game.create({
      title: title.trim(),
      slug: finalSlug,
      category: category.trim(),
      description: description.trim(),
      longDescription: longDescription || description,
      instructions: instructions || 'Follow on-screen instructions.',
      embedUrl: embedUrl.trim(),
      thumbnailUrl: finalThumbnail,
      bannerUrl: bannerUrl || finalThumbnail,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isPopular: isPopular === 'true' || isPopular === true,
      isNew: isNew === 'true' || isNew === true,
      badge: badge || '',
      developer: developer || 'Indie Creator',
      tags: parsedTags
    });

    res.status(201).json({
      success: true,
      message: 'Game created successfully!',
      data: newGame
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/admin/games/:id
 * @desc    Update game details
 * @access  Private (Admin)
 */
router.put('/games/:id', auth, upload.single('thumbnail'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.thumbnailUrl = `/uploads/${req.file.filename}`;
    }

    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // Convert booleans
    if ('isFeatured' in updateData) updateData.isFeatured = updateData.isFeatured === 'true' || updateData.isFeatured === true;
    if ('isPopular' in updateData) updateData.isPopular = updateData.isPopular === 'true' || updateData.isPopular === true;
    if ('isNew' in updateData) updateData.isNew = updateData.isNew === 'true' || updateData.isNew === true;

    const updatedGame = await Game.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedGame) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    res.json({
      success: true,
      message: 'Game updated successfully!',
      data: updatedGame
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/admin/games/:id/toggle
 * @desc    Quick toggle for flags: isFeatured, isPopular, isNew
 * @access  Private (Admin)
 */
router.patch('/games/:id/toggle', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { field } = req.body; // 'isFeatured', 'isPopular', or 'isNew'

    if (!['isFeatured', 'isPopular', 'isNew'].includes(field)) {
      return res.status(400).json({ success: false, message: 'Invalid flag specified' });
    }

    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    game[field] = !game[field];
    await game.save();

    res.json({
      success: true,
      message: `${field} toggled to ${game[field]}`,
      data: game
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/admin/games/:id
 * @desc    Delete a game and its scores
 * @access  Private (Admin)
 */
router.delete('/games/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const game = await Game.findByIdAndDelete(id);
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    // Delete associated scores
    await Score.deleteMany({ gameId: id });

    res.json({
      success: true,
      message: `Game '${game.title}' and associated scores deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/categories
 * @desc    Get categories for admin panel
 * @access  Private (Admin)
 */
router.get('/categories', auth, async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/admin/categories
 * @desc    Create a new category
 * @access  Private (Admin)
 */
router.post('/categories', auth, async (req, res, next) => {
  try {
    const { name, slug, icon, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const finalSlug = (slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const newCategory = await Category.create({
      name: name.trim(),
      slug: finalSlug,
      icon: icon || '🎮',
      description: description || ''
    });

    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Delete a category
 * @access  Private (Admin)
 */
router.delete('/categories/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const cat = await Category.findByIdAndDelete(id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: `Category '${cat.name}' removed.` });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/messages
 * @desc    Get all contact messages
 * @access  Private (Admin)
 */
router.get('/messages', auth, async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/admin/messages/:id/read
 * @desc    Mark message as read
 * @access  Private (Admin)
 */
router.patch('/messages/:id/read', auth, async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/admin/messages/:id
 * @desc    Delete a contact message
 * @access  Private (Admin)
 */
router.delete('/messages/:id', auth, async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
