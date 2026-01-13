import { Response } from 'express';
import { AppError, ApiResponse } from '../types';
/**
 * Custom application error class
 */
export declare class ApplicationError extends Error implements AppError {
    readonly code: string;
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, code?: string, statusCode?: number, isOperational?: boolean);
}
/**
 * Predefined error classes for common scenarios
 */
export declare class ValidationError extends ApplicationError {
    constructor(message: string);
}
export declare class AuthenticationError extends ApplicationError {
    constructor(message?: string);
}
export declare class AuthorizationError extends ApplicationError {
    constructor(message?: string);
}
export declare class NotFoundError extends ApplicationError {
    constructor(message?: string);
}
export declare class RateLimitError extends ApplicationError {
    constructor(message?: string);
}
export declare class InvalidInputError extends ApplicationError {
    constructor(message: string);
}
/**
 * Error handler middleware for Express routes
 */
export declare const errorHandler: (error: Error, res: Response) => void;
/**
 * Async error wrapper for Express route handlers
 */
export declare const asyncHandler: (fn: Function) => (req: any, res: any, next: any) => void;
/**
 * Creates a standardized success response
 */
export declare const createSuccessResponse: <T>(data?: T, message?: string) => ApiResponse<T>;
/**
 * Creates a standardized error response
 */
export declare const createErrorResponse: (error: string, code?: string) => ApiResponse;
/**
 * Validates required fields in request body
 */
export declare const validateRequiredFields: (body: any, requiredFields: string[]) => void;
/**
 * Validates email format
 */
export declare const validateEmail: (email: string) => boolean;
/**
 * Validates password strength
 */
export declare const validatePassword: (password: string) => {
    isValid: boolean;
    errors: string[];
};
/**
 * Sanitizes user input to prevent XSS
 */
export declare const sanitizeInput: (input: string) => string;
/**
 * Generates a slug from a title
 */
export declare const generateSlug: (title: string) => string;
//# sourceMappingURL=errors.d.ts.map