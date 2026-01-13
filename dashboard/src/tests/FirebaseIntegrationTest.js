/**
 * Firebase Integration Test Suite
 * Tests Firebase initialization and service integration
 */

import { 
  getDatabase, 
  isDatabaseReady, 
  waitForFirebaseInit,
  isFirebaseConfigured,
  getFirebaseInitializationStatus 
} from '../config/firebase';
import schedulingService from '../services/schedulingService';
import crossDomainSyncService from '../services/crossDomainSyncService';

class FirebaseIntegrationTest {
  constructor() {
    this.testResults = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Run all Firebase integration tests
   */
  async runAllTests() {
    console.group('🔥 Firebase Integration Tests');
    
    try {
      await this.testFirebaseInitialization();
      await this.testDatabaseAccess();
      await this.testSchedulingServiceIntegration();
      await this.testCrossDomainSyncIntegration();
      
      this.printResults();
    } catch (error) {
      console.error('Test suite failed:', error);
    }
    
    console.groupEnd();
    return this.getTestSummary();
  }

  /**
   * Test Firebase initialization
   */
  async testFirebaseInitialization() {
    console.log('Testing Firebase initialization...');
    
    try {
      // Test configuration check
      const isConfigured = isFirebaseConfigured();
      this.addTest('Firebase Configuration', isConfigured, 'Firebase should be properly configured');
      
      // Test initialization status
      const status = getFirebaseInitializationStatus();
      this.addTest('Firebase Initialization Status', status.initialized, 'Firebase should be initialized');
      
      // Test waiting for initialization
      await waitForFirebaseInit();
      this.addTest('Wait for Firebase Init', true, 'Should wait for Firebase initialization');
      
    } catch (error) {
      this.addTest('Firebase Initialization', false, `Failed: ${error.message}`);
    }
  }

  /**
   * Test database access
   */
  async testDatabaseAccess() {
    console.log('Testing database access...');
    
    try {
      // Test database ready check
      const isReady = isDatabaseReady();
      this.addTest('Database Ready Check', isReady, 'Database should be ready');
      
      // Test safe database getter
      const db = getDatabase();
      this.addTest('Safe Database Getter', !!db, 'Should return valid database instance');
      
    } catch (error) {
      this.addTest('Database Access', false, `Failed: ${error.message}`);
    }
  }

  /**
   * Test scheduling service integration
   */
  async testSchedulingServiceIntegration() {
    console.log('Testing scheduling service integration...');
    
    try {
      // Test service initialization
      await schedulingService.start();
      this.addTest('Scheduling Service Start', true, 'Should start without errors');
      
      // Test getting scheduled posts
      const scheduledPosts = schedulingService.getScheduledPosts();
      this.addTest('Get Scheduled Posts', Array.isArray(scheduledPosts), 'Should return array of scheduled posts');
      
    } catch (error) {
      this.addTest('Scheduling Service Integration', false, `Failed: ${error.message}`);
    }
  }

  /**
   * Test cross-domain sync service integration
   */
  async testCrossDomainSyncIntegration() {
    console.log('Testing cross-domain sync service integration...');
    
    try {
      // Test service initialization
      await crossDomainSyncService.initialize();
      this.addTest('Cross-Domain Sync Initialize', true, 'Should initialize without errors');
      
    } catch (error) {
      this.addTest('Cross-Domain Sync Integration', false, `Failed: ${error.message}`);
    }
  }

  /**
   * Add test result
   */
  addTest(name, passed, description) {
    const result = {
      name,
      passed,
      description,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    if (passed) {
      this.passed++;
      console.log(`✅ ${name}: ${description}`);
    } else {
      this.failed++;
      console.error(`❌ ${name}: ${description}`);
    }
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.description}`);
        });
    }
  }

  /**
   * Get test summary
   */
  getTestSummary() {
    return {
      total: this.testResults.length,
      passed: this.passed,
      failed: this.failed,
      successRate: (this.passed / this.testResults.length) * 100,
      results: this.testResults
    };
  }
}

// Export test instance
const firebaseIntegrationTest = new FirebaseIntegrationTest();
export default firebaseIntegrationTest;

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  // Run tests after a short delay to ensure Firebase is initialized
  setTimeout(() => {
    firebaseIntegrationTest.runAllTests();
  }, 3000);
}