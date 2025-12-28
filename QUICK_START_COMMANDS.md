# 🚀 Quick Start Commands

## Development

```bash
# Install dependencies (first time only)
npm install

# Start development server (auto-reloads)
npm run dev

# Start production server
npm start

# API testing with REST Client (open api.http in VS Code)
# Click "Send Request" above any endpoint
```

## Testing & Code Quality

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm test -- --coverage

# Lint JavaScript code
npm run lint
```

## Docker & Database

```bash
# Start MongoDB, Express, and Mongo Express
npm run docker:up

# Stop all Docker services
npm run docker:down

# View Docker logs
npm run docker:logs

# Migrate data from users.json to MongoDB
npm run db:migrate

# Build Docker image for production
npm run docker:build
```

## Available Services (after docker:up)

| Service          | URL                       | Credentials      |
| ---------------- | ------------------------- | ---------------- |
| Express Backend  | http://localhost:3000     | -                |
| MongoDB          | mongodb://localhost:27017 | admin / admin123 |
| Mongo Express UI | http://localhost:8081     | admin / admin123 |

## API Testing Examples

### Register New User

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "fullName": "John Smith",
  "militaryId": "NSS-123456",
  "email": "john@military.gov",
  "mobile": "+1-202-555-0123",
  "dob": "1985-06-15",
  "rank": "Captain",
  "password": "SecurePass123!"
}
```

### Login

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "militaryId": "NSS-123456",
  "password": "SecurePass123!"
}
```

### Get All Users (Admin)

```http
GET http://localhost:3000/api/users
```

### Update User

```http
PUT http://localhost:3000/api/users/1
Content-Type: application/json

{
  "fullName": "John Smith Updated",
  "rank": "Major"
}
```

## VS Code Tasks

Press `Ctrl+Shift+B` to open task palette:

- **Start Development Server** - Runs `npm run dev`
- **Run Tests** - Runs test suite
- **Lint Code** - Checks code quality
- **Docker: Start Services** - Launches MongoDB stack
- **Docker: Stop Services** - Stops all containers
- **Database: Migrate** - Moves data to MongoDB

## Important Files

| File                    | Purpose                            |
| ----------------------- | ---------------------------------- |
| `api.http`              | 50+ documented API endpoints       |
| `.env.example`          | Environment configuration template |
| `docker-compose.yml`    | Full stack deployment config       |
| `BACKEND_SETUP.md`      | Detailed setup documentation       |
| `MONGODB_SCHEMA.md`     | Database structure documentation   |
| `server/models/User.js` | User database schema               |
| `jest.config.js`        | Testing framework config           |
| `.eslintrc.js`          | Code quality rules                 |

## Troubleshooting

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Docker Issues

```bash
# Remove all containers & volumes
npm run docker:down
docker system prune -a

# Rebuild from scratch
npm run docker:build
npm run docker:up
```

### Database Connection Failed

```bash
# Check MongoDB is running
docker ps | grep mongodb

# Check logs
npm run docker:logs

# Verify connection string in .env
cat .env | grep MONGODB_URI
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update values for your setup:
   ```bash
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/military-hq
   JWT_SECRET=your-secret-key
   ```

## 📚 Full Documentation

- **COMPLETE_BACKEND_SETUP.md** - Complete overview
- **BACKEND_SETUP.md** - Detailed setup guide
- **MONGODB_SCHEMA.md** - Database documentation
- **api.http** - All API endpoints with examples

---

**Ready to develop?** Start with: `npm run docker:up && npm run dev`
