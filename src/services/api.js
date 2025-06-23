const API_BASE = "https://devinquire.com/api";

// Database API service for Hostinger hosting
class ApiService {
  constructor() {
    this.token = localStorage.getItem("authToken");
    this.mockPosts = [
      {
        id: 1,
        title: "Welcome to Devinquire",
        content:
          "Welcome to our development agency! We specialize in creating modern web applications and providing comprehensive development services.",
        category: "Web Development",
        status: "published",
        created_at: "2024-01-15T10:00:00.000Z",
        updated_at: "2024-01-15T10:00:00.000Z",
        views: 150,
        likes: 12,
      },
      {
        id: 2,
        title: "Getting Started with React",
        content:
          "React is a powerful JavaScript library for building user interfaces. Learn the basics and best practices for modern web development.",
        category: "React",
        status: "published",
        created_at: "2024-01-16T14:30:00.000Z",
        updated_at: "2024-01-16T14:30:00.000Z",
        views: 89,
        likes: 8,
      },
      {
        id: 3,
        title: "SEO Best Practices for 2024",
        content:
          "Search engine optimization is crucial for online success. Discover the latest SEO strategies and techniques for better rankings.",
        category: "SEO",
        status: "published",
        created_at: "2024-01-17T09:15:00.000Z",
        updated_at: "2024-01-17T09:15:00.000Z",
        views: 234,
        likes: 18,
      },
    ];

    // Initialize database
    this.initializeDatabase();
  }

