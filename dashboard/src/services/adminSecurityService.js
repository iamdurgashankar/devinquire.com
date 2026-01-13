/**
 * Admin Security Service
 * Provides additional security protocols for admin bypass functionality
 * Enhanced with comprehensive security measures for default admin account
 */

class AdminSecurityService {
  constructor() {
    this.maxFailedAttempts = 3;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.sessionTimeout = 2 * 60 * 60 * 1000; // 2 hours
    this.failedAttempts = new Map();
    this.adminSessions = new Map();
    this.securityEvents = [];
    
    // Default admin account configuration
    this.defaultAdminConfig = {
      email: 'admin@devinquire.com',
      allowedIPs: ['127.0.0.1', 'localhost'], // Can be expanded for production
      maxConcurrentSessions: 3,
      requireSecureContext: true,
      enableAdvancedLogging: true
    };
  }

  /**
   * Validate admin bypass attempt with enhanced security for default admin
   */
  async validateBypassAttempt(email, ipAddress, userAgent = '') {
    const key = `${email}_${ipAddress}`;
    const now = Date.now();
    
    // Enhanced validation for default admin account
    if (this.isDefaultAdmin(email)) {
      return await this.validateDefaultAdminBypass(email, ipAddress, userAgent, now);
    }
    
    // Standard validation for other admin accounts
    if (this.isLockedOut(key, now)) {
      throw new Error('Too many failed attempts. Please try again later.');
    }

    return true;
  }

  /**
   * Enhanced validation specifically for default admin account
   */
  async validateDefaultAdminBypass(email, ipAddress, userAgent, now) {
    const key = `${email}_${ipAddress}`;
    
    // Check lockout status
    if (this.isLockedOut(key, now)) {
      this.logSecurityEvent('admin_bypass_blocked', {
        email,
        ipAddress,
        reason: 'rate_limit_exceeded',
        timestamp: now
      });
      throw new Error('Default admin account temporarily locked due to security measures.');
    }
    
    // Validate environment security for default admin
    const envSecurity = this.validateEnvironmentSecurity();
    if (!envSecurity.isSecure && this.defaultAdminConfig.requireSecureContext) {
      this.logSecurityEvent('admin_bypass_blocked', {
        email,
        ipAddress,
        reason: 'insecure_environment',
        securityChecks: envSecurity.checks,
        timestamp: now
      });
      throw new Error('Default admin access requires secure environment.');
    }
    
    // Check concurrent sessions
    const activeSessions = this.getActiveAdminSessions(email);
    if (activeSessions.length >= this.defaultAdminConfig.maxConcurrentSessions) {
      this.logSecurityEvent('admin_bypass_blocked', {
        email,
        ipAddress,
        reason: 'max_sessions_exceeded',
        activeSessions: activeSessions.length,
        timestamp: now
      });
      throw new Error('Maximum concurrent admin sessions exceeded.');
    }
    
    // Log successful validation
    this.logSecurityEvent('admin_bypass_validated', {
      email,
      ipAddress,
      userAgent,
      timestamp: now
    });
    
    return true;
  }

  /**
   * Check if email belongs to default admin
   */
  isDefaultAdmin(email) {
    return email === this.defaultAdminConfig.email;
  }

  /**
   * Record failed bypass attempt
   */
  recordFailedAttempt(email, ipAddress) {
    const key = `${email}_${ipAddress}`;
    const now = Date.now();
    
    if (!this.failedAttempts.has(key)) {
      this.failedAttempts.set(key, []);
    }
    
    const attempts = this.failedAttempts.get(key);
    attempts.push(now);
    
    // Keep only recent attempts
    const recentAttempts = attempts.filter(time => now - time < this.lockoutDuration);
    this.failedAttempts.set(key, recentAttempts);
  }

  /**
   * Clear failed attempts on successful login
   */
  clearFailedAttempts(email, ipAddress) {
    const key = `${email}_${ipAddress}`;
    this.failedAttempts.delete(key);
  }

