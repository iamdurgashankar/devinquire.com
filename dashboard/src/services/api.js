import { USE_FIREBASE_ONLY } from "../config";
import firebaseApiService from "./firebaseApiService";
import { isFirebaseConfigured } from "../config/firebase";

class ApiService {
  constructor() {
    // Try to get token from session management service, fallback to localStorage
    this.token = null;
    try {
      import('./sessionManagementService.js')
        .then(({ default: sessionManagementService }) => {
          const sessionData = sessionManagementService.getSessionData();
          this.token = sessionData?.authToken || null;
        })
        .catch(() => {
          // Fallback to direct localStorage if session service unavailable
          this.token = localStorage.getItem("authToken");
        });
    } catch (error) {
      this.token = localStorage.getItem("authToken");
    }
    
    this.useFirebase = true; // Always use Firebase

    // Ensure Firebase is configured
    if (!isFirebaseConfigured()) {
      console.error("Firebase is not configured. Please check your Firebase configuration.");
      throw new Error("Firebase configuration is required");
    }

    console.log("API Service initialized with Firebase backend only");
  }

  setToken(token) {
    this.token = token;
    
    // Use session management service for token storage
    if (token) {
      import('./sessionManagementService.js')
        .then(({ default: sessionManagementService }) => {
          sessionManagementService.storeSessionData({ authToken: token });
        })
        .catch(() => {
          // Fallback to direct localStorage if session service unavailable
          localStorage.setItem("authToken", token);
        });
    } else {
      import('./sessionManagementService.js')
        .then(({ default: sessionManagementService }) => {
          sessionManagementService.clearSessionData();
        })
        .catch(() => {
          // Fallback to direct localStorage if session service unavailable
          localStorage.removeItem("authToken");
        });
    }

    // Also set token for Firebase service
    if (this.useFirebase) {
      firebaseApiService.setToken(token);
    }
  }

  // Helper method to check if API is available
  async checkApiAvailability() {
    try {
      return await firebaseApiService.checkApiAvailability();
    } catch (error) {
      console.warn("Firebase API availability check failed:", error);
      return false;
    }
  }

  // Get current user session
  async getCurrentUser() {
    try {
      const result = await firebaseApiService.getCurrentUser();
      return result;
    } catch (error) {
      console.error("Get current user error:", error);
      return {
        loggedIn: false,
        user: null,
        error: error.message,
        success: false,
      };
    }
  }

  // Get all users (admin)
  async getAllUsers() {
    try {
      return await firebaseApiService.getAllUsers();
    } catch (error) {
      console.error("Get all users error:", error);
      return { success: false, error: error.message };
    }
  }

  // Delete user (admin)
  async deleteUser(userId) {
    try {
      if (!userId) {
        return { success: false, error: "User ID is required" };
      }

      return await firebaseApiService.deleteUser(userId);
    } catch (error) {
      console.error("Delete user error:", error);
      return { success: false, error: error.message };
    }
  }

