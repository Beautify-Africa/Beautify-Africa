// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI in environment variables.');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    let hint = '';

    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      hint = ' Check Atlas username/password and database user permissions.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      hint = ' Verify cluster hostname and your network DNS/connectivity.';
    } else if (error.message.includes('timed out')) {
      hint = ' Check Atlas network access (IP allow list).';
    }

    throw new Error(`MongoDB connection failed: ${error.message}${hint}`);
  }
};

module.exports = connectDB;