/**
 * Simple Express Server for Blog API
 * Works on any Node.js hosting (not just Firebase Functions)
 * Can be deployed to Heroku, Railway, Render, or any Node.js hosting
 */

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors({
  origin: '*', // In production, specify your domain
  credentials: true
}));
app.use(express.json());

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  try {
    // Try to initialize from environment variable or service account file
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : require(path.join(__dirname, 'firebase', 'serviceAccountKey.json'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.log('⚠️  Make sure FIREBASE_SERVICE_ACCOUNT env var is set or serviceAccountKey.json exists');
  }
}

// Get Firestore instance
const db = admin.firestore();

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['authorization']?.replace('Bearer ', '') ||
                 req.query.apiKey;
  
  const validApiKey = process.env.BLOG_API_KEY || '2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271';
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Helper function to convert Firestore timestamps
const convertTimestamp = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === 'string') return ts;
  return null;
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Blog API server is running',
    timestamp: new Date().toISOString(),
    firebase: admin.apps.length > 0 ? 'connected' : 'not connected'
  });
});

// Get blog posts
app.get('/blogmanager/api/blog/posts', validateApiKey, async (req, res) => {
  try {
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

    let query = db.collection('posts')
      .where('status', '==', status)
      .where('isPublic', '==', true);

    if (category) {
      query = query.where('category', '==', category);
    }

    if (tag) {
      query = query.where('tags', 'array-contains', tag);
    }

    // Apply sorting
    const sortField = ['publishedAt', 'createdAt', 'updatedAt', 'title'].includes(sortBy)
      ? sortBy
      : 'publishedAt';
    query = query.orderBy(sortField, sortOrder === 'asc' ? 'asc' : 'desc');

    const limitNum = Math.min(parseInt(limit) || 10, 50);
    const pageNum = parseInt(page) || 1;

    // Get all matching posts first
    const snapshot = await query.get();
    const allPosts = snapshot.docs.map((doc) => {
      const data = doc.data();
      const post = {
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
    let filteredPosts = allPosts;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredPosts = allPosts.filter((post) =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.tags.some((t) => t.toLowerCase().includes(searchTerm))
      );
    }

    // Apply pagination
    const total = filteredPosts.length;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        posts: paginatedPosts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
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
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get single blog post
app.get('/blogmanager/api/blog/posts/:postId', validateApiKey, async (req, res) => {
  try {
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

    if (data.status !== 'published' || !data.isPublic) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
        timestamp: new Date().toISOString()
      });
    }

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
    }).catch((err) => console.error('Error updating view count:', err));

    res.json({
      success: true,
      data: post,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get blog categories
app.get('/blogmanager/api/blog/categories', validateApiKey, async (req, res) => {
  try {
    const snapshot = await db.collection('posts')
      .where('status', '==', 'published')
      .where('isPublic', '==', true)
      .get();

    const categoryCount = {};
    snapshot.docs.forEach((doc) => {
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
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get blog tags
app.get('/blogmanager/api/blog/tags', validateApiKey, async (req, res) => {
  try {
    const snapshot = await db.collection('posts')
      .where('status', '==', 'published')
      .where('isPublic', '==', true)
      .get();

    const tagCount = {};
    snapshot.docs.forEach((doc) => {
      const tags = doc.data().tags || [];
      if (Array.isArray(tags)) {
        tags.forEach((tag) => {
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
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: tags,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Blog API server running on port ${PORT}`);
  console.log(`📝 API endpoints available at: http://localhost:${PORT}/blogmanager/api/blog/*`);
  console.log(`🔑 Using API key: ${process.env.BLOG_API_KEY ? 'from environment' : 'default'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;



