/**
 * Enhanced Firebase Configuration for Complete Backend Solution
 * Includes Authentication, Firestore Database, Storage, Functions, and Analytics
 * Supports email, Google, and GitHub authentication with fallback handling
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
  GoogleAuthProvider,
  GithubAuthProvider,
  EmailAuthProvider,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";

// Environment variables helper
const getEnvVar = (name, defaultValue = "") => {
  const value = process.env[name] || defaultValue;
  
  // Debug logging for environment variables
  console.log(`🔍 Environment Variable ${name}:`, {
    raw: process.env[name],
    value: value,
    hasValue: !!value,
    length: value ? value.length : 0
  });
  
  if (!value && process.env.NODE_ENV === "production") {
    console.warn(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Firebase configuration object
const firebaseConfig = {
  apiKey: getEnvVar("REACT_APP_FIREBASE_API_KEY"),
  authDomain: getEnvVar("REACT_APP_FIREBASE_AUTH_DOMAIN"),
  databaseURL: getEnvVar("REACT_APP_FIREBASE_DATABASE_URL"),
  projectId: getEnvVar("REACT_APP_FIREBASE_PROJECT_ID"),
  storageBucket: getEnvVar("REACT_APP_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnvVar("REACT_APP_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnvVar("REACT_APP_FIREBASE_APP_ID"),
  measurementId: getEnvVar("REACT_APP_FIREBASE_MEASUREMENT_ID"), // Optional for Analytics
};

// Debug: Log the complete configuration
console.log("🔥 Complete Firebase Configuration:", firebaseConfig);
console.log("🔍 Configuration validation check:");
Object.entries(firebaseConfig).forEach(([key, value]) => {
  console.log(`  ${key}: ${value ? '✅ SET' : '❌ MISSING'} (${typeof value})`);
});

// Enhanced Firebase configuration validation
const validateFirebaseConfig = () => {
  console.log("🔍 Validating Firebase configuration...");
  console.log("Raw config object:", firebaseConfig);
  
  const requiredFields = [
    "apiKey",
    "authDomain", 
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  const errors = [];
  const warnings = [];

  // Debug: Log the actual config values
  console.log("🔍 Firebase Config Debug:", {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    storageBucket: firebaseConfig.storageBucket || 'MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING',
    appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 15)}...` : 'MISSING'
  });

  // Check required fields - simplified validation
  requiredFields.forEach((field) => {
    const value = firebaseConfig[field];
    const hasField = value && value.trim() !== "" && value !== "undefined" && value !== "null";
    console.log(`Field ${field}: ${hasField ? "✅ Present" : "❌ Missing"} (value: "${value}")`);
    
    if (!hasField) {
      errors.push(`Missing ${field} in Firebase configuration`);
    }
  });

  // Log results
  if (errors.length > 0) {
    console.error("❌ Firebase Configuration Errors:", { errors, warnings, config: firebaseConfig });
    return { isValid: false, valid: false, errors, warnings };
  }

  console.log("✅ Firebase configuration validation passed");
  return { isValid: true, valid: true, errors: [], warnings };
};

// Initialize Firebase services with enhanced error handling
let app;
let auth;
let db;
let storage;
let functions;
let analytics;
let isFirebaseInitialized = false;
let isFirebaseReady = false;
let initializationError = null;

// Function to check if Firebase is ready
export const waitForFirebaseInit = () => {
  return new Promise((resolve) => {
    if (isFirebaseReady) {
      resolve();
      return;
    }
    
    const checkReady = () => {
      if (isFirebaseReady) {
        resolve();
      } else {
        setTimeout(checkReady, 100);
      }
    };
    
    checkReady();
  });
};

// Retry configuration for Firebase initialization
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
};

// Exponential backoff utility
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const calculateRetryDelay = (attempt) => {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelay);
};

// Initialize Firebase with retry logic
const initializeFirebaseServices = async (retryAttempt = 0) => {
  try {
    console.log(`🚀 Initializing Firebase services (attempt ${retryAttempt + 1})...`);
    
    // Validate configuration first
    const validation = validateFirebaseConfig();
    console.log("🔍 Firebase validation result:", validation);
    if (!validation.valid) {
      console.error("❌ Firebase configuration validation failed:", validation.errors);
      throw new Error("Firebase configuration validation failed: " + validation.errors.join(", "));
    }

    // Initialize Firebase app
    if (!app) {
      console.log("📱 Initializing Firebase app...");
      app = initializeApp(firebaseConfig);
      console.log("✅ Firebase app initialized successfully");
    }

    // Initialize Authentication with explicit persistence
    if (!auth) {
      console.log("🔐 Initializing Firebase Auth...");
      auth = getAuth(app);
      
      // Set explicit persistence to LOCAL (persists across browser sessions)
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log("✅ Firebase Auth persistence set to LOCAL (persists across sessions)");
      } catch (error) {
        console.warn("⚠️ Failed to set auth persistence (using default):", error);
      }
      
      console.log("✅ Firebase Auth initialized successfully");
    }

    // Initialize Firestore
    if (!db) {
      console.log("🗄️ Initializing Firestore...");
      db = getFirestore(app);
      console.log("✅ Firestore initialized successfully");
    }

    // Initialize Storage
    if (!storage) {
      console.log("📦 Initializing Firebase Storage...");
      storage = getStorage(app);
      console.log("✅ Firebase Storage initialized successfully");
    }

    // Initialize Functions
    if (!functions) {
      console.log("⚡ Initializing Firebase Functions...");
      functions = getFunctions(app);
      console.log("✅ Firebase Functions initialized successfully");
    }

    // Initialize Analytics (optional)
    if (!analytics && firebaseConfig.measurementId && typeof window !== "undefined") {
      try {
        console.log("📊 Initializing Firebase Analytics...");
        analytics = getAnalytics(app);
        console.log("✅ Firebase Analytics initialized successfully");
      } catch (analyticsError) {
        console.warn("⚠️ Analytics initialization failed (non-critical):", analyticsError.message);
      }
    }

    // Connect to Firebase emulators in development if configured
    if (
      process.env.NODE_ENV === "development" &&
      process.env.REACT_APP_USE_FIREBASE_EMULATOR === "true"
    ) {
      const emulatorHost =
        process.env.REACT_APP_FIREBASE_EMULATOR_HOST || "localhost";

      try {
        // Connect Auth emulator
        const authEmulatorPort =
          process.env.REACT_APP_FIREBASE_AUTH_EMULATOR_PORT || "9099";
        connectAuthEmulator(
          auth,
          `http://${emulatorHost}:${authEmulatorPort}`,
          {
            disableWarnings: true,
          }
        );
        console.log("Connected to Firebase Auth emulator");
      } catch (error) {
        if (!error.message.includes("already")) {
          console.warn(
            "Failed to connect to Firebase Auth emulator:",
            error.message
          );
        }
      }

      try {
        // Connect Firestore emulator
        const firestoreEmulatorPort =
          process.env.REACT_APP_FIREBASE_FIRESTORE_EMULATOR_PORT || "8080";
        connectFirestoreEmulator(
          db,
          emulatorHost,
          parseInt(firestoreEmulatorPort)
        );
        console.log("Connected to Firestore emulator");
      } catch (error) {
        if (!error.message.includes("already")) {
          console.warn("Failed to connect to Firestore emulator:", error.message);
        }
      }

      try {
        // Connect Storage emulator
        const storageEmulatorPort =
          process.env.REACT_APP_FIREBASE_STORAGE_EMULATOR_PORT || "9199";
        connectStorageEmulator(
          storage,
          emulatorHost,
          parseInt(storageEmulatorPort)
        );
        console.log("Connected to Firebase Storage emulator");
      } catch (error) {
        if (!error.message.includes("already")) {
          console.warn(
            "Failed to connect to Firebase Storage emulator:",
            error.message
          );
        }
      }

      try {
        // Connect Functions emulator
        const functionsEmulatorPort =
          process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_PORT || "5001";
        connectFunctionsEmulator(
          functions,
          emulatorHost,
          parseInt(functionsEmulatorPort)
        );
        console.log("Connected to Firebase Functions emulator");
      } catch (error) {
        if (!error.message.includes("already")) {
          console.warn(
            "Failed to connect to Firebase Functions emulator:",
            error.message
          );
        }
      }
    }

    isFirebaseInitialized = true;
    isFirebaseReady = true;
    initializationError = null;
    
    // Mark Firebase as initialized and ready
    isFirebaseInitialized = true;
    isFirebaseReady = true;
    initializationError = null;
    
    console.log("🎉 All Firebase services initialized successfully!");
    return true;
  } catch (error) {
    initializationError = error;
    console.warn(
      `Firebase initialization failed (attempt ${retryAttempt + 1}/${
        RETRY_CONFIG.maxRetries + 1
      }):`,
      error.message
    );

    // Retry logic for transient failures
    if (
      retryAttempt < RETRY_CONFIG.maxRetries &&
      (error.code === "app/network-request-failed" ||
        error.code === "app/timeout" ||
        error.message.includes("timeout"))
    ) {
      const retryDelay = calculateRetryDelay(retryAttempt);
      console.log(`Retrying Firebase initialization in ${retryDelay}ms...`);
      await delay(retryDelay);
      return initializeFirebaseServices(retryAttempt + 1);
    }

    // Set to null to indicate Firebase is not available
    app = null;
    auth = null;
    db = null;
    storage = null;
    functions = null;
    analytics = null;
    isFirebaseInitialized = false;
    isFirebaseReady = false;

    if (process.env.NODE_ENV === "production") {
      // In production, Firebase failure is critical
      throw error;
    }

    return false;
  }
};

// Initialize Firebase (this will run immediately)
initializeFirebaseServices().then(() => {
  console.log("Firebase initialization completed successfully");
}).catch((error) => {
  console.error("Critical Firebase initialization failure:", error.message);
});

// Configure authentication providers
let googleProvider = null;
let githubProvider = null;

// Wait for Firebase initialization before creating providers
const initializeProviders = () => {
  if (auth && !googleProvider) {
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope("email");
    googleProvider.addScope("profile");
    googleProvider.setCustomParameters({
      prompt: "select_account",
    });

    githubProvider = new GithubAuthProvider();
    githubProvider.addScope("user:email");
    githubProvider.addScope("read:user");
    githubProvider.setCustomParameters({
      allow_signup: "true",
    });
    
    console.log("Firebase auth providers initialized");
  }
};

// Initialize providers after Firebase is ready
if (isFirebaseInitialized) {
  initializeProviders();
} else {
  // Wait for Firebase to initialize
  const checkInitialization = setInterval(() => {
    if (isFirebaseInitialized) {
      initializeProviders();
      clearInterval(checkInitialization);
    }
  }, 100);
}

// Authentication provider configurations
export const AUTH_PROVIDERS = {
  google: {
    provider: googleProvider,
    id: "google.com",
    name: "Google",
    scopes: ["email", "profile"],
    available: !!googleProvider,
  },
  github: {
    provider: githubProvider,
    id: "github.com",
    name: "GitHub",
    scopes: ["user:email", "read:user"],
    available: !!githubProvider,
  },
  email: {
    provider: EmailAuthProvider,
    id: "password",
    name: "Email/Password",
    available: true,
  },
};

// Database configuration
export const DB_CONFIG = {
  // Collection names
  collections: {
    users: "users",
    posts: "posts",
    pages: "pages",
    sessions: "sessions",
    userSessions: "userSessions",
    analytics: "analytics",
    settings: "settings",
    notifications: "notifications",
    adminActions: "adminActions",
    comments: "comments",
    categories: "categories",
    tags: "tags",
    media: "media",
    userPreferences: "userPreferences",
    auditLogs: "auditLogs",
    feedback: "feedback",
    emailTemplates: "emailTemplates",
    systemConfig: "systemConfig",
  },

  // Cache settings
  cache: {
    enableOffline: true,
    cacheSizeBytes: 40 * 1024 * 1024, // 40MB
  },

  // Real-time settings
  realtime: {
    enableRealTimeUpdates: true,
    maxRetries: 3,
    retryDelay: 1000,
  },

  // RBAC settings
  rbac: {
    enableRoleBasedAccess: true,
    requireApproval: process.env.REACT_APP_REQUIRE_USER_APPROVAL === "true",
    defaultRole: "PENDING",
    adminNotifications: true,
    auditLogging: true,
  },
};

// Storage configuration
export const STORAGE_CONFIG = {
  // Storage paths
  paths: {
    userAvatars: "avatars",
    postImages: "posts/images",
    pageAssets: "pages/assets",
    temp: "temp",
  },

  // File upload settings
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    generateThumbnails: true,
  },
};

// Authentication configuration
export const AUTH_CONFIG = {
  // Email authentication settings
  email: {
    requireEmailVerification:
      process.env.REACT_APP_REQUIRE_EMAIL_VERIFICATION === "true",
    allowPasswordReset: true,
    minPasswordLength: 6,
    passwordRequirements: {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
    },
  },

  // OAuth provider settings
  oauth: {
    allowAccountLinking: true,
    autoSignIn: false,
    persistAuth: true,
  },

  // Security settings
  security: {
    enableMFA: false, // Multi-factor authentication
    sessionTimeout: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds (extended from 30)
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
    // Additional session stability settings
    tokenRefreshBuffer: 5 * 60 * 1000, // 5 minutes buffer before token expires
    persistentSessions: true, // Keep sessions across browser restarts
    autoRefreshTokens: true // Automatically refresh tokens in background
  },

  // Role-based access control settings
  rbac: {
    enableRoleBasedAccess: true,
    requireAdminApproval: process.env.REACT_APP_REQUIRE_USER_APPROVAL === "true",
    defaultUserRole: "PENDING",
    allowRoleEscalation: false,
    sessionValidation: true,
    auditUserActions: true,
    notifyAdminsOnRegistration: true,
    autoApproveEmailVerified: false,
    suspendUnverifiedUsers: false,
    roles: {
      SUPER_ADMIN: {
        level: 100,
        permissions: ["*"],
        canAssignRoles: true,
        canDeleteUsers: true,
      },
      ADMIN: {
        level: 80,
        permissions: [
          "users:read", "users:update", "users:suspend",
          "content:read", "content:write", "content:delete", "content:moderate",
          "settings:read", "settings:write",
          "analytics:read"
        ],
        canAssignRoles: ["MODERATOR", "AUTHOR", "USER"],
        canDeleteUsers: false,
      },
      MODERATOR: {
        level: 60,
        permissions: [
          "content:read", "content:write", "content:moderate",
          "users:read", "comments:moderate"
        ],
        canAssignRoles: ["AUTHOR", "USER"],
        canDeleteUsers: false,
      },
      AUTHOR: {
        level: 40,
        permissions: [
          "content:read", "content:write", "content:own",
          "media:upload", "comments:read"
        ],
        canAssignRoles: [],
        canDeleteUsers: false,
      },
      USER: {
        level: 20,
        permissions: [
          "content:read", "comments:read", "comments:write",
          "profile:update"
        ],
        canAssignRoles: [],
        canDeleteUsers: false,
      },
      PENDING: {
        level: 0,
        permissions: [],
        canAssignRoles: [],
        canDeleteUsers: false,
      },
    },
  },

  // UI settings
  ui: {
    signInSuccessUrl: "/dashboard",
    signUpSuccessUrl: "/dashboard",
    errorRedirectUrl: "/login",
    autoUpgradeAnonymousUsers: false,
    showPendingApprovalMessage: true,
    redirectPendingUsers: "/pending-approval",
    redirectSuspendedUsers: "/account-suspended",
  },
};

// Helper function to get database instance safely
export const getDatabase = () => {
  if (!db) {
    throw new Error('Firebase database not initialized. Please wait for Firebase to initialize.');
  }
  return db;
};

// Helper function to check if database is ready
export const isDatabaseReady = () => {
  return db !== null && db !== undefined && isFirebaseInitialized;
};

// Export Firebase instances and utilities
// Export getters instead of direct references to ensure they're available after initialization
export const getApp = () => app;
export const getAuthInstance = () => auth;
export const getDbInstance = () => db;
export const getStorageInstance = () => storage;
export const getFunctionsInstance = () => functions;
export const getAnalyticsInstance = () => analytics;

// Keep direct exports for backward compatibility, but these will be undefined until initialization
export { app, auth, db, storage, functions, analytics, firebaseConfig };
export { GoogleAuthProvider, GithubAuthProvider, EmailAuthProvider };

// Helper functions with enhanced functionality
export const isFirebaseConfigured = () => {
  const validation = validateFirebaseConfig();
  console.log('Firebase Config Check:', {
    validationValid: validation.valid,
    authExists: auth !== null,
    isInitialized: isFirebaseInitialized,
    errors: validation.errors,
    warnings: validation.warnings
  });
  
  // Return true if validation passes - don't require auth/initialization for configuration check
  return validation.valid;
};

export const getFirebaseInitializationStatus = () => {
  return {
    initialized: isFirebaseInitialized,
    error: initializationError,
    available: isFirebaseConfigured(),
    services: {
      app: !!app,
      auth: !!auth,
      firestore: !!db,
      storage: !!storage,
      functions: !!functions,
      analytics: !!analytics,
    },
  };
};

export const isFirebaseOnline = async () => {
  if (!db || !isFirebaseInitialized) return false;

  try {
    // Check network connectivity
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      return false;
    }

    await enableNetwork(db);
    return true;
  } catch (error) {
    console.warn("Firebase offline:", error.message);
    return false;
  }
};

export const setFirebaseOffline = async () => {
  if (!db || !isFirebaseInitialized) return;

  try {
    await disableNetwork(db);
    console.log("Firebase set to offline mode");
  } catch (error) {
    console.warn("Failed to set Firebase offline:", error.message);
  }
};

// Enhanced connection monitoring
export const monitorFirebaseConnection = (callback) => {
  if (!isFirebaseConfigured()) {
    callback({ online: false, error: "Firebase not configured" });
    return () => {}; // Return empty cleanup function
  }

  let isOnline = true;
  let monitoringInterval;

  const checkConnection = async () => {
    try {
      const online = await isFirebaseOnline();
      if (online !== isOnline) {
        isOnline = online;
        callback({ online, timestamp: new Date() });
      }
    } catch (error) {
      if (isOnline) {
        isOnline = false;
        callback({
          online: false,
          error: error.message,
          timestamp: new Date(),
        });
      }
    }
  };

  // Initial check
  checkConnection();

  // Monitor connection every 30 seconds
  monitoringInterval = setInterval(checkConnection, 30000);

  // Return cleanup function
  return () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
  };
};

// Retry Firebase initialization if it failed
export const retryFirebaseInitialization = async () => {
  if (isFirebaseInitialized) {
    console.log("Firebase already initialized");
    return true;
  }

  console.log("Retrying Firebase initialization...");
  return await initializeFirebaseServices();
};

export const getFirebaseErrorMessage = (errorCode) => {
  const errorMessages = {
    "auth/user-not-found": "No account found with this email address.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/email-already-in-use":
      "An account already exists with this email address.",
    "auth/weak-password": "Password should be at least 6 characters long.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests":
      "Too many failed attempts. Please try again later.",
    "auth/network-request-failed":
      "Network error. Please check your connection.",
    "auth/popup-closed-by-user":
      "Authentication popup was closed. Please try again.",
    "auth/popup-blocked":
      "Authentication popup was blocked. Please allow popups.",
    "auth/cancelled-popup-request": "Authentication was cancelled.",
    "auth/account-exists-with-different-credential":
      "An account already exists with the same email but different sign-in credentials.",
    "auth/credential-already-in-use":
      "This credential is already associated with a different user account.",
    "auth/operation-not-allowed": "This authentication method is not enabled.",
    "auth/invalid-credential": "The provided credential is invalid.",
    "auth/timeout": "The operation timed out. Please try again.",
    "auth/missing-email": "Email address is required.",
    "auth/missing-password": "Password is required.",
    "auth/invalid-verification-code": "Invalid verification code.",
    "auth/invalid-verification-id": "Invalid verification ID.",
    "auth/quota-exceeded": "Quota exceeded. Please try again later.",
    // Firestore errors
    "firestore/permission-denied":
      "Permission denied. Please check your access rights.",
    "firestore/unavailable": "Service unavailable. Please try again later.",
    "firestore/resource-exhausted":
      "Resource exhausted. Please try again later.",
    "firestore/unauthenticated": "User not authenticated. Please sign in.",
    "firestore/not-found": "Document not found.",
    "firestore/already-exists": "Document already exists.",
    "firestore/failed-precondition": "Operation failed due to precondition.",
    "firestore/out-of-range": "Value out of range.",
    "firestore/unimplemented": "Operation not implemented.",
    "firestore/internal": "Internal error occurred.",
    "firestore/deadline-exceeded": "Operation deadline exceeded.",
    "firestore/data-loss": "Data loss occurred.",
    "firestore/invalid-argument": "Invalid argument provided.",
    // Storage errors
    "storage/object-not-found": "File not found.",
    "storage/bucket-not-found": "Storage bucket not found.",
    "storage/project-not-found": "Project not found.",
    "storage/quota-exceeded": "Storage quota exceeded.",
    "storage/unauthenticated": "User not authenticated for storage.",
    "storage/unauthorized": "User not authorized for storage operation.",
    "storage/retry-limit-exceeded": "Maximum retry limit exceeded.",
    "storage/invalid-checksum": "File checksum invalid.",
    "storage/canceled": "Operation was canceled.",
    "storage/invalid-event-name": "Invalid event name.",
    "storage/invalid-url": "Invalid URL provided.",
    "storage/invalid-argument": "Invalid argument for storage operation.",
    "storage/no-default-bucket": "No default storage bucket configured.",
    "storage/cannot-slice-blob": "Cannot slice blob.",
    "storage/server-file-wrong-size": "Server file wrong size.",
  };

  return (
    errorMessages[errorCode] ||
    "An unexpected error occurred. Please try again."
  );
};

// Development utilities with enhanced information
export const getFirebaseStatus = () => {
  if (process.env.NODE_ENV === "development") {
    const validation = validateFirebaseConfig();
    const status = getFirebaseInitializationStatus();

    return {
      configured: isFirebaseConfigured(),
      initialized: status.initialized,
      error: status.error?.message,
      app: !!app,
      auth: !!auth,
      firestore: !!db,
      storage: !!storage,
      functions: !!functions,
      analytics: !!analytics,
      providers: Object.keys(AUTH_PROVIDERS).filter(
        (key) => AUTH_PROVIDERS[key].available
      ),
      config: validation.valid ? "Valid" : "Invalid",
      configErrors: validation.errors,
      configWarnings: validation.warnings,
      emulator: process.env.REACT_APP_USE_FIREBASE_EMULATOR === "true",
      collections: DB_CONFIG.collections,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };
  }
  return null;
};

// Enhanced error recovery and diagnostics
export const diagnoseFirebaseIssues = async () => {
  const issues = [];
  const suggestions = [];

  // Check configuration
  const validation = validateFirebaseConfig();
  if (!validation.valid) {
    issues.push("Invalid Firebase configuration");
    suggestions.push(
      "Check your environment variables and Firebase project settings"
    );
  }

  // Check network connectivity
  if (typeof window !== "undefined" && !window.navigator.onLine) {
    issues.push("Network connectivity issues");
    suggestions.push("Check your internet connection");
  }

  // Check Firebase service availability
  const status = getFirebaseInitializationStatus();
  if (!status.initialized && status.error) {
    issues.push(`Firebase initialization failed: ${status.error.message}`);
    suggestions.push(
      "Try refreshing the page or check Firebase service status"
    );
  }

  // Check individual services
  if (status.initialized) {
    if (!status.services.auth) {
      issues.push("Firebase Authentication not available");
      suggestions.push("Check Firebase Authentication configuration");
    }
    if (!status.services.firestore) {
      issues.push("Firestore Database not available");
      suggestions.push("Check Firestore Database configuration");
    }
  }

  return {
    issues,
    suggestions,
    canRetry: !status.initialized && validation.valid,
    status: status,
  };
};

// Automatic recovery mechanism
let recoveryAttempts = 0;
const MAX_RECOVERY_ATTEMPTS = 3;

export const enableAutoRecovery = () => {
  if (typeof window === "undefined") return;

  // Listen for online/offline events
  window.addEventListener("online", async () => {
    console.log("Network connection restored, checking Firebase...");
    if (!isFirebaseInitialized && recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
      recoveryAttempts++;
      try {
        await retryFirebaseInitialization();
        console.log("Firebase auto-recovery successful");
        recoveryAttempts = 0; // Reset on success
      } catch (error) {
        console.warn("Firebase auto-recovery failed:", error.message);
      }
    }
  });

  window.addEventListener("offline", () => {
    console.log("Network connection lost");
  });

  // Check for stale initialization periodically
  setInterval(async () => {
    if (!isFirebaseInitialized && recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
      const isOnline =
        typeof window !== "undefined" ? window.navigator.onLine : true;
      if (isOnline) {
        recoveryAttempts++;
        try {
          await retryFirebaseInitialization();
          recoveryAttempts = 0; // Reset on success
        } catch (error) {
          // Silent failure for background recovery
        }
      }
    }
  }, 60000); // Check every minute
};

// Log configuration status in development with enhanced information
if (process.env.NODE_ENV === "development") {
  const status = getFirebaseStatus();
  console.group("🔥 Firebase Configuration Status");
  console.log("Status:", status);
  if (!status.configured) {
    console.warn(
      "⚠️ Firebase not properly configured. Some features may not work."
    );
    console.log(
      "💡 Copy .env.example to .env.local and fill in your Firebase configuration."
    );
  } else if (status.initialized) {
    console.log("✅ Firebase successfully initialized and ready to use.");
  }
  console.groupEnd();
}

// Enable auto-recovery in supported environments
if (typeof window !== "undefined") {
  enableAutoRecovery();
}
