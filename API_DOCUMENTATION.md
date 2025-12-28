# API Documentation & Database Integration Guide

## Overview

This guide explains how the backend is now properly integrated with data persistence and database functionality.

## Architecture

### Data Flow

```
User Interface (HTML/JS)
        ↓
Frontend API Calls (fetch)
        ↓
Express.js Backend (Port 3000)
        ↓
Multiple Storage Options:
├── MongoDB (Primary - when available)
├── File-Based JSON (Fallback - users.json)
└── Browser localStorage (Client-side cache)
```

## Database Setup

### File-Based Storage (Current Primary)

**Location**: `server/users.json`

**Format**:

```json
{
  "users": [
    {
      "id": 1,
      "fullName": "John Doe",
      "militaryId": "NSS-123456",
      "email": "john@military.gov",
      "mobile": "+1-555-0123",
      "dob": "1990-05-15",
      "rank": "Colonel",
      "password": "encrypted_password",
      "status": "ACTIVE",
      "passportPicture": "path/to/image.jpg",
      "accountCreated": "12/28/2024",
      "procedures": [],
      "createdAt": "2024-12-28T10:00:00Z",
      "updatedAt": "2024-12-28T10:00:00Z"
    }
  ],
  "nextUserId": 2
}
```

### MongoDB Configuration (Optional)

**Install MongoDB**:

```bash
# Windows: Download from https://www.mongodb.com/try/download/community

# macOS:
brew tap mongodb/brew
brew install mongodb-community

# Linux:
sudo apt-get install -y mongodb
```

**Start MongoDB**:

```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Connection String**:

- Local: `mongodb://localhost:27017/military-hq`
- Atlas Cloud: `mongodb+srv://username:password@cluster.mongodb.net/military-hq`

Set in `.env`:

```
MONGODB_URI=mongodb://localhost:27017/military-hq
```

## API Endpoints

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "militaryId": "NSS-123456",
  "email": "john@military.gov",
  "mobile": "+1-555-0123",
  "dob": "1990-05-15",
  "rank": "Colonel",
  "password": "securepassword123"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "militaryId": "NSS-123456",
    "email": "john@military.gov",
    "status": "ACTIVE"
  }
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "militaryId": "NSS-123456",
  "password": "securepassword123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "militaryId": "NSS-123456",
    "email": "john@military.gov"
  }
}
```

#### Send Verification Code

```http
POST /api/auth/send-verification-code
Content-Type: application/json

{
  "email": "john@military.gov",
  "phone": "+1-555-0123",
  "code": "123456"
}

Response (200):
{
  "success": true,
  "message": "Verification code has been sent..."
}
```

#### Verify Account

```http
POST /api/auth/verify
Content-Type: application/json

{
  "verificationCode": "123456"
}

Response (200):
{
  "success": true,
  "message": "Account verified successfully"
}
```

### User Management Endpoints

#### Get User Profile

```http
GET /api/user/:militaryId

Response (200):
{
  "id": 1,
  "fullName": "John Doe",
  "militaryId": "NSS-123456",
  "email": "john@military.gov",
  "status": "ACTIVE"
}
```

#### Update User Profile

```http
PUT /api/user/:militaryId
Content-Type: application/json

{
  "mobile": "+1-555-0124",
  "rank": "General"
}

Response (200):
{
  "success": true,
  "message": "User updated successfully"
}
```

#### Add Procedure to User

```http
POST /api/user/:militaryId/procedures
Content-Type: application/json

{
  "procedureName": "Medical Check-up",
  "description": "Annual health examination",
  "status": "pending"
}

Response (200):
{
  "success": true,
  "message": "Procedure added successfully"
}
```

### Admin Endpoints

#### Get All Users

```http
GET /api/admin/users

Response (200):
[
  {
    "id": 1,
    "fullName": "John Doe",
    "militaryId": "NSS-123456",
    "email": "john@military.gov",
    "rank": "Colonel",
    "status": "ACTIVE",
    "accountCreated": "12/28/2024"
  },
  {
    "id": 2,
    "fullName": "Jane Smith",
    "militaryId": "NSS-234567",
    "email": "jane@military.gov",
    "rank": "Major",
    "status": "ACTIVE",
    "accountCreated": "12/28/2024"
  }
]
```

#### Update User (Admin)

```http
PUT /api/admin/user/:militaryId
Content-Type: application/json

{
  "status": "INACTIVE",
  "rank": "General"
}

Response (200):
{
  "success": true,
  "message": "User updated successfully"
}
```

#### Delete User (Admin)

```http
DELETE /api/admin/user/:militaryId

Response (200):
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### Get User Procedures

```http
GET /api/admin/user/:militaryId/procedures

Response (200):
{
  "militaryId": "NSS-123456",
  "procedures": [
    {
      "id": 1,
      "name": "Medical Check",
      "status": "completed",
      "dueDate": "2024-12-31"
    }
  ]
}
```

#### Update User Procedures (Admin)

```http
PUT /api/admin/user/:militaryId/procedures/:procedureId
Content-Type: application/json

{
  "status": "completed",
  "completionDate": "2024-12-28"
}

Response (200):
{
  "success": true,
  "message": "Procedure updated successfully"
}
```

#### Send Email (Admin)

```http
POST /api/admin/email
Content-Type: application/json

{
  "to": ["john@military.gov", "jane@military.gov"],
  "subject": "Announcement",
  "body": "Please review the new procedures..."
}

Response (200):
{
  "success": true,
  "message": "Email sent successfully"
}
```

### Photo Management Endpoints

#### Approve User Photo

```http
POST /api/user/:militaryId/approve-photo

Response (200):
{
  "success": true,
  "message": "Photo approved successfully",
  "photoStatus": "approved"
}
```

#### Reject User Photo

```http
POST /api/user/:militaryId/reject-photo
Content-Type: application/json

{
  "reason": "Photo does not meet military standards"
}

Response (200):
{
  "success": true,
  "message": "Photo rejected successfully",
  "photoStatus": "rejected",
  "reason": "Photo does not meet military standards"
}
```

## Data Persistence

### How It Works

1. **User Registration/Login Flow**:

   - Data is saved to `users.json` immediately
   - Browser can cache data in localStorage
   - Admin panel reloads data on each fetch

2. **Admin Panel Display**:

   - Fetches latest data from backend API
   - Backend reloads data from file
   - Displays all registered users
   - Updates every 5 seconds automatically

3. **Persistence Across Refreshes**:
   - Data is stored in `server/users.json`
   - Persists even when server restarts
   - Not lost on page refresh

### Troubleshooting

#### Users Not Appearing in Admin Panel

**Issue**: Registered users don't show up in admin panel

**Solutions**:

1. **Check File Permissions**:

```bash
# Windows
icacls C:\path\to\users.json /grant Everyone:F

# Linux/Mac
chmod 644 server/users.json
```

2. **Verify Data File**:

```bash
# Check if users.json has data
node scripts/check-persistence.js check
```

3. **Clear and Refresh**:

```bash
# Clear all users and start fresh
node scripts/check-persistence.js clear

# Then register a new user
```

4. **Check Server Logs**:
   Look for messages like:

- `📥 Registration request received`
- `✅ New user registered successfully`
- `📊 /api/admin/users endpoint called`

#### Users Disappearing After Refresh

**Issue**: Users show up initially but disappear after page refresh

**Solutions**:

1. **Restart Server**:

```bash
# Stop the server (Ctrl+C)
# Check data file size increased
dir server/users.json

# Restart
npm start
```

2. **Check Network Requests**:
   Open browser DevTools (F12) → Network tab

- Check `/api/admin/users` request
- Should show status 200
- Response should have user data

3. **Verify API Response**:

```javascript
// In browser console:
fetch('http://localhost:3000/api/admin/users')
  .then((r) => r.json())
  .then((users) => console.log('Users:', users));
```

## Database Migration

### Migrating to MongoDB (Advanced)

```bash
# Run migration script
npm run db:migrate
```

This script will:

1. Read all users from `users.json`
2. Connect to MongoDB
3. Create users collection
4. Migrate data
5. Update backend to use MongoDB

### MongoDB Monitoring

```bash
# View database stats
mongo
> use military-hq
> db.users.find().pretty()
> db.users.count()
```

## Performance Optimization

### Current Setup

- **Read**: ~1-5ms (file system)
- **Write**: ~10-20ms (file system)
- **Storage**: ~100KB per 100 users

### With MongoDB

- **Read**: ~2-10ms (network dependent)
- **Write**: ~5-15ms (network dependent)
- **Storage**: 1GB+ (depends on data)

## Security Notes

### Current Limitations

1. Passwords not hashed (use bcryptjs in production)
2. No JWT authentication (use JSON Web Tokens)
3. Military ID format only (add additional validation)
4. localStorage vulnerable to XSS

### Recommendations

1. Enable password hashing:

   ```javascript
   const bcrypt = require('bcryptjs');
   // Hash password before saving
   ```

2. Implement JWT:

   ```javascript
   const jwt = require('jsonwebtoken');
   // Use tokens for authentication
   ```

3. Use HTTPS in production
4. Enable CORS restrictions
5. Add rate limiting

## Deployment

### Docker Deployment

```bash
# Build image
npm run docker:build

# Start services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Production Checklist

- [ ] MongoDB Atlas configured
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] Password hashing enabled
- [ ] Rate limiting enabled
- [ ] CORS restricted
- [ ] Error logging configured
- [ ] Database backup scheduled

## Support

For issues or questions:

1. **Check Logs**:

   - Server console for backend errors
   - Browser console (F12) for frontend errors

2. **Verify Connectivity**:

   - Backend: http://localhost:3000
   - Frontend: http://localhost:5500

3. **Test API**:

   ```bash
   curl -X GET http://localhost:3000/api/admin/users
   ```

4. **Clear Browser Cache**:
   - F12 → Storage → Clear All

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [REST API Best Practices](https://restfulapi.net/)
- [JWT Authentication](https://jwt.io/)
