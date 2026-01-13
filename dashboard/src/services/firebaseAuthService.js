/**
 * Firebase Authentication Service
 * Comprehensive authentication service supporting email, Google, and GitHub login
 * Enhanced with security features: rate limiting, retry logic, and audit logging
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  deleteUser,
  onAuthStateChanged,
  linkWithCredential,
  unlink,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";

import {
  auth as authImport,
  AUTH_PROVIDERS,
  AUTH_CONFIG,
  isFirebaseConfigured,
  getFirebaseErrorMessage,
  getAuthInstance,
} from "../config/firebase";

import SecurityConfig from "../config/security";
import { checkRateLimit } from "../utils/auth/validation";

// Security constants
const SECURITY_CONSTANTS = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  MAX_OPERATIONS_PER_MINUTE: SecurityConfig.MAX_LOGIN_ATTEMPTS,
  AUDIT_LOG_ENABLED: SecurityConfig.PRODUCTION_SECURITY.auditLogging,
};

class FirebaseAuthService {
  constructor() {
    this.auth = null; // Will be set in initialize()
    this.currentUser = null;
    this.authStateListeners = new Set();
    this.isInitialized = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000;

    // Performance monitoring
    this.operationMetrics = new Map();
    this.enableMetrics = process.env.NODE_ENV === "development";

    // Rate limiting for auth operations
    this.rateLimiter = new Map();
    this.maxOperationsPerMinute = 10;

    // Initialize service if Firebase is configured
    if (isFirebaseConfigured()) {
      this.initialize();
    } else {
      console.warn(
        "Firebase not configured - Authentication service running in limited mode"
      );
    }
  }

  /**
   * Initialize the authentication service with enhanced error handling
   */
  async initialize() {
    try {
      // Wait for Firebase to be initialized before getting auth instance
      const { waitForFirebaseInit } = await import("../config/firebase");
      await waitForFirebaseInit();
      
      // Get auth instance using getter function
      this.auth = getAuthInstance();
      
      if (!this.auth) {
        console.error("Firebase auth not available after initialization");
        return;
      }

      console.log("✅ Firebase Auth service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Firebase Auth service:", error);
      return;
    }

    try {
      // Set up auth state listener with error handling
      this.unsubscribeAuthState = onAuthStateChanged(
        this.auth,
        (user) => {
          this.currentUser = user;
          this.notifyAuthStateListeners(user);

          // Track authentication events
          if (this.enableMetrics && typeof this.trackOperation === 'function') {
            this.trackOperation("auth_state_change", Date.now());
          }
        },
        (error) => {
          console.error("Auth state change error:", error);
          this.handleAuthError(error, "auth_state_listener");
        }
      );

      // Set up connection monitoring
      this.setupConnectionMonitoring();

      this.isInitialized = true;
      console.log("Firebase Auth Service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Firebase Auth Service:", error);
      throw error;
    }
  }

  /**
   * Set up connection monitoring for network status
   */
  setupConnectionMonitoring() {
    if (typeof window !== "undefined") {
      const handleOnline = () => {
        console.log("Connection restored - Firebase Auth Service online");
      };

      const handleOffline = () => {
        console.warn("Connection lost - Firebase Auth Service offline");
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Store references for cleanup
      this.connectionHandlers = { handleOnline, handleOffline };
    }
  }

  /**
   * Track operation metrics for performance monitoring
   */
  trackOperation(operation, startTime, metadata = {}) {
    if (!this.enableMetrics) return;
    
    const duration = Date.now() - startTime;
    
    if (!this.operationMetrics.has(operation)) {
      this.operationMetrics.set(operation, []);
    }
    
    this.operationMetrics.get(operation).push({
      timestamp: startTime,
      duration,
      metadata
    });
    
    // Keep only last 100 entries per operation
    const entries = this.operationMetrics.get(operation);
    if (entries.length > 100) {
      entries.splice(0, entries.length - 100);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    if (!this.enableMetrics) return {};
    
    const metrics = {};
    
    for (const [operation, entries] of this.operationMetrics) {
      const durations = entries.map(e => e.duration);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      
      metrics[operation] = {
        count: entries.length,
        avgDuration: Math.round(avgDuration),
        lastOperation: entries[entries.length - 1]?.timestamp
      };
    }
    
    return metrics;
  }

  /**
   * Handle authentication errors with retry logic
   */
  async handleAuthError(error, operation) {
    console.error(`Auth error in ${operation}:`, error);
    
    // Log audit trail if enabled
    if (SECURITY_CONSTANTS.AUDIT_LOG_ENABLED) {
      console.log(`[AUDIT] Auth operation failed: ${operation}, Error: ${error.code}`);
    }
    
    // Determine if retry is appropriate
    const retryableErrors = [
      'auth/network-request-failed',
      'auth/timeout',
      'auth/internal-error'
    ];
    
    const shouldRetry = retryableErrors.includes(error.code) && 
                       this.retryAttempts < SECURITY_CONSTANTS.MAX_RETRY_ATTEMPTS;
    
    if (shouldRetry) {
      this.retryAttempts++;
      const delay = SECURITY_CONSTANTS.RETRY_DELAY_BASE * Math.pow(2, this.retryAttempts - 1);
      
      console.log(`Retrying ${operation} in ${delay}ms (attempt ${this.retryAttempts}/${SECURITY_CONSTANTS.MAX_RETRY_ATTEMPTS})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return { shouldRetry: true };
    }
    
    // Reset retry attempts for non-retryable errors
    this.retryAttempts = 0;
    
    return { shouldRetry: false };
  }

  /**
   * Check if Firebase is available and configured
   */
  isAvailable() {
    return isFirebaseConfigured() && this.auth !== null;
  }

  /**
   * Add auth state change listener
   */
  onAuthStateChange(callback) {
    this.authStateListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(callback);
    };
  }

  /**
   * Notify all auth state listeners
   */
  notifyAuthStateListeners(user) {
    this.authStateListeners.forEach((callback) => {
      try {
        callback(user);
      } catch (error) {
        console.error("Auth state listener error:", error);
      }
    });
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get current user's ID token
   */
  async getIdToken(forceRefresh = false) {
    if (!this.currentUser) {
      throw new Error("No authenticated user");
    }

    try {
      return await this.currentUser.getIdToken(forceRefresh);
    } catch (error) {
      console.error("Failed to get ID token:", error);
      throw new Error("Failed to get authentication token");
    }
  }

  /**
   * Sign in with email and password with enhanced error handling
   */
  async signInWithEmail(email, password) {
    if (!this.isAvailable()) {
      throw new Error("Firebase authentication not available");
    }

    const startTime = Date.now();

    try {
      // Check rate limiting
      const rateLimitResult = checkRateLimit("email_signin");
      if (rateLimitResult.exceeded) {
        throw new Error(`Rate limit exceeded. Try again after ${new Date(rateLimitResult.resetTime).toLocaleTimeString()}`);
      }

      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;

      // Track successful operation
      if (this.enableMetrics) {
        this.trackOperation("email_signin_success", startTime);
      }

      // Reset retry attempts on success
      this.retryAttempts = 0;

      return {
        success: true,
        user: this.formatUser(user),
        needsEmailVerification:
          !user.emailVerified && AUTH_CONFIG.email.requireEmailVerification,
      };
    } catch (error) {
      // Handle authentication errors with retry logic
      const retryInfo = await this.handleAuthError(error, "email_signin");

      if (retryInfo.shouldRetry) {
        return this.signInWithEmail(email, password);
      }

      // Track failed operation
      if (this.enableMetrics) {
        this.trackOperation("email_signin_error", startTime, {
          error: error.code,
        });
      }

      throw new Error(getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Create account with email and password with enhanced validation
   */
  async createAccountWithEmail(email, password, displayName = "") {
    if (!this.isAvailable()) {
      throw new Error("Firebase authentication not available");
    }

    const startTime = Date.now();

    try {
      // Check rate limiting
      const rateLimitResult = checkRateLimit("email_signup");
      if (rateLimitResult.exceeded) {
        throw new Error(`Rate limit exceeded. Try again after ${new Date(rateLimitResult.resetTime).toLocaleTimeString()}`);
      }

      // Validate password strength
      if (password.length < AUTH_CONFIG.email.passwordRequirements.minLength) {
        throw new Error(
          `Password must be at least ${AUTH_CONFIG.email.passwordRequirements.minLength} characters long`
        );
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update profile with display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Send email verification if required
      if (AUTH_CONFIG.email.requireEmailVerification) {
        await this.sendEmailVerification();
      }

      // Track successful operation
      if (this.enableMetrics) {
        this.trackOperation("email_signup_success", startTime);
      }

      // Reset retry attempts on success
      this.retryAttempts = 0;

      return {
        success: true,
        user: this.formatUser(user),
        needsEmailVerification: AUTH_CONFIG.email.requireEmailVerification,
      };
    } catch (error) {
      // Handle authentication errors with retry logic
      const retryInfo = await this.handleAuthError(error, "email_signup");

      if (retryInfo.shouldRetry) {
        return this.createAccountWithEmail(email, password, displayName);
      }

      // Track failed operation
      if (this.enableMetrics) {
        this.trackOperation("email_signup_error", startTime, {
          error: error.code,
        });
      }

      throw new Error(getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Sign in with Google (popup method)
   */
  async signInWithGoogle(useRedirect = false) {
    if (!this.isAvailable()) {
      throw new Error("Firebase authentication not available");
    }

    try {
      const provider = AUTH_PROVIDERS.google.provider;
      let userCredential;

      if (useRedirect) {
        await signInWithRedirect(this.auth, provider);
        // Result will be handled by getRedirectResult
        return { success: true, redirecting: true };
      } else {
        userCredential = await signInWithPopup(this.auth, provider);
      }

      const user = userCredential.user;
      const credential =
        GoogleAuthProvider.credentialFromResult(userCredential);

      return {
        success: true,
        user: this.formatUser(user),
        credential,
        isNewUser:
          userCredential.operationType === "signIn" &&
          userCredential.additionalUserInfo?.isNewUser,
      };
    } catch (error) {
      console.error("Google sign-in error:", error);

      // Handle specific popup errors
      if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Authentication was cancelled");
      } else if (error.code === "auth/popup-blocked") {
        throw new Error("Popup was blocked. Please allow popups and try again");
      }

      throw new Error(getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Sign in with GitHub (popup method)
   */
  async signInWithGitHub(useRedirect = false) {
    if (!this.isAvailable()) {
      throw new Error("Firebase authentication not available");
    }

    try {
      const provider = AUTH_PROVIDERS.github.provider;
      let userCredential;

      if (useRedirect) {
        await signInWithRedirect(this.auth, provider);
        // Result will be handled by getRedirectResult
        return { success: true, redirecting: true };
      } else {
        userCredential = await signInWithPopup(this.auth, provider);
      }

      const user = userCredential.user;
      const credential =
        GithubAuthProvider.credentialFromResult(userCredential);

      return {
        success: true,
        user: this.formatUser(user),
        credential,
        isNewUser:
          userCredential.operationType === "signIn" &&
          userCredential.additionalUserInfo?.isNewUser,
      };
    } catch (error) {
      console.error("GitHub sign-in error:", error);

      // Handle specific popup errors
      if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Authentication was cancelled");
      } else if (error.code === "auth/popup-blocked") {
        throw new Error("Popup was blocked. Please allow popups and try again");
      }

      throw new Error(getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Handle redirect result for OAuth providers
   */
  async handleRedirectResult() {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const result = await getRedirectResult(this.auth);

      if (result) {
        const user = result.user;
        const providerId = result.providerId;

        return {
          success: true,
          user: this.formatUser(user),
          provider: providerId,
          isNewUser: result.additionalUserInfo?.isNewUser,
        };
      }

      return null;
    } catch (error) {
      console.error("Redirect result error:", error);
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    if (!this.isAvailable()) {
        // Clear any local storage if Firebase not available
        try {
          const { default: sessionManagementService } = await import('./sessionManagementService');
          sessionManagementService.clearSessionData();
        } catch (error) {
          // Fallback to direct removal if session service unavailable
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");
        }
        return { success: true };
      }

    try {
      await signOut(this.auth);
      this.currentUser = null;

      // Clear local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");

      return { success: true };
    } catch (error) {
      console.error("Sign out error:", error);
      throw new Error("Failed to sign out");
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email) {
    if (!this.isAvailable()) {
      throw new Error("Firebase authentication not available");
    }

    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Send email verification to current user
   */
  async sendEmailVerification() {
    if (!this.currentUser) {
      throw new Error("No authenticated user");
    }

    try {
      await sendEmailVerification(this.currentUser);
      return { success: true };
    } catch (error) {
      console.error("Email verification error:", error);
      throw new Error("Failed to send verification email");
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(currentPassword, newPassword) {
    if (!this.currentUser) {
      throw new Error("No authenticated user");
    }

    try {
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(
        this.currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(this.currentUser, credential);
      await updatePassword(this.currentUser, newPassword);

      return { success: true };
    } catch (error) {
      console.error("Password update error:", error);
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData) {
    if (!this.currentUser) {
      throw new Error("No authenticated user");
    }

    try {
      await updateProfile(this.currentUser, profileData);
      return {
        success: true,
        user: this.formatUser(this.currentUser),
      };
    } catch (error) {
      console.error("Profile update error:", error);
      throw new Error("Failed to update profile");
    }
  }

  /**
   * Link OAuth provider to current account
   */
  async linkProvider(providerName) {
    if (!this.currentUser) {
      throw new Error("No authenticated user");
    }

    try {
      const provider = AUTH_PROVIDERS[providerName]?.provider;
      if (!provider) {
        throw new Error(`Unknown provider: ${providerName}`);
      }

      const result = await linkWithCredential(this.currentUser, provider);
      return {
        success: true,
        user: this.formatUser(result.user),
      };
    } catch (error) {
      console.error("Provider linking error:", error);
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Unlink OAuth provider from current account
   */
  async unlinkProvider(providerId) {
    if (!this.currentUser) {
      throw new Error("No authenticated user");
    }

    try {
      const result = await unlink(this.currentUser, providerId);
      return {
        success: true,
        user: this.formatUser(result),
      };
    } catch (error) {
      console.error("Provider unlinking error:", error);
      throw new Error("Failed to unlink provider");
    }
  }

  /**
   * Delete current user account
   */
  async deleteAccount(password = null) {
    if (!this.currentUser) {
      throw new Error("No authenticated user");
    }

    try {
      // Re-authenticate if password provided
      if (password && this.currentUser.email) {
        const credential = EmailAuthProvider.credential(
          this.currentUser.email,
          password
        );
        await reauthenticateWithCredential(this.currentUser, credential);
      }

      await deleteUser(this.currentUser);
      this.currentUser = null;

      return { success: true };
    } catch (error) {
      console.error("Account deletion error:", error);
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Format Firebase user object for consistent usage
   */
  formatUser(firebaseUser) {
    if (!firebaseUser) return null;

    // Get provider information
    const providers = firebaseUser.providerData.map((provider) => ({
      providerId: provider.providerId,
      uid: provider.uid,
      email: provider.email,
      displayName: provider.displayName,
      photoURL: provider.photoURL,
    }));

    // Determine primary provider
    const primaryProvider = providers.length > 0 ? providers[0] : null;
    const providerName =
      primaryProvider?.providerId?.replace(".com", "") || "email";

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      phoneNumber: firebaseUser.phoneNumber,
      provider: providerName,
      providers: providers,
      isAnonymous: firebaseUser.isAnonymous,
      metadata: {
        creationTime: firebaseUser.metadata.creationTime,
        lastSignInTime: firebaseUser.metadata.lastSignInTime,
      },
      // Legacy compatibility fields
      id: firebaseUser.uid,
      name: firebaseUser.displayName,
      role: "user", // Default role, can be customized
      status: "active",
    };
  }

  /**
   * Check if user has specific provider linked
   */
  hasProvider(providerId) {
    if (!this.currentUser) return false;

    return this.currentUser.providerData.some(
      (provider) => provider.providerId === providerId
    );
  }

  /**
   * Get user's linked providers
   */
  getLinkedProviders() {
    if (!this.currentUser) return [];

    return this.currentUser.providerData.map((provider) => provider.providerId);
  }

  /**
   * Enhanced service status and diagnostics
   */
  getServiceStatus() {
    return {
      available: this.isAvailable(),
      initialized: this.isInitialized,
      currentUser: !!this.currentUser,
      retryAttempts: this.retryAttempts,
      listenersCount: this.authStateListeners.size,
      metrics: this.getMetrics(),
      rateLimit: {
        operationsPerMinute: this.maxOperationsPerMinute,
        currentWindows: Object.fromEntries(this.rateLimiter),
      },
    };
  }

  /**
   * Clear metrics and reset rate limiting
   */
  reset() {
    this.operationMetrics.clear();
    this.rateLimiter.clear();
    this.retryAttempts = 0;
    console.log("Firebase Auth Service reset");
  }

  /**
   * Cleanup service with enhanced cleanup
   */
  destroy() {
    if (this.unsubscribeAuthState) {
      this.unsubscribeAuthState();
    }
    this.authStateListeners.clear();
    this.operationMetrics.clear();
    this.rateLimiter.clear();

    // Remove event listeners if in browser environment
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.setupConnectionMonitoring);
      window.removeEventListener("offline", this.setupConnectionMonitoring);
    }

    console.log("Firebase Auth Service destroyed");
  }
}

// Create and export singleton instance
const firebaseAuthService = new FirebaseAuthService();

// Export the getCurrentUser method as a named export for convenience
export const getCurrentUser = () => firebaseAuthService.getCurrentUser();

export default firebaseAuthService;
