"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidationError = exports.sanitizeHtml = exports.validateSchema = exports.webhookSchemas = exports.analyticsSchemas = exports.settingsSchemas = exports.userSchemas = exports.contentSchemas = exports.authSchemas = exports.commonSchemas = void 0;
const types_1 = require("../types");
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
    static object(schema) {
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
    constructor() {
        this._required = false;
        this._optional = true;
    }
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
    default(value) {
        this._default = value;
        return this;
    }
}
class StringValidator extends BaseValidator {
    constructor() {
        super(...arguments);
        this._email = false;
        this._uri = false;
        this._trim = false;
        this._lowercase = false;
        this._allowEmpty = false;
    }
    min(length) {
        this._minLength = length;
        return this;
    }
    max(length) {
        this._maxLength = length;
        return this;
    }
    pattern(regex) {
        this._pattern = regex;
        return this;
    }
    valid(...values) {
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
    length(exactLength) {
        this._exactLength = exactLength;
        return this;
    }
    allow(value) {
        if (value === '') {
            this._allowEmpty = true;
        }
        return this;
    }
    message(msg) {
        return this;
    }
    validate(value) {
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
            }
            catch (_a) {
                return { error: 'Must be a valid URL' };
            }
        }
        return { value: processedValue };
    }
}
class NumberValidator extends BaseValidator {
    constructor() {
        super(...arguments);
        this._integer = false;
    }
    min(value) {
        this._min = value;
        return this;
    }
    max(value) {
        this._max = value;
        return this;
    }
    integer() {
        this._integer = true;
        return this;
    }
    validate(value) {
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
    validate(value) {
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
    items(validator) {
        this._items = validator;
        return this;
    }
    min(count) {
        this._minItems = count;
        return this;
    }
    max(count) {
        this._maxItems = count;
        return this;
    }
    validate(value) {
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
    validate(value) {
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
class ObjectValidator extends BaseValidator {
    constructor(schema) {
        super();
        this.schema = schema;
    }
    min(minKeys) {
        this._minKeys = minKeys;
        return this;
    }
    keys(schema) {
        this.schema = schema;
        return this;
    }
    validate(data, options) {
        if (!this.schema) {
            return { value: data };
        }
        const errors = [];
        const result = {};
        const keys = Object.keys(data);
        if (this._minKeys && keys.length < this._minKeys) {
            return {
                error: { details: [{ message: `Must have at least ${this._minKeys} keys`, path: [], context: { value: data } }] },
                value: data
            };
        }
        // Validate each field in schema
        for (const [key, validator] of Object.entries(this.schema)) {
            const fieldResult = validator.validate(data[key]);
            if (fieldResult.error) {
                errors.push({
                    message: fieldResult.error,
                    path: [key],
                    context: { value: data[key] }
                });
            }
            else {
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
exports.commonSchemas = {
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
    userRole: Joi.string().valid(...Object.values(types_1.UserRole)),
    // Content status validation
    contentStatus: Joi.string().valid(...Object.values(types_1.ContentStatus)),
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
exports.authSchemas = {
    // User registration
    register: Joi.object({
        email: exports.commonSchemas.email.required(),
        password: exports.commonSchemas.password.required(),
        displayName: Joi.string().trim().min(1).max(100).required(),
        photoURL: exports.commonSchemas.url.optional()
    }),
    // User login
    login: Joi.object({
        email: exports.commonSchemas.email.required(),
        password: exports.commonSchemas.password.required()
    }),
    // Password reset request
    passwordResetRequest: Joi.object({
        email: exports.commonSchemas.email.required()
    }),
    // Password reset confirmation
    passwordReset: Joi.object({
        token: Joi.string().required(),
        newPassword: exports.commonSchemas.password.required()
    }),
    // Update user profile
    updateProfile: Joi.object({
        displayName: Joi.string().trim().min(1).max(100).optional(),
        photoURL: exports.commonSchemas.url.optional().allow(''),
        bio: exports.commonSchemas.description.optional().allow('')
    }),
    // Update user role (admin only)
    updateUserRole: Joi.object({
        userId: Joi.string().required(),
        role: exports.commonSchemas.userRole.required()
    })
};
/**
 * Content validation schemas
 */
exports.contentSchemas = {
    // Create/update post
    post: Joi.object({
        title: exports.commonSchemas.title.required(),
        content: exports.commonSchemas.richText.required(),
        excerpt: exports.commonSchemas.description.optional(),
        slug: exports.commonSchemas.slug.optional(),
        status: exports.commonSchemas.contentStatus.default('draft'),
        tags: exports.commonSchemas.tags.optional(),
        featuredImage: exports.commonSchemas.url.optional(),
        seoTitle: Joi.string().trim().max(60).optional(),
        seoDescription: Joi.string().trim().max(160).optional(),
        publishedAt: exports.commonSchemas.date.optional(),
        categoryId: exports.commonSchemas.objectId.optional()
    }),
    // Create/update page
    page: Joi.object({
        title: exports.commonSchemas.title.required(),
        content: exports.commonSchemas.richText.required(),
        slug: exports.commonSchemas.slug.required(),
        status: exports.commonSchemas.contentStatus.default('draft'),
        parentId: exports.commonSchemas.objectId.optional(),
        template: Joi.string().trim().max(50).optional(),
        seoTitle: Joi.string().trim().max(60).optional(),
        seoDescription: Joi.string().trim().max(160).optional(),
        publishedAt: exports.commonSchemas.date.optional()
    }),
    // Create/update category
    category: Joi.object({
        name: exports.commonSchemas.title.required(),
        description: exports.commonSchemas.description.optional(),
        slug: exports.commonSchemas.slug.required(),
        parentId: exports.commonSchemas.objectId.optional(),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
    }),
    // Create comment
    comment: Joi.object({
        content: exports.commonSchemas.plainText.required(),
        postId: exports.commonSchemas.objectId.required(),
        parentId: exports.commonSchemas.objectId.optional()
    }),
    // Content query parameters
    contentQuery: Joi.object({
        page: exports.commonSchemas.page,
        limit: exports.commonSchemas.limit,
        status: exports.commonSchemas.contentStatus.optional(),
        category: exports.commonSchemas.objectId.optional(),
        tag: Joi.string().trim().optional(),
        search: exports.commonSchemas.searchQuery.optional(),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'publishedAt', 'title').default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
        author: Joi.string().optional()
    }),
    // Bulk operations
    bulkUpdate: Joi.object({
        ids: Joi.array().items(exports.commonSchemas.objectId).min(1).max(50).required(),
        updates: Joi.object({
            status: exports.commonSchemas.contentStatus.optional(),
            categoryId: exports.commonSchemas.objectId.optional(),
            tags: exports.commonSchemas.tags.optional()
        }).min(1).required()
    }),
    // File upload
    fileUpload: Joi.object({
        file: exports.commonSchemas.file.required(),
        folder: Joi.string().trim().max(100).optional(),
        public: Joi.boolean().default(false)
    })
};
/**
 * User management validation schemas
 */
exports.userSchemas = {
    // Get users query
    getUsersQuery: Joi.object({
        page: exports.commonSchemas.page,
        limit: exports.commonSchemas.limit,
        role: exports.commonSchemas.userRole.optional(),
        search: exports.commonSchemas.searchQuery.optional(),
        sortBy: Joi.string().valid('createdAt', 'lastSignIn', 'displayName', 'email').default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
        verified: Joi.boolean().optional()
    }),
    // Update user (admin)
    updateUser: Joi.object({
        displayName: Joi.string().trim().min(1).max(100).optional(),
        email: exports.commonSchemas.email.optional(),
        role: exports.commonSchemas.userRole.optional(),
        disabled: Joi.boolean().optional(),
        emailVerified: Joi.boolean().optional()
    }),
    // Create user (admin)
    createUser: Joi.object({
        email: exports.commonSchemas.email.required(),
        password: exports.commonSchemas.password.required(),
        displayName: Joi.string().trim().min(1).max(100).required(),
        role: exports.commonSchemas.userRole.default('user'),
        emailVerified: Joi.boolean().default(false)
    })
};
/**
 * Settings validation schemas
 */
exports.settingsSchemas = {
    // Site settings
    siteSettings: Joi.object({
        siteName: exports.commonSchemas.title.required(),
        siteDescription: exports.commonSchemas.description.optional(),
        siteUrl: exports.commonSchemas.url.required(),
        adminEmail: exports.commonSchemas.email.required(),
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
        fromEmail: exports.commonSchemas.email.required(),
        fromName: Joi.string().trim().min(1).max(100).required()
    })
};
/**
 * Analytics validation schemas
 */
exports.analyticsSchemas = {
    // Analytics query
    analyticsQuery: Joi.object({
        startDate: exports.commonSchemas.date.required(),
        endDate: exports.commonSchemas.date.required(),
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
exports.webhookSchemas = {
    // Webhook configuration
    webhook: Joi.object({
        name: exports.commonSchemas.title.required(),
        url: exports.commonSchemas.url.required(),
        events: Joi.array().items(Joi.string().valid('post.created', 'post.updated', 'post.deleted', 'user.created', 'user.updated', 'user.deleted', 'comment.created', 'comment.updated', 'comment.deleted')).min(1).required(),
        secret: Joi.string().min(16).max(128).optional(),
        active: Joi.boolean().default(true),
        retryAttempts: Joi.number().integer().min(0).max(10).default(3),
        timeout: Joi.number().integer().min(1000).max(30000).default(5000)
    })
};
/**
 * Validation helper functions
 */
const validateSchema = (schema, data) => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
    if (error) {
        const errorMessage = error.details
            .map((detail) => detail.message)
            .join(', ');
        throw new Error(`Validation error: ${errorMessage}`);
    }
    return value;
};
exports.validateSchema = validateSchema;
/**
 * Sanitize HTML content
 */
const sanitizeHtml = (html) => {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>.*?<\/object>/gi, '')
        .replace(/<embed[^>]*>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
};
exports.sanitizeHtml = sanitizeHtml;
/**
 * Generate validation error response
 */
const createValidationError = (error) => {
    const details = error.details.map((detail) => {
        var _a;
        return ({
            field: detail.path.join('.'),
            message: detail.message,
            value: (_a = detail.context) === null || _a === void 0 ? void 0 : _a.value
        });
    });
    return {
        success: false,
        error: 'Validation failed',
        details,
        timestamp: new Date().toISOString()
    };
};
exports.createValidationError = createValidationError;
//# sourceMappingURL=validation.js.map