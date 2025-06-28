// Dynamic API base URL for both local and production environments
const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://devinquire.com/api"
    : "http://localhost:8000/api";

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

    // Initialize posts if not exists
    if (!db.posts) {
      db.posts = [
        {
          id: 1,
          title: "Welcome to Devinquire",
          excerpt:
            "Welcome to our development agency! We specialize in creating modern web applications and providing comprehensive development services.",
          content:
            "Welcome to our development agency! We specialize in creating modern web applications and providing comprehensive development services. Our team of experienced developers is dedicated to delivering high-quality solutions that meet your business needs.",
          category: "Web Development",
          tags: ["welcome", "development", "agency"],
          featured_image:
            "https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Welcome",
          status: "published",
          author_name: "Admin User",
          readTime: "2 min read",
          created_at: "2024-01-15T10:00:00.000Z",
          updated_at: "2024-01-15T10:00:00.000Z",
          views: 150,
          likes: 12,
        },
        {
          id: 2,
          title: "Getting Started with React",
          excerpt:
            "React is a powerful JavaScript library for building user interfaces. Learn the basics and best practices for modern web development.",
          content:
            "React is a powerful JavaScript library for building user interfaces. Learn the basics and best practices for modern web development. This comprehensive guide will help you understand React fundamentals and get you started with building modern web applications.",
          category: "React",
          tags: ["react", "javascript", "frontend"],
          featured_image:
            "https://via.placeholder.com/400x300/61DAFB/000000?text=React",
          status: "published",
          author_name: "Admin User",
          readTime: "5 min read",
          created_at: "2024-01-16T14:30:00.000Z",
          updated_at: "2024-01-16T14:30:00.000Z",
          views: 89,
          likes: 8,
        },
        {
          id: 3,
          title: "SEO Best Practices for 2024",
          excerpt:
            "Search engine optimization is crucial for online success. Discover the latest SEO strategies and techniques for better rankings.",
          content:
            "Search engine optimization is crucial for online success. Discover the latest SEO strategies and techniques for better rankings. This guide covers everything from keyword research to technical SEO and content optimization.",
          category: "SEO",
          tags: ["seo", "marketing", "optimization"],
          featured_image:
            "https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=SEO",
          status: "published",
          author_name: "Admin User",
          readTime: "7 min read",
          created_at: "2024-01-17T09:15:00.000Z",
          updated_at: "2024-01-17T09:15:00.000Z",
          views: 234,
          likes: 18,
        },
      ];
      this.saveDatabase(db);
    }

    // Load posts from localStorage
    this.mockPosts = db.posts || [];
  }

  // Reset database (for development/testing)
  resetDatabase() {
    localStorage.removeItem("devinquireDB");
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUserEmail");
    this.mockPosts = [];
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

  // Helper method to check if API is available
  async checkApiAvailability() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${API_BASE}/session.php`, {
        method: "GET",
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn(
        "API server not available, falling back to localStorage:",
        error.message
      );
      return false;
    }
  }

  // Login with fallback to localStorage
  async login(email, password) {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/login.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password }),
          credentials: "include",
        });
        return res.json();
      } else {
        // Fallback to localStorage authentication
        return this.loginWithLocalStorage(email, password);
      }
    } catch (error) {
      console.warn("API login failed, falling back to localStorage:", error);
      return this.loginWithLocalStorage(email, password);
    }
  }

  // LocalStorage-based login
  loginWithLocalStorage(email, password) {
    const db = this.getDatabase();
    const user = db.users.find((u) => u.email === email);

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (!this.verifyPassword(password, user.password)) {
      return { success: false, message: "Invalid password" };
    }

    if (user.status !== "approved") {
      return { success: false, message: "Account is pending approval" };
    }

    // Set token and return user
    this.setToken("local-token-" + Date.now());
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    };
  }

  // Register with fallback to localStorage
  async register(name, email, password) {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/signup.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: email,
            email,
            password,
            name,
            role: "user",
          }),
          credentials: "include",
        });
        return res.json();
      } else {
        // Fallback to localStorage registration
        return this.registerWithLocalStorage(name, email, password);
      }
    } catch (error) {
      console.warn(
        "API registration failed, falling back to localStorage:",
        error
      );
      return this.registerWithLocalStorage(name, email, password);
    }
  }

  // LocalStorage-based registration
  registerWithLocalStorage(name, email, password) {
    const db = this.getDatabase();

    // Check if user already exists
    if (db.users.find((u) => u.email === email)) {
      return { success: false, message: "User already exists" };
    }

    // Create new user
    const newUser = {
      id: Date.now(),
      name,
      email,
      password: this.hashPassword(password),
      role: "user",
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.users.push(newUser);
    this.saveDatabase(db);

    return {
      success: true,
      message:
        "Registration successful! Your account is pending admin approval.",
    };
  }

  // Get current user with fallback
  async getCurrentUser() {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/session.php`, {
          credentials: "include",
        });
        const session = await res.json();

        if (!session.loggedIn) return null;

        // The session.php already returns user data, no need for second request
        if (session.user) {
          return {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
            status: session.user.status,
          };
        }

        return null;
      } else {
        // Fallback to localStorage
        const token = localStorage.getItem("authToken");
        if (!token) return null;

        const db = this.getDatabase();
        const currentUserEmail = localStorage.getItem("currentUserEmail");
        const user = db.users.find((u) => u.email === currentUserEmail);

        if (user && user.status === "approved") {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
          };
        }
        return null;
      }
    } catch (error) {
      console.warn(
        "API getCurrentUser failed, falling back to localStorage:",
        error
      );
      return null;
    }
  }

  // Logout with fallback
  async logout() {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        await fetch(`${API_BASE}/logout.php`, { credentials: "include" });
      }
    } catch (error) {
      console.warn("API logout failed:", error);
    } finally {
      // Always clear localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUserEmail");
      localStorage.removeItem("userProfile");
      return { success: true, message: "Logout successful" };
    }
  }

  // Get all users (admin) with fallback
  async getAllUsers() {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/get_users.php`, {
          credentials: "include",
        });
        return res.json();
      } else {
        return this.getAllUsersFromLocalStorage();
      }
    } catch (error) {
      console.warn(
        "API getAllUsers failed, falling back to localStorage:",
        error
      );
      return this.getAllUsersFromLocalStorage();
    }
  }

  // LocalStorage-based get all users
  getAllUsersFromLocalStorage() {
    const db = this.getDatabase();
    return {
      success: true,
      data: db.users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
      })),
    };
  }

  // Delete user (admin) with fallback
  async deleteUser(userId) {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/delete_user.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId }),
          credentials: "include",
        });
        return res.json();
      } else {
        // Fallback to localStorage
        return this.deleteUserFromLocalStorage(userId);
      }
    } catch (error) {
      console.warn(
        "API deleteUser failed, falling back to localStorage:",
        error
      );
      return this.deleteUserFromLocalStorage(userId);
    }
  }

  // LocalStorage-based delete user
  deleteUserFromLocalStorage(userId) {
    const db = this.getDatabase();
    const userIndex = db.users.findIndex(
      (user) => user.id === parseInt(userId)
    );

    if (userIndex === -1) {
      return { success: false, message: "User not found" };
    }

    db.users.splice(userIndex, 1);
    this.saveDatabase(db);

    return { success: true, message: "User deleted successfully" };
  }

  // Update profile (name, password, etc.) with fallback
  async updateProfile(profileData) {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/profile.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
          credentials: "include",
        });
        return res.json();
      } else {
        // Fallback to localStorage
        return this.updateProfileInLocalStorage(profileData);
      }
    } catch (error) {
      console.warn(
        "API updateProfile failed, falling back to localStorage:",
        error
      );
      return this.updateProfileInLocalStorage(profileData);
    }
  }

  // LocalStorage-based update profile
  updateProfileInLocalStorage(profileData) {
    const db = this.getDatabase();
    const currentUserEmail = localStorage.getItem("currentUserEmail");
    const userIndex = db.users.findIndex(
      (user) => user.email === currentUserEmail
    );

    if (userIndex === -1) {
      return { success: false, message: "User not found" };
    }

    // Update user data
    db.users[userIndex] = {
      ...db.users[userIndex],
      ...profileData,
      updated_at: new Date().toISOString(),
    };

    this.saveDatabase(db);

    return { success: true, message: "Profile updated successfully" };
  }

  // Get pending users (admin) with fallback
  async getPendingUsers() {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/get_pending_users.php`, {
          credentials: "include",
        });
        return res.json();
      } else {
        // Fallback to localStorage
        return this.getPendingUsersFromLocalStorage();
      }
    } catch (error) {
      console.warn(
        "API getPendingUsers failed, falling back to localStorage:",
        error
      );
      return this.getPendingUsersFromLocalStorage();
    }
  }

  // LocalStorage-based get pending users
  getPendingUsersFromLocalStorage() {
    const db = this.getDatabase();
    const pendingUsers = db.users.filter((user) => user.status === "pending");

    return {
      success: true,
      data: pendingUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
      })),
    };
  }

  // Approve user (admin) with fallback
  async approveUser(userId) {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/approve_user.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId }),
          credentials: "include",
        });
        return res.json();
      } else {
        // Fallback to localStorage
        return this.approveUserInLocalStorage(userId);
      }
    } catch (error) {
      console.warn(
        "API approveUser failed, falling back to localStorage:",
        error
      );
      return this.approveUserInLocalStorage(userId);
    }
  }

  // LocalStorage-based approve user
  approveUserInLocalStorage(userId) {
    const db = this.getDatabase();
    const userIndex = db.users.findIndex(
      (user) => user.id === parseInt(userId)
    );

    if (userIndex === -1) {
      return { success: false, message: "User not found" };
    }

    db.users[userIndex].status = "approved";
    db.users[userIndex].updated_at = new Date().toISOString();
    this.saveDatabase(db);

    return { success: true, message: "User approved successfully" };
  }

  // Reject user (admin) with fallback
  async rejectUser(userId) {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/reject_user.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId }),
          credentials: "include",
        });
        return res.json();
      } else {
        // Fallback to localStorage
        return this.rejectUserInLocalStorage(userId);
      }
    } catch (error) {
      console.warn(
        "API rejectUser failed, falling back to localStorage:",
        error
      );
      return this.rejectUserInLocalStorage(userId);
    }
  }

  // LocalStorage-based reject user
  rejectUserInLocalStorage(userId) {
    const db = this.getDatabase();
    const userIndex = db.users.findIndex(
      (user) => user.id === parseInt(userId)
    );

    if (userIndex === -1) {
      return { success: false, message: "User not found" };
    }

    // Remove the user from the database
    db.users.splice(userIndex, 1);
    this.saveDatabase(db);

    return { success: true, message: "User rejected and removed successfully" };
  }

  // Posts
  async getPosts(page = 1, limit = 10, category = null, status = null) {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (category) params.append("category", category);
        if (status) params.append("status", status);

        const res = await fetch(`${API_BASE}/get_posts.php?${params}`, {
          credentials: "include",
        });
        return res.json();
      } else {
        return this.getPostsFromLocalStorage(page, limit, category, status);
      }
    } catch (error) {
      console.warn("API getPosts failed, falling back to localStorage:", error);
      return this.getPostsFromLocalStorage(page, limit, category, status);
    }
  }

  // LocalStorage-based get posts
  getPostsFromLocalStorage(
    page = 1,
    limit = 10,
    category = null,
    status = null
  ) {
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
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/get_post.php?id=${id}`, {
          credentials: "include",
        });
        return res.json();
      } else {
        return this.getPostFromLocalStorage(id);
      }
    } catch (error) {
      console.warn("API getPost failed, falling back to localStorage:", error);
      return this.getPostFromLocalStorage(id);
    }
  }

  // LocalStorage-based get single post
  getPostFromLocalStorage(id) {
    const post = this.mockPosts.find((p) => p.id === parseInt(id));
    if (!post) {
      throw new Error("Post not found");
    }
    return { success: true, data: post };
  }

  async createPost(postData) {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/create_post.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
          credentials: "include",
        });
        return res.json();
      } else {
        return this.createPostInLocalStorage(postData);
      }
    } catch (error) {
      console.warn(
        "API createPost failed, falling back to localStorage:",
        error
      );
      return this.createPostInLocalStorage(postData);
    }
  }

  // LocalStorage-based create post
  createPostInLocalStorage(postData) {
    const newPost = {
      id: Date.now(),
      ...postData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      views: 0,
      likes: 0,
    };

    this.mockPosts.unshift(newPost);

    // Save to localStorage
    const db = this.getDatabase();
    db.posts = this.mockPosts;
    this.saveDatabase(db);

    return { success: true, data: newPost };
  }

  async updatePost(id, postData) {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/update_post.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...postData }),
          credentials: "include",
        });
        return res.json();
      } else {
        return this.updatePostInLocalStorage(id, postData);
      }
    } catch (error) {
      console.warn(
        "API updatePost failed, falling back to localStorage:",
        error
      );
      return this.updatePostInLocalStorage(id, postData);
    }
  }

  // LocalStorage-based update post
  updatePostInLocalStorage(id, postData) {
    const index = this.mockPosts.findIndex((p) => p.id === parseInt(id));
    if (index === -1) {
      throw new Error("Post not found");
    }

    this.mockPosts[index] = {
      ...this.mockPosts[index],
      ...postData,
      updated_at: new Date().toISOString(),
    };

    // Save to localStorage
    const db = this.getDatabase();
    db.posts = this.mockPosts;
    this.saveDatabase(db);

    return { success: true, data: this.mockPosts[index] };
  }

  async deletePost(id) {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/delete_post.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
          credentials: "include",
        });
        return res.json();
      } else {
        return this.deletePostFromLocalStorage(id);
      }
    } catch (error) {
      console.warn(
        "API deletePost failed, falling back to localStorage:",
        error
      );
      return this.deletePostFromLocalStorage(id);
    }
  }

  // LocalStorage-based delete post
  deletePostFromLocalStorage(id) {
    const index = this.mockPosts.findIndex((p) => p.id === parseInt(id));
    if (index === -1) {
      throw new Error("Post not found");
    }

    const deletedPost = this.mockPosts.splice(index, 1)[0];

    // Save to localStorage
    const db = this.getDatabase();
    db.posts = this.mockPosts;
    this.saveDatabase(db);

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

  // Change password with fallback
  async changePassword(currentPassword, newPassword) {
    try {
      const apiAvailable = await this.checkApiAvailability();

      if (apiAvailable) {
        const res = await fetch(`${API_BASE}/change_password.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
          credentials: "include",
        });
        return res.json();
      } else {
        // Fallback to localStorage
        return this.changePasswordInLocalStorage(currentPassword, newPassword);
      }
    } catch (error) {
      console.warn(
        "API changePassword failed, falling back to localStorage:",
        error
      );
      return this.changePasswordInLocalStorage(currentPassword, newPassword);
    }
  }

  // LocalStorage-based change password
  changePasswordInLocalStorage(currentPassword, newPassword) {
    const db = this.getDatabase();
    const currentUserEmail = localStorage.getItem("currentUserEmail");
    const userIndex = db.users.findIndex(
      (user) => user.email === currentUserEmail
    );

    if (userIndex === -1) {
      return { success: false, message: "User not found" };
    }

    const user = db.users[userIndex];

    // Verify current password
    if (!this.verifyPassword(currentPassword, user.password)) {
      return { success: false, message: "Current password is incorrect" };
    }

    // Update password
    db.users[userIndex].password = this.hashPassword(newPassword);
    db.users[userIndex].updated_at = new Date().toISOString();
    this.saveDatabase(db);

    return { success: true, message: "Password changed successfully" };
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
