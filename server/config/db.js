/**
 * Database Connection Module
 * Connects to MongoDB via Mongoose with resilient connection pooling and event listeners.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gameportal';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} (DB: ${conn.connection.name})`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB Error]', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from database server.');
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error] Failed to connect: ${error.message}`);
    console.warn('[MongoDB] Ensure your local MongoDB service is active or check your MONGODB_URI in .env');
    // Note: Do not exit process immediately so the server can report health status or attempt reconnects
  }
};

module.exports = connectDB;
