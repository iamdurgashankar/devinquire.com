/**
 * Firebase Authentication Hooks
 * Custom React hooks for seamless Firebase authentication integration
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/EnhancedAuthContext";
import firebaseAuthService from "../services/firebaseAuthService";
import { isFirebaseConfigured } from "../config/firebase";

/**
 * Hook for managing authentication state
 */
export const useAuthState = () => {
  const { currentUser, loading, authMethod, error, isFirebaseAvailable } =
    useAuth();

  return {
    user: currentUser,
    loading,
    authenticated: !!currentUser,
    authMethod,
    error,
    isFirebaseAvailable,
  };
};

/**
 * Hook for email/password authentication
 */
export const useEmailAuth = () => {
  const { signInWithEmail, signUp, sendPasswordReset } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signIn = useCallback(
    async (email, password) => {
      try {
        setLoading(true);
        setError(null);
        const result = await signInWithEmail(email, password);
        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [signInWithEmail]
  );

  const signUpWithEmail = useCallback(
    async (name, email, password, confirmPassword) => {
      try {
        setLoading(true);
        setError(null);
        const result = await signUp(name, email, password, confirmPassword);
        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [signUp]
  );

  const resetPassword = useCallback(
    async (email) => {
      try {
        setLoading(true);
        setError(null);
        const result = await sendPasswordReset(email);
        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [sendPasswordReset]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    signIn,
    signUp: signUpWithEmail,
    resetPassword,
    loading,
    error,
    clearError,
  };
};

/**
 * Hook for OAuth authentication (Google, GitHub)
 */
export const useOAuthAuth = () => {
  const { signInWithGoogle, signInWithGitHub, handleOAuthCallback } = useAuth();
  const [loading, setLoading] = useState({ google: false, github: false });
  const [error, setError] = useState(null);

  const signInWithProvider = useCallback(
    async (provider, useRedirect = false) => {
      try {
        setLoading((prev) => ({ ...prev, [provider]: true }));
        setError(null);

        let result;
        if (provider === "google") {
          result = await signInWithGoogle(useRedirect);
        } else if (provider === "github") {
          result = await signInWithGitHub(useRedirect);
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }

        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, [provider]: false }));
      }
    },
    [signInWithGoogle, signInWithGitHub]
  );

  const handleCallback = useCallback(
    async (provider, userData) => {
      try {
        setError(null);
        const result = await handleOAuthCallback(provider, userData);
        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },
    [handleOAuthCallback]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    signInWithProvider,
    handleCallback,
    loading,
    error,
    clearError,
  };
};

/**
 * Hook for user profile management
 */
export const useUserProfile = () => {
  const { currentUser, updateProfile, sendEmailVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateUserProfile = useCallback(
    async (profileData) => {
      try {
        setLoading(true);
        setError(null);
        const result = await updateProfile(profileData);
        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [updateProfile]
  );

  const sendVerificationEmail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await sendEmailVerification();
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sendEmailVerification]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user: currentUser,
    updateProfile: updateUserProfile,
    sendVerificationEmail,
    loading,
    error,
    clearError,
  };
};

/**
 * Hook for password management
 */
export const usePasswordManagement = () => {
  const { changePassword, sendPasswordReset } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updatePassword = useCallback(
    async (currentPassword, newPassword, confirmNewPassword) => {
      try {
        setLoading(true);
        setError(null);
        const result = await changePassword(
          currentPassword,
          newPassword,
          confirmNewPassword
        );
        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [changePassword]
  );

  const resetPassword = useCallback(
    async (email) => {
      try {
        setLoading(true);
        setError(null);
        const result = await sendPasswordReset(email);
        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [sendPasswordReset]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updatePassword,
    resetPassword,
    loading,
    error,
    clearError,
  };
};

/**
 * Hook for Firebase-specific features
 */
export const useFirebaseFeatures = () => {
  const { isFirebaseAvailable, firebaseAuth } = useAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isFirebaseAvailable && firebaseAuth) {
      const unsubscribe = firebaseAuth.onAuthStateChange((firebaseUser) => {
        setUser(firebaseUser);
      });
      return unsubscribe;
    }
  }, [isFirebaseAvailable, firebaseAuth]);

  const linkProvider = useCallback(
    async (providerName) => {
      if (!firebaseAuth) {
        throw new Error("Firebase not available");
      }
      return await firebaseAuth.linkProvider(providerName);
    },
    [firebaseAuth]
  );

  const unlinkProvider = useCallback(
    async (providerId) => {
      if (!firebaseAuth) {
        throw new Error("Firebase not available");
      }
      return await firebaseAuth.unlinkProvider(providerId);
    },
    [firebaseAuth]
  );

  const deleteAccount = useCallback(
    async (password = null) => {
      if (!firebaseAuth) {
        throw new Error("Firebase not available");
      }
      return await firebaseAuth.deleteAccount(password);
    },
    [firebaseAuth]
  );

  const getIdToken = useCallback(
    async (forceRefresh = false) => {
      if (!firebaseAuth) {
        throw new Error("Firebase not available");
      }
      return await firebaseAuth.getIdToken(forceRefresh);
    },
    [firebaseAuth]
  );

  return {
    isAvailable: isFirebaseAvailable,
    user,
    linkProvider,
    unlinkProvider,
    deleteAccount,
    getIdToken,
    hasProvider: firebaseAuth?.hasProvider,
    getLinkedProviders: firebaseAuth?.getLinkedProviders,
  };
};

/**
 * Hook for authentication redirects and navigation
 */
export const useAuthNavigation = () => {
  const { currentUser, authMethod } = useAuth();
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    // Store intended destination before authentication
    const currentPath = window.location.pathname;
    if (
      !currentUser &&
      currentPath !== "/login" &&
      currentPath !== "/register"
    ) {
      setRedirectPath(currentPath);
    }
  }, [currentUser]);

  const getRedirectPath = useCallback(() => {
    return redirectPath || "/dashboard";
  }, [redirectPath]);

  const clearRedirectPath = useCallback(() => {
    setRedirectPath(null);
  }, []);

  const shouldRedirect = useCallback(
    (protectedRoutes = ["/dashboard", "/admin"]) => {
      const currentPath = window.location.pathname;
      return protectedRoutes.includes(currentPath) && !currentUser;
    },
    [currentUser]
  );

  return {
    redirectPath,
    getRedirectPath,
    clearRedirectPath,
    shouldRedirect,
    isAuthenticated: !!currentUser,
    authMethod,
  };
};

/**
 * Hook for form validation with authentication context
 */
export const useAuthValidation = () => {
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePassword = useCallback((password) => {
    return password.length >= 6;
  }, []);

  const validatePasswordMatch = useCallback((password, confirmPassword) => {
    return password === confirmPassword;
  }, []);

  const validateDisplayName = useCallback((name) => {
    return name.trim().length >= 2;
  }, []);

  const getPasswordStrength = useCallback((password) => {
    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    ];

    strength = checks.filter(Boolean).length;

    if (strength < 2) return { score: 1, label: "Weak", color: "red" };
    if (strength < 4) return { score: 2, label: "Fair", color: "orange" };
    if (strength < 5) return { score: 3, label: "Good", color: "yellow" };
    return { score: 4, label: "Strong", color: "green" };
  }, []);

  return {
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    validateDisplayName,
    getPasswordStrength,
  };
};

/**
 * Hook for handling authentication errors
 */
export const useAuthError = () => {
  const [error, setError] = useState(null);
  const [errorHistory, setErrorHistory] = useState([]);

  const handleError = useCallback((error, context = "unknown") => {
    const errorInfo = {
      message: error.message || "An unknown error occurred",
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
    };

    setError(errorInfo);
    setErrorHistory((prev) => [errorInfo, ...prev.slice(0, 9)]); // Keep last 10 errors
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearErrorHistory = useCallback(() => {
    setErrorHistory([]);
  }, []);

  const getErrorMessage = useCallback((error) => {
    if (typeof error === "string") return error;
    return error?.message || "An unexpected error occurred";
  }, []);

  return {
    error,
    errorHistory,
    handleError,
    clearError,
    clearErrorHistory,
    getErrorMessage,
  };
};

/**
 * Hook for checking Firebase configuration and status
 */
export const useFirebaseStatus = () => {
  const [status, setStatus] = useState({
    configured: false,
    available: false,
    loading: true,
  });

  useEffect(() => {
    const checkStatus = () => {
      const configured = isFirebaseConfigured();
      const available =
        !!firebaseAuthService && firebaseAuthService.isAvailable();

      setStatus({
        configured,
        available,
        loading: false,
      });
    };

    checkStatus();
  }, []);

  return status;
};
