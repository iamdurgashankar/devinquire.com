import { Response } from 'express';
import { AppError, ErrorCodes, ApiResponse } from '../types';
import { config } from './config';

/**
 * Custom application error class
 */
export class ApplicationError extends Error implements AppError {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = ErrorCodes.INTERNAL_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error classes for common scenarios
 */
export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, ErrorCodes.VALIDATION_ERROR, 400);
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorCodes.AUTHENTICATION_ERROR, 401);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, ErrorCodes.AUTHORIZATION_ERROR, 403);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found') {
    super(message, ErrorCodes.NOT_FOUND, 404);
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, ErrorCodes.RATE_LIMIT_EXCEEDED, 429);
  }
}

export class InvalidInputError extends ApplicationError {
  constructor(message: string) {
    super(message, ErrorCodes.INVALID_INPUT, 400);
  }
}

/**
 * Error handler middleware for Express routes
 */
export const errorHandler = (error: Error, res: Response): void => {
  let statusCode = 500;
  let code: string = ErrorCodes.INTERNAL_ERROR;
  let message = 'Internal server error';

  // Handle known application errors
  if (error instanceof ApplicationError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = ErrorCodes.VALIDATION_ERROR;
    message = error.message;
  } else if (error.message.includes('permission-denied')) {
    statusCode = 403;
    code = ErrorCodes.AUTHORIZATION_ERROR;
    message = 'Permission denied';
  } else if (error.message.includes('not-found')) {
    statusCode = 404;
    code = ErrorCodes.NOT_FOUND;
    message = 'Resource not found';
  }

  // Log error details (but not in production for security)
  if (config.isDevelopment()) {
    console.error('Error Details:', {
      message: error.message,
      stack: error.stack,
      code,
      statusCode
    });
  } else {
    console.error('Error:', {
      message: error.message,
      code,
      statusCode,
      timestamp: new Date().toISOString()
    });
  }

  // Send error response
  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  // Include stack trace in development
  if (config.isDevelopment() && error.stack) {
    (response as any).stack = error.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async error wrapper for Express route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Creates a standardized success response
 */
export const createSuccessResponse = <T>(
  data?: T,
  message?: string
): ApiResponse<T> => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Creates a standardized error response
 */
export const createErrorResponse = (
  error: string,
  code?: string
): ApiResponse => {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString()
  };
};

/**
 * Validates required fields in request body
 */
export const validateRequiredFields = (
  body: any,
  requiredFields: string[]
): void => {
  const missingFields = requiredFields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

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

/**
 * Sanitizes user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
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

/**
 * Generates a slug from a title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};