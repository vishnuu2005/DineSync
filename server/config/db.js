const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let mongoMemoryServer = null;

const connectDB = async () => {
  if (process.env.MONGO_URI) {
    try {
      console.log('Attempting to connect to configured MongoDB URI...');
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log('MongoDB connected successfully');
      console.log(`Database: ${conn.connection.name}`);
      console.log(`Host: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`Could not connect to external MongoDB cluster: ${error.message}`);
    }
  }

  // Fallback to persistent local MongoDB for continuous data preservation
  try {
    const dbPath = path.join(__dirname, '..', '.db_storage');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    console.log(`Starting persistent local MongoDB at: ${dbPath}`);
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
    const uri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(uri);
    console.log('Persistent local MongoDB started and connected successfully!');

    // Automatically seed initial data ONCE on a brand new database
    const User = require('../models/User');
    const Product = require('../models/Product');
    const [userCount, productCount] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
    ]);

    if (userCount === 0 || productCount === 0) {
      console.log('Auto-seeding initial café demo data (tables, menu items, users)...');
      const seedDatabase = require('../seed');
      await seedDatabase(false);
      console.log('Initial café demo data auto-seeded successfully.');
    } else {
      console.log(
        `Loaded existing database (${productCount} menu items, ${userCount} users). Admin image customizations preserved.`
      );
    }
  } catch (error) {
    console.error(`Local MongoDB initialization failed: ${error.message}`);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  if (mongoMemoryServer) {
    try {
      await mongoMemoryServer.stop();
    } catch (_) {}
  }
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = connectDB;
