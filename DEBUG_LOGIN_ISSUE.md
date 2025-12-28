# Debugging: Newly Registered User Can't Login

If you see the error **"User not found. Please sign up first"** after creating a new account, follow this guide.

## Quick Check

### Step 1: Look at Browser Console
1. Open the page in your browser
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for logs with 🔍 and 📋 prefixes

You should see something like:
```
🔍 Looking for user with Military ID: NSS-999999
📋 Available users: ["NSS-123456", "NSS-234567"]
```

If your Military ID is NOT in the list, the user wasn't saved properly.

### Step 2: Check localStorage
1. In DevTools, go to **Application** tab
2. Click **localStorage** on the left
3. Find **militaryUsers** key
4. Click to expand and see all users

You should see your newly created user in the list with:
- `militaryId`: Should match what you entered during signup
- `password`: Your signup password
- `fullName`: Your name from signup
- `email`: Your email from signup

### Step 3: Check Server Console
Look at the terminal where you ran `npm start`:

When you signup, you should see:
```
✅ User registered successfully
```

If you DON'T see this message, the registration failed on the backend.

## Common Issues & Solutions

### Issue 1: Military ID Format Wrong

**Problem**: You entered "NSS-123456" during signup but trying to login with "NSS-123456 " (extra space)

**Solution**: 
- Check exact format: `NSS-XXXXXX` where X = digit 0-9
- No spaces, hyphens must be in the right place
- Look in browser console for: `🔍 Looking for user with Military ID:`
- Compare carefully with what you typed during signup

### Issue 2: User Not in localStorage

**Problem**: Browser cleared localStorage or blocked from saving

**Solution**:
1. Check browser privacy settings
2. Make sure cookies/storage is allowed for localhost:3000
3. Try again in a new Incognito window
4. Check browser console for errors like "QuotaExceededError"

### Issue 3: Registration Failed Silently

**Problem**: Saw "Account created successfully!" but user wasn't actually saved

**Solution**:
1. Check server console - look for ❌ error messages
2. Make sure backend is running on port 3000
3. Try signup again with a different email
4. Watch console for detailed error message

### Issue 4: Two Tabs/Windows Problem

**Problem**: Signed up in one window, trying to login in another private window

**Solution**:
- Each browser tab/window has separate localStorage
- Either use the SAME window for signup and login
- Or share data by copying the `militaryUsers` localStorage value between windows

## Step-by-Step Verification

Follow this process to test if everything works:

### Test 1: Create New User
1. Go to http://localhost:3000 (or http://127.0.0.1:5500)
2. Click "Sign up here"
3. **Carefully** enter:
   ```
   Full Name:   Test User
   Email:       testuser@example.com
   Military ID: NSS-999999
   Mobile:      1234567890
   Password:    TestPassword123
   DOB:         01/15/1990
   Rank:        Sergeant
   ```
4. Click "Next" to get verification code
5. **Copy the 6-digit code from console** (look for "Verification code generated:")
6. Paste it in verification dialog
7. Should see: "Account created successfully! You can now login."
8. **Open browser DevTools console** - should see:
   ```
   💾 Preparing to save user to localStorage: {id: ..., fullName: "Test User", ...}
   ✅ User saved to localStorage. Total users now: X
   📋 Users in localStorage: [{militaryId: "NSS-999999", fullName: "Test User"}]
   ```

### Test 2: Login with New User
1. Click "Login" button (modal should already be visible)
2. Enter:
   ```
   Military ID: NSS-999999
   Password:    TestPassword123
   ```
3. Click "Login"
4. **Open browser DevTools console** - should see either:
   
   **Success** (backend found user):
   ```
   ✅ User found in backend
   ✅ Login successful! Redirecting to user dashboard...
   ```
   
   **Success** (localStorage backup):
   ```
   ❌ Backend login error: ...
   Falling back to localStorage...
   📊 Checking against X users in localStorage
   🔍 Users in localStorage: [{militaryId: "NSS-999999", fullName: "Test User"}]
   ✅ User found in localStorage: {fullName: "Test User", militaryId: "NSS-999999"}
   ✅ Login successful from localStorage
   ```
   
   **Failure**:
   ```
   ❌ User not found with Military ID: NSS-999999
   📋 Available users: ["NSS-123456", "NSS-234567"]
   ```

## Still Stuck?

If you've checked everything above and still can't login:

1. **Take a screenshot** of:
   - The browser console output during signup
   - The browser console output during login
   - The localStorage content (Application > localStorage > militaryUsers)
   
2. **Check what you see** in the "No users found" message:
   - What Military IDs are shown?
   - Is your Military ID in the list?
   
3. **Verify the server** is running:
   - Terminal should show: `Military Headquarters Server running on port 3000`
   - Or for port 5500: `Development Server running on http://localhost:5500`

## Quick Reset

If everything seems broken, try this nuclear option:

1. **Clear localStorage**:
   ```javascript
   // Paste this in browser console
   localStorage.clear();
   console.log('✅ localStorage cleared');
   ```

2. **Restart server**:
   - Kill the terminal (Ctrl+C)
   - Run `npm start` again

3. **Refresh page**:
   - Press Ctrl+Shift+R (hard refresh)
   - Try signup again from scratch

---

## Key Debugging Commands

Paste these in browser console to debug:

### Check all users
```javascript
JSON.parse(localStorage.getItem('militaryUsers')).map(u => ({ 
  militaryId: u.militaryId, 
  fullName: u.fullName, 
  email: u.email 
}))
```

### Find specific user
```javascript
JSON.parse(localStorage.getItem('militaryUsers')).find(u => u.militaryId === 'NSS-999999')
```

### Add a test user manually
```javascript
const users = JSON.parse(localStorage.getItem('militaryUsers')) || [];
users.push({
  id: 'test-123',
  militaryId: 'NSS-999999',
  fullName: 'Test User',
  email: 'test@example.com',
  password: 'testpass',
  mobile: '1234567890'
});
localStorage.setItem('militaryUsers', JSON.stringify(users));
console.log('✅ Test user added');
```

### Check API Base URL
```javascript
console.log('API_BASE:', API_BASE);
```

---

For additional help, check the main [TESTING_PORTS.md](TESTING_PORTS.md) guide.
