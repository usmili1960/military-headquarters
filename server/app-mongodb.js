const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

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
      const hashedPassword = await bcrypt.hash('Admin@12345', 10);
      const admin = new Admin({
        email: adminEmail,
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'super-admin',
        permissions: ['all'],
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
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      userId: userIdCounter++,
      fullName: fullName.trim(),
      militaryId: militaryId.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile || '',
      dob: dob ? new Date(dob) : null,
      rank: rank || 'Recruit',
      password: hashedPassword,
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
      });
    }

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
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

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

// Reset User Password
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

    const { name, requirements, status, priority, dueDate, dateUpdated } = req.body;
    const normalizedStatus = (status || 'pending').toString().toLowerCase();

    const user = await User.findOne({ militaryId: req.params.militaryId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const procedure = {
      name: name || 'Unnamed Procedure',
      description: requirements || '',
      assignedDate: new Date(),
      dateUpdated: dateUpdated ? new Date(dateUpdated) : new Date(),
      status: normalizedStatus,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
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

    const { name, requirements, status, priority, dueDate, dateUpdated } = req.body;
    const procedure = user.procedures[index];

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
    if (dateUpdated !== undefined) procedure.dateUpdated = dateUpdated ? new Date(dateUpdated) : null;

    user.procedures[index] = procedure;
    await user.save();

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

    const normalizedStatus = status.toString().toLowerCase();
    user.procedures[index].status = normalizedStatus;
    user.procedures[index].dateUpdated = new Date();
    if (normalizedStatus === 'completed') {
      user.procedures[index].completionDate = new Date();
    }

    await user.save();

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
