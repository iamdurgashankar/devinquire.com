import React, { createContext, useContext, useEffect, useState } from "react";
import apiService from "../services/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // Validate token and get user info
      validateAndSetUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateAndSetUser = async (token) => {
    try {
      // Get current user from localStorage
      const user = await apiService.getCurrentUser();
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email,
          displayName: user.name,
          photoURL: null,
          role: user.role,
        });
      } else {
        // Clear invalid token
        localStorage.removeItem("authToken");
      }
    } catch (error) {
      console.error("Token validation error:", error);
      localStorage.removeItem("authToken");
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email/password
  async function signInWithEmail(email, password) {
    try {
      const response = await apiService.login(email, password);
      if (response.success) {
        setCurrentUser(response.user);
        // Store current user email for password changes
        localStorage.setItem("currentUserEmail", email);
        return response.user;
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Register new user
  async function signUp(name, email, password, confirmPassword) {
    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const response = await apiService.register(name, email, password);
      if (response.success) {
        // Don't automatically log in the user since account needs approval
        // Just return the response without setting currentUser
        return response;
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  // Change password
  async function changePassword(
    currentPassword,
    newPassword,
    confirmNewPassword
  ) {
    try {
      if (!currentUser) {
        throw new Error("No user logged in");
      }

      if (newPassword !== confirmNewPassword) {
        throw new Error("New passwords do not match");
      }

      if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters long");
      }

      const response = await apiService.changePassword(
        currentUser.email,
        currentPassword,
        newPassword
      );

      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || "Password change failed");
      }
    } catch (error) {
      console.error("Password change error:", error);
      throw error;
    }
  }

  // Sign out
  function logout() {
    try {
      apiService.logout();
      localStorage.removeItem("currentUserEmail");
      localStorage.removeItem("userProfile");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setCurrentUser(null);
    }
  }

  const value = {
    currentUser,
    signInWithEmail,
    signUp,
    changePassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
