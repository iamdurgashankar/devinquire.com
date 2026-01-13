/**
 * Enhanced OAuth Authentication Service
 * Handles Google and GitHub OAuth 2.0 authentication flows
 * Integrated with Firebase authentication and traditional OAuth fallback
 */

import {
  OAUTH_CONFIG,
  generateState,
  generateNonce,
  generateCodeVerifier,
  generateCodeChallenge,
  getProviderConfig,
  validateOAuthConfig,
  getOAuthMode,
  isProviderAvailable,
  getEffectiveProviderConfig,
} from "../config/oauth";
// Firebase-only configuration - no API_BASE needed
import { isFirebaseConfigured } from "../config/firebase";
import firebaseAuthService from "./firebaseAuthService";

class EnhancedOAuthService {
  constructor() {
    this.state = new Map(); // Store state for CSRF protection
    this.pendingOperations = new Map(); // Track pending auth operations
    this.tokenRefreshPromise = null; // Prevent multiple refresh attempts
    this.isFirebaseAvailable = isFirebaseConfigured();
    this.oauthMode = getOAuthMode();

    // Validate configuration on initialization
    const validation = validateOAuthConfig();
    if (!validation.valid && !this.isFirebaseAvailable) {
      console.warn(
        "OAuth Service initialized with configuration issues:",
        validation.errors
      );
    }

    console.log("OAuth Service Mode:", this.oauthMode.mode);

    // Set up automatic token refresh for traditional mode
    if (this.oauthMode.mode === "traditional") {
      this.setupTokenRefresh();
    }
  }

  /**
   * Generate secure state parameter for OAuth flow
   */
  generateSecureState(provider) {
    const state = generateState();
    const nonce = generateNonce();
    const timestamp = Date.now();

    const stateData = {
      provider,
      state,
      nonce,
      timestamp,
      returnUrl: window.location.pathname,
    };

    // Store state for verification
    this.state.set(state, stateData);

    // Clean up old states (older than 10 minutes)
    this.cleanupStates();

    return { state, nonce };
  }

  /**
   * Verify state parameter
   */
  verifyState(state, provider) {
    const stateData = this.state.get(state);

    if (!stateData) {
      throw new Error("Invalid or expired state parameter");
    }

    if (stateData.provider !== provider) {
      throw new Error("State provider mismatch");
    }

    // Check if state is not too old (10 minutes max)
    const maxAge = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - stateData.timestamp > maxAge) {
      this.state.delete(state);
      throw new Error("State parameter expired");
    }

    // Remove used state
    this.state.delete(state);

