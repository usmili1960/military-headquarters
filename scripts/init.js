#!/usr/bin/env node

/**
 * Project Initialization Script
 * Sets up the complete development environment with MongoDB integration
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`✅ Created directory: ${dirPath}`, 'green');
  }
}

function createFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    log(`✅ Created file: ${filePath}`, 'green');
  }
}

async function initialize() {
  log('\n🚀 Initializing Military Headquarters Application\n', 'blue');

  try {
    // Create necessary directories
    log('\n📁 Creating directories...', 'blue');
    createDirectory('server/config');
    createDirectory('server/models');
    createDirectory('server/routes');
    createDirectory('server/middleware');
    createDirectory('server/utils');
    createDirectory('tests');
    createDirectory('scripts');
    createDirectory('.github/workflows');

    // Verify critical files exist
    log('\n📋 Verifying configuration files...', 'blue');
    const criticalFiles = [
      'package.json',
      '.env.example',
      'docker-compose.yml',
      'Dockerfile',
      'jest.config.js',
      '.eslintrc.js',
      'api.http'
    ];

    criticalFiles.forEach(file => {
      if (fs.existsSync(file)) {
        log(`✅ Found: ${file}`, 'green');
      } else {
        log(`⚠️  Missing: ${file}`, 'yellow');
      }
    });

    log('\n📦 Project Structure Ready!', 'green');
    log('\nNext Steps:', 'blue');
    log('1. npm install                 # Install dependencies', 'yellow');
    log('2. cp .env.example .env       # Create environment file', 'yellow');
    log('3. npm run docker:up          # Start MongoDB with Docker', 'yellow');
    log('4. npm run dev                # Start development server', 'yellow');
    log('5. Open api.http              # Test API endpoints', 'yellow');

    log('\n✨ Initialization Complete!\n', 'green');
  } catch (error) {
    log(`\n❌ Initialization failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

initialize();
