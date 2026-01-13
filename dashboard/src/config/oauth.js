/**
 * OAuth Configuration
 * Secure configuration for Google and GitHub OAuth 2.0 authentication
 * Enhanced with Firebase integration support
 */

import { isFirebaseConfigured } from "./firebase";

// Environment variables - these should be set in production
const getEnvVar = (name, defaultValue = "") => {
  return process.env[name] || defaultValue;
};

// OAuth Configuration
export const OAUTH_CONFIG = {
  // Google OAuth 2.0 Configuration
  google: {
    clientId: getEnvVar("REACT_APP_GOOGLE_CLIENT_ID", ""),
    // Use environment-specific redirect URI
    redirectUri:
      process.env.NODE_ENV === "production"
        ? getEnvVar(
            "REACT_APP_GOOGLE_PROD_REDIRECT_URI",
            "https://dashboard.devinquire.com/auth/google/callback"
          )
        : getEnvVar(
            "REACT_APP_GOOGLE_REDIRECT_URI",
            `${window.location.origin}/auth/google/callback`
          ),
    // Additional redirect URIs for development (used for validation)
    allowedRedirectUris: [
      "http://localhost:3000/auth/google/callback",
      "http://localhost:3001/auth/google/callback",
      "http://localhost:3002/auth/google/callback",
      "http://127.0.0.1:3000/auth/google/callback",
      `${window.location.origin}/auth/google/callback`,
      "https://dashboard.devinquire.com/auth/google/callback",
      process.env.REACT_APP_GOOGLE_PROD_REDIRECT_URI ||
        "https://dashboard.devinquire.com/auth/google/callback",
    ],
    scope: "openid email profile",
    responseType: "code",
    accessType: "offline",
    prompt: "consent",
    // Security settings
    state: null, // Will be generated dynamically
    nonce: null, // Will be generated dynamically
  },

  // GitHub OAuth 2.0 Configuration
  github: {
    clientId: getEnvVar("REACT_APP_GITHUB_CLIENT_ID", ""),
    redirectUri: getEnvVar(
      "REACT_APP_GITHUB_REDIRECT_URI",
      `${window.location.origin}/auth/github/callback`
    ),
    scope: "user:email read:user",
    state: null, // Will be generated dynamically
  },

  // Firebase Configuration (for Google Auth alternative)
  firebase: {
    apiKey: getEnvVar("REACT_APP_FIREBASE_API_KEY", ""),
    authDomain: getEnvVar("REACT_APP_FIREBASE_AUTH_DOMAIN", ""),
    projectId: getEnvVar("REACT_APP_FIREBASE_PROJECT_ID", ""),
    storageBucket: getEnvVar("REACT_APP_FIREBASE_STORAGE_BUCKET", ""),
    messagingSenderId: getEnvVar("REACT_APP_FIREBASE_MESSAGING_SENDER_ID", ""),
    appId: getEnvVar("REACT_APP_FIREBASE_APP_ID", ""),
  },

  // Security Configuration
  security: {
    // Token storage settings
    tokenStorage: "localStorage", // 'localStorage' or 'sessionStorage'
    tokenExpiry: 3600000, // 1 hour in milliseconds
    refreshTokenExpiry: 604800000, // 7 days in milliseconds

    // CSRF Protection
    enableCSRF: true,
    csrfTokenName: "oauth_csrf_token",

    // Rate limiting
    maxLoginAttempts: 5,
    lockoutDuration: 900000, // 15 minutes in milliseconds

    // Secure cookie settings
    cookieSettings: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      httpOnly: false, // Must be false for client-side access
    },
  },

  // API Endpoints
  endpoints: {
    tokenExchange: "/api/oauth/token",
    userInfo: "/api/oauth/user",
    refresh: "/api/oauth/refresh",
    logout: "/api/oauth/logout",
    revoke: "/api/oauth/revoke",
  },
};

