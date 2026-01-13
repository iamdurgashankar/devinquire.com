import { Request } from 'express';
interface Timestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
}
interface DocumentData {
    [field: string]: any;
}
interface UserRecord {
    uid: string;
    email?: string;
    emailVerified: boolean;
    displayName?: string;
    photoURL?: string;
    disabled: boolean;
    metadata: {
        creationTime?: string;
        lastSignInTime?: string;
    };
    customClaims?: {
        [key: string]: any;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
export interface AuthUser {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    isApproved: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastLoginAt?: Timestamp;
    profilePicture?: string;
}
export declare enum UserRole {
    ADMIN = "admin",
    EDITOR = "editor",
    AUTHOR = "author",
    USER = "user"
}
export declare enum ContentStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ARCHIVED = "archived",
    SCHEDULED = "scheduled"
}
export declare enum UserStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    SUSPENDED = "suspended"
}
export interface Post extends DocumentData {
    id?: string;
    title: string;
    content: string;
    excerpt?: string;
    slug: string;
    status: PostStatus;
    authorId: string;
    authorName: string;
    tags: string[];
    categories: string[];
    featuredImage?: string;
    seoTitle?: string;
    seoDescription?: string;
    publishedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    viewCount: number;
    likeCount: number;
    commentCount: number;
}
export interface Page extends DocumentData {
    id?: string;
    title: string;
    content: string;
    slug: string;
    status: PageStatus;
    authorId: string;
    authorName: string;
    template?: string;
    parentId?: string;
    order: number;
    seoTitle?: string;
    seoDescription?: string;
    publishedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export declare enum PostStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    SCHEDULED = "scheduled",
    ARCHIVED = "archived"
}
export declare enum PageStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ARCHIVED = "archived"
}
export interface CreatePostRequest {
    title: string;
    content: string;
    excerpt?: string;
    slug?: string;
    status?: PostStatus;
    tags?: string[];
    categories?: string[];
    featuredImage?: string;
    seoTitle?: string;
    seoDescription?: string;
    publishedAt?: string;
}
export interface UpdatePostRequest extends Partial<CreatePostRequest> {
    id: string;
}
export interface CreatePageRequest {
    title: string;
    content: string;
    slug?: string;
    status?: PageStatus;
    template?: string;
    parentId?: string;
    order?: number;
    seoTitle?: string;
    seoDescription?: string;
    publishedAt?: string;
}
export interface UpdatePageRequest extends Partial<CreatePageRequest> {
    id: string;
}
export interface AuthenticatedRequest extends Request {
    user?: UserRecord;
    userId?: string;
}
export interface FunctionContext {
    auth?: {
        uid: string;
        token: any;
    };
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export interface EnvironmentConfig {
    projectId: string;
    region: string;
    isDevelopment: boolean;
    isProduction: boolean;
    corsOrigins: string[];
    jwtSecret: string;
    emailConfig: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
    };
    rateLimiting: {
        windowMs: number;
        maxRequests: number;
    };
}
export interface AppError extends Error {
    code: string;
    statusCode: number;
    isOperational: boolean;
}
export declare enum ErrorCodes {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
    NOT_FOUND = "NOT_FOUND",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INVALID_INPUT = "INVALID_INPUT"
}
export {};
//# sourceMappingURL=index.d.ts.map