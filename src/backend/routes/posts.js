/**
 * Posts Routes
 * Handles blog post management and content operations
 */

const express = require('express');
const { firebaseAdmin } = require('../firebaseAdmin');
const router = express.Router();

// Middleware to authenticate requests
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'AUTH_TOKEN_MISSING'
      });
    }
    
    const decodedToken = await firebaseAdmin.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      code: 'AUTH_TOKEN_INVALID'
    });
  }
};

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decodedToken = await firebaseAdmin.verifyIdToken(token);
      req.user = decodedToken;
    }
    next();
  } catch (error) {
    next();
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.admin) {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

/**
 * Get All Posts
 * GET /api/posts
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      limit = 10, 
      offset = 0, 
      category, 
      tag, 
      status = 'published',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;
    
    const db = firebaseAdmin.getFirestore();
    
    let query = db.collection('posts');
    
    // Filter by status (only show published posts to non-admins)
    if (!req.user?.admin) {
      query = query.where('status', '==', 'published');
    } else if (status) {
      query = query.where('status', '==', status);
    }
    
    // Filter by category
    if (category) {
      query = query.where('category', '==', category);
    }
    
    // Filter by tag
    if (tag) {
      query = query.where('tags', 'array-contains', tag);
    }
    
    // Search functionality (basic)
    if (search) {
      query = query.where('title', '>=', search)
                   .where('title', '<=', search + '\uf8ff');
    }
    
    // Sort
    query = query.orderBy(sortBy, sortOrder);
    
    // Pagination
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    
    const postsSnapshot = await query.get();
    
    const posts = await Promise.all(postsSnapshot.docs.map(async (doc) => {
      const postData = doc.data();
      
      // Get author information
      let author = null;
      if (postData.authorId) {
        try {
          const authorDoc = await db.collection('users').doc(postData.authorId).get();
          if (authorDoc.exists) {
            const authorData = authorDoc.data();
            author = {
              uid: authorData.uid,
              displayName: authorData.displayName,
              photoURL: authorData.photoURL
            };
          }
        } catch (error) {
          console.warn('Failed to fetch author:', error.message);
        }
      }
      
      return {
        id: doc.id,
        ...postData,
        author
      };
    }));
    
    // Get total count for pagination
    let totalQuery = db.collection('posts');
    if (!req.user?.admin) {
      totalQuery = totalQuery.where('status', '==', 'published');
    } else if (status) {
      totalQuery = totalQuery.where('status', '==', status);
    }
    
    const totalSnapshot = await totalQuery.get();
    
    res.json({
      success: true,
      posts,
      pagination: {
        total: totalSnapshot.size,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalSnapshot.size > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error.message);
    res.status(500).json({
      error: 'Failed to get posts',
      code: 'POSTS_FETCH_FAILED'
    });
  }
});

/**
 * Get Post by ID
 * GET /api/posts/:postId
 */
router.get('/:postId', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const db = firebaseAdmin.getFirestore();
    
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      return res.status(404).json({
        error: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }
    
    const postData = postDoc.data();
    
    // Check if user can view this post
    if (postData.status !== 'published' && (!req.user || (req.user.uid !== postData.authorId && !req.user.admin))) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }
    
    // Get author information
    let author = null;
    if (postData.authorId) {
      try {
        const authorDoc = await db.collection('users').doc(postData.authorId).get();
        if (authorDoc.exists) {
          const authorData = authorDoc.data();
          author = {
            uid: authorData.uid,
            displayName: authorData.displayName,
            photoURL: authorData.photoURL,
            profile: {
              bio: authorData.profile?.bio || ''
            }
          };
        }
      } catch (error) {
        console.warn('Failed to fetch author:', error.message);
      }
    }
    
    // Increment view count
    if (postData.status === 'published') {
      await db.collection('posts').doc(postId).update({
        'stats.views': (postData.stats?.views || 0) + 1,
        'stats.lastViewed': new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      post: {
        id: postDoc.id,
        ...postData,
        author,
        stats: {
          ...postData.stats,
          views: (postData.stats?.views || 0) + 1
        }
      }
    });
  } catch (error) {
    console.error('Get post error:', error.message);
    res.status(500).json({
      error: 'Failed to get post',
      code: 'POST_FETCH_FAILED'
    });
  }
});

/**
 * Create New Post
 * POST /api/posts
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      tags = [],
      featuredImage,
      status = 'draft',
      seo = {}
    } = req.body;
    
    // Validation
    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required',
        code: 'REQUIRED_FIELDS_MISSING'
      });
    }
    
    // Only admins can publish directly
    const postStatus = req.user.admin ? status : 'draft';
    
    const db = firebaseAdmin.getFirestore();
    
    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug already exists
    const existingPost = await db.collection('posts').where('slug', '==', slug).get();
    const finalSlug = existingPost.empty ? slug : `${slug}-${Date.now()}`;
    
    const postData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      slug: finalSlug,
      category: category || 'uncategorized',
      tags: Array.isArray(tags) ? tags : [],
      featuredImage: featuredImage || null,
      status: postStatus,
      authorId: req.user.uid,
      seo: {
        title: seo.title || title,
        description: seo.description || excerpt || content.substring(0, 160),
        keywords: seo.keywords || tags.join(', ')
      },
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: postStatus === 'published' ? new Date().toISOString() : null
    };
    
    const docRef = await db.collection('posts').add(postData);
    
    // Update user stats
    await db.collection('users').doc(req.user.uid).update({
      'stats.postsCount': (await db.collection('posts').where('authorId', '==', req.user.uid).get()).size
    });
    
    res.status(201).json({
      success: true,
      post: {
        id: docRef.id,
        ...postData
      },
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Create post error:', error.message);
    res.status(500).json({
      error: 'Failed to create post',
      code: 'POST_CREATE_FAILED'
    });
  }
});

/**
 * Update Post
 * PUT /api/posts/:postId
 */
router.put('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const db = firebaseAdmin.getFirestore();
    
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      return res.status(404).json({
        error: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }
    
    const postData = postDoc.data();
    
    // Check permissions
    if (postData.authorId !== req.user.uid && !req.user.admin) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }
    
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      featuredImage,
      status,
      seo
    } = req.body;
    
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    // Update fields if provided
    if (title !== undefined) {
      updateData.title = title;
      // Update slug if title changed
      const newSlug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (newSlug !== postData.slug) {
        updateData.slug = newSlug;
      }
    }
    
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    
    // Handle status change
    if (status !== undefined) {
      // Only admins can change status to published
      if (status === 'published' && !req.user.admin) {
        return res.status(403).json({
          error: 'Only admins can publish posts',
          code: 'PUBLISH_DENIED'
        });
      }
      
      updateData.status = status;
      
      // Set publishedAt when publishing
      if (status === 'published' && postData.status !== 'published') {
        updateData.publishedAt = new Date().toISOString();
      }
    }
    
    // Update SEO if provided
    if (seo) {
      updateData.seo = {
        ...postData.seo,
        ...seo
      };
    }
    
    await db.collection('posts').doc(postId).update(updateData);
    
    // Get updated post
    const updatedDoc = await db.collection('posts').doc(postId).get();
    
    res.json({
      success: true,
      post: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      },
      message: 'Post updated successfully'
    });
  } catch (error) {
    console.error('Update post error:', error.message);
    res.status(500).json({
      error: 'Failed to update post',
      code: 'POST_UPDATE_FAILED'
    });
  }
});

/**
 * Delete Post
 * DELETE /api/posts/:postId
 */
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const db = firebaseAdmin.getFirestore();
    
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      return res.status(404).json({
        error: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }
    
    const postData = postDoc.data();
    
    // Check permissions
    if (postData.authorId !== req.user.uid && !req.user.admin) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }
    
    // Delete post and related data
    const batch = db.batch();
    
    // Delete the post
    batch.delete(db.collection('posts').doc(postId));
    
    // Delete related comments
    const comments = await db.collection('comments').where('postId', '==', postId).get();
    comments.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Update user stats
    await db.collection('users').doc(postData.authorId).update({
      'stats.postsCount': (await db.collection('posts').where('authorId', '==', postData.authorId).get()).size
    });
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error.message);
    res.status(500).json({
      error: 'Failed to delete post',
      code: 'POST_DELETE_FAILED'
    });
  }
});

/**
 * Like/Unlike Post
 * POST /api/posts/:postId/like
 */
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const db = firebaseAdmin.getFirestore();
    
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      return res.status(404).json({
        error: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }
    
    // Check if user already liked this post
    const likeDoc = await db.collection('likes')
      .where('postId', '==', postId)
      .where('userId', '==', req.user.uid)
      .get();
    
    const postData = postDoc.data();
    let isLiked = !likeDoc.empty;
    let newLikeCount = postData.stats?.likes || 0;
    
    if (isLiked) {
      // Unlike
      await db.collection('likes').doc(likeDoc.docs[0].id).delete();
      newLikeCount = Math.max(0, newLikeCount - 1);
      isLiked = false;
    } else {
      // Like
      await db.collection('likes').add({
        postId,
        userId: req.user.uid,
        createdAt: new Date().toISOString()
      });
      newLikeCount += 1;
      isLiked = true;
    }
    
    // Update post stats
    await db.collection('posts').doc(postId).update({
      'stats.likes': newLikeCount
    });
    
    res.json({
      success: true,
      isLiked,
      likeCount: newLikeCount,
      message: isLiked ? 'Post liked' : 'Post unliked'
    });
  } catch (error) {
    console.error('Like post error:', error.message);
    res.status(500).json({
      error: 'Failed to like/unlike post',
      code: 'POST_LIKE_FAILED'
    });
  }
});

/**
 * Get Post Categories
 * GET /api/posts/categories
 */
router.get('/meta/categories', async (req, res) => {
  try {
    const db = firebaseAdmin.getFirestore();
    
    // Get all unique categories
    const postsSnapshot = await db.collection('posts')
      .where('status', '==', 'published')
      .get();
    
    const categories = new Set();
    postsSnapshot.forEach(doc => {
      const category = doc.data().category;
      if (category) {
        categories.add(category);
      }
    });
    
    res.json({
      success: true,
      categories: Array.from(categories).sort()
    });
  } catch (error) {
    console.error('Get categories error:', error.message);
    res.status(500).json({
      error: 'Failed to get categories',
      code: 'CATEGORIES_FETCH_FAILED'
    });
  }
});

/**
 * Get Post Tags
 * GET /api/posts/tags
 */
router.get('/meta/tags', async (req, res) => {
  try {
    const db = firebaseAdmin.getFirestore();
    
    // Get all unique tags
    const postsSnapshot = await db.collection('posts')
      .where('status', '==', 'published')
      .get();
    
    const tags = new Set();
    postsSnapshot.forEach(doc => {
      const postTags = doc.data().tags || [];
      postTags.forEach(tag => tags.add(tag));
    });
    
    res.json({
      success: true,
      tags: Array.from(tags).sort()
    });
  } catch (error) {
    console.error('Get tags error:', error.message);
    res.status(500).json({
      error: 'Failed to get tags',
      code: 'TAGS_FETCH_FAILED'
    });
  }
});

module.exports = router;