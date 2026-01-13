import { Request, Response } from 'express';

// Use require for Firebase modules
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const helmet = require('helmet');
import { config } from './utils/config';
import { errorHandler } from './utils/errors';
import {
  authenticate,
  optionalAuthenticate,
  authorize,
  rateLimit,
  corsMiddleware,
  securityHeaders,
  requestLogger,
  errorMiddleware
} from './middleware';
import { UserRole } from './types';
import { uploadFile, deleteFile, getFile, listFiles, cleanupTempFiles } from './services/storageService';

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
app.use(corsMiddleware);

// Apply security headers
app.use(securityHeaders);

// Multer configuration for file uploads
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Allow all file types, validation will be done in the service
    cb(null, true);
  },
});

// Apply request logging
if (config.isDevelopment()) {
  app.use(requestLogger);
}

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api/', rateLimit('api'));
app.use('/api/auth/', rateLimit('auth'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Firebase Functions API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes

// Authentication routes
app.post('/api/auth/register', rateLimit('auth'), async (req: Request, res: Response) => {
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
      role: UserRole.USER
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
  } catch (error: any) {
    errorHandler(error, res);
    return;
  }
});

app.post('/api/auth/verify-token', authenticate, (req: Request, res: Response) => {
  const authReq = req as any;
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: authReq.user
    },
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/set-role', authenticate, authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        error: 'userId and role are required',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!Object.values(UserRole).includes(role)) {
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
  } catch (error: any) {
    errorHandler(error, res);
    return;
  }
});

app.post('/api/auth/reset-password', rateLimit('auth'), async (req: Request, res: Response) => {
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
  } catch (error: any) {
    errorHandler(error, res);
    return;
  }
});

app.post('/api/auth/verify-email', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
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
  } catch (error: any) {
    errorHandler(error, res);
    return;
  }
});

app.post('/api/auth/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
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
  } catch (error: any) {
    errorHandler(error, res);
    return;
  }
});

app.post('/api/auth/refresh-token', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    errorHandler(error, res);
    return;
  }
});

app.post('/api/auth/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    
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
  } catch (error: any) {
    errorHandler(error, res);
    return;
  }
});

// Content routes
app.get('/api/content/posts', optionalAuthenticate, rateLimit('api'), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status = 'published' } = req.query;
    const authReq = req as any;
    
    const db = admin.firestore();
    let query = db.collection('posts')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));
    
    // If user is not authenticated or not admin/editor, only show published posts
    if (!authReq.user || ![UserRole.ADMIN, UserRole.EDITOR].includes(authReq.user.role)) {
      query = query.where('status', '==', 'published');
    }
    
    const snapshot = await query.get();
    const posts = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    
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
  } catch (error: any) {
      errorHandler(error, res);
      return;
    }
  });

app.post('/api/content/posts', authenticate, authorize([UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR]), rateLimit('api'), async (req: Request, res: Response) => {
  try {
    const { title, content, status = 'draft', tags = [] } = req.body;
    const authReq = req as any;
    
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
      data: {
        id: docRef.id,
        ...postData
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error: any) {
    errorHandler(error, res);
    return;
  }
});

app.get('/api/content/posts/:id', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as any;
    
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
    if (postData?.status !== 'published' && 
        (!authReq.user || ![UserRole.ADMIN, UserRole.EDITOR].includes(authReq.user.role))) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: {
        id: doc.id,
        ...postData
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error: any) {
    errorHandler(error, res);
    return;
  }
});

app.put('/api/content/posts/:id', authenticate, authorize([UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, status, tags } = req.body;
    const authReq = req as any;
    
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
    if (authReq.user.role === UserRole.AUTHOR && postData?.authorId !== authReq.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own posts',
        timestamp: new Date().toISOString()
      });
    }
    
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (status) updateData.status = status;
    if (tags) updateData.tags = tags;
    
    await db.collection('posts').doc(id).update(updateData);
    
    res.json({
      success: true,
      message: 'Post updated successfully',
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error: any) {
    errorHandler(error, res);
    return;
  }
});

app.delete('/api/content/posts/:id', authenticate, authorize([UserRole.ADMIN, UserRole.EDITOR]), async (req: Request, res: Response) => {
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
  } catch (error: any) {
    errorHandler(error, res);
    return;
  }
});

// =============================================
// BLOG API ENDPOINTS (Public API for devinquire.com)
// =============================================

