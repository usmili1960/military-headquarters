# MongoDB Setup & Installation Guide

## Quick Start (File-Based Storage - Already Working)

Your application is currently using **file-based JSON storage** (`server/users.json`) which works perfectly fine. Data persists across:

- Page refreshes
- Server restarts
- Browser sessions

**No setup required!** Your data is being saved to `server/users.json`.

---

## MongoDB Installation (Optional - for Production)

If you want to use MongoDB for better scalability and features, follow these steps:

### Windows Installation

1. **Download MongoDB Community Edition**:

   - Visit: https://www.mongodb.com/try/download/community
   - Select Windows, MSI format
   - Click Download

2. **Run the Installer**:

   - Double-click the `.msi` file
   - Choose "Run Service as MongoDB in the Windows Service"
   - Choose installation folder (default: `C:\Program Files\MongoDB`)
   - Complete installation

3. **Verify Installation**:

   ```bash
   mongod --version
   ```

4. **Create Data Directory**:

   ```bash
   mkdir C:\data\db
   mkdir C:\data\log
   ```

5. **Start MongoDB Service**:

   ```bash
   # Via Services (easiest):
   # Open Services → Find "MongoDB Server" → Right-click → Start

   # Or via Command Line:
   net start MongoDB

   # Or start manually:
   mongod --dbpath C:\data\db --logpath C:\data\log\mongo.log
   ```

### macOS Installation

1. **Install via Homebrew**:

   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **Create Data Directory**:

   ```bash
   mkdir -p ~/mongodb-data
   ```

3. **Start MongoDB**:

   ```bash
   brew services start mongodb-community

   # Or manually:
   mongod --dbpath ~/mongodb-data
   ```

### Linux Installation (Ubuntu/Debian)

1. **Install MongoDB**:

   ```bash
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

2. **Start MongoDB Service**:

   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod  # Auto-start on boot
   ```

3. **Verify Installation**:
   ```bash
   mongo --version
   ```

---

## Configuration

### Update .env File

After MongoDB is running, update your `.env` file:

```bash
# For Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/military-hq

# For MongoDB Atlas (Cloud):
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/military-hq?retryWrites=true&w=majority
```

### MongoDB Atlas (Cloud Database)

If you prefer cloud hosting:

1. **Create Free Account**:

   - Visit: https://www.mongodb.com/cloud/atlas
   - Sign up for free account

2. **Create Cluster**:

   - Click "Create a Deployment"
   - Choose "Shared" (free tier)
   - Select your region
   - Click "Create"

3. **Get Connection String**:

   - Click "Connect" on your cluster
   - Choose "Drivers"
   - Copy your connection string
   - Replace `<username>`, `<password>`, and `<database>`

4. **Whitelist Your IP**:

   - Go to "Network Access"
   - Click "Add IP Address"
   - Add your IP or allow all (0.0.0.0/0)

5. **Update .env**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/military-hq?retryWrites=true&w=majority
   ```

---

## Verify Connection

### Check MongoDB is Running

```bash
# Windows
netstat -ano | findstr :27017

# Mac/Linux
lsof -i :27017
```

### Test Connection with MongoDB Shell

```bash
# Open MongoDB shell
mongo

# In the shell:
> use military-hq
> db.users.find()

# Exit:
> exit
```

### Test Connection via Application

```javascript
// In browser console at http://localhost:3000/admin-dashboard:
fetch('/api/admin/users')
  .then((r) => r.json())
  .then((users) => console.log('Database users:', users));
```

---

## Data Migration from JSON to MongoDB

### Automatic Migration

```bash
npm run db:migrate
```

This script will:

1. Read all users from `users.json`
2. Create users in MongoDB
3. Update backend configuration

### Manual Migration

1. **Start MongoDB**
2. **Create Database**:

   ```bash
   mongo
   > use military-hq
   > exit
   ```

3. **Run Application** (will auto-create collection):

   ```bash
   npm start
   ```

4. **Register a test user** to verify it's using MongoDB

---

## MongoDB Database Structure

### Users Collection

```javascript
{
  _id: ObjectId("..."),
  userId: 1,
  militaryId: "NSS-123456",
  fullName: "John Doe",
  email: "john@military.gov",
  mobile: "+1-555-0123",
  dob: ISODate("1990-05-15"),
  rank: "Colonel",
  status: "active",
  password: "hashed_password_here",
  photoUrl: "path/to/photo.jpg",
  procedures: [
    {
      procedureId: ObjectId("..."),
      name: "Medical Check",
      status: "completed",
      dueDate: ISODate("2024-12-31")
    }
  ],
  spouse: {
    name: "Jane Doe",
    email: "jane@military.gov",
    mobile: "+1-555-0124"
  },
  createdAt: ISODate("2024-12-28T10:00:00Z"),
  updatedAt: ISODate("2024-12-28T10:00:00Z")
}
```

---

## Useful MongoDB Commands

```bash
# Connect to MongoDB
mongo

