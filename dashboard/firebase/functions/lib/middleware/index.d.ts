import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
/**
 * Authentication middleware - verifies Firebase ID token
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export declare const optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Authorization middleware - checks user roles
 */
export declare const authorize: (allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Rate limiting middleware
 */
export declare const rateLimit: (limiterType?: "api" | "auth" | "content") => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Request validation middleware
 */
export declare const validateRequest: (schema: any) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * CORS middleware with environment-specific origins
 */
export declare const corsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Security headers middleware
 */
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request logging middleware
 */
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Error handling middleware (should be last)
 */
export declare const errorMiddleware: (error: Error, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=index.d.ts.map