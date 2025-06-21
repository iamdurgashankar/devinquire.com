// Mock API service for static deployment
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
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }

  // Authentication
  async login(email, password) {
    // Mock login - accept any email/password for demo
    const mockUser = {
      id: 1,
      name: "Admin User",
      email: email,
      role: "admin",
    };

    const mockToken = "mock-jwt-token-" + Date.now();
    this.setToken(mockToken);

    return {
      success: true,
      message: "Login successful",
      data: {
        user: mockUser,
        token: mockToken,
      },
    };
  }

  async register(name, email, password) {
    // Mock registration
    const mockUser = {
      id: 2,
      name: name,
      email: email,
      role: "author",
    };

    const mockToken = "mock-jwt-token-" + Date.now();
    this.setToken(mockToken);

    return {
      success: true,
      message: "Registration successful",
      data: {
        user: mockUser,
        token: mockToken,
      },
    };
  }

  async logout() {
    this.setToken(null);
    return { success: true, message: "Logout successful" };
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

    return {
      success: true,
      data: {
        totalPosts,
        recentPosts,
        categories,
        recentActivity,
        totalViews: "2.4K",
      },
    };
  }

  // User profile
  async updateProfile(profileData) {
    return {
      success: true,
      message: "Profile updated successfully",
      data: profileData,
    };
  }

  // Check if token is valid
  async validateToken() {
    return {
      success: !!this.token,
      data: this.token ? { valid: true } : { valid: false },
    };
  }
}

export default new ApiService();
