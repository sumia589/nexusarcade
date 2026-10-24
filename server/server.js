/**
 * Server Entry Point
 * Initializes environment configuration, connects to MongoDB, and binds the HTTP server.
 */

require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Connect to MongoDB database
  await connectDB();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 NEXUS ARCADE FULL-STACK SERVER RUNNING`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🎮 Public Portal: http://localhost:${PORT}/index.html`);
    console.log(`🛡️  Admin Dashboard: http://localhost:${PORT}/admin.html`);
    console.log(`🗺️  Dynamic Sitemap: http://localhost:${PORT}/sitemap.xml`);
    console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`==================================================\n`);
  });

  // Graceful shutdown
  const handleExit = (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleExit('SIGTERM'));
  process.on('SIGINT', () => handleExit('SIGINT'));
};

startServer();
