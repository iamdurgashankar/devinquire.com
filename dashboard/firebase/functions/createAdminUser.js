/**
 * Firebase Cloud Function to create the default admin user
 * This bypasses Firestore security rules by running with admin privileges
 */

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();
const FieldValue = admin.firestore.FieldValue || require('firebase-admin/firestore').FieldValue;

/**
 * Create Admin User Cloud Function
 * This function creates the default admin user with proper permissions
 */
exports.createAdminUser = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ 
        success: false, 
        message: "Method not allowed" 
      });
    }

    // Admin user configuration
    const ADMIN_CONFIG = {
      email: 'admin@devinquire.com',
      password: '8763155488SIpu@',
      displayName: 'System Administrator',
      role: 'SUPER_ADMIN',
      status: 'active'
    };

    console.log('🚀 Creating admin user...');

    // Check if admin user already exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(ADMIN_CONFIG.email);
      console.log('✅ Admin user already exists in Firebase Auth:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create user in Firebase Auth
        userRecord = await auth.createUser({
          email: ADMIN_CONFIG.email,
          password: ADMIN_CONFIG.password,
          displayName: ADMIN_CONFIG.displayName,
          emailVerified: true
        });
        console.log('✅ Admin user created in Firebase Auth:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // Set custom claims for admin role
    await auth.setCustomUserClaims(userRecord.uid, {
      role: ADMIN_CONFIG.role,
      admin: true,
      superAdmin: true
    });
    console.log('✅ Admin custom claims set');

    // Create/update user document in Firestore
    const userDoc = {
      uid: userRecord.uid,
      email: ADMIN_CONFIG.email,
      displayName: ADMIN_CONFIG.displayName,
      photoURL: '',
      role: ADMIN_CONFIG.role,
      status: ADMIN_CONFIG.status,
      emailVerified: true,
      provider: 'email',
      permissions: ['*'], // All permissions
      approvalStatus: {
        status: 'approved',
        approvedAt: FieldValue.serverTimestamp(),
        approvedBy: 'system',
        reason: 'Default admin user'
      },
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: null,
        loginCount: 0,
        emailVerifiedAt: FieldValue.serverTimestamp()
      },
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          marketing: false
        }
      }
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
    console.log('✅ Admin user document created/updated in Firestore');

    return res.status(200).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        uid: userRecord.uid,
        email: ADMIN_CONFIG.email,
        role: ADMIN_CONFIG.role,
        status: ADMIN_CONFIG.status
      }
    });

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error.message
    });
  }
});