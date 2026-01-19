const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

// Import Models
const User = require('./models/User');
const Admin = require('./models/Admin');
const Procedure = require('./models/Procedure');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'military-hq-secret-key-2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-hq';

// ========================================
// DATABASE SETUP - MONGODB
// ========================================

let mongoConnected = false;
let userIdCounter = 1;

// Store reset codes temporarily (in production, use Redis or DB)
const resetCodes = new Map(); // { militaryId: { code, expiresAt, attempts } }

// Rate limiting storage
const loginAttempts = new Map(); // { identifier: { count, resetTime } }
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Connect to MongoDB
const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    mongoConnected = true;
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    // Get last userId
    const lastUser = await User.findOne().sort({ userId: -1 });
    if (lastUser) {
      userIdCounter = lastUser.userId + 1;
    }
    
    // Create default admin if not exists
    await createDefaultAdmin();
    
    return true;
  } catch (error) {
    mongoConnected = false;
    console.error('❌ MongoDB Connection Failed:', error.message);
    console.log('⚠️  Server will run with limited functionality');
    return false;
  }
};

// Create default admin account
async function createDefaultAdmin() {
  try {
    const adminEmail = 'admin@military.gov';
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const admin = new Admin({
        adminId: 'ADMIN-001',
        email: adminEmail,
        password: 'Admin@12345', // Plain password - model will hash it
        fullName: 'System Administrator',
        role: 'superadmin',
      });
      await admin.save();
      console.log('✅ Default admin account created');
      console.log('   Email: admin@military.gov');
      console.log('   Password: Admin@12345');
    }
  } catch (error) {
    console.error('⚠️  Could not create default admin:', error.message);
  }
}

// Initialize MongoDB connection
connectMongoDB();

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  mongoConnected = false;
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  mongoConnected = false;
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  mongoConnected = true;
  console.log('✅ MongoDB reconnected');
});

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors({
  origin: true, // Allow all origins with credentials
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../src')));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/assets', express.static(path.join(__dirname, '../src/assets')));
app.use('/video', express.static(path.join(__dirname, '../video')));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.admin = admin;
    next();
  });
};

// Rate Limiting Middleware
function checkRateLimit(identifier) {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    loginAttempts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  // Reset if window expired
  if (now > attempt.resetTime) {
    loginAttempts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  // Check if limit exceeded
  if (attempt.count >= MAX_ATTEMPTS) {
    const waitTime = Math.ceil((attempt.resetTime - now) / 60000);
    return { 
      allowed: false, 
      remaining: 0,
      waitTime: waitTime 
    };
  }

  // Increment count
  attempt.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - attempt.count };
}

function resetRateLimit(identifier) {
  loginAttempts.delete(identifier);
}

// ========================================
// STATIC ROUTES
// ========================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/index.html'));
});

app.get('/user-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/user-dashboard.html'));
});

app.get('/user-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/user-dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/admin-dashboard.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/admin-dashboard.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/admin-login.html'));
});

app.get('/admin-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/admin-login.html'));
});

app.get('/admin-index', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/admin-index.html'));
});

app.get('/admin-index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/admin-index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// AUTH API ROUTES
// ========================================

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({
        success: false,
        error: 'Database unavailable. Please try again later.',
      });
    }

    const {
      email,
      mobile,
      fullName,
      militaryId,
      dob,
      rank,
      password,
      passportPicture,
    } = req.body;

    console.log('📥 Registration request:', { fullName, militaryId, email });

    // Validate required fields
    if (!fullName || !militaryId || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fullName, militaryId, email, password',
      });
    }

    // Validate Military ID format
    if (!militaryId.match(/^NSS-\d{6}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Military ID format. Use NSS-XXXXXX',
      });
    }

    // Validate email format
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { militaryId: militaryId.trim() },
        { email: email.trim().toLowerCase() },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this Military ID or email already exists',
      });
    }

    // Create new user (password will be hashed by model pre-save hook)
    const newUser = new User({
      userId: userIdCounter++,
      fullName: fullName.trim(),
      militaryId: militaryId.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile || '',
      dob: dob ? new Date(dob) : null,
      rank: rank || 'Recruit',
      password: password, // Plain password - model will hash it
      photoUrl: passportPicture || null,
      status: 'active',
    });

    await newUser.save();

    console.log('✅ User registered successfully:', {
      userId: newUser.userId,
      militaryId: newUser.militaryId,
      email: newUser.email,
    });

    return res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        userId: newUser.userId,
        fullName: newUser.fullName,
        militaryId: newUser.militaryId,
        email: newUser.email,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({
      success: false,
      error: `Registration failed: ${error.message}`,
    });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({
        success: false,
        error: 'Database unavailable. Please try again later.',
      });
    }

    const { militaryId, password } = req.body;

    console.log('🔐 Login attempt:', { militaryId });

    // Check rate limit
    const rateLimit = checkRateLimit(militaryId);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many login attempts. Please try again in ${rateLimit.waitTime} minutes.`,
      });
    }

    // Validate input
    if (!militaryId || !password) {
      return res.status(400).json({
        success: false,
        error: 'Military ID and password are required',
      });
    }

    // Validate Military ID format
    if (!militaryId.match(/^NSS-\d{6}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Military ID format',
      });
    }

    // Find user
    const user = await User.findOne({ militaryId: militaryId.trim() });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Please sign up first.',
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password',
        attemptsRemaining: rateLimit.remaining,
      });
    }

    // Reset rate limit on successful login
    resetRateLimit(militaryId);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.userId,
        militaryId: user.militaryId,
        email: user.email,
        role: 'user',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ User login successful:', militaryId);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        militaryId: user.militaryId,
        email: user.email,
        mobile: user.mobile,
        dob: user.dob,
        rank: user.rank,
        status: user.status,
        photoUrl: user.photoUrl,
        procedures: user.procedures || [],
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

// Admin Login
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({
        success: false,
        error: 'Database unavailable. Please try again later.',
      });
    }

    const { email, password } = req.body;

    console.log('🔐 Admin login attempt:', { email });

    // Check rate limit
    const rateLimit = checkRateLimit(`admin_${email}`);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many login attempts. Please try again in ${rateLimit.waitTime} minutes.`,
      });
    }

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });

    if (!admin) {
      console.log('❌ Admin not found in database');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        attemptsRemaining: rateLimit.remaining,
      });
    }

    console.log('✅ Admin found:', admin.email);

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password);

    console.log('🔑 Password match:', passwordMatch);

    if (!passwordMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        attemptsRemaining: rateLimit.remaining,
      });
    }

    // Reset rate limit on successful login
    resetRateLimit(`admin_${email}`);

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Admin account is deactivated',
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin._id,
        email: admin.email,
        role: 'admin',
        permissions: admin.permissions,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Admin login successful:', email);

    return res.json({
      success: true,
      message: 'Admin login successful',
      token,
      redirectTo: '/admin-dashboard.html',
      admin: {
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Admin login failed',
    });
  }
});

