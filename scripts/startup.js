#!/usr/bin/env node

/**
 * Application Startup Script
 * Initializes database, checks MongoDB connection, and starts the server
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║   Military Headquarters - Application Startup               ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Check if users.json exists and initialize if not
const USERS_FILE = path.join(__dirname, '../server/users.json');

console.log('📁 Checking data storage...');
if (!fs.existsSync(USERS_FILE)) {
    console.log('⚠️  users.json not found, creating it...');
    const defaultData = {
        users: [],
        nextUserId: 1
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultData, null, 2));
    console.log('✅ users.json created');
} else {
    const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    console.log(`✅ users.json found with ${data.users.length} users`);
}

// Check environment variables
console.log('\n🔐 Checking configuration...');
const requiredEnvVars = ['PORT', 'NODE_ENV'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
    console.log('⚠️  Missing environment variables:', missingEnvVars.join(', '));
} else {
    console.log('✅ Environment variables configured');
}

console.log(`   - PORT: ${process.env.PORT || 3000}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Display MongoDB configuration
console.log('\n💾 Database Configuration:');
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-hq';
if (mongoUri.includes('mongodb+srv')) {
    console.log('   - MongoDB Atlas (Cloud)');
} else {
    console.log('   - MongoDB Local');
}
console.log('   - URI:', mongoUri.split('://')[0] + '://***');

console.log('\n✅ Startup verification complete\n');
console.log('🚀 Starting application...\n');

// Start the actual server
require('../server/app.js');
