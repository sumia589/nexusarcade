/**
 * Dynamic Sitemap Generator
 * Produces valid XML sitemaps for search engines querying the live MongoDB database.
 */

const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    const games = await Game.find().select('slug updatedAt').sort({ updatedAt: -1 });

    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/about.html', changefreq: 'monthly', priority: '0.6' },
      { url: '/contact.html', changefreq: 'monthly', priority: '0.6' },
      { url: '/privacy.html', changefreq: 'yearly', priority: '0.4' },
      { url: '/terms.html', changefreq: 'yearly', priority: '0.4' }
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    staticPages.forEach(p => {
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}${p.url}</loc>\n`;
      xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
      xml += `    <priority>${p.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Dynamic game pages
    games.forEach(g => {
      const lastmod = g.updatedAt ? g.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}/game.html?id=${g.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
