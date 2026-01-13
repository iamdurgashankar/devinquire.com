import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../utils/errors';
import { AuthenticatedRequest, UserRole } from '../types';
import { config } from '../utils/config';

// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Simple in-memory rate limiter
class SimpleRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private points: number;
  private duration: number;

  constructor(options: { points: number; duration: number }) {
    this.points = options.points;
    this.duration = options.duration * 1000; // Convert to milliseconds
  }

  async consume(key: string): Promise<void> {
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
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No valid authorization header found');
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      throw new AuthenticationError('No token provided');
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get user record for additional information
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    
    // Attach user information to request
    (req as any).user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: decodedToken.name || userRecord.displayName || '',
      photoURL: decodedToken.picture || userRecord.photoURL || '',
      role: ((decodedToken as any).role as UserRole) || 'user' as UserRole,
      customClaims: decodedToken,
      createdAt: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      emailVerified: decodedToken.email_verified || false
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Authentication error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      });
    }
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      
      if (idToken) {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userRecord = await admin.auth().getUser(decodedToken.uid);
        
        (req as any).user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || userRecord.displayName || '',
          photoURL: decodedToken.picture || userRecord.photoURL || '',
          role: ((decodedToken as any).role as UserRole) || 'user' as UserRole,
          customClaims: decodedToken,
          createdAt: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
          emailVerified: decodedToken.email_verified || false
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    console.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * Authorization middleware - checks user roles
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!allowedRoles.includes((authReq as any).user.role)) {
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

/**
 * Rate limiting middleware
 */
export const rateLimit = (limiterType: 'api' | 'auth' | 'content' = 'api') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limiter = rateLimiters[limiterType];
      const key = limiterType === 'content' 
        ? (req as AuthenticatedRequest).user?.uid || req.ip || 'unknown'
        : req.ip || 'unknown';
      await limiter.consume(key);
      next();
    } catch (rejRes: any) {
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

/**
 * Request validation middleware
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map((detail: any) => detail.message)
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

/**
 * CORS middleware with environment-specific origins
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const allowedOrigins = config.getCorsOrigins();
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

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.header('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.header('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (basic)
  if (config.isDevelopment()) {
    res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:;");
  } else {
    res.header('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline';");
  }

  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Error handling middleware (should be last)
 */
export const errorMiddleware = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    error: config.isDevelopment() ? error.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
};