"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.requestLogger = exports.securityHeaders = exports.corsMiddleware = exports.validateRequest = exports.rateLimit = exports.authorize = exports.optionalAuthenticate = exports.authenticate = void 0;
const errors_1 = require("../utils/errors");
const config_1 = require("../utils/config");
// Import Firebase Admin SDK
const admin = require('firebase-admin');
// Simple in-memory rate limiter
class SimpleRateLimiter {
    constructor(options) {
        this.requests = new Map();
        this.points = options.points;
        this.duration = options.duration * 1000; // Convert to milliseconds
    }
    async consume(key) {
        const now = Date.now();
        const record = this.requests.get(key);
        if (!record || now > record.resetTime) {
            this.requests.set(key, { count: 1, resetTime: now + this.duration });
            return;
        }
        if (record.count >= this.points) {
            const msBeforeNext = record.resetTime - now;
            throw { msBeforeNext };
        }
        record.count++;
    }
}
/**
 * Rate limiter instances
 */
const rateLimiters = {
    // General API rate limiter
    api: new SimpleRateLimiter({
        points: 100, // 100 requests
        duration: 900, // 15 minutes
    }),
    // Stricter rate limiter for authentication endpoints
    auth: new SimpleRateLimiter({
        points: 5, // 5 attempts
        duration: 900, // 15 minutes
    }),
    // Content creation rate limiter
    content: new SimpleRateLimiter({
        points: 10, // 10 posts per hour
        duration: 3600, // 1 hour
    })
};
/**
 * Authentication middleware - verifies Firebase ID token
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.AuthenticationError('No valid authorization header found');
        }
        const idToken = authHeader.split('Bearer ')[1];
        if (!idToken) {
            throw new errors_1.AuthenticationError('No token provided');
        }
        // Verify the ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        // Get user record for additional information
        const userRecord = await admin.auth().getUser(decodedToken.uid);
        // Attach user information to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            displayName: decodedToken.name || userRecord.displayName || '',
            photoURL: decodedToken.picture || userRecord.photoURL || '',
            role: decodedToken.role || 'user',
            customClaims: decodedToken,
            createdAt: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
            emailVerified: decodedToken.email_verified || false
        };
        next();
    }
    catch (error) {
        if (error instanceof errors_1.AuthenticationError) {
            res.status(401).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
        else {
            console.error('Authentication error:', error);
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
                timestamp: new Date().toISOString()
            });
        }
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const idToken = authHeader.split('Bearer ')[1];
            if (idToken) {
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                const userRecord = await admin.auth().getUser(decodedToken.uid);
                req.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email || '',
                    displayName: decodedToken.name || userRecord.displayName || '',
                    photoURL: decodedToken.picture || userRecord.photoURL || '',
                    role: decodedToken.role || 'user',
                    customClaims: decodedToken,
                    createdAt: userRecord.metadata.creationTime,
                    lastSignInTime: userRecord.metadata.lastSignInTime,
                    emailVerified: decodedToken.email_verified || false
                };
            }
        }
        next();
    }
    catch (error) {
        // Continue without authentication if token is invalid
        console.warn('Optional authentication failed:', error);
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
/**
 * Authorization middleware - checks user roles
 */
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                timestamp: new Date().toISOString()
            });
            return;
        }
        if (!allowedRoles.includes(authReq.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                timestamp: new Date().toISOString()
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Rate limiting middleware
 */
const rateLimit = (limiterType = 'api') => {
    return async (req, res, next) => {
        var _a;
        try {
            const limiter = rateLimiters[limiterType];
            const key = limiterType === 'content'
                ? ((_a = req.user) === null || _a === void 0 ? void 0 : _a.uid) || req.ip || 'unknown'
                : req.ip || 'unknown';
            await limiter.consume(key);
            next();
        }
        catch (rejRes) {
            const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
            res.set('Retry-After', String(secs));
            res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                retryAfter: secs,
                timestamp: new Date().toISOString()
            });
        }
    };
};
exports.rateLimit = rateLimit;
/**
 * Request validation middleware
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessage = error.details
                .map((detail) => detail.message)
                .join(', ');
            res.status(400).json({
                success: false,
                error: `Validation error: ${errorMessage}`,
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Replace request body with validated and sanitized data
        req.body = value;
        next();
    };
};
exports.validateRequest = validateRequest;
/**
 * CORS middleware with environment-specific origins
 */
const corsMiddleware = (req, res, next) => {
    const allowedOrigins = config_1.config.getCorsOrigins();
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
};
exports.corsMiddleware = corsMiddleware;
/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.header('X-Frame-Options', 'DENY');
    // Prevent MIME type sniffing
    res.header('X-Content-Type-Options', 'nosniff');
    // Enable XSS protection
    res.header('X-XSS-Protection', '1; mode=block');
    // Referrer policy
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Content Security Policy (basic)
    if (config_1.config.isDevelopment()) {
        res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:;");
    }
    else {
        res.header('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline';");
    }
    next();
};
exports.securityHeaders = securityHeaders;
/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, url, ip } = req;
    const userAgent = req.get('User-Agent') || 'Unknown';
    // Log request
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${ip} - ${userAgent}`);
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        console.log(`[${new Date().toISOString()}] ${method} ${url} - ${statusCode} - ${duration}ms`);
    });
    next();
};
exports.requestLogger = requestLogger;
/**
 * Error handling middleware (should be last)
 */
const errorMiddleware = (error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: config_1.config.isDevelopment() ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
    });
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=index.js.map