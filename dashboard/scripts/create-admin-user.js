#!/usr/bin/env node

/**
 * Script to create the default admin user using Firebase client SDK
 * This ensures the admin can log in with the specified credentials
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArdCvkX7bDdp0EtwiFmvqOotkcQuY-cYY",
  authDomain: "devinquirecom.firebaseapp.com",
  projectId: "devinquirecom",
  storageBucket: "devinquirecom.appspot.com",
  messagingSenderId: "358963756608",
  appId: "1:358963756608:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators if running locally
if (process.env.NODE_ENV !== 'production') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.log('Emulators not available, using production Firebase');
  }
}

// Admin user configuration
const ADMIN_CONFIG = {
  email: 'admin@devinquire.com',
  password: '8763155488SIpu@',
  displayName: 'System Administrator',
  role: 'SUPER_ADMIN',
  status: 'active'
};

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...');
    
    // Create user with Firebase Auth client SDK
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, ADMIN_CONFIG.email, ADMIN_CONFIG.password);
      console.log('✅ Admin user created in Firebase Auth');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('✅ Admin user already exists in Firebase Auth');
        // Sign in to get the user credential for existing user
        const { signInWithEmailAndPassword } = require('firebase/auth');
        try {
          userCredential = await signInWithEmailAndPassword(auth, ADMIN_CONFIG.email, ADMIN_CONFIG.password);
          console.log('✅ Signed in as existing admin user:', userCredential.user.uid);
        } catch (signInError) {
          console.error('❌ Could not sign in as existing user:', signInError.message);
          return { success: false, error: signInError.message };
        }
      } else {
        throw error;
      }
    }

    // Create/update user document in Firestore
    const userDoc = {
      uid: userCredential.user.uid,
      email: ADMIN_CONFIG.email,
      displayName: ADMIN_CONFIG.displayName,
      role: ADMIN_CONFIG.role,
      status: ADMIN_CONFIG.status,
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

    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc, { merge: true });
    console.log('✅ Admin user document created/updated in Firestore');

    console.log('\n🎉 Admin user setup completed successfully!');
    console.log('📧 Email:', ADMIN_CONFIG.email);
    console.log('🔑 Password:', ADMIN_CONFIG.password);
    console.log('👤 Role:', ADMIN_CONFIG.role);
    console.log('📝 UID:', userCredential.user.uid);
    
    return {
      success: true,
      uid: userCredential.user.uid,
      email: ADMIN_CONFIG.email
    };
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createAdminUser };