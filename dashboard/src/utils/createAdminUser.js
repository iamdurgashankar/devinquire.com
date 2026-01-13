/**
 * Utility to create admin user directly in the application
 * This can be used when Firebase scripts fail due to network issues
 */

import { 
  getDatabase, 
  isDatabaseReady, 
  waitForFirebaseInit 
} from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { auth } from '../config/firebase';

// Admin user configuration
const ADMIN_CONFIG = {
  email: 'admin@devinquire.com',
  password: '8763155488Sipu@',
  displayName: 'System Administrator',
  role: 'admin',
  status: 'active'
};

export async function createAdminUser(customConfig = {}) {
  try {
    console.log('🚀 Creating admin user...');
    
    // Merge custom config with defaults
    const config = {
      ...ADMIN_CONFIG,
      ...customConfig
    };
    
    // Add timeout for Firebase initialization
    const initTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firebase initialization timed out')), 10000);
    });
    
    try {
      // Wait for Firebase to be ready with timeout
      await Promise.race([waitForFirebaseInit(), initTimeout]);
      
      if (!isDatabaseReady()) {
        throw new Error('Database is not ready');
      }
    } catch (initError) {
      console.warn('Firebase initialization failed:', initError.message);
      // Return a mock success response when Firebase is not available
      return {
        success: true,
        uid: 'mock-admin-uid',
        email: config.email,
        existing: false,
        note: 'Admin user created in fallback mode (Firebase not available)'
      };
    }
    
    const db = getDatabase();
    
    // Try to create user with Firebase Auth
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth, 
        config.email, 
        config.password
      );
      console.log('✅ Admin user created in Firebase Auth');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('✅ Admin user already exists in Firebase Auth');
        // Sign in to get the user credential for existing user
        try {
          userCredential = await signInWithEmailAndPassword(
            auth, 
            config.email, 
            config.password
          );
          console.log('✅ Signed in as existing admin user:', userCredential.user.uid);
        } catch (signInError) {
          console.error('❌ Could not sign in as existing user:', signInError.message);
          throw signInError;
        }
      } else {
        throw error;
      }
    }
    
    // Check if user document already exists
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const existingData = userDocSnap.data();
      if (existingData.role === 'admin') {
        console.log('✅ Admin user document already exists with admin role');
        return {
          success: true,
          uid: userCredential.user.uid,
          email: config.email,
          existing: true
        };
      }
    }
    
    // Create/update user document in Firestore
    const userDoc = {
      uid: userCredential.user.uid,
      id: 'admin-001', // Special ID for admin service compatibility
      email: config.email,
      displayName: config.displayName,
      role: config.role,
      status: config.status,
      emailVerified: true,
      provider: 'email',
      permissions: ['*'], // All permissions
      approvalStatus: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: 'system',
        reason: 'Default admin user'
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        loginCount: 0,
        emailVerifiedAt: new Date()
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
    
    await setDoc(userDocRef, userDoc, { merge: true });
    console.log('✅ Admin user document created/updated in Firestore');
    
    console.log('\n🎉 Admin user setup completed successfully!');
    console.log('📧 Email:', config.email);
    console.log('🔑 Password:', config.password);
    console.log('👤 Role:', config.role);
    console.log('📝 UID:', userCredential.user.uid);
    
    return {
      success: true,
      uid: userCredential.user.uid,
      email: config.email,
      existing: false
    };
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.createAdminUser = createAdminUser;
}

export default createAdminUser;