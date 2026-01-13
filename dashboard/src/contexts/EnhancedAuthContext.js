/**
 * Enhanced Authentication Context
 * Integrates Firebase authentication with existing OAuth system for seamless user authentication
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import firebaseAuthService from "../services/firebaseAuthService";
import oauthService from "../services/oauthService";
import sessionManagementService from "../services/sessionManagementService";
import backendApiService from "../services/backendApiService";
import { isFirebaseConfigured } from "../config/firebase";
import cleanupAdminData from "../utils/cleanupAdminData";
import authAuditService from "../services/authAuditService";
import { adminSecurityService } from "../services/adminSecurityService";

const EnhancedAuthContext = createContext();

export function useAuth() {
  return useContext(EnhancedAuthContext);
}

// Export alias for backward compatibility
export const useEnhancedAuth = useAuth;

export function EnhancedAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState(null); // 'firebase', 'email', 'google', 'github'
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Check for existing authentication on mount with enhanced session management
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        setLoading(true);
        console.log("🔍 Starting auth state check...");

        // Check for stored session data first (fast path)
        const sessionData = sessionManagementService.getSessionData();
        console.log("📊 Found session data:", sessionData ? "Yes" : "No");

        if (sessionData) {
          console.log("📋 Session details:", {
            authMethod: sessionData.authMethod,
            hasUser: !!sessionData.user,
            expiresAt: sessionData.expiresAt,
            isExpired:
              sessionData.expiresAt && Date.now() > sessionData.expiresAt,
          });

          // Quick validation - if session exists and hasn't expired, use it
          if (
            sessionData.user &&
            (!sessionData.expiresAt || Date.now() <= sessionData.expiresAt)
          ) {
            console.log("✅ Using stored session data (fast path)");
            setCurrentUser(sessionData.user);
            setAuthMethod(sessionData.authMethod);
            setLoading(false);
            return; // Early return to avoid slow validation
          }
        }

        // Use session management service for full validation (slow path)
        console.log("🔍 Performing full session validation...");
        const sessionValidation =
          await sessionManagementService.validateSession();
        console.log("✅ Session validation result:", sessionValidation);

        if (sessionValidation.isValid) {
          if (sessionData) {
            setCurrentUser(sessionData.user);
            setAuthMethod(sessionData.authMethod);
            console.log(
              "✅ Session restored successfully:",
              sessionData.authMethod
            );
          }
        } else {
          console.log(
            "🚫 Session validation failed:",
            sessionValidation.reason
          );
          // Only clear session for critical failures
          const criticalReasons = [
            "no_session",
            "session_expired",
            "invalid_encryption",
            "unknown_auth_method",
          ];
          if (criticalReasons.includes(sessionValidation.reason)) {
            sessionManagementService.clearSessionData();
            setCurrentUser(null);
            setAuthMethod(null);
          } else {
            console.log(
              "⚠️ Non-critical validation failure, preserving session"
            );
            // Preserve session for non-critical failures
            if (sessionData) {
              setCurrentUser(sessionData.user);
              setAuthMethod(sessionData.authMethod);
            }
          }
        }

        // Set up session event listeners with improved error handling
        const unsubscribeSession = sessionManagementService.addListener(
          (event, data) => {
            switch (event) {
              case "sessionInvalid":
                // Only log out for critical failures, not temporary issues
                const criticalReasons = [
                  "no_session",
                  "session_expired",
                  "invalid_encryption",
                  "unknown_auth_method",
                ];
                if (criticalReasons.includes(data?.reason)) {
                  console.log("🚫 Critical session invalid:", data.reason);
                  setCurrentUser(null);
                  setAuthMethod(null);
                  setError("Your session has expired. Please sign in again.");
                } else {
                  console.warn(
                    "⚠️ Session validation warning (non-critical):",
                    data.reason
                  );
                  // Don't logout for non-critical issues
                }
                break;
              case "session_expired":
                console.log("🚫 Session expired:", data.reason);
                setCurrentUser(null);
                setAuthMethod(null);
                setError(
                  "Your session has expired due to inactivity. Please sign in again."
                );
                break;
              case "tokenRefreshed":
                console.log("🔄 Token refreshed for:", data.authMethod);
                // Clear any previous auth errors on successful token refresh
                setError(null);
                break;
              case "tokenRefreshFailed":
                console.log("❌ Token refresh failed for:", data.authMethod);
                // Don't immediately log out on token refresh failure - let retry logic handle it
                // Only show error if it's persistent
                if (
                  data?.error &&
                  !data.error.includes("network") &&
                  !data.error.includes("timeout")
                ) {
                  console.warn(
                    "⚠️ Token refresh failed (non-network):",
                    data.error
                  );
                }
                break;
              case "sessionCleared":
                setCurrentUser(null);
                setAuthMethod(null);
                break;
              case "sessionStored":
                // Session stored successfully - ensure user is set
                if (data?.user && !currentUser) {
                  console.log("✅ Restoring user from stored session");
                  setCurrentUser(data.user);
                  setAuthMethod(data.authMethod);
                }
                break;
            }
          }
        );

        // If Firebase is configured, also check Firebase auth state
        if (isFirebaseConfigured() && auth) {
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              // Firebase user exists - ensure session is stored
              const formattedUser = formatFirebaseUser(firebaseUser);

              try {
                const token = await firebaseUser.getIdToken();

                // Always store/update session when Firebase user is available
                sessionManagementService.storeSessionData(
                  "firebase",
                  formattedUser,
                  {
                    access_token: token,
                    storedAt: Date.now(),
                  }
                );

                // Update user state if not already set or different
                if (!currentUser || currentUser.uid !== formattedUser.uid) {
                  setCurrentUser(formattedUser);
                  setAuthMethod("firebase");
                  console.log(
                    "✅ [FIREBASE] User state updated from auth state change"
                  );
                }

                // Verify token with backend (non-blocking)
                try {
                  await backendApiService.verifyToken();
                  console.log("✅ Backend token verification successful");
                } catch (error) {
                  console.warn(
                    "⚠️ Backend token verification failed (non-critical):",
                    error.message
                  );
                  // Continue with frontend-only auth - don't clear session
                }
              } catch (error) {
                console.error(
                  "❌ Error processing Firebase auth state:",
                  error
                );
                // Preserve existing session even if token fetch fails
                const storedSession = sessionManagementService.getSessionData();
                if (!currentUser && storedSession) {
                  setCurrentUser(storedSession.user);
                  setAuthMethod(storedSession.authMethod);
                }
              }
            } else {
              // Firebase user is null - check if we have stored session
              const storedSession = sessionManagementService.getSessionData();
              if (storedSession && storedSession.user) {
                // Preserve stored session even if Firebase user is temporarily null
                console.log(
                  "⚠️ [FIREBASE] Firebase user null but stored session exists, preserving session"
                );
                setCurrentUser(storedSession.user);
                setAuthMethod(storedSession.authMethod);
              } else if (!sessionValidation.isValid) {
                // No stored session and validation failed - this is a real logout
                console.log("🚫 [FIREBASE] No valid session or Firebase user");
                // Don't clear immediately - let user stay logged in if they have a session
              }
            }
          });

          return () => {
            unsubscribe();
            unsubscribeSession();
          };
        }

        return () => unsubscribeSession();
      } catch (error) {
        console.error("Auth state check error:", error);
        setError("Failed to restore authentication state");
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log("EnhancedAuthContext - initializeAuth started");
      setLoading(true);
      setIsFirebaseAvailable(isFirebaseConfigured());
      console.log(
        "EnhancedAuthContext - Firebase configured:",
        isFirebaseConfigured()
      );

      if (isFirebaseConfigured()) {
        console.log("EnhancedAuthContext - Setting up Firebase auth listener");
        // Firebase is available - set up Firebase auth listener
        setupFirebaseAuthListener();

        // Check for redirect result (OAuth redirect flows)
        await handleFirebaseRedirectResult();
        console.log("EnhancedAuthContext - Firebase redirect result handled");
      } else {
        console.log("EnhancedAuthContext - Using fallback auth system");
        // Fallback to existing auth system
        await validateExistingAuth();
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      setError(error.message);
    } finally {
      console.log(
        "EnhancedAuthContext - initializeAuth completed, setting loading to false"
      );
      setLoading(false);
    }
  };

  const setupFirebaseAuthListener = () => {
    const unsubscribe = firebaseAuthService.onAuthStateChange(
      async (firebaseUser) => {
        if (firebaseUser) {
          const user = formatFirebaseUser(firebaseUser);

          // Always update user state when Firebase user is available
          setCurrentUser(user);
          setAuthMethod("firebase");

          // Store session data using session management service
          try {
            const token = await firebaseUser.getIdToken();
            const stored = sessionManagementService.storeSessionData(
              "firebase",
              user,
              {
                access_token: token,
                storedAt: Date.now(),
              }
            );

            if (stored) {
              console.log(
                "✅ [FIREBASE] Session data stored from auth state listener"
              );
            } else {
              console.warn("⚠️ [FIREBASE] Failed to store session data");
            }
          } catch (error) {
            console.error(
              "❌ [FIREBASE] Failed to get/store Firebase token:",
              error
            );
            // Don't clear user on token errors - preserve session
          }
        } else {
          // Firebase user signed out - check for fallback auth
          // Only clear if it's an explicit sign out, not a temporary auth state issue
          const sessionData = sessionManagementService.getSessionData();
          if (!sessionData) {
            // No stored session - this is a real sign out
            checkFallbackAuth();
          } else {
            // We have stored session data - preserve it
            console.log(
              "⚠️ [FIREBASE] Firebase user null but session data exists, preserving session"
            );
            setCurrentUser(sessionData.user);
            setAuthMethod(sessionData.authMethod);
          }
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  };

  const handleFirebaseRedirectResult = async () => {
    try {
      const result = await firebaseAuthService.handleRedirectResult();
      if (result && result.success) {
        // User signed in via redirect
        console.log("Redirect authentication successful:", result.provider);
      }
    } catch (error) {
      console.error("Redirect result error:", error);
      setError(error.message);
    }
  };

  const validateExistingAuth = async () => {
    try {
      // Check for OAuth authentication
      const providers = ["google", "github"];
      for (const provider of providers) {
        if (oauthService.isAuthenticated(provider)) {
          try {
            const oauthUser = await oauthService.getCurrentUser(provider);
            if (oauthUser) {
              setCurrentUser(formatOAuthUser(oauthUser, provider));
              setAuthMethod(provider);
              return;
            }
          } catch (error) {
            console.warn(`Failed to get ${provider} user:`, error);
            await oauthService.logout(provider);
          }
        }
      }
    } catch (error) {
      console.error("Existing auth validation error:", error);
    }
  };

  const checkFallbackAuth = async () => {
    // When Firebase auth is cleared, check if fallback auth exists
    if (!isFirebaseAvailable) {
      await validateExistingAuth();
    } else {
      setCurrentUser(null);
      setAuthMethod(null);
      sessionManagementService.clearSessionData();
    }
  };

  // Helper functions for admin bypass security
  const validateAdminBypass = async (email, password) => {
    // Enhanced validation for admin bypass
    const validEmail = "admin@devinquire.com";
    const validPassword = "8763155499Sipu@";

    console.log("🔍 [DEBUG] Starting admin bypass validation...");
    console.log("🔍 [DEBUG] Email:", email, "Expected:", validEmail);
    console.log("🔍 [DEBUG] Password received:", JSON.stringify(password));
    console.log("🔍 [DEBUG] Password expected:", JSON.stringify(validPassword));
    console.log(
      "🔍 [DEBUG] Password length received:",
      password ? password.length : "null"
    );
    console.log("🔍 [DEBUG] Password length expected:", validPassword.length);
    console.log("🔍 [DEBUG] Password type received:", typeof password);
    console.log("🔍 [DEBUG] Password type expected:", typeof validPassword);

    // Character by character comparison
    if (password && validPassword) {
      console.log("🔍 [DEBUG] Character-by-character comparison:");
      const maxLen = Math.max(password.length, validPassword.length);
      for (let i = 0; i < maxLen; i++) {
        const receivedChar = password[i] || "undefined";
        const expectedChar = validPassword[i] || "undefined";
        const receivedCode = password[i] ? password.charCodeAt(i) : "N/A";
        const expectedCode = validPassword[i]
          ? validPassword.charCodeAt(i)
          : "N/A";
        if (receivedChar !== expectedChar) {
          console.log(
            `🔍 [DEBUG] Mismatch at position ${i}: received '${receivedChar}' (${receivedCode}) vs expected '${expectedChar}' (${expectedCode})`
          );
        }
      }
    }

    console.log("🔍 [DEBUG] Password match:", password === validPassword);

    // Get client IP for security validation
    const ipAddress = await getClientIP();
    console.log("🔍 [DEBUG] Client IP:", ipAddress);

    try {
      // Validate environment security
      console.log("🔍 [DEBUG] Checking environment security...");
      const envSecurity = adminSecurityService.validateEnvironmentSecurity();
      console.log("🔍 [DEBUG] Environment security:", envSecurity);
      if (!envSecurity.isSecure) {
        throw new Error("Insecure environment detected");
      }

      // Check for rate limiting and suspicious activity
      console.log("🔍 [DEBUG] Validating bypass attempt...");
      await adminSecurityService.validateBypassAttempt(email, ipAddress);
      console.log("🔍 [DEBUG] Bypass attempt validation passed");

      // Detect suspicious activity
      console.log("🔍 [DEBUG] Checking for suspicious activity...");
      const suspiciousActivity = adminSecurityService.detectSuspiciousActivity({
        email,
        ipAddress,
        userAgent: navigator.userAgent,
      });
      console.log("🔍 [DEBUG] Suspicious activity check:", suspiciousActivity);

      if (suspiciousActivity.isSuspicious) {
        console.warn(
          "Suspicious activity detected:",
          suspiciousActivity.indicators
        );
        // Log but don't block for now - could be enhanced based on requirements
      }

      // Basic credential validation
      console.log("🔍 [DEBUG] Performing credential validation...");
      const isValidCredentials =
        email === validEmail && password === validPassword;
      console.log(
        "🔍 [DEBUG] Credential validation result:",
        isValidCredentials
      );

      if (!isValidCredentials) {
        console.log("🔍 [DEBUG] Invalid credentials, recording failed attempt");
        adminSecurityService.recordFailedAttempt(email, ipAddress);
        return false;
      }

      // Clear failed attempts on successful validation
      console.log("🔍 [DEBUG] Clearing failed attempts...");
      adminSecurityService.clearFailedAttempts(email, ipAddress);

      console.log("🔍 [DEBUG] Admin bypass validation successful!");
      return true;
    } catch (error) {
      console.error("🔍 [DEBUG] Error in validateAdminBypass:", error);
      throw error;
    }
  };

  const getClientIP = async () => {
    try {
      // In production, this would use a proper IP detection service
      // For development, return localhost identifier
      return window.location.hostname === "localhost" ? "127.0.0.1" : "unknown";
    } catch (error) {
      return "unknown";
    }
  };

  const generateSessionId = async (email) => {
    const ipAddress = await getClientIP();
    const userAgent = navigator.userAgent;
    return adminSecurityService.generateSecureSessionId(
      email,
      ipAddress,
      userAgent
    );
  };

  // Email/Password Authentication Methods
  async function signInWithEmail(email, password) {
    try {
      setError(null);
      setLoading(true);

      // PRIORITY 1: Admin bypass authentication - ALWAYS attempt first and override any Firebase errors
      if (email === "admin@devinquire.com") {
        console.log(
          "🔐 [ADMIN BYPASS] Attempting admin bypass authentication..."
        );

        try {
          console.log("🔍 [DEBUG] About to call validateAdminBypass...");
          // Validate admin bypass credentials with enhanced security
          const isValidAdminBypass = await validateAdminBypass(email, password);
          console.log(
            "🔍 [DEBUG] validateAdminBypass returned:",
            isValidAdminBypass
          );

          if (!isValidAdminBypass) {
            console.log(
              "🔍 [DEBUG] Admin bypass validation failed, logging failure..."
            );
            await authAuditService.logAdminBypass({
              email,
              success: false,
              reason: "Invalid admin credentials or security validation failed",
              password: password, // For security analysis
              ipAddress: await getClientIP(),
              userAgent: navigator.userAgent,
            });
            throw new Error(
              "Admin authentication failed: Invalid credentials or security validation"
            );
          }

          console.log(
            "🔍 [DEBUG] Admin bypass validation successful, proceeding..."
          );

          // Generate secure session with enhanced tracking
          const sessionId = await generateSessionId(email);
          const ipAddress = await getClientIP();

          const adminUser = {
            uid: "admin-bypass-uid",
            email: "admin@devinquire.com",
            displayName: "Default Admin User",
            photoURL: null,
            emailVerified: true,
            role: "admin",
            permissions: [
              "user_management",
              "content_management",
              "blog_management",
              "analytics_access",
              "system_administration",
              "security_management",
              "audit_access",
              "system_override",
            ],
            privileges: ["admin", "super_admin", "default_admin"],
            authMethod: "admin_bypass",
            securityLevel: "maximum",
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            bypassTimestamp: new Date().toISOString(),
            sessionId: sessionId,
            ipAddress: ipAddress,
            userAgent: navigator.userAgent,
            bypassVersion: "2.0", // Track bypass system version
          };

          // Log successful admin bypass with comprehensive details
          await authAuditService.logAdminBypass({
            email,
            success: true,
            userId: adminUser.uid,
            sessionId: adminUser.sessionId,
            ipAddress: ipAddress,
            userAgent: navigator.userAgent,
            timestamp: adminUser.bypassTimestamp,
            securityLevel: "maximum",
            privileges: adminUser.privileges,
            password: password, // For security analysis
            role: adminUser.role,
            permissions: adminUser.permissions,
          });

          // Set user state and store session using session management service
          setCurrentUser(adminUser);
          setAuthMethod("admin_bypass");
          console.log('✅ [ADMIN BYPASS] User state set successfully');

          // Store session data using session management service for persistence
          console.log('🔍 [ADMIN BYPASS] Attempting to store session data...');
          const sessionStored = sessionManagementService.storeSessionData("admin_bypass", adminUser, {
            access_token: `admin_bypass_${adminUser.sessionId}`,
            sessionId: adminUser.sessionId,
            storedAt: Date.now(),
          });
          
          if (sessionStored) {
            console.log('✅ [ADMIN BYPASS] Session data stored successfully');
            
            // Verify session was stored correctly
            const verifySession = sessionManagementService.getSessionData();
            console.log('🔍 [ADMIN BYPASS] Session verification:', verifySession ? 'Success' : 'Failed');
          } else {
            console.error('❌ [ADMIN BYPASS] Failed to store session data');
          }

          // Also store in localStorage for backward compatibility
          try {
            localStorage.setItem("userData", JSON.stringify(adminUser));
            localStorage.setItem("authMethod", "admin_bypass");
            localStorage.setItem("adminBypassSession", adminUser.sessionId);
            console.log('✅ [ADMIN BYPASS] LocalStorage backup created successfully');
          } catch (storageError) {
            console.error('⚠️ [ADMIN BYPASS] LocalStorage backup failed:', storageError);
          }
          
          // Store additional timestamp
          localStorage.setItem("adminBypassTimestamp", adminUser.bypassTimestamp);

          console.log(
            "✅ [ADMIN BYPASS] Enhanced admin bypass authentication successful with maximum privileges"
          );
          console.log(
            "🔒 [ADMIN BYPASS] Security Level: Maximum | Privileges:",
            adminUser.privileges
          );
          console.log("✅ [ADMIN BYPASS] Session data stored successfully");

          setLoading(false);
          return adminUser;
        } catch (adminError) {
          console.error(
            "🚨 [ADMIN BYPASS] Admin bypass authentication failed:",
            adminError
          );

          // Log failed admin bypass attempt with detailed error information
          await authAuditService.logAdminBypass({
            email,
            success: false,
            reason: adminError.message,
            password: password, // For security analysis
            ipAddress: await getClientIP(),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            errorDetails: {
              errorType: adminError.constructor.name,
              stackTrace: adminError.stack,
            },
          });

          setLoading(false);
          // For admin bypass failures, throw the specific error
          throw new Error(`Admin bypass failed: ${adminError.message}`);
        }
      }

      // PRIORITY 2: Firebase authentication for regular users
      // Only attempt Firebase auth for non-admin emails
      if (isFirebaseAvailable) {
        try {
          console.log("🔥 [FIREBASE] Attempting Firebase authentication...");
          const result = await firebaseAuthService.signInWithEmail(
            email,
            password
          );

          if (result.success) {
            console.log("✅ [FIREBASE] Firebase authentication successful");

            // Explicitly store session data after successful login
            const user = result.user;
            if (user) {
              try {
                const token = await firebaseAuthService.getIdToken();
                const formattedUser = formatFirebaseUser(user);

                // Store session data immediately with comprehensive logging
                console.log(
                  "🔍 [FIREBASE] Attempting to store session data..."
                );
                const sessionStored = sessionManagementService.storeSessionData(
                  "firebase",
                  formattedUser,
                  {
                    access_token: token,
                    storedAt: Date.now(),
                  }
                );

                if (sessionStored) {
                  console.log("✅ [FIREBASE] Session data stored successfully");

                  // Verify session was stored correctly
                  const verifySession =
                    sessionManagementService.getSessionData();
                  console.log(
                    "🔍 [FIREBASE] Session verification:",
                    verifySession ? "Success" : "Failed"
                  );

                  // Set user state immediately
                  setCurrentUser(formattedUser);
                  setAuthMethod("firebase");
                  console.log("✅ [FIREBASE] User state updated successfully");
                } else {
                  console.error("❌ [FIREBASE] Failed to store session data");
                  throw new Error("Failed to store authentication session");
                }
              } catch (sessionError) {
                console.error(
                  "⚠️ [FIREBASE] Failed to store session data:",
                  sessionError
                );
                // Continue anyway - auth state listener will handle it
              }
            }

            setLoading(false);
            return result.user;
          } else {
            throw new Error(result.error || "Firebase authentication failed");
          }
        } catch (firebaseError) {
          console.warn(
            "⚠️ [FIREBASE] Firebase authentication failed:",
            firebaseError.message
          );

          // Log Firebase authentication failure for monitoring
          await authAuditService.logAuthAttempt({
            method: "firebase_email",
            email: email,
            status: "failed",
            reason: firebaseError.message,
            timestamp: new Date().toISOString(),
            ipAddress: await getClientIP(),
            userAgent: navigator.userAgent,
          });

          setLoading(false);
          // Provide specific Firebase error message
          throw new Error(`Authentication failed: ${firebaseError.message}`);
        }
      } else {
        // Firebase is not available
        console.warn(
          "⚠️ [FIREBASE] Firebase authentication service is not available"
        );
        setLoading(false);
        throw new Error(
          "Authentication service is currently unavailable. Please contact support."
        );
      }
    } catch (error) {
      console.error("❌ [AUTH] Email sign-in error:", error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  }

  async function signUp(name, email, password, confirmPassword) {
    try {
      setError(null);

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (isFirebaseAvailable) {
        // Use Firebase for account creation
        const result = await firebaseAuthService.createAccountWithEmail(
          email,
          password,
          name
        );
        if (result.success) {
          // User will be set via auth state listener
          return result;
        }
      } else {
        throw new Error("Firebase authentication is not configured");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setError(error.message);
      throw error;
    }
  }

  // OAuth Authentication Methods
  async function signInWithGoogle(useRedirect = false) {
    try {
      setError(null);

      if (isFirebaseAvailable) {
        // Use Firebase for Google authentication
        const result = await firebaseAuthService.signInWithGoogle(useRedirect);
        if (result.success && !result.redirecting) {
          // User will be set via auth state listener
          return result.user;
        }
        return result;
      } else {
        // Fallback to OAuth service
        await oauthService.initiateGoogleAuth();
        return { success: true, redirecting: true };
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError(error.message);
      throw error;
    }
  }

  async function signInWithGitHub(useRedirect = false) {
    try {
      setError(null);

      if (isFirebaseAvailable) {
        // Use Firebase for GitHub authentication
        const result = await firebaseAuthService.signInWithGitHub(useRedirect);
        if (result.success && !result.redirecting) {
          // User will be set via auth state listener
          return result.user;
        }
        return result;
      } else {
        // Fallback to OAuth service
        await oauthService.initiateGitHubAuth();
        return { success: true, redirecting: true };
      }
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      setError(error.message);
      throw error;
    }
  }

  // OAuth callback handler for non-Firebase flows
  async function handleOAuthCallback(provider, userData) {
    try {
      if (!isFirebaseAvailable) {
        const user = formatOAuthUser(userData, provider);
        setCurrentUser(user);
        setAuthMethod(provider);

        // Store session data using session management service
        const tokens = {
          access_token: userData.access_token,
          refresh_token: userData.refresh_token,
          expires_at: userData.expires_at,
          storedAt: Date.now(),
        };
        sessionManagementService.storeSessionData(provider, user, tokens);

        return user;
      }
    } catch (error) {
      console.error(`OAuth callback error for ${provider}:`, error);
      setError(error.message);
      throw error;
    }
  }

  // Password Management
  async function changePassword(
    currentPassword,
    newPassword,
    confirmNewPassword
  ) {
    try {
      setError(null);

      if (!currentUser) {
        throw new Error("No user logged in");
      }

      if (newPassword !== confirmNewPassword) {
        throw new Error("New passwords do not match");
      }

      if (isFirebaseAvailable && authMethod === "firebase") {
        // Use Firebase for password change
        const result = await firebaseAuthService.updateUserPassword(
          currentPassword,
          newPassword
        );
        return result;
      } else {
        // Fallback to traditional auth service
        throw new Error("Firebase authentication is not configured");
      }
    } catch (error) {
      console.error("Password change error:", error);
      setError(error.message);
      throw error;
    }
  }

  async function sendPasswordReset(email) {
    try {
      setError(null);

      if (isFirebaseAvailable) {
        // Use Firebase for password reset
        const result = await firebaseAuthService.sendPasswordReset(email);
        return result;
      } else {
        // Could implement fallback password reset via traditional auth
        throw new Error("Password reset not available in fallback mode");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Profile Management
  async function updateProfile(profileData) {
    try {
      setError(null);

      if (!currentUser) {
        throw new Error("No user logged in");
      }

      if (isFirebaseAvailable && authMethod === "firebase") {
        // Use Firebase for profile update
        const result = await firebaseAuthService.updateUserProfile(profileData);
        if (result.success) {
          // User will be updated via auth state listener
          return result;
        }
      } else {
        // Update local user data for non-Firebase auth
        const updatedUser = { ...currentUser, ...profileData };
        setCurrentUser(updatedUser);

        // Update session data with new user information
        const sessionData = sessionManagementService.getSessionData();
        if (sessionData) {
          sessionManagementService.storeSessionData(
            authMethod,
            updatedUser,
            sessionData.tokens
          );
        }

        return { success: true, user: updatedUser };
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Email Verification
  async function sendEmailVerification() {
    try {
      setError(null);

      if (isFirebaseAvailable && authMethod === "firebase") {
        const result = await firebaseAuthService.sendEmailVerification();
        return result;
      } else {
        throw new Error(
          "Email verification not available in current auth mode"
        );
      }
    } catch (error) {
      console.error("Email verification error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Sign Out
  async function logout() {
    try {
      setError(null);
      setLoading(true);

      const userData =
        currentUser || JSON.parse(localStorage.getItem("userData") || "{}");

      // Log logout event for admin bypass users
      if (authMethod === "admin_bypass" && userData.email) {
        await authAuditService.logLogout({
          userId: userData.uid,
          email: userData.email,
          authMethod: "admin_bypass",
          sessionId: localStorage.getItem("adminBypassSession"),
          ipAddress: await getClientIP(),
          userAgent: navigator.userAgent,
        });
      }

      if (authMethod === "admin_bypass") {
        // Handle admin bypass logout with comprehensive cleanup
        console.log("🔐 Admin bypass logout - performing complete cleanup");
        const cleanupResult = cleanupAdminData();
        if (cleanupResult.success) {
          console.log("✅ Admin data cleanup completed");
        } else {
          console.warn(
            "⚠️ Admin data cleanup had issues:",
            cleanupResult.error
          );
        }
      } else if (isFirebaseAvailable && authMethod === "firebase") {
        // Use Firebase sign out
        await firebaseAuthService.signOut();
      } else {
        // OAuth logout for non-Firebase auth methods
        if (authMethod && authMethod !== "email") {
          oauthService.logout(authMethod).catch((error) => {
            console.warn(`OAuth logout failed for ${authMethod}:`, error);
          });
        }
      }

      // Clear local state
      setCurrentUser(null);
      setAuthMethod(null);
      sessionManagementService.clearSessionData();
      localStorage.removeItem("adminBypassSession");

      // Additional cleanup for any residual admin data
      localStorage.removeItem("adminSetupResult");
      localStorage.removeItem("setupResult");

      console.log("✅ Logout successful");
    } catch (error) {
      console.error("Logout error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // User formatting functions
  const formatFirebaseUser = (firebaseUser) => {
    return {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      provider: firebaseUser.provider || "firebase",
      providers: firebaseUser.providers || [],
      role: "user", // Default role
      status: "active",
      // Legacy compatibility
      name: firebaseUser.displayName,
      verified: firebaseUser.emailVerified,
    };
  };

  const formatTraditionalUser = (user) => {
    return {
      id: user.id,
      email: user.email,
      displayName: user.name,
      photoURL: null,
      role: user.role || "user",
      provider: "email",
      status: user.status || "active",
      // Legacy compatibility
      name: user.name,
      verified: true,
    };
  };

  const formatOAuthUser = (oauthUser, provider) => {
    return {
      id: oauthUser.providerId,
      email: oauthUser.email,
      displayName: oauthUser.name || oauthUser.username,
      photoURL: oauthUser.avatar,
      role: "user",
      provider: provider,
      verified: oauthUser.verified,
      username: oauthUser.username,
      status: "active",
      // Legacy compatibility
      name: oauthUser.name || oauthUser.username,
    };
  };

  // Utility functions
  const isAuthenticated = () => {
    return !!currentUser;
  };

  const isOAuthUser = () => {
    return authMethod && authMethod !== "email" && authMethod !== "firebase";
  };

  const isFirebaseUser = () => {
    return authMethod === "firebase";
  };

  const getAuthMethod = () => {
    return authMethod;
  };

  const clearError = () => {
    setError(null);
  };

  // Get authentication token
  const getAuthToken = async () => {
    try {
      if (isFirebaseUser()) {
        return await firebaseAuthService.getIdToken();
      } else if (isOAuthUser()) {
        return await oauthService.getAccessToken(authMethod);
      } else {
        // Traditional auth - return stored token from session management service
        const sessionData = sessionManagementService.getSessionData();
        return (
          sessionData?.tokens?.access_token || localStorage.getItem("authToken")
        );
      }
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  };

  // Blog permissions helper
  const blogPermissions = {
    canCreate:
      currentUser &&
      (currentUser.role === "admin" || currentUser.role === "author"),
    canEdit: (postAuthorId) =>
      currentUser &&
      (currentUser.role === "admin" || currentUser.id === postAuthorId),
    canDelete: (postAuthorId) =>
      currentUser &&
      (currentUser.role === "admin" || currentUser.id === postAuthorId),
    canPublish:
      currentUser &&
      (currentUser.role === "admin" || currentUser.role === "author"),
    canManage: currentUser && currentUser.role === "admin",
  };

  // Check if current user is admin
  const isAdmin = () => {
    return currentUser && currentUser.role === "admin";
  };

  // Get user display name
  const getUserDisplay = (user = currentUser) => {
    if (!user) return "Unknown User";
    return user.displayName || user.name || user.email || "User";
  };

  const value = {
    // State
    currentUser,
    authMethod,
    loading,
    error,
    isFirebaseAvailable,

    // Blog permissions and admin utilities
    blogPermissions,
    isAdmin,
    getUserDisplay,
    authError: error,
    clearError,

    // Authentication methods
    signInWithEmail,
    signInWithGoogle,
    signInWithGitHub,
    signUp,
    logout,

    // Password management
    changePassword,
    sendPasswordReset,

    // Profile management
    updateProfile,
    sendEmailVerification,

    // OAuth callback (for non-Firebase flows)
    handleOAuthCallback,

    // Utility functions
    isAuthenticated,
    isOAuthUser,
    isFirebaseUser,
    getAuthMethod,
    getAuthToken,
    clearError,

    // Legacy compatibility methods
    signInWithOAuth: handleOAuthCallback,
    updateCurrentUser: updateProfile,
    refreshOAuthUser: (provider) => {
      // Legacy method - could be implemented if needed
      console.warn("refreshOAuthUser is deprecated");
    },
    isProviderAvailable: (provider) => {
      return isFirebaseAvailable || oauthService.isAuthenticated(provider);
    },
    getOAuthToken: getAuthToken,

    // Direct service access for advanced use cases
    firebaseAuth: isFirebaseAvailable ? firebaseAuthService : null,
    oauthAuth: oauthService,
  };

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
}

export default EnhancedAuthProvider;
