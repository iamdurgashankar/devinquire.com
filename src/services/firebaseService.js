// Unified Firebase Service
// This service combines all Firebase services and provides a single interface
// to replace the existing PHP API endpoints

import firebaseAuthService from './firebaseAuth';
import firebaseBlogService from './firebaseBlog';
import firebaseUsersService from './firebaseUsers';
import firebasePagesService from './firebasePages';

class FirebaseService {
  constructor() {
    this.auth = firebaseAuthService;
    this.blog = firebaseBlogService;
    this.users = firebaseUsersService;
    this.pages = firebasePagesService;
  }

  // Authentication methods
  async login(email, password) {
    return await this.auth.signIn(email, password);
  }

  async register(userData) {
    return await this.auth.signUp(userData);
  }

  async logout() {
    return await this.auth.signOut();
  }

  async getCurrentUser() {
    return await this.auth.getCurrentUser();
  }

  async updateProfile(profileData) {
    return await this.auth.updateProfile(profileData);
  }

  async changePassword(currentPassword, newPassword) {
    return await this.auth.changePassword(currentPassword, newPassword);
  }

  async resetPassword(email) {
    return await this.auth.resetPassword(email);
  }

  // Blog/Posts methods
  async getPosts(filters = {}) {
    return await this.blog.getPosts(filters);
  }

  async getPost(id) {
    return await this.blog.getPost(id);
  }

  async createPost(postData) {
    return await this.blog.createPost(postData);
  }

  async updatePost(id, postData) {
    return await this.blog.updatePost(id, postData);
  }

  async deletePost(id) {
    return await this.blog.deletePost(id);
  }

  async permanentDeletePost(id) {
    return await this.blog.permanentDeletePost(id);
  }

  async uploadImage(file, path) {
    return await this.blog.uploadImage(file, path);
  }

  async getDashboardStats() {
    return await this.blog.getDashboardStats();
  }

  // User management methods (admin only)
  async getAllUsers() {
    return await this.users.getAllUsers();
  }

  async getPendingUsers() {
    return await this.users.getPendingUsers();
  }

  async approveUser(userId) {
    return await this.users.approveUser(userId);
  }

  async rejectUser(userId) {
    return await this.users.rejectUser(userId);
  }

  async updateUserRole(userId, role) {
    return await this.users.updateUserRole(userId, role);
  }

  async deleteUser(userId) {
    return await this.users.deleteUser(userId);
  }

  async getUserActivityLogs(userId) {
    return await this.users.getUserActivityLogs(userId);
  }

  async getUserPreferences(userId) {
    return await this.users.getUserPreferences(userId);
  }

  async updateUserPreferences(userId, preferences) {
    return await this.users.updateUserPreferences(userId, preferences);
  }

  // Pages management methods
  async getPages() {
    return await this.pages.getPages();
  }

  async getPage(id) {
    return await this.pages.getPage(id);
  }

  async createPage(pageData) {
    return await this.pages.createPage(pageData);
  }

  async updatePage(id, pageData) {
    return await this.pages.updatePage(id, pageData);
  }

  async savePage(id, pageData) {
    return await this.pages.savePage(id, pageData);
  }

  async deletePage(id) {
    return await this.pages.deletePage(id);
  }

  async restorePage(id) {
    return await this.pages.restorePage(id);
  }

  async duplicatePage(id) {
    return await this.pages.duplicatePage(id);
  }

  async renamePage(id, newTitle) {
    return await this.pages.renamePage(id, newTitle);
  }

  async savePageOrder(pageOrder) {
    return await this.pages.savePageOrder(pageOrder);
  }

  async getDeletedPages() {
    return await this.pages.getDeletedPages();
  }

  // Utility methods
  async checkConnection() {
    try {
      const user = await this.getCurrentUser();
      return {
        success: true,
        connected: true,
        authenticated: user.success
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        message: error.message
      };
    }
  }

  // Migration helper methods
  async migrateUserData(phpUserData) {
    try {
      // Convert PHP user data format to Firebase format
      const firebaseUserData = {
        email: phpUserData.email,
        username: phpUserData.username,
        role: phpUserData.role || 'user',
        status: phpUserData.status || 'active',
        profile: {
          displayName: phpUserData.display_name || phpUserData.username,
          bio: phpUserData.bio || '',
          avatar: phpUserData.avatar || ''
        },
        preferences: phpUserData.preferences || {},
        createdAt: phpUserData.created_at ? new Date(phpUserData.created_at) : new Date(),
        updatedAt: phpUserData.updated_at ? new Date(phpUserData.updated_at) : new Date()
      };

      return firebaseUserData;
    } catch (error) {
      console.error('User data migration error:', error);
      return null;
    }
  }

  async migratePostData(phpPostData) {
    try {
      // Convert PHP post data format to Firebase format
      const firebasePostData = {
        title: phpPostData.title,
        content: phpPostData.content,
        excerpt: phpPostData.excerpt || '',
        category: phpPostData.category || 'uncategorized',
        tags: phpPostData.tags ? phpPostData.tags.split(',').map(tag => tag.trim()) : [],
        author: {
          id: phpPostData.author_id,
          name: phpPostData.author_name || 'Unknown',
          email: phpPostData.author_email || ''
        },
        status: phpPostData.status || 'published',
        featured: phpPostData.featured || false,
        featuredImage: phpPostData.featured_image || '',
        seo: {
          metaTitle: phpPostData.meta_title || phpPostData.title,
          metaDescription: phpPostData.meta_description || '',
          keywords: phpPostData.keywords || ''
        },
        createdAt: phpPostData.created_at ? new Date(phpPostData.created_at) : new Date(),
        updatedAt: phpPostData.updated_at ? new Date(phpPostData.updated_at) : new Date()
      };

      return firebasePostData;
    } catch (error) {
      console.error('Post data migration error:', error);
      return null;
    }
  }

  async migratePageData(phpPageData) {
    try {
      // Convert PHP page data format to Firebase format
      const firebasePageData = {
        title: phpPageData.title,
        html: phpPageData.html || '',
        css: phpPageData.css || '',
        deleted: phpPageData.deleted || false,
        position: phpPageData.position || 0,
        createdAt: phpPageData.created_at ? new Date(phpPageData.created_at) : new Date(),
        updatedAt: phpPageData.updated_at ? new Date(phpPageData.updated_at) : new Date()
      };

      return firebasePageData;
    } catch (error) {
      console.error('Page data migration error:', error);
      return null;
    }
  }

  // Error handling wrapper
  async handleApiCall(apiCall, errorMessage = 'API call failed') {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      console.error(errorMessage, error);
      return {
        success: false,
        message: error.message || errorMessage
      };
    }
  }
}

// Create singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;

// Export individual services for direct access if needed
export {
  firebaseAuthService,
  firebaseBlogService,
  firebaseUsersService,
  firebasePagesService
};