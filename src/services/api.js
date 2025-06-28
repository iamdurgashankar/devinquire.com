// Dynamic API base URL for both local and production environments
const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://devinquire.com/api"
    : "http://localhost:8000/api";

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
      return false;
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
        username: email,
        email,
        password,
        name,
        role: "user",
      }),
      credentials: "include",
    });
    return res.json();
  }

  // Get current user
  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/session.php`, {
      credentials: "include",
    });
    const session = await res.json();
    if (!session.loggedIn) return null;
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

  // Update profile
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
  }

  async getPost(id) {
    const res = await fetch(`${API_BASE}/get_post.php?id=${id}`, {
      credentials: "include",
    });
    return res.json();
  }

  async createPost(postData) {
    const res = await fetch(`${API_BASE}/create_post.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
      credentials: "include",
    });
    return res.json();
  }

  async updatePost(id, postData) {
    const res = await fetch(`${API_BASE}/update_post.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...postData }),
      credentials: "include",
    });
    return res.json();
  }

  async deletePost(id) {
    const res = await fetch(`${API_BASE}/delete_post.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      credentials: "include",
    });
    return res.json();
  }

  // Image upload (mock)
  async uploadImage(file) {
    // In production, implement real image upload
    return {
      success: true,
      data: {
        filename: `mock-image-${Date.now()}.jpg`,
        url: "https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Uploaded+Image",
      },
    };
  }

  // Dashboard stats (implement as needed)
  async getDashboardStats() {
    // Implement backend endpoint for real stats
    return { success: true, data: {} };
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    const res = await fetch(`${API_BASE}/change_password.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
      credentials: "include",
    });
    return res.json();
  }
}

const apiService = new ApiService();
export default apiService;
