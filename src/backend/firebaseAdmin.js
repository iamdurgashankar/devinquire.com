/**
 * Firebase Admin SDK Configuration
 * Provides secure server-side access to Firebase services
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

class FirebaseAdminService {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.storage = null;
    this.messaging = null;
    this.initialized = false;
  }

  /**
   * Initialize Firebase Admin SDK
   * @param {Object} config - Configuration options
   * @param {string} config.serviceAccountPath - Path to service account key file
   * @param {string} config.databaseURL - Firebase Realtime Database URL
   * @param {string} config.storageBucket - Firebase Storage bucket name
   */
  async initialize(config = {}) {
    try {
      if (this.initialized) {
        console.log('Firebase Admin SDK already initialized');
        return this.app;
      }

      // Configuration options with fallbacks
      const {
        serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json',
        databaseURL = process.env.FIREBASE_DATABASE_URL,
        storageBucket = process.env.FIREBASE_STORAGE_BUCKET,
        projectId = process.env.FIREBASE_PROJECT_ID
      } = config;

      // Validate service account key file
      const serviceAccountFullPath = path.resolve(serviceAccountPath);
      if (!fs.existsSync(serviceAccountFullPath)) {
        throw new Error(`Service account key file not found at: ${serviceAccountFullPath}`);
      }

      // Load service account credentials
      const serviceAccount = require(serviceAccountFullPath);

      // Validate required fields in service account
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
      for (const field of requiredFields) {
        if (!serviceAccount[field]) {
          throw new Error(`Missing required field '${field}' in service account key`);
        }
      }

      // Initialize Firebase Admin
      const adminConfig = {
        credential: admin.credential.cert(serviceAccount)
      };

      // Add optional configurations
      if (databaseURL) {
        adminConfig.databaseURL = databaseURL;
      }
      if (storageBucket) {
        adminConfig.storageBucket = storageBucket;
      }

      this.app = admin.initializeApp(adminConfig);
      
      // Initialize services
      this.db = admin.firestore();
      this.auth = admin.auth();
      this.realtimeDb = admin.database();
      
      if (storageBucket) {
        this.storage = admin.storage();
      }
      
      // Initialize messaging if available
      try {
        this.messaging = admin.messaging();
      } catch (error) {
        console.warn('Firebase Messaging not available:', error.message);
      }

      this.initialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
      console.log(`📊 Project ID: ${serviceAccount.project_id}`);
      console.log(`🔐 Service Account: ${serviceAccount.client_email}`);
      
      return this.app;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
      throw error;
    }
  }

  /**
   * Get Firestore database instance
   */
  getFirestore() {
    if (!this.initialized) {
      throw new Error('Firebase Admin SDK not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Get Firebase Auth instance
   */
  getAuth() {
    if (!this.initialized) {
      throw new Error('Firebase Admin SDK not initialized. Call initialize() first.');
    }
    return this.auth;
  }

  /**
   * Get Realtime Database instance
   */
  getRealtimeDatabase() {
    if (!this.initialized) {
      throw new Error('Firebase Admin SDK not initialized. Call initialize() first.');
    }
    return this.realtimeDb;
  }

  /**
   * Get Firebase Storage instance
   */
  getStorage() {
    if (!this.initialized) {
      throw new Error('Firebase Admin SDK not initialized. Call initialize() first.');
    }
    if (!this.storage) {
      throw new Error('Firebase Storage not configured. Provide storageBucket in configuration.');
    }
    return this.storage;
  }

  /**
   * Get Firebase Messaging instance
   */
  getMessaging() {
    if (!this.initialized) {
      throw new Error('Firebase Admin SDK not initialized. Call initialize() first.');
    }
    if (!this.messaging) {
      throw new Error('Firebase Messaging not available.');
    }
    return this.messaging;
  }

  /**
   * Verify Firebase ID token
   * @param {string} idToken - Firebase ID token from client
   * @returns {Promise<Object>} Decoded token
   */
  async verifyIdToken(idToken) {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Token verification failed:', error.message);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Create custom token for user
   * @param {string} uid - User ID
   * @param {Object} additionalClaims - Additional claims to include
   * @returns {Promise<string>} Custom token
   */
  async createCustomToken(uid, additionalClaims = {}) {
    try {
      const customToken = await this.auth.createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error) {
      console.error('Custom token creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get user by UID
   * @param {string} uid - User ID
   * @returns {Promise<Object>} User record
   */
  async getUser(uid) {
    try {
      const userRecord = await this.auth.getUser(uid);
      return userRecord;
    } catch (error) {
      console.error('Get user failed:', error.message);
      throw error;
    }
  }

  /**
   * Update user claims
   * @param {string} uid - User ID
   * @param {Object} customClaims - Custom claims to set
   */
  async setCustomUserClaims(uid, customClaims) {
    try {
      await this.auth.setCustomUserClaims(uid, customClaims);
      console.log(`✅ Custom claims updated for user: ${uid}`);
    } catch (error) {
      console.error('Set custom claims failed:', error.message);
      throw error;
    }
  }

  /**
   * Send push notification
   * @param {Object} message - FCM message object
   * @returns {Promise<string>} Message ID
   */
  async sendNotification(message) {
    try {
      if (!this.messaging) {
        throw new Error('Firebase Messaging not available');
      }
      
      const response = await this.messaging.send(message);
      console.log('✅ Notification sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Send notification failed:', error.message);
      throw error;
    }
  }

  /**
   * Batch operations for Firestore
   * @returns {Object} Firestore batch instance
   */
  batch() {
    return this.db.batch();
  }

  /**
   * Create Firestore transaction
   * @param {Function} updateFunction - Transaction update function
   * @returns {Promise} Transaction result
   */
  async runTransaction(updateFunction) {
    return this.db.runTransaction(updateFunction);
  }

  /**
   * Health check for Firebase services
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    try {
      // Test Firestore
      await this.db.collection('_health').doc('test').set({ timestamp: Date.now() });
      health.services.firestore = 'healthy';
    } catch (error) {
      health.services.firestore = `error: ${error.message}`;
    }

    try {
      // Test Auth
      await this.auth.listUsers(1);
      health.services.auth = 'healthy';
    } catch (error) {
      health.services.auth = `error: ${error.message}`;
    }

    try {
      // Test Realtime Database
      await this.realtimeDb.ref('_health').set({ timestamp: Date.now() });
      health.services.realtimeDatabase = 'healthy';
    } catch (error) {
      health.services.realtimeDatabase = `error: ${error.message}`;
    }

    if (this.storage) {
      try {
        // Test Storage
        const bucket = this.storage.bucket();
        await bucket.exists();
        health.services.storage = 'healthy';
      } catch (error) {
        health.services.storage = `error: ${error.message}`;
      }
    }

    return health;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.app) {
        await this.app.delete();
        console.log('✅ Firebase Admin SDK shut down gracefully');
      }
    } catch (error) {
      console.error('❌ Error during Firebase Admin SDK shutdown:', error.message);
    }
  }
}

// Create singleton instance
const firebaseAdmin = new FirebaseAdminService();

// Auto-initialize if environment variables are set
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  firebaseAdmin.initialize().catch(error => {
    console.error('Auto-initialization failed:', error.message);
  });
}

module.exports = {
  firebaseAdmin,
  FirebaseAdminService
};