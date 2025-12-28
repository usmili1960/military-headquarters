# Testing on Different Ports

This guide explains how to test the Military Headquarters application on different ports.

## Default Setup (localhost:3000)

The default configuration serves the application on **port 3000**.

### Starting:
```bash
npm start
```

Then open in browser:
- **Frontend**: http://localhost:3000
- **API Base**: http://localhost:3000

---

## Testing on Port 5500 (127.0.0.1:5500)

You can test the frontend on **port 5500** while the backend stays on **port 3000**. This is useful for testing different port configurations.

### Setup:

1. **Start the backend server (port 3000)** in one terminal:
```bash
npm start
```

2. **Start static file server (port 5500)** in another terminal:
```bash
npm run serve-5500
```

Then open in browser:
- **Frontend**: http://127.0.0.1:5500
- **API Base**: http://localhost:3000 (automatic redirect)
- **Pages**: 
  - Homepage: http://127.0.0.1:5500/pages/index.html
  - User Dashboard: http://127.0.0.1:5500/pages/user-dashboard.html
  - Admin Login: http://127.0.0.1:5500/pages/admin-login.html
  - Admin Dashboard: http://127.0.0.1:5500/pages/admin-dashboard.html

### How It Works:

The frontend files have been updated to automatically detect the port:

```javascript
const API_BASE = (window.location.hostname === '127.0.0.1' && window.location.port === '5500') 
    ? 'http://127.0.0.1:3000' 
    : 'http://localhost:3000';
```

This means:
- If you access from `http://127.0.0.1:5500`, API calls go to `http://127.0.0.1:3000`
- If you access from `http://localhost:3000`, API calls go to `http://localhost:3000`
- If you access from any other port, API calls default to `http://localhost:3000`

---

## Test Credentials

### User Login:
- **Military ID**: `NSS-123456`
- **Password**: Any value (no validation)

### Admin Login:
- **Email**: Any value
- **Password**: Any value

### New User Registration:
1. Click "Sign up here" on the login modal
2. Fill in all fields with valid data:
   - **Military ID Format**: `NSS-XXXXXX` (e.g., NSS-999999)
   - **Email**: Must be unique
   - **Password**: Stored in localStorage
3. Verify with the 6-digit code (printed in browser console)
4. Login with your new credentials

---

## Debugging Tips

### Check Console Logs:
- Open browser DevTools: **F12**
- Go to **Console** tab
- Look for messages with emoji prefixes:
  - ✅ = Success
  - ❌ = Error
  - 📡 = Network request
  - 🔐 = Authentication
  - 💾 = Storage

### Check localStorage:
- Open browser DevTools: **F12**
- Go to **Application** tab
- Click **localStorage** on left sidebar
- Check `militaryUsers` array and `currentUser` object

### Check Server Logs:
- Terminal where you ran `npm start` will show:
  - 📝 Registration attempts
  - 🔐 Login attempts
  - ✅ User found
  - ❌ Errors

---

## Troubleshooting

### "User not found. Please sign up first"
- Newly registered users are saved to localStorage
- Check if browser is blocked from accessing localStorage
- Check browser console for detailed error logs
- Verify the Military ID format is exactly `NSS-XXXXXX`

### "API request failed"
- Make sure backend is running: `npm start` (should show "listening on port 3000")
- Check that no other service is using port 3000
- If using port 5500, make sure `npm run serve-5500` is running

### "Server not responding"
- Kill any existing Node processes:
  ```bash
  # Windows:
  taskkill /PID <process_id> /F
  
  # Or use:
  taskkill /IM node.exe /F
  ```
- Then restart: `npm start`

---

## Port Configuration Details

| URL | Component | Port | Type |
|-----|-----------|------|------|
| http://localhost:3000 | Frontend + Backend | 3000 | All-in-one |
| http://127.0.0.1:5500 | Frontend only | 5500 | Static files |
| http://127.0.0.1:3000 | Backend only | 3000 | API endpoints |

**Note**: The frontend automatically redirects API calls to the correct backend port based on where it's loaded from.

---

## Next Steps

After testing works on both ports:
1. Register a new user on each port
2. Login with different credentials
3. Check the admin dashboard (localStorage fallback works)
4. Try password reset and verification flows

For production deployment, you would:
- Set `API_BASE` to your production server
- Use environment variables instead of hardcoded detection
- Implement proper CORS policies
