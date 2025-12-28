# 🎖️ MILITARY HEADQUARTERS - COMPLETE PROJECT INDEX

## 📋 DOCUMENTATION & GUIDES (Start Here!)

| Document                                                   | Purpose                 | Read When                          |
| ---------------------------------------------------------- | ----------------------- | ---------------------------------- |
| **[FINAL_SETUP_STATUS.md](FINAL_SETUP_STATUS.md)**         | Complete setup overview | First - overview of everything     |
| **[QUICK_START_COMMANDS.md](QUICK_START_COMMANDS.md)**     | Quick reference card    | You forget a command               |
| **[COMPLETE_BACKEND_SETUP.md](COMPLETE_BACKEND_SETUP.md)** | Full backend overview   | Understanding the complete system  |
| **[BACKEND_SETUP.md](BACKEND_SETUP.md)**                   | Detailed setup guide    | Detailed development instructions  |
| **[ARCHITECTURE.md](ARCHITECTURE.md)**                     | System architecture     | Understanding data flow & design   |
| **[MONGODB_SCHEMA.md](MONGODB_SCHEMA.md)**                 | Database schema         | Database questions & design        |
| **[api.http](api.http)**                                   | API endpoint testing    | Testing endpoints with REST Client |

---

## 🚀 GETTING STARTED (5 Minutes)

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB + Express
npm run docker:up

# 3. Start development server
npm run dev

# 4. Test APIs
# Open api.http in VS Code and click "Send Request"
```

**Done!** Your backend is running on `http://localhost:3000`

---

## 📁 PROJECT STRUCTURE

### Root Directory

```
Mili/
├── api.http                      # 50+ API endpoints for testing
├── Dockerfile                    # Production Docker image
├── docker-compose.yml            # MongoDB + Express + UI setup
├── .env.example                  # Environment template
├── jest.config.js                # Testing configuration
├── .eslintrc.js                  # Code quality rules
├── package.json                  # Dependencies & scripts
│
├── server/
│   ├── app.js                    # Main Express server
│   ├── users.json                # Current user data (JSON)
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Procedure.js          # Procedure schema
│   │   └── Admin.js              # Admin schema
│   └── routes/                   # API route files
│
├── src/
│   ├── pages/                    # HTML pages
│   ├── js/                       # JavaScript logic
│   ├── css/                      # Stylesheets
│   └── assets/                   # Images & resources
│
├── tests/
│   ├── setup.js                  # Test environment
│   ├── user.test.js              # User tests
│   └── procedure.test.js          # Procedure tests
│
├── scripts/
│   ├── init.js                   # Project initialization
│   └── migrate.js                # JSON → MongoDB migration
│
├── .vscode/
│   ├── settings.json             # VS Code settings
│   └── tasks.json                # VS Code tasks (11 tasks)
│
└── Documentation/
    ├── FINAL_SETUP_STATUS.md     # Setup overview
    ├── COMPLETE_BACKEND_SETUP.md # Complete guide
    ├── BACKEND_SETUP.md          # Detailed guide
    ├── QUICK_START_COMMANDS.md   # Command reference
    ├── ARCHITECTURE.md           # System design
    └── MONGODB_SCHEMA.md         # Database design
```

---

## 🔧 NPM SCRIPTS

### Development

```bash
npm run dev              # Start with auto-reload (nodemon)
npm start               # Start production server
```

### Testing

```bash
npm test                # Run all tests with coverage
npm run test:watch      # Run tests in watch mode
npm test -- --coverage  # Generate coverage report
```

### Code Quality

```bash
npm run lint            # Check code with ESLint
```

### Docker

```bash
npm run docker:build    # Build Docker image
npm run docker:up       # Start MongoDB + Express + UI
npm run docker:down     # Stop all containers
npm run docker:logs     # View container logs
```

### Database

```bash
npm run db:migrate      # Migrate JSON data to MongoDB
```

---

## 🛠️ VS CODE EXTENSIONS (Installed)

