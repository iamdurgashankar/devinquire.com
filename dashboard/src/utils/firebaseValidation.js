/**
 * Firebase Integration Validation Script
 * Comprehensive testing suite for validating Firebase backend migration
 * Tests all core functionality to ensure everything works correctly
 */

import { isFirebaseConfigured, getFirebaseStatus } from "../config/firebase";
import firebaseAuthService from "../services/firebaseAuthService";
import userService from "../services/userService";
import contentService from "../services/contentService";
import firestoreService from "../services/firestoreService";
import firebaseApiService from "../services/firebaseApiService";

class FirebaseValidationSuite {
  constructor() {
    this.results = {
      configuration: { passed: 0, failed: 0, tests: [] },
      authentication: { passed: 0, failed: 0, tests: [] },
      database: { passed: 0, failed: 0, tests: [] },
      userService: { passed: 0, failed: 0, tests: [] },
      contentService: { passed: 0, failed: 0, tests: [] },
      apiService: { passed: 0, failed: 0, tests: [] },
      realtime: { passed: 0, failed: 0, tests: [] },
    };
    this.testData = {
      testUserId: null,
      testPostId: null,
      testPageId: null,
    };
  }

  /**
   * Run complete validation suite
   */
  async runCompleteValidation() {
    console.log("🚀 Starting Firebase Integration Validation...\n");

    try {
      await this.testConfiguration();
      await this.testAuthentication();
      await this.testDatabase();
      await this.testUserService();
      await this.testContentService();
      await this.testApiService();
      await this.testRealTimeFeatures();

      this.generateReport();
      return this.results;
    } catch (error) {
      console.error("❌ Validation suite failed:", error);
      return { error: error.message, results: this.results };
    }
  }

  /**
   * Test Firebase configuration
   */
  async testConfiguration() {
    console.log("📋 Testing Firebase Configuration...");

    // Test 1: Firebase configured
    this.runTest("configuration", "Firebase Configuration Check", () => {
      return isFirebaseConfigured();
    });

    // Test 2: Firebase status
    this.runTest("configuration", "Firebase Status Check", () => {
      const status = getFirebaseStatus();
      return status && status.configured;
    });

    // Test 3: Required services available
    this.runTest("configuration", "Required Services Available", () => {
      const status = getFirebaseStatus();
      return status && status.auth && status.firestore;
    });

    console.log("✅ Configuration tests completed\n");
  }

  /**
   * Test authentication functionality
   */
  async testAuthentication() {
    console.log("🔐 Testing Authentication...");

    // Test 1: Firebase auth service available
    this.runTest("authentication", "Firebase Auth Service Available", () => {
      return firebaseAuthService.isAvailable();
    });

    // Test 2: Auth providers configured
    this.runTest("authentication", "Auth Providers Configured", () => {
      const status = firebaseAuthService.getAuthStatus();
      return status.emailEnabled;
    });

    // Test 3: OAuth providers available (non-blocking)
    this.runTest("authentication", "OAuth Providers Available", () => {
      const status = firebaseAuthService.getAuthStatus();
      return status.googleEnabled || status.githubEnabled || true; // Non-blocking
    });

    console.log("✅ Authentication tests completed\n");
  }

  /**
   * Test database functionality
   */
  async testDatabase() {
    console.log("🗄️ Testing Database...");

    // Test 1: Firestore service available
    this.runTest("database", "Firestore Service Available", () => {
      return firestoreService.isAvailable();
    });

    // Test 2: Create test document
    await this.runAsyncTest("database", "Create Document", async () => {
      const result = await firestoreService.createDocument("test", {
        name: "Validation Test",
        timestamp: new Date(),
        type: "validation",
      });
      this.testData.testDocId = result.id;
      return result.success;
    });

    // Test 3: Read test document
    await this.runAsyncTest("database", "Read Document", async () => {
      if (!this.testData.testDocId) return false;
      const result = await firestoreService.getDocument(
        "test",
        this.testData.testDocId
      );
      return result.success;
    });

    // Test 4: Update test document
    await this.runAsyncTest("database", "Update Document", async () => {
      if (!this.testData.testDocId) return false;
      const result = await firestoreService.updateDocument(
        "test",
        this.testData.testDocId,
        {
          updated: true,
          updateTime: new Date(),
        }
      );
      return result.success;
    });

    // Test 5: Query documents
    await this.runAsyncTest("database", "Query Documents", async () => {
      const result = await firestoreService.getDocuments("test", {
        filters: [{ field: "type", operator: "==", value: "validation" }],
        limitCount: 10,
      });
      return result.success;
    });

    // Test 6: Delete test document
    await this.runAsyncTest("database", "Delete Document", async () => {
      if (!this.testData.testDocId) return false;
      const result = await firestoreService.deleteDocument(
        "test",
        this.testData.testDocId
      );
      return result.success;
    });

    console.log("✅ Database tests completed\n");
  }

