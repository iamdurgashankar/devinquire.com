/**
 * Simplified OAuth Configuration
 * Clean configuration for Google and GitHub OAuth 2.0 authentication
 * Minimal setup with clear documentation
 */

// Environment variables - these should be set in production
const getEnvVar = (name, defaultValue = "") => {
  return process.env[name] || defaultValue;
};

// Simplified OAuth Configuration
export const SIMPLE_OAUTH_CONFIG = {
  // Google OAuth 2.0 Configuration
  google: {
    clientId: getEnvVar("REACT_APP_SIMPLE_GOOGLE_CLIENT_ID") || getEnvVar("REACT_APP_GOOGLE_CLIENT_ID", ""),
    redirectUri: getEnvVar(
      "REACT_APP_SIMPLE_GOOGLE_REDIRECT_URI",
      `${window.location.origin}/auth/google/callback`
    ),
    scope: "openid email profile",
  },

  // GitHub OAuth 2.0 Configuration
  github: {
    clientId: getEnvVar("REACT_APP_SIMPLE_GITHUB_CLIENT_ID") || getEnvVar("REACT_APP_GITHUB_CLIENT_ID", ""),
    redirectUri: getEnvVar(
      "REACT_APP_SIMPLE_GITHUB_REDIRECT_URI",
      `${window.location.origin}/auth/github/callback`
    ),
    scope: "user:email read:user",
  },

  // Security Configuration
  security: {
    // Token storage settings
    tokenStorage: "localStorage", // 'localStorage' or 'sessionStorage'

    // CSRF Protection
    enableCSRF: true,
    csrfTokenName: "simple_oauth_csrf_token",
  },

  // API Endpoints
  endpoints: {
    tokenExchange: "/api/simple-auth/token",
    userInfo: "/api/simple-auth/user",
    logout: "/api/simple-auth/logout",
  },
};

// Validation function to check if OAuth is properly configured
export const validateSimpleOAuthConfig = () => {
  const errors = [];

  // Check Google configuration
  if (!SIMPLE_OAUTH_CONFIG.google.clientId) {
    errors.push("Google Client ID is missing");
  }

  if (!SIMPLE_OAUTH_CONFIG.google.redirectUri) {
    errors.push("Google Redirect URI is missing");
  }

  // Check GitHub configuration
  if (!SIMPLE_OAUTH_CONFIG.github.clientId) {
    errors.push("GitHub Client ID is missing");
  }

  if (!SIMPLE_OAUTH_CONFIG.github.redirectUri) {
    errors.push("GitHub Redirect URI is missing");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Helper function to get provider configuration
export const getSimpleProviderConfig = (provider) => {
  const config = SIMPLE_OAUTH_CONFIG[provider];
  if (!config) {
    throw new Error(`Unknown OAuth provider: ${provider}`);
  }
  return config;
};

// Security helper functions
export const generateSimpleState = () => {
  return btoa(crypto.getRandomValues(new Uint8Array(16)).join(""));
};

export const generateSimpleCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

export const generateSimpleCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};
