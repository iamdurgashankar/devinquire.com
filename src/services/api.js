import firebaseService from './firebaseService';

class ApiService {
  constructor() {
    this.token = localStorage.getItem("authToken");
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }

  // Helper method to check if API is available
  async checkApiAvailability() {
    return await firebaseService.checkConnection();
  }

  // Get all users (admin)
  async getAllUsers() {
    return await firebaseService.getAllUsers();
  }

  // Delete user (admin)
  async deleteUser(userId) {
    return await firebaseService.deleteUser(userId);
  }

  // Update profile
  async updateProfile(profileData) {
    return await firebaseService.updateProfile(profileData);
  }

  // Get pending users
  async getPendingUsers() {
    return await firebaseService.getPendingUsers();
  }

  // Approve user
  async approveUser(userId) {
    return await firebaseService.approveUser(userId);
  }

  // Reject user
  async rejectUser(userId) {
    return await firebaseService.rejectUser(userId);
  }

  // Update user role
  async updateUserRole(userId, newRole) {
    return await firebaseService.updateUserRole(userId, newRole);
  }

  // Get posts with pagination and filters
  async getPosts(page = 1, limit = 10, category = null, status = null) {
    return await firebaseService.getPosts(page, limit, category, status);
  }

  // Get single post
  async getPost(id) {
    return await firebaseService.getPost(id);
  }

  // Create new post
  async createPost(postData) {
    return await firebaseService.createPost(postData);
  }

  // Update existing post
  async updatePost(id, postData) {
    return await firebaseService.updatePost(id, postData);
  }

  // Delete post (soft delete)
  async deletePost(id) {
    return await firebaseService.deletePost(id);
  }

  // Permanently delete post
  async permanentDeletePost(id) {
    return await firebaseService.permanentDeletePost(id);
  }

  // Upload image
  async uploadImage(file) {
    return await firebaseService.uploadImage(file);
  }

  // Get dashboard statistics
  async getDashboardStats() {
    return await firebaseService.getDashboardStats();
  }

  // Get email notifications
  async getEmailNotifications() {
    return await firebaseService.getEmailNotifications();
  }

  // Get user activity log
  async getUserActivityLog(userId) {
    return await firebaseService.getUserActivityLog(userId);
  }

  // Get user preferences
  async getUserPreferences(userId) {
    return await firebaseService.getUserPreferences(userId);
  }

  // Update user preferences
  async updateUserPreferences(userId, preferences) {
    return await firebaseService.updateUserPreferences(userId, preferences);
  }
}

// Save page order function
export async function savePageOrder(order) {
  try {
    return await firebaseService.savePageOrder(order);
  } catch (error) {
    console.error('Error saving page order:', error);
    throw error;
  }
}

const apiService = new ApiService();
window.apiService = apiService;
export default apiService;
