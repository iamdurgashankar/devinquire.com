// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
  clearIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence
} from 'firebase/firestore';
import { 
  getDatabase,
  connectDatabaseEmulator,
  goOffline,
  goOnline
} from 'firebase/database';
import { 
  getFunctions, 
  connectFunctionsEmulator,
  httpsCallable
} from 'firebase/functions';
import { 
  getStorage, 
  connectStorageEmulator
} from 'firebase/storage';
import { 
  getAnalytics,
  isSupported as isAnalyticsSupported
} from 'firebase/analytics';
import { 
  getMessaging,
  isSupported as isMessagingSupported,
  getToken,
  onMessage
} from 'firebase/messaging';
import { 
  getPerformance
} from 'firebase/performance';

// Firebase configuration object
// These values should be set in your .env file
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL
};

// Validate required configuration
const requiredConfig = ['apiKey', 'authDomain', 'projectId'];
const missingConfig = requiredConfig.filter(key => !firebaseConfig[key]);
const placeholderConfig = requiredConfig.filter(key => 
  firebaseConfig[key] && (
    firebaseConfig[key].includes('your-') || 
    firebaseConfig[key].includes('AIzaSyDummy') ||
    firebaseConfig[key] === 'your_project_id' ||
    firebaseConfig[key] === 'your-project-id'
  )
);