  /**
   * Check if IP/email combination is locked out
   */
  isLockedOut(key, now) {
    if (!this.failedAttempts.has(key)) {
      return false;
    }
    
    const attempts = this.failedAttempts.get(key);
    const recentAttempts = attempts.filter(time => now - time < this.lockoutDuration);
    
    return recentAttempts.length >= this.maxFailedAttempts;
  }

  /**
   * Enhanced admin session validation with privilege checks
   */
  validateAdminSession(sessionData) {
    if (!sessionData || !sessionData.sessionId || !sessionData.bypassTimestamp) {
      return { isValid: false, reason: 'missing_session_data' };
    }

    const sessionAge = Date.now() - new Date(sessionData.bypassTimestamp).getTime();
    
    // Check if session has expired
    if (sessionAge > this.sessionTimeout) {
      this.removeExpiredSession(sessionData.sessionId);
      return { isValid: false, reason: 'session_expired' };
    }

    // Validate session format
    if (!sessionData.sessionId.startsWith('admin_session_')) {
      return { isValid: false, reason: 'invalid_session_format' };
    }
    
    // Enhanced validation for default admin sessions
    if (sessionData.email && this.isDefaultAdmin(sessionData.email)) {
      return this.validateDefaultAdminSession(sessionData);
    }

    return { isValid: true, reason: 'valid' };
  }

  /**
   * Enhanced validation for default admin sessions
   */
  validateDefaultAdminSession(sessionData) {
    const storedSession = this.adminSessions.get(sessionData.sessionId);
    
    if (!storedSession) {
      return { isValid: false, reason: 'session_not_found' };
    }
    
    // Validate session integrity
    if (storedSession.email !== sessionData.email || 
        storedSession.ipAddress !== sessionData.ipAddress) {
      this.logSecurityEvent('admin_session_tampering', {
        sessionId: sessionData.sessionId,
        expected: storedSession,
        received: sessionData,
        timestamp: Date.now()
      });
      return { isValid: false, reason: 'session_tampering_detected' };
    }
    
    // Update last activity
    storedSession.lastActivity = Date.now();
    this.adminSessions.set(sessionData.sessionId, storedSession);
    
    return { 
      isValid: true, 
      reason: 'valid',
      privileges: storedSession.privileges || ['admin', 'super_admin']
    };
  }

  /**
   * Generate secure session token with enhanced tracking
   */
  generateSecureSessionId(email, ipAddress, userAgent = '') {
    const timestamp = Date.now();
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const randomString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    
    const sessionId = `admin_session_${timestamp}_${randomString}`;
    
    // Store session data for enhanced validation
    const sessionData = {
      sessionId,
      email,
      ipAddress,
      userAgent,
      createdAt: timestamp,
      lastActivity: timestamp,
      privileges: this.isDefaultAdmin(email) ? ['admin', 'super_admin', 'default_admin'] : ['admin']
    };
    
    this.adminSessions.set(sessionId, sessionData);
    
    // Log session creation
    this.logSecurityEvent('admin_session_created', {
      sessionId,
      email,
      ipAddress,
      timestamp
    });
    
    return sessionId;
  }

  /**
   * Get active admin sessions for a user
   */
  getActiveAdminSessions(email) {
    const now = Date.now();
    const activeSessions = [];
    
    for (const [sessionId, sessionData] of this.adminSessions.entries()) {
      if (sessionData.email === email && 
          (now - sessionData.lastActivity) < this.sessionTimeout) {
        activeSessions.push(sessionData);
      }
    }
    
    return activeSessions;
  }

  /**
   * Remove expired session
   */
  removeExpiredSession(sessionId) {
    const sessionData = this.adminSessions.get(sessionId);
    if (sessionData) {
      this.logSecurityEvent('admin_session_expired', {
        sessionId,
        email: sessionData.email,
        timestamp: Date.now()
      });
      this.adminSessions.delete(sessionId);
    }
  }

