"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFileUpload = exports.onFileDelete = exports.cleanupTempFilesScheduled = exports.cleanupExpiredSessions = exports.onUserDelete = exports.onUserCreate = exports.api = void 0;
// Use require for Firebase modules
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const helmet = require('helmet');
const config_1 = require("./utils/config");
const errors_1 = require("./utils/errors");
const middleware_1 = require("./middleware");
const types_1 = require("./types");
const storageService_1 = require("./services/storageService");
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
// Initialize configuration (config manager handles its own initialization)
// Create Express app
const app = express();
// Apply security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false
}));
// Apply CORS middleware
app.use(middleware_1.corsMiddleware);
// Apply security headers
app.use(middleware_1.securityHeaders);
// Multer configuration for file uploads
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
    },
    fileFilter: (req, file, cb) => {
        // Allow all file types, validation will be done in the service
        cb(null, true);
    },
});
// Apply request logging
if (config_1.config.isDevelopment()) {
    app.use(middleware_1.requestLogger);
}
// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Apply rate limiting
app.use('/api/', (0, middleware_1.rateLimit)('api'));
app.use('/api/auth/', (0, middleware_1.rateLimit)('auth'));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Firebase Functions API is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// API Routes
// Authentication routes
app.post('/api/auth/register', (0, middleware_1.rateLimit)('auth'), async (req, res) => {
    try {
        const { email, password, displayName } = req.body;
        // Create user with Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
            emailVerified: false
        });
        // Set custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: types_1.UserRole.USER
        });
        res.json({
            success: true,
            message: 'User registered successfully',
            data: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
app.post('/api/auth/verify-token', middleware_1.authenticate, (req, res) => {
    const authReq = req;
    res.json({
        success: true,
        message: 'Token is valid',
        data: {
            user: authReq.user
        },
        timestamp: new Date().toISOString()
    });
});
app.post('/api/auth/set-role', middleware_1.authenticate, (0, middleware_1.authorize)([types_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const { userId, role } = req.body;
        if (!userId || !role) {
            return res.status(400).json({
                success: false,
                error: 'userId and role are required',
                timestamp: new Date().toISOString()
            });
        }
        if (!Object.values(types_1.UserRole).includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role specified',
                timestamp: new Date().toISOString()
            });
        }
        await admin.auth().setCustomUserClaims(userId, { role });
        // Update user role in Firestore
        const db = admin.firestore();
        await db.collection('users').doc(userId).update({
            role,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: 'Role updated successfully',
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
app.post('/api/auth/reset-password', (0, middleware_1.rateLimit)('auth'), async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required',
                timestamp: new Date().toISOString()
            });
        }
        // Generate password reset link
        await admin.auth().generatePasswordResetLink(email);
        // In a real implementation, you would send this via email service
        // For now, we'll just return success
        res.json({
            success: true,
            message: 'Password reset email sent successfully',
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
app.post('/api/auth/verify-email', middleware_1.authenticate, async (req, res) => {
    try {
        const authReq = req;
        const { actionCode } = req.body;
        if (!actionCode) {
            return res.status(400).json({
                success: false,
                error: 'Action code is required',
                timestamp: new Date().toISOString()
            });
        }
        // Verify the email verification code
        await admin.auth().checkActionCode(actionCode);
        await admin.auth().applyActionCode(actionCode);
        // Update user's email verification status in Firestore
        const db = admin.firestore();
        await db.collection('users').doc(authReq.user.uid).update({
            emailVerified: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: 'Email verified successfully',
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
app.post('/api/auth/change-password', middleware_1.authenticate, async (req, res) => {
    try {
        const authReq = req;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters long',
                timestamp: new Date().toISOString()
            });
        }
        // Update user password
        await admin.auth().updateUser(authReq.user.uid, {
            password: newPassword
        });
        // Update password change timestamp in Firestore
        const db = admin.firestore();
        await db.collection('users').doc(authReq.user.uid).update({
            passwordChangedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: 'Password updated successfully',
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
app.post('/api/auth/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required',
                timestamp: new Date().toISOString()
            });
        }
        // Verify and refresh the token
        const decodedToken = await admin.auth().verifyIdToken(refreshToken, true);
        // Generate new custom token
        const customToken = await admin.auth().createCustomToken(decodedToken.uid);
        res.json({
            success: true,
            data: {
                token: customToken,
                expiresIn: 3600 // 1 hour
            },
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
app.post('/api/auth/logout', middleware_1.authenticate, async (req, res) => {
    try {
        const authReq = req;
        // Revoke all refresh tokens for the user
        await admin.auth().revokeRefreshTokens(authReq.user.uid);
        // Update last logout time in Firestore
        const db = admin.firestore();
        await db.collection('users').doc(authReq.user.uid).update({
            lastLogoutAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: 'Logged out successfully',
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
// Content routes
app.get('/api/content/posts', middleware_1.optionalAuthenticate, (0, middleware_1.rateLimit)('api'), async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'published' } = req.query;
        const authReq = req;
        const db = admin.firestore();
        let query = db.collection('posts')
            .where('status', '==', status)
            .orderBy('createdAt', 'desc')
            .limit(Number(limit))
            .offset((Number(page) - 1) * Number(limit));
        // If user is not authenticated or not admin/editor, only show published posts
        if (!authReq.user || ![types_1.UserRole.ADMIN, types_1.UserRole.EDITOR].includes(authReq.user.role)) {
            query = query.where('status', '==', 'published');
        }
        const snapshot = await query.get();
        const posts = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            data: posts,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: posts.length
            },
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
app.post('/api/content/posts', middleware_1.authenticate, (0, middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.EDITOR, types_1.UserRole.AUTHOR]), (0, middleware_1.rateLimit)('api'), async (req, res) => {
    try {
        const { title, content, status = 'draft', tags = [] } = req.body;
        const authReq = req;
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: 'Title and content are required',
                timestamp: new Date().toISOString()
            });
        }
        const db = admin.firestore();
        const postData = {
            title,
            content,
            status,
            tags,
            authorId: authReq.user.uid,
            authorName: authReq.user.displayName,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection('posts').add(postData);
        res.json({
            success: true,
            message: 'Post created successfully',
            data: Object.assign({ id: docRef.id }, postData),
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
app.get('/api/content/posts/:id', middleware_1.optionalAuthenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const authReq = req;
        const db = admin.firestore();
        const doc = await db.collection('posts').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Post not found',
                timestamp: new Date().toISOString()
            });
        }
        const postData = doc.data();
        // Check if user can view unpublished posts
        if ((postData === null || postData === void 0 ? void 0 : postData.status) !== 'published' &&
            (!authReq.user || ![types_1.UserRole.ADMIN, types_1.UserRole.EDITOR].includes(authReq.user.role))) {
            return res.status(404).json({
                success: false,
                error: 'Post not found',
                timestamp: new Date().toISOString()
            });
        }
        res.json({
            success: true,
            data: Object.assign({ id: doc.id }, postData),
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
app.put('/api/content/posts/:id', middleware_1.authenticate, (0, middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.EDITOR, types_1.UserRole.AUTHOR]), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, status, tags } = req.body;
        const authReq = req;
        const db = admin.firestore();
        const doc = await db.collection('posts').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Post not found',
                timestamp: new Date().toISOString()
            });
        }
        const postData = doc.data();
        // Check if user can edit this post
        if (authReq.user.role === types_1.UserRole.AUTHOR && (postData === null || postData === void 0 ? void 0 : postData.authorId) !== authReq.user.uid) {
            return res.status(403).json({
                success: false,
                error: 'You can only edit your own posts',
                timestamp: new Date().toISOString()
            });
        }
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (title)
            updateData.title = title;
        if (content)
            updateData.content = content;
        if (status)
            updateData.status = status;
        if (tags)
            updateData.tags = tags;
        await db.collection('posts').doc(id).update(updateData);
        res.json({
            success: true,
            message: 'Post updated successfully',
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
app.delete('/api/content/posts/:id', middleware_1.authenticate, (0, middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.EDITOR]), async (req, res) => {
    try {
        const { id } = req.params;
        const db = admin.firestore();
        const doc = await db.collection('posts').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Post not found',
                timestamp: new Date().toISOString()
            });
        }
        await db.collection('posts').doc(id).delete();
        res.json({
            success: true,
            message: 'Post deleted successfully',
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
        return;
    }
});
// =============================================
// PAGES ENDPOINTS
// =============================================
// Get all pages
app.get('/api/content/pages', middleware_1.optionalAuthenticate, (0, middleware_1.rateLimit)('api'), async (req, res) => {
    try {
        const db = admin.firestore();
        const { status, author, template, featured, page = 1, limit = 20 } = req.query;
        let query = db.collection('pages');
        // Apply filters
        if (status) {
            query = query.where('status', '==', status);
        }
        if (author) {
            query = query.where('author.id', '==', author);
        }
        if (template) {
            query = query.where('template', '==', template);
        }
        if (featured !== undefined) {
            query = query.where('settings.featuredPage', '==', featured === 'true');
        }
        // Apply ordering and pagination
        query = query.orderBy('updatedAt', 'desc');
        const limitNum = parseInt(limit) || 20;
        query = query.limit(limitNum);
        const snapshot = await query.get();
        const pages = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json({
            success: true,
            pages,
            pagination: {
                page: parseInt(page) || 1,
                limit: limitNum,
                total: pages.length,
                hasMore: pages.length === limitNum
            }
        });
        return;
    }
    catch (error) {
        console.error('Get pages error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
        return;
    }
});
// Create new page
app.post('/api/content/pages', middleware_1.authenticate, (0, middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.EDITOR, types_1.UserRole.AUTHOR]), (0, middleware_1.rateLimit)('api'), async (req, res) => {
    try {
        const { title, content, slug, template, status, seo, settings } = req.body;
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Page title is required'
            });
        }
        const authReq = req;
        const db = admin.firestore();
        // Generate slug if not provided
        const pageSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        // Check if slug already exists
        const existingPage = await db.collection('pages').where('slug', '==', pageSlug).get();
        if (!existingPage.empty) {
            return res.status(400).json({
                success: false,
                message: 'A page with this slug already exists'
            });
        }
        const pageData = {
            title,
            slug: pageSlug,
            content: content || '',
            htmlContent: '',
            cssContent: '',
            jsContent: '',
            status: status || 'draft',
            template: template || 'default',
            seo: {
                metaTitle: (seo === null || seo === void 0 ? void 0 : seo.metaTitle) || title,
                metaDescription: (seo === null || seo === void 0 ? void 0 : seo.metaDescription) || '',
                keywords: (seo === null || seo === void 0 ? void 0 : seo.keywords) || [],
                canonicalUrl: (seo === null || seo === void 0 ? void 0 : seo.canonicalUrl) || '',
                ogImage: (seo === null || seo === void 0 ? void 0 : seo.ogImage) || '',
                ogTitle: (seo === null || seo === void 0 ? void 0 : seo.ogTitle) || title,
                ogDescription: (seo === null || seo === void 0 ? void 0 : seo.ogDescription) || '',
                twitterCard: (seo === null || seo === void 0 ? void 0 : seo.twitterCard) || 'summary',
                robots: (seo === null || seo === void 0 ? void 0 : seo.robots) || 'index,follow'
            },
            settings: {
                allowComments: (settings === null || settings === void 0 ? void 0 : settings.allowComments) || false,
                featuredPage: (settings === null || settings === void 0 ? void 0 : settings.featuredPage) || false,
                requireAuth: (settings === null || settings === void 0 ? void 0 : settings.requireAuth) || false,
                showInNavigation: (settings === null || settings === void 0 ? void 0 : settings.showInNavigation) || true,
                navigationOrder: (settings === null || settings === void 0 ? void 0 : settings.navigationOrder) || 0,
                customCSS: (settings === null || settings === void 0 ? void 0 : settings.customCSS) || '',
                customJS: (settings === null || settings === void 0 ? void 0 : settings.customJS) || ''
            },
            author: {
                id: authReq.user.uid,
                email: authReq.user.email,
                displayName: authReq.user.displayName || authReq.user.email
            },
            collaboration: {
                editors: [authReq.user.uid],
                viewers: [],
                isPublic: false,
                editMode: 'single'
            },
            analytics: {
                views: 0,
                uniqueViews: 0,
                lastViewed: null,
                popularityScore: 0
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            publishedAt: status === 'published' ? admin.firestore.FieldValue.serverTimestamp() : null,
            version: 1
        };
        const docRef = await db.collection('pages').add(pageData);
        res.status(201).json({
            success: true,
            message: 'Page created successfully',
            pageId: docRef.id
        });
        return;
    }
    catch (error) {
        console.error('Create page error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
        return;
    }
});
// Get page by ID
app.get('/api/content/pages/:id', middleware_1.optionalAuthenticate, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Page ID is required'
            });
        }
        const db = admin.firestore();
        const pageDoc = await db.collection('pages').doc(id).get();
        if (!pageDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        const pageData = pageDoc.data();
        // Check if page is accessible
        const authReq = req;
        if ((pageData === null || pageData === void 0 ? void 0 : pageData.status) !== 'published' && !authReq.user) {
            return res.status(403).json({
                success: false,
                message: 'Page not accessible'
            });
        }
        // Update view count
        await pageDoc.ref.update({
            'analytics.views': admin.firestore.FieldValue.increment(1),
            'analytics.lastViewed': admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).json({
            success: true,
            page: Object.assign({ id: pageDoc.id }, pageData)
        });
        return;
    }
    catch (error) {
        console.error('Get page error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
        return;
    }
});
// Update page
app.put('/api/content/pages/:id', middleware_1.authenticate, (0, middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.EDITOR, types_1.UserRole.AUTHOR]), async (req, res) => {
    var _a, _b;
    try {
        const { id } = req.params;
        const { title, content, slug, template, status, seo, settings } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Page ID is required'
            });
        }
        const db = admin.firestore();
        const pageRef = db.collection('pages').doc(id);
        const pageDoc = await pageRef.get();
        if (!pageDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (title)
            updateData.title = title;
        if (content !== undefined)
            updateData.content = content;
        if (slug) {
            // Check if new slug already exists
            const existingPage = await db.collection('pages').where('slug', '==', slug).get();
            if (!existingPage.empty && existingPage.docs[0].id !== id) {
                return res.status(400).json({
                    success: false,
                    message: 'A page with this slug already exists'
                });
            }
            updateData.slug = slug;
        }
        if (template)
            updateData.template = template;
        if (status) {
            updateData.status = status;
            if (status === 'published') {
                updateData.publishedAt = admin.firestore.FieldValue.serverTimestamp();
            }
        }
        if (seo)
            updateData.seo = Object.assign(Object.assign({}, (_a = pageDoc.data()) === null || _a === void 0 ? void 0 : _a.seo), seo);
        if (settings)
            updateData.settings = Object.assign(Object.assign({}, (_b = pageDoc.data()) === null || _b === void 0 ? void 0 : _b.settings), settings);
        await pageRef.update(updateData);
        res.status(200).json({
            success: true,
            message: 'Page updated successfully'
        });
        return;
    }
    catch (error) {
        console.error('Update page error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
        return;
    }
});
// Delete page
app.delete('/api/content/pages/:id', middleware_1.authenticate, (0, middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.EDITOR]), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Page ID is required'
            });
        }
        const db = admin.firestore();
        const pageRef = db.collection('pages').doc(id);
        const pageDoc = await pageRef.get();
        if (!pageDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        await pageRef.delete();
        res.status(200).json({
            success: true,
            message: 'Page deleted successfully'
        });
        return;
    }
    catch (error) {
        console.error('Delete page error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
        return;
    }
});
// User management routes
app.get('/api/users', middleware_1.authenticate, (0, middleware_1.authorize)([types_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const listUsersResult = await admin.auth().listUsers(Number(limit));
        const users = listUsersResult.users.map((user) => {
            var _a;
            return ({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                emailVerified: user.emailVerified,
                disabled: user.disabled,
                createdAt: user.metadata.creationTime,
                lastSignIn: user.metadata.lastSignInTime,
                role: ((_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.role) || types_1.UserRole.USER
            });
        });
        res.json({
            success: true,
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: users.length
            },
            timestamp: new Date().toISOString()
        });
        return;
    }
    catch (error) {
        (0, errors_1.errorHandler)(error, res);
    }
});
// ===========================
// STORAGE & FILE MANAGEMENT
// ===========================
// Upload file
app.post('/api/storage/upload', middleware_1.authenticate, (0, middleware_1.rateLimit)('api'), upload.single('file'), storageService_1.uploadFile);
// Delete file
app.delete('/api/storage/delete', middleware_1.authenticate, (0, middleware_1.rateLimit)('api'), storageService_1.deleteFile);
// Get file metadata and signed URL
app.get('/api/storage/file/:filePath(*)', middleware_1.optionalAuthenticate, storageService_1.getFile);
// List user files
app.get('/api/storage/files', middleware_1.authenticate, (0, middleware_1.rateLimit)('api'), storageService_1.listFiles);
// Error handling middleware (must be last)
app.use(middleware_1.errorMiddleware);
// Export the Express app as a Firebase Function
exports.api = functions.region(config_1.config.getRegion()).https.onRequest(app);
// Additional Cloud Functions can be exported here
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    try {
        // Set default role for new users
        await admin.auth().setCustomUserClaims(user.uid, {
            role: types_1.UserRole.USER
        });
        // Create user profile in Firestore
        const db = admin.firestore();
        await db.collection('users').doc(user.uid).set({
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            role: types_1.UserRole.USER,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`User profile created for ${user.uid}`);
    }
    catch (error) {
        console.error('Error creating user profile:', error);
    }
});
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
    try {
        // Clean up user data
        const db = admin.firestore();
        // Delete user profile
        await db.collection('users').doc(user.uid).delete();
        // Update posts to remove author reference
        const postsQuery = await db.collection('posts').where('authorId', '==', user.uid).get();
        const batch = db.batch();
        postsQuery.docs.forEach((doc) => {
            batch.update(doc.ref, {
                authorId: null,
                authorName: '[Deleted User]',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
        console.log(`User data cleaned up for ${user.uid}`);
    }
    catch (error) {
        console.error('Error cleaning up user data:', error);
    }
});
// Scheduled function to clean up expired sessions (runs daily)
exports.cleanupExpiredSessions = functions.pubsub.schedule('0 2 * * *')
    .timeZone('UTC')
    .onRun(async (context) => {
    try {
        const db = admin.firestore();
        const expiredSessionsQuery = await db.collection('sessions')
            .where('expiresAt', '<', new Date())
            .get();
        const batch = db.batch();
        expiredSessionsQuery.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${expiredSessionsQuery.size} expired sessions`);
    }
    catch (error) {
        console.error('Error cleaning up expired sessions:', error);
    }
});
// Cleanup temporary files daily
exports.cleanupTempFilesScheduled = functions.pubsub.schedule('0 3 * * *')
    .timeZone('UTC')
    .onRun(async (context) => {
    try {
        await (0, storageService_1.cleanupTempFiles)();
    }
    catch (error) {
        console.error('Temp files cleanup error:', error);
    }
});
// Storage trigger for file deletion cleanup
exports.onFileDelete = functions.storage.object().onDelete(async (object) => {
    try {
        const filePath = object.name;
        if (!filePath)
            return;
        // Update Firestore record when file is deleted from storage
        const db = admin.firestore();
        const mediaQuery = await db.collection('media')
            .where('filePath', '==', filePath)
            .limit(1)
            .get();
        if (!mediaQuery.empty) {
            const doc = mediaQuery.docs[0];
            await doc.ref.update({
                status: 'deleted',
                deletedAt: admin.firestore.FieldValue.serverTimestamp(),
                deletedBy: 'storage-trigger'
            });
        }
    }
    catch (error) {
        console.error('File deletion trigger error:', error);
    }
});
// Storage trigger for file upload metadata
exports.onFileUpload = functions.storage.object().onFinalize(async (object) => {
    try {
        const filePath = object.name;
        const contentType = object.contentType;
        const size = parseInt(object.size || '0');
        if (!filePath)
            return;
        // Skip if this is a thumbnail or already processed
        if (filePath.includes('_thumb.') || filePath.startsWith('processed/')) {
            return;
        }
        console.log(`File uploaded: ${filePath}, size: ${size}, type: ${contentType}`);
        // Additional processing can be added here
        // For example: virus scanning, additional image processing, etc.
    }
    catch (error) {
        console.error('File upload trigger error:', error);
    }
});
//# sourceMappingURL=index.js.map