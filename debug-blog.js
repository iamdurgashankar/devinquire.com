// Debug script for blog functionality
console.log("=== Blog Debug Script ===");

// Check if API service is available
function checkApiService() {
  console.log("1. Checking API service...");

  // Check if apiService is available
  if (typeof window !== "undefined" && window.apiService) {
    console.log("✓ API service found in window object");
    return window.apiService;
  }

  // Try to find apiService in React components
  console.log("⚠ API service not found in window object");
  return null;
}

// Check localStorage state
function checkLocalStorage() {
  console.log("2. Checking localStorage...");

  const db = localStorage.getItem("devinquireDB");
  if (db) {
    const parsedDb = JSON.parse(db);
    console.log("✓ Database found in localStorage");
    console.log("  - Users:", parsedDb.users?.length || 0);
    console.log("  - Posts:", parsedDb.posts?.length || 0);
    console.log("  - Pending Users:", parsedDb.pendingUsers?.length || 0);
    return parsedDb;
  } else {
    console.log("✗ No database found in localStorage");
    return null;
  }
}

// Test blog post creation
async function testBlogCreation() {
  console.log("3. Testing blog post creation...");

  const apiService = checkApiService();
  if (!apiService) {
    console.log("✗ Cannot test blog creation - API service not available");
    return;
  }

  try {
    const testPostData = {
      title: "Debug Test Post",
      excerpt: "This is a test post for debugging.",
      content:
        "This is the content of the debug test post. It should help us identify any issues with the blog functionality.",
      category: "Web Development",
      tags: ["debug", "test", "blog"],
      featured_image:
        "https://via.placeholder.com/400x300/FF0000/FFFFFF?text=Debug",
      status: "published",
      author_name: "Debug User",
      readTime: "2 min read",
    };

    console.log("Creating test post with data:", testPostData);

    const result = await apiService.createPost(testPostData);
    console.log("✓ Blog post creation result:", result);

    if (result.success) {
      console.log("✓ Post created successfully!");

      // Test getting posts
      const postsResult = await apiService.getPosts();
      console.log("✓ Posts retrieval result:", postsResult);
    } else {
      console.log("✗ Post creation failed:", result.message);
    }
  } catch (error) {
    console.error("✗ Error during blog creation test:", error);
  }
}

// Check current user
function checkCurrentUser() {
  console.log("4. Checking current user...");

  const authToken = localStorage.getItem("authToken");
  const currentUserEmail = localStorage.getItem("currentUserEmail");

  console.log("  - Auth Token:", authToken ? "Present" : "Missing");
  console.log("  - Current User Email:", currentUserEmail || "Not set");

  if (authToken && currentUserEmail) {
    console.log("✓ User appears to be logged in");
  } else {
    console.log("⚠ User may not be logged in");
  }
}

// Check API availability
async function checkApiAvailability() {
  console.log("5. Checking API availability...");

  const apiService = checkApiService();
  if (!apiService) {
    console.log("✗ Cannot check API availability - API service not available");
    return;
  }

  try {
    const isAvailable = await apiService.checkApiAvailability();
    console.log("✓ API availability check result:", isAvailable);

    if (isAvailable) {
      console.log("✓ PHP backend is available");
    } else {
      console.log("⚠ PHP backend not available, will use localStorage");
    }
  } catch (error) {
    console.error("✗ Error checking API availability:", error);
  }
}

// Main debug function
async function runDebug() {
  console.log("Starting blog debug...\n");

  checkLocalStorage();
  console.log("");

  checkCurrentUser();
  console.log("");

  await checkApiAvailability();
  console.log("");

  await testBlogCreation();
  console.log("");

  console.log("=== Debug Complete ===");
  console.log("Check the console for any error messages or issues.");
}

// Auto-run debug when script is loaded
if (typeof window !== "undefined") {
  // Wait a bit for the app to load
  setTimeout(runDebug, 2000);

  // Also make it available globally
  window.debugBlog = runDebug;
  console.log("Debug function available as window.debugBlog()");
}

// Export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    runDebug,
    checkApiService,
    checkLocalStorage,
    testBlogCreation,
  };
}
