/**
 * User Routes
 * Handles user profile management and user-related operations
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

/**
 * Get Current User Profile
 * GET /api/users/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = firebaseAdmin.getFirestore();
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      // Create user profile if it doesn't exist
      const newUserData = {
        uid: req.user.uid,
        email: req.user.email,
        displayName: req.user.name || req.user.email?.split('@')[0],
        photoURL: req.user.picture || null,
        emailVerified: req.user.email_verified || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          newsletter: true,
          notifications: true,
          theme: 'light'
        },
        profile: {
          bio: '',
          website: '',
          location: '',
          interests: []
        },
        stats: {
          postsCount: 0,
          commentsCount: 0,
          likesReceived: 0
        }
      };
      
      await db.collection('users').doc(req.user.uid).set(newUserData);
      
      return res.json({
        success: true,
        user: newUserData
      });
    }
    
    const userData = userDoc.data();
    
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get user profile error:', error.message);
    res.status(500).json({
      error: 'Failed to get user profile',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
});

/**
 * Update Current User Profile
 * PUT /api/users/me
 */
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const db = firebaseAdmin.getFirestore();
    const { displayName, photoURL, bio, website, location, interests, preferences } = req.body;
    
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    // Update basic profile fields
    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    
    // Update profile section
    if (bio !== undefined || website !== undefined || location !== undefined || interests !== undefined) {
      const currentDoc = await db.collection('users').doc(req.user.uid).get();
      const currentProfile = currentDoc.exists ? currentDoc.data().profile || {} : {};
      
      updateData.profile = {
        ...currentProfile,
        ...(bio !== undefined && { bio }),
        ...(website !== undefined && { website }),
        ...(location !== undefined && { location }),
        ...(interests !== undefined && { interests })
      };
    }
    
    // Update preferences
    if (preferences) {
      const currentDoc = await db.collection('users').doc(req.user.uid).get();
      const currentPreferences = currentDoc.exists ? currentDoc.data().preferences || {} : {};
      
      updateData.preferences = {
        ...currentPreferences,
        ...preferences
      };
    }
    
    await db.collection('users').doc(req.user.uid).update(updateData);
    
    // Get updated user data
    const updatedDoc = await db.collection('users').doc(req.user.uid).get();
    
    res.json({
      success: true,
      user: updatedDoc.data(),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update user profile error:', error.message);
    res.status(500).json({
      error: 'Failed to update user profile',
      code: 'PROFILE_UPDATE_FAILED'
    });
  }
});

/**
 * Get User Profile by ID
 * GET /api/users/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = firebaseAdmin.getFirestore();
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const userData = userDoc.data();
    
    // Return public profile only
    const publicProfile = {
      uid: userData.uid,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      profile: {
        bio: userData.profile?.bio || '',
        website: userData.profile?.website || '',
        location: userData.profile?.location || '',
        interests: userData.profile?.interests || []
      },
      stats: userData.stats || {
        postsCount: 0,
        commentsCount: 0,
        likesReceived: 0
      },
      createdAt: userData.createdAt
    };
    
    res.json({
      success: true,
      user: publicProfile
    });
  } catch (error) {
    console.error('Get user by ID error:', error.message);
    res.status(500).json({
      error: 'Failed to get user profile',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
});

/**
 * Get User Posts
 * GET /api/users/:userId/posts
 */
router.get('/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0, status = 'published' } = req.query;
    
    const db = firebaseAdmin.getFirestore();
    
    let query = db.collection('posts')
      .where('authorId', '==', userId)
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));
    
    const postsSnapshot = await query.get();
    
    const posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get total count
    const totalQuery = db.collection('posts')
      .where('authorId', '==', userId)
      .where('status', '==', status);
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
    console.error('Get user posts error:', error.message);
    res.status(500).json({
      error: 'Failed to get user posts',
      code: 'USER_POSTS_FETCH_FAILED'
    });
  }
});

/**
 * Get User Activity
 * GET /api/users/:userId/activity
 */
router.get('/:userId/activity', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, type } = req.query;
    
    // Only allow users to see their own activity or admins
    if (req.user.uid !== userId && !req.user.admin) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }
    
    const db = firebaseAdmin.getFirestore();
    
    let query = db.collection('activity')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));
    
    if (type) {
      query = query.where('type', '==', type);
    }
    
    const activitySnapshot = await query.get();
    
    const activities = activitySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Get user activity error:', error.message);
    res.status(500).json({
      error: 'Failed to get user activity',
      code: 'USER_ACTIVITY_FETCH_FAILED'
    });
  }
});

/**
 * Update User Preferences
 * PUT /api/users/me/preferences
 */
router.put('/me/preferences', authenticateToken, async (req, res) => {
  try {
    const db = firebaseAdmin.getFirestore();
    const preferences = req.body;
    
    // Validate preferences structure
    const allowedPreferences = ['newsletter', 'notifications', 'theme', 'language', 'emailFrequency'];
    const validPreferences = {};
    
    for (const [key, value] of Object.entries(preferences)) {
      if (allowedPreferences.includes(key)) {
        validPreferences[key] = value;
      }
    }
    
    await db.collection('users').doc(req.user.uid).update({
      preferences: validPreferences,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      preferences: validPreferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Update preferences error:', error.message);
    res.status(500).json({
      error: 'Failed to update preferences',
      code: 'PREFERENCES_UPDATE_FAILED'
    });
  }
});

/**
 * Delete User Account
 * DELETE /api/users/me
 */
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const db = firebaseAdmin.getFirestore();
    const batch = db.batch();
    
    // Delete user document
    batch.delete(db.collection('users').doc(req.user.uid));
    
    // Delete user's posts
    const userPosts = await db.collection('posts').where('authorId', '==', req.user.uid).get();
    userPosts.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's comments
    const userComments = await db.collection('comments').where('authorId', '==', req.user.uid).get();
    userComments.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's subscriptions
    const userSubscriptions = await db.collection('subscriptions').where('userId', '==', req.user.uid).get();
    userSubscriptions.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's activity
    const userActivity = await db.collection('activity').where('userId', '==', req.user.uid).get();
    userActivity.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Delete from Firebase Auth
    await firebaseAdmin.getAuth().deleteUser(req.user.uid);
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error.message);
    res.status(500).json({
      error: 'Failed to delete account',
      code: 'ACCOUNT_DELETE_FAILED'
    });
  }
});

/**
 * Search Users
 * GET /api/users/search
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
        code: 'QUERY_TOO_SHORT'
      });
    }
    
    const db = firebaseAdmin.getFirestore();
    
    // Search by display name (basic text search)
    const usersSnapshot = await db.collection('users')
      .where('displayName', '>=', q)
      .where('displayName', '<=', q + '\uf8ff')
      .limit(parseInt(limit))
      .get();
    
    const users = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        uid: userData.uid,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        profile: {
          bio: userData.profile?.bio || ''
        }
      };
    });
    
    res.json({
      success: true,
      users,
      query: q
    });
  } catch (error) {
    console.error('Search users error:', error.message);
    res.status(500).json({
      error: 'Failed to search users',
      code: 'USER_SEARCH_FAILED'
    });
  }
});

module.exports = router;