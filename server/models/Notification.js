/**
 * Notification Schema
 * Handles user and admin notifications
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType',
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['User', 'Admin'],
  },
  type: {
    type: String,
    required: true,
    enum: [
      'approval',
      'rejection',
      'procedure_assigned',
      'procedure_updated',
      'status_changed',
      'message',
      'warning',
      'info',
      'system',
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    required: false,
  },
  actionUrl: {
    type: String,
    required: false, // Link to related page/action
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = new this(data);
    await notification.save();
    console.log(`✅ Notification created for ${data.recipientType}: ${data.title}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return null;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(recipientId) {
  return this.countDocuments({ recipientId, isRead: false });
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(notificationId) {
  return this.findByIdAndUpdate(
    notificationId,
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(recipientId) {
  return this.updateMany(
    { recipientId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(recipientId, limit = 50) {
  return this.find({ recipientId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Auto-delete old notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('Notification', notificationSchema);
