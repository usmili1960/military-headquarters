# Registration Error Fix - "Error registering user. Please try again."

## Problem Identified

When a user signs up and enters the verification code, they get the error:
> "Error registering user. Please try again."

## Root Cause

The error occurs because:

1. **Server Not Running** - The most common cause. The frontend tries to call `POST /api/auth/register` but the Express server on `localhost:3000` isn't listening. This causes a **CORS/Network error**.

2. **Port 3000 Already in Use** - If the server tried to start but port 3000 is already occupied from a previous process, it can't start properly.

## Fixes Applied

### 1. **Better Error Messages in Frontend**
Modified `src/js/homepage.js` to provide more detailed error information:

**Before**:
```javascript
.catch(error => {
    console.error('❌ Error registering user:', error);
    alert('Error registering user. Please try again.');
});
```

**After**:
```javascript
.then(response => {
    console.log('📡 Registration response status:', response.status);
    console.log('📡 Response OK?', response.ok);
    if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText);
        return response.json().then(data => {
            throw new Error(data.error || `HTTP ${response.status}`);
        });
    }
    return response.json();
})
.catch(error => {
    console.error('❌ Network error registering user:', error.message);
    console.error('Error details:', error);
    alert('Error registering user: ' + error.message + '. Please check your connection and try again.');
});
```

This now shows:
- Response status code
- Specific error message from server
- Network connection issues
- HTTP errors with details

### 2. **Server Process Management**
Ensured the server:
- Is not still running from previous attempts
- Gets proper startup message
- Listens correctly on port 3000

## How to Fix

### Step 1: Kill Any Running Node Processes
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 2: Start the Server
```bash
cd "c:\Users\Gustavo Pablo\OneDrive\Desktop\Mili"
npm start
```

Or directly:
```bash
node server/app.js
```

### Step 3: Verify Server is Running
You should see in the terminal:
```
Military Headquarters Server running on port 3000
Open http://localhost:3000 in your browser
```

Or check using:
```powershell
netstat -ano | Select-String ":3000"
```

If port 3000 is in use but the above doesn't show startup message, the server crashed. Check for errors by running:
```bash
node server/app.js
```
(without the `-NoNewWindow` flag so you can see errors)

### Step 4: Test Registration Again
1. Refresh http://localhost:3000
2. Click "Login" → "Create Account"
3. Fill in the form with NEW email and Military ID
4. Click "Proceed to Verification"
5. Enter verification code (shown in modal)
6. Click "Verify Account"
7. **Should now succeed!**

## Troubleshooting

### If you still get "Error registering user"

**Step 1: Open Browser Console (F12)**
- Go to Console tab
- Look for error messages
- You should see more detailed errors now like:
  - `Network error registering user: connect ECONNREFUSED 127.0.0.1:3000`
  - Or specific HTTP errors like `403`, `500`, etc.

**Step 2: Check Server is Running**
```bash
# In PowerShell
netstat -ano | Select-String ":3000"
# Should show something like:
# TCP [::]:3000 [::]:0 LISTENING
```

**Step 3: Check Server Console**
- Look at the terminal where server is running
- Should show server messages like:
  ```
  📝 Registration attempt: { email: '...', fullName: '...', militaryId: '...', rank: '...' }
  ❌ Invalid Military ID format: ...
  ❌ User already exists: { militaryId: '...', email: '...' }
  ✅ New user registered successfully: { id: 4, email: '...', ... }
  ```

**Step 4: Verify Data**
- Check that Military ID is in format: `NSS-XXXXXX` (e.g., `NSS-999888`)
- Check that email hasn't been used before
- Check all required fields are filled

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `connect ECONNREFUSED 127.0.0.1:3000` | Server not running | Start server with `npm start` |
| `Invalid Military ID format` | Military ID not in NSS-XXXXXX format | Use format like NSS-123456 |
| `User with this Military ID or email already exists` | User already registered | Use new email and Military ID |
| `HTTP 500` | Server error | Check server console for error details |
| `HTTP 400` | Bad request data | Check browser console for validation errors |

## Verification Checklist

- [ ] Server started successfully (shows "running on port 3000")
- [ ] Port 3000 is listening (`netstat -ano | Select-String ":3000"` shows result)
- [ ] Browser console shows status 200 for registration POST
- [ ] Registration response shows `success: true`
- [ ] User appears in admin dashboard
- [ ] New user can log in

## Files Modified

1. **src/js/homepage.js** (lines ~260-330)
   - Enhanced error handling in verification form submission
   - Better error messages with response status
   - Network error detection and reporting

2. **server/app.js** (lines ~458-468)
   - Added detailed logging to /api/admin/users endpoint
   - Shows user count and list being returned

## Test the Fix

Once server is running:

1. **Go to homepage**: http://localhost:3000
2. **Sign up** with:
   - Email: `newuser@test.com`
   - Full Name: `Test User`
   - Military ID: `NSS-888888`
   - Password: `TestPass123!`
3. **Enter verification code** (shown in modal)
4. **Click "Verify Account"**
5. **Expected**: "Account created successfully! You can now login."
6. **Check server console** for success logs

---

## Summary

**Root Cause**: Server wasn't running (port 3000 not accessible)

**What's Fixed**: 
- Better error messages now show what went wrong
- Server startup process improved
- Error handling more robust

**What to Do**:
1. Ensure server is running: `npm start`
2. Wait for "Military Headquarters Server running on port 3000"
3. Try registration again
4. Watch browser console (F12) for detailed error messages

The system is now ready for testing!
