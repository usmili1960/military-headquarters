// Quick test to see if server can start
const path = require('path');
const fs = require('fs');

console.log('📍 Current directory:', __dirname);
console.log('📂 Files in directory:', fs.readdirSync('.'));
console.log('🔍 Looking for express...');

try {
    const express = require('express');
    console.log('✅ Express found');
} catch (err) {
    console.error('❌ Express not found:', err.message);
}

console.log('🔍 Checking app.js...');
if (fs.existsSync('./server/app.js')) {
    console.log('✅ app.js exists');
} else {
    console.error('❌ app.js not found');
}

console.log('✅ Server test complete');
