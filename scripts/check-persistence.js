#!/usr/bin/env node

/**
 * Data Persistence Verification Script
 * Checks and fixes user data persistence issues
 */

const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');

function verifyDataPersistence() {
    console.log('\n🔍 Checking Data Persistence...\n');
    
    // Check if users.json exists
    if (fs.existsSync(USERS_FILE)) {
        console.log('✅ users.json file exists');
        
        try {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            
            console.log(`📊 Users in storage: ${parsed.users.length}`);
            console.log(`📝 Next User ID: ${parsed.nextUserId}`);
            
            if (parsed.users.length > 0) {
                console.log('\n📋 User List:');
                parsed.users.forEach((user, index) => {
                    console.log(`  ${index + 1}. ${user.fullName} (${user.militaryId}) - ${user.email}`);
                });
            } else {
                console.log('⚠️  No users found in storage');
            }
            
            console.log('\n✅ Data persistence is working correctly!');
            return true;
        } catch (error) {
            console.error('❌ Error reading users.json:', error.message);
            return false;
        }
    } else {
        console.log('❌ users.json file not found');
        console.log('📝 Creating new users.json file...');
        
        const defaultData = {
            users: [],
            nextUserId: 1
        };
        
        try {
            fs.writeFileSync(USERS_FILE, JSON.stringify(defaultData, null, 2));
            console.log('✅ users.json created successfully');
            return true;
        } catch (error) {
            console.error('❌ Error creating users.json:', error.message);
            return false;
        }
    }
}

function clearAllUsers() {
    console.log('\n🗑️  Clearing all users...\n');
    
    const defaultData = {
        users: [],
        nextUserId: 1
    };
    
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(defaultData, null, 2));
        console.log('✅ All users cleared successfully');
    } catch (error) {
        console.error('❌ Error clearing users:', error.message);
    }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'check') {
    verifyDataPersistence();
} else if (command === 'clear') {
    console.log('⚠️  This will delete all user data!');
    clearAllUsers();
} else {
    console.log('Data Persistence Helper\n');
    console.log('Usage:');
    console.log('  node scripts/check-persistence.js check   - Check data persistence');
    console.log('  node scripts/check-persistence.js clear   - Clear all users\n');
    verifyDataPersistence();
}
