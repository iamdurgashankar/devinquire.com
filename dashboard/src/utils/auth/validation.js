/**
 * Simple Authentication Validation Utilities
 * Security validation functions for the simplified OAuth system
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate user input to prevent XSS and injection attacks
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

/**
 * Validate redirect URI to prevent open redirect vulnerabilities
 */
export const validateRedirectUri = (redirectUri, allowedUris) => {
  try {
    const uri = new URL(redirectUri);

    // Check if the redirect URI is in the list of allowed URIs
    return allowedUris.some((allowedUri) => {
      try {
        const allowed = new URL(allowedUri);
        return (
          uri.origin === allowed.origin && uri.pathname === allowed.pathname
        );
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
};

/**
 * Generate secure random string
 */
export const generateSecureRandomString = (length = 32) => {
  const array = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for Node.js environment
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return btoa(String.fromCharCode.apply(null, array));
};

/**
 * Validate OAuth state parameter
 */
export const validateState = (state) => {
  // State should be a base64 encoded string
  try {
    atob(state);
    return state.length > 10; // Basic length check
  } catch {
    return false;
  }
};

/**
 * Validate OAuth code parameter
 */
export const validateCode = (code) => {
  // Code should be a non-empty string
  return typeof code === "string" && code.length > 10 && code.length < 1000;
};

/**
 * Validate OAuth provider
 */
export const validateProvider = (provider) => {
  const validProviders = ["google", "github"];
  return validProviders.includes(provider);
};

/**
 * Rate limiting check
 */
export const checkRateLimit = (
  identifier,
  maxAttempts = 5,
  windowMs = 900000
) => {
  // 15 minutes
  const key = `rate_limit_${identifier}`;
  const now = Date.now();

  const attempts = JSON.parse(localStorage.getItem(key) || "[]");

  // Filter out attempts older than the window
  const recentAttempts = attempts.filter(
    (timestamp) => now - timestamp < windowMs
  );

  // Check if limit exceeded
  if (recentAttempts.length >= maxAttempts) {
    return {
      exceeded: true,
      resetTime: recentAttempts[0] + windowMs,
    };
  }

  // Add current attempt
  recentAttempts.push(now);
  localStorage.setItem(key, JSON.stringify(recentAttempts));

  return {
    exceeded: false,
    remaining: maxAttempts - recentAttempts.length,
  };
};

/**
 * Clear rate limit
 */
export const clearRateLimit = (identifier) => {
  const key = `rate_limit_${identifier}`;
  localStorage.removeItem(key);
};

/**
 * Validate token expiry
 */
export const isTokenExpired = (expiresAt) => {
  if (!expiresAt) return true;

  const expiryDate = new Date(expiresAt);
  const now = new Date();

  return expiryDate < now;
};

/**
 * Validate user session
 */
export const validateUserSession = (user) => {
  if (!user) return false;

  // Check required fields
  const requiredFields = ["id", "email", "name", "provider"];
  return requiredFields.every((field) => user.hasOwnProperty(field));
};

export default {
  validateEmail,
  sanitizeInput,
  validateRedirectUri,
  generateSecureRandomString,
  validateState,
  validateCode,
  validateProvider,
  checkRateLimit,
  clearRateLimit,
  isTokenExpired,
  validateUserSession,
};
