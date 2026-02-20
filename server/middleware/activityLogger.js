/**
 * Activity Logging Middleware
 * Automatically logs user and admin actions
 */

const ActivityLog = require('../models/ActivityLog');

/**
 * Extract client IP address
 */
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
};

/**
 * Log activity middleware
 */
const logActivity = (action, description) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after response
    res.json = function(data) {
      // Log activity after successful response
      if (res.statusCode >= 200 && res.statusCode < 400) {
        setImmediate(async () => {
          try {
            const logData = {
              action,
              description: typeof description === 'function' ? description(req, data) : description,
              ipAddress: getClientIp(req),
              userAgent: req.headers['user-agent'],
              timestamp: new Date(),
            };

            // Add user or admin ID
            if (req.user) {
              logData.userId = req.user._id || req.user.id;
              logData.userType = 'user';
            } else if (req.admin) {
              logData.adminId = req.admin._id || req.admin.id;
              logData.userType = 'admin';
            } else {
              logData.userType = 'system';
            }

            // Add target user if present
            if (req.params.userId || req.params.id) {
              logData.targetUserId = req.params.userId || req.params.id;
            }

            // Add metadata
            logData.metadata = {
              method: req.method,
              path: req.path,
              body: req.body ? Object.keys(req.body) : [],
            };

            await ActivityLog.logActivity(logData);
          } catch (error) {
            console.error('❌ Error in activity logging middleware:', error);
          }
        });
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Manual activity logger
 */
const log = async (data) => {
  try {
    return await ActivityLog.logActivity(data);
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    return null;
  }
};

module.exports = {
  logActivity,
  log,
  getClientIp,
};
