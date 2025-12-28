/**
 * Database Migration Script
 * Migrates data from JSON file to MongoDB
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const User = require('../server/models/User');
const Procedure = require('../server/models/Procedure');

async function migrateData() {
  try {
    console.log('📊 Starting database migration...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-hq';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Read JSON data
    const usersFile = path.join(__dirname, '../server/users.json');
    if (!fs.existsSync(usersFile)) {
      console.log('⚠️  users.json not found, skipping migration');
      process.exit(0);
    }

    const jsonData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    console.log(`📝 Found ${jsonData.users.length} users to migrate`);

    // Clear existing data
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Migrate users
    for (const user of jsonData.users) {
      const newUser = new User({
        userId: user.id || Math.random(),
        militaryId: user.militaryId,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        dob: user.dob,
        rank: user.rank || 'Private',
        status: user.status || 'active',
        password: user.password,
        isVerified: true,
        procedures: user.procedures || [],
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date()
      });

      try {
        await newUser.save();
        console.log(`✅ Migrated: ${user.fullName}`);
      } catch (error) {
        console.warn(`⚠️  Failed to migrate ${user.fullName}: ${error.message}`);
      }
    }

    console.log('\n✨ Migration complete!');
    console.log(`📊 ${jsonData.users.length} users migrated to MongoDB`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateData();
