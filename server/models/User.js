/**
 * User Schema Definition for MongoDB
 * Handles all user-related data structure and validation
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    unique: true,
    required: true,
  },
  militaryId: {
    type: String,
    unique: true,
    required: true,
    match: /^NSS-\d{6}$/,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  mobile: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  rank: {
    type: String,
    enum: ['Recruit', 'Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel', 'General'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'retired', 'deceased'],
    default: 'active',
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  photoUrl: {
    type: String,
    default: null,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String,
  },
  spouse: {
    name: String,
    email: String,
    mobile: String,
    relationship: String,
    dob: Date,
  },
  dependents: [{
    name: String,
    relationship: String,
    dob: Date,
    status: String,
  }],
  healthStatus: {
    bloodType: String,
    allergies: String,
    medicalConditions: String,
    lastCheckup: Date,
    lastVaccine: Date,
  },
  procedures: [{
    procedureId: mongoose.Schema.Types.ObjectId,
    name: String,
    description: String,
    assignedDate: Date,
    dueDate: Date,
    completionDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'rejected'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    assignedBy: mongoose.Schema.Types.ObjectId,
  }],
  roles: {
    type: [String],
    enum: ['user', 'admin', 'supervisor'],
    default: ['user'],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: String,
  verificationCodeExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  loginHistory: [{
    timestamp: Date,
    ipAddress: String,
    userAgent: String,
    status: String,
  }],
  auditLog: [{
    timestamp: Date,
    action: String,
    details: String,
    changedBy: mongoose.Schema.Types.ObjectId,
  }],
  lastLogin: Date,
  deletedAt: Date,
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
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Hide sensitive data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpiry;
  delete user.verificationCode;
  return user;
};

module.exports = mongoose.model('User', userSchema);
