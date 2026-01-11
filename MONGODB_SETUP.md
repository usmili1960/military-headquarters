# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud - Recommended)

MongoDB Atlas is a cloud database service that requires no local installation.

### Steps:

1. **Create Free Account**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up for free (no credit card required)

2. **Create Cluster**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select a cloud provider and region close to you
   - Click "Create Cluster" (takes 3-5 minutes)

3. **Setup Database Access**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Create username and password
   - Select "Read and write to any database"
   - Click "Add User"

4. **Setup Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Click "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/`)

6. **Update .env File**
   ```
   MONGODB_URI=mongodb+srv://username:your-password@cluster.mongodb.net/military-hq?retryWrites=true&w=majority
   ```
   Replace:
   - `username` with your database username
   - `your-password` with your database password
   - `cluster` with your cluster name

7. **Start Server**
   ```bash
   npm start
   ```

---

## Option 2: Install MongoDB Locally

### Ubuntu/Debian Linux:

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Reload package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

### macOS:

```bash
# Install using Homebrew
brew tap mongodb/brew
brew install mongodb-community@6.0

# Start MongoDB service
brew services start mongodb-community@6.0

# Verify MongoDB is running
brew services list
```

### Windows:

1. Download MongoDB installer from https://www.mongodb.com/try/download/community
2. Run the installer (.msi file)
3. Choose "Complete" installation
4. Check "Install MongoDB as a Service"
5. Click "Install"
6. MongoDB will start automatically

### Verify Installation:

```bash
# Check if MongoDB is running
mongo --version

# Or
mongosh --version
```

---

## Option 3: Docker (If you have Docker installed)

```bash
# Start MongoDB container
docker run -d --name military-mongodb -p 27017:27017 -v mongodb-data:/data/db mongo:6.0

# Check if running
docker ps | grep military-mongodb

# View logs
docker logs military-mongodb
```

Update `.env`:
```
MONGODB_URI=mongodb://localhost:27017/military-hq
```

---

## Testing the Connection

After setup, start the server:

```bash
cd "/mnt/chromeos/removable/USB Drive/Download/Mili.osmosis (1)/Mili"
npm start
```

You should see:
```
✅ MongoDB Connected Successfully
📊 Database: military-hq
✅ Default admin account created
   Email: admin@military.gov
   Password: Admin@12345
```

If you see errors, the server will still run but with limited functionality.

---

## Current .env Configuration

Your current `.env` file is configured for:
- Local MongoDB: `mongodb://localhost:27017/military-hq`

To use MongoDB Atlas instead, update the `MONGODB_URI` line in `.env` with your Atlas connection string.

---

## Troubleshooting

### Connection Timeout
- Check if MongoDB service is running
- Verify firewall isn't blocking port 27017
- For Atlas: Check IP whitelist includes your IP

### Authentication Failed
- Verify username/password in connection string
- Make sure database user has proper permissions

### Cannot Connect to localhost:27017
- MongoDB service not running
- Try: `sudo systemctl start mongod` (Linux)
- Try: `brew services start mongodb-community` (macOS)

---

## Quick Start (Recommended)

For fastest setup, use **MongoDB Atlas (Option 1)**:
- No installation needed
- Free forever for basic usage
- Takes 5-10 minutes to setup
- Works on any OS
- No maintenance required

Just follow the steps above and update your `.env` file!