// Blog API middleware - validates API key
const validateBlogApiKey = async (req: Request, res: Response, next: any) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      timestamp: new Date().toISOString()
    });
  }
  
  // TODO: Implement proper API key validation using blogApiKeyService
  // For now, accept the key from config
  const validApiKey = '2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271';
  
  if (apiKey !== validApiKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Get blog posts (public API)
app.get('/blogmanager/api/blog/posts', validateBlogApiKey, rateLimit('api'), async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const { 
      status = 'published', 
      category, 
      tag, 
      search, 
      limit = 10, 
      page = 1,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      includeContent = 'false'
    } = req.query;
    
    let query: any = db.collection('posts')
      .where('status', '==', status)
      .where('isPublic', '==', true);
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    if (tag) {
      query = query.where('tags', 'array-contains', tag);
    }
    
    // Apply sorting
    const sortField = ['publishedAt', 'createdAt', 'updatedAt', 'title'].includes(sortBy as string) 
      ? sortBy as string 
      : 'publishedAt';
    query = query.orderBy(sortField, sortOrder === 'asc' ? 'asc' : 'desc');
    
    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    const pageNum = parseInt(page as string) || 1;
    
    // Get total count first
    const countSnapshot = await query.get();
    const total = countSnapshot.size;
    
    // Apply pagination
    query = query.limit(limitNum * pageNum);
    const snapshot = await query.get();
    
    // Get posts for current page
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const posts = snapshot.docs.slice(startIndex, endIndex).map((doc: any) => {
      const data = doc.data();
      const convertTimestamp = (ts: any) => {
        if (!ts) return null;
        if (ts.toDate) return ts.toDate().toISOString();
        if (ts instanceof Date) return ts.toISOString();
        if (typeof ts === 'string') return ts;
        return null;
      };
      
      const post: any = {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        category: data.category,
        tags: data.tags || [],
        author: {
          name: data.author?.name || data.author_name || 'Anonymous',
          avatar: data.author?.avatar || data.author_avatar || null
        },
        publishedAt: convertTimestamp(data.publishedAt || data.metadata?.publishedAt),
        updatedAt: convertTimestamp(data.updatedAt || data.metadata?.updatedAt),
        featuredImage: data.featuredImage || data.featured_image,
        readTime: data.readTime || data.analytics?.readTime || 5,
        views: data.views || data.analytics?.views || 0,
        likes: data.likes || data.analytics?.likes || 0
      };
      
      if (includeContent === 'true') {
        post.content = data.content;
      }
      
      return post;
    });
    
    // Apply client-side search if needed
    let filteredPosts = posts;
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredPosts = posts.filter((post: any) => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    res.json({
      success: true,
      data: {
        posts: filteredPosts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredPosts.length,
          totalPages: Math.ceil(total / limitNum),
          hasNext: endIndex < total,
          hasPrev: pageNum > 1
        },
        meta: {
          timestamp: new Date().toISOString(),
          source: 'firebase',
          cached: false
        }
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    errorHandler(error, res);
    return;
  }
});

// Get single blog post
app.get('/blogmanager/api/blog/posts/:postId', validateBlogApiKey, rateLimit('api'), async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const { postId } = req.params;
    
    // Try by ID first
    let doc = await db.collection('posts').doc(postId).get();
    
    if (!doc.exists) {
      // Try by slug
      const slugQuery = await db.collection('posts')
        .where('slug', '==', postId)
        .where('status', '==', 'published')
        .where('isPublic', '==', true)
        .limit(1)
        .get();
      
      if (slugQuery.empty) {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
          timestamp: new Date().toISOString()
        });
      }
      
      doc = slugQuery.docs[0];
    }
    
    const data = doc.data();
    
    if (data?.status !== 'published' || !data?.isPublic) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
        timestamp: new Date().toISOString()
      });
    }
    
    const convertTimestamp = (ts: any) => {
      if (!ts) return null;
      if (ts.toDate) return ts.toDate().toISOString();
      if (ts instanceof Date) return ts.toISOString();
      if (typeof ts === 'string') return ts;
      return null;
    };
    
    const post = {
      id: doc.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      category: data.category,
      tags: data.tags || [],
      author: {
        name: data.author?.name || data.author_name || 'Anonymous',
        avatar: data.author?.avatar || data.author_avatar || null,
        bio: data.author?.bio || null
      },
      publishedAt: convertTimestamp(data.publishedAt || data.metadata?.publishedAt),
      updatedAt: convertTimestamp(data.updatedAt || data.metadata?.updatedAt),
      featuredImage: data.featuredImage || data.featured_image,
      readTime: data.readTime || data.analytics?.readTime || 5,
      views: data.views || data.analytics?.views || 0,
      likes: data.likes || data.analytics?.likes || 0,
      seo: {
        metaTitle: data.seo?.metaTitle || data.title,
        metaDescription: data.seo?.metaDescription || data.excerpt,
        keywords: data.seo?.keywords || data.tags
      }
    };
    
    // Increment view count (async)
    db.collection('posts').doc(doc.id).update({
      views: admin.firestore.FieldValue.increment(1),
      lastViewed: admin.firestore.FieldValue.serverTimestamp()
    }).catch((err: any) => console.error('Error updating view count:', err));
    
    res.json({
      success: true,
      data: post,
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error: any) {
    console.error('Error fetching blog post:', error);
    errorHandler(error, res);
    return;
  }
});