// Enhanced validation function to check if OAuth is properly configured
export const validateOAuthConfig = () => {
  const errors = [];
  const warnings = [];
  const isFirebaseAvailable = isFirebaseConfigured();

  // Check Google configuration
  if (!OAUTH_CONFIG.google.clientId && !isFirebaseAvailable) {
    errors.push(
      "Google Client ID is missing (required when Firebase is not configured)"
    );
  } else if (!OAUTH_CONFIG.google.clientId && isFirebaseAvailable) {
    warnings.push("Google Client ID not set - using Firebase configuration");
  }

  // Validate redirect URI based on environment
  const isProduction = process.env.NODE_ENV === "production";
  const redirectUri = OAUTH_CONFIG.google.redirectUri;

  if (isProduction && !redirectUri.startsWith("https://")) {
    errors.push("Production redirect URI must use HTTPS");
  } else if (!isProduction && !redirectUri.startsWith("http://localhost")) {
    warnings.push("Development redirect URI should typically use localhost");
  }

  // Check GitHub configuration
  if (!OAUTH_CONFIG.github.clientId && !isFirebaseAvailable) {
    errors.push(
      "GitHub Client ID is missing (required when Firebase is not configured)"
    );
  } else if (!OAUTH_CONFIG.github.clientId && isFirebaseAvailable) {
    warnings.push("GitHub Client ID not set - using Firebase configuration");
  }

  // Check Firebase configuration
  if (!OAUTH_CONFIG.firebase.apiKey && !OAUTH_CONFIG.google.clientId) {
    errors.push(
      "Either Firebase API Key or Google Client ID must be configured"
    );
  }

  // Log warnings in development
  if (warnings.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("OAuth Configuration Warnings:", warnings);
  }

  if (errors.length > 0) {
    console.warn("OAuth Configuration Issues:", errors);
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors: [],
    warnings,
    firebaseAvailable: isFirebaseAvailable,
    fallbackMode: !isFirebaseAvailable,
  };
};

// Helper function to get provider configuration
export const getProviderConfig = (provider) => {
  const config = OAUTH_CONFIG[provider];
  if (!config) {
    throw new Error(`Unknown OAuth provider: ${provider}`);
  }
  return config;
};

// Security helper functions
export const generateState = () => {
  return btoa(crypto.getRandomValues(new Uint8Array(32)).join(""));
};

export const generateNonce = () => {
  return btoa(crypto.getRandomValues(new Uint8Array(16)).join(""));
};

export const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

export const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

// Enhanced OAuth mode detection
export const getOAuthMode = () => {
  const isFirebaseAvailable = isFirebaseConfigured();
  const validation = validateOAuthConfig();
  const isProduction = process.env.NODE_ENV === "production";

  if (isFirebaseAvailable) {
    return {
      mode: "firebase",
      description: `Using Firebase authentication with OAuth providers (${
        isProduction ? "production" : "development"
      } mode)`,
      available: true,
      fallback: validation.fallbackMode,
      environment: isProduction ? "production" : "development",
    };
  } else if (validation.valid) {
    return {
      mode: "traditional",
      description: `Using traditional OAuth 2.0 flow (${
        isProduction ? "production" : "development"
      } mode)`,
      available: true,
      fallback: false,
      environment: isProduction ? "production" : "development",
    };
  } else {
    return {
      mode: "disabled",
      description: "OAuth not properly configured",
      available: false,
      fallback: false,
      errors: validation.errors,
    };
  }
};

// Provider availability checker
export const isProviderAvailable = (provider) => {
  const mode = getOAuthMode();

  if (!mode.available) {
    return false;
  }

  if (mode.mode === "firebase") {
    // Firebase handles provider configuration internally
    return true;
  }

  // Traditional mode - check if provider is configured
  const config = OAUTH_CONFIG[provider];
  return config && config.clientId;
};

// Get effective configuration for a provider
export const getEffectiveProviderConfig = (provider) => {
  const mode = getOAuthMode();

  if (mode.mode === "firebase") {
    // Return Firebase-compatible configuration
    return {
      mode: "firebase",
      provider,
      available: true,
      requiresRedirect: false, // Firebase uses popups by default
    };
  }

  // Traditional mode
  const config = OAUTH_CONFIG[provider];
  if (!config || !config.clientId) {
    return {
      mode: "disabled",
      provider,
      available: false,
      error: `${provider} not configured`,
    };
  }

  return {
    mode: "traditional",
    provider,
    available: true,
    config,
    requiresRedirect: true,
  };
};
