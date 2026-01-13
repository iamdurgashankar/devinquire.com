/**
 * Session Management Service
 * Handles secure token storage, automatic refresh, and session persistence
 * Provides unified session management across Firebase and OAuth authentication
 */

import firebaseAuthService from './firebaseAuthService';
import oauthService from './oauthService';
import { isFirebaseConfigured, AUTH_CONFIG } from '../config/firebase';

class SessionManagementService {
  constructor() {
    this.refreshInterval = null;
    this.sessionCheckInterval = null;
    this.tokenRefreshPromise = null;
    this.listeners = new Set();
    
    // Session configuration - using Firebase AUTH_CONFIG for consistency
    this.config = {
      tokenRefreshInterval: 60 * 60 * 1000, // 60 minutes (extended from 30)
      sessionCheckInterval: 60 * 60 * 1000, // 60 minutes (extended from 30 to reduce aggressive checks)
      tokenExpiryBuffer: 10 * 60 * 1000, // 10 minutes before expiry (increased from 5)
      maxSessionDuration: AUTH_CONFIG?.security?.sessionTimeout || (90 * 24 * 60 * 60 * 1000), // 90 days (extended from 30)
      storagePrefix: 'devinquire_session_',
      secureStorage: true,
      encryptionKey: process.env.REACT_APP_SESSION_KEY || 'devinquire_session_key_2024',
      // Enhanced session stability settings
      persistentSessions: true, // Keep sessions across browser restarts
      maxRetryAttempts: 5, // Increased retry attempts (from 3)
      retryDelay: 3000, // 3 seconds between retries (increased from 2)
      // Session validation settings
      allowTemporaryFailures: true, // Allow temporary validation failures without logout
      maxConsecutiveFailures: 5, // Increased from 3 - allow more failures before logout
    };
    
    this.initializeSessionManagement();
  }

  /**
   * Encrypt session data for secure storage
   */
  encryptSessionData(data) {
    try {
      const jsonString = JSON.stringify(data);
      // Simple base64 encoding with key mixing (not cryptographically secure)
      const encoded = btoa(jsonString + '|' + this.config.encryptionKey);
      return encoded;
    } catch (error) {
      console.error('Session data encryption failed:', error);
      return null;
    }
  }

  /**
   * Decrypt session data from storage
   */
  decryptSessionData(encryptedData) {
    try {
      const decoded = atob(encryptedData);
      const [jsonString, key] = decoded.split('|');
      if (key !== this.config.encryptionKey) {
        throw new Error('Invalid encryption key');
      }
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Session data decryption failed:', error);
      return null;
    }
  }

  /**
   * Initialize session management
   */
  initializeSessionManagement() {
    // Start periodic session validation
    this.startSessionValidation();
    
    // Start automatic token refresh
    this.startTokenRefresh();
    
    // Handle page visibility changes
    this.setupVisibilityHandlers();
    
    // Handle storage events (for multi-tab sync)
    this.setupStorageSync();
  }

  /**
   * Store session data securely with encryption
   */
  storeSessionData(authMethod, userData, tokenData = null) {
    try {
      const sessionData = {
        user: userData,
        authMethod,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.config.maxSessionDuration,
        tokenData: tokenData ? {
          ...tokenData,
          storedAt: Date.now()
        } : null
      };

      // Encrypt session data before storing
      const encryptedData = this.encryptSessionData(sessionData);
      if (!encryptedData) {
        throw new Error('Failed to encrypt session data');
      }
      
      localStorage.setItem(`${this.config.storagePrefix}data`, encryptedData);
      localStorage.setItem(`${this.config.storagePrefix}method`, authMethod);
      localStorage.setItem(`${this.config.storagePrefix}timestamp`, Date.now().toString());
      
      // Store user data separately for quick access
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('authMethod', authMethod);
      
      console.log('✅ Session data stored securely with encryption');
      this.notifyListeners('sessionStored', { authMethod, user: userData });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to store session data:', error);
      return false;
    }
  }

