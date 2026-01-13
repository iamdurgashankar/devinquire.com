import { auth } from '../config/firebase';

class BackendApiService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://your-php-backend-domain.com' 
      : 'http://localhost:8000';
    this.token = null;
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Get current Firebase ID token
   */
  async getFirebaseToken() {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        this.setToken(token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting Firebase token:', error);
      return null;
    }
  }

  /**
   * Make authenticated request to backend
   */
  async makeRequest(endpoint, options = {}) {
    try {
      // Ensure we have a valid token
      const token = await this.getFirebaseToken();
      
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        ...options
      };

      // Add authorization header if token exists
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, config);
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`Backend API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.makeRequest('/api/health');
  }

  /**
   * Verify authentication token
   */
  async verifyToken() {
    return this.makeRequest('/api/auth/verify', {
      method: 'POST'
    });
  }

  /**
   * Get authentication status
   */
  async getAuthStatus() {
    return this.makeRequest('/api/auth/status');
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    return this.makeRequest('/api/auth/refresh', {
      method: 'POST'
    });
  }

  /**
   * Logout
   */
  async logout() {
    return this.makeRequest('/api/auth/logout', {
      method: 'POST'
    });
  }

  /**
   * Get user profile
   */
  async getUserProfile() {
    return this.makeRequest('/api/user/profile');
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData) {
    return this.makeRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Get user preferences
   */
  async getUserPreferences() {
    return this.makeRequest('/api/user/preferences');
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences) {
    return this.makeRequest('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  }

  /**
   * Get content
   */
  async getContent(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/content${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Create content
   */
  async createContent(contentData) {
    return this.makeRequest('/api/content', {
      method: 'POST',
      body: JSON.stringify(contentData)
    });
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId) {
    return this.makeRequest(`/api/content/${contentId}`);
  }

  /**
   * Update content
   */
  async updateContent(contentId, contentData) {
    return this.makeRequest(`/api/content/${contentId}`, {
      method: 'PUT',
      body: JSON.stringify(contentData)
    });
  }

  /**
   * Delete content
   */
  async deleteContent(contentId) {
    return this.makeRequest(`/api/content/${contentId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Test backend connectivity
   */
  async testConnection() {
    try {
      const health = await this.healthCheck();
      const authStatus = await this.getAuthStatus();
      
      return {
        success: true,
        health,
        authStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const backendApiService = new BackendApiService();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.backendApiService = backendApiService;
}

export default backendApiService;