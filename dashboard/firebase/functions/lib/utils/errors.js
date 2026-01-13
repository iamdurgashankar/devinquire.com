"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = exports.sanitizeInput = exports.validatePassword = exports.validateEmail = exports.validateRequiredFields = exports.createErrorResponse = exports.createSuccessResponse = exports.asyncHandler = exports.errorHandler = exports.InvalidInputError = exports.RateLimitError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.ApplicationError = void 0;
const types_1 = require("../types");
const config_1 = require("./config");
/**
 * Custom application error class
 */
class ApplicationError extends Error {
    constructor(message, code = types_1.ErrorCodes.INTERNAL_ERROR, statusCode = 500, isOperational = true) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationError = ApplicationError;
/**
 * Predefined error classes for common scenarios
 */
class ValidationError extends ApplicationError {
    constructor(message) {
        super(message, types_1.ErrorCodes.VALIDATION_ERROR, 400);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends ApplicationError {
    constructor(message = 'Authentication required') {
        super(message, types_1.ErrorCodes.AUTHENTICATION_ERROR, 401);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends ApplicationError {
    constructor(message = 'Insufficient permissions') {
        super(message, types_1.ErrorCodes.AUTHORIZATION_ERROR, 403);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends ApplicationError {
    constructor(message = 'Resource not found') {
        super(message, types_1.ErrorCodes.NOT_FOUND, 404);
    }
}
exports.NotFoundError = NotFoundError;
class RateLimitError extends ApplicationError {
    constructor(message = 'Rate limit exceeded') {
        super(message, types_1.ErrorCodes.RATE_LIMIT_EXCEEDED, 429);
    }
}
exports.RateLimitError = RateLimitError;
class InvalidInputError extends ApplicationError {
    constructor(message) {
        super(message, types_1.ErrorCodes.INVALID_INPUT, 400);
    }
}
exports.InvalidInputError = InvalidInputError;
/**
 * Error handler middleware for Express routes
 */
const errorHandler = (error, res) => {
    let statusCode = 500;
    let code = types_1.ErrorCodes.INTERNAL_ERROR;
    let message = 'Internal server error';
    // Handle known application errors
    if (error instanceof ApplicationError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        code = types_1.ErrorCodes.VALIDATION_ERROR;
        message = error.message;
    }
    else if (error.message.includes('permission-denied')) {
        statusCode = 403;
        code = types_1.ErrorCodes.AUTHORIZATION_ERROR;
        message = 'Permission denied';
    }
    else if (error.message.includes('not-found')) {
        statusCode = 404;
        code = types_1.ErrorCodes.NOT_FOUND;
        message = 'Resource not found';
    }
    // Log error details (but not in production for security)
    if (config_1.config.isDevelopment()) {
        console.error('Error Details:', {
            message: error.message,
            stack: error.stack,
            code,
            statusCode
        });
    }
    else {
        console.error('Error:', {
            message: error.message,
            code,
            statusCode,
            timestamp: new Date().toISOString()
        });
    }
    // Send error response
    const response = {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    };
    // Include stack trace in development
    if (config_1.config.isDevelopment() && error.stack) {
        response.stack = error.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
/**
 * Async error wrapper for Express route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Creates a standardized success response
 */
const createSuccessResponse = (data, message) => {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
    };
};
exports.createSuccessResponse = createSuccessResponse;
/**
 * Creates a standardized error response
 */
const createErrorResponse = (error, code) => {
    return {
        success: false,
        error,
        timestamp: new Date().toISOString()
    };
};
exports.createErrorResponse = createErrorResponse;
/**
 * Validates required fields in request body
 */
const validateRequiredFields = (body, requiredFields) => {
    const missingFields = requiredFields.filter(field => {
        const value = body[field];
        return value === undefined || value === null || value === '';
    });
    if (missingFields.length > 0) {
        throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }
};
exports.validateRequiredFields = validateRequiredFields;
/**
 * Validates email format
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
/**
 * Validates password strength
 */
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }
    // Add more password validation rules as needed
    // if (!/[A-Z]/.test(password)) {
    //   errors.push('Password must contain at least one uppercase letter');
    // }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validatePassword = validatePassword;
/**
 * Sanitizes user input to prevent XSS
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') {
        return input;
    }
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};
exports.sanitizeInput = sanitizeInput;
/**
 * Generates a slug from a title
 */
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim()
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};
exports.generateSlug = generateSlug;
//# sourceMappingURL=errors.js.map