/**
 * Middleware Index
 * Exports all middleware functions for easy importing
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { firebaseAdmin } = require('../firebaseAdmin');

// Import auth middleware
const {
  authenticateToken,
  requireAuth,
  requireAdmin,
  requireRole,
  requireEmailVerification,
  requireOwnership,
  validateApiKey,
  getUserIdentifier,
  hasAnyRole,
  hasAllRoles
} = require('./auth');

/**
 * Request Logging Middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Red for errors, green for success
    const resetColor = '\x1b[0m';
    
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ` +
      `${statusColor}${res.statusCode}${resetColor} - ${duration}ms - ` +
      `${req.get('User-Agent') || 'Unknown'}`
    );
  });
  
  next();
};

/**
 * Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.uid || null,
    timestamp: new Date().toISOString()
  });
  
  // Firebase specific errors
  if (err.code && err.code.startsWith('auth/')) {
    return res.status(401).json({
      error: 'Authentication error',
      code: err.code,
      message: err.message
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      message: err.message,
      details: err.details || null
    });
  }
  
  // Rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Please slow down your requests',
      retryAfter: err.retryAfter || '1 minute'
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(statusCode).json({
    error: 'Server error',
    code: 'INTERNAL_ERROR',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    message: `The requested resource ${req.originalUrl} was not found`,
    timestamp: new Date().toISOString()
  });
};

/**
 * CORS Configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'https://devinquire.com',
      'https://www.devinquire.com',
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ];
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Forwarded-For'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

/**
 * Security Headers Middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.devinquire.com', 'wss:']
    }
  },
  crossOriginEmbedderPolicy: false // Disable for Firebase compatibility
});

/**
 * Rate Limiting Configuration
 */
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      message,
      retryAfter: Math.ceil(windowMs / 1000 / 60) + ' minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getUserIdentifier(req)
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  general: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    1000, // 1000 requests per window
    'Too many requests from this IP, please try again later.'
  ),
  
  auth: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    10, // 10 auth requests per window
    'Too many authentication attempts, please try again later.'
  ),
  
  email: createRateLimit(
    60 * 60 * 1000, // 1 hour
    5, // 5 email requests per hour
    'Too many email requests, please try again later.'
  ),
  
  upload: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    20, // 20 upload requests per window
    'Too many upload requests, please try again later.'
  )
};

/**
 * Request Validation Middleware
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        message: error.details[0].message,
        details: error.details
      });
    }
    
    next();
  };
};

/**
 * Content Type Validation Middleware
 */
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }
    
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type header is required',
        code: 'CONTENT_TYPE_REQUIRED',
        message: 'Please specify a Content-Type header'
      });
    }
    
    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );
    
    if (!isAllowed) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
        received: contentType
      });
    }
    
    next();
  };
};

/**
 * Request Size Limit Middleware
 */
const requestSizeLimit = express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
});

/**
 * Health Check Middleware
 */
const healthCheck = async (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    try {
      // Check Firebase connection
      const db = firebaseAdmin.getFirestore();
      await db.collection('_health').limit(1).get();
      
      return res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          firebase: 'connected',
          server: 'running'
        },
        version: process.env.npm_package_version || '1.0.0'
      });
    } catch (error) {
      return res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          firebase: 'disconnected',
          server: 'running'
        }
      });
    }
  }
  
  next();
};

/**
 * Activity Logging Middleware
 */
const activityLogger = async (req, res, next) => {
  // Only log significant activities
  const significantMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  const skipPaths = ['/health', '/api/health', '/api/analytics/pageview'];
  
  if (!significantMethods.includes(req.method) || 
      skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Log after response
  res.on('finish', async () => {
    if (res.statusCode < 400 && req.user) {
      try {
        const realtimeDb = firebaseAdmin.getDatabase();
        
        await realtimeDb.ref('activity').push({
          type: 'api_request',
          method: req.method,
          path: req.originalUrl,
          userId: req.user.uid,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (error) {
        console.error('Activity logging failed:', error.message);
      }
    }
  });
  
  next();
};

module.exports = {
  // Auth middleware
  authenticateToken,
  requireAuth,
  requireAdmin,
  requireRole,
  requireEmailVerification,
  requireOwnership,
  validateApiKey,
  getUserIdentifier,
  hasAnyRole,
  hasAllRoles,
  
  // General middleware
  requestLogger,
  errorHandler,
  notFoundHandler,
  healthCheck,
  activityLogger,
  
  // Security middleware
  corsOptions,
  securityHeaders,
  rateLimits,
  
  // Validation middleware
  validateRequest,
  validateContentType,
  requestSizeLimit,
  
  // Utility functions
  createRateLimit
};