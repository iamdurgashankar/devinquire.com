/**
 * Test utility for admin bypass functionality
 * This file helps verify that the admin bypass mechanism and logging are working correctly
 */

import authAuditService from '../services/authAuditService';
import { adminSecurityService } from '../services/adminSecurityService';

class AdminBypassTester {
  constructor() {
    this.testResults = [];
  }

  /**
   * Run comprehensive tests for admin bypass functionality
   */
  async runTests() {
    console.log('🧪 Starting Admin Bypass Tests...');
    
    try {
      // Test 1: Validate security service initialization
      await this.testSecurityServiceInitialization();
      
      // Test 2: Test audit logging functionality
      await this.testAuditLogging();
      
      // Test 3: Test session validation
      await this.testSessionValidation();
      
      // Test 4: Test rate limiting
      await this.testRateLimiting();
      
      // Test 5: Test environment security validation
      await this.testEnvironmentSecurity();
      
      console.log('✅ All Admin Bypass Tests Completed');
      this.printTestResults();
      
      return {
        success: true,
        results: this.testResults
      };
    } catch (error) {
      console.error('❌ Admin Bypass Tests Failed:', error);
      return {
        success: false,
        error: error.message,
        results: this.testResults
      };
    }
  }

  /**
   * Test security service initialization
   */
  async testSecurityServiceInitialization() {
    try {
      const sessionId = adminSecurityService.generateSecureSessionId();
      const isValidFormat = sessionId.startsWith('admin_session_');
      
      this.addTestResult('Security Service Initialization', isValidFormat, 
        isValidFormat ? 'Session ID generated correctly' : 'Invalid session ID format');
    } catch (error) {
      this.addTestResult('Security Service Initialization', false, error.message);
    }
  }

  /**
   * Test audit logging functionality
   */
  async testAuditLogging() {
    try {
      // Test successful admin bypass logging
      await authAuditService.logAdminBypass({
        email: 'test@example.com',
        success: true,
        userId: 'test-user-id',
        sessionId: 'test-session-123',
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
        timestamp: new Date().toISOString()
      });
      
      // Test failed admin bypass logging
      await authAuditService.logAdminBypass({
        email: 'test@example.com',
        success: false,
        reason: 'Test failed attempt',
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent'
      });
      
      // Verify logs were created
      const logs = await authAuditService.getAuditLogs({ limit: 10 });
      const hasLogs = logs && logs.length > 0;
      
      this.addTestResult('Audit Logging', hasLogs, 
        hasLogs ? `${logs.length} audit logs found` : 'No audit logs created');
    } catch (error) {
      this.addTestResult('Audit Logging', false, error.message);
    }
  }

  /**
   * Test session validation
   */
  async testSessionValidation() {
    try {
      // Create a valid session using the proper method
      const validSessionId = adminSecurityService.generateSecureSessionId(
        'test@example.com', 
        '127.0.0.1', 
        'Test User Agent'
      );
      
      const validSession = {
        sessionId: validSessionId,
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        bypassTimestamp: new Date().toISOString()
      };
      
      const validSessionResult = adminSecurityService.validateAdminSession(validSession);
      
      // Test expired session by creating one with old timestamp
      const expiredSessionId = adminSecurityService.generateSecureSessionId(
        'expired@example.com', 
        '127.0.0.1', 
        'Test User Agent'
      );
      
      // Manually create an expired session by modifying the timestamp
      const expiredSession = {
        sessionId: expiredSessionId,
        email: 'expired@example.com',
        ipAddress: '127.0.0.1',
        bypassTimestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
      };
      
      const expiredSessionResult = adminSecurityService.validateAdminSession(expiredSession);
      
      // Fix: validateAdminSession returns an object with isValid property, not a boolean
      const testPassed = validSessionResult.isValid && !expiredSessionResult.isValid;
      
      this.addTestResult('Session Validation', testPassed, 
        testPassed ? 'Valid and expired sessions handled correctly' : 
        `Session validation failed - Valid: ${validSessionResult.reason}, Expired: ${expiredSessionResult.reason}`);
    } catch (error) {
      this.addTestResult('Session Validation', false, error.message);
    }
  }

  /**
   * Test rate limiting functionality
   */
  async testRateLimiting() {
    try {
      const testEmail = 'ratelimit@test.com';
      const testIP = '192.168.1.100';
      
      // Record multiple failed attempts
      for (let i = 0; i < 4; i++) {
        adminSecurityService.recordFailedAttempt(testEmail, testIP);
      }
      
      // Check if locked out
      let isLockedOut = false;
      try {
        await adminSecurityService.validateBypassAttempt(testEmail, testIP);
      } catch (error) {
        isLockedOut = error.message.includes('Too many failed attempts');
      }
      
      // Clear attempts and test again
      adminSecurityService.clearFailedAttempts(testEmail, testIP);
      
      let canAttemptAfterClear = true;
      try {
        await adminSecurityService.validateBypassAttempt(testEmail, testIP);
      } catch (error) {
        canAttemptAfterClear = false;
      }
      
      const testPassed = isLockedOut && canAttemptAfterClear;
      
      this.addTestResult('Rate Limiting', testPassed, 
        testPassed ? 'Rate limiting works correctly' : 'Rate limiting failed');
    } catch (error) {
      this.addTestResult('Rate Limiting', false, error.message);
    }
  }

  /**
   * Test environment security validation
   */
  async testEnvironmentSecurity() {
    try {
      const envSecurity = adminSecurityService.validateEnvironmentSecurity();
      
      const hasRequiredChecks = envSecurity.checks && 
        typeof envSecurity.checks.isSecureContext === 'boolean' &&
        typeof envSecurity.checks.hasLocalStorage === 'boolean' &&
        typeof envSecurity.checks.hasCrypto === 'boolean';
      
      this.addTestResult('Environment Security', hasRequiredChecks, 
        hasRequiredChecks ? 'Environment security checks working' : 'Environment security checks failed');
    } catch (error) {
      this.addTestResult('Environment Security', false, error.message);
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, passed, message) {
    const result = {
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
  }

  /**
   * Print comprehensive test results
   */
  printTestResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passedTests = this.testResults.filter(r => r.passed).length;
    const totalTests = this.testResults.length;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.test}: ${result.message}`);
    });
  }

  /**
   * Test admin bypass login flow (for manual testing)
   */
  async testAdminBypassLogin() {
    console.log('🔐 Testing Admin Bypass Login Flow...');
    
    try {
      // This would typically be called from the login component
      const testCredentials = {
        email: 'admin@devinquire.com',
        password: '8763155499Sipu@'
      };
      
      console.log('Test credentials prepared:', testCredentials.email);
      console.log('✅ Admin bypass login test setup complete');
      console.log('💡 To test login, use the credentials in the browser:');
      console.log('   Email: admin@devinquire.com');
      console.log('   Password: 8763155499Sipu@');
      
      return true;
    } catch (error) {
      console.error('❌ Admin bypass login test failed:', error);
      return false;
    }
  }
}

// Export for use in development/testing
export default AdminBypassTester;

// Auto-run tests in development mode
if (process.env.NODE_ENV === 'development') {
  // Run tests after a short delay to ensure services are initialized
  setTimeout(async () => {
    const tester = new AdminBypassTester();
    await tester.runTests();
    await tester.testAdminBypassLogin();
  }, 2000);
}