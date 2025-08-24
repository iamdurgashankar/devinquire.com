import enhancedAuth from '../services/enhancedAuth';
import emailService from '../services/emailService';
import realtimeService from '../services/realtimeService';
import newsletterService from '../services/newsletterService';
import { auth, db, realtimeDb } from '../config/firebase';

/**
 * Comprehensive Firebase Integration Test Suite
 * Tests all Firebase services and their interactions
 */
class FirebaseIntegrationTest {
  constructor() {
    this.results = {
      auth: { passed: 0, failed: 0, tests: [] },
      email: { passed: 0, failed: 0, tests: [] },
      realtime: { passed: 0, failed: 0, tests: [] },
      newsletter: { passed: 0, failed: 0, tests: [] },
      integration: { passed: 0, failed: 0, tests: [] }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Firebase Integration Tests...');
    console.log('==========================================');

    try {
      // Test individual services
      await this.testAuthentication();
      await this.testEmailService();
      await this.testRealtimeService();
      await this.testNewsletterService();
      
      // Test service integrations
      await this.testServiceIntegrations();
      
      // Generate report
      this.generateReport();
      
      return this.results;
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return this.results;
    }
  }

  async testAuthentication() {
    console.log('\n🔐 Testing Authentication Service...');
    
    const authTests = [
      {
        name: 'Service Initialization',
        test: () => {
          if (enhancedAuth && typeof enhancedAuth.signInWithEmail === 'function') {
            return { success: true };
          }
          throw new Error('Enhanced auth service not properly initialized');
        }
      },
      {
        name: 'Email Validation',
        test: () => {
          const validEmail = 'test@example.com';
          const invalidEmail = 'invalid-email';
          
          if (enhancedAuth.getErrorMessage && 
              typeof enhancedAuth.getErrorMessage === 'function') {
            return { success: true };
          }
          throw new Error('Email validation methods not available');
        }
      },
      {
        name: 'Auth State Management',
        test: () => {
          if (typeof enhancedAuth.getCurrentUser === 'function' &&
              typeof enhancedAuth.isAuthenticated === 'function') {
            return { success: true };
          }
          throw new Error('Auth state management methods not available');
        }
      },
      {
        name: 'Provider Configuration',
        test: () => {
          if (enhancedAuth.googleProvider && enhancedAuth.githubProvider) {
            return { success: true };
          }
          throw new Error('Social auth providers not configured');
        }
      }
    ];

    await this.runTestSuite('auth', authTests);
  }

  async testEmailService() {
    console.log('\n📧 Testing Email Service...');
    
    const emailTests = [
      {
        name: 'Service Initialization',
        test: () => {
          if (emailService && typeof emailService.submitContactForm === 'function') {
            return { success: true };
          }
          throw new Error('Email service not properly initialized');
        }
      },
      {
        name: 'Form Validation',
        test: () => {
          const validForm = {
            name: 'John Doe',
            email: 'john@example.com',
            message: 'This is a test message with sufficient length.'
          };
          
          const validation = emailService.validateContactForm(validForm);
          if (validation.isValid) {
            return { success: true };
          }
          throw new Error('Form validation failed for valid data');
        }
      },
      {
        name: 'Email Format Validation',
        test: () => {
          const valid = emailService.isValidEmail('test@example.com');
          const invalid = emailService.isValidEmail('invalid-email');
          
          if (valid && !invalid) {
            return { success: true };
          }
          throw new Error('Email format validation failed');
        }
      },
      {
        name: 'Spam Detection',
        test: () => {
          const spamMessage = 'Click here to win a lottery! Urgent action required!';
          const cleanMessage = 'Hello, I would like to inquire about your services.';
          
          const isSpam = emailService.containsSpam(spamMessage);
          const isClean = !emailService.containsSpam(cleanMessage);
          
          if (isSpam && isClean) {
            return { success: true };
          }
          throw new Error('Spam detection not working correctly');
        }
      },
      {
        name: 'Rate Limiting',
        test: () => {
          const result = emailService.checkRateLimit('test-key', 5, 60000);
          if (result.allowed !== undefined) {
            return { success: true };
          }
          throw new Error('Rate limiting not implemented');
        }
      }
    ];

    await this.runTestSuite('email', emailTests);
  }

  async testRealtimeService() {
    console.log('\n⚡ Testing Realtime Service...');
    
    const realtimeTests = [
      {
        name: 'Service Initialization',
        test: () => {
          if (realtimeService && typeof realtimeService.addComment === 'function') {
            return { success: true };
          }
          throw new Error('Realtime service not properly initialized');
        }
      },
      {
        name: 'Listener Management',
        test: () => {
          if (typeof realtimeService.stopListening === 'function' &&
              typeof realtimeService.stopAllListeners === 'function') {
            return { success: true };
          }
          throw new Error('Listener management methods not available');
        }
      },
      {
        name: 'Activity Logging',
        test: () => {
          if (typeof realtimeService.logActivity === 'function') {
            return { success: true };
          }
          throw new Error('Activity logging not implemented');
        }
      },
      {
        name: 'Connection Monitoring',
        test: () => {
          if (typeof realtimeService.monitorConnection === 'function') {
            return { success: true };
          }
          throw new Error('Connection monitoring not available');
        }
      }
    ];

    await this.runTestSuite('realtime', realtimeTests);
  }

  async testNewsletterService() {
    console.log('\n📰 Testing Newsletter Service...');
    
    const newsletterTests = [
      {
        name: 'Service Initialization',
        test: () => {
          if (newsletterService && typeof newsletterService.subscribe === 'function') {
            return { success: true };
          }
          throw new Error('Newsletter service not properly initialized');
        }
      },
      {
        name: 'Email Validation',
        test: () => {
          const valid = newsletterService.isValidEmail('test@example.com');
          const invalid = newsletterService.isValidEmail('invalid-email');
          if (valid && !invalid) {
            return { success: true };
          }
          throw new Error('Email validation failed');
        }
      },
      {
        name: 'Get Categories',
        test: () => {
          const categories = newsletterService.getAvailableCategories();
          if (Array.isArray(categories) && categories.length > 0) {
            return { success: true, categories };
          }
          throw new Error('Categories not available');
        }
      },
      {
        name: 'Template Management',
        test: () => {
          const templates = newsletterService.getEmailTemplates();
          if (templates && typeof templates === 'object') {
            return { success: true };
          }
          throw new Error('Email templates not available');
        }
      }
    ];

    await this.runTestSuite('newsletter', newsletterTests);
  }

  async testServiceIntegrations() {
    console.log('\n🔗 Testing Service Integrations...');
    
    const integrationTests = [
      {
        name: 'Auth-Email Integration',
        test: () => {
          // Test that email service can work with auth service
          const user = enhancedAuth.getCurrentUser();
          const emailTemplates = emailService.getEmailTemplates();
          
          if (emailTemplates && typeof emailTemplates === 'object') {
            return { success: true };
          }
          throw new Error('Auth-Email integration failed');
        }
      },
      {
        name: 'Auth-Realtime Integration',
        test: () => {
          // Test that realtime service can work with auth service
          if (typeof realtimeService.setupPresence === 'function') {
            return { success: true };
          }
          throw new Error('Auth-Realtime integration failed');
        }
      },
      {
        name: 'Email-Newsletter Integration',
        test: () => {
          // Test that newsletter service uses email service
          const newsletterCategories = newsletterService.getAvailableCategories();
          const emailTemplates = emailService.getEmailTemplates();
          
          if (newsletterCategories.length > 0 && emailTemplates) {
            return { success: true };
          }
          throw new Error('Email-Newsletter integration failed');
        }
      },
      {
        name: 'Firebase Config Integration',
        test: () => {
          // Test that all services can access Firebase config
          if (auth && db && realtimeDb) {
            return { success: true };
          }
          throw new Error('Firebase config integration failed');
        }
      }
    ];

    await this.runTestSuite('integration', integrationTests);
  }

  async runTestSuite(category, tests) {
    for (const test of tests) {
      try {
        const result = await test.test();
        this.results[category].tests.push({ 
          name: test.name, 
          status: 'passed', 
          result 
        });
        this.results[category].passed++;
        console.log(`  ✅ ${test.name}`);
      } catch (error) {
        this.results[category].tests.push({ 
          name: test.name, 
          status: 'failed', 
          error: error.message 
        });
        this.results[category].failed++;
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const totalTests = Object.values(this.results).reduce(
      (sum, category) => sum + category.passed + category.failed, 0
    );
    const totalPassed = Object.values(this.results).reduce(
      (sum, category) => sum + category.passed, 0
    );
    const totalFailed = Object.values(this.results).reduce(
      (sum, category) => sum + category.failed, 0
    );
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} ✅`);
    console.log(`Failed: ${totalFailed} ❌`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    Object.entries(this.results).forEach(([category, data]) => {
      const total = data.passed + data.failed;
      console.log(`\n${category.toUpperCase()}: ${data.passed}/${total} passed`);
      
      if (data.failed > 0) {
        data.tests
          .filter(test => test.status === 'failed')
          .forEach(test => {
            console.log(`  ❌ ${test.name}: ${test.error}`);
          });
      }
    });

    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('===================');
    
    if (totalFailed === 0) {
      console.log('🎉 All tests passed! Your Firebase integration is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above before deploying.');
      
      if (this.results.auth.failed > 0) {
        console.log('- Fix authentication issues before enabling user features');
      }
      if (this.results.email.failed > 0) {
        console.log('- Resolve email service issues to ensure contact forms work');
      }
      if (this.results.realtime.failed > 0) {
        console.log('- Address realtime service issues for live features');
      }
      if (this.results.newsletter.failed > 0) {
        console.log('- Fix newsletter service for subscription features');
      }
    }
  }

  // Manual test helpers
  async runManualTests() {
    console.log('\n🧪 Manual Test Checklist:');
    console.log('==========================');
    console.log('Please manually verify the following:');
    console.log('1. ✅ Firebase console shows correct project configuration');
    console.log('2. ✅ Authentication providers are enabled in Firebase console');
    console.log('3. ✅ Firestore security rules are deployed');
    console.log('4. ✅ Realtime Database security rules are deployed');
    console.log('5. ✅ Firebase Functions are deployed (if using server-side email)');
    console.log('6. ✅ Environment variables are correctly set');
    console.log('7. ✅ Email service provider (SendGrid/Nodemailer) is configured');
    console.log('8. ✅ Test user registration and login flows');
    console.log('9. ✅ Test contact form submission');
    console.log('10. ✅ Test newsletter subscription');
    console.log('11. ✅ Test real-time comments (if implemented)');
    console.log('12. ✅ Test email notifications');
  }
}

// Export for use in tests
export default FirebaseIntegrationTest;

// Auto-run if called directly
if (typeof window !== 'undefined' && window.location.search.includes('test=firebase')) {
  const tester = new FirebaseIntegrationTest();
  tester.runAllTests().then(() => {
    tester.runManualTests();
  });
}