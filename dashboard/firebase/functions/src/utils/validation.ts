import { UserRole, ContentStatus } from '../types';

// Simple validation interface
interface ValidationResult {
  error?: {
    details: Array<{
      message: string;
      path: string[];
      context?: any;
    }>;
  };
  value: any;
}

interface ValidationSchema {
  validate(data: any, options?: any): ValidationResult;
}

// Simple validation helpers
class SimpleValidator {
  static string() {
    return new StringValidator();
  }
  
  static number() {
    return new NumberValidator();
  }
  
  static boolean() {
    return new BooleanValidator();
  }
  
  static array() {
    return new ArrayValidator();
  }
  
  static object(schema?: any) {
    return new ObjectValidator(schema);
  }
  
  static date() {
    return new DateValidator();
  }
  
  static binary() {
    return new StringValidator(); // Simplified binary as string
  }
}

class BaseValidator {
  protected _required = false;
  protected _optional = true;
  protected _default: any;
  
  required() {
    this._required = true;
    this._optional = false;
    return this;
  }
  
  optional() {
    this._optional = true;
    this._required = false;
    return this;
  }
  
  default(value: any) {
    this._default = value;
    return this;
  }
}

class StringValidator extends BaseValidator {
  private _minLength?: number;
  private _maxLength?: number;
  private _pattern?: RegExp;
  private _validValues?: string[];
  private _email = false;
  private _uri = false;
  private _trim = false;
  private _lowercase = false;
  private _allowEmpty = false;
  private _exactLength?: number;
  
  min(length: number) {
    this._minLength = length;
    return this;
  }
  
  max(length: number) {
    this._maxLength = length;
    return this;
  }
  
  pattern(regex: RegExp) {
    this._pattern = regex;
    return this;
  }
  
  valid(...values: string[]) {
    this._validValues = values;
    return this;
  }
  
  email() {
    this._email = true;
    return this;
  }
  
  uri() {
    this._uri = true;
    return this;
  }
  
  trim() {
    this._trim = true;
    return this;
  }
  
  lowercase() {
    this._lowercase = true;
    return this;
  }
  
  length(exactLength: number) {
    this._exactLength = exactLength;
    return this;
  }
  
  allow(value: string) {
    if (value === '') {
      this._allowEmpty = true;
    }
    return this;
  }
  
  message(msg: string) {
    return this;
  }
  
  validate(value: any): { error?: string; value?: any } {
    if (value === undefined || value === null) {
      if (this._required) {
        return { error: 'Field is required' };
      }
      return { value: this._default };
    }
    
    if (typeof value !== 'string') {
      return { error: 'Must be a string' };
    }
    
    let processedValue = value;
    
    if (this._trim) {
      processedValue = processedValue.trim();
    }
    
    if (this._lowercase) {
      processedValue = processedValue.toLowerCase();
    }
    
    if (processedValue === '' && !this._allowEmpty && this._required) {
      return { error: 'Field cannot be empty' };
    }
    
    if (this._exactLength && processedValue.length !== this._exactLength) {
      return { error: `Must be exactly ${this._exactLength} characters` };
    }
    
    if (this._minLength && processedValue.length < this._minLength) {
      return { error: `Must be at least ${this._minLength} characters` };
    }
    
    if (this._maxLength && processedValue.length > this._maxLength) {
      return { error: `Must be at most ${this._maxLength} characters` };
    }
    
    if (this._pattern && !this._pattern.test(processedValue)) {
      return { error: 'Invalid format' };
    }
    
    if (this._validValues && !this._validValues.includes(processedValue)) {
      return { error: `Must be one of: ${this._validValues.join(', ')}` };
    }
    
    if (this._email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(processedValue)) {
        return { error: 'Must be a valid email' };
      }
    }
    
    if (this._uri) {
      try {
        new URL(processedValue);
      } catch {
        return { error: 'Must be a valid URL' };
      }
    }
    
    return { value: processedValue };
  }
}

class NumberValidator extends BaseValidator {
  private _min?: number;
  private _max?: number;
  private _integer = false;
  
  min(value: number) {
    this._min = value;
    return this;
  }
  
  max(value: number) {
    this._max = value;
    return this;
  }
  
  integer() {
    this._integer = true;
    return this;
  }
  