// Check for missing configuration
if (missingConfig.length > 0) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Missing Firebase configuration:', missingConfig);
    console.warn('📝 The application will run with limited functionality. Please set up Firebase configuration.');
  } else {
    console.error('Missing required Firebase configuration:', missingConfig);
    throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`);
  }
}

// Check for placeholder values
if (placeholderConfig.length > 0) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('🔧 Firebase configuration contains placeholder values:', placeholderConfig);
    console.warn('📋 To enable full Firebase functionality:');
    console.warn('   1. Go to https://console.firebase.google.com/');
    console.warn('   2. Create or select your Firebase project');
    console.warn('   3. Go to Project Settings > General > Your apps');
    console.warn('   4. Copy the configuration and update your .env file');
    console.warn('   5. Restart the development server');
  } else {
    console.error('Firebase configuration contains placeholder values:', placeholderConfig);
    throw new Error(`Invalid Firebase configuration: ${placeholderConfig.join(', ')} contain placeholder values`);
  }
}

// Determine if Firebase should be initialized
const shouldInitializeFirebase = missingConfig.length === 0 && placeholderConfig.length === 0;

// Initialize Firebase app conditionally
let app = null;
let auth = null;
let db = null;
let realtimeDb = null;
let functions = null;
let storage = null;

if (shouldInitializeFirebase) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    realtimeDb = getDatabase(app);
    functions = getFunctions(app);
    storage = getStorage(app);
    console.log('✅ Firebase services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
} else {
  console.warn('⚠️ Firebase services not initialized due to configuration issues');
  console.warn('📱 Application will run in fallback mode with limited functionality');
}

// Export Firebase services (may be null if not initialized)
export { app, auth, db, realtimeDb, functions, storage };

// Initialize optional services
let analytics = null;
let messaging = null;
let performance = null;

// Initialize optional services only if Firebase is properly initialized
if (app && shouldInitializeFirebase) {
  // Initialize Analytics (only in production and if supported)
  if (process.env.NODE_ENV === 'production') {
    isAnalyticsSupported().then(supported => {
      if (supported && firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
      }
    }).catch(error => {
      console.warn('Analytics initialization failed:', error);
    });
  }

  // Initialize Messaging (if supported)
  if (typeof window !== 'undefined') {
    isMessagingSupported().then(supported => {
      if (supported) {
        messaging = getMessaging(app);
      }
    }).catch(error => {
      console.warn('Messaging initialization failed:', error);
    });
  }

  // Initialize Performance Monitoring (only in production)
  if (process.env.NODE_ENV === 'production') {
    try {
      performance = getPerformance(app);
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }
}

// Export optional services
export { analytics, messaging, performance };

// Configure Firebase services
const configureFirebase = async () => {
  if (!shouldInitializeFirebase || !auth || !db) {
    console.warn('Skipping Firebase configuration - services not initialized');
    return;
  }

  try {
    // Set authentication persistence
    await setPersistence(auth, browserLocalPersistence);
    
    // Enable Firestore offline persistence
    if (process.env.REACT_APP_ENABLE_OFFLINE_PERSISTENCE !== 'false') {
      try {
        await enableMultiTabIndexedDbPersistence(db);
        console.log('Firestore offline persistence enabled');
      } catch (error) {
        if (error.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (error.code === 'unimplemented') {
          console.warn('The current browser does not support offline persistence.');
        } else {
          console.error('Error enabling offline persistence:', error);
        }
      }
    }
    
    console.log('Firebase services configured successfully');
  } catch (error) {
    console.error('Error configuring Firebase services:', error);
  }
};

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIREBASE_EMULATORS === 'true' && shouldInitializeFirebase) {
  const EMULATOR_HOST = process.env.REACT_APP_EMULATOR_HOST || 'localhost';
  
  try {
    // Auth emulator
    if (auth && !auth._delegate._config.emulator) {
      connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
      console.log('Connected to Auth emulator');
    }
    
    // Firestore emulator
    if (db && !db._delegate._databaseId.projectId.includes('demo-')) {
      connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
      console.log('Connected to Firestore emulator');
    }
    
    // Realtime Database emulator
    if (realtimeDb && !realtimeDb._delegate._repoInternal.repoInfo_.host.includes('localhost')) {
      connectDatabaseEmulator(realtimeDb, EMULATOR_HOST, 9000);
      console.log('Connected to Realtime Database emulator');
    }
    
    // Functions emulator
    if (functions && !functions._delegate._url) {
      connectFunctionsEmulator(functions, EMULATOR_HOST, 5001);
      console.log('Connected to Functions emulator');
    }
    
    // Storage emulator
    if (storage && !storage._delegate._host.includes('localhost')) {
      connectStorageEmulator(storage, EMULATOR_HOST, 9199);
      console.log('Connected to Storage emulator');
    }
    
    console.log('All Firebase emulators connected successfully');
  } catch (error) {
    console.error('Error connecting to Firebase emulators:', error);
  }
}

// Firebase utility functions
export const firebaseUtils = {
  // Check if Firebase is initialized
  isInitialized: () => shouldInitializeFirebase && !!app,
  
  // Network management
  enableFirestoreNetwork: () => db ? enableNetwork(db) : Promise.resolve(),
  disableFirestoreNetwork: () => db ? disableNetwork(db) : Promise.resolve(),
  goRealtimeOnline: () => realtimeDb ? goOnline(realtimeDb) : undefined,
  goRealtimeOffline: () => realtimeDb ? goOffline(realtimeDb) : undefined,
  
  // Clear offline data
  clearOfflineData: async () => {
    if (!db) {
      console.warn('Cannot clear offline data - Firestore not initialized');
      return;
    }
    
    try {
      await disableNetwork(db);
      await clearIndexedDbPersistence(db);
      await enableNetwork(db);
      console.log('Offline data cleared successfully');
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  },
  
  // Get FCM token
  getFCMToken: async () => {
    if (!messaging) {
      console.warn('Cannot get FCM token - Messaging not initialized');
      return null;
    }
    
    try {
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },
  
  // Listen for FCM messages
  onFCMMessage: (callback) => {
    if (!messaging) {
      console.warn('Cannot listen for FCM messages - Messaging not initialized');
      return () => {};
    }
    
    return onMessage(messaging, callback);
  },
  
  // Call Firebase function
  callFunction: (functionName, data = {}) => {
    if (!functions) {
      console.warn('Cannot call Firebase function - Functions not initialized');
      return Promise.reject(new Error('Firebase Functions not initialized'));
    }
    
    const callable = httpsCallable(functions, functionName);
    return callable(data);
  },
  
  // Check if user is authenticated
  getCurrentUser: () => {
    return new Promise((resolve) => {
      if (!auth) {
        console.warn('Cannot get current user - Auth not initialized');
        resolve(null);
        return;
      }
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  },
  
  // Get app configuration
  getConfig: () => ({
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    isEmulator: process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIREBASE_EMULATORS === 'true',
    environment: process.env.NODE_ENV
  })
};

// Initialize Firebase configuration
configureFirebase();

// Connection state monitoring
let isOnline = navigator.onLine;

window.addEventListener('online', () => {
  isOnline = true;
  console.log('Network connection restored');
  if (db) {
    firebaseUtils.enableFirestoreNetwork().catch(console.error);
  }
  if (realtimeDb) {
    firebaseUtils.goRealtimeOnline();
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('Network connection lost');
  if (realtimeDb) {
    firebaseUtils.goRealtimeOffline();
  }
});

// Export connection state
export const getConnectionState = () => isOnline;

// Export Firebase app instance
export default app;

// Add utility function to check if Firebase is configured
export const isFirebaseConfigured = () => shouldInitializeFirebase && !!app;

// Development helpers
if (process.env.NODE_ENV === 'development') {
  window.firebase = {
    app,
    auth,
    db,
    realtimeDb,
    functions,
    storage,
    analytics,
    messaging,
    performance,
    utils: firebaseUtils,
    isConfigured: isFirebaseConfigured
  };
  
  console.log('🔥 Firebase Configuration Status:', {
    configured: shouldInitializeFirebase,
    app: !!app,
    auth: !!auth,
    firestore: !!db,
    realtimeDatabase: !!realtimeDb,
    functions: !!functions,
    storage: !!storage,
    analytics: !!analytics,
    messaging: !!messaging,
    performance: !!performance,
    emulators: process.env.REACT_APP_USE_FIREBASE_EMULATORS === 'true'
  });
  
  if (!shouldInitializeFirebase) {
    console.log('🚀 Quick Setup Guide:');
    console.log('   1. Copy .env.example to .env');
    console.log('   2. Update Firebase configuration values');
    console.log('   3. Restart development server');
    console.log('   4. See FIREBASE_SETUP_README.md for detailed instructions');
  }
}