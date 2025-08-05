import { API_BASE } from '../config';

class AuthService {
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

const authService = new AuthService();
export default authService;
