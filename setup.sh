#!/bin/bash
# Military Headquarters Website - Setup Script

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Military Headquarters Website - Automated Setup Script      ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please download and install Node.js from: https://nodejs.org/"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"
echo "✅ NPM detected: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies!"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║             Setup Complete! Ready to Start Server             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "To start the server, run:"
echo "  npm start"
echo ""
echo "Then open your browser to: http://localhost:3000"
echo ""
echo "For development with auto-reload:"
echo "  npm run dev"
echo ""
