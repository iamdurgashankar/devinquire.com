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
declare class BaseValidator {
    protected _required: boolean;
    protected _optional: boolean;
    protected _default: any;
    required(): this;
    optional(): this;
    default(value: any): this;
}
declare class StringValidator extends BaseValidator {
    private _minLength?;
    private _maxLength?;
    private _pattern?;
    private _validValues?;
    private _email;
    private _uri;
    private _trim;
    private _lowercase;
    private _allowEmpty;
    private _exactLength?;
    min(length: number): this;
    max(length: number): this;
    pattern(regex: RegExp): this;
    valid(...values: string[]): this;
    email(): this;
    uri(): this;
    trim(): this;
    lowercase(): this;
    length(exactLength: number): this;
    allow(value: string): this;
    message(msg: string): this;
    validate(value: any): {
        error?: string;
        value?: any;
    };
}
declare class NumberValidator extends BaseValidator {
    private _min?;
    private _max?;
    private _integer;
    min(value: number): this;
    max(value: number): this;
    integer(): this;
    validate(value: any): {
        error?: string;
        value?: any;
    };
}
declare class ArrayValidator extends BaseValidator {
    private _items?;
    private _minItems?;
    private _maxItems?;
    items(validator: any): this;
    min(count: number): this;
    max(count: number): this;
    validate(value: any): {
        error?: string;
        value?: any;
    };
}
declare class DateValidator extends BaseValidator {
    iso(): this;
    validate(value: any): {
        error?: string;
        value?: any;
    };
}
declare class ObjectValidator extends BaseValidator implements ValidationSchema {
    private schema;
    private _minKeys?;
    constructor(schema?: any);
    min(minKeys: number): this;
    keys(schema: {
        [key: string]: any;
    }): this;
    validate(data: any, options?: any): ValidationResult;
}
/**
 * Common validation schemas
 */
export declare const commonSchemas: {
    objectId: StringValidator;
    email: StringValidator;
    password: StringValidator;
    url: StringValidator;
    slug: StringValidator;
    userRole: StringValidator;
    contentStatus: StringValidator;
    page: NumberValidator;
    limit: NumberValidator;
    searchQuery: StringValidator;
    date: DateValidator;
    richText: StringValidator;
    plainText: StringValidator;
    title: StringValidator;
    description: StringValidator;
    tags: ArrayValidator;
    file: ObjectValidator;
};
/**
 * Authentication validation schemas
 */
export declare const authSchemas: {
    register: ObjectValidator;
    login: ObjectValidator;
    passwordResetRequest: ObjectValidator;
    passwordReset: ObjectValidator;
    updateProfile: ObjectValidator;
    updateUserRole: ObjectValidator;
};
/**
 * Content validation schemas
 */
export declare const contentSchemas: {
    post: ObjectValidator;
    page: ObjectValidator;
    category: ObjectValidator;
    comment: ObjectValidator;
    contentQuery: ObjectValidator;
    bulkUpdate: ObjectValidator;
    fileUpload: ObjectValidator;
};
/**
 * User management validation schemas
 */
export declare const userSchemas: {
    getUsersQuery: ObjectValidator;
    updateUser: ObjectValidator;
    createUser: ObjectValidator;
};
/**
 * Settings validation schemas
 */
export declare const settingsSchemas: {
    siteSettings: ObjectValidator;
    emailSettings: ObjectValidator;
};
/**
 * Analytics validation schemas
 */
export declare const analyticsSchemas: {
    analyticsQuery: ObjectValidator;
    trackEvent: ObjectValidator;
};
/**
 * Webhook validation schemas
 */
export declare const webhookSchemas: {
    webhook: ObjectValidator;
};
/**
 * Validation helper functions
 */
export declare const validateSchema: (schema: ValidationSchema, data: any) => any;
/**
 * Sanitize HTML content
 */
export declare const sanitizeHtml: (html: string) => string;
/**
 * Generate validation error response
 */
export declare const createValidationError: (error: any) => {
    success: boolean;
    error: string;
    details: any;
    timestamp: string;
};
export {};
//# sourceMappingURL=validation.d.ts.map