# Backend Setup & Development Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Development Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 4. Run Tests
```bash
npm test              # Run all tests
npm run test:watch   # Run tests in watch mode
```

## 🐳 Docker Setup

### Build & Run with Docker Compose
```bash
npm run docker:up
# Starts:
# - Backend (Express) on http://localhost:3000
# - MongoDB on mongodb://localhost:27017
# - Mongo Express UI on http://localhost:8081
```

### Stop Docker Services
```bash
npm run docker:down
```

### View Docker Logs
```bash
npm run docker:logs
```

## 📊 Database Configuration

### MongoDB Connection
- **Local**: `mongodb://localhost:27017/military-hq`
- **Docker**: `mongodb://mongodb:27017/military-hq`
- **Credentials**: admin / admin123 (from docker-compose.yml)

### Mongo Express Admin Panel
- **URL**: http://localhost:8081
- **User**: admin
- **Pass**: admin123

### Create Required Indexes
```javascript
// Connect to MongoDB and run these commands
db.users.createIndex({ militaryId: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ status: 1 });
db.procedures.createIndex({ name: 1 });
```

## 📝 API Testing

### Using REST Client Extension
1. Open `api.http` in VS Code
2. Click "Send Request" above each endpoint
3. View response in side panel

### Example Endpoints

**Register User**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "fullName": "John Smith",
  "militaryId": "NSS-123456",
  "email": "john@military.gov",
  "password": "SecurePass123!"
}
```

**Login**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "militaryId": "NSS-123456",
  "password": "SecurePass123!"
}
```

## 🧪 Testing Framework

### Run Tests
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm test -- --coverage  # With coverage report
```

### Test Files Location
- `tests/user.test.js` - User authentication tests
- `tests/procedure.test.js` - Procedure management tests
- `tests/admin.test.js` - Admin functionality tests

## 📦 Project Structure

```
server/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js              # User schema
│   ├── Procedure.js         # Procedure schema
│   └── Admin.js             # Admin schema
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── users.js             # User management endpoints
│   └── admin.js             # Admin endpoints
└── app.js                   # Main Express app

tests/
├── setup.js                 # Test configuration
├── user.test.js            # User tests
├── procedure.test.js       # Procedure tests
└── admin.test.js           # Admin tests
```

## 🔐 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT authentication (jsonwebtoken)
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation with validator.js
- ✅ Audit logging

## 📊 Key Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ORM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |
| multer | File uploads |
| nodemailer | Email sending |
| cors | Cross-origin requests |
| helmet | Security headers |
| express-ratelimit | Rate limiting |

## 🛠️ Common Tasks

### Add New API Endpoint
1. Create route in `server/routes/`
2. Add controller logic
3. Add tests in `tests/`
4. Update `api.http` for testing

### Add Database Migration
1. Create migration script in `scripts/migrate.js`
2. Run: `npm run db:migrate`
3. Verify in Mongo Express UI

### Deploy to Production
1. Set `NODE_ENV=production` in `.env`
2. Change `MONGODB_URI` to production database
3. Build Docker image: `npm run docker:build`
4. Use Docker Compose or Kubernetes for orchestration

## 📚 Additional Resources

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [JWT Docs](https://jwt.io/)
- [MongoDB Docs](https://docs.mongodb.com/)