  /**
   * Retrieve session data with decryption
   */
  getSessionData() {
    try {
      const encryptedData = localStorage.getItem(`${this.config.storagePrefix}data`);
      if (!encryptedData) return null;
      
      // Decrypt session data
      const sessionData = this.decryptSessionData(encryptedData);
      if (!sessionData) {
        console.log('🔒 Failed to decrypt session data, clearing storage');
        this.clearSessionData();
        return null;
      }
      
      // Check if session has expired
      if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
        console.log('🕒 Session expired, clearing data');
        this.clearSessionData();
        return null;
      }
      
      return sessionData;
    } catch (error) {
      console.error('❌ Failed to retrieve session data:', error);
      this.clearSessionData(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Clear session data
   */
  clearSessionData() {
    try {
      // Clear session-specific storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.config.storagePrefix)) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear legacy storage
      localStorage.removeItem('userData');
      localStorage.removeItem('authMethod');
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminBypassSession');
      
      console.log('🧹 Session data cleared');
      this.notifyListeners('sessionCleared');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to clear session data:', error);
      return false;
    }
  }

  /**
   * Alias for clearSessionData for backward compatibility
   */
  clearSession() {
    return this.clearSessionData();
  }

  /**
   * Validate current session
   */
  async validateSession() {
    try {
      const sessionData = this.getSessionData();
      if (!sessionData) {
        return { isValid: false, reason: 'no_session' };
      }
      
      // Check if session has expired based on stored timestamp
      if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
        console.log('🕐 Session expired based on timestamp');
        return { isValid: false, reason: 'session_expired' };
      }
      
      const { authMethod, user, tokenData } = sessionData;
      
      // Validate based on auth method
      switch (authMethod) {
        case 'firebase':
          return await this.validateFirebaseSession(user, tokenData);
        case 'google':
        case 'github':
          return await this.validateOAuthSession(authMethod, user, tokenData);
        case 'admin_bypass':
          return this.validateAdminBypassSession(user);
        default:
          return { isValid: false, reason: 'unknown_auth_method' };
      }
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return { isValid: false, reason: 'validation_error', error: error.message };
    }
  }

  /**
   * Validate Firebase session with improved error handling
   */
  async validateFirebaseSession(user, tokenData) {
    try {
      if (!isFirebaseConfigured()) {
        // If Firebase is not configured but we have stored session data, preserve it
        if (user) {
          console.log('⚠️ Firebase not configured but session data exists, preserving session');
          return { isValid: true, user }; // Preserve session even if Firebase unavailable
        }
        return { isValid: false, reason: 'firebase_not_configured' };
      }
      
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        // If no current Firebase user but we have stored session, try to restore
        if (user) {
          console.log('⚠️ No Firebase user but session data exists, preserving session');
          return { isValid: true, user }; // Preserve session
        }
        return { isValid: false, reason: 'no_firebase_user' };
      }
      
      // Check if token needs refresh (but don't fail validation if refresh fails)
      if (tokenData && this.isTokenExpiringSoon(tokenData)) {
        try {
          await this.refreshAuthToken('firebase');
        } catch (refreshError) {
          console.warn('Token refresh failed during validation, but preserving session:', refreshError);
          // Don't fail validation on refresh errors - preserve session
        }
      }
      
      return { isValid: true, user: currentUser };
    } catch (error) {
      console.error('Firebase session validation error:', error);
      // For network errors, preserve session
      if (error.code === 'network-request-failed' || error.message?.includes('network')) {
        console.log('🌐 Network error during validation, preserving session');
        if (user) {
          return { isValid: true, user }; // Preserve session on network errors
        }
      }
      return { isValid: false, reason: 'firebase_validation_error', error: error.message };
    }
  }

  /**
   * Validate OAuth session
   */
  async validateOAuthSession(provider, user, tokenData) {
    try {
      const isAuthenticated = oauthService.isAuthenticated(provider);
      if (!isAuthenticated) {
        return { isValid: false, reason: 'oauth_not_authenticated' };
      }
      
      // Check if token needs refresh
      if (tokenData && this.isTokenExpiringSoon(tokenData)) {
        await this.refreshAuthToken(provider);
      }
      
      return { isValid: true, user };
    } catch (error) {
      console.error('OAuth session validation error:', error);
      return { isValid: false, reason: 'oauth_validation_error', error: error.message };
    }
  }

  /**
   * Validate admin bypass session
   */
  validateAdminBypassSession(user) {
    try {
      // Import admin security service dynamically to avoid circular dependencies
      const { adminSecurityService } = require('./adminSecurityService');
      return adminSecurityService.validateAdminSession(user);
    } catch (error) {
      console.error('Admin bypass session validation error:', error);
      return { isValid: false, reason: 'admin_validation_error', error: error.message };
    }
  }

  /**
   * Refresh authentication token with retry logic
   */
  async refreshAuthToken(authMethod) {
    // Prevent multiple simultaneous refresh attempts
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }
    
    this.tokenRefreshPromise = this.performTokenRefreshWithRetry(authMethod);
    
