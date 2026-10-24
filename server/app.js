/**
 * Express Application Configuration
 * Sets up security headers, middleware, static asset caching, and mounts API routers.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');

// Import Routers
const gamesRouter = require('./routes/games');
const categoriesRouter = require('./routes/categories');
const scoresRouter = require('./routes/scores');
const contactRouter = require('./routes/contact');
const adminRouter = require('./routes/admin');
const sitemapRouter = require('./routes/sitemap');

// Import Error Handlers
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// --- 1. Security Headers (Helmet) ---
// Note: relax frameguard & COEP to allow internal iframe embedding of HTML5 games
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible canvas, inline svgs, and audio contexts
    crossOriginEmbedderPolicy: false,
    frameguard: false
  })
);

// --- 2. Compression & CORS ---
app.use(compression());
app.use(cors());

// --- 3. Body Parsing & NoSQL Injection Sanitization ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// --- 4. Static Files with Cache Headers ---
const publicDir = path.join(__dirname, '..', 'public');
app.use(
  express.static(publicDir, {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : '1h',
    etag: true
  })
);

// --- 5. Mount API Routes ---
app.use('/api/games', gamesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/contact', contactRouter);
app.use('/api/admin', adminRouter);
app.use('/', sitemapRouter);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// --- 6. 404 & Centralized Error Handlers ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