  // Initialize database with default admin user
  initializeDatabase() {
    const db = this.getDatabase();

    // Create default admin user if not exists
    if (!db.users || db.users.length === 0) {
      db.users = [
        {
          id: 1,
          name: "Admin User",
          email: "admin@devinquire.com",
          password: this.hashPassword("admin123"),
          role: "admin",
          status: "approved", // Admin is pre-approved
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      this.saveDatabase(db);
    }

    // Initialize pending users if not exists
    if (!db.pendingUsers) {
      db.pendingUsers = [];
      this.saveDatabase(db);
    }
  }

  // Reset database (for development/testing)
  resetDatabase() {
    localStorage.removeItem("devinquireDB");
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUserEmail");
    console.log(
      "Database reset successfully! Default admin credentials: admin@devinquire.com / admin123"
    );
    window.location.reload();
  }

  // Get database from localStorage
  getDatabase() {
    const db = localStorage.getItem("devinquireDB");
    return db ? JSON.parse(db) : { users: [], pendingUsers: [] };
  }

  // Save database to localStorage
  saveDatabase(db) {
    localStorage.setItem("devinquireDB", JSON.stringify(db));
  }

  // Simple password hashing (for demo purposes)
  hashPassword(password) {
    // In a real app, use proper hashing like bcrypt
    return btoa(password + "salt"); // Simple base64 encoding with salt
  }

  // Verify password
  verifyPassword(password, hashedPassword) {
    // For demo purposes, we'll compare the hashed versions
    const hashedInput = this.hashPassword(password);
    return hashedInput === hashedPassword;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }

  // Login
  async login(email, password) {
    const res = await fetch(`${API_BASE}/login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
      credentials: "include",
    });
    return res.json();
  }

  // Register
  async register(name, email, password) {
    const res = await fetch(`${API_BASE}/signup.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: email, // or use a separate username field if you have one
        email,
        password,
        name,
        role: "user",
      }),
      credentials: "include",
    });
    return res.json();
  }

  // Get current user from session
  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/session.php`, {
      credentials: "include",
    });
    const session = await res.json();
    if (!session.loggedIn) return null;
    // Fetch user profile by id
    const profileRes = await fetch(
      `${API_BASE}/profile.php?id=${session.user_id}`,
      { credentials: "include" }
    );
    return profileRes.json();
  }

  // Logout
  async logout() {
    await fetch(`${API_BASE}/logout.php`, { credentials: "include" });
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUserEmail");
    localStorage.removeItem("userProfile");
    return { success: true, message: "Logout successful" };
  }

  // Get all users (admin)
  async getAllUsers() {
    const res = await fetch(`${API_BASE}/get_users.php`, {
      credentials: "include",
    });
    return res.json();
  }

  // Delete user (admin)
  async deleteUser(userId) {
    const res = await fetch(`${API_BASE}/delete_user.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
      credentials: "include",
    });
    return res.json();
  }

  // Update profile (name, password, etc.)
  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE}/profile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
      credentials: "include",
    });
    return res.json();
  }

  // Get pending users (admin)
  async getPendingUsers() {
    const res = await fetch(`${API_BASE}/get_pending_users.php`, {
      credentials: "include",
    });
    return res.json();
  }

  // Approve user (admin)
  async approveUser(userId) {
    const res = await fetch(`${API_BASE}/approve_user.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
      credentials: "include",
    });
    return res.json();
  }

  // Reject user (admin)
  async rejectUser(userId) {
    const res = await fetch(`${API_BASE}/reject_user.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
      credentials: "include",
    });
    return res.json();
  }

  // Posts
  async getPosts(page = 1, limit = 10, category = null, status = null) {
    let filteredPosts = [...this.mockPosts];

    if (category) {
      filteredPosts = filteredPosts.filter(
        (post) => post.category === category
      );
    }

    if (status) {
      filteredPosts = filteredPosts.filter((post) => post.status === status);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        posts: paginatedPosts,
        total: filteredPosts.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(filteredPosts.length / limit),
      },
    };
  }

  async getPost(id) {
    const post = this.mockPosts.find((p) => p.id === parseInt(id));
    if (!post) {
      throw new Error("Post not found");
    }
    return { success: true, data: post };
  }

  async createPost(postData) {
    const newPost = {
      id: Date.now(),
      ...postData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      views: 0,
      likes: 0,
    };

    this.mockPosts.unshift(newPost);
    return { success: true, data: newPost };
  }

  async updatePost(id, postData) {
    const index = this.mockPosts.findIndex((p) => p.id === parseInt(id));
    if (index === -1) {
      throw new Error("Post not found");
    }

    this.mockPosts[index] = {
      ...this.mockPosts[index],
      ...postData,
      updated_at: new Date().toISOString(),
    };

    return { success: true, data: this.mockPosts[index] };
  }

  async deletePost(id) {
    const index = this.mockPosts.findIndex((p) => p.id === parseInt(id));
    if (index === -1) {
      throw new Error("Post not found");
    }

    const deletedPost = this.mockPosts.splice(index, 1)[0];
    return { success: true, data: deletedPost };
  }

  // Image upload
  async uploadImage(file) {
    // Mock image upload - return a placeholder URL
    return {
      success: true,
      data: {
        filename: `mock-image-${Date.now()}.jpg`,
        url: "https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Uploaded+Image",
      },
    };
  }

  // Dashboard stats
  async getDashboardStats() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalPosts = this.mockPosts.length;
    const recentPosts = this.mockPosts.filter(
      (post) => new Date(post.created_at) > weekAgo
    ).length;

    const categories = {};
    this.mockPosts.forEach((post) => {
      categories[post.category] = (categories[post.category] || 0) + 1;
    });

    const recentActivity = this.mockPosts.slice(0, 5);

    // Get user stats
    const db = this.getDatabase();
    const totalUsers = db.users.length;
    const pendingUsers = db.pendingUsers.length;

    return {
      success: true,
      data: {
        totalPosts,
        recentPosts,
        categories,
        recentActivity,
        totalViews: "2.4K",
        totalUsers,
        pendingUsers,
      },
    };
  }

  // Check if token is valid
  async validateToken() {
    return {
      success: !!this.token,
      data: this.token ? { valid: true } : { valid: false },
    };
  }

  // Get email notifications (localStorage fallback)
  async getEmailNotifications() {
    // Try to load from localStorage
    const notifications = JSON.parse(
      localStorage.getItem("emailNotifications") || "[]"
    );
    return { success: true, data: notifications };
  }
}

const apiService = new ApiService();
export default apiService;

// Global function to reset database (for development/testing)
// Call this in browser console: window.resetDatabase()
window.resetDatabase = function () {
  localStorage.removeItem("devinquireDB");
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUserEmail");
  console.log(
    "Database reset successfully! Default admin credentials: admin@devinquire.com / admin123"
  );
  window.location.reload();
};
