// API service for PHP backend
const API_BASE_URL = "https://devinquire.com/backend/api"; // Change this to your Hostinger domain

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    const response = await this.request("/auth/login.php", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(name, email, password, confirmPassword) {
    const response = await this.request("/auth/register.php", {
      method: "POST",
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    this.setToken(null);
    return { success: true };
  }

  // Posts
  async getPosts(page = 1, limit = 10, category = null, status = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (category) params.append("category", category);
    if (status) params.append("status", status);

    return await this.request(`/posts/index.php?${params.toString()}`);
  }

  async getPost(id) {
    return await this.request(`/posts/index.php?id=${id}`);
  }

  async createPost(postData) {
    return await this.request("/posts/index.php", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  async updatePost(id, postData) {
    return await this.request(`/posts/index.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(postData),
    });
  }

  async deletePost(id) {
    return await this.request(`/posts/index.php?id=${id}`, {
      method: "DELETE",
    });
  }

  // Image upload
  async uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const url = `${this.baseURL}/upload/image.php`;
    const config = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      return data;
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  }

  // Dashboard stats
  async getDashboardStats() {
    const posts = await this.getPosts(1, 1000); // Get all posts for stats

    if (!posts.success) {
      throw new Error("Failed to fetch posts for stats");
    }

    const allPosts = posts.data.posts;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate stats
    const totalPosts = allPosts.length;
    const recentPosts = allPosts.filter(
      (post) => new Date(post.created_at) > weekAgo
    ).length;

    const categories = {};
    allPosts.forEach((post) => {
      categories[post.category] = (categories[post.category] || 0) + 1;
    });

    const recentActivity = allPosts.slice(0, 5);

    return {
      success: true,
      data: {
        totalPosts,
        recentPosts,
        categories,
        recentActivity,
        totalViews: "2.4K", // Placeholder
      },
    };
  }

  // User profile
  async updateProfile(profileData) {
    // This would need a separate endpoint in the PHP backend
    // For now, return a mock response
    return {
      success: true,
      message: "Profile updated successfully",
      data: profileData,
    };
  }

  // Check if token is valid
  async validateToken() {
    try {
      const response = await this.request("/auth/validate.php");
      return response.success;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
