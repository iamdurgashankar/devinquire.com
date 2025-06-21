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
      // For now, we'll decode the JWT token to get user info
      // In a real app, you'd validate with the server
      const payload = JSON.parse(atob(token.split(".")[1]));
      const user = {
        id: payload.user_id,
        email: payload.email,
        displayName: payload.email.split("@")[0], // Fallback
        photoURL: null,
      };
      setCurrentUser(user);
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
        setCurrentUser(response.data.user);
        return response.data.user;
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
      const response = await apiService.register(
        name,
        email,
        password,
        confirmPassword
      );
      if (response.success) {
        setCurrentUser(response.data.user);
        return response.data.user;
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  // Sign out
  function logout() {
    try {
      apiService.logout();
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
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
