import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false); // No auth loading needed

  useEffect(() => {
    // No Firebase auth - set loading to false immediately
    setLoading(false);
  }, []);

  const validateAndSetUser = async () => {
    try {
      // TODO: Implement your chosen authentication system
      const user = null; // No user authentication for now
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email,
          displayName: user.name,
          photoURL: null,
          role: user.role,
        });
      }
    } catch (error) {
      console.error("Session validation error:", error);
    } finally {
      setLoading(false);
    }
  };

  async function signInWithEmail(email, password) {
    try {
      // TODO: Implement your chosen authentication system
      throw new Error("Authentication not implemented yet");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async function signUp(name, email, password, confirmPassword) {
    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      // TODO: Implement your chosen authentication system
      throw new Error("Registration not implemented yet");
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

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

      // TODO: Implement your chosen authentication system
      throw new Error("Password change not implemented yet");
    } catch (error) {
      console.error("Password change error:", error);
      throw error;
    }
  }

  function logout() {
    try {
      // TODO: Implement your chosen authentication system logout
      console.log("User logged out");
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
