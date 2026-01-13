/**
 * Security Configuration for DevInquire Dashboard
 *
 * IMPORTANT SECURITY NOTES:
 *
 * 1. DEFAULT ADMIN CREDENTIALS
 *    - The default admin credentials are stored in authService.js
 *    - For PRODUCTION deployment, consider:
 *      a) Moving credentials to environment variables
 *      b) Implementing proper password hashing
 *      c) Adding rate limiting for login attempts
 *      d) Enabling two-factor authentication
 *
 * 2. SESSION MANAGEMENT
 *    - Admin sessions are currently stored in localStorage
 *    - Session expires after 24 hours automatically
 *    - For production, consider server-side session management
 *
 * 3. PRODUCTION CHECKLIST
 *    - Remove demo credentials hint from Login.jsx
 *    - Implement proper password hashing (bcrypt, argon2)
 *    - Add CSRF protection
 *    - Implement rate limiting
 *    - Use HTTPS only
 *    - Add proper audit logging
 *    - Implement password complexity requirements
 *    - Add account lockout after failed attempts
 *
 * 4. ENVIRONMENT VARIABLES (for production)
 *    - ADMIN_EMAIL=admin@yourdomain.com
 *    - ADMIN_PASSWORD_HASH=<hashed_password>
 *    - JWT_SECRET=<strong_random_secret>
 *    - SESSION_TIMEOUT=86400000 (24 hours in ms)
 */

const SecurityConfig = {
  // Session timeout in milliseconds (24 hours)
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,

  // Maximum failed login attempts before lockout
  MAX_LOGIN_ATTEMPTS: 5,

  // Lockout duration in milliseconds (15 minutes)
  LOCKOUT_DURATION: 15 * 60 * 1000,

  // Password requirements
  PASSWORD_REQUIREMENTS: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // Production security flags
  PRODUCTION_SECURITY: {
    useHttps: true,
    enableCSRF: true,
    enableRateLimit: true,
    auditLogging: true,
    twoFactorAuth: false, // Can be enabled later
  },
};

export default SecurityConfig;