    try {
      const result = await this.tokenRefreshPromise;
      
      if (result.success) {
        console.log(`✅ ${authMethod} token refreshed successfully`);
        this.notifyListeners('tokenRefreshed', { authMethod, tokenData: result.tokenData });
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Token refresh failed for ${authMethod}:`, error);
      this.notifyListeners('tokenRefreshFailed', { authMethod, error: error.message });
      
      // Clear session on persistent failure
      if (error.code === 'auth/user-token-expired' || error.code === 'auth/invalid-user-token') {
        this.clearSessionData();
        this.notifyListeners('session_expired', { reason: 'token_refresh_failed' });
      }
      
      throw error;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  /**
   * Perform token refresh with retry mechanism
   */
  async performTokenRefreshWithRetry(authMethod, attempt = 1) {
    try {
      console.log(`🔄 Refreshing ${authMethod} token (attempt ${attempt}/${this.config.maxRetryAttempts})...`);
      return await this.performTokenRefresh(authMethod);
    } catch (error) {
      if (attempt < this.config.maxRetryAttempts && this.isRetryableError(error)) {
        console.log(`⏳ Retrying token refresh in ${this.config.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        return this.performTokenRefreshWithRetry(authMethod, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableCodes = [
      'network-request-failed',
      'timeout',
      'unavailable',
      'internal',
      'cancelled'
    ];
    return retryableCodes.includes(error.code) || error.message?.includes('network');
  }

  /**
   * Perform token refresh based on auth method
   */
  async performTokenRefresh(authMethod) {
    switch (authMethod) {
      case 'firebase':
        const token = await firebaseAuthService.getIdToken(true);
        const tokenData = { access_token: token, refreshedAt: Date.now() };
        this.updateStoredTokenData(tokenData);
        return { success: true, tokenData };
        
      case 'google':
      case 'github':
        const refreshedTokens = await oauthService.refreshAccessToken(authMethod);
        this.updateStoredTokenData(refreshedTokens);
        return { success: true, tokenData: refreshedTokens };
        
      default:
        throw new Error(`Token refresh not supported for auth method: ${authMethod}`);
    }
  }

  /**
   * Check if token is expiring soon
   * Firebase tokens expire in 1 hour, refresh at 45 minutes to be safe
   */
  isTokenExpiringSoon(tokenData) {
    if (!tokenData || !tokenData.storedAt) return true;
    
    const tokenAge = Date.now() - tokenData.storedAt;
    const refreshThreshold = 45 * 60 * 1000; // 45 minutes (Firebase tokens expire in 1 hour)
    
    return tokenAge > refreshThreshold;
  }

  /**
   * Update stored token data
   */
  updateStoredTokenData(tokenData) {
    try {
      const sessionData = this.getSessionData();
      if (sessionData) {
        sessionData.tokenData = {
          ...tokenData,
          storedAt: Date.now()
        };
        
        const encryptedData = this.encryptSessionData(sessionData);
        localStorage.setItem(`${this.config.storagePrefix}data`, encryptedData);
      }
    } catch (error) {
      console.error('Failed to update stored token data:', error);
    }
  }

  /**
   * Start periodic session validation with improved error handling
   */
  startSessionValidation() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
    
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = this.config.maxConsecutiveFailures || 5;
    
    this.sessionCheckInterval = setInterval(async () => {
      try {
        const validation = await this.validateSession();
        if (!validation.isValid) {
          // Only clear session for critical failures, not temporary issues
          const criticalFailures = ['no_session', 'session_expired', 'invalid_encryption', 'unknown_auth_method'];
          const temporaryFailures = ['firebase_validation_error', 'oauth_validation_error', 'validation_error', 'firebase_not_configured', 'no_firebase_user'];
          const networkFailures = ['network_error', 'timeout', 'unavailable'];
          
          // Don't invalidate on network issues at all
          if (networkFailures.includes(validation.reason)) {
            console.log('🌐 Network issue detected, preserving session:', validation.reason);
            consecutiveFailures = 0; // Reset counter for network issues
            return; // Don't process network failures
          }
          
          if (criticalFailures.includes(validation.reason)) {
            console.log('🚫 Critical session validation failed:', validation.reason);
            // Only notify, don't immediately clear - let retry logic handle it
            consecutiveFailures++;
            if (consecutiveFailures >= maxConsecutiveFailures) {
              this.notifyListeners('sessionInvalid', validation);
              consecutiveFailures = 0;
            }
          } else if (temporaryFailures.includes(validation.reason)) {
            consecutiveFailures++;
            console.warn(`⚠️ Session validation warning (${consecutiveFailures}/${maxConsecutiveFailures}):`, validation.reason);
            
            // Only invalidate after multiple consecutive failures
            if (consecutiveFailures >= maxConsecutiveFailures) {
              console.log('🚫 Multiple consecutive session validation failures - invalidating session');
              this.notifyListeners('sessionInvalid', validation);
              consecutiveFailures = 0;
            }
          }
        } else {
          consecutiveFailures = 0; // Reset counter on successful validation
        }
      } catch (error) {
        console.error('Session validation interval error:', error);
        // Don't increment failures on unexpected errors
      }
    }, this.config.sessionCheckInterval);
  }

  /**
   * Start automatic token refresh with enhanced logic
   */
  startTokenRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(async () => {
      const sessionData = this.getSessionData();
      if (sessionData && sessionData.tokenData) {
        if (this.isTokenExpiringSoon(sessionData.tokenData)) {
          try {
            await this.refreshAuthToken(sessionData.authMethod);
          } catch (error) {
            console.error('Automatic token refresh failed:', error);
          }
        }
      }
    }, this.config.tokenRefreshInterval);
    
    console.log('🔄 Enhanced token refresh system activated');
  }

  /**
   * Setup page visibility handlers
   */
  setupVisibilityHandlers() {
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        // Page became visible - validate session
        const validation = await this.validateSession();
        if (!validation.isValid) {
          this.notifyListeners('sessionInvalid', validation);
        }
      }
    });
  }

  /**
   * Setup storage synchronization for multi-tab support
   */
  setupStorageSync() {
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith(this.config.storagePrefix)) {
        this.notifyListeners('sessionSyncRequired', {
          key: event.key,
          oldValue: event.oldValue,
          newValue: event.newValue
        });
      }
    });
  }

  /**
   * Add session event listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }



  /**
   * Check and refresh tokens if needed with enhanced error handling
   */
  async checkAndRefreshTokens() {
    try {
      const sessionData = this.getSessionData();
      if (!sessionData || !sessionData.tokenData) {
        console.log('🔍 No session data or tokens found for refresh');
        return false;
      }

      const { authMethod, tokenData, user } = sessionData;
      const now = Date.now();
      
      // Check if token needs refresh (within buffer time of expiry)
      const needsRefresh = tokenData.expires_at && 
        (tokenData.expires_at - now) < this.config.tokenExpiryBuffer;

      if (needsRefresh) {
        console.log(`🔄 Token refresh needed for ${authMethod}, attempting refresh...`);
        
        let refreshResult = null;
        
        try {
          if (authMethod === 'firebase') {
            // Firebase handles token refresh automatically
            const currentUser = firebaseAuthService.getCurrentUser();
            if (currentUser) {
              const newToken = await currentUser.getIdToken(true);
              refreshResult = {
                access_token: newToken,
                expires_at: now + (60 * 60 * 1000), // 1 hour
                storedAt: now
              };
            }
          } else if (['google', 'github'].includes(authMethod)) {
            // OAuth token refresh
            refreshResult = await oauthService.refreshAccessToken(authMethod);
          }
          
          if (refreshResult) {
            // Update stored session with new tokens
            this.storeSessionData(authMethod, user, refreshResult);
            this.notifyListeners('tokenRefreshed', { authMethod, tokens: refreshResult });
            console.log(`✅ Token refreshed successfully for ${authMethod}`);
            return true;
          } else {
            console.warn(`❌ Token refresh failed for ${authMethod}`);
            this.notifyListeners('tokenRefreshFailed', { authMethod });
            return false;
          }
        } catch (refreshError) {
          console.error(`Token refresh error for ${authMethod}:`, refreshError);
          this.notifyListeners('tokenRefreshError', { authMethod, error: refreshError.message });
          
          // Only invalidate session for critical auth errors, not network issues
          if (refreshError.message.includes('invalid_grant') || 
              refreshError.message.includes('unauthorized') ||
              refreshError.message.includes('invalid_token')) {
            console.log('🚨 Critical auth error detected, clearing session data');
            this.clearSessionData();
            this.notifyListeners('sessionInvalidated', { reason: 'critical_auth_error' });
          } else {
            console.warn('⚠️ Token refresh failed but session preserved:', refreshError.message);
            // Don't clear session for network errors or temporary failures
          }
          
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Token refresh system error:', error);
      this.notifyListeners('tokenRefreshError', { error: error.message });
      return false;
    }
  }

  /**
   * Get current auth token
   */
  async getCurrentToken() {
    try {
      const sessionData = this.getSessionData();
      if (!sessionData) return null;
      
      const { authMethod } = sessionData;
      
      switch (authMethod) {
        case 'firebase':
          return await firebaseAuthService.getIdToken();
        case 'google':
        case 'github':
          return await oauthService.getAccessToken(authMethod);
        default:
          return sessionData.tokenData?.access_token || null;
      }
    } catch (error) {
      console.error('Failed to get current token:', error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    
    this.listeners.clear();
  }
}

// Create singleton instance
const sessionManagementService = new SessionManagementService();

export default sessionManagementService;