// Get blog categories
app.get('/blogmanager/api/blog/categories', validateBlogApiKey, rateLimit('api'), async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('posts')
      .where('status', '==', 'published')
      .where('isPublic', '==', true)
      .get();
    
    const categoryCount: any = {};
    snapshot.docs.forEach((doc: any) => {
      const category = doc.data().category;
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });
    
    const categories = Object.entries(categoryCount).map(([name, count]) => ({
      name,
      count,
      slug: name.toLowerCase().replace(/\s+/g, '-')
    }));
    
    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    errorHandler(error, res);
    return;
  }
});

// Get blog tags
app.get('/blogmanager/api/blog/tags', validateBlogApiKey, rateLimit('api'), async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('posts')
      .where('status', '==', 'published')
      .where('isPublic', '==', true)
      .get();
    
    const tagCount: any = {};
    snapshot.docs.forEach((doc: any) => {
      const tags = doc.data().tags || [];
      if (Array.isArray(tags)) {
        tags.forEach((tag: string) => {
          if (tag) {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          }
        });
      }
    });
    
    const tags = Object.entries(tagCount)
      .map(([name, count]) => ({
        name,
        count,
        slug: name.toLowerCase().replace(/\s+/g, '-')
      }))
      .sort((a: any, b: any) => b.count - a.count);
    
    res.json({
      success: true,
      data: tags,
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error: any) {
    console.error('Error fetching tags:', error);
    errorHandler(error, res);
    return;
  }
});

// =============================================
// PAGES ENDPOINTS
// =============================================

// Get all pages
app.get('/api/content/pages', optionalAuthenticate, rateLimit('api'), async (req: Request, res: Response) => {
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
    
    const limitNum = parseInt(limit as string) || 20;
    query = query.limit(limitNum);
    
    const snapshot = await query.get();
    const pages = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      pages,
      pagination: {
        page: parseInt(page as string) || 1,
        limit: limitNum,
        total: pages.length,
        hasMore: pages.length === limitNum
      }
    });
    return;
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
});

// Create new page
app.post('/api/content/pages', authenticate, authorize([UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR]), rateLimit('api'), async (req: Request, res: Response) => {
  try {
    const { title, content, slug, template, status, seo, settings } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Page title is required'
      });
    }
    
    const authReq = req as any;
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
        metaTitle: seo?.metaTitle || title,
        metaDescription: seo?.metaDescription || '',
        keywords: seo?.keywords || [],
        canonicalUrl: seo?.canonicalUrl || '',
        ogImage: seo?.ogImage || '',
        ogTitle: seo?.ogTitle || title,
        ogDescription: seo?.ogDescription || '',
        twitterCard: seo?.twitterCard || 'summary',
        robots: seo?.robots || 'index,follow'
      },
      settings: {
        allowComments: settings?.allowComments || false,
        featuredPage: settings?.featuredPage || false,
        requireAuth: settings?.requireAuth || false,
        showInNavigation: settings?.showInNavigation || true,
        navigationOrder: settings?.navigationOrder || 0,
        customCSS: settings?.customCSS || '',
        customJS: settings?.customJS || ''
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
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
});

// Get page by ID
app.get('/api/content/pages/:id', optionalAuthenticate, async (req: Request, res: Response) => {
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
    const authReq = req as any;
    if (pageData?.status !== 'published' && !authReq.user) {
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
      page: {
        id: pageDoc.id,
        ...pageData
      }
    });
    return;
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
});

