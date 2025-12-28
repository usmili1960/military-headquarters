# Setup & Test Guide

## Quick Start

### 1. Start Main Server (Port 3000)

**Option A - Using npm:**
```bash
npm start
```

**Option B - Using batch file (Windows):**
Double-click `start-server.bat`

You should see:
```
Military Headquarters Server running on port 3000
Open http://localhost:3000 in your browser
```

### 2. Test on Port 3000
Open in browser: **http://localhost:3000**

---

## Testing on Port 5500

If you want to test on **http://127.0.0.1:5500** instead (for development flexibility):

### Prerequisites
1. Main server must be running on port 3000 (see above)
2. `http-server` package will be installed automatically when you run the command

### Start Development Server on Port 5500

**Option A - Using npm:**
```bash
npm run serve-5500
```

**Option B - Using batch file (Windows):**
Double-click `start-dev-server-5500.bat`

You should see:
```
Starting up http-server, serving src
Available on:
  http://127.0.0.1:5500
  http://localhost:5500
  ...
```

### Test on Port 5500
Open in browser: **http://127.0.0.1:5500**

---

## How Port 5500 Works

The frontend automatically detects which port you're on and routes API calls correctly:

```javascript
// In src/js/homepage.js and src/js/admin-dashboard.js

const API_BASE = (window.location.hostname === '127.0.0.1' && window.location.port === '5500') 
    ? 'http://127.0.0.1:3000'    // If on port 5500, call port 3000 for APIs
    : 'http://localhost:3000';     // Otherwise use localhost:3000
```

**Summary:**
- Port 3000: Frontend + Backend (all-in-one)
- Port 5500: Frontend only (static files from `src/` directory)
- API calls from 5500 → automatically routed to Backend on 3000

---

## Both Servers Running Together

If you want to test with both running:

**Terminal 1:**
```bash
npm start
```

**Terminal 2:**
```bash
npm run serve-5500
```

Then open:
- http://localhost:3000 → Uses port 3000 for APIs
- http://127.0.0.1:5500 → Uses port 3000 for APIs

---

## Troubleshooting

### "Cannot find module 'http-server'"
Run this once:
```bash
npm install -g http-server
```

### "Port 3000 already in use"
Kill the process using port 3000:
```bash
# Windows:
taskkill /PID <process_id> /F

# Or kill all Node processes:
taskkill /IM node.exe /F
```

Then restart `npm start`

### "User not found" after signup
See [DEBUG_LOGIN_ISSUE.md](DEBUG_LOGIN_ISSUE.md) for detailed debugging steps.

---

## Test Users

### Pre-made Users (Already in System)
- **Military ID**: `NSS-123456` | **Password**: (any value)
- **Military ID**: `NSS-234567` | **Password**: (any value)
- **Military ID**: `NSS-345678` | **Password**: (any value)

### Create New User
1. Click "Sign up here"
2. Fill form with:
   - **Military ID**: Must be `NSS-XXXXXX` format (e.g., `NSS-999999`)
   - **Email**: Unique email address
   - **Password**: Any value
3. Submit and get 6-digit code from browser console (F12 → Console)
4. Verify the code
5. Login with your new credentials

---

## File Changes for Port 5500 Support

The following files were updated to support port 5500:

### 1. `src/js/homepage.js` (Lines 4-7)
Added API_BASE detection:
```javascript
const API_BASE = (window.location.hostname === '127.0.0.1' && window.location.port === '5500') 
    ? 'http://127.0.0.1:3000' 
    : 'http://localhost:3000';
```

### 2. `src/js/admin-dashboard.js` (Lines 3-6)
Same API_BASE detection added.

### 3. All API calls
Changed from:
```javascript
fetch('http://localhost:3000/api/...')
```

To:
```javascript
fetch(API_BASE + '/api/...')
```

### 4. `package.json` (Scripts)
Added new script:
```json
"serve-5500": "npx http-server src -p 5500 -c-1"
```

---

## Next Steps

1. **[Test signup/login](DEBUG_LOGIN_ISSUE.md)** - Follow the debugging guide
2. **Test admin panel** - Go to `/pages/admin-login.html`
3. **Test multi-language** - Click language selector (EN, ES, JA, KO)
4. **Test user dashboard** - After logging in
5. **Test procedures** - Add/edit procedures in admin dashboard

---

## Architecture Summary

```
┌─────────────────────────────────────────────┐
│     Browser on localhost:3000               │
│   (Frontend + Backend API)                  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   src/pages/index.html               │  │
│  │   src/js/homepage.js                 │  │
│  │   src/css/style.css                  │  │
│  └──────────────────────────────────────┘  │
│           ↓ Fetch to API_BASE              │
│           ↓ (localhost:3000)               │
│  ┌──────────────────────────────────────┐  │
│  │   server/app.js (Express backend)    │  │
│  │   In-memory user storage             │  │
│  │   API endpoints: /api/*              │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

                    OR

┌──────────────────────┐    ┌──────────────────────┐
│Browser on 127.0.0.1  │    │  127.0.0.1:3000      │
│      :5500           │    │  (Backend API only)  │
│ (Frontend only)      │    │                      │
│                      │    │ server/app.js        │
│  src/pages/          │    │ /api/* endpoints     │
│  src/js/             │───→│                      │
│  API_BASE points to  │    │ In-memory storage    │
│  127.0.0.1:3000     │    │                      │
└──────────────────────┘    └──────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `server/app.js` | Backend server, API endpoints, user storage |
| `src/js/homepage.js` | Login, signup, forgot password flows |
| `src/js/admin-dashboard.js` | Admin panel, user management |
| `src/pages/index.html` | Homepage with login/signup modals |
| `src/pages/user-dashboard.html` | User dashboard after login |
| `src/pages/admin-dashboard.html` | Admin user management panel |
| `start-server.bat` | Shortcut to start main server (Windows) |
| `start-dev-server-5500.bat` | Shortcut to start port 5500 server (Windows) |

---

## Debug Commands

**Check which ports are listening:**
```bash
# Windows:
netstat -an | findstr "3000" or "5500"

# Mac/Linux:
lsof -i :3000
lsof -i :5500
```

**Check localStorage in browser:**
- F12 → Application → localStorage
- Look for `militaryUsers` and `currentUser`

**Check API_BASE in browser console:**
```javascript
console.log(API_BASE);
```

---

For detailed debugging help, see [DEBUG_LOGIN_ISSUE.md](DEBUG_LOGIN_ISSUE.md)