  validate(value: any): { error?: string; value?: any } {
    if (value === undefined || value === null) {
      if (this._required) {
        return { error: 'Field is required' };
      }
      return { value: this._default };
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { error: 'Must be a number' };
    }
    
    if (this._integer && !Number.isInteger(numValue)) {
      return { error: 'Must be an integer' };
    }
    
    if (this._min !== undefined && numValue < this._min) {
      return { error: `Must be at least ${this._min}` };
    }
    
    if (this._max !== undefined && numValue > this._max) {
      return { error: `Must be at most ${this._max}` };
    }
    
    return { value: numValue };
  }
}

class BooleanValidator extends BaseValidator {
  validate(value: any): { error?: string; value?: any } {
    if (value === undefined || value === null) {
      if (this._required) {
        return { error: 'Field is required' };
      }
      return { value: this._default };
    }
    
    if (typeof value === 'boolean') {
      return { value };
    }
    
    if (value === 'true' || value === '1' || value === 1) {
      return { value: true };
    }
    
    if (value === 'false' || value === '0' || value === 0) {
      return { value: false };
    }
    
    return { error: 'Must be a boolean' };
  }
}

class ArrayValidator extends BaseValidator {
  private _items?: any;
  private _minItems?: number;
  private _maxItems?: number;
  
  items(validator: any) {
    this._items = validator;
    return this;
  }
  
  min(count: number) {
    this._minItems = count;
    return this;
  }
  
  max(count: number) {
    this._maxItems = count;
    return this;
  }
  
  validate(value: any): { error?: string; value?: any } {
    if (value === undefined || value === null) {
      if (this._required) {
        return { error: 'Field is required' };
      }
      return { value: this._default || [] };
    }
    
    if (!Array.isArray(value)) {
      return { error: 'Must be an array' };
    }
    
    if (this._minItems && value.length < this._minItems) {
      return { error: `Must have at least ${this._minItems} items` };
    }
    
    if (this._maxItems && value.length > this._maxItems) {
      return { error: `Must have at most ${this._maxItems} items` };
    }
    
    if (this._items) {
      const validatedItems = [];
      for (let i = 0; i < value.length; i++) {
        const result = this._items.validate(value[i]);
        if (result.error) {
          return { error: `Item ${i}: ${result.error}` };
        }
        validatedItems.push(result.value);
      }
      return { value: validatedItems };
    }
    
    return { value };
  }
}

class DateValidator extends BaseValidator {
  iso() {
    return this;
  }
  
  validate(value: any): { error?: string; value?: any } {
    if (value === undefined || value === null) {
      if (this._required) {
        return { error: 'Field is required' };
      }
      return { value: this._default };
    }
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { error: 'Must be a valid date' };
    }
    
    return { value: date };
  }
}

class ObjectValidator extends BaseValidator implements ValidationSchema {
  private schema: any;
  private _minKeys?: number;
  
  constructor(schema?: any) {
    super();
    this.schema = schema;
  }
  
  min(minKeys: number) {
    this._minKeys = minKeys;
    return this;
  }
  
  keys(schema: { [key: string]: any }) {
    this.schema = schema;
    return this;
  }
  
  validate(data: any, options?: any): ValidationResult {
    if (!this.schema) {
      return { value: data };
    }
    
    const errors: any[] = [];
    const result: any = {};
    
    const keys = Object.keys(data);
    if (this._minKeys && keys.length < this._minKeys) {
      return {
        error: { details: [{ message: `Must have at least ${this._minKeys} keys`, path: [], context: { value: data } }] },
        value: data
      };
    }
    
    // Validate each field in schema
    for (const [key, validator] of Object.entries(this.schema)) {
      const fieldResult = (validator as any).validate(data[key]);
      if (fieldResult.error) {
        errors.push({
          message: fieldResult.error,
          path: [key],
          context: { value: data[key] }
        });
      } else {
        result[key] = fieldResult.value;
      }
    }
    
    if (errors.length > 0) {
      return {
        error: { details: errors },
        value: result
      };
    }
    
    return { value: result };
  }
}

