/**
 * Simplified OAuth Authentication Service
 * Handles Google and GitHub OAuth 2.0 authentication flows with minimal complexity
 */

import {
  SIMPLE_OAUTH_CONFIG,
  generateSimpleState,
  generateSimpleCodeVerifier,
  generateSimpleCodeChallenge,
  getSimpleProviderConfig,
  validateSimpleOAuthConfig,
} from "../../config/auth/oauth";
// Firebase-only configuration - no API_BASE needed

class SimplifiedOAuthService {
  constructor() {
    this.state = new Map(); // Store state for CSRF protection
    this.pendingOperations = new Map(); // Track pending auth operations

    // Validate configuration on initialization
    const validation = validateSimpleOAuthConfig();
    if (!validation.valid) {
      console.warn(
        "Simple OAuth Service initialized with configuration issues:",
        validation.errors
      );
    }
  }

  /**
   * Generate secure state parameter for OAuth flow
   */
  generateSecureState(provider) {
    const state = generateSimpleState();
    const timestamp = Date.now();

    const stateData = {
      provider,
      state,
      timestamp,
      returnUrl: window.location.pathname,
    };

    // Store state for verification
    this.state.set(state, stateData);

    // Clean up old states (older than 10 minutes)
    this.cleanupStates();

    return { state };
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
   * Initiate Google OAuth flow
   */
  async initiateGoogleAuth() {
    try {
      // Re-validate configuration before initiating
      const validation = validateSimpleOAuthConfig();
      if (!validation.valid) {
        const errorMsg = "Google OAuth configuration is missing. Please check your environment variables.";
        console.error(errorMsg, validation.errors);
        throw new Error(errorMsg);
      }

      const config = getSimpleProviderConfig("google");

      if (!config.clientId) {
        throw new Error("Google OAuth not configured");
      }

      const { state } = this.generateSecureState("google");

      // Generate PKCE parameters for enhanced security
      const codeVerifier = generateSimpleCodeVerifier();
      const codeChallenge = await generateSimpleCodeChallenge(codeVerifier);

      // Store code verifier for later use
      sessionStorage.setItem("simple_oauth_code_verifier", codeVerifier);

      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: "code",
        scope: config.scope,
        access_type: "offline",
        prompt: "consent",
        state: state,
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
    } catch (error) {
      console.error("Google OAuth initiation error:", error);
      throw new Error("Failed to initiate Google authentication");
    }
  }

  /**
   * Initiate GitHub OAuth flow
   */
  async initiateGitHubAuth() {
    try {
      const config = getSimpleProviderConfig("github");

      if (!config.clientId) {
        throw new Error("GitHub OAuth not configured");
      }

      const { state } = this.generateSecureState("github");

      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: config.scope,
        state: state,
      });

      const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

      // Store auth operation details
      this.pendingOperations.set(state, {
        provider: "github",
        timestamp: Date.now(),
      });

      window.location.href = authUrl;
      return { success: true, redirecting: true };
    } catch (error) {
      console.error("GitHub OAuth initiation error:", error);
      throw new Error("Failed to initiate GitHub authentication");
    }
  }

  /**
   * Handle OAuth callback and exchange code for token
   */
  async handleOAuthCallback(provider, code, state) {
    try {
      // Verify state parameter to prevent CSRF
      this.verifyState(state, provider);

      // Get code verifier if it exists (for Google PKCE)
      const codeVerifier = sessionStorage.getItem("simple_oauth_code_verifier");

      // Clear the code verifier from session storage
      sessionStorage.removeItem("simple_oauth_code_verifier");

      // Exchange code for token via backend
      const response = await fetch(
        SIMPLE_OAUTH_CONFIG.endpoints.tokenExchange,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider,
            code,
            redirectUri: SIMPLE_OAUTH_CONFIG[provider].redirectUri,
            codeVerifier, // Will be null for GitHub
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to exchange token");
      }

      const data = await response.json();

      // Store user session
      this.setSession(data);

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error("OAuth callback error:", error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Set user session in localStorage
   */
  setSession(data) {
    const storage =
      SIMPLE_OAUTH_CONFIG.security.tokenStorage === "sessionStorage"
        ? sessionStorage
        : localStorage;

    storage.setItem("simple_auth_user", JSON.stringify(data.user));
    storage.setItem("simple_auth_token", data.access_token);
    storage.setItem("simple_auth_refresh_token", data.refresh_token || "");
  }

  /**
   * Get current user from session
   */
  getCurrentUser() {
    const storage =
      SIMPLE_OAUTH_CONFIG.security.tokenStorage === "sessionStorage"
        ? sessionStorage
        : localStorage;

    const user = storage.getItem("simple_auth_user");
    return user ? JSON.parse(user) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const storage =
      SIMPLE_OAUTH_CONFIG.security.tokenStorage === "sessionStorage"
        ? sessionStorage
        : localStorage;

    return !!storage.getItem("simple_auth_user");
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Call backend logout endpoint
      await fetch(SIMPLE_OAUTH_CONFIG.endpoints.logout, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local session regardless of backend result
      const storage =
        SIMPLE_OAUTH_CONFIG.security.tokenStorage === "sessionStorage"
          ? sessionStorage
          : localStorage;

      storage.removeItem("simple_auth_user");
      storage.removeItem("simple_auth_token");
      storage.removeItem("simple_auth_refresh_token");

      // Redirect to login page
      window.location.href = "/login";
    }
  }
}

// Export singleton instance
const simplifiedOAuthService = new SimplifiedOAuthService();
export default simplifiedOAuthService;
