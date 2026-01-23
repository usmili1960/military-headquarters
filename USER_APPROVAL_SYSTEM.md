# User Approval System - Implementation Guide

## Overview
A comprehensive user approval system has been implemented to ensure that all new user registrations are reviewed and approved by administrators before users can access their dashboards.

## How It Works

### User Registration Flow

1. **User Signs Up**
   - User fills out registration form with personal details and photo
   - Account is created with `approved: false` status
   - User receives confirmation message: "Awaiting admin approval"
   - User is redirected to **Pending Approval Page**

2. **Pending Approval State**
   - User cannot log in or access dashboard
   - User sees status page with their basic information
   - Page shows: "Waiting for Admin Approval"
   - User can check approval status periodically
   - Auto-refresh checks every 30 seconds for approval

3. **Admin Reviews & Approves**
   - Admin logs into Admin Dashboard
   - Sees all pending users with "PENDING" status badge
   - Reviews user details, photo, and information
   - Can either:
     - ✅ **Approve** - User gains access
     - ❌ **Reject** - User is deleted from system

4. **User Gets Access**
   - Once approved, user can log in
   - User sees full dashboard with all details
   - Profile information and photo become visible
   - User can access all features

### Login Flow

#### Before Approval:
```
User Login Attempt → Check Credentials → Check Approval Status → ❌ Redirect to Pending Page
```

#### After Approval:
```
User Login Attempt → Check Credentials → Check Approval Status → ✅ Redirect to Dashboard
```

## Database Schema Changes

### User Model (`server/models/User.js`)

Added three new fields:

```javascript
{
  approved: {
    type: Boolean,
    default: false,  // New users are unapproved by default
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,  // Stores which admin approved the user
  },
  approvedAt: {
    type: Date,
    default: null,  // Timestamp of approval
  }
}
```

## API Endpoints

### 1. User Registration
**POST** `/api/auth/register`

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully. Awaiting admin approval.",
  "requiresApproval": true,
  "user": {
    "userId": 1,
    "fullName": "John Doe",
    "militaryId": "NSS-123456",
    "email": "john@example.com",
    "status": "active",
    "approved": false
  }
}
```

### 2. User Login
**POST** `/api/auth/login`

**Response (Pending Approval):**
```json
{
  "success": false,
  "error": "Your account is pending admin approval",
  "pendingApproval": true,
  "user": {
    "fullName": "John Doe",
    "militaryId": "NSS-123456",
    "email": "john@example.com"
  }
}
```

**Response (Approved User):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    // Full user details
  }
}
```

### 3. Approve User (Admin Only)
**PUT** `/api/admin/user/:militaryId/approve`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User John Doe has been approved",
  "user": {
    "fullName": "John Doe",
    "militaryId": "NSS-123456",
    "email": "john@example.com",
    "approved": true,
    "approvedAt": "2026-01-23T10:30:00.000Z"
  }
}
```

### 4. Reject User (Admin Only)
**DELETE** `/api/admin/user/:militaryId/reject`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User John Doe has been rejected and removed",
  "deletedUser": {
    "fullName": "John Doe",
    "militaryId": "NSS-123456",
    "email": "john@example.com"
  }
}
```

## Frontend Changes

### 1. New Page: Pending Approval
**File:** `src/pages/pending-approval.html`

**Features:**
- Shows user's basic info (name, military ID, email)
- Displays pending status with animated icon
- "Check Status" button to manually check approval
- Auto-checks approval every 30 seconds
- Redirects to login page when approved

### 2. Updated Signup Page
**File:** `src/pages/signup.html`

**Changes:**
- After successful registration, redirects to pending approval page
- Stores user data in sessionStorage for pending page
- Shows message: "Awaiting admin approval"

### 3. Updated Login Handler
**File:** `src/js/homepage.js`

**Changes:**
- Checks `pendingApproval` flag in login response
- Redirects unapproved users to pending approval page
- Stores user data for pending page display

### 4. Admin Dashboard Updates

#### HTML (`src/pages/admin-dashboard.html`)
- Added "Approval Status" column to users table
- Changed colspan from 7 to 8 for empty state

#### JavaScript (`src/js/admin-dashboard.js`)

**New Functions:**
- `approveUser(militaryId)` - Approves a pending user
- `rejectUser(militaryId)` - Rejects and deletes a pending user

**Updated Functions:**
- `loadUsersTable()` - Shows approval status badges
- Displays different action buttons based on approval status:
  - **Pending Users:** Approve/Reject buttons
  - **Approved Users:** View/Edit buttons

#### CSS Styling
Approval status badges:
- **APPROVED:** Green badge with checkmark
- **PENDING:** Yellow/gray badge with clock icon

## User Experience

### For Users

#### During Registration:
1. Fill out registration form
2. Submit form
3. See success message with approval notice
4. Redirected to pending approval page

#### On Pending Page:
- See account status: "Pending Approval"
- View submitted information (name, military ID, email)
- See informational message about next steps
- Option to check status or return to home

#### After Attempting Login (Before Approval):
- Login credentials accepted
- Redirected to pending approval page
- Cannot access dashboard until approved

#### After Approval:
- Login succeeds
- Full access to dashboard
- Can view all profile details
- Can use all features

### For Admins

#### In Admin Dashboard:
1. **View All Users**
   - See "Approval Status" column
   - Pending users have yellow "PENDING" badge
   - Approved users have green "APPROVED" badge

2. **Pending Users Row:**
   - Shows user's photo, name, military ID, rank
   - Status: PENDING
   - Action buttons: 
     - 🟢 **Approve** button (green)
     - 🔴 **Reject** button (red)

3. **Approve a User:**
   - Click "Approve" button
   - Confirmation dialog appears
   - Confirm approval
   - User receives access
   - List refreshes automatically

4. **Reject a User:**
   - Click "Reject" button
   - Warning dialog appears (deletion is permanent)
   - Confirm rejection
   - User is permanently deleted
   - List refreshes automatically

## Security Considerations

### 1. Token Verification
- Admin token required for approve/reject operations
- JWT verification ensures only authenticated admins can approve

### 2. Database Integrity
- Approval status checked during login
- No bypass mechanisms
- Server-side validation enforced

### 3. Audit Trail
- `approvedBy` field stores which admin approved the user
- `approvedAt` timestamp records when approval occurred
- Useful for compliance and auditing

## Testing the System

### Test Scenario 1: New User Registration
1. Go to signup page
2. Register new user with valid details
3. Verify redirect to pending approval page
4. Try to log in → Should redirect to pending page
5. Admin approves user
6. User logs in → Should access dashboard

### Test Scenario 2: Admin Approval
1. Admin logs in
2. Go to admin dashboard
3. Find pending user in table
4. Click "Approve"
5. Confirm dialog
6. Verify user status changes to "APPROVED"
7. Verify action buttons change to "View/Edit"

### Test Scenario 3: Admin Rejection
1. Admin logs in
2. Find pending user
3. Click "Reject"
4. Confirm deletion warning
5. Verify user is removed from table
6. Verify user cannot log in anymore

## Files Modified/Created

### Created:
- ✅ `src/pages/pending-approval.html` - Pending approval status page

### Modified:
- ✅ `server/models/User.js` - Added approval fields
- ✅ `server/app.js` - Updated registration, login, added approve/reject endpoints
- ✅ `src/pages/signup.html` - Redirect to pending page after signup
- ✅ `src/js/homepage.js` - Handle pending approval in login
- ✅ `src/pages/admin-dashboard.html` - Added approval status column
- ✅ `src/js/admin-dashboard.js` - Added approval/rejection functionality

## Configuration

No additional configuration needed. The system works with existing MongoDB setup.

### Environment Variables
Uses existing variables:
- `JWT_SECRET` - For token verification
- `MONGODB_URI` - For database connection

## Maintenance

### To View Pending Users:
```javascript
// In MongoDB
db.users.find({ approved: false })
```

### To Manually Approve a User:
```javascript
// In MongoDB
db.users.updateOne(
  { militaryId: "NSS-123456" },
  { 
    $set: { 
      approved: true,
      approvedAt: new Date()
    }
  }
)
```

### To Check Approval Statistics:
```javascript
// Approved users
db.users.countDocuments({ approved: true })

// Pending users
db.users.countDocuments({ approved: false })
```

## Future Enhancements

### Possible Additions:
1. **Email Notifications**
   - Notify users when approved
   - Notify users when rejected

2. **SMS Notifications**
   - Send SMS when account is approved

3. **Approval Comments**
   - Admins can add notes when approving/rejecting

4. **Approval History**
   - Track all approval/rejection actions
   - Display in admin audit log

5. **Bulk Approval**
   - Approve multiple users at once

6. **Approval Workflow**
   - Multi-level approval (require 2+ admins)
   - Approval by specific roles

7. **User Notifications**
   - In-app notification system
   - Real-time updates via WebSocket

## Troubleshooting

### Issue: Users still seeing old behavior
**Solution:** Clear browser cache and cookies

### Issue: Approved users can't login
**Solution:** Check database - verify `approved: true` is set

### Issue: Admin can't approve users
**Solution:** Verify admin token is valid, check browser console for errors

### Issue: Pending page not showing user data
**Solution:** Check sessionStorage, verify redirect from signup/login

## Support

For issues or questions about the approval system:
1. Check browser console for errors
2. Verify database connection
3. Check server logs for API errors
4. Ensure MongoDB is running

---

## Summary

✅ **User Registration** → Creates unapproved account  
✅ **User Login (Unapproved)** → Redirected to pending page  
✅ **Admin Approval** → User gains access  
✅ **Admin Rejection** → User is deleted  
✅ **User Login (Approved)** → Full dashboard access  

**Status:** ✅ Fully Implemented and Tested  
**Date:** January 23, 2026  
**Version:** 1.0.0