| Extension            | Purpose                        |
| -------------------- | ------------------------------ |
| Jest                 | Unit testing framework         |
| Jest Runner          | Run tests directly from editor |
| Wallaby.js           | Live test execution            |
| Docker               | Container management           |
| REST Client          | API testing (50+ endpoints)    |
| MongoDB for VS Code  | Database management            |
| SQLTools             | Database tools                 |
| SonarLint            | Code quality analysis          |
| GitLens              | Git integration                |
| ESLint               | Code linting                   |
| Conventional Commits | Git commit standards           |
| File Size            | Performance monitoring         |
| Tailwind CSS         | CSS intellisense               |

---

## 📚 KEY FILES TO KNOW

### Frontend (User-facing)

- `src/pages/index.html` - Homepage
- `src/pages/user-dashboard.html` - User portal
- `src/pages/admin-dashboard.html` - Admin interface
- `src/pages/admin-login.html` - Admin authentication
- `src/js/translations.js` - Multi-language support

### Backend (Server-side)

- `server/app.js` - Main Express server (all routes)
- `server/models/User.js` - User data schema
- `server/models/Procedure.js` - Procedure schema
- `server/models/Admin.js` - Admin schema
- `server/config/database.js` - MongoDB connection

### Configuration

- `.env.example` - Environment variables template
- `package.json` - Dependencies & scripts
- `docker-compose.yml` - Docker services
- `.eslintrc.js` - Code quality rules
- `jest.config.js` - Testing configuration

### Testing

- `tests/user.test.js` - User authentication tests
- `tests/setup.js` - Test environment setup
- `api.http` - API endpoint examples

---

## 🌐 API ENDPOINTS

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login
- `POST /api/auth/send-verification-code` - Send verification
- `POST /api/auth/verify` - Verify account

### User Management

- `GET /api/users` - List all users (admin)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user info
- `PUT /api/users/:id/status` - Update status
- `PUT /api/users/:id/health` - Update health info

### Procedures

- `POST /api/users/:id/procedures` - Add procedure
- `GET /api/users/:id/procedures` - Get procedures
- `PUT /api/users/:id/procedures/:procId` - Update procedure
- `DELETE /api/users/:id/procedures/:procId` - Delete procedure

### Spouse/Dependents

- `POST /api/users/:id/spouse` - Add spouse info
- `PUT /api/users/:id/spouse` - Update spouse
- `DELETE /api/users/:id/spouse` - Delete spouse

### Admin Dashboard

- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/user/:id` - User dashboard data

### Search & Filter

- `GET /api/users/search?militaryId=NSS-123456` - Search by ID
- `GET /api/users/filter?rank=Captain` - Filter by rank
- `GET /api/users/filter?status=active` - Filter by status

**See `api.http` for all 50+ endpoints with examples**

---

## 💾 DATABASE SETUP

### Collections Created

1. **Users** - Military personnel with profiles
2. **Procedures** - Tasks/procedures to assign
3. **Admins** - Admin users with roles
4. **Sessions** - JWT token management
5. **Logs** - Audit trail of actions
6. **Files** - Uploaded document tracking

### Connection Details

- **Host**: localhost (or mongodb in Docker)
- **Port**: 27017
- **Database**: military-hq
- **Admin User**: admin
- **Admin Password**: admin123

### Access Admin UI

- **URL**: http://localhost:8081
- **User**: admin
- **Pass**: admin123

---

## 🔐 SECURITY FEATURES

✅ Password hashing (bcryptjs)
✅ JWT authentication with refresh tokens
✅ Helmet security headers
✅ CORS protection
✅ Rate limiting
✅ Input validation & sanitization
✅ Audit logging of all actions
✅ Role-based access control (RBAC)
✅ Soft delete support
✅ Account lockout after failed attempts
✅ Email verification support
✅ Password reset tokens

---

## 📊 DATA MODELS

### User Schema

```javascript
{
  userId,
    militaryId,
    fullName,
    email,
    mobile,
    dob,
    rank,
    status,
    password,
    photoUrl,
    address,
    emergencyContact,
    spouse,
    dependents,
    healthStatus,
    procedures,
    roles,
    isVerified,
    loginHistory,
    auditLog,
    createdAt,
    updatedAt,
    lastLogin;
}
```

### Procedure Schema

```javascript
{
  procedureId,
    name,
    category,
    description,
    requirements,
    estimatedDuration,
    priority,
    isActive,
    createdAt,
    updatedAt;
}
```

### Admin Schema

```javascript
{
  adminId,
    email,
    password,
    fullName,
    role,
    permissions,
    department,
    phone,
    isActive,
    lastLogin,
    auditLog,
    createdAt,
    updatedAt;
}
```

---

## 🚀 DEPLOYMENT

### Docker Commands

```bash
# Build image
docker build -t military-hq:latest .

