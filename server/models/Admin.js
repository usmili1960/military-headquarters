/**
 * Admin Schema Definition for MongoDB
 * Handles admin user roles and permissions
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  adminId: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'moderator'],
    default: 'admin',
  },
  permissions: {
    type: [String],
    enum: [
      'view_users',
      'edit_users',
      'delete_users',
      'assign_procedures',
      'manage_procedures',
      'view_reports',
      'manage_admins',
      'view_logs',
      'export_data',
    ],
    default: [],
  },
  department: String,
  phone: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  locked: {
    type: Boolean,
    default: false,
  },
  lockedUntil: Date,
  auditLog: [{
    timestamp: Date,
    action: String,
    details: String,
    targetUser: mongoose.Schema.Types.ObjectId,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if admin has specific permission
adminSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

// Set default permissions based on role
adminSchema.pre('save', function (next) {
  if (!this.isModified('role')) return next();

  const rolePermissions = {
    superadmin: [
      'view_users',
      'edit_users',
      'delete_users',
      'assign_procedures',
      'manage_procedures',
      'view_reports',
      'manage_admins',
      'view_logs',
      'export_data',
    ],
    admin: [
      'view_users',
      'edit_users',
      'assign_procedures',
      'manage_procedures',
      'view_reports',
      'view_logs',
    ],
    moderator: [
      'view_users',
      'view_reports',
      'view_logs',
    ],
  };

  this.permissions = rolePermissions[this.role] || [];
  next();
});

// Hide sensitive data
adminSchema.methods.toJSON = function () {
  const admin = this.toObject();
  delete admin.password;
  delete admin.loginAttempts;
  delete admin.locked;
  return admin;
};

module.exports = mongoose.model('Admin', adminSchema);