// Create Joi-like interface
const Joi = SimpleValidator;

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // MongoDB ObjectId pattern
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ID format'),
  
  // Email validation
  email: Joi.string().email().lowercase().trim(),
  
  // Password validation
  password: Joi.string().min(6).max(128),
  
  // URL validation
  url: Joi.string().uri(),
  
  // Slug validation (URL-friendly string)
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).min(1).max(100),
  
  // User role validation
  userRole: Joi.string().valid(...Object.values(UserRole)),
  
  // Content status validation
  contentStatus: Joi.string().valid(...Object.values(ContentStatus)),
  
  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  
  // Search query
  searchQuery: Joi.string().trim().min(1).max(100),
  
  // Date validation
  date: Joi.date().iso(),
  
  // Rich text content (HTML)
  richText: Joi.string().max(50000),
  
  // Plain text content
  plainText: Joi.string().max(10000),
  
  // Title/name validation
  title: Joi.string().trim().min(1).max(200),
  
  // Description validation
  description: Joi.string().trim().max(1000),
  
  // Tags array
  tags: Joi.array().items(Joi.string().trim().min(1).max(50)).max(10),
  
  // File upload validation
  file: Joi.object({
    originalname: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number().max(10 * 1024 * 1024), // 10MB max
    buffer: Joi.binary().required()
  })
};

/**
 * Authentication validation schemas
 */
export const authSchemas = {
  // User registration
  register: Joi.object({
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
    displayName: Joi.string().trim().min(1).max(100).required(),
    photoURL: commonSchemas.url.optional()
  }),
  
  // User login
  login: Joi.object({
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required()
  }),
  
  // Password reset request
  passwordResetRequest: Joi.object({
    email: commonSchemas.email.required()
  }),
  
  // Password reset confirmation
  passwordReset: Joi.object({
    token: Joi.string().required(),
    newPassword: commonSchemas.password.required()
  }),
  
  // Update user profile
  updateProfile: Joi.object({
    displayName: Joi.string().trim().min(1).max(100).optional(),
    photoURL: commonSchemas.url.optional().allow(''),
    bio: commonSchemas.description.optional().allow('')
  }),
  
  // Update user role (admin only)
  updateUserRole: Joi.object({
    userId: Joi.string().required(),
    role: commonSchemas.userRole.required()
  })
};

/**
 * Content validation schemas
 */
export const contentSchemas = {
  // Create/update post
  post: Joi.object({
    title: commonSchemas.title.required(),
    content: commonSchemas.richText.required(),
    excerpt: commonSchemas.description.optional(),
    slug: commonSchemas.slug.optional(),
    status: commonSchemas.contentStatus.default('draft'),
    tags: commonSchemas.tags.optional(),
    featuredImage: commonSchemas.url.optional(),
    seoTitle: Joi.string().trim().max(60).optional(),
    seoDescription: Joi.string().trim().max(160).optional(),
    publishedAt: commonSchemas.date.optional(),
    categoryId: commonSchemas.objectId.optional()
  }),
  
  // Create/update page
  page: Joi.object({
    title: commonSchemas.title.required(),
    content: commonSchemas.richText.required(),
    slug: commonSchemas.slug.required(),
    status: commonSchemas.contentStatus.default('draft'),
    parentId: commonSchemas.objectId.optional(),
    template: Joi.string().trim().max(50).optional(),
    seoTitle: Joi.string().trim().max(60).optional(),
    seoDescription: Joi.string().trim().max(160).optional(),
    publishedAt: commonSchemas.date.optional()
  }),
  
  // Create/update category
  category: Joi.object({
    name: commonSchemas.title.required(),
    description: commonSchemas.description.optional(),
    slug: commonSchemas.slug.required(),
    parentId: commonSchemas.objectId.optional(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
  }),
  
  // Create comment
  comment: Joi.object({
    content: commonSchemas.plainText.required(),
    postId: commonSchemas.objectId.required(),
    parentId: commonSchemas.objectId.optional()
  }),
  
  // Content query parameters
  contentQuery: Joi.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    status: commonSchemas.contentStatus.optional(),
    category: commonSchemas.objectId.optional(),
    tag: Joi.string().trim().optional(),
    search: commonSchemas.searchQuery.optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'publishedAt', 'title').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    author: Joi.string().optional()
  }),
  
  // Bulk operations
  bulkUpdate: Joi.object({
    ids: Joi.array().items(commonSchemas.objectId).min(1).max(50).required(),
    updates: Joi.object({
      status: commonSchemas.contentStatus.optional(),
      categoryId: commonSchemas.objectId.optional(),
      tags: commonSchemas.tags.optional()
    }).min(1).required()
  }),
  
  // File upload
  fileUpload: Joi.object({
    file: commonSchemas.file.required(),
    folder: Joi.string().trim().max(100).optional(),
    public: Joi.boolean().default(false)
  })
};