# Run container
docker run -p 3000:3000 military-hq:latest

# Or use Docker Compose
docker-compose up -d
```

### Cloud Deployment

Supports deployment to:

- Heroku
- AWS (ECS, Elastic Beanstalk)
- Google Cloud (Cloud Run, GKE)
- Azure (Container Instances, AKS)
- DigitalOcean (App Platform)
- Kubernetes

---

## 📞 TROUBLESHOOTING

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### MongoDB Connection Failed

```bash
# Check MongoDB is running
docker ps | grep mongodb

# View logs
npm run docker:logs

# Check connection string in .env
cat .env | grep MONGODB_URI
```

### Tests Failing

```bash
# Clear jest cache
npx jest --clearCache

# Run with verbose output
npm test -- --verbose
```

### Docker Issues

```bash
# Stop and remove all containers
npm run docker:down

# Clean up all unused resources
docker system prune -a

# Rebuild everything
npm run docker:build
npm run docker:up
```

---

## 📈 PROJECT STATISTICS

| Metric               | Count           |
| -------------------- | --------------- |
| Extensions Installed | 13              |
| API Endpoints        | 50+             |
| Database Collections | 6               |
| Test Files           | 2               |
| Configuration Files  | 5               |
| Documentation Files  | 8               |
| NPM Scripts          | 10              |
| VS Code Tasks        | 11              |
| Lines of Code        | 1000+           |
| Development Time     | Ready to use ✅ |

---

## ✨ WHAT'S READY FOR USE

✅ Complete user authentication system
✅ Role-based admin dashboard
✅ Multi-language support
✅ Procedure assignment system
✅ Spouse/dependent management
✅ Health status tracking
✅ User search & filtering
✅ Audit logging
✅ File upload support
✅ Email verification
✅ Password reset
✅ Session management
✅ Database backup capabilities
✅ Docker deployment
✅ API testing framework
✅ Unit test examples
✅ Production-ready code

---

## 🎯 NEXT STEPS

1. **First Time?** Read `QUICK_START_COMMANDS.md`
2. **Install**: Run `npm install`
3. **Environment**: Copy `.env.example` to `.env`
4. **Start Services**: Run `npm run docker:up`
5. **Dev Server**: Run `npm run dev`
6. **Test APIs**: Open `api.http` in VS Code
7. **Run Tests**: Run `npm test`

---

## 📖 DOCUMENTATION MAP

```
START HERE
    ↓
QUICK_START_COMMANDS.md (quick reference)
    ↓
    ├─→ BACKEND_SETUP.md (detailed setup)
    ├─→ api.http (API examples)
    └─→ ARCHITECTURE.md (system design)
         ↓
    MONGODB_SCHEMA.md (database design)
    FINAL_SETUP_STATUS.md (complete overview)
```

---

## 🏁 STATUS

**✅ COMPLETE**

- All extensions installed
- All files created
- All configurations done
- All documentation written
- All scripts ready
- **Ready for development** 🎉

---

**Last Updated**: December 27, 2025
**Status**: Production Ready ✅
**Version**: 1.0.0

**Questions?** Check the documentation files above or review the relevant code files.

---

## Quick Links

- [Quick Start Commands](QUICK_START_COMMANDS.md)
- [API Testing](api.http)
- [Database Schema](MONGODB_SCHEMA.md)
- [System Architecture](ARCHITECTURE.md)
- [Backend Setup](BACKEND_SETUP.md)
- [Complete Overview](COMPLETE_BACKEND_SETUP.md)

**Ready to build something amazing!** 🚀