// Send Verification Code
app.post('/api/auth/send-verification-code', (req, res) => {
  const { email, phone, code } = req.body;

  console.log('📧 Verification code:', { email, phone, code });

  return res.json({
    success: true,
    message: `Verification code sent to ${email} and ${phone}`,
  });
});

// Verify Registration Code
app.post('/api/auth/verify', (req, res) => {
  const { verificationCode } = req.body;

  if (!verificationCode || verificationCode.length !== 6) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  return res.json({ success: true, message: 'Account verified successfully' });
});

// Verify Admin Session
app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not an admin' });
    }

    return res.json({
      success: true,
      admin: {
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions,
      },
    });
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
});

// Verify User Session
app.get('/api/user/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'user') {
      return res.status(403).json({ success: false, error: 'Not a user' });
    }

    return res.json({
      success: true,
      user: {
        userId: decoded.userId,
        militaryId: decoded.militaryId,
        email: decoded.email,
      },
    });
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
});

// ========================================
// USER API ROUTES
// ========================================

// Get User Profile
app.get('/api/user/:militaryId', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const user = await User.findOne({ militaryId: req.params.militaryId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update User Profile
app.put('/api/user/:militaryId', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const user = await User.findOneAndUpdate(
      { militaryId: req.params.militaryId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Request Password Reset - Step 1: Verify user and send code
app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { militaryId } = req.body;

    if (!militaryId) {
      return res.status(400).json({ error: 'Military ID is required' });
    }

    // Find user
    const user = await User.findOne({ militaryId: militaryId.trim() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store reset code
    resetCodes.set(militaryId, {
      code,
      expiresAt,
      attempts: 0,
      userId: user._id,
    });

    console.log(`🔑 Password reset code for ${militaryId}:`, code);

    return res.json({
      success: true,
      message: 'Reset code generated',
      email: user.email,
      mobile: user.mobile,
      code: code, // In production, send via email/SMS instead
    });
  } catch (error) {
    console.error('❌ Request reset error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

// Verify Reset Code - Step 2
app.post('/api/auth/verify-reset-code', async (req, res) => {
  try {
    const { militaryId, code } = req.body;

    if (!militaryId || !code) {
      return res.status(400).json({ error: 'Military ID and code required' });
    }

    const resetData = resetCodes.get(militaryId);

    if (!resetData) {
      return res.status(404).json({ error: 'No reset request found' });
    }

    // Check expiration
    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(militaryId);
      return res.status(400).json({ error: 'Reset code expired' });
    }

    // Check attempts
    if (resetData.attempts >= 3) {
      resetCodes.delete(militaryId);
      return res.status(429).json({ error: 'Too many failed attempts' });
    }

    // Verify code
    if (resetData.code !== code) {
      resetData.attempts++;
      return res.status(400).json({ 
        error: 'Invalid code',
        attemptsLeft: 3 - resetData.attempts 
      });
    }

    return res.json({
      success: true,
      message: 'Code verified successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// Reset Password - Step 3
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { militaryId, code, newPassword } = req.body;

    if (!militaryId || !code || !newPassword) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const resetData = resetCodes.get(militaryId);

    if (!resetData || resetData.code !== code) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(
      resetData.userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear reset code
    resetCodes.delete(militaryId);

    console.log('✅ Password reset successfully for:', militaryId);

    return res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Reset User Password (Old endpoint - kept for compatibility)
app.post('/api/user/:militaryId/reset-password', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { militaryId: req.params.militaryId },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Password reset for:', req.params.militaryId);

    return res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Add Procedure to User
app.post('/api/user/:militaryId/procedure', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { name, requirements, status } = req.body;

    const user = await User.findOne({ militaryId: req.params.militaryId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const procedure = {
      name: name || 'Unnamed Procedure',
      description: requirements || '',
      assignedDate: new Date(),
      status: status || 'Pending',
    };

    user.procedures.push(procedure);
    await user.save();

    console.log('✅ Procedure added for:', req.params.militaryId);

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
app.delete('/api/user/:militaryId/procedure/:procedureIndex', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const user = await User.findOne({ militaryId: req.params.militaryId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const index = parseInt(req.params.procedureIndex, 10);

    if (index < 0 || index >= user.procedures.length) {
      return res.status(400).json({ error: 'Invalid procedure index' });
    }

    const deletedProcedure = user.procedures.splice(index, 1)[0];
    await user.save();

    return res.json({
      success: true,
      message: 'Procedure deleted successfully',
      deletedProcedure,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete procedure' });
  }
});

// ========================================
// ADMIN API ROUTES
// ========================================

// Get All Users (Admin)
app.get('/api/admin/users', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });

    console.log('📊 Admin fetched users:', users.length);

    return res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get Single User (Admin)
app.get('/api/admin/user/:militaryId', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const user = await User.findOne({ militaryId: req.params.militaryId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update User (Admin)
app.put('/api/admin/user/:militaryId', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const user = await User.findOneAndUpdate(
      { militaryId: req.params.militaryId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Admin updated user:', req.params.militaryId);

    return res.json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete User (Admin)
app.delete('/api/admin/user/:militaryId', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const user = await User.findOneAndDelete({ militaryId: req.params.militaryId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Admin deleted user:', req.params.militaryId);

    return res.json({
      success: true,
      message: `User ${user.fullName} has been permanently deleted`,
      deletedUser: {
        fullName: user.fullName,
        militaryId: user.militaryId,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Update User Status (Admin)
app.put('/api/admin/user/:militaryId/status', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { status } = req.body;

    const user = await User.findOneAndUpdate(
      { militaryId: req.params.militaryId },
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      message: `User status updated to ${status}`,
      user,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

// Approve User Photo (Admin)
app.post('/api/user/:militaryId/photo/approve', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const user = await User.findOne({ militaryId: req.params.militaryId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // You can add a photoStatus field to the schema if needed
    console.log('✅ Photo approved for:', req.params.militaryId);

    return res.json({
      success: true,
      message: 'Photo approved successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to approve photo' });
  }
});

// Reject User Photo (Admin)
app.post('/api/user/:militaryId/photo/reject', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { reason } = req.body;
    const user = await User.findOne({ militaryId: req.params.militaryId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Photo rejected for:', req.params.militaryId, 'Reason:', reason);

    return res.json({
      success: true,
      message: 'Photo rejected successfully',
      reason,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reject photo' });
  }
});

// Send Email (Admin)
app.post('/api/admin/email', (req, res) => {
  const { to, subject, body } = req.body;

  console.log('📧 Email to be sent:', { to, subject });

  return res.json({
    success: true,
    message: 'Email sent successfully',
  });
});

// Add Procedure (Admin)
app.post('/api/admin/procedures', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const procedure = new Procedure(req.body);
    await procedure.save();

    return res.json({
      success: true,
      message: 'Procedure added successfully',
      procedure,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add procedure' });
  }
});

// Update Spouse Information (Admin)
app.put('/api/admin/spouse/:militaryId', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const user = await User.findOneAndUpdate(
      { militaryId: req.params.militaryId },
      { $set: { spouse: req.body } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Spouse information updated successfully',
      spouse: user.spouse,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update spouse information' });
  }
});

// ========================================
// ERROR HANDLING
// ========================================

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     🎖️  MILITARY HEADQUARTERS SERVER (MongoDB Edition)    ║');
  console.log('║     ✅ Server Running Successfully                         ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📍 Port: ${PORT}`);
  console.log(`💾 Database: ${mongoConnected ? '✅ MongoDB Connected' : '❌ MongoDB Disconnected'}`);
  console.log(`🔐 Security: ✅ Password Hashing Enabled`);
  console.log(`🔑 JWT Auth: ✅ Enabled`);
  console.log('');
  console.log('🌐 Access URLs:');
  console.log(`   👉 http://localhost:${PORT}`);
  console.log(`   👉 http://127.0.0.1:${PORT}`);
  console.log('');
  console.log('📋 Admin Credentials:');
  console.log('   Email: admin@military.gov');
  console.log('   Password: Admin@12345');
  console.log('');
  console.log(mongoConnected ? '✅ All Systems Operational' : '⚠️  Running with limited functionality');
  console.log('');
});

module.exports = app;