# Show databases
> show dbs

# Use specific database
> use military-hq

# Show collections
> show collections

# Count documents
> db.users.countDocuments()

# Find all users
> db.users.find()

# Find by Military ID
> db.users.findOne({ militaryId: "NSS-123456" })

# Find by email
> db.users.findOne({ email: "john@military.gov" })

# Update user status
> db.users.updateOne(
    { militaryId: "NSS-123456" },
    { $set: { status: "active" } }
  )

# Delete user
> db.users.deleteOne({ militaryId: "NSS-123456" })

# Get collection stats
> db.users.stats()

# Create index for faster queries
> db.users.createIndex({ militaryId: 1 })
> db.users.createIndex({ email: 1 })

# View indexes
> db.users.getIndexes()

# Exit MongoDB shell
> exit
```

---

## Troubleshooting MongoDB

### MongoDB Won't Start

**Windows**:

```bash
# Check service status
sc query MongoDB

# Start service
net start MongoDB

# Stop service
net stop MongoDB
```

**Mac**:

```bash
# Check status
brew services list

# Restart
brew services restart mongodb-community
```

**Linux**:

```bash
# Check status
sudo systemctl status mongod

# Restart
sudo systemctl restart mongod
```

### Connection Refused Error

1. **Verify MongoDB is running**:

   ```bash
   # Should see mongod process
   ps aux | grep mongod
   ```

2. **Check correct port** (default: 27017):

   ```bash
   mongod --port 27017
   ```

3. **Check firewall** (if remote):
   - Ensure port 27017 is open
   - For MongoDB Atlas, whitelist your IP

### Authentication Failed

1. **Create user** (if using authentication):

   ```bash
   mongo
   > use admin
   > db.createUser({
        user: "username",
        pwd: "password",
        roles: ["root"]
      })
   ```

2. **Update connection string**:
   ```
   mongodb://username:password@localhost:27017/military-hq
   ```

### Data Not Persisting

1. **Check data directory** has write permissions:

   ```bash
   # Windows
   icacls C:\data\db /grant Everyone:F

   # Linux/Mac
   chmod 755 ~/mongodb-data
   ```

2. **Check logs** for errors:

   ```bash
   # Windows
   Get-Content C:\data\log\mongo.log -Tail 20

   # Linux/Mac
   tail -f /var/log/mongodb/mongod.log
   ```

---

## Performance Tips

### Enable Compression

```bash
mongod --dbpath C:\data\db --compression snappy
```

### Create Indexes for Faster Queries

```bash
mongo
> use military-hq
> db.users.createIndex({ militaryId: 1 })
> db.users.createIndex({ email: 1 })
> db.users.createIndex({ status: 1 })
```

### Monitor MongoDB Performance

```bash
# Check stats
> db.serverStatus()

# Check collection size
> db.users.stats()

# Top databases by size
> db.adminCommand({ listDatabases: 1 })
```

---

## Backup & Restore

### Backup Database

```bash
# Dump database
mongodump --db military-hq --out C:\backup\military-hq

# Or with compression
mongodump --db military-hq --archive=military-hq.archive --gzip
```

### Restore Database

```bash
# Restore from dump
mongorestore --db military-hq C:\backup\military-hq

# Or from archive
mongorestore --archive=military-hq.archive --gzip
```

---

## Current Status

Your application works perfectly with **file-based storage**:

✅ **Advantages**:

- No external dependencies
- Fast for small datasets (<10,000 users)
- Easy to backup (just copy users.json)
- Perfect for development/testing

❌ **Limitations**:

- Not suitable for very large datasets
- No built-in transactions
- Limited advanced querying

**When to migrate to MongoDB**:

- Expecting > 10,000 users
- Need advanced queries
- Need built-in replication
- Production deployment

---

## Next Steps

1. **Test Current Setup** (no setup needed):

   ```bash
   npm start
   # Register a user
   # Refresh admin panel → user should persist
   ```

2. **When Ready for MongoDB**:

   - Follow installation steps above
   - Update `.env` file
   - Run `npm run db:migrate`
   - Restart application

3. **Monitor Health**:
   ```bash
   npm run check-db
   ```

## Support

If you encounter any issues:

1. Check the logs:

   - Server console
   - Browser console (F12)
   - MongoDB logs

2. Verify connectivity:

   ```bash
   curl http://localhost:3000/api/admin/users
   ```

3. Test data persistence:
   ```bash
   node scripts/check-persistence.js
   ```

---

**Happy coding! Your military headquarters application is ready! 🚀**
