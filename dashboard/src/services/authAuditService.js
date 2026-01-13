/**
 * Authentication Audit Service
 * Comprehensive logging system for all authentication attempts and security events
 * Provides detailed audit trails for admin bypass and other authentication activities
 */

import { getDbInstance } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

class AuthAuditService {
  constructor() {
    this.isInitialized = false;
    this.localLogs = [];
    this.maxLocalLogs = 1000;
    this.securityAlerts = [];
    this.suspiciousActivities = new Map();
    this.adminBypassAttempts = new Map();
    this.threatLevel = 'low';
    this.init();
  }

  async init() {
    try {
      console.log('🔍 Initializing Authentication Audit Service...');
      this.isInitialized = true;
      
      // Load existing local logs from localStorage
      this.loadLocalLogs();
      
      console.log('✅ Authentication Audit Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Authentication Audit Service:', error);
    }
  }

  /**
   * Log authentication attempt with comprehensive details
   * @param {Object} logData - Authentication log data
   */
  async logAuthAttempt(logData) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: this.generateLogId(),
      timestamp,
      serverTimestamp: serverTimestamp(),
      type: 'auth_attempt',
      ...logData,
      userAgent: navigator.userAgent,
      ipAddress: await this.getClientIP(),
      sessionId: this.getSessionId(),
      deviceFingerprint: this.getDeviceFingerprint()
    };

    // Store locally first for immediate availability
    this.storeLocalLog(logEntry);

    // Attempt to store in Firebase
    try {
      await this.storeFirebaseLog(logEntry);
      console.log(`🔍 [AUDIT] Auth attempt logged: ${logData.method} - ${logData.status}`);
    } catch (error) {
      console.warn('⚠️ Failed to store audit log in Firebase, kept locally:', error);
    }

    return logEntry;
  }

  /**
   * Log admin bypass attempt with enhanced security details and threat detection
   * @param {Object} bypassData - Admin bypass attempt data
   */
  async logAdminBypass(bypassData) {
    const timestamp = new Date().toISOString();
    const ipAddress = await this.getClientIP();
    const deviceFingerprint = this.getDeviceFingerprint();
    const sessionId = this.getSessionId();
    
    // Enhanced security analysis
    const securityAnalysis = await this.analyzeAdminBypassSecurity(bypassData, ipAddress, deviceFingerprint);
    
    const logEntry = {
      method: 'admin_bypass',
      email: bypassData.email,
      status: bypassData.success ? 'success' : 'failed',
      reason: bypassData.reason || 'Admin bypass attempt',
      securityLevel: securityAnalysis.threatLevel,
      adminUser: {
        email: bypassData.email,
        role: bypassData.role || 'admin',
        permissions: bypassData.permissions || [],
        privileges: bypassData.privileges || []
      },
      bypassDetails: {
        credentialsProvided: !!bypassData.password,
        passwordLength: bypassData.password ? bypassData.password.length : 0,
        attemptSource: 'direct_login',
        verificationPassed: bypassData.success,
        securityChecks: securityAnalysis.checks,
        riskScore: securityAnalysis.riskScore
      },
      securityContext: {
        ipAddress: ipAddress,
        deviceFingerprint: deviceFingerprint,
        userAgent: navigator.userAgent,
        timestamp: timestamp,
        sessionId: sessionId,
        geolocation: securityAnalysis.geolocation,
        previousAttempts: securityAnalysis.previousAttempts
      }
    };

    // Track admin bypass attempts for pattern analysis
    this.trackAdminBypassAttempt(bypassData.email, ipAddress, bypassData.success);
    
    const auditLog = await this.logAuthAttempt(logEntry);
    
    // Enhanced console logging with security context
    if (bypassData.success) {
      console.log('🔐 [CRITICAL AUDIT] Admin bypass authentication SUCCESSFUL');
      console.log(`   📧 Email: ${bypassData.email}`);
      console.log(`   🕒 Time: ${new Date().toLocaleString()}`);
      console.log(`   🆔 Session: ${sessionId}`);
      console.log(`   🖥️  Device: ${deviceFingerprint}`);
      console.log(`   🌐 IP: ${ipAddress}`);
      console.log(`   🔒 Security Level: ${securityAnalysis.threatLevel}`);
      console.log(`   📊 Risk Score: ${securityAnalysis.riskScore}/100`);
      
      // Log successful admin access for monitoring
      this.logSecurityEvent('admin_access_granted', {
        email: bypassData.email,
        privileges: bypassData.privileges,
        securityLevel: securityAnalysis.threatLevel
      });
    } else {
      console.warn('⚠️ [SECURITY ALERT] Admin bypass authentication FAILED');
      console.warn(`   📧 Email: ${bypassData.email}`);
      console.warn(`   ❌ Reason: ${bypassData.reason}`);
      console.warn(`   🕒 Time: ${new Date().toLocaleString()}`);
      console.warn(`   🌐 IP: ${ipAddress}`);
      console.warn(`   📊 Risk Score: ${securityAnalysis.riskScore}/100`);
      
      // Check for suspicious activity patterns
      if (securityAnalysis.riskScore > 70) {
        this.logSecurityAlert('high_risk_admin_bypass_attempt', {
          email: bypassData.email,
          ipAddress: ipAddress,
          riskScore: securityAnalysis.riskScore,
          reason: bypassData.reason
        });
      }
    }

    return auditLog;
  }

  /**
   * Log regular authentication attempts
   * @param {Object} authData - Authentication attempt data
   */
  async logRegularAuth(authData) {
    const logEntry = {
      method: authData.method || 'email_password',
      email: authData.email,
      status: authData.success ? 'success' : 'failed',
      reason: authData.reason || 'Regular authentication attempt',
      securityLevel: 'normal',
      errorCode: authData.errorCode,
      errorMessage: authData.errorMessage
    };

    return await this.logAuthAttempt(logEntry);
  }

  /**
   * Log OAuth authentication attempts
   * @param {Object} oauthData - OAuth authentication data
   */
  async logOAuthAuth(oauthData) {
    const logEntry = {
      method: `oauth_${oauthData.provider}`,
      email: oauthData.email,
      status: oauthData.success ? 'success' : 'failed',
      reason: oauthData.reason || `OAuth ${oauthData.provider} authentication`,
      securityLevel: 'normal',
      provider: oauthData.provider,
      providerId: oauthData.providerId
    };

    return await this.logAuthAttempt(logEntry);
  }

  /**
   * Log logout events
   * @param {Object} logoutData - Logout event data
   */
  async logLogout(logoutData) {
    const logEntry = {
      method: 'logout',
      email: logoutData.email,
      status: 'success',
      reason: 'User logout',
      securityLevel: 'normal',
      authMethod: logoutData.authMethod,
      sessionDuration: logoutData.sessionDuration
    };

    return await this.logAuthAttempt(logEntry);
  }

  /**
   * Get audit logs with filtering options
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of audit logs
   */
  getAuditLogs(options = {}) {
    try {
      const {
        limit = 50,
        startDate,
        endDate,
        eventType,
        userId,
        success
      } = options;

      // Get logs from localStorage
      const localLogs = this.getLocalLogs();
      let filteredLogs = [...localLogs];

      // Apply filters
      if (startDate) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) >= new Date(startDate)
        );
      }

      if (endDate) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) <= new Date(endDate)
        );
      }

      if (eventType) {
        filteredLogs = filteredLogs.filter(log => log.eventType === eventType);
      }

      if (userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === userId);
      }

      if (typeof success === 'boolean') {
        filteredLogs = filteredLogs.filter(log => log.success === success);
      }

      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply limit
      const limitedLogs = filteredLogs.slice(0, limit);

      return Promise.resolve(limitedLogs);
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return Promise.resolve([]);
    }
  }

  /**
   * Get authentication logs with filtering options
   * @param {Object} options - Query options
   */
  async getAuthLogs(options = {}) {
    const {
      limit: queryLimit = 100,
      method,
      status,
      email,
      securityLevel,
      startDate,
      endDate
    } = options;

    try {
      // Try to get from Firebase first
      let q = query(
        collection(getDbInstance(), 'auth_audit_logs'),
        orderBy('serverTimestamp', 'desc'),
        limit(queryLimit)
      );

      // Add filters
      if (method) {
        q = query(q, where('method', '==', method));
      }
      if (status) {
        q = query(q, where('status', '==', status));
      }
      if (email) {
        q = query(q, where('email', '==', email));
      }
      if (securityLevel) {
        q = query(q, where('securityLevel', '==', securityLevel));
      }

      const querySnapshot = await getDocs(q);
      const firebaseLogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return firebaseLogs;
    } catch (error) {
      console.warn('Failed to fetch Firebase logs, returning local logs:', error);
      return this.getLocalLogs(options);
    }
  }

  /**
   * Get admin bypass logs specifically
   */
  async getAdminBypassLogs(limit = 50) {
    return await this.getAuthLogs({
      method: 'admin_bypass',
      securityLevel: 'critical',
      limit
    });
  }

  /**
   * Get failed authentication attempts
   */
  async getFailedAuthAttempts(limit = 100) {
    return await this.getAuthLogs({
      status: 'failed',
      limit
    });
  }

  /**
   * Store log in Firebase
   * @param {Object} logEntry - Log entry to store
   */
  async storeFirebaseLog(logEntry) {
    try {
      const docRef = await addDoc(collection(getDbInstance(), 'auth_audit_logs'), logEntry);
      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to store Firebase log: ${error.message}`);
    }
  }

  /**
   * Store log locally
   * @param {Object} logEntry - Log entry to store
   */
  storeLocalLog(logEntry) {
    this.localLogs.unshift(logEntry);
    
    // Keep only the most recent logs
    if (this.localLogs.length > this.maxLocalLogs) {
      this.localLogs = this.localLogs.slice(0, this.maxLocalLogs);
    }

    // Save to localStorage
    try {
      localStorage.setItem('auth_audit_logs', JSON.stringify(this.localLogs));
    } catch (error) {
      console.warn('Failed to save logs to localStorage:', error);
    }
  }

  /**
   * Load local logs from localStorage
   */
  loadLocalLogs() {
    try {
      const stored = localStorage.getItem('auth_audit_logs');
      if (stored) {
        this.localLogs = JSON.parse(stored);
        console.log(`📋 Loaded ${this.localLogs.length} local audit logs`);
      }
    } catch (error) {
      console.warn('Failed to load local logs:', error);
      this.localLogs = [];
    }
  }

  /**
   * Get local logs with filtering
   * @param {Object} options - Filter options
   */
  getLocalLogs(options = {}) {
    let filteredLogs = [...this.localLogs];

    if (options.method) {
      filteredLogs = filteredLogs.filter(log => log.method === options.method);
    }
    if (options.status) {
      filteredLogs = filteredLogs.filter(log => log.status === options.status);
    }
    if (options.email) {
      filteredLogs = filteredLogs.filter(log => log.email === options.email);
    }
    if (options.securityLevel) {
      filteredLogs = filteredLogs.filter(log => log.securityLevel === options.securityLevel);
    }

    return filteredLogs.slice(0, options.limit || 100);
  }

  /**
   * Generate unique log ID
   */
  generateLogId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('auth_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('auth_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get device fingerprint
   */
  getDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      canvas: canvas.toDataURL().slice(-50)
    };
    
    return btoa(JSON.stringify(fingerprint)).slice(0, 20);
  }

  /**
   * Get client IP address (best effort)
   */
  async getClientIP() {
    try {
      // This is a best effort - in production you'd want a proper IP detection service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Clear all logs (admin function)
   */
  async clearLogs() {
    this.localLogs = [];
    localStorage.removeItem('auth_audit_logs');
    console.log('🗑️ All audit logs cleared');
  }

  /**
   * Export logs for analysis
   */
  exportLogs() {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: this.localLogs.length,
      logs: this.localLogs
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth_audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Analyze admin bypass security context
   * @param {Object} bypassData - Bypass attempt data
   * @param {string} ipAddress - Client IP address
   * @param {string} deviceFingerprint - Device fingerprint
   * @returns {Object} Security analysis results
   */
  async analyzeAdminBypassSecurity(bypassData, ipAddress, deviceFingerprint) {
    let riskScore = 0;
    const checks = [];
    let threatLevel = 'low';
    
    // Check for repeated failed attempts from same IP
    const recentFailures = this.getRecentFailedAttempts(ipAddress, 'admin_bypass', 15); // 15 minutes
    if (recentFailures.length > 3) {
      riskScore += 30;
      checks.push('multiple_failed_attempts');
    }
    
    // Check for unusual timing patterns
    const recentAttempts = this.getRecentAttempts(bypassData.email, 5); // 5 minutes
    if (recentAttempts.length > 5) {
      riskScore += 25;
      checks.push('rapid_succession_attempts');
    }
    
    // Check for new device/IP combination
    const isNewDevice = !this.hasSeenDeviceBefore(deviceFingerprint, bypassData.email);
    if (isNewDevice) {
      riskScore += 15;
      checks.push('new_device');
    }
    
    // Check for suspicious user agent patterns
    const userAgent = navigator.userAgent;
    if (this.isSuspiciousUserAgent(userAgent)) {
      riskScore += 20;
      checks.push('suspicious_user_agent');
    }
    
    // Determine threat level based on risk score
    if (riskScore >= 70) {
      threatLevel = 'critical';
    } else if (riskScore >= 40) {
      threatLevel = 'high';
    } else if (riskScore >= 20) {
      threatLevel = 'medium';
    }
    
    return {
      riskScore,
      threatLevel,
      checks,
      previousAttempts: recentAttempts.length,
      geolocation: await this.getGeolocation(ipAddress)
    };
  }
  
  /**
   * Track admin bypass attempts for pattern analysis
   * @param {string} email - Email address
   * @param {string} ipAddress - IP address
   * @param {boolean} success - Whether attempt was successful
   */
  trackAdminBypassAttempt(email, ipAddress, success) {
    const key = `${email}:${ipAddress}`;
    const now = Date.now();
    
    if (!this.adminBypassAttempts.has(key)) {
      this.adminBypassAttempts.set(key, []);
    }
    
    const attempts = this.adminBypassAttempts.get(key);
    attempts.push({ timestamp: now, success });
    
    // Keep only recent attempts (last 24 hours)
    const dayAgo = now - (24 * 60 * 60 * 1000);
    this.adminBypassAttempts.set(key, attempts.filter(attempt => attempt.timestamp > dayAgo));
  }
  
  /**
   * Log security events and alerts
   * @param {string} eventType - Type of security event
   * @param {Object} eventData - Event data
   */
  logSecurityEvent(eventType, eventData) {
    const securityEvent = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      eventType,
      data: eventData,
      severity: this.getEventSeverity(eventType)
    };
    
    this.securityAlerts.push(securityEvent);
    
    // Keep only recent alerts (last 1000)
    if (this.securityAlerts.length > 1000) {
      this.securityAlerts = this.securityAlerts.slice(-1000);
    }
    
    console.log(`🚨 [SECURITY EVENT] ${eventType}:`, eventData);
  }
  
  /**
   * Log high-priority security alerts
   * @param {string} alertType - Type of security alert
   * @param {Object} alertData - Alert data
   */
  logSecurityAlert(alertType, alertData) {
    this.logSecurityEvent(alertType, alertData);
    
    // Additional handling for critical alerts
    if (this.getEventSeverity(alertType) === 'critical') {
      console.error(`🚨 [CRITICAL SECURITY ALERT] ${alertType}:`, alertData);
      // In production, this could trigger notifications, emails, etc.
    }
  }
  
  /**
   * Get recent failed attempts for IP/method combination
   * @param {string} ipAddress - IP address
   * @param {string} method - Authentication method
   * @param {number} minutes - Time window in minutes
   * @returns {Array} Recent failed attempts
   */
  getRecentFailedAttempts(ipAddress, method, minutes) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.localLogs.filter(log => 
      log.ipAddress === ipAddress &&
      log.method === method &&
      log.status === 'failed' &&
      new Date(log.timestamp).getTime() > cutoff
    );
  }
  
  /**
   * Get recent attempts for email
   * @param {string} email - Email address
   * @param {number} minutes - Time window in minutes
   * @returns {Array} Recent attempts
   */
  getRecentAttempts(email, minutes) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.localLogs.filter(log => 
      log.email === email &&
      new Date(log.timestamp).getTime() > cutoff
    );
  }
  
  /**
   * Check if device has been seen before for this email
   * @param {string} deviceFingerprint - Device fingerprint
   * @param {string} email - Email address
   * @returns {boolean} Whether device has been seen before
   */
  hasSeenDeviceBefore(deviceFingerprint, email) {
    return this.localLogs.some(log => 
      log.deviceFingerprint === deviceFingerprint &&
      log.email === email &&
      log.status === 'success'
    );
  }
  
  /**
   * Check for suspicious user agent patterns
   * @param {string} userAgent - User agent string
   * @returns {boolean} Whether user agent is suspicious
   */
  isSuspiciousUserAgent(userAgent) {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /curl/i,
      /wget/i,
      /python/i,
      /script/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
  
  /**
   * Get geolocation information for IP address
   * @param {string} ipAddress - IP address
   * @returns {Object} Geolocation data
   */
  async getGeolocation(ipAddress) {
    try {
      // In production, use a proper geolocation service
      return {
        ip: ipAddress,
        country: 'Unknown',
        city: 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    } catch (error) {
      return { ip: ipAddress, error: 'Geolocation unavailable' };
    }
  }
  
  /**
   * Get event severity level
   * @param {string} eventType - Event type
   * @returns {string} Severity level
   */
  getEventSeverity(eventType) {
    const severityMap = {
      'admin_access_granted': 'high',
      'high_risk_admin_bypass_attempt': 'critical',
      'multiple_failed_attempts': 'high',
      'suspicious_activity_detected': 'medium',
      'new_device_login': 'low'
    };
    
    return severityMap[eventType] || 'medium';
  }
  
  /**
   * Get enhanced audit statistics with security metrics
   */
  getAuditStats() {
    const stats = {
      total: this.localLogs.length,
      byMethod: {},
      byStatus: {},
      bySecurityLevel: {},
      recentActivity: this.localLogs.slice(0, 10),
      securityMetrics: {
        totalAlerts: this.securityAlerts.length,
        criticalAlerts: this.securityAlerts.filter(alert => alert.severity === 'critical').length,
        adminBypassAttempts: this.localLogs.filter(log => log.method === 'admin_bypass').length,
        failedAdminAttempts: this.localLogs.filter(log => log.method === 'admin_bypass' && log.status === 'failed').length,
        currentThreatLevel: this.threatLevel,
        uniqueIPs: new Set(this.localLogs.map(log => log.ipAddress)).size,
        suspiciousActivities: this.suspiciousActivities.size
      }
    };

    this.localLogs.forEach(log => {
      // Count by method
      stats.byMethod[log.method] = (stats.byMethod[log.method] || 0) + 1;
      
      // Count by status
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
      
      // Count by security level
      stats.bySecurityLevel[log.securityLevel] = (stats.bySecurityLevel[log.securityLevel] || 0) + 1;
    });

    return stats;
  }
  
  /**
   * Get security alerts
   * @param {Object} options - Filter options
   * @returns {Array} Security alerts
   */
  getSecurityAlerts(options = {}) {
    let alerts = [...this.securityAlerts];
    
    if (options.severity) {
      alerts = alerts.filter(alert => alert.severity === options.severity);
    }
    
    if (options.eventType) {
      alerts = alerts.filter(alert => alert.eventType === options.eventType);
    }
    
    if (options.limit) {
      alerts = alerts.slice(0, options.limit);
    }
    
    return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

// Create singleton instance
const authAuditService = new AuthAuditService();

export default authAuditService;