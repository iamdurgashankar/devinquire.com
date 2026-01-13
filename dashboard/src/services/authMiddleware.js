/**
 * Authentication and Authorization Middleware for Blog Operations
 * Provides secure access control for blog management functions
 */

import { jwtDecode } from "jwt-decode";

class AuthMiddleware {
  constructor() {
    this.token = null;
    this.user = null;
    this.permissions = new Map();
    this.sessionTimeout = null;
    this.refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
    this.initialize();
  }

  /**
   * Initialize middleware with stored authentication
   */
  initialize() {
    try {
      this.token = localStorage.getItem("authToken");
      const userData = localStorage.getItem("userData");

      if (this.token && userData) {
        this.user = JSON.parse(userData);
        this.validateToken();
        this.setupAutoRefresh();
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      this.clearAuth();
    }
  }

  /**
   * Authenticate user with credentials
   */
  async authenticate(credentials) {
    try {
      // In a real implementation, this would make an API call
      const response = await this.simulateLogin(credentials);

      if (response.success) {
        this.setAuth(response.token, response.user);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  }

  /**
   * Simulate login for demo purposes
   */
  async simulateLogin(credentials) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock authentication logic
    if (credentials.email && credentials.password) {
      const mockUser = {
        id: "1",
        email: credentials.email,
        displayName: credentials.email.split("@")[0],
        role: "admin",
        permissions: [
          "blog:create",
          "blog:read",
          "blog:update",
          "blog:delete",
          "blog:publish",
        ],
        avatar: null,
      };

      const mockToken = this.generateMockToken(mockUser);

      return {
        success: true,
        token: mockToken,
        user: mockUser,
      };
    }

    return {
      success: false,
      message: "Invalid credentials",
    };
  }

  /**
   * Generate mock JWT token for demo
   */
  generateMockToken(user) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
        iat: Math.floor(Date.now() / 1000),
      })
    );
    const signature = btoa("mock-signature");

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Set authentication data
   */
  setAuth(token, user) {
    this.token = token;
    this.user = user;

    // Store through session management service to avoid conflicts
    try {
      import('./sessionManagementService').then(({ default: sessionManagementService }) => {
        sessionManagementService.storeSessionData('traditional', user, { access_token: token });
      }).catch(() => {
        // Fallback to direct storage if import fails
        localStorage.setItem("authToken", token);
        localStorage.setItem("userData", JSON.stringify(user));
      });
    } catch (error) {
      // Fallback to direct storage
      localStorage.setItem("authToken", token);
      localStorage.setItem("userData", JSON.stringify(user));
    }

    this.setupPermissions();
    this.setupAutoRefresh();
  }

  /**
   * Clear authentication data
   */
  clearAuth() {
    this.token = null;
    this.user = null;
    this.permissions.clear();

    // Clear through session management service to avoid conflicts
    try {
      import('./sessionManagementService').then(({ default: sessionManagementService }) => {
        sessionManagementService.clearSessionData();
      }).catch(() => {
        // Fallback to direct removal if import fails
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      });
    } catch (error) {
      // Fallback to direct removal
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
    }

    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Validate current token
   */
  validateToken() {
    if (!this.token) {
      return false;
    }

    try {
      const decoded = jwtDecode(this.token);
      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp < now) {
        console.warn("Token expired");
        this.clearAuth();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Token validation error:", error);
      this.clearAuth();
      return false;
    }
  }

  /**
   * Setup user permissions
   */
  setupPermissions() {
    if (!this.user?.permissions) {
      return;
    }

    this.permissions.clear();
    this.user.permissions.forEach((permission) => {
      this.permissions.set(permission, true);
    });
  }

  /**
   * Setup automatic token refresh
   */
  setupAutoRefresh() {
    if (!this.token) {
      return;
    }

    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    try {
      const decoded = jwtDecode(this.token);
      const expiryTime = decoded.exp * 1000;
      const refreshTime = expiryTime - this.refreshThreshold;
      const timeUntilRefresh = refreshTime - Date.now();

      if (timeUntilRefresh > 0) {
        this.sessionTimeout = setTimeout(() => {
          this.refreshToken();
        }, timeUntilRefresh);
      }
    } catch (error) {
      console.error("Auto-refresh setup error:", error);
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    if (!this.token) {
      return false;
    }

    try {
      // In a real implementation, this would call a refresh endpoint
      const response = await this.simulateTokenRefresh();

      if (response.success) {
        this.setAuth(response.token, response.user);
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      this.clearAuth();
      return false;
    }
  }

  /**
   * Simulate token refresh for demo
   */
  async simulateTokenRefresh() {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (this.user) {
      const newToken = this.generateMockToken(this.user);
      return {
        success: true,
        token: newToken,
        user: this.user,
      };
    }

    return { success: false };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.validateToken() && this.user !== null;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission) {
    if (!this.isAuthenticated()) {
      return false;
    }

    return this.permissions.has(permission);
  }

  /**
   * Check if user has role
   */
  hasRole(role) {
    if (!this.isAuthenticated()) {
      return false;
    }

    return this.user.role === role;
  }

  /**
   * Blog-specific authorization methods
   */

  canCreateBlog() {
    return this.hasPermission("blog:create");
  }

  canReadBlog() {
    return this.hasPermission("blog:read");
  }

  canUpdateBlog(blogId = null, blogAuthorId = null) {
    if (!this.hasPermission("blog:update")) {
      return false;
    }

    // Admin can update any blog
    if (this.hasRole("admin")) {
      return true;
    }

    // Author can update own blog
    if (blogAuthorId && this.user.id === blogAuthorId) {
      return true;
    }

    return false;
  }

  canDeleteBlog(blogId = null, blogAuthorId = null) {
    if (!this.hasPermission("blog:delete")) {
      return false;
    }

    // Admin can delete any blog
    if (this.hasRole("admin")) {
      return true;
    }

    // Author can delete own blog
    if (blogAuthorId && this.user.id === blogAuthorId) {
      return true;
    }

    return false;
  }

  canPublishBlog(blogId = null, blogAuthorId = null) {
    if (!this.hasPermission("blog:publish")) {
      return false;
    }

    // Admin can publish any blog
    if (this.hasRole("admin")) {
      return true;
    }

    // Author can publish own blog if they have publish permission
    if (blogAuthorId && this.user.id === blogAuthorId) {
      return true;
    }

    return false;
  }

  /**
   * Middleware functions for protecting operations
   */

  /**
   * Protect blog creation
   */
  async protectBlogCreate(operation) {
    if (!this.canCreateBlog()) {
      throw new Error("Insufficient permissions to create blog");
    }

    return await this.executeWithAuth(operation);
  }

  /**
   * Protect blog update
   */
  async protectBlogUpdate(blogData, operation) {
    if (!this.canUpdateBlog(blogData.id, blogData.author_id)) {
      throw new Error("Insufficient permissions to update blog");
    }

    return await this.executeWithAuth(operation);
  }

  /**
   * Protect blog deletion
   */
  async protectBlogDelete(blogData, operation) {
    if (!this.canDeleteBlog(blogData.id, blogData.author_id)) {
      throw new Error("Insufficient permissions to delete blog");
    }

    return await this.executeWithAuth(operation);
  }

  /**
   * Protect blog publishing
   */
  async protectBlogPublish(blogData, operation) {
    if (!this.canPublishBlog(blogData.id, blogData.author_id)) {
      throw new Error("Insufficient permissions to publish blog");
    }

    return await this.executeWithAuth(operation);
  }

  /**
   * Execute operation with authentication context
   */
  async executeWithAuth(operation) {
    if (!this.isAuthenticated()) {
      throw new Error("User not authenticated");
    }

    try {
      // Add user context to the operation
      const context = {
        user: this.user,
        token: this.token,
        timestamp: Date.now(),
      };

      return await operation(context);
    } catch (error) {
      console.error("Protected operation failed:", error);
      throw error;
    }
  }

  /**
   * Get current user data
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Get current token
   */
  getCurrentToken() {
    return this.token;
  }

  /**
   * Get user permissions
   */
  getUserPermissions() {
    return Array.from(this.permissions.keys());
  }

  /**
   * Logout user
   */
  logout() {
    this.clearAuth();
  }

  /**
   * Check session status
   */
  getSessionStatus() {
    if (!this.token) {
      return {
        authenticated: false,
        expired: false,
        timeUntilExpiry: null,
      };
    }

    try {
      const decoded = jwtDecode(this.token);
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = (decoded.exp - now) * 1000;

      return {
        authenticated: this.isAuthenticated(),
        expired: decoded.exp < now,
        timeUntilExpiry: timeUntilExpiry > 0 ? timeUntilExpiry : 0,
      };
    } catch (error) {
      return {
        authenticated: false,
        expired: true,
        timeUntilExpiry: 0,
      };
    }
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

export default authMiddleware;