  // Update profile
  async updateProfile(profileData) {
    try {
      if (!profileData || typeof profileData !== "object") {
        return { success: false, error: "Profile data is required" };
      }

      return await firebaseApiService.updateProfile(profileData);
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get pending users (admin)
  async getPendingUsers() {
    try {
      return await firebaseApiService.getPendingUsers();
    } catch (error) {
      console.error("Get pending users error:", error);
      return { success: false, error: error.message };
    }
  }

  // Approve user (admin)
  async approveUser(userId) {
    try {
      return await firebaseApiService.approveUser(userId);
    } catch (error) {
      console.error("Approve user error:", error);
      return { success: false, error: error.message };
    }
  }

  // Reject user (admin)
  async rejectUser(userId) {
    try {
      return await firebaseApiService.rejectUser(userId);
    } catch (error) {
      console.error("Reject user error:", error);
      return { success: false, error: error.message };
    }
  }

  // Update user role (admin)
  async updateUserRole(userId, newRole) {
    try {
      return await firebaseApiService.updateUserRole(userId, newRole);
    } catch (error) {
      console.error("Update user role error:", error);
      return { success: false, error: error.message };
    }
  }

  // Posts
  async getPosts(page = 1, limit = 10, category = null, status = null) {
    try {
      return await firebaseApiService.getPosts(page, limit, category, status);
    } catch (error) {
      console.error("Get posts error:", error);
      return { success: false, error: error.message };
    }
  }

  async getPost(id) {
    try {
      return await firebaseApiService.getPost(id);
    } catch (error) {
      console.error("Get post error:", error);
      return { success: false, error: error.message };
    }
  }

  async createPost(postData) {
    try {
      if (!postData || !postData.title) {
        return { success: false, error: "Post title is required" };
      }

      return await firebaseApiService.createPost(postData);
    } catch (error) {
      console.error("Create post error:", error);
      return { success: false, error: error.message };
    }
  }

  async updatePost(id, postData) {
    try {
      if (!id) {
        return { success: false, error: "Post ID is required" };
      }

      if (!postData || typeof postData !== "object") {
        return { success: false, error: "Post data is required" };
      }

      return await firebaseApiService.updatePost(id, postData);
    } catch (error) {
      console.error("Update post error:", error);
      return { success: false, error: error.message };
    }
  }

  async deletePost(id) {
    try {
      return await firebaseApiService.deletePost(id);
    } catch (error) {
      console.error("Delete post error:", error);
      return { success: false, error: error.message };
    }
  }

  // Permanently delete a post
  async permanentDeletePost(id) {
    try {
      return await firebaseApiService.permanentDeletePost(id);
    } catch (error) {
      console.error("Permanent delete post error:", error);
      return { success: false, error: error.message };
    }
  }

  // Image upload (enhanced with Firebase)
  async uploadImage(file) {
    try {
      if (!file) {
        return { success: false, error: "File is required" };
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error:
            "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
        };
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        return {
          success: false,
          error: "File size too large. Maximum size is 5MB.",
        };
      }

      return await firebaseApiService.uploadImage(file);
    } catch (error) {
      console.error("Upload image error:", error);
      return { success: false, error: error.message };
    }
  }

  // Dashboard stats (enhanced with real data)
  async getDashboardStats() {
    try {
      return await firebaseApiService.getDashboardStats();
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      return {
        success: true, // Return success with default values to prevent UI errors
        data: {
          totalPosts: 0,
          recentPosts: 0,
          totalViews: "0",
          totalUsers: 0,
          pendingUsers: 0,
          categories: {},
          recentActivity: [],
        },
      };
    }
  }

  // Email notifications
  async getEmailNotifications() {
    try {
      return await firebaseApiService.getEmailNotifications();
    } catch (error) {
      console.error("Get email notifications error:", error);
      return { success: false, error: error.message };
    }
  }
  // Get page management methods
  async getPages(page = 1, limit = 10, status = null) {
    try {
      return await firebaseApiService.getPages(page, limit, status);
    } catch (error) {
      console.error("Get pages error:", error);
      return { success: false, error: error.message };
    }
  }

  async getPage(id) {
    try {
      return await firebaseApiService.getPage(id);
    } catch (error) {
      console.error("Get page error:", error);
      return { success: false, error: error.message };
    }
  }

  async createPage(pageData) {
    try {
      if (!pageData || !pageData.title) {
        return { success: false, error: "Page title is required" };
      }

      return await firebaseApiService.createPage(pageData);
    } catch (error) {
      console.error("Create page error:", error);
      return { success: false, error: error.message };
    }
  }

  async updatePage(id, pageData) {
    try {
      if (!id) {
        return { success: false, error: "Page ID is required" };
      }

      if (!pageData || typeof pageData !== "object") {
        return { success: false, error: "Page data is required" };
      }

      return await firebaseApiService.updatePage(id, pageData);
    } catch (error) {
      console.error("Update page error:", error);
      return { success: false, error: error.message };
    }
  }

  async deletePage(id) {
    try {
      return await firebaseApiService.deletePage(id);
    } catch (error) {
      console.error("Delete page error:", error);
      return { success: false, error: error.message };
    }
  }

  async savePageOrder(order) {
    try {
      return await firebaseApiService.savePageOrder(order);
    } catch (error) {
      console.error("Save page order error:", error);
      return { success: false, error: error.message };
    }
  }

  // User activity log
  async getUserActivityLog(userId) {
    try {
      return await firebaseApiService.getUserActivityLog(userId);
    } catch (error) {
      console.error("Get user activity log error:", error);
      return { success: false, error: error.message };
    }
  }
  // User preferences
  async getUserPreferences(userId) {
    try {
      return await firebaseApiService.getUserPreferences(userId);
    } catch (error) {
      console.error("Get user preferences error:", error);
      return { success: false, error: error.message };
    }
  }
  async updateUserPreferences(userId, preferences) {
    try {
      return await firebaseApiService.updateUserPreferences(
        userId,
        preferences
      );
    } catch (error) {
      console.error("Update user preferences error:", error);
      return { success: false, error: error.message };
    }
  }

  // Page Management Methods
  async getPages(options = {}) {
    try {
      return await firebaseApiService.getPages(options);
    } catch (error) {
      console.error("Get pages error:", error);
      return { success: false, error: error.message };
    }
  }

  async getPage(pageId) {
    try {
      if (!pageId) {
        return { success: false, error: "Page ID is required" };
      }

      return await firebaseApiService.getPage(pageId);
    } catch (error) {
      console.error("Get page error:", error);
      return { success: false, error: error.message };
    }
  }

  async createPage(pageData) {
    try {
      if (!pageData || !pageData.title) {
        return { success: false, error: "Page title is required" };
      }

      return await firebaseApiService.createPage(pageData);
    } catch (error) {
      console.error("Create page error:", error);
      return { success: false, error: error.message };
    }
  }

  async updatePage(pageId, pageData) {
    try {
      if (!pageId) {
        return { success: false, error: "Page ID is required" };
      }

      return await firebaseApiService.updatePage(pageId, pageData);
    } catch (error) {
      console.error("Update page error:", error);
      return { success: false, error: error.message };
    }
  }

  async deletePage(pageId) {
    try {
      if (!pageId) {
        return { success: false, error: "Page ID is required" };
      }

      return await firebaseApiService.deletePage(pageId);
    } catch (error) {
      console.error("Delete page error:", error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced error handling for fetch requests
  async _makeRequest(url, options = {}) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: options.credentials || "include",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  }

  // Utility method to validate required parameters
  _validateRequired(params, requiredFields) {
    const missing = requiredFields.filter((field) => !params[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
  }

  // Get service status
  getStatus() {
    return {
      useFirebase: this.useFirebase,
      hasToken: !!this.token,
      isOnline: navigator.onLine,
      backend: this.useFirebase ? "Firebase" : "PHP",
    };
  }
}

// Create singleton instance
const apiService = new ApiService();

// Expose to window for debugging purposes
if (typeof window !== "undefined") {
  window.apiService = apiService;
}

export default apiService;

// Export specific methods for direct import
export const {
  getCurrentUser,
  getAllUsers,
  deleteUser,
  updateProfile,
  getPendingUsers,
  approveUser,
  rejectUser,
  getUserActivityLog,
  createPost,
  updatePost,
  deletePost,
  getPost,
  getPosts,
  savePageOrder,
} = apiService;
