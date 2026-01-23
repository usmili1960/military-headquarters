# Testing the User Approval System

## Issue Resolved ✅

The approval system was not working because the registration was happening through the **homepage modal** (with verification code), not through the dedicated signup page.

## Changes Made

### 1. Updated Homepage Registration Handler
**File:** `src/js/homepage.js`

Added logic to detect when a user requires approval and redirect them to the pending approval page instead of the login modal.

### 2. Server Restarted
The server has been restarted to apply all the database schema changes and API endpoint updates.

## How to Test the Approval System

### Test Scenario 1: Register a New User

1. **Go to Homepage**
   - Open: http://localhost:3000

2. **Click "Sign In/Sign Up" button**
   - The login modal will appear

3. **Click "Sign Up" link**
   - This opens the signup modal with verification

4. **Fill out the registration form:**
   - Full Name: Test User
   - Military ID: NSS-999999 (or any unique 6-digit number)
   - Email: test@example.com
   - Mobile: +1234567890
   - Date of Birth: (select a date)
   - Rank: Private
   - Password: Test@123
   - Confirm Password: Test@123

5. **Submit the form**
   - A verification code will be generated
   - The code will be displayed on screen (since SMS isn't configured yet)

6. **Enter the verification code**
   - Copy the 6-digit code shown
   - Paste it in the verification field
   - Click "Verify"

7. **Expected Result:**
   - ✅ You should see: "Account created successfully! Your account is pending admin approval."
   - ✅ You will be redirected to: `pending-approval.html`
   - ✅ The pending page shows:
     * Your name
     * Your military ID
     * Your email
     * Status: "Pending Approval"
     * Information about what happens next

### Test Scenario 2: Try to Login (Before Approval)

1. **Go back to homepage**
   - Click "Back to Home" button

2. **Click "Sign In/Sign Up"**

3. **Try to login with your new account:**
   - Military ID: NSS-999999
   - Password: Test@123

4. **Expected Result:**
   - ✅ You should see: "Your account is pending admin approval"
   - ✅ You will be redirected back to the pending approval page
   - ❌ You CANNOT access the dashboard

### Test Scenario 3: Admin Approves User

1. **Login as Admin**
   - Go to: http://localhost:3000/pages/admin-login.html
   - Email: admin@military.gov
   - Password: Admin@12345

2. **View Pending Users**
   - You should see the new user in the table
   - Look for the "Approval Status" column
   - Your new user should show: **PENDING** (yellow/gray badge)

3. **Approve the User**
   - Find your user (NSS-999999) in the list
   - You'll see two buttons:
     * 🟢 **Approve** (green button)
     * 🔴 **Reject** (red button)
   - Click the **Approve** button
   - Confirm the approval in the dialog

4. **Expected Result:**
   - ✅ Success message appears
   - ✅ The user's status changes to **APPROVED** (green badge)
   - ✅ The buttons change from "Approve/Reject" to "View/Edit"

### Test Scenario 4: User Logs In (After Approval)

1. **Logout from Admin Dashboard**

2. **Go back to homepage**
   - http://localhost:3000

3. **Login with the approved account:**
   - Military ID: NSS-999999
   - Password: Test@123

4. **Expected Result:**
   - ✅ Login succeeds
   - ✅ You are redirected to the user dashboard
   - ✅ You can see your full profile with:
     * Profile picture
     * Full name
     * Military ID
     * Email
     * All other details

### Test Scenario 5: Admin Rejects User

1. **Register another test user**
   - Follow Test Scenario 1 with different details
   - Example: NSS-888888

2. **Login as Admin**

3. **Find the new pending user**

4. **Click the Reject button (red)**
   - A warning appears: "This action cannot be undone!"
   - Confirm the rejection

5. **Expected Result:**
   - ✅ User is permanently deleted from database
   - ✅ User disappears from the table
   - ✅ If the user tries to login, they get "User not found"

## Verification Checklist

Use this checklist to verify everything is working:

- [ ] New users are created with `approved: false`
- [ ] After signup, users see pending approval page
- [ ] Pending users cannot login to dashboard
- [ ] Login attempt redirects to pending page
- [ ] Admin dashboard shows "Approval Status" column
- [ ] Pending users show PENDING badge (yellow/gray)
- [ ] Approved users show APPROVED badge (green)
- [ ] Pending users have Approve/Reject buttons
- [ ] Approved users have View/Edit buttons
- [ ] Approve button successfully approves users
- [ ] Reject button successfully deletes users
- [ ] Approved users can login and access dashboard
- [ ] Unapproved users are blocked from dashboard

## Common Issues & Solutions

### Issue: "Account created successfully!" but no redirect
**Solution:** 
- Clear browser cache and cookies
- Make sure `pending-approval.html` exists in `src/pages/`
- Check browser console for JavaScript errors

### Issue: Admin can't see approval buttons
**Solution:**
- Refresh the admin dashboard page
- Check that the JavaScript loaded correctly
- Look in browser console for errors

### Issue: Users can login even when unapproved
**Solution:**
- Restart the server: `Ctrl+C` then `npm start`
- Verify the server logs show "MongoDB Connected"
- Check that `approved: false` is in the database

### Issue: Pending approval page is blank
**Solution:**
- Check that sessionStorage has user data
- Try registering again to populate sessionStorage
- Check browser console for errors

## Database Queries for Troubleshooting

If you need to manually check or fix user approval status:

### Check all users and their approval status:
```bash
mongosh military-hq --eval "db.users.find({}, {fullName:1, militaryId:1, approved:1, _id:0}).pretty()"
```

### Manually approve a user:
```bash
mongosh military-hq --eval "db.users.updateOne({militaryId: 'NSS-999999'}, {\$set: {approved: true, approvedAt: new Date()}})"
```

### Find all pending users:
```bash
mongosh military-hq --eval "db.users.find({approved: false}, {fullName:1, militaryId:1, email:1}).pretty()"
```

### Find all approved users:
```bash
mongosh military-hq --eval "db.users.find({approved: true}, {fullName:1, militaryId:1, email:1}).pretty()"
```

## Server Status

✅ **Server Running:** http://localhost:3000
✅ **Database Connected:** MongoDB (military-hq)
✅ **Approval System:** Active

## Next Steps

1. Test the registration flow with a new account
2. Verify you see the pending approval page
3. Login as admin and approve the user
4. Login as the approved user to access dashboard

---

**Note:** The server is currently running in the background. All changes have been applied.

**Created:** January 23, 2026