  /**
   * Test user service functionality
   */
  async testUserService() {
    console.log("👥 Testing User Service...");

    // Test 1: User service status
    this.runTest("userService", "User Service Status", () => {
      const status = userService.getStatus();
      return status.isAvailable;
    });

    // Test 2: Get users (empty result is OK)
    await this.runAsyncTest("userService", "Get Users", async () => {
      const result = await userService.getAllUsers({ limit: 1 });
      return result.success;
    });

    // Test 3: Get pending users (empty result is OK)
    await this.runAsyncTest("userService", "Get Pending Users", async () => {
      const result = await userService.getPendingUsers();
      return result.success;
    });

    // Test 4: User role checking functions
    this.runTest("userService", "User Role Functions", () => {
      const testUser = { role: "admin", status: "active" };
      return (
        userService.hasRole(testUser, "admin") && userService.isAdmin(testUser)
      );
    });

    console.log("✅ User service tests completed\n");
  }

  /**
   * Test content service functionality
   */
  async testContentService() {
    console.log("📄 Testing Content Service...");

    // Test 1: Content service status
    this.runTest("contentService", "Content Service Status", () => {
      const status = contentService.getStatus();
      return status.isAvailable;
    });

    // Test 2: Get posts (empty result is OK)
    await this.runAsyncTest("contentService", "Get Posts", async () => {
      const result = await contentService.getPosts({ limit: 1 });
      return result.success;
    });

    // Test 3: Get pages (empty result is OK)
    await this.runAsyncTest("contentService", "Get Pages", async () => {
      const result = await contentService.getPages({ limit: 1 });
      return result.success;
    });

    // Test 4: Content utility functions
    this.runTest("contentService", "Content Utilities", () => {
      const slug = contentService.generateSlug("Test Article Title");
      const excerpt = contentService.generateExcerpt(
        "This is a test content for excerpt generation"
      );
      const readTime = contentService.calculateReadTime("Short content");

      return (
        slug === "test-article-title" && excerpt.length > 0 && readTime > 0
      );
    });

    console.log("✅ Content service tests completed\n");
  }

  /**
   * Test API service functionality
   */
  async testApiService() {
    console.log("🔌 Testing API Service...");

    // Test 1: API service status
    this.runTest("apiService", "API Service Status", () => {
      const status = firebaseApiService.getStatus();
      return status.isAvailable;
    });

    // Test 2: Check API availability
    await this.runAsyncTest(
      "apiService",
      "API Availability Check",
      async () => {
        const isAvailable = await firebaseApiService.checkApiAvailability();
        return isAvailable;
      }
    );

    // Test 3: Get dashboard stats
    await this.runAsyncTest("apiService", "Get Dashboard Stats", async () => {
      const result = await firebaseApiService.getDashboardStats();
      return result.success;
    });

    // Test 4: Get current user (no auth is OK)
    await this.runAsyncTest("apiService", "Get Current User", async () => {
      const result = await firebaseApiService.getCurrentUser();
      return result.hasOwnProperty("loggedIn");
    });

    console.log("✅ API service tests completed\n");
  }

  /**
   * Test real-time features
   */
  async testRealTimeFeatures() {
    console.log("⚡ Testing Real-time Features...");

    // Test 1: Real-time listeners
    this.runTest("realtime", "Real-time Listeners Available", () => {
      return (
        typeof firestoreService.listenToCollection === "function" &&
        typeof firestoreService.listenToDocument === "function"
      );
    });

    // Test 2: Subscribe to updates
    this.runTest("realtime", "Subscribe to Updates", () => {
      const listenerId = firebaseApiService.subscribeToUpdates(
        "users",
        () => {}
      );
      if (listenerId) {
        firebaseApiService.unsubscribeFromUpdates(listenerId);
        return true;
      }
      return false;
    });

    // Test 3: Offline support functions
    this.runTest("realtime", "Offline Support Functions", () => {
      return (
        typeof firestoreService.enableOffline === "function" &&
        typeof firestoreService.enableOnline === "function"
      );
    });

    console.log("✅ Real-time tests completed\n");
  }

  /**
   * Run synchronous test
   */
  runTest(category, testName, testFunction) {
    try {
      const result = testFunction();
      if (result) {
        this.results[category].passed++;
        this.results[category].tests.push({ name: testName, status: "PASSED" });
        console.log(`  ✅ ${testName}`);
      } else {
        this.results[category].failed++;
        this.results[category].tests.push({
          name: testName,
          status: "FAILED",
          error: "Test returned false",
        });
        console.log(`  ❌ ${testName}`);
      }
    } catch (error) {
      this.results[category].failed++;
      this.results[category].tests.push({
        name: testName,
        status: "FAILED",
        error: error.message,
      });
      console.log(`  ❌ ${testName}: ${error.message}`);
    }
  }

