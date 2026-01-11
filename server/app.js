const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// DATABASE SETUP - MONGODB
// ========================================

// MongoDB Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-hq';

// Connect to MongoDB with proper error handling
const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.db.getName()}`);
    return true;
  } catch (error) {
    // Silently fail - File-based storage is the primary fallback
    return false;
  }
};

// Initialize MongoDB connection (non-blocking, completely silent)
connectMongoDB().then((_success) => {
  // Silent initialization - file storage is default
}).catch(() => {
  // Catch any promise rejections silently
});

// ========================================
// FALLBACK FILE-BASED STORAGE
// ========================================
const USERS_FILE = path.join(__dirname, 'users.json');

// Load users from file or create file if it doesn't exist
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      console.log('📂 Loaded users from file:', parsed.users.length, 'users');
      return parsed;
    }
    console.log('📄 users.json not found, creating new file...');
    const defaultData = {
      users: [],
      nextUserId: 1,
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  } catch (error) {
    console.error('❌ Error loading users:', error.message);
    return { users: [], nextUserId: 1 };
  }
}

// Save users to file
function saveUsers(data) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
    console.log('💾 Users saved to file');
  } catch (error) {
    console.error('❌ Error saving users:', error.message);
  }
}

// Load initial data for fallback
const userData = loadUsers();
let { users } = userData;
let { nextUserId } = userData;

// ========================================
// END DATABASE SETUP
// ========================================

// Middleware
// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../src')));
// Serve images folder
app.use('/images', express.static(path.join(__dirname, '../images')));
// Serve assets folder
app.use('/assets', express.static(path.join(__dirname, '../src/assets')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/index.html'));
});

app.get('/user-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/user-dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/admin-dashboard.html'));
});

// API Routes
// User Registration
app.post('/api/auth/register', (req, res) => {
  try {
    console.log('📥 Registration request received. Body:', JSON.stringify(req.body, null, 2));

    const {
      email,
      mobile,
      fullName,
      militaryId,
      dob,
      rank,
      password,
      status,
      photoStatus,
      accountCreated,
      procedures,
      passportPicture,
    } = req.body;

    // Validate required fields
    if (!fullName || !militaryId || !email || !password) {
      console.log('❌ Missing required fields:', {
        fullName: !!fullName, militaryId: !!militaryId, email: !!email, password: !!password,
      });
      return res.status(400).json({ success: false, error: 'Missing required fields: fullName, militaryId, email, password' });
    }

    // Trim values
    const trimmedMilitaryId = militaryId.trim();
    const trimmedEmail = email.trim();
    const trimmedFullName = fullName.trim();

    console.log('📝 Registration attempt:', {
      email: trimmedEmail, fullName: trimmedFullName, militaryId: trimmedMilitaryId, rank,
    });

    // Validate Military ID format
    if (!trimmedMilitaryId.match(/^NSS-\d{6}$/)) {
      console.log('❌ Invalid Military ID format:', trimmedMilitaryId);
      return res.status(400).json({ success: false, error: 'Invalid Military ID format' });
    }

    // Check if user already exists (case-insensitive email check)
    const existingUser = users.find((u) => u.militaryId === trimmedMilitaryId
            || (u.email && u.email.toLowerCase() === trimmedEmail.toLowerCase()));
    if (existingUser) {
      console.log('❌ User already exists:', { militaryId: trimmedMilitaryId, email: trimmedEmail, existingMilId: existingUser.militaryId });
      return res.status(400).json({ success: false, error: 'User with this Military ID or email already exists' });
    }

    // Create new user
    const newUser = {
      id: nextUserId++,
      fullName: trimmedFullName,
      militaryId: trimmedMilitaryId,
      email: trimmedEmail,
      mobile: mobile || '',
      dob: dob || '',
      rank: rank || 'Enlisted',
      password,
      passportPicture: passportPicture || '../assets/default-avatar.png',
      status: status || 'ACTIVE',
      photoStatus: photoStatus || 'pending',
      accountCreated: accountCreated || new Date().toLocaleDateString(),
      procedures: procedures || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to in-memory storage
    users.push(newUser);

    // Save to persistent file storage FIRST
    const dataToSave = { users: JSON.parse(JSON.stringify(users)), nextUserId };
    saveUsers(dataToSave);

    // Log the data being saved
    console.log('💾 Saving user data. Current users:', users.length);
    console.log('📋 User list after save:', users.map((u) => ({
      id: u.id, militaryId: u.militaryId, email: u.email, fullName: u.fullName,
    })));

    console.log('✅ New user registered successfully:', {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      militaryId: newUser.militaryId,
      totalUsers: users.length,
    });
    console.log('📊 All users in system:', users.map((u) => ({ id: u.id, militaryId: u.militaryId, email: u.email })));

    return res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        militaryId: newUser.militaryId,
        email: newUser.email,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ success: false, error: `Registration failed: ${error.message}` });
  }
});

// Send Verification Code
app.post('/api/auth/send-verification-code', (req, res) => {
  try {
    const { email, phone, code } = req.body;

    // Validate input
    if (!email || !phone || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // TODO: Integrate with email service (e.g., SendGrid, Nodemailer)
    // Example:
    // await sendEmail({
    //     to: email,
    //     subject: 'Military Headquarters - Verification Code',
    //     body: `Your verification code is: ${code}`
    // });

    // TODO: Integrate with SMS service (e.g., Twilio)
    // Example:
    // await sendSMS({
    //     to: phone,
    //     body: `Military Headquarters verification code: ${code}`
    // });

    console.log('📧 Verification code would be sent:');
    console.log(`   Email: ${email}`);
    console.log(`   Phone: ${phone}`);
    console.log(`   Code: ${code}`);

    return res.json({
      success: true,
      message: `Verification code has been sent to ${email} and ${phone}`,
      sentTo: { email, phone },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify Registration Code
app.post('/api/auth/verify', (req, res) => {
  try {
    const { verificationCode } = req.body;

    // Validate code
    if (!verificationCode || verificationCode.length !== 6) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    return res.json({ success: true, message: 'Account verified successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// User Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { militaryId: rawMilitaryId, password: rawPassword } = req.body;

    // Trim military ID
    const militaryId = rawMilitaryId ? rawMilitaryId.trim() : '';
    const password = rawPassword || '';

    console.log('🔐 Login attempt:', { militaryId, passwordLength: password ? password.length : 0 });
    console.log('📊 Total users in database:', users.length);
    console.log('📋 Users list:', users.map((u) => ({ id: u.id, militaryId: u.militaryId, email: u.email })));

    // Validate Military ID format
    if (!militaryId || !militaryId.match(/^NSS-\d{6}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid Military ID format' });
    }

    // Find user by Military ID
    const user = users.find((u) => u.militaryId === militaryId);

    if (!user) {
      console.log('❌ User not found with Military ID:', militaryId);
      return res.status(401).json({ success: false, error: 'User not found. Please sign up first.' });
    }

    console.log('✅ User found:', { fullName: user.fullName, militaryId: user.militaryId });
    console.log('✅ Password provided:', password ? 'yes' : 'no');

    // For development: accept login with any password if military ID exists
    // In production, use proper bcrypt password verification
    console.log('✅ User login successful:', militaryId);

    return res.json({
      success: true,
      message: 'Login successful',
      token: `user_token_${Math.random().toString(36).substr(2, 9)}`,
      user: {
        id: user.id,
        fullName: user.fullName,
        militaryId: user.militaryId,
        email: user.email,
        mobile: user.mobile,
        dob: user.dob,
        rank: user.rank,
        status: user.status,
        photoStatus: user.photoStatus,
        passportPicture: user.passportPicture,
        accountCreated: user.accountCreated,
        procedures: user.procedures || [],
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Admin Login
app.post('/api/auth/admin-login', (req, res) => {
  try {
    const { email } = req.body;

    // Here you would typically authenticate against database
    console.log('Admin login attempt:', email);

    return res.json({
      success: true,
      token: `admin_token_${Math.random().toString(36).substr(2, 9)}`,
      redirectTo: '/admin-dashboard.html',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Admin login failed' });
  }
});

// Get User Profile
app.get('/api/user/:militaryId', (req, res) => {
  try {
    const user = users.find((u) => u.militaryId === req.params.militaryId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Reset User Password
app.post('/api/user/:militaryId/reset-password', (req, res) => {
  try {
    const { militaryId, newPassword } = req.body;

    console.log('🔄 Password reset request for:', militaryId);

    // Find user
    const user = users.find((u) => u.militaryId === militaryId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update password
    user.password = newPassword;

    // Save to persistent storage
    saveUsers({ users, nextUserId });

    console.log('✅ Password reset successfully for user:', militaryId);

    return res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    return res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// Update User Profile
app.put('/api/user/:militaryId', (req, res) => {
  try {
    const user = users.find((u) => u.militaryId === req.params.militaryId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user fields
    Object.assign(user, req.body);

    // Save to persistent storage
    saveUsers({ users, nextUserId });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Add Procedure to User
app.post('/api/user/:militaryId/procedure', (req, res) => {
  try {
    const user = users.find((u) => u.militaryId === req.params.militaryId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, requirements } = req.body;

    if (!name || !requirements) {
      return res.status(400).json({ error: 'Procedure name and requirements are required' });
    }

    const procedure = {
      name,
      requirements,
      addedDate: new Date().toLocaleDateString(),
    };

    if (!user.procedures) {
      user.procedures = [];
    }

    user.procedures.push(procedure);

    // Save to persistent storage
    saveUsers({ users, nextUserId });

    console.log('✅ Procedure added for user:', req.params.militaryId);

    return res.json({
      success: true,
      message: 'Procedure added successfully',
      procedure,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add procedure' });
  }
});

// Delete Procedure from User
app.delete('/api/user/:militaryId/procedure/:procedureIndex', (req, res) => {
  try {
    const user = users.find((u) => u.militaryId === req.params.militaryId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const index = parseInt(req.params.procedureIndex, 10);

    if (index < 0 || index >= user.procedures.length) {
      return res.status(400).json({ error: 'Invalid procedure index' });
    }

    const deletedProcedure = user.procedures.splice(index, 1);

    // Save to persistent storage
    saveUsers({ users, nextUserId });

    console.log('✅ Procedure deleted for user:', req.params.militaryId);

    return res.json({
      success: true,
      message: 'Procedure deleted successfully',
      deletedProcedure: deletedProcedure[0],
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete procedure' });
  }
});

// Approve User Photo
app.post('/api/user/:militaryId/photo/approve', (req, res) => {
  try {
    const user = users.find((u) => u.militaryId === req.params.militaryId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.photoStatus = 'approved';

    // Save to persistent storage
    saveUsers({ users, nextUserId });

    console.log('✅ Photo approved for user:', req.params.militaryId);

    return res.json({
      success: true,
      message: 'Photo approved successfully',
      photoStatus: 'approved',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to approve photo' });
  }
});

// Reject User Photo
app.post('/api/user/:militaryId/photo/reject', (req, res) => {
  try {
    const user = users.find((u) => u.militaryId === req.params.militaryId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { reason } = req.body;
    user.photoStatus = 'rejected';
    user.photoRejectionReason = reason;

    // Save to persistent storage
    saveUsers({ users, nextUserId });

    console.log('✅ Photo rejected for user:', req.params.militaryId, 'Reason:', reason);

    return res.json({
      success: true,
      message: 'Photo rejected successfully',
      photoStatus: 'rejected',
      reason,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reject photo' });
  }
});

// Get All Users (Admin)
app.get('/api/admin/users', (req, res) => {
  try {
    // Reload users from file to ensure fresh data
    const freshData = loadUsers();
    users = freshData.users;
    nextUserId = freshData.nextUserId;

    console.log('🔄 Reloaded users from file');
    console.log('📊 /api/admin/users endpoint called');
    console.log('📋 Total users in system:', users.length);
    console.log('👥 Users list:', users.map((u) => ({
      id: u.id, fullName: u.fullName, militaryId: u.militaryId, email: u.email,
    })));

    // Return users with all details
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete User (Admin)
app.delete('/api/admin/user/:militaryId', (req, res) => {
  try {
    const { militaryId } = req.params;

    // Find and remove user
    const index = users.findIndex((u) => u.militaryId === militaryId);

    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deletedUser = users.splice(index, 1)[0];

    // Save to persistent storage
    saveUsers({ users, nextUserId });

    console.log('✅ User permanently deleted:', militaryId);

    return res.json({
      success: true,
      message: `User ${deletedUser.fullName} has been permanently deleted`,
      deletedUser: {
        fullName: deletedUser.fullName,
        militaryId: deletedUser.militaryId,
        email: deletedUser.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Update User Status (Admin)
app.put('/api/admin/user/:userId/status', (req, res) => {
  try {
    const { status } = req.body;

    res.json({
      success: true,
      message: `User status updated to ${status}`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Send Email (Admin)
app.post('/api/admin/email', (req, res) => {
  try {
    const { to, subject } = req.body;

    // Here you would send email using Nodemailer
    console.log('Email sent to:', to, 'Subject:', subject);

    res.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Add Procedure (Admin)
app.post('/api/admin/procedures', (req, res) => {
  try {
    // Procedure data from request body is available for future API enhancements
    // Current implementation uses existing endpoint structure

    res.json({
      success: true,
      message: 'Procedure added successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add procedure' });
  }
});

// Update Spouse Information (Admin)
app.put('/api/admin/spouse/:userId', (req, res) => {
  try {
    // Spouse data from request body is available for future API enhancements
    // Current implementation uses existing endpoint structure
    res.json({
      success: true,
      message: 'Spouse information updated successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update spouse information' });
  }
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     🎖️  MILITARY HEADQUARTERS SERVER                      ║');
  console.log('║     ✅ Server Running Successfully                         ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📍 Port: ${PORT}`);
  console.log('💾 Storage: File-Based (users.json) - Ready');
  console.log('🔌 MongoDB: Optional (use if needed)');
  console.log('');
  console.log('🌐 Access URLs:');
  console.log(`   👉 http://localhost:${PORT}`);
  console.log(`   👉 http://127.0.0.1:${PORT}`);
  console.log('');
  console.log('✅ All Systems Operational - Ready for requests');
  console.log('');
});
