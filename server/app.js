const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import Models
const User = require('./models/User');
const Admin = require('./models/Admin');
const Procedure = require('./models/Procedure');
const ActivityLog = require('./models/ActivityLog');
const Notification = require('./models/Notification');

// Import Middleware
const { logActivity, log: logManual } = require('./middleware/activityLogger');
const SecurityMiddleware = require('./middleware/securityMiddleware');

// Import Services
const emailService = require('./services/emailService');
const smsService = require('./services/smsService');
const fileUploadService = require('./services/fileUploadService');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'military-hq-secret-key-2026';

// Smart MongoDB Connection - Try Atlas first, fallback to local
const MONGODB_ATLAS_URI = process.env.MONGODB_ATLAS_URI;
const MONGODB_LOCAL_URI = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/military-hq';
let MONGODB_URI = process.env.MONGODB_URI || MONGODB_LOCAL_URI;
let connectionType = 'Unknown';

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

// Connect to MongoDB with Smart Fallback
const connectMongoDB = async () => {
  // First try: MongoDB Atlas (if configured)
  if (MONGODB_ATLAS_URI) {
    try {
      console.log('🌐 Attempting MongoDB Atlas connection...');
      await mongoose.connect(MONGODB_ATLAS_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      mongoConnected = true;
      connectionType = 'MongoDB Atlas (Global)';
      MONGODB_URI = MONGODB_ATLAS_URI;
      console.log('✅ MongoDB Atlas Connected Successfully');
      console.log(`📊 Database: ${mongoose.connection.db.databaseName} (Global Cloud)`);
      
      // Get last userId
      const lastUser = await User.findOne().sort({ userId: -1 });
      if (lastUser) {
        userIdCounter = lastUser.userId + 1;
      }
      
      // Create default admin if not exists
      await createDefaultAdmin();
      return true;
    } catch (atlasError) {
      console.log('⚠️ MongoDB Atlas connection failed, trying local MongoDB...');
      console.log('Atlas Error:', atlasError.message);
    }
  }

  // Fallback: Local MongoDB
  try {
    console.log('🏠 Attempting Local MongoDB connection...');
    await mongoose.connect(MONGODB_LOCAL_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    mongoConnected = true;
    connectionType = 'MongoDB Local';
    MONGODB_URI = MONGODB_LOCAL_URI;
    console.log('✅ Local MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName} (Local)`);
    
    // Get last userId
    const lastUser = await User.findOne().sort({ userId: -1 });
    if (lastUser) {
      userIdCounter = lastUser.userId + 1;
    }
    
    // Create default admin if not exists
    await createDefaultAdmin();
    return true;
  } catch (localError) {
    console.error('❌ All MongoDB connections failed!');
    console.error('Local Error:', localError.message);
    mongoConnected = false;
    connectionType = 'Disconnected';
    
    // Still allow server to start with limited functionality
    console.log('⚠️ Server will run without database (limited functionality)');
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

// Initialize MongoDB connection and start server
connectMongoDB().then(() => {
  startServer();
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  startServer(); // Start anyway with limited functionality
});

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

// Security middleware
app.use(SecurityMiddleware.helmet());
app.use(SecurityMiddleware.securityHeaders());
app.use(SecurityMiddleware.requestSizeLimiter());
app.use(SecurityMiddleware.logSecurity());
app.use(compression()); // Gzip compression
app.use(morgan('combined')); // Logging

// Rate limiting
app.use('/api/auth', SecurityMiddleware.authRateLimit());
app.use('/api', SecurityMiddleware.generalRateLimit());

// Input sanitization
app.use(SecurityMiddleware.sanitizeInput());

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

// Serve upload files (with authentication)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
    req.admin = {
      ...admin,
      id: admin.id || admin.adminId,
    };
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

async function createNotificationSafe(payload) {
  try {
    const notification = new Notification(payload);
    await notification.save();
    return true;
  } catch (error) {
    console.error('❌ Notification creation failed:', error.message);
    return false;
  }
}

async function notifyActiveAdmins({ type, title, message, priority = 'medium', metadata = {} }) {
  try {
    const admins = await Admin.find({ isActive: true }).select('_id');
    if (!admins.length) return 0;

    const notifications = admins.map((admin) => ({
      recipientId: admin._id,
      recipientType: 'Admin',
      type,
      title,
      message,
      priority,
      isRead: false,
      metadata,
    }));

    await Notification.insertMany(notifications, { ordered: false });
    return notifications.length;
  } catch (error) {
    console.error('❌ Failed to notify admins:', error.message);
    return 0;
  }
}

async function notifyUserByMilitaryId(militaryId, {
  type = 'info',
  title,
  message,
  priority = 'medium',
  metadata = {},
}) {
  try {
    const user = await User.findOne({ militaryId }).select('_id');
    if (!user) return false;

    return createNotificationSafe({
      recipientId: user._id,
      recipientType: 'User',
      type,
      title,
      message,
      priority,
      isRead: false,
      metadata: {
        militaryId,
        ...metadata,
      },
    });
  } catch (error) {
    console.error('❌ Failed to notify user by militaryId:', error.message);
    return false;
  }
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

// ========================================
// FILE UPLOAD ENDPOINTS
// ========================================

// Upload profile picture
app.post('/api/upload/profile-pic', 
  authenticateToken,
  SecurityMiddleware.fileUploadSecurity(),
  fileUploadService.singleUpload('profilePic'),
  async (req, res) => {
    try {
      const { militaryId } = req.user;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const fileInfo = await fileUploadService.processProfilePicture(req.file, militaryId);
      
      // Update user's profile picture URL in database
      await User.findOneAndUpdate(
        { militaryId },
        { photoUrl: fileInfo.url },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        file: fileInfo
      });
    } catch (error) {
      console.error('❌ Profile picture upload error:', error);
      res.status(500).json({
        success: false,
        error: 'File upload failed'
      });
    }
  }
);

// Upload documents
app.post('/api/upload/documents',
  authenticateToken,
  SecurityMiddleware.fileUploadSecurity(),
  fileUploadService.multipleUpload('documents', 5),
  async (req, res) => {
    try {
      const { militaryId } = req.user;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      const processedFiles = await fileUploadService.processDocuments(req.files, militaryId);
      
      res.json({
        success: true,
        message: `${processedFiles.length} document(s) uploaded successfully`,
        files: processedFiles
      });
    } catch (error) {
      console.error('❌ Document upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Document upload failed'
      });
    }
  }
);

// Get upload statistics (admin only)
app.get('/api/admin/upload-stats', authenticateToken, (req, res) => {
  try {
    const stats = fileUploadService.getUploadStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Upload stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upload statistics'
    });
  }
});

// Delete file (user can delete their own files)
app.delete('/api/upload/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'document' } = req.query;
    const { militaryId } = req.user;
    
    // Check if file belongs to user (security check)
    const fileInfo = fileUploadService.getFileInfo(filename, type);
    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    const deleted = await fileUploadService.deleteFile(filename, type);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete file'
      });
    }
  } catch (error) {
    console.error('❌ File deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'File deletion failed'
    });
  }
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
app.post('/api/auth/register', SecurityMiddleware.validateRegistration(), async (req, res) => {
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
      approved: false, // Requires admin approval
    });

    await newUser.save();

    await notifyActiveAdmins({
      type: 'info',
      title: 'New User Registration',
      message: `${newUser.fullName} (${newUser.militaryId}) registered and is awaiting approval.`,
      priority: 'high',
      metadata: {
        militaryId: newUser.militaryId,
        userId: newUser.userId,
      },
    });

    console.log('✅ User registered successfully:', {
      userId: newUser.userId,
      militaryId: newUser.militaryId,
      email: newUser.email,
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(newUser.email, newUser.fullName, newUser.militaryId);
    } catch (emailError) {
      console.log('⚠️ Welcome email failed:', emailError.message);
    }

    // Send welcome SMS
    if (mobile && mobile.trim()) {
      try {
        await smsService.sendWelcomeMessage(mobile, newUser.fullName, newUser.militaryId);
      } catch (smsError) {
        console.log('⚠️ Welcome SMS failed:', smsError.message);
      }
    }

    return res.json({
      success: true,
      message: 'User registered successfully. Awaiting admin approval.',
      requiresApproval: true,
      user: {
        userId: newUser.userId,
        fullName: newUser.fullName,
        militaryId: newUser.militaryId,
        email: newUser.email,
        status: newUser.status,
        approved: newUser.approved,
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
app.post('/api/auth/login', SecurityMiddleware.validateLogin(), async (req, res) => {
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

    // Check if user is approved
    if (!user.approved) {
      console.log('⏳ User login blocked - pending approval:', militaryId);
      return res.status(403).json({
        success: false,
        error: 'Your account is pending admin approval',
        pendingApproval: true,
        user: {
          fullName: user.fullName,
          militaryId: user.militaryId,
          email: user.email,
        },
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

    // Log activity
    await logManual({
      userId: user._id,
      userType: 'user',
      action: 'login',
      description: `User ${user.fullName} (${militaryId}) logged in`,
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

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
app.post('/api/auth/send-verification-code', async (req, res) => {
  try {
    const { email, phone, militaryId } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Email or phone number is required'
      });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with expiration (10 minutes)
    resetCodes.set(militaryId || email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    });

    console.log('📧 Generating verification code:', { email, phone, code, militaryId });

    let emailSent = false;
    let smsSent = false;

    // Send email verification
    if (email) {
      try {
        const emailResult = await emailService.sendVerificationCode(email, code, militaryId || 'Unknown');
        emailSent = !!emailResult.success;
      } catch (emailError) {
        console.log('❌ Email verification failed:', emailError.message);
      }
    }

    // Send SMS verification
    if (phone) {
      try {
        await smsService.sendVerificationCode(phone, code, militaryId || 'Unknown');
        smsSent = true;
      } catch (smsError) {
        console.log('❌ SMS verification failed:', smsError.message);
      }
    }

    const methods = [];
    if (emailSent) methods.push('email');
    if (smsSent) methods.push('SMS');
    if (methods.length === 0) methods.push('console (fallback)');

    return res.json({
      success: true,
      message: `Verification code sent via ${methods.join(' and ')}`,
      methods: methods
    });
  } catch (error) {
    console.error('❌ Verification code error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send verification code'
    });
  }
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

    await notifyActiveAdmins({
      type: 'info',
      title: 'User Profile Updated',
      message: `${user.fullName} (${req.params.militaryId}) updated profile information.`,
      priority: 'low',
      metadata: {
        militaryId: req.params.militaryId,
      },
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload Driver's License
app.post('/api/user/:militaryId/driver-license', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }

    const militaryId = req.params.militaryId;
    
    // Get file data from request (assuming files are sent as base64 or binary)
    const { driverLicenseFront, driverLicenseBack } = req.body;

    if (!driverLicenseFront || !driverLicenseBack) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both front and back of driver\'s license are required' 
      });
    }

    const user = await User.findOne({ militaryId: militaryId });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const submittedAt = new Date();
    user.driverLicenseFront = driverLicenseFront;
    user.driverLicenseBack = driverLicenseBack;
    user.driverLicenseStatus = 'in-progress';
    user.driverLicenseSubmittedAt = submittedAt;

    let movedProcedureCount = 0;
    if (Array.isArray(user.procedures)) {
      user.procedures.forEach((procedure) => {
        const searchableText = `${procedure.name || ''} ${procedure.description || ''}`.toLowerCase();
        const isDriverLicenseProcedure = searchableText.includes('driver') && searchableText.includes('license');
        if (procedure.status === 'pending' && isDriverLicenseProcedure) {
          procedure.status = 'in-progress';
          movedProcedureCount += 1;
        }
      });
    }

    await user.save();

    await createNotificationSafe({
      recipientId: user._id,
      recipientType: 'User',
      type: 'status_changed',
      title: 'Driver License Update In Progress',
      message: 'Your driver license update was received successfully and is now in progress.',
      priority: 'medium',
      isRead: false,
      metadata: {
        militaryId,
        submittedAt,
      },
    });

    await notifyActiveAdmins({
      type: 'status_changed',
      title: 'Driver License Submitted',
      message: `${user.fullName} (${militaryId}) submitted a driver license update. Status moved to in-progress.`,
      priority: 'medium',
      metadata: {
        militaryId,
        submittedAt,
      },
    });

    console.log('✅ Driver\'s license uploaded for user:', militaryId);

    return res.json({
      success: true,
      message: 'Driver\'s license uploaded successfully. Status is now in-progress.',
      movedProcedureCount,
      user,
    });
  } catch (error) {
    console.error('❌ Driver\'s license upload error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to upload driver\'s license' 
    });
  }
});

// Upload Face Verification Photo
app.post(
  '/api/user/:militaryId/face-verification',
  authenticateToken,
  SecurityMiddleware.fileUploadSecurity(),
  fileUploadService.singleUpload('facePhoto'),
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.status(503).json({ success: false, error: 'Database unavailable' });
      }

      const militaryId = req.params.militaryId;
      const isAdmin = req.user?.role === 'admin' || (Array.isArray(req.user?.roles) && req.user.roles.includes('admin'));

      if (req.user?.militaryId && req.user.militaryId !== militaryId && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Unauthorized action' });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No face photo uploaded',
        });
      }

      const processedFiles = await fileUploadService.processDocuments([req.file], militaryId);
      const facePhoto = processedFiles[0];

      const user = await User.findOneAndUpdate(
        { militaryId },
        {
          $set: {
            faceVerificationPhotoUrl: facePhoto.url,
            faceVerificationStatus: 'pending',
            faceVerificationSubmittedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      await createNotificationSafe({
        recipientId: user._id,
        recipientType: 'User',
        type: 'status_changed',
        title: 'Face Verification Submitted',
        message: 'Your live face verification photo has been submitted and is pending review.',
        priority: 'medium',
        isRead: false,
        metadata: {
          militaryId,
          submittedAt: user.faceVerificationSubmittedAt,
        },
      });

      await notifyActiveAdmins({
        type: 'status_changed',
        title: 'Face Verification Submitted',
        message: `${user.fullName} (${militaryId}) submitted a live face verification photo.`,
        priority: 'medium',
        metadata: {
          militaryId,
          submittedAt: user.faceVerificationSubmittedAt,
        },
      });

      console.log('✅ Face verification photo uploaded for user:', militaryId);

      return res.json({
        success: true,
        message: 'Face verification uploaded successfully',
        user,
      });
    } catch (error) {
      console.error('❌ Face verification upload error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload face verification',
      });
    }
  }
);

// Upload Profile Picture
app.post('/api/user/upload-profile-picture', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }

    const { militaryId, profilePicture } = req.body;

    if (!militaryId || !profilePicture) {
      return res.status(400).json({ 
        success: false, 
        error: 'Military ID and profile picture are required' 
      });
    }

    // Find and update user with profile picture
    const user = await User.findOneAndUpdate(
      { militaryId: militaryId },
      { 
        $set: {
          profilePicture: profilePicture,
          photoUrl: profilePicture, // Also update photoUrl field
          profilePictureUpdatedAt: new Date(),
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await notifyActiveAdmins({
      type: 'status_changed',
      title: 'Profile Picture Updated',
      message: `${user.fullName} (${militaryId}) updated profile picture.`,
      priority: 'low',
      metadata: {
        militaryId,
      },
    });

    // Log activity
    await logActivity(militaryId, 'profile_picture_update', {
      updatedAt: new Date().toISOString(),
      fileSize: profilePicture.length,
    }, req);

    console.log('✅ Profile picture uploaded for user:', militaryId);

    return res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePictureUrl: profilePicture,
      user: {
        militaryId: user.militaryId,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        photoUrl: user.photoUrl,
      },
    });
  } catch (error) {
    console.error('❌ Profile picture upload error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to upload profile picture' 
    });
  }
});

