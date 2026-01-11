#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     🎖️  MILITARY HEADQUARTERS - DATABASE SETUP           ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if MongoDB is installed
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB is installed"
    
    # Check if MongoDB is running
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is already running"
    else
        echo "🔄 Starting MongoDB..."
        # Try to start MongoDB service
        if sudo systemctl start mongod 2>/dev/null; then
            echo "✅ MongoDB started successfully"
        elif brew services start mongodb-community 2>/dev/null; then
            echo "✅ MongoDB started successfully (Homebrew)"
        else
            echo "⚠️  Could not start MongoDB service"
            echo "   Try: sudo systemctl start mongod"
        fi
    fi
    
    echo ""
    echo "✅ MongoDB Setup Complete!"
    echo "   Starting server..."
    npm start
    
elif command -v docker &> /dev/null; then
    echo "⚠️  MongoDB not installed, but Docker is available"
    echo ""
    echo "📦 Would you like to use Docker for MongoDB?"
    echo ""
    echo "Run this command to start MongoDB in Docker:"
    echo "   docker run -d --name military-mongodb -p 27017:27017 mongo:6.0"
    echo ""
    echo "Then run: npm start"
    
else
    echo "❌ MongoDB is not installed"
    echo ""
    echo "📚 MongoDB Setup Options:"
    echo ""
    echo "Option 1: MongoDB Atlas (Cloud - Recommended ✨)"
    echo "   • No installation needed"
    echo "   • Free forever"
    echo "   • Setup guide: See MONGODB_SETUP.md"
    echo ""
    echo "Option 2: Install MongoDB Locally"
    echo ""
    echo "   Ubuntu/Debian:"
    echo "   $ wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -"
    echo "   $ echo \"deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse\" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list"
    echo "   $ sudo apt-get update"
    echo "   $ sudo apt-get install -y mongodb-org"
    echo "   $ sudo systemctl start mongod"
    echo ""
    echo "   macOS:"
    echo "   $ brew tap mongodb/brew"
    echo "   $ brew install mongodb-community@6.0"
    echo "   $ brew services start mongodb-community"
    echo ""
    echo "Option 3: Run Without MongoDB"
    echo "   The server will start but with limited functionality"
    echo ""
    read -p "Start server without MongoDB? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Starting server (MongoDB features disabled)..."
        npm start
    else
        echo "❌ Server startup cancelled"
        echo "   Please setup MongoDB first: See MONGODB_SETUP.md"
        exit 1
    fi
fi
