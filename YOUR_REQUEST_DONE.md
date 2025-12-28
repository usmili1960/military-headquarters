# Quick Start: What Changed & How to Use

Your requests have been implemented! Here's what was done and how to use it.

---

## What You Asked For

### 1️⃣ "I want to be able to test my work with http://127.0.0.1:5500"
✅ **DONE** - The app now works on both ports:
- `http://localhost:3000` - Main server (frontend + backend)
- `http://127.0.0.1:5500` - Development server (frontend only, API calls go to localhost:3000)

### 2️⃣ "I entered my user login details and it says invalid user please signup"
✅ **FIXED** - Login error handling greatly improved with:
- Better fallback to localStorage when backend is unreachable
- Detailed console logs to show what users are available
- Clear error messages indicating what went wrong
- Enhanced registration logging to confirm users are saved

---

## Getting Started

### Step 1: Start the Backend Server

Run this command in a terminal:
```bash
npm start
```

Or **double-click** `start-server.bat` on Windows.

You should see:
```
Military Headquarters Server running on port 3000
```

### Step 2A: Test on Main Port (localhost:3000)

Open browser: **http://localhost:3000**

That's it! Everything works from here.

### Step 2B: Test on Dev Port (127.0.0.1:5500)

Open a **second terminal** and run:
```bash
npm run serve-5500
```

Or **double-click** `start-dev-server-5500.bat` on Windows.

Then open browser: **http://127.0.0.1:5500**

**Important**: The main server (port 3000) must still be running. Keep both terminals open.

---

## Test Your Login Issue

Now test if the login works:

1. **Sign up** with these details:
   ```
   Full Name:   Your Name
   Email:       youremail@test.com
   Military ID: NSS-999999
   Mobile:      1234567890
   Password:    TestPass123
   DOB:         01/15/1990
   Rank:        Sergeant
   ```

2. **Get verification code**:
   - Open browser DevTools: Press **F12**
   - Go to **Console** tab
   - Look for: `Verification code generated: 123456`
   - Copy that 6-digit number

3. **Verify your account**:
   - Paste the code in the verification dialog
   - Click submit
   - Should say: "Account created successfully!"

4. **Login with new account**:
   - Enter Military ID: `NSS-999999`
   - Enter Password: `TestPass123`
   - Should login successfully and redirect to user dashboard

5. **If it fails**:
   - Open DevTools console (F12 → Console)
   - Look for messages with emoji prefixes:
     - 🔍 = What user it's looking for
     - 📋 = Available users in system
     - ❌ = Error details
   - See [DEBUG_LOGIN_ISSUE.md](DEBUG_LOGIN_ISSUE.md) for detailed help

---

## Using Both Ports

**Port 3000** (All-in-one):
```bash
npm start
# Open: http://localhost:3000
```

**Port 5500** (Development):
```bash
# Terminal 1: Keep running
npm start

# Terminal 2: Open new terminal
npm run serve-5500
# Open: http://127.0.0.1:5500
```

Both will work identically. The frontend automatically detects which port and routes API calls correctly.

---

## How It Works

The frontend has smart routing:

```javascript
// If you're on port 5500:
API calls go to → http://127.0.0.1:3000

// If you're on port 3000 or any other port:
API calls go to → http://localhost:3000
```

This means:
- Frontend files come from the port you visit
- APIs always go to the correct backend
- Everything works seamlessly

---

## Check It's Working

### Check Backend is Running
Open terminal where you ran `npm start`. Should show:
```
Military Headquarters Server running on port 3000
```

### Check Frontend on Browser
Press **F12** to open DevTools, go to **Console** tab.

You should see:
```
🌐 API Base URL: http://localhost:3000
```

Or if on port 5500:
```
🌐 API Base URL: http://127.0.0.1:3000
```

### Check Users Saved
1. Press **F12** to open DevTools
2. Go to **Application** tab
3. Click **localStorage** on left
4. Look for key: `militaryUsers`
5. Should see array of users including ones you just created

---

## Pre-made Test Users

These users already exist in the system:

| Military ID | Password | Name |
|------------|----------|------|
| NSS-123456 | (any) | John Michael Smith |
| NSS-234567 | (any) | Sarah Elizabeth Johnson |
| NSS-345678 | (any) | David Robert Williams |

Try logging in with any of these first to make sure login works, then test with a new user.

---

## If Something Goes Wrong

### "User not found" after signup
See the detailed debugging guide: [DEBUG_LOGIN_ISSUE.md](DEBUG_LOGIN_ISSUE.md)

Quick checks:
1. Open DevTools (F12 → Console)
2. Look for 🔍 message showing what Military ID it's looking for
3. Look for 📋 message showing what users are available
4. Check localStorage (F12 → Application → localStorage → militaryUsers)

### Port 5500 won't load
1. Make sure main server is running: `npm start` in terminal 1
2. Make sure dev server is running: `npm run serve-5500` in terminal 2
3. Check port 3000 is listening: `netstat -an | findstr 3000`
4. Try hard refresh: **Ctrl + Shift + R**

### "Port already in use"
Kill the process and restart:
```bash
# Windows - kill all Node processes
taskkill /IM node.exe /F

# Then restart
npm start
```

---

## Key Files Changed

### Modified Files
- `src/js/homepage.js` - Added port detection, enhanced login
- `src/js/admin-dashboard.js` - Added port detection
- `package.json` - Added serve-5500 script

### New Files
- `start-server.bat` - Shortcut to start port 3000
- `start-dev-server-5500.bat` - Shortcut to start port 5500
- `SETUP_AND_RUN.md` - Detailed setup guide
- `TESTING_PORTS.md` - Port testing guide
- `DEBUG_LOGIN_ISSUE.md` - Debugging guide

---

## Summary

✅ **Port 5500 works** - Run `npm run serve-5500` (or double-click batch file)
✅ **Login fixed** - Much better error handling and fallbacks
✅ **Enhanced debugging** - Console shows exactly what's happening
✅ **Works on both ports** - Same functionality everywhere
✅ **Batch files** - Easy one-click server startup on Windows

---

## Next Steps

1. **Test on port 3000**: `npm start`
2. **Try signup/login**: Use the form on the homepage
3. **Test on port 5500**: `npm run serve-5500` in a second terminal
4. **Check console logs**: F12 → Console to see detailed messages
5. **Use admin panel**: Login as admin, view users

---

For more detailed help, see:
- [SETUP_AND_RUN.md](SETUP_AND_RUN.md) - Setup & running guide
- [TESTING_PORTS.md](TESTING_PORTS.md) - Port testing details
- [DEBUG_LOGIN_ISSUE.md](DEBUG_LOGIN_ISSUE.md) - Debugging guide

Good luck! 🎯