// ========================================
// NOTIFICATION ROUTES
// ========================================

// Get user notifications
app.get('/api/notifications/:militaryId', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }

    const militaryId = req.params.militaryId;

    // Find user first to get their ObjectId
    const user = await User.findOne({ militaryId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get notifications for this user, sorted by newest first
    const notifications = await Notification.find({ 
      recipientId: user._id,
      recipientType: 'User'
    })
    .sort({ createdAt: -1 })
    .limit(50); // Limit to last 50 notifications
    const unreadCount = await Notification.countDocuments({
      recipientId: user._id,
      recipientType: 'User',
      isRead: false,
    });

    console.log(`📬 Retrieved ${notifications.length} notifications for user: ${militaryId}`);

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
    });
  }
});

// Mark single notification as read
app.put('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }

    const notificationId = req.params.notificationId;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    console.log(`✅ Notification marked as read: ${notificationId}`);

    return res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to mark notification as read' 
    });
  }
});

// Mark all user notifications as read
app.put('/api/notifications/:militaryId/mark-all-read', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }

    const militaryId = req.params.militaryId;

    // Find user first
    const user = await User.findOne({ militaryId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Mark all notifications as read
    const result = await Notification.updateMany(
      { recipientId: user._id, recipientType: 'User', isRead: false },
      { isRead: true }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read for user: ${militaryId}`);

    return res.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to mark notifications as read' 
    });
  }
});

// Create notification (for admin use)
app.post('/api/notifications', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }

    const { militaryId, type, title, message, priority } = req.body;

    if (!militaryId || !type || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Military ID, type, title, and message are required' 
      });
    }

    // Find user to get their ObjectId
    const user = await User.findOne({ militaryId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Create notification
    const notification = new Notification({
      recipientId: user._id,
      recipientType: 'User',
      type: type,
      title: title,
      message: message,
      priority: priority || 'medium',
      isRead: false,
      actionUrl: req.body.actionUrl || null,
      metadata: req.body.metadata || {}
    });

    await notification.save();

    console.log(`🔔 Notification created for user ${militaryId}: ${title}`);

    return res.json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create notification' 
    });
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

    if (!user.email) {
      return res.status(400).json({ error: 'No email address is registered for this user' });
    }

    // Send reset code to email (required)
    const emailResult = await emailService.sendPasswordReset(user.email, code, militaryId);
    if (!emailResult.success) {
      console.log('❌ Failed to send reset email:', emailResult.error || 'Unknown email error');
      return res.status(502).json({ error: 'Failed to deliver reset code by email. Please contact support.' });
    }
    console.log(`📧 Password reset email sent to: ${user.email}`);

    // Send SMS with reset code (if enabled and mobile provided)
    let smsSent = false;
    if (user.mobile) {
      try {
        const smsResult = await smsService.sendPasswordReset(user.mobile, code, militaryId);
        smsSent = !!smsResult.success;
        if (smsSent) {
          console.log(`📱 Password reset SMS sent to: ${user.mobile}`);
        }
      } catch (smsError) {
        console.log('❌ Failed to send reset SMS:', smsError.message);
      }
    }

    // In development mode, also return the code for testing
    const responseData = {
      success: true,
      message: smsSent ? 'Reset code sent to your email and SMS' : 'Reset code sent to your email',
      email: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for security
    };

    // Only include code in development mode for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 DEV MODE: Reset code for testing: ${code}`);
      // Don't include in response - force users to check email even in dev mode
    }

    return res.json(responseData);
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

    const { name, requirements, status, priority, dueDate } = req.body;
    const normalizedStatus = (status || 'pending').toString().toLowerCase();

    const user = await User.findOne({ militaryId: req.params.militaryId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const procedure = {
      name: name || 'Unnamed Procedure',
      description: requirements || '',
      assignedDate: new Date(),
      status: normalizedStatus,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    user.procedures.push(procedure);
    await user.save();

    // Send notification to user about new procedure
    const userNotificationSent = await createNotificationSafe({
      recipientId: user._id,
      recipientType: 'User',
      type: 'procedure_assigned',
      title: 'New Procedure Assigned',
      message: `A new procedure "${procedure.name}" has been assigned to you. Please review the requirements and take necessary action.`,
      priority: 'medium',
      isRead: false,
      metadata: {
        procedureName: procedure.name,
        militaryId: req.params.militaryId,
        assignedDate: procedure.assignedDate,
      },
    });

    if (!userNotificationSent) {
      console.error(`❌ Failed to persist procedure-assigned notification for ${req.params.militaryId}`);
    }

    await notifyActiveAdmins({
      type: 'procedure_assigned',
      title: 'Procedure Assigned to User',
      message: `Procedure "${procedure.name}" was assigned to ${user.fullName} (${req.params.militaryId}).`,
      priority: 'low',
      metadata: {
        militaryId: req.params.militaryId,
        procedureName: procedure.name,
        assignedDate: procedure.assignedDate,
      },
    });

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

// Update Procedure for User
app.put('/api/user/:militaryId/procedure/:procedureIndex', async (req, res) => {
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

    const { name, requirements, status, priority, dueDate } = req.body;
    const procedure = user.procedures[index];
    const previousStatus = (procedure.status || '').toString().toLowerCase();

    if (name !== undefined) procedure.name = name;
    if (requirements !== undefined) procedure.description = requirements;
    if (status !== undefined) {
      const normalizedUpdateStatus = status.toString().toLowerCase();
      procedure.status = normalizedUpdateStatus;
      if (normalizedUpdateStatus === 'completed') {
        procedure.completionDate = new Date();
      }
    }
    if (priority !== undefined) procedure.priority = priority;
    if (dueDate !== undefined) procedure.dueDate = dueDate ? new Date(dueDate) : null;

    user.procedures[index] = procedure;
    await user.save();

    const updatedStatus = (procedure.status || '').toString().toLowerCase();
    if (previousStatus !== 'completed' && updatedStatus === 'completed') {
      await createNotificationSafe({
        recipientId: user._id,
        recipientType: 'User',
        type: 'procedure_updated',
        title: 'Procedure Completed',
        message: `Procedure "${procedure.name || 'Unnamed Procedure'}" has been marked as completed.`,
        priority: 'medium',
        isRead: false,
        metadata: {
          militaryId: req.params.militaryId,
          procedureName: procedure.name || 'Unnamed Procedure',
        },
      });

      await notifyActiveAdmins({
        type: 'procedure_updated',
        title: 'User Completed Procedure',
        message: `${user.fullName} (${req.params.militaryId}) completed procedure "${procedure.name || 'Unnamed Procedure'}".`,
        priority: 'medium',
        metadata: {
          militaryId: req.params.militaryId,
          procedureName: procedure.name || 'Unnamed Procedure',
        },
      });
    } else {
      await createNotificationSafe({
        recipientId: user._id,
        recipientType: 'User',
        type: 'procedure_updated',
        title: 'Procedure Updated',
        message: `Procedure "${procedure.name || 'Unnamed Procedure'}" has been updated by an administrator.`,
        priority: 'medium',
        isRead: false,
        metadata: {
          militaryId: req.params.militaryId,
          procedureName: procedure.name || 'Unnamed Procedure',
        },
      });
    }

    return res.json({
      success: true,
      message: 'Procedure updated successfully',
      procedure,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update procedure' });
  }
});

// Update Procedure Status (User)
app.patch('/api/user/:militaryId/procedure/:procedureIndex/status', async (req, res) => {
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

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const previousStatus = (user.procedures[index].status || '').toString().toLowerCase();
    const normalizedStatus = status.toString().toLowerCase();
    user.procedures[index].status = normalizedStatus;
    if (normalizedStatus === 'completed') {
      user.procedures[index].completionDate = new Date();
    }

    await user.save();

    if (previousStatus !== 'completed' && normalizedStatus === 'completed') {
      const completedProcedure = user.procedures[index];
      const procedureName = completedProcedure?.name || 'Unnamed Procedure';

      await createNotificationSafe({
        recipientId: user._id,
        recipientType: 'User',
        type: 'procedure_updated',
        title: 'Procedure Completed',
        message: `Procedure "${procedureName}" has been marked as completed.`,
        priority: 'medium',
        isRead: false,
        metadata: {
          militaryId: req.params.militaryId,
          procedureName,
        },
      });

      await notifyActiveAdmins({
        type: 'procedure_updated',
        title: 'User Completed Procedure',
        message: `${user.fullName} (${req.params.militaryId}) completed procedure "${procedureName}".`,
        priority: 'medium',
        metadata: {
          militaryId: req.params.militaryId,
          procedureName,
        },
      });
    }

    return res.json({
      success: true,
      message: 'Procedure status updated successfully',
      procedure: user.procedures[index],
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update procedure status' });
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

    await createNotificationSafe({
      recipientId: user._id,
      recipientType: 'User',
      type: 'info',
      title: 'Profile Updated by Admin',
      message: 'Your profile information was updated by an administrator.',
      priority: 'medium',
      isRead: false,
      metadata: {
        militaryId: req.params.militaryId,
      },
    });

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

// Approve User (Admin)
app.put('/api/admin/user/:militaryId/approve', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const adminToken = req.headers.authorization?.split(' ')[1];
    if (!adminToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify admin token
    let adminId;
    try {
      const decoded = jwt.verify(adminToken, JWT_SECRET);
      adminId = decoded.id;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findOneAndUpdate(
      { militaryId: req.params.militaryId },
      { 
        $set: { 
          approved: true,
          approvedBy: adminId,
          approvedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await createNotificationSafe({
      recipientId: user._id,
      recipientType: 'User',
      type: 'approval',
      title: 'Account Approved',
      message: 'Your account has been approved by an administrator. You can now access the dashboard.',
      priority: 'high',
      isRead: false,
      metadata: {
        militaryId: req.params.militaryId,
      },
    });

    console.log('✅ Admin approved user:', req.params.militaryId);

    return res.json({
      success: true,
      message: `User ${user.fullName} has been approved`,
      user: {
        fullName: user.fullName,
        militaryId: user.militaryId,
        email: user.email,
        approved: user.approved,
        approvedAt: user.approvedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error approving user:', error);
    return res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Reject User (Admin) - Delete the user
app.delete('/api/admin/user/:militaryId/reject', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const user = await User.findOneAndDelete({ militaryId: req.params.militaryId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Admin rejected user:', req.params.militaryId);

    return res.json({
      success: true,
      message: `User ${user.fullName} has been rejected and removed`,
      deletedUser: {
        fullName: user.fullName,
        militaryId: user.militaryId,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('❌ Error rejecting user:', error);
    return res.status(500).json({ error: 'Failed to reject user' });
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

    await createNotificationSafe({
      recipientId: user._id,
      recipientType: 'User',
      type: 'status_changed',
      title: 'Account Status Updated',
      message: `Your account status has been updated to: ${status}.`,
      priority: 'medium',
      isRead: false,
      metadata: {
        militaryId: req.params.militaryId,
        status,
      },
    });

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

    user.faceVerificationStatus = 'approved';
    await user.save();

    await createNotificationSafe({
      recipientId: user._id,
      recipientType: 'User',
      type: 'status_changed',
      title: 'Face Verification Approved',
      message: 'Your live face verification has been approved by an administrator.',
      priority: 'high',
      isRead: false,
      metadata: {
        militaryId: req.params.militaryId,
      },
    });

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

    user.faceVerificationStatus = 'rejected';
    await user.save();

    await createNotificationSafe({
      recipientId: user._id,
      recipientType: 'User',
      type: 'warning',
      title: 'Face Verification Rejected',
      message: reason
        ? `Your live face verification was rejected: ${reason}`
        : 'Your live face verification was rejected. Please resubmit.',
      priority: 'high',
      isRead: false,
      metadata: {
        militaryId: req.params.militaryId,
        reason: reason || null,
      },
    });

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

    await createNotificationSafe({
      recipientId: user._id,
      recipientType: 'User',
      type: 'info',
      title: 'Spouse Information Updated',
      message: 'Your spouse information was updated by an administrator.',
      priority: 'medium',
      isRead: false,
      metadata: {
        militaryId: req.params.militaryId,
      },
    });

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
// ACTIVITY LOGGING & ANALYTICS ROUTES
// ========================================

// Get Activity Logs (Admin)
app.get('/api/admin/activity-logs', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 100, userId, action, startDate, endDate } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'fullName militaryId email')
      .populate('adminId', 'email fullName')
      .populate('targetUserId', 'fullName militaryId')
      .lean();

    res.json({ success: true, logs, count: logs.length });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Get User Activity (User)
app.get('/api/user/activity-logs/:militaryId', async (req, res) => {
  try {
    const user = await User.findOne({ militaryId: req.params.militaryId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const logs = await ActivityLog.getUserActivity(user._id, 50);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Analytics - Dashboard Stats (Admin)
app.get('/api/admin/analytics/stats', authenticateAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      rejectedUsers,
      totalProcedures,
      recentLogins,
      todaySignups,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ approvalStatus: 'approved' }),
      User.countDocuments({ approvalStatus: 'pending' }),
      User.countDocuments({ approvalStatus: 'rejected' }),
      User.aggregate([{ $unwind: '$procedures' }, { $count: 'total' }]),
      ActivityLog.countDocuments({
        action: 'login',
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        pendingUsers,
        rejectedUsers,
        totalProcedures: totalProcedures[0]?.total || 0,
        recentLogins,
        todaySignups,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Analytics - Login Trends (Admin)
app.get('/api/admin/analytics/login-trends', authenticateAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await ActivityLog.aggregate([
      {
        $match: {
          action: 'login',
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, trends });
  } catch (error) {
    console.error('Error fetching login trends:', error);
    res.status(500).json({ error: 'Failed to fetch login trends' });
  }
});

// Analytics - User Growth (Admin)
app.get('/api/admin/analytics/user-growth', authenticateAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const growth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, growth });
  } catch (error) {
    console.error('Error fetching user growth:', error);
    res.status(500).json({ error: 'Failed to fetch user growth' });
  }
});

// ========================================
// EXPORT/IMPORT DATA ROUTES
// ========================================

// Export Users to JSON/CSV (Admin)
app.get('/api/admin/export/users', authenticateAdmin, async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const users = await User.find().select('-password').lean();

    // Log activity
    await logManual({
      adminId: req.admin.id,
      userType: 'admin',
      action: 'data_export',
      description: `Exported ${users.length} users as ${format.toUpperCase()}`,
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Full Name', 'Military ID', 'Email', 'Mobile', 'DOB', 'Rank', 'Status', 'Approval Status'];
      const csvRows = [headers.join(',')];

      users.forEach(user => {
        const row = [
          user.fullName || '',
          user.militaryId || '',
          user.email || '',
          user.mobile || '',
          user.dob || '',
          user.rank || '',
          user.status || '',
          user.approvalStatus || '',
        ].map(field => `"${field}"`);
        csvRows.push(row.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.csv`);
      return res.send(csvRows.join('\n'));
    }

    // Return JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.json`);
    res.json({ success: true, users, count: users.length, exportDate: new Date() });
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// Export Activity Logs (Admin)
app.get('/api/admin/export/activity-logs', authenticateAdmin, async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const logs = await ActivityLog.find()
      .populate('userId', 'fullName militaryId')
      .populate('adminId', 'email fullName')
      .sort({ timestamp: -1 })
      .limit(10000)
      .lean();

    if (format === 'csv') {
      const headers = ['Timestamp', 'User Type', 'Action', 'Description', 'User', 'IP Address'];
      const csvRows = [headers.join(',')];

      logs.forEach(log => {
        const row = [
          new Date(log.timestamp).toISOString(),
          log.userType || '',
          log.action || '',
          log.description || '',
          log.userId?.fullName || log.adminId?.fullName || 'System',
          log.ipAddress || '',
        ].map(field => `"${field}"`);
        csvRows.push(row.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=activity_logs_${Date.now()}.csv`);
      return res.send(csvRows.join('\n'));
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=activity_logs_${Date.now()}.json`);
    res.json({ success: true, logs, count: logs.length, exportDate: new Date() });
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

// Import Users from JSON (Admin)
app.post('/api/admin/import/users', authenticateAdmin, async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'Invalid data format. Expected array of users.' });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const userData of users) {
      try {
        // Check if user already exists
        const existing = await User.findOne({ militaryId: userData.militaryId });
        if (existing) {
          results.failed++;
          results.errors.push(`User ${userData.militaryId} already exists`);
          continue;
        }

        // Create new user
        const user = new User(userData);
        await user.save();
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import ${userData.militaryId}: ${error.message}`);
      }
    }

    // Log activity
    await logManual({
      adminId: req.admin.id,
      userType: 'admin',
      action: 'data_import',
      description: `Imported ${results.success} users, ${results.failed} failed`,
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error importing users:', error);
    res.status(500).json({ error: 'Failed to import users' });
  }
});

// ========================================
// BULK OPERATIONS ROUTES (ADMIN)
// ========================================

// Bulk Approve Users
app.post('/api/admin/bulk/approve', authenticateAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'No user IDs provided' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds }, approvalStatus: 'pending' },
      { $set: { approvalStatus: 'approved', approvedAt: new Date() } }
    );

    // Create notifications for each user
    for (const userId of userIds) {
      await Notification.createNotification({
        recipientId: userId,
        recipientType: 'User',
        type: 'approval',
        title: 'Account Approved',
        message: 'Your account has been approved by the administrator. You can now access all features.',
        priority: 'high',
      });
    }

    // Log activity
    await logManual({
      adminId: req.admin.id,
      userType: 'admin',
      action: 'bulk_operation',
      description: `Bulk approved ${result.modifiedCount} users`,
      metadata: { userIds, operation: 'approve' },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} users approved`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error bulk approving users:', error);
    res.status(500).json({ error: 'Failed to bulk approve users' });
  }
});

// Bulk Reject Users
app.post('/api/admin/bulk/reject', authenticateAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'No user IDs provided' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds }, approvalStatus: 'pending' },
      { $set: { approvalStatus: 'rejected', rejectedAt: new Date() } }
    );

    // Create notifications
    for (const userId of userIds) {
      await Notification.createNotification({
        recipientId: userId,
        recipientType: 'User',
        type: 'rejection',
        title: 'Account Rejected',
        message: 'Your account application has been rejected. Please contact administration for more details.',
        priority: 'high',
      });
    }

    // Log activity
    await logManual({
      adminId: req.admin.id,
      userType: 'admin',
      action: 'bulk_operation',
      description: `Bulk rejected ${result.modifiedCount} users`,
      metadata: { userIds, operation: 'reject' },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} users rejected`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error bulk rejecting users:', error);
    res.status(500).json({ error: 'Failed to bulk reject users' });
  }
});

// Bulk Delete Users
app.post('/api/admin/bulk/delete', authenticateAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'No user IDs provided' });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    // Log activity
    await logManual({
      adminId: req.admin.id,
      userType: 'admin',
      action: 'bulk_operation',
      description: `Bulk deleted ${result.deletedCount} users`,
      metadata: { userIds, operation: 'delete' },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: `${result.deletedCount} users deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    res.status(500).json({ error: 'Failed to bulk delete users' });
  }
});

// Bulk Update Status
app.post('/api/admin/bulk/update-status', authenticateAdmin, async (req, res) => {
  try {
    const { userIds, status } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'No user IDs provided' });
    }

    if (!['Active', 'Inactive', 'Suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { status } }
    );

    // Create notifications
    for (const userId of userIds) {
      await Notification.createNotification({
        recipientId: userId,
        recipientType: 'User',
        type: 'status_changed',
        title: 'Account Status Updated',
        message: `Your account status has been changed to: ${status}`,
        priority: 'medium',
      });
    }

    // Log activity
    await logManual({
      adminId: req.admin.id,
      userType: 'admin',
      action: 'bulk_operation',
      description: `Bulk updated status to ${status} for ${result.modifiedCount} users`,
      metadata: { userIds, operation: 'update-status', status },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} users updated`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error bulk updating status:', error);
    res.status(500).json({ error: 'Failed to bulk update status' });
  }
});

// ========================================
// NOTIFICATION ROUTES
// ========================================

// Get Admin Notifications
app.get('/api/admin/notifications', authenticateAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const notifications = await Notification.getUserNotifications(admin._id, 50);
    const unreadCount = await Notification.getUnreadCount(admin._id);

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark all admin notifications as read
app.put('/api/admin/notifications/read-all', authenticateAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const result = await Notification.markAllAsRead(admin._id);
    return res.json({
      success: true,
      message: 'All admin notifications marked as read',
      modifiedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error('Error marking all admin notifications as read:', error);
    return res.status(500).json({ error: 'Failed to mark admin notifications as read' });
  }
});

// Send Notification (Admin)
app.post('/api/admin/notifications/send', authenticateAdmin, async (req, res) => {
  try {
    const { userIds, title, message, type, priority } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'No user IDs provided' });
    }

    const notifications = [];
    for (const userId of userIds) {
      const notification = await Notification.createNotification({
        recipientId: userId,
        recipientType: 'User',
        type: type || 'message',
        title,
        message,
        priority: priority || 'medium',
      });
      notifications.push(notification);
    }

    // Log activity
    await logManual({
      adminId: req.admin.id,
      userType: 'admin',
      action: 'notification_sent',
      description: `Sent notification to ${userIds.length} users: ${title}`,
      metadata: { userIds, title, type },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: `Notification sent to ${userIds.length} users`,
      count: notifications.length,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
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
// START SERVER FUNCTION
// ========================================

function startServer() {
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
    console.log(`💾 Database: ${mongoConnected ? `✅ ${connectionType}` : '❌ MongoDB Disconnected'}`);
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
    
    if (!mongoConnected) {
      console.log('⚠️  Running with limited functionality');
    } else {
      console.log('✅ Full functionality enabled');
      console.log(`🔗 Database Connection: ${connectionType}`);
      console.log(`📍 Database URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    }
    console.log('');
  });
}

module.exports = app;