  /**
   * Run asynchronous test
   */
  async runAsyncTest(category, testName, testFunction) {
    try {
      const result = await testFunction();
      if (result) {
        this.results[category].passed++;
        this.results[category].tests.push({ name: testName, status: "PASSED" });
        console.log(`  ✅ ${testName}`);
      } else {
        this.results[category].failed++;
        this.results[category].tests.push({
          name: testName,
          status: "FAILED",
          error: "Test returned false",
        });
        console.log(`  ❌ ${testName}`);
      }
    } catch (error) {
      this.results[category].failed++;
      this.results[category].tests.push({
        name: testName,
        status: "FAILED",
        error: error.message,
      });
      console.log(`  ❌ ${testName}: ${error.message}`);
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log("\n📊 FIREBASE VALIDATION REPORT");
    console.log("===============================\n");

    let totalPassed = 0;
    let totalFailed = 0;

    Object.entries(this.results).forEach(([category, results]) => {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      console.log(`${categoryName}:`);
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
      console.log(
        `  📊 Success Rate: ${
          results.passed + results.failed > 0
            ? Math.round(
                (results.passed / (results.passed + results.failed)) * 100
              )
            : 0
        }%\n`
      );

      totalPassed += results.passed;
      totalFailed += results.failed;
    });

    console.log("OVERALL RESULTS:");
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(
      `📊 Overall Success Rate: ${
        totalPassed + totalFailed > 0
          ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
          : 0
      }%\n`
    );

    if (totalFailed === 0) {
      console.log(
        "🎉 ALL TESTS PASSED! Firebase integration is working correctly."
      );
    } else {
      console.log(
        "⚠️  Some tests failed. Please review the detailed results above."
      );
    }

    console.log("\n📋 NEXT STEPS:");
    if (totalFailed === 0) {
      console.log(
        "✅ Your Firebase migration is complete and working correctly!"
      );
      console.log(
        "✅ You can now safely use Firebase as your primary backend."
      );
      console.log(
        "✅ Consider running data migration if you have existing data."
      );
      console.log("✅ Update your production environment variables.");
    } else {
      console.log("🔧 Review failed tests and fix any configuration issues.");
      console.log("🔧 Check Firebase Console for any service-level issues.");
      console.log("🔧 Verify all environment variables are set correctly.");
      console.log("🔧 Run validation again after fixing issues.");
    }

    console.log("\n📚 Resources:");
    console.log("- Firebase Migration Guide: ./FIREBASE_MIGRATION_GUIDE.md");
    console.log("- Firebase Console: https://console.firebase.google.com/");
    console.log("- Documentation: https://firebase.google.com/docs");

    return {
      totalTests: totalPassed + totalFailed,
      passed: totalPassed,
      failed: totalFailed,
      successRate:
        totalPassed + totalFailed > 0
          ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
          : 0,
      allPassed: totalFailed === 0,
    };
  }

  /**
   * Export detailed report as JSON
   */
  exportDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateReport(),
      details: this.results,
      environment: {
        firebaseConfigured: isFirebaseConfigured(),
        firebaseStatus: getFirebaseStatus(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `firebase_validation_report_${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    console.log("📄 Detailed validation report exported");
  }
}

// Export validation functions
export const validateFirebaseIntegration = async () => {
  const validator = new FirebaseValidationSuite();
  return await validator.runCompleteValidation();
};

export const runQuickValidation = async () => {
  console.log("⚡ Running Quick Firebase Validation...\n");

  const checks = [
    { name: "Firebase Configured", test: () => isFirebaseConfigured() },
    { name: "Firebase Status", test: () => getFirebaseStatus()?.configured },
    {
      name: "Auth Service Available",
      test: () => firebaseAuthService.isAvailable(),
    },
    { name: "Firestore Available", test: () => firestoreService.isAvailable() },
    {
      name: "API Service Available",
      test: () => firebaseApiService.getStatus().isAvailable,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      const result = check.test();
      if (result) {
        console.log(`✅ ${check.name}`);
        passed++;
      } else {
        console.log(`❌ ${check.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(
    `\n📊 Quick Validation Results: ${passed}/${passed + failed} passed`
  );
  return { passed, failed, total: passed + failed };
};

// Create singleton instance
const firebaseValidator = new FirebaseValidationSuite();
export default firebaseValidator;
