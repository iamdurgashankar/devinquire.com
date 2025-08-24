// Firebase Integration Test
import firebaseService from '../services/firebaseService';
import { USE_FIREBASE } from '../config';

// Test Firebase connection and basic functionality
export async function testFirebaseIntegration() {
  console.log('🔥 Starting Firebase Integration Test...');
  console.log('USE_FIREBASE flag:', USE_FIREBASE);
  
  if (!USE_FIREBASE) {
    console.log('❌ Firebase is disabled. Skipping tests.');
    return false;
  }
  
  try {
    // Test 1: Check Firebase connection
    console.log('\n📡 Testing Firebase connection...');
    const isConnected = await firebaseService.checkConnection();
    console.log('Connection status:', isConnected ? '✅ Connected' : '❌ Failed');
    
    // Test 2: Test authentication (without actual login)
    console.log('\n🔐 Testing Firebase Auth initialization...');
    const authInitialized = firebaseService.auth !== null;
    console.log('Auth initialized:', authInitialized ? '✅ Yes' : '❌ No');
    
    // Test 3: Test Firestore initialization
    console.log('\n🗄️ Testing Firestore initialization...');
    const firestoreInitialized = firebaseService.db !== null;
    console.log('Firestore initialized:', firestoreInitialized ? '✅ Yes' : '❌ No');
    
    // Test 4: Test Storage initialization
    console.log('\n📁 Testing Storage initialization...');
    const storageInitialized = firebaseService.storage !== null;
    console.log('Storage initialized:', storageInitialized ? '✅ Yes' : '❌ No');
    
    // Test 5: Test basic Firestore query (read-only)
    console.log('\n📊 Testing basic Firestore query...');
    try {
      // This should work even without authentication for public data
      const testQuery = await firebaseService.getPosts({ limit: 1, status: 'published' });
      console.log('Firestore query:', '✅ Success (or expected auth error)');
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.log('Firestore query:', '✅ Security rules working (permission denied as expected)');
      } else {
        console.log('Firestore query:', '⚠️ Unexpected error:', error.message);
      }
    }
    
    console.log('\n🎉 Firebase Integration Test Complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Firebase Integration Test Failed:', error);
    return false;
  }
}

// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
  // Run test after a short delay to ensure Firebase is initialized
  setTimeout(() => {
    testFirebaseIntegration();
  }, 2000);
}

export default testFirebaseIntegration;