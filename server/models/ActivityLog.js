/**
 * Activity Log Schema for Audit Trail
 * Tracks all user and admin actions
 */

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // May be null for system actions
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false,
  },
  userType: {
    type: String,
    enum: ['user', 'admin', 'system'],
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'signup',
      'profile_update',
      'password_change',
      'user_approved',
      'user_rejected',
      'user_deleted',
      'procedure_added',
      'procedure_updated',
      'procedure_deleted',
      'bulk_operation',
      'data_export',
      'data_import',
      'notification_sent',
      'status_changed',
      'email_sent',
      'failed_login',
      'account_locked',
    ],
  },
  description: {
    type: String,
    required: true,
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // For actions performed on other users
  },
  ipAddress: {
    type: String,
    required: false,
  },
  userAgent: {
    type: String,
    required: false,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false, // Additional data about the action
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ adminId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

// Static method to log activity
activityLogSchema.statics.logActivity = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    console.log(`✅ Activity logged: ${data.action}`);
    return log;
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    return null;
  }
};

// Static method to get user activity
activityLogSchema.statics.getUserActivity = async function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('adminId', 'email')
    .lean();
};

// Static method to get admin activity
activityLogSchema.statics.getAdminActivity = async function(adminId, limit = 50) {
  return this.find({ adminId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('targetUserId', 'fullName militaryId')
    .lean();
};

// Static method to get recent activity (all users)
activityLogSchema.statics.getRecentActivity = async function(limit = 100) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'fullName militaryId')
    .populate('adminId', 'email')
    .populate('targetUserId', 'fullName militaryId')
    .lean();
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