  /**
   * Revoke admin session
   */
  revokeAdminSession(sessionId) {
    const sessionData = this.adminSessions.get(sessionId);
    if (sessionData) {
      this.logSecurityEvent('admin_session_revoked', {
        sessionId,
        email: sessionData.email,
        timestamp: Date.now()
      });
      this.adminSessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Validate environment security
   */
  validateEnvironmentSecurity() {
    const checks = {
      isSecureContext: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      hasLocalStorage: typeof Storage !== 'undefined',
      hasCrypto: typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
    };

    const allChecksPassed = Object.values(checks).every(check => check === true);
    
    return {
      isSecure: allChecksPassed,
      checks
    };
  }

  /**
   * Monitor suspicious activity
   */
  detectSuspiciousActivity(loginData) {
    const suspiciousIndicators = [];
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

    // Check for rapid successive attempts
    const recentAttempts = this.getRecentAttempts(loginData.email, loginData.ipAddress);
    if (recentAttempts.length > 5) {
      suspiciousIndicators.push('rapid_attempts');
    }

    // Check for unusual user agent
    if (!loginData.userAgent || loginData.userAgent.length < 10) {
      suspiciousIndicators.push('suspicious_user_agent');
    }

    // Check for non-standard browser features (skip in development)
    if (!isDevelopment && typeof window.navigator.webdriver !== 'undefined') {
      suspiciousIndicators.push('automated_browser');
    }

    // In development, log but don't flag as suspicious for automated browser detection
    if (isDevelopment && typeof window.navigator.webdriver !== 'undefined') {
      console.log('[AdminSecurity] Development mode: Automated browser detected but not flagged as suspicious');
    }

    return {
      isSuspicious: suspiciousIndicators.length > 0,
      indicators: suspiciousIndicators
    };
  }

  /**
   * Get recent attempts for monitoring
   */
  getRecentAttempts(email, ipAddress) {
    const key = `${email}_${ipAddress}`;
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    
    if (!this.failedAttempts.has(key)) {
      return [];
    }
    
    return this.failedAttempts.get(key).filter(time => now - time < timeWindow);
  }

  /**
   * Log security events for monitoring
   */
  logSecurityEvent(eventType, eventData) {
    const event = {
      type: eventType,
      data: eventData,
      timestamp: Date.now()
    };
    
    this.securityEvents.push(event);
    
    // Keep only recent events (last 1000)
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AdminSecurity] ${eventType}:`, eventData);
    }
  }

  /**
   * Get security events for monitoring
   */
  getSecurityEvents(eventType = null, limit = 100) {
    let events = this.securityEvents;
    
    if (eventType) {
      events = events.filter(event => event.type === eventType);
    }
    
    return events.slice(-limit);
  }

  /**
   * Enhanced cleanup with session management
   */
  cleanup() {
    const now = Date.now();
    
    // Clean up failed attempts
    for (const [key, attempts] of this.failedAttempts.entries()) {
      const recentAttempts = attempts.filter(time => now - time < this.lockoutDuration);
      
      if (recentAttempts.length === 0) {
        this.failedAttempts.delete(key);
      } else {
        this.failedAttempts.set(key, recentAttempts);
      }
    }
    
    // Clean up expired admin sessions
    for (const [sessionId, sessionData] of this.adminSessions.entries()) {
      if ((now - sessionData.lastActivity) > this.sessionTimeout) {
        this.removeExpiredSession(sessionId);
      }
    }
    
    // Clean up old security events (keep last 24 hours)
    const dayAgo = now - (24 * 60 * 60 * 1000);
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > dayAgo);
  }

  /**
   * Get comprehensive security status
   */
  getSecurityStatus() {
    const now = Date.now();
    
    return {
      activeSessions: this.adminSessions.size,
      defaultAdminSessions: this.getActiveAdminSessions(this.defaultAdminConfig.email).length,
      lockedAccounts: Array.from(this.failedAttempts.keys()).filter(key => 
        this.isLockedOut(key, now)
      ).length,
      recentSecurityEvents: this.securityEvents.filter(event => 
        (now - event.timestamp) < (60 * 60 * 1000) // Last hour
      ).length,
      environmentSecurity: this.validateEnvironmentSecurity()
    };
  }
}

// Create singleton instance
const adminSecurityService = new AdminSecurityService();

// Clean up expired data every 5 minutes
setInterval(() => {
  adminSecurityService.cleanup();
}, 5 * 60 * 1000);

export { adminSecurityService };
export default adminSecurityService;