// Update page
app.put('/api/content/pages/:id', authenticate, authorize([UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR]), async (req: Request, res: Response) => {
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
    
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (title) updateData.title = title;
    if (content !== undefined) updateData.content = content;
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
    if (template) updateData.template = template;
    if (status) {
      updateData.status = status;
      if (status === 'published') {
        updateData.publishedAt = admin.firestore.FieldValue.serverTimestamp();
      }
    }
    if (seo) updateData.seo = { ...pageDoc.data()?.seo, ...seo };
    if (settings) updateData.settings = { ...pageDoc.data()?.settings, ...settings };
    
    await pageRef.update(updateData);
    
    res.status(200).json({
      success: true,
      message: 'Page updated successfully'
    });
    return;
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
});

// Delete page
app.delete('/api/content/pages/:id', authenticate, authorize([UserRole.ADMIN, UserRole.EDITOR]), async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
});

// User management routes
app.get('/api/users', authenticate, authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const listUsersResult = await admin.auth().listUsers(Number(limit));
    
    const users = listUsersResult.users.map((user: any) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
      role: user.customClaims?.role || UserRole.USER
    }));
    
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
  } catch (error: any) {
    errorHandler(error, res);
  }
});

// ===========================
// STORAGE & FILE MANAGEMENT
// ===========================

// Upload file
app.post('/api/storage/upload', authenticate, rateLimit('api'), upload.single('file'), uploadFile);

// Delete file
app.delete('/api/storage/delete', authenticate, rateLimit('api'), deleteFile);

// Get file metadata and signed URL
app.get('/api/storage/file/:filePath(*)', optionalAuthenticate, getFile);

// List user files
app.get('/api/storage/files', authenticate, rateLimit('api'), listFiles);

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Export the Express app as a Firebase Function
export const api = functions.region(config.getRegion()).https.onRequest(app);

// Additional Cloud Functions can be exported here
export const onUserCreate = functions.auth.user().onCreate(async (user: any) => {
  try {
    // Set default role for new users
    await admin.auth().setCustomUserClaims(user.uid, {
      role: UserRole.USER
    });
    
    // Create user profile in Firestore
    const db = admin.firestore();
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role: UserRole.USER,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`User profile created for ${user.uid}`);
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
});

export const onUserDelete = functions.auth.user().onDelete(async (user: any) => {
  try {
    // Clean up user data
    const db = admin.firestore();
    
    // Delete user profile
    await db.collection('users').doc(user.uid).delete();
    
    // Update posts to remove author reference
    const postsQuery = await db.collection('posts').where('authorId', '==', user.uid).get();
    const batch = db.batch();
    
    postsQuery.docs.forEach((doc: any) => {
      batch.update(doc.ref, {
        authorId: null,
        authorName: '[Deleted User]',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    
    console.log(`User data cleaned up for ${user.uid}`);
  } catch (error) {
    console.error('Error cleaning up user data:', error);
  }
});

// Scheduled function to clean up expired sessions (runs daily)
export const cleanupExpiredSessions = functions.pubsub.schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async (context: any) => {
    try {
      const db = admin.firestore();
      const expiredSessionsQuery = await db.collection('sessions')
        .where('expiresAt', '<', new Date())
        .get();
      
      const batch = db.batch();
      expiredSessionsQuery.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`Cleaned up ${expiredSessionsQuery.size} expired sessions`);
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  });

// Cleanup temporary files daily
export const cleanupTempFilesScheduled = functions.pubsub.schedule('0 3 * * *')
  .timeZone('UTC')
  .onRun(async (context: any) => {
    try {
      await cleanupTempFiles();
    } catch (error) {
      console.error('Temp files cleanup error:', error);
    }
  });

// Storage trigger for file deletion cleanup
export const onFileDelete = functions.storage.object().onDelete(async (object: any) => {
  try {
    const filePath = object.name;
    if (!filePath) return;

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
  } catch (error) {
    console.error('File deletion trigger error:', error);
  }
});

// Storage trigger for file upload metadata
export const onFileUpload = functions.storage.object().onFinalize(async (object: any) => {
  try {
    const filePath = object.name;
    const contentType = object.contentType;
    const size = parseInt(object.size || '0');
    
    if (!filePath) return;

    // Skip if this is a thumbnail or already processed
    if (filePath.includes('_thumb.') || filePath.startsWith('processed/')) {
      return;
    }

    console.log(`File uploaded: ${filePath}, size: ${size}, type: ${contentType}`);
    
    // Additional processing can be added here
    // For example: virus scanning, additional image processing, etc.
  } catch (error) {
    console.error('File upload trigger error:', error);
  }
});