/**
 * User management validation schemas
 */
export const userSchemas = {
  // Get users query
  getUsersQuery: Joi.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    role: commonSchemas.userRole.optional(),
    search: commonSchemas.searchQuery.optional(),
    sortBy: Joi.string().valid('createdAt', 'lastSignIn', 'displayName', 'email').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    verified: Joi.boolean().optional()
  }),
  
  // Update user (admin)
  updateUser: Joi.object({
    displayName: Joi.string().trim().min(1).max(100).optional(),
    email: commonSchemas.email.optional(),
    role: commonSchemas.userRole.optional(),
    disabled: Joi.boolean().optional(),
    emailVerified: Joi.boolean().optional()
  }),
  
  // Create user (admin)
  createUser: Joi.object({
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
    displayName: Joi.string().trim().min(1).max(100).required(),
    role: commonSchemas.userRole.default('user'),
    emailVerified: Joi.boolean().default(false)
  })
};

/**
 * Settings validation schemas
 */
export const settingsSchemas = {
  // Site settings
  siteSettings: Joi.object({
    siteName: commonSchemas.title.required(),
    siteDescription: commonSchemas.description.optional(),
    siteUrl: commonSchemas.url.required(),
    adminEmail: commonSchemas.email.required(),
    timezone: Joi.string().required(),
    language: Joi.string().length(2).required(),
    postsPerPage: Joi.number().integer().min(1).max(50).default(10),
    allowComments: Joi.boolean().default(true),
    moderateComments: Joi.boolean().default(true),
    allowRegistration: Joi.boolean().default(false)
  }),
  
  // Email settings
  emailSettings: Joi.object({
    smtpHost: Joi.string().required(),
    smtpPort: Joi.number().integer().min(1).max(65535).required(),
    smtpSecure: Joi.boolean().default(true),
    smtpUser: Joi.string().required(),
    smtpPassword: Joi.string().required(),
    fromEmail: commonSchemas.email.required(),
    fromName: Joi.string().trim().min(1).max(100).required()
  })
};

/**
 * Analytics validation schemas
 */
export const analyticsSchemas = {
  // Analytics query
  analyticsQuery: Joi.object({
    startDate: commonSchemas.date.required(),
    endDate: commonSchemas.date.required(),
    metric: Joi.string().valid('views', 'users', 'sessions', 'bounceRate').required(),
    dimension: Joi.string().valid('date', 'page', 'source', 'device').optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100)
  }),
  
  // Track event
  trackEvent: Joi.object({
    event: Joi.string().trim().min(1).max(100).required(),
    category: Joi.string().trim().min(1).max(100).required(),
    label: Joi.string().trim().max(100).optional(),
    value: Joi.number().optional(),
    userId: Joi.string().optional(),
    sessionId: Joi.string().optional(),
    metadata: Joi.object().optional()
  })
};

/**
 * Webhook validation schemas
 */
export const webhookSchemas = {
  // Webhook configuration
  webhook: Joi.object({
    name: commonSchemas.title.required(),
    url: commonSchemas.url.required(),
    events: Joi.array().items(
      Joi.string().valid(
        'post.created', 'post.updated', 'post.deleted',
        'user.created', 'user.updated', 'user.deleted',
        'comment.created', 'comment.updated', 'comment.deleted'
      )
    ).min(1).required(),
    secret: Joi.string().min(16).max(128).optional(),
    active: Joi.boolean().default(true),
    retryAttempts: Joi.number().integer().min(0).max(10).default(3),
    timeout: Joi.number().integer().min(1000).max(30000).default(5000)
  })
};

/**
 * Validation helper functions
 */
export const validateSchema = (schema: ValidationSchema, data: any) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  if (error) {
    const errorMessage = error.details
      .map((detail: any) => detail.message)
      .join(', ');
    throw new Error(`Validation error: ${errorMessage}`);
  }
  
  return value;
};

/**
 * Sanitize HTML content
 */
export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Generate validation error response
 */
export const createValidationError = (error: any) => {
  const details = error.details.map((detail: any) => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value
  }));
  
  return {
    success: false,
    error: 'Validation failed',
    details,
    timestamp: new Date().toISOString()
  };
};