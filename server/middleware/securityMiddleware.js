const rateLimit = require('express-rate-limit');
const validator = require('validator');
const helmet = require('helmet');

class SecurityMiddleware {
  
  // Enhanced helmet configuration
  static helmet() {
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      // More permissive CSP for development
      return helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            connectSrc: ["'self'", "http://localhost:*", "https://localhost:*", "ws://localhost:*", "wss://localhost:*"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      });
    } else {
      // Production CSP (more restrictive)
      return helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      });
    }
  }

  // Rate limiting for authentication endpoints
  static authRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 requests per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        console.log(`🚨 Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          error: 'Too many authentication attempts, please try again later.',
          retryAfter: '15 minutes'
        });
      }
    });
  }

  // Rate limiting for general API endpoints
  static generalRateLimit() {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isDevelopment ? 5000 : 500,
      message: {
        error: 'Too many requests, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Avoid false-positive throttling on frequently polled read endpoints.
        if (req.method !== 'GET') return false;
        return /^\/(notifications\/[^/]+|user\/NSS-\d{6})$/.test(req.path);
      }
    });
  }

  // Input sanitization middleware
  static sanitizeInput() {
    return (req, res, next) => {
      // Sanitize body parameters
      if (req.body) {
        Object.keys(req.body).forEach(key => {
          if (typeof req.body[key] === 'string') {
            // Remove potentially dangerous characters
            req.body[key] = validator.escape(req.body[key]);
            
            // Trim whitespace
            req.body[key] = req.body[key].trim();
          }
        });
      }

      // Sanitize query parameters
      if (req.query) {
        Object.keys(req.query).forEach(key => {
          if (typeof req.query[key] === 'string') {
            req.query[key] = validator.escape(req.query[key].trim());
          }
        });
      }

      next();
    };
  }

  // Input validation for user registration
  static validateRegistration() {
    return (req, res, next) => {
      const { fullName, email, mobile, password, militaryId } = req.body;
      const errors = [];

      // Validate full name
      if (!fullName || !validator.isLength(fullName, { min: 2, max: 100 })) {
        errors.push('Full name must be between 2 and 100 characters');
      }

      // Validate email
      if (!email || !validator.isEmail(email)) {
        errors.push('Please provide a valid email address');
      }

      // Validate military ID
      if (!militaryId || !/^NSS-\d{6}$/.test(militaryId)) {
        errors.push('Military ID must be in format NSS-XXXXXX');
      }

      // Validate mobile number
      if (mobile && !validator.isMobilePhone(mobile, 'any')) {
        errors.push('Please provide a valid mobile number');
      }

      // Validate password strength
      if (!password || !validator.isLength(password, { min: 8 })) {
        errors.push('Password must be at least 8 characters long');
      }
      
      if (password && !validator.isStrongPassword(password, {
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      })) {
        errors.push('Password must contain uppercase, lowercase, number, and special character');
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }

      next();
    };
  }

  // Input validation for login
  static validateLogin() {
    return (req, res, next) => {
      const { militaryId, password } = req.body;
      const errors = [];

      if (!militaryId || !/^NSS-\d{6}$/.test(militaryId)) {
        errors.push('Invalid military ID format');
      }

      if (!password || !validator.isLength(password, { min: 1 })) {
        errors.push('Password is required');
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }

      next();
    };
  }

  // Security headers middleware
  static securityHeaders() {
    return (req, res, next) => {
      // CSRF protection
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=(self)',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      next();
    };
  }

  // Log security events
  static logSecurity() {
    return (req, res, next) => {
      // Log suspicious activity
      const suspiciousPatterns = [
        /sql/i,
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i
      ];

      const requestData = JSON.stringify(req.body) + JSON.stringify(req.query);
      
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(requestData)) {
          console.log(`🚨 SECURITY ALERT: Suspicious request detected`);
          console.log(`IP: ${req.ip}`);
          console.log(`URL: ${req.originalUrl}`);
          console.log(`Data: ${requestData}`);
          console.log(`User-Agent: ${req.get('User-Agent')}`);
        }
      });

      next();
    };
  }

  // File upload security
  static fileUploadSecurity() {
    return (req, res, next) => {
      // Only allow uploads for authenticated users
      if (!req.user && !req.admin) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for file uploads'
        });
      }

      // Check file upload permissions
      const allowedRoles = ['user', 'admin'];
      const userRole = req.admin ? 'admin' : 'user';
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions for file upload'
        });
      }

      next();
    };
  }

  // Request size limiter
  static requestSizeLimiter() {
    return (req, res, next) => {
      const maxSize = 50 * 1024 * 1024; // 50MB max request size
      
      if (req.get('content-length') > maxSize) {
        return res.status(413).json({
          success: false,
          error: 'Request too large'
        });
      }

      next();
    };
  }
}

module.exports = SecurityMiddleware;