    return stateData;
  }

  /**
   * Clean up expired states
   */
  cleanupStates() {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();

    for (const [state, data] of this.state.entries()) {
      if (now - data.timestamp > maxAge) {
        this.state.delete(state);
      }
    }
  }

  /**
   * Check if a provider is available in current mode
   */
  isProviderSupported(provider) {
    return isProviderAvailable(provider);
  }

  /**
   * Get current OAuth mode
   */
  getMode() {
    return this.oauthMode;
  }

  /**
   * Initiate Google OAuth flow - Enhanced with Firebase support
   */
  async initiateGoogleAuth(useRedirect = false) {
    try {
      // Use Firebase authentication if available
      if (this.isFirebaseAvailable && firebaseAuthService.isAvailable()) {
        console.log("Using Firebase for Google authentication");
        return await firebaseAuthService.signInWithGoogle(useRedirect);
      }

      // Fallback to traditional OAuth
      console.log("Using traditional OAuth for Google authentication");
      return await this._traditionalGoogleAuth();
    } catch (error) {
      console.error("Enhanced Google OAuth initiation error:", error);
      throw new Error("Failed to initiate Google authentication");
    }
  }

  /**
   * Traditional Google OAuth flow (fallback)
   */
  async _traditionalGoogleAuth() {
    const config = getEffectiveProviderConfig("google");
    if (!config.available) {
      throw new Error("Google OAuth not configured");
    }

    const { state, nonce } = this.generateSecureState("google");

    // Generate PKCE parameters for enhanced security
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code verifier for later use
    sessionStorage.setItem("oauth_code_verifier", codeVerifier);

    const params = new URLSearchParams({
      client_id: config.config.clientId,
      redirect_uri: config.config.redirectUri,
      response_type: config.config.responseType,
      scope: config.config.scope,
      access_type: config.config.accessType,
      prompt: config.config.prompt,
      state: state,
      nonce: nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Store auth operation details
    this.pendingOperations.set(state, {
      provider: "google",
      timestamp: Date.now(),
      codeVerifier,
    });

    window.location.href = authUrl;
    return { success: true, redirecting: true };
  }

  /**
   * Initiate GitHub OAuth flow - Enhanced with Firebase support
   */
  async initiateGitHubAuth(useRedirect = false) {
    try {
      // Use Firebase authentication if available
      if (this.isFirebaseAvailable && firebaseAuthService.isAvailable()) {
        console.log("Using Firebase for GitHub authentication");
        return await firebaseAuthService.signInWithGitHub(useRedirect);
      }

      // Fallback to traditional OAuth
      console.log("Using traditional OAuth for GitHub authentication");
      return await this._traditionalGitHubAuth();
    } catch (error) {
      console.error("Enhanced GitHub OAuth initiation error:", error);
      throw new Error("Failed to initiate GitHub authentication");
    }
  }

  /**
   * Traditional GitHub OAuth flow (fallback)
   */
  async _traditionalGitHubAuth() {
    const config = getEffectiveProviderConfig("github");
    if (!config.available) {
      throw new Error("GitHub OAuth not configured");
    }

    const { state } = this.generateSecureState("github");

    const params = new URLSearchParams({
      client_id: config.config.clientId,
      redirect_uri: config.config.redirectUri,
      scope: config.config.scope,
      state: state,
      allow_signup: "true",
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    // Store auth operation details
    this.pendingOperations.set(state, {
      provider: "github",
      timestamp: Date.now(),
    });

    window.location.href = authUrl;
    return { success: true, redirecting: true };
  }

  /**
   * Handle OAuth callback - Enhanced with Firebase support
   */
  async handleCallback(provider, params) {
    try {
      // If Firebase is handling redirects, delegate to Firebase
      if (this.isFirebaseAvailable && firebaseAuthService.isAvailable()) {
        console.log("Handling OAuth callback via Firebase");
        return await firebaseAuthService.handleRedirectResult();
      }

      // Traditional OAuth callback handling
      console.log("Handling OAuth callback via traditional flow");
      return await this._traditionalHandleCallback(provider, params);
    } catch (error) {
      console.error(`Enhanced OAuth callback error:`, error);
      throw error;
    }
  }

  /**
   * Traditional OAuth callback handling (fallback)
   */
  async _traditionalHandleCallback(provider, params) {
    try {
      const { code, state, error } = params;

      // Check for OAuth errors
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error("Missing authorization code or state parameter");
      }

      // Verify state
      const stateData = this.verifyState(state, provider);

      // Get pending operation
      const operation = this.pendingOperations.get(state);
      if (!operation) {
        throw new Error("No pending operation found for this state");
      }

      // Exchange code for tokens
      const tokenData = await this.exchangeCodeForTokens(
        provider,
        code,
        operation
      );

      // Get user information
      const userInfo = await this.getUserInfo(provider, tokenData.access_token);

      // Store tokens securely
      this.storeTokens(provider, tokenData);

      // Clean up
      this.pendingOperations.delete(state);
      sessionStorage.removeItem("oauth_code_verifier");

      return {
        success: true,
        user: userInfo,
        provider,
        tokens: tokenData,
      };
    } catch (error) {
      console.error(`${provider} traditional OAuth callback error:`, error);

      // Clean up on error
      if (params.state) {
        this.pendingOperations.delete(params.state);
      }
      sessionStorage.removeItem("oauth_code_verifier");

      throw error;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(provider, code, operation) {
    try {
      let tokenUrl, requestBody, headers;

      if (provider === "google") {
        const config = getProviderConfig("google");
        const codeVerifier =
          operation.codeVerifier ||
          sessionStorage.getItem("oauth_code_verifier");

        tokenUrl = "https://oauth2.googleapis.com/token";
        requestBody = {
          client_id: config.clientId,
          code: code,
          redirect_uri: config.redirectUri,
          grant_type: "authorization_code",
          code_verifier: codeVerifier,
        };
        headers = {
          "Content-Type": "application/x-www-form-urlencoded",
        };
      } else if (provider === "github") {
        const config = getProviderConfig("github");

        tokenUrl = "https://github.com/login/oauth/access_token";
        requestBody = {
          client_id: config.clientId,
          client_secret: process.env.REACT_APP_GITHUB_CLIENT_SECRET, // This should be handled by backend
          code: code,
        };
        headers = {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        };
      }

      // Firebase-only: Direct token exchange with provider
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers,
        body: new URLSearchParams(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const tokenData = await response.json();

      if (!tokenData.access_token) {
        throw new Error("No access token received");
      }

      return tokenData;
    } catch (error) {
      console.error("Token exchange error:", error);
      throw new Error("Failed to exchange authorization code for tokens");
    }
  }

  /**
   * Get user information from provider
   */
  async getUserInfo(provider, accessToken) {
    try {
      let userInfoUrl, headers;

      if (provider === "google") {
        userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
        headers = {
          Authorization: `Bearer ${accessToken}`,
        };
      } else if (provider === "github") {
        userInfoUrl = "https://api.github.com/user";
        headers = {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        };
      }

      const response = await fetch(userInfoUrl, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const userData = await response.json();

      // Normalize user data across providers
      return this.normalizeUserData(provider, userData);
    } catch (error) {
      console.error("Get user info error:", error);
      throw new Error("Failed to retrieve user information");
    }
  }

  /**
   * Normalize user data across different providers
   */
  normalizeUserData(provider, userData) {
    const normalized = {
      provider,
      providerId: userData.id?.toString(),
      email: userData.email,
      name: userData.name,
      avatar: userData.picture || userData.avatar_url,
      verified:
        userData.verified_email !== undefined
          ? userData.verified_email
          : userData.email !== null,
      locale: userData.locale,
      createdAt: new Date().toISOString(),
    };

    if (provider === "google") {
      normalized.firstName = userData.given_name;
      normalized.lastName = userData.family_name;
      normalized.locale = userData.locale;
    } else if (provider === "github") {
      normalized.username = userData.login;
      normalized.githubUrl = userData.html_url;
      normalized.company = userData.company;
      normalized.location = userData.location;
      normalized.bio = userData.bio;

      // Split name if available
      if (userData.name) {
        const nameParts = userData.name.split(" ");
        normalized.firstName = nameParts[0];
        normalized.lastName = nameParts.slice(1).join(" ");
      }
    }

    return normalized;
  }

  /**
   * Store tokens securely
   */
  storeTokens(provider, tokenData) {
    const storageKey = `oauth_tokens_${provider}`;
    const expiresAt = Date.now() + tokenData.expires_in * 1000;

    const tokenInfo = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type || "Bearer",
      expiresAt,
      scope: tokenData.scope,
      provider,
      storedAt: Date.now(),
    };

    // Store in localStorage or sessionStorage based on configuration
    const storage =
      OAUTH_CONFIG.security.tokenStorage === "sessionStorage"
        ? sessionStorage
        : localStorage;

    try {
      storage.setItem(storageKey, JSON.stringify(tokenInfo));
    } catch (error) {
      console.error("Failed to store tokens:", error);
      throw new Error("Failed to store authentication tokens");
    }
  }

  /**
   * Get stored tokens
   */
  getStoredTokens(provider) {
    const storageKey = `oauth_tokens_${provider}`;
    const storage =
      OAUTH_CONFIG.security.tokenStorage === "sessionStorage"
        ? sessionStorage
        : localStorage;

    try {
      const stored = storage.getItem(storageKey);
      if (!stored) return null;

      const tokenInfo = JSON.parse(stored);

      // Check if token is expired
      if (Date.now() >= tokenInfo.expiresAt) {
        storage.removeItem(storageKey);
        return null;
      }

      return tokenInfo;
    } catch (error) {
      console.error("Failed to retrieve tokens:", error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(provider) {
    // Prevent multiple simultaneous refresh attempts
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    try {
      const tokenInfo = this.getStoredTokens(provider);
      if (!tokenInfo || !tokenInfo.refreshToken) {
        throw new Error("No refresh token available");
      }

      this.tokenRefreshPromise = this.performTokenRefresh(
        provider,
        tokenInfo.refreshToken
      );
      const newTokenData = await this.tokenRefreshPromise;

      // Store new tokens
      this.storeTokens(provider, newTokenData);

      return newTokenData;
    } catch (error) {
      console.error("Token refresh error:", error);
      // Clear stored tokens on refresh failure
      this.clearStoredTokens(provider);
      throw error;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  /**
   * Perform token refresh
   */
  async performTokenRefresh(provider, refreshToken) {
    // Firebase-only: Use Firebase Auth token refresh
    if (this.isFirebaseAvailable) {
      // Firebase handles token refresh automatically
      const user = firebaseAuthService.getCurrentUser();
      if (user) {
        const token = await user.getIdToken(true); // Force refresh
        return { access_token: token };
      }
    }
    
    throw new Error('Token refresh not available in Firebase-only mode');
  }

  /**
   * Setup automatic token refresh
   */
  setupTokenRefresh() {
    // Check and refresh tokens every 5 minutes
    setInterval(() => {
      ["google", "github"].forEach(async (provider) => {
        const tokenInfo = this.getStoredTokens(provider);
        if (tokenInfo) {
          const timeUntilExpiry = tokenInfo.expiresAt - Date.now();
          const refreshThreshold = 5 * 60 * 1000; // 5 minutes

          if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
            try {
              await this.refreshAccessToken(provider);
            } catch (error) {
              console.warn(`Auto refresh failed for ${provider}:`, error);
            }
          }
        }
      });
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Clear stored tokens
   */
  clearStoredTokens(provider) {
    const storageKey = `oauth_tokens_${provider}`;
    const storage =
      OAUTH_CONFIG.security.tokenStorage === "sessionStorage"
        ? sessionStorage
        : localStorage;

    storage.removeItem(storageKey);
  }

  /**
   * Logout from OAuth provider
   */
  async logout(provider) {
    try {
      const tokenInfo = this.getStoredTokens(provider);

      if (tokenInfo) {
        // Revoke tokens with provider
        await this.revokeTokens(provider, tokenInfo.accessToken);

        // Clear stored tokens
        this.clearStoredTokens(provider);
      }

      // Clear any pending operations
      this.pendingOperations.clear();
      this.state.clear();

      return { success: true, message: `Logged out from ${provider}` };
    } catch (error) {
      console.error(`Logout error for ${provider}:`, error);
      // Still clear tokens even if revocation fails
      this.clearStoredTokens(provider);
      throw error;
    }
  }

  /**
   * Revoke tokens with provider
   */
  async revokeTokens(provider, accessToken) {
    try {
      if (provider === "google") {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
          {
            method: "POST",
          }
        );
      } else if (provider === "github") {
        // GitHub doesn't have a revoke endpoint, tokens expire naturally
        console.log("GitHub tokens will expire naturally");
      }
    } catch (error) {
      console.warn(`Token revocation failed for ${provider}:`, error);
      // Don't throw error as local cleanup is more important
    }
  }

  /**
   * Check if user is authenticated with a provider - Enhanced
   */
  isAuthenticated(provider) {
    // Check Firebase authentication first
    if (this.isFirebaseAvailable && firebaseAuthService.isAvailable()) {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (currentUser && currentUser.providers) {
        return currentUser.providers.some((p) =>
          p.providerId.includes(provider)
        );
      }
    }

    // Fallback to traditional token check
    const tokenInfo = this.getStoredTokens(provider);
    return tokenInfo !== null;
  }

  /**
   * Get current authenticated user for a provider - Enhanced
   */
  async getCurrentUser(provider) {
    try {
      // Check Firebase authentication first
      if (this.isFirebaseAvailable && firebaseAuthService.isAvailable()) {
        const currentUser = firebaseAuthService.getCurrentUser();
        if (currentUser && currentUser.provider === provider) {
          return this._formatFirebaseUser(currentUser);
        }
      }

      // Fallback to traditional OAuth user retrieval
      return await this._getTraditionalUser(provider);
    } catch (error) {
      console.error(`Failed to get current user for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Get traditional OAuth user (fallback)
   */
  async _getTraditionalUser(provider) {
    const tokenInfo = this.getStoredTokens(provider);
    if (!tokenInfo) {
      return null;
    }

    try {
      // Try to refresh token if needed
      const timeUntilExpiry = tokenInfo.expiresAt - Date.now();
      if (timeUntilExpiry < 0) {
        throw new Error("Token expired");
      }

      // Get fresh user info
      const userInfo = await this.getUserInfo(provider, tokenInfo.accessToken);
      return userInfo;
    } catch (error) {
      console.error(`Failed to get user info for ${provider}:`, error);
      // Clear invalid tokens
      this.clearStoredTokens(provider);
      return null;
    }
  }

  /**
   * Format Firebase user for compatibility
   */
  _formatFirebaseUser(firebaseUser) {
    return {
      provider: firebaseUser.provider,
      providerId: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      avatar: firebaseUser.photoURL,
      verified: firebaseUser.emailVerified,
      username: firebaseUser.email?.split("@")[0] || "",
      createdAt: firebaseUser.metadata?.creationTime,
      lastSignIn: firebaseUser.metadata?.lastSignInTime,
    };
  }

  /**
   * Get access token for API calls - Enhanced
   */
  async getAccessToken(provider) {
    try {
      // Check Firebase authentication first
      if (this.isFirebaseAvailable && firebaseAuthService.isAvailable()) {
        const currentUser = firebaseAuthService.getCurrentUser();
        if (currentUser && currentUser.provider === provider) {
          return await firebaseAuthService.getIdToken();
        }
      }

      // Fallback to traditional token
      const tokenInfo = this.getStoredTokens(provider);
      if (!tokenInfo) {
        throw new Error("No access token available");
      }

      // Check if token needs refresh
      const timeUntilExpiry = tokenInfo.expiresAt - Date.now();
      const refreshThreshold = 5 * 60 * 1000; // 5 minutes

      if (timeUntilExpiry < refreshThreshold) {
        const refreshedTokens = await this.refreshAccessToken(provider);
        return refreshedTokens.access_token;
      }

      return tokenInfo.accessToken;
    } catch (error) {
      console.error(`Failed to get access token for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced logout with Firebase support
   */
  async logout(provider) {
    try {
      // Logout from Firebase if applicable
      if (this.isFirebaseAvailable && firebaseAuthService.isAvailable()) {
        const currentUser = firebaseAuthService.getCurrentUser();
        if (currentUser && currentUser.provider === provider) {
          await firebaseAuthService.signOut();
          return { success: true, message: `Logged out from ${provider}` };
        }
      }

      // Traditional OAuth logout
      return await this._traditionalLogout(provider);
    } catch (error) {
      console.error(`Enhanced logout error for ${provider}:`, error);
      // Still clear tokens even if logout fails
      this.clearStoredTokens(provider);
      throw error;
    }
  }

  /**
   * Traditional OAuth logout (fallback)
   */
  async _traditionalLogout(provider) {
    try {
      const tokenInfo = this.getStoredTokens(provider);

      if (tokenInfo) {
        // Revoke tokens with provider
        await this.revokeTokens(provider, tokenInfo.accessToken);

        // Clear stored tokens
        this.clearStoredTokens(provider);
      }

      // Clear any pending operations
      this.pendingOperations.clear();
      this.state.clear();

      return { success: true, message: `Logged out from ${provider}` };
    } catch (error) {
      console.error(`Traditional logout error for ${provider}:`, error);
      // Still clear tokens even if revocation fails
      this.clearStoredTokens(provider);
      throw error;
    }
  }

  /**
   * Get service status and capabilities
   */
  getStatus() {
    return {
      mode: this.oauthMode.mode,
      description: this.oauthMode.description,
      firebaseAvailable: this.isFirebaseAvailable,
      providers: {
        google: {
          available: this.isProviderSupported("google"),
          authenticated: this.isAuthenticated("google"),
        },
        github: {
          available: this.isProviderSupported("github"),
          authenticated: this.isAuthenticated("github"),
        },
      },
      fallbackMode: this.oauthMode.fallback,
    };
  }
}

// Create and export singleton instance
const enhancedOAuthService = new EnhancedOAuthService();
export default enhancedOAuthService;
