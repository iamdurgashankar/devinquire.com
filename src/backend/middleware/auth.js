/**
 * Authentication Middleware
 * Handles Firebase token verification and user authorization
 */

const { firebaseAdmin } = require('../firebaseAdmin');

/**
 * Middleware to authenticate Firebase ID tokens
 * Makes user data available in req.user if token is valid
 * Does not require authentication (optional authentication)
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    try {
      // Verify the Firebase ID token
      const decodedToken = await firebaseAdmin.getAuth().verifyIdToken(token);
      
      // Get additional user data from Firestore
      const db = firebaseAdmin.getFirestore();
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      
      // Combine Firebase Auth data with Firestore user data
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        customClaims: decodedToken,
        // Add Firestore user data if available
        ...(userDoc.exists ? userDoc.data() : {})
      };
      
      // Update last seen timestamp
      if (userDoc.exists) {
        await db.collection('users').doc(decodedToken.uid).update({
          lastSeen: new Date().toISOString(),
          lastActive: new Date().toISOString()
        });
      }
      
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError.message);
      
      // Invalid token, but don't fail the request
      req.user = null;
    }
    
    next();
    
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    req.user = null;
    next();
  }
};

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'Please provide a valid authentication token'
      });
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication token missing',
        code: 'TOKEN_MISSING',
        message: 'Authentication token is required'
      });
    }
    
    try {
      // Verify the Firebase ID token
      const decodedToken = await firebaseAdmin.getAuth().verifyIdToken(token);
      
      // Get additional user data from Firestore
      const db = firebaseAdmin.getFirestore();
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      
      // Check if user account is active
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        if (userData.status === 'suspended') {
          return res.status(403).json({
            error: 'Account suspended',
            code: 'ACCOUNT_SUSPENDED',
            message: 'Your account has been suspended. Please contact support.'
          });
        }
        
        if (userData.status === 'deleted') {
          return res.status(403).json({
            error: 'Account deleted',
            code: 'ACCOUNT_DELETED',
            message: 'This account has been deleted.'
          });
        }
      }
      
      // Combine Firebase Auth data with Firestore user data
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        customClaims: decodedToken,
        // Add Firestore user data if available
        ...(userDoc.exists ? userDoc.data() : {})
      };
      
      // Update last seen timestamp
      if (userDoc.exists) {
        await db.collection('users').doc(decodedToken.uid).update({
          lastSeen: new Date().toISOString(),
          lastActive: new Date().toISOString()
        });
      }
      
      next();
      
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError.message);
      
      if (tokenError.code === 'auth/id-token-expired') {
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired. Please sign in again.'
        });
      }
      
      if (tokenError.code === 'auth/id-token-revoked') {
        return res.status(401).json({
          error: 'Token revoked',
          code: 'TOKEN_REVOKED',
          message: 'Authentication token has been revoked. Please sign in again.'
        });
      }
      
      return res.status(401).json({
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        message: 'The provided authentication token is invalid.'
      });
    }
    
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    return res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR',
      message: 'An error occurred during authentication.'
    });
  }
};

/**
 * Middleware to require admin privileges
 * Returns 403 if user is not an admin
 */
const requireAdmin = async (req, res, next) => {
  // First ensure user is authenticated
  await requireAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'Please sign in to access this resource'
      });
    }
    
    // Check if user has admin privileges
    const isAdmin = req.user.customClaims?.admin === true || 
                   req.user.role === 'admin' ||
                   req.user.roles?.includes('admin');
    
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED',
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  });
};

/**
 * Middleware to require specific role
 * Returns 403 if user doesn't have the required role
 */
const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    // First ensure user is authenticated
    await requireAuth(req, res, () => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'Please sign in to access this resource'
        });
      }
      
      // Check if user has the required role
      const hasRole = req.user.customClaims?.[requiredRole] === true ||
                     req.user.role === requiredRole ||
                     req.user.roles?.includes(requiredRole);
      
      if (!hasRole) {
        return res.status(403).json({
          error: `${requiredRole} access required`,
          code: 'ROLE_REQUIRED',
          message: `You need ${requiredRole} privileges to access this resource`
        });
      }
      
      next();
    });
  };
};

/**
 * Middleware to require email verification
 * Returns 403 if user's email is not verified
 */
const requireEmailVerification = async (req, res, next) => {
  // First ensure user is authenticated
  await requireAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'Please sign in to access this resource'
      });
    }
    
    if (!req.user.emailVerified) {
      return res.status(403).json({
        error: 'Email verification required',
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Please verify your email address to access this resource'
      });
    }
    
    next();
  });
};

/**
 * Middleware to check if user owns a resource
 * Compares req.user.uid with a specified field in req.params or req.body
 */
const requireOwnership = (userIdField = 'userId') => {
  return async (req, res, next) => {
    // First ensure user is authenticated
    await requireAuth(req, res, () => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'Please sign in to access this resource'
        });
      }
      
      // Get the user ID from params or body
      const resourceUserId = req.params[userIdField] || req.body[userIdField];
      
      if (!resourceUserId) {
        return res.status(400).json({
          error: 'User ID not provided',
          code: 'USER_ID_MISSING',
          message: `${userIdField} is required`
        });
      }
      
      // Check if user owns the resource or is admin
      const isOwner = req.user.uid === resourceUserId;
      const isAdmin = req.user.customClaims?.admin === true || 
                     req.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED',
          message: 'You can only access your own resources'
        });
      }
      
      next();
    });
  };
};

/**
 * Middleware to validate API key for server-to-server communication
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'API_KEY_REQUIRED',
      message: 'Please provide a valid API key'
    });
  }
  
  // Check against environment variable
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY',
      message: 'The provided API key is invalid'
    });
  }
  
  next();
};

/**
 * Middleware to check rate limiting based on user
 * Uses Firebase UID for authenticated users, IP for anonymous
 */
const getUserIdentifier = (req) => {
  return req.user?.uid || req.ip || 'anonymous';
};

/**
 * Helper function to check if user has any of the specified roles
 */
const hasAnyRole = (user, roles) => {
  if (!user || !roles || !Array.isArray(roles)) {
    return false;
  }
  
  return roles.some(role => 
    user.customClaims?.[role] === true ||
    user.role === role ||
    user.roles?.includes(role)
  );
};

/**
 * Helper function to check if user has all specified roles
 */
const hasAllRoles = (user, roles) => {
  if (!user || !roles || !Array.isArray(roles)) {
    return false;
  }
  
  return roles.every(role => 
    user.customClaims?.[role] === true ||
    user.role === role ||
    user.roles?.includes(role)
  );
};

module.exports = {
  authenticateToken,
  requireAuth,
  requireAdmin,
  requireRole,
  requireEmailVerification,
  requireOwnership,
  validateApiKey,
  getUserIdentifier,
  hasAnyRole,
  hasAllRoles
};