/**
 * Comments Routes
 * Handles blog post comments and replies
 */

const express = require('express');
const { firebaseAdmin } = require('../firebaseAdmin');
const { authenticateToken, requireAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiting for comments
const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 comment requests per windowMs
  message: {
    error: 'Too many comment requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Content validation
const validateCommentContent = (content) => {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Comment content is required' };
  }
  
  const trimmedContent = content.trim();
  if (trimmedContent.length < 1) {
    return { valid: false, error: 'Comment cannot be empty' };
  }
  
  if (trimmedContent.length > 2000) {
    return { valid: false, error: 'Comment is too long (max 2000 characters)' };
  }
  
  return { valid: true, content: trimmedContent };
};

// Basic spam detection
const detectSpam = (content, email) => {
  const spamKeywords = [
    'viagra', 'casino', 'lottery', 'winner', 'congratulations',
    'click here', 'free money', 'make money fast', 'work from home'
  ];
  
  const lowerContent = content.toLowerCase();
  const hasSpamKeywords = spamKeywords.some(keyword => lowerContent.includes(keyword));
  
  // Check for excessive links
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  const hasExcessiveLinks = linkCount > 3;
  
  // Check for suspicious email patterns
  const hasSuspiciousEmail = email && (
    email.includes('temp') || 
    email.includes('disposable') ||
    email.match(/\d{10,}@/) // emails with many numbers
  );
  
  return hasSpamKeywords || hasExcessiveLinks || hasSuspiciousEmail;
};

/**
 * Get Comments for a Post
 * GET /api/comments/:postId
 */
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 50, offset = 0, sort = 'newest' } = req.query;
    
    const db = firebaseAdmin.getFirestore();
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Get comments from Realtime Database
    const commentsRef = realtimeDb.ref(`comments/${postId}`);
    let query = commentsRef;
    
    // Apply sorting
    if (sort === 'oldest') {
      query = query.orderByChild('createdAt');
    } else {
      query = query.orderByChild('createdAt');
    }
    
    const snapshot = await query.once('value');
    const commentsData = snapshot.val() || {};
    
    // Convert to array and apply pagination
    let comments = Object.keys(commentsData).map(key => ({
      id: key,
      ...commentsData[key]
    }));
    
    // Sort comments
    if (sort === 'newest') {
      comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'oldest') {
      comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedComments = comments.slice(startIndex, endIndex);
    
    // Get user details for comments
    const userIds = [...new Set(paginatedComments.map(comment => comment.userId).filter(Boolean))];
    const userDetails = {};
    
    if (userIds.length > 0) {
      const userPromises = userIds.map(async (userId) => {
        try {
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userDetails[userId] = {
              displayName: userData.displayName || 'Anonymous',
              photoURL: userData.photoURL || null
            };
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error.message);
        }
      });
      
      await Promise.all(userPromises);
    }
    
    // Enhance comments with user details
    const enhancedComments = paginatedComments.map(comment => ({
      ...comment,
      author: comment.userId ? userDetails[comment.userId] : {
        displayName: comment.authorName || 'Anonymous',
        photoURL: null
      }
    }));
    
    res.json({
      success: true,
      comments: enhancedComments,
      pagination: {
        total: comments.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < comments.length
      }
    });
    
  } catch (error) {
    console.error('Get comments error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch comments',
      code: 'COMMENTS_FETCH_FAILED'
    });
  }
});

/**
 * Add Comment to Post
 * POST /api/comments/:postId
 */
router.post('/:postId', commentLimiter, authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, authorName, authorEmail, parentId = null } = req.body;
    
    // Validate content
    const contentValidation = validateCommentContent(content);
    if (!contentValidation.valid) {
      return res.status(400).json({
        error: contentValidation.error,
        code: 'INVALID_CONTENT'
      });
    }
    
    // For anonymous comments, require name and email
    if (!req.user && (!authorName || !authorEmail)) {
      return res.status(400).json({
        error: 'Name and email are required for anonymous comments',
        code: 'ANONYMOUS_DETAILS_REQUIRED'
      });
    }
    
    // Validate email format for anonymous comments
    if (!req.user && authorEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(authorEmail)) {
        return res.status(400).json({
          error: 'Invalid email address',
          code: 'INVALID_EMAIL'
        });
      }
    }
    
    // Spam detection
    const isSpam = detectSpam(contentValidation.content, authorEmail);
    if (isSpam) {
      return res.status(400).json({
        error: 'Comment appears to be spam',
        code: 'SPAM_DETECTED'
      });
    }
    
    const db = firebaseAdmin.getFirestore();
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Verify post exists
    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) {
      return res.status(404).json({
        error: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }
    
    // If replying to a comment, verify parent exists
    if (parentId) {
      const parentRef = realtimeDb.ref(`comments/${postId}/${parentId}`);
      const parentSnapshot = await parentRef.once('value');
      if (!parentSnapshot.exists()) {
        return res.status(404).json({
          error: 'Parent comment not found',
          code: 'PARENT_COMMENT_NOT_FOUND'
        });
      }
    }
    
    // Create comment data
    const commentData = {
      content: contentValidation.content,
      postId,
      parentId,
      userId: req.user?.uid || null,
      authorName: req.user ? null : authorName,
      authorEmail: req.user ? null : authorEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      likedBy: {},
      status: 'approved', // Could implement moderation
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    // Add comment to Realtime Database
    const commentsRef = realtimeDb.ref(`comments/${postId}`);
    const newCommentRef = commentsRef.push();
    await newCommentRef.set(commentData);
    
    // Update post comment count in Firestore
    await db.collection('posts').doc(postId).update({
      commentCount: firebaseAdmin.firestore.FieldValue.increment(1),
      lastCommentAt: new Date().toISOString()
    });
    
    // Get user details for response
    let authorDetails = {
      displayName: authorName || 'Anonymous',
      photoURL: null
    };
    
    if (req.user) {
      try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          authorDetails = {
            displayName: userData.displayName || 'Anonymous',
            photoURL: userData.photoURL || null
          };
        }
      } catch (error) {
        console.error('Error fetching user details:', error.message);
      }
    }
    
    // Log activity
    try {
      await realtimeDb.ref('activity').push({
        type: 'comment_added',
        userId: req.user?.uid || null,
        postId,
        commentId: newCommentRef.key,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging activity:', error.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        id: newCommentRef.key,
        ...commentData,
        author: authorDetails
      }
    });
    
  } catch (error) {
    console.error('Add comment error:', error.message);
    res.status(500).json({
      error: 'Failed to add comment',
      code: 'COMMENT_ADD_FAILED'
    });
  }
});

/**
 * Update Comment
 * PUT /api/comments/:postId/:commentId
 */
router.put('/:postId/:commentId', requireAuth, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    
    // Validate content
    const contentValidation = validateCommentContent(content);
    if (!contentValidation.valid) {
      return res.status(400).json({
        error: contentValidation.error,
        code: 'INVALID_CONTENT'
      });
    }
    
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Get existing comment
    const commentRef = realtimeDb.ref(`comments/${postId}/${commentId}`);
    const commentSnapshot = await commentRef.once('value');
    
    if (!commentSnapshot.exists()) {
      return res.status(404).json({
        error: 'Comment not found',
        code: 'COMMENT_NOT_FOUND'
      });
    }
    
    const commentData = commentSnapshot.val();
    
    // Check if user owns the comment
    if (commentData.userId !== req.user.uid) {
      return res.status(403).json({
        error: 'You can only edit your own comments',
        code: 'UNAUTHORIZED_EDIT'
      });
    }
    
    // Update comment
    await commentRef.update({
      content: contentValidation.content,
      updatedAt: new Date().toISOString(),
      edited: true
    });
    
    res.json({
      success: true,
      message: 'Comment updated successfully'
    });
    
  } catch (error) {
    console.error('Update comment error:', error.message);
    res.status(500).json({
      error: 'Failed to update comment',
      code: 'COMMENT_UPDATE_FAILED'
    });
  }
});

/**
 * Delete Comment
 * DELETE /api/comments/:postId/:commentId
 */
router.delete('/:postId/:commentId', requireAuth, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    
    const db = firebaseAdmin.getFirestore();
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Get existing comment
    const commentRef = realtimeDb.ref(`comments/${postId}/${commentId}`);
    const commentSnapshot = await commentRef.once('value');
    
    if (!commentSnapshot.exists()) {
      return res.status(404).json({
        error: 'Comment not found',
        code: 'COMMENT_NOT_FOUND'
      });
    }
    
    const commentData = commentSnapshot.val();
    
    // Check if user owns the comment or is admin
    const isOwner = commentData.userId === req.user.uid;
    const isAdmin = req.user.customClaims?.admin === true;
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'You can only delete your own comments',
        code: 'UNAUTHORIZED_DELETE'
      });
    }
    
    // Get all replies to this comment
    const allCommentsRef = realtimeDb.ref(`comments/${postId}`);
    const allCommentsSnapshot = await allCommentsRef.once('value');
    const allComments = allCommentsSnapshot.val() || {};
    
    // Find replies
    const repliesToDelete = Object.keys(allComments).filter(key => 
      allComments[key].parentId === commentId
    );
    
    // Delete comment and all replies
    const deletePromises = [commentRef.remove()];
    repliesToDelete.forEach(replyId => {
      deletePromises.push(realtimeDb.ref(`comments/${postId}/${replyId}`).remove());
    });
    
    await Promise.all(deletePromises);
    
    // Update post comment count
    const deletedCount = 1 + repliesToDelete.length;
    await db.collection('posts').doc(postId).update({
      commentCount: firebaseAdmin.firestore.FieldValue.increment(-deletedCount)
    });
    
    res.json({
      success: true,
      message: `Comment and ${repliesToDelete.length} replies deleted successfully`
    });
    
  } catch (error) {
    console.error('Delete comment error:', error.message);
    res.status(500).json({
      error: 'Failed to delete comment',
      code: 'COMMENT_DELETE_FAILED'
    });
  }
});

/**
 * Like/Unlike Comment
 * POST /api/comments/:postId/:commentId/like
 */
router.post('/:postId/:commentId/like', requireAuth, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.uid;
    
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Get existing comment
    const commentRef = realtimeDb.ref(`comments/${postId}/${commentId}`);
    const commentSnapshot = await commentRef.once('value');
    
    if (!commentSnapshot.exists()) {
      return res.status(404).json({
        error: 'Comment not found',
        code: 'COMMENT_NOT_FOUND'
      });
    }
    
    const commentData = commentSnapshot.val();
    const likedBy = commentData.likedBy || {};
    const currentLikes = commentData.likes || 0;
    
    let newLikes;
    let action;
    
    if (likedBy[userId]) {
      // Unlike
      delete likedBy[userId];
      newLikes = Math.max(0, currentLikes - 1);
      action = 'unliked';
    } else {
      // Like
      likedBy[userId] = true;
      newLikes = currentLikes + 1;
      action = 'liked';
    }
    
    // Update comment
    await commentRef.update({
      likes: newLikes,
      likedBy
    });
    
    res.json({
      success: true,
      message: `Comment ${action} successfully`,
      likes: newLikes,
      liked: action === 'liked'
    });
    
  } catch (error) {
    console.error('Like comment error:', error.message);
    res.status(500).json({
      error: 'Failed to like/unlike comment',
      code: 'COMMENT_LIKE_FAILED'
    });
  }
});

/**
 * Get Comment Replies
 * GET /api/comments/:postId/:commentId/replies
 */
router.get('/:postId/:commentId/replies', async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const db = firebaseAdmin.getFirestore();
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Get all comments for the post
    const commentsRef = realtimeDb.ref(`comments/${postId}`);
    const snapshot = await commentsRef.orderByChild('parentId').equalTo(commentId).once('value');
    const repliesData = snapshot.val() || {};
    
    // Convert to array and sort by creation time
    let replies = Object.keys(repliesData).map(key => ({
      id: key,
      ...repliesData[key]
    }));
    
    replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedReplies = replies.slice(startIndex, endIndex);
    
    // Get user details for replies
    const userIds = [...new Set(paginatedReplies.map(reply => reply.userId).filter(Boolean))];
    const userDetails = {};
    
    if (userIds.length > 0) {
      const userPromises = userIds.map(async (userId) => {
        try {
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userDetails[userId] = {
              displayName: userData.displayName || 'Anonymous',
              photoURL: userData.photoURL || null
            };
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error.message);
        }
      });
      
      await Promise.all(userPromises);
    }
    
    // Enhance replies with user details
    const enhancedReplies = paginatedReplies.map(reply => ({
      ...reply,
      author: reply.userId ? userDetails[reply.userId] : {
        displayName: reply.authorName || 'Anonymous',
        photoURL: null
      }
    }));
    
    res.json({
      success: true,
      replies: enhancedReplies,
      pagination: {
        total: replies.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < replies.length
      }
    });
    
  } catch (error) {
    console.error('Get replies error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch replies',
      code: 'REPLIES_FETCH_FAILED'
    });
  }
});

/**
 * Search Comments
 * GET /api/comments/search
 */
router.get('/search', async (req, res) => {
  try {
    const { q, postId, limit = 20, offset = 0 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
        code: 'INVALID_SEARCH_QUERY'
      });
    }
    
    const realtimeDb = firebaseAdmin.getDatabase();
    
    // Get comments from specific post or all posts
    let commentsRef;
    if (postId) {
      commentsRef = realtimeDb.ref(`comments/${postId}`);
    } else {
      commentsRef = realtimeDb.ref('comments');
    }
    
    const snapshot = await commentsRef.once('value');
    const commentsData = snapshot.val() || {};
    
    // Flatten comments and search
    let allComments = [];
    
    if (postId) {
      // Single post comments
      allComments = Object.keys(commentsData).map(key => ({
        id: key,
        postId,
        ...commentsData[key]
      }));
    } else {
      // All posts comments
      Object.keys(commentsData).forEach(postKey => {
        const postComments = commentsData[postKey] || {};
        Object.keys(postComments).forEach(commentKey => {
          allComments.push({
            id: commentKey,
            postId: postKey,
            ...postComments[commentKey]
          });
        });
      });
    }
    
    // Filter comments by search query
    const searchTerm = q.toLowerCase();
    const matchingComments = allComments.filter(comment => 
      comment.content && comment.content.toLowerCase().includes(searchTerm)
    );
    
    // Sort by relevance (exact matches first, then by date)
    matchingComments.sort((a, b) => {
      const aExact = a.content.toLowerCase().includes(searchTerm);
      const bExact = b.content.toLowerCase().includes(searchTerm);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedComments = matchingComments.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      comments: paginatedComments,
      pagination: {
        total: matchingComments.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < matchingComments.length
      },
      searchQuery: q
    });
    
  } catch (error) {
    console.error('Search comments error:', error.message);
    res.status(500).json({
      error: 'Failed to search comments',
      code: 'COMMENT_SEARCH_FAILED'
    });
  }
});

module.exports = router;