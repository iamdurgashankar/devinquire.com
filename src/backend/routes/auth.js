/**
 * Authentication Routes
 * Handles user authentication, registration, and token management
 */

const express = require('express');
const { firebaseAdmin } = require('../firebaseAdmin');
const router = express.Router();

/**
 * Verify Firebase ID Token
 * POST /api/auth/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        error: 'ID token is required',
        code: 'TOKEN_MISSING'
      });
    }
    
    const decodedToken = await firebaseAdmin.verifyIdToken(idToken);
    
    // Get user record for additional info
    const userRecord = await firebaseAdmin.getUser(decodedToken.uid);
    
    res.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        customClaims: decodedToken,
        lastSignIn: userRecord.metadata.lastSignInTime,
        createdAt: userRecord.metadata.creationTime
      }
    });
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    });
  }
});

/**
 * Create Custom Token
 * POST /api/auth/custom-token
 */
router.post('/custom-token', async (req, res) => {
  try {
    const { uid, additionalClaims = {} } = req.body;
    
    if (!uid) {
      return res.status(400).json({
        error: 'User ID is required',
        code: 'UID_MISSING'
      });
    }
    
    const customToken = await firebaseAdmin.createCustomToken(uid, additionalClaims);
    
    res.json({
      success: true,
      customToken,
      expiresIn: '1h'
    });
  } catch (error) {
    console.error('Custom token creation error:', error.message);
    res.status(500).json({
      error: 'Failed to create custom token',
      code: 'TOKEN_CREATION_FAILED'
    });
  }
});

/**
 * Get User Profile
 * GET /api/auth/profile/:uid
 */
router.get('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    const userRecord = await firebaseAdmin.getUser(uid);
    
    // Get additional user data from Firestore
    const db = firebaseAdmin.getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    res.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
        customClaims: userRecord.customClaims || {},
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
          lastRefreshTime: userRecord.metadata.lastRefreshTime
        },
        providerData: userRecord.providerData,
        ...userData // Additional data from Firestore
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      error: 'Failed to get user profile',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
});

/**
 * Update User Profile
 * PUT /api/auth/profile/:uid
 */
router.put('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { displayName, photoURL, email, emailVerified, disabled } = req.body;
    
    // Update Firebase Auth user
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    if (email !== undefined) updateData.email = email;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;
    if (disabled !== undefined) updateData.disabled = disabled;
    
    const userRecord = await firebaseAdmin.getAuth().updateUser(uid, updateData);
    
    // Update additional data in Firestore
    const db = firebaseAdmin.getFirestore();
    const firestoreData = { ...req.body };
    delete firestoreData.email; // Don't duplicate auth data
    delete firestoreData.emailVerified;
    delete firestoreData.disabled;
    
    if (Object.keys(firestoreData).length > 0) {
      await db.collection('users').doc(uid).set({
        ...firestoreData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    
    res.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      error: 'Failed to update user profile',
      code: 'PROFILE_UPDATE_FAILED'
    });
  }
});

/**
 * Set Custom User Claims (Admin only)
 * POST /api/auth/claims/:uid
 */
router.post('/claims/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { customClaims } = req.body;
    
    if (!customClaims || typeof customClaims !== 'object') {
      return res.status(400).json({
        error: 'Custom claims object is required',
        code: 'CLAIMS_INVALID'
      });
    }
    
    await firebaseAdmin.setCustomUserClaims(uid, customClaims);
    
    res.json({
      success: true,
      message: 'Custom claims updated successfully',
      uid,
      customClaims
    });
  } catch (error) {
    console.error('Set custom claims error:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      error: 'Failed to set custom claims',
      code: 'CLAIMS_UPDATE_FAILED'
    });
  }
});

/**
 * Delete User Account
 * DELETE /api/auth/user/:uid
 */
router.delete('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Delete from Firebase Auth
    await firebaseAdmin.getAuth().deleteUser(uid);
    
    // Delete user data from Firestore
    const db = firebaseAdmin.getFirestore();
    const batch = db.batch();
    
    // Delete user document
    batch.delete(db.collection('users').doc(uid));
    
    // Delete user's posts, comments, etc. (add as needed)
    const userPosts = await db.collection('posts').where('authorId', '==', uid).get();
    userPosts.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    res.json({
      success: true,
      message: 'User account deleted successfully',
      uid
    });
  } catch (error) {
    console.error('Delete user error:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      error: 'Failed to delete user account',
      code: 'USER_DELETE_FAILED'
    });
  }
});

/**
 * List Users (Admin only)
 * GET /api/auth/users
 */
router.get('/users', async (req, res) => {
  try {
    const { maxResults = 100, pageToken } = req.query;
    
    const listUsersResult = await firebaseAdmin.getAuth().listUsers(parseInt(maxResults), pageToken);
    
    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      disabled: userRecord.disabled,
      customClaims: userRecord.customClaims || {},
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime
    }));
    
    res.json({
      success: true,
      users,
      pageToken: listUsersResult.pageToken,
      totalUsers: users.length
    });
  } catch (error) {
    console.error('List users error:', error.message);
    res.status(500).json({
      error: 'Failed to list users',
      code: 'USERS_LIST_FAILED'
    });
  }
});

/**
 * Generate Password Reset Link
 * POST /api/auth/password-reset
 */
router.post('/password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'EMAIL_MISSING'
      });
    }
    
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/auth/reset-password`,
      handleCodeInApp: false
    };
    
    const resetLink = await firebaseAdmin.getAuth().generatePasswordResetLink(email, actionCodeSettings);
    
    res.json({
      success: true,
      message: 'Password reset link generated',
      resetLink
    });
  } catch (error) {
    console.error('Password reset error:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      error: 'Failed to generate password reset link',
      code: 'PASSWORD_RESET_FAILED'
    });
  }
});

/**
 * Generate Email Verification Link
 * POST /api/auth/email-verification
 */
router.post('/email-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'EMAIL_MISSING'
      });
    }
    
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/auth/verify-email`,
      handleCodeInApp: false
    };
    
    const verificationLink = await firebaseAdmin.getAuth().generateEmailVerificationLink(email, actionCodeSettings);
    
    res.json({
      success: true,
      message: 'Email verification link generated',
      verificationLink
    });
  } catch (error) {
    console.error('Email verification error:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      error: 'Failed to generate email verification link',
      code: 'EMAIL_VERIFICATION_FAILED'
    });
  }
});

module.exports = router;