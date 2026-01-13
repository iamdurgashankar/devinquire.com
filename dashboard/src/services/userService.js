/**
 * User Management Service
 * Firebase-based user management replacing PHP backend user operations
 * Handles user CRUD, roles, permissions, profiles, and admin operations
 */

import firestoreService from "./firestoreService";
import { getAuthInstance, DB_CONFIG } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  updatePassword,
  updateEmail,
  deleteUser as deleteAuthUser,
  onAuthStateChanged,
} from "firebase/auth";

class UserService {
  constructor() {
    this.collectionName = DB_CONFIG.collections.users;
    this.currentUser = null;
    this.authStateListeners = new Set();

    // Listen to auth state changes
    const authInstance = getAuthInstance();
    if (authInstance) {
      onAuthStateChanged(authInstance, (user) => {
        this.currentUser = user;
        this.authStateListeners.forEach((callback) => callback(user));
      });
    }
  }

  // =============================================
  // USER AUTHENTICATION & CREATION
  // =============================================

  /**
   * Create a new user account
   */
  async createUser(userData) {
    try {
      const {
        email,
        password,
        name,
        role = "user",
        ...additionalData
      } = userData;

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        getAuthInstance(),
        email,
        password
      );
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName: name });

      // Send email verification
      await sendEmailVerification(user);

      // Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        email: email.toLowerCase(),
        name,
        role,
        status: "pending", // Requires admin approval
        avatar: null,
        provider: "email",
        providerId: user.uid,
        verified: false,
        permissions: [],
        preferences: {
          theme: "system",
          language: "en",
          notifications: {
            email: true,
            push: true,
            marketing: false,
          },
          privacy: {
            profileVisibility: "public",
            showEmail: false,
            showActivity: true,
          },
        },
        profile: {
          firstName: name.split(" ")[0] || "",
          lastName: name.split(" ").slice(1).join(" ") || "",
          bio: "",
          website: "",
          location: "",
          company: "",
          jobTitle: "",
          socialLinks: {
            twitter: "",
            linkedin: "",
            github: "",
          },
        },
        metadata: {
          createdAt: firestoreService.getServerTimestamp(),
          updatedAt: firestoreService.getServerTimestamp(),
          lastLoginAt: null,
          loginCount: 0,
          emailVerifiedAt: null,
          passwordChangedAt: firestoreService.getServerTimestamp(),
        },
        settings: {
          twoFactorEnabled: false,
          sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
          autoLogout: false,
        },
        ...additionalData,
      };

      const result = await firestoreService.createDocument(
        this.collectionName,
        userDoc,
        user.uid
      );

      return {
        success: true,
        user: {
          ...result.data,
          id: user.uid,
          uid: user.uid,
        },
        requiresApproval: true,
      };
    } catch (error) {
      console.error("Create user error:", error);
      throw error;
    }
  }

  /**
   * Create OAuth user from provider data
   */
  async createOAuthUser(firebaseUser, providerData) {
    try {
      const userDoc = {
        uid: firebaseUser.uid,
        email: firebaseUser.email?.toLowerCase(),
        name: firebaseUser.displayName || providerData.name || "",
        role: "user",
        status: "active", // OAuth users are auto-approved
        avatar: firebaseUser.photoURL || providerData.avatar,
        provider: providerData.provider || "unknown",
        providerId: providerData.providerId || firebaseUser.uid,
        verified: firebaseUser.emailVerified,
        permissions: [],
        preferences: {
          theme: "system",
          language: "en",
          notifications: {
            email: true,
            push: true,
            marketing: false,
          },
          privacy: {
            profileVisibility: "public",
            showEmail: false,
            showActivity: true,
          },
        },
        profile: {
          firstName:
            providerData.firstName ||
            firebaseUser.displayName?.split(" ")[0] ||
            "",
          lastName:
            providerData.lastName ||
            firebaseUser.displayName?.split(" ").slice(1).join(" ") ||
            "",
          bio: providerData.bio || "",
          website: providerData.website || "",
          location: providerData.location || "",
          company: providerData.company || "",
          jobTitle: "",
          socialLinks: {
            twitter: "",
            linkedin: "",
            github: providerData.githubUrl || "",
          },
        },
        metadata: {
          createdAt: firestoreService.getServerTimestamp(),
          updatedAt: firestoreService.getServerTimestamp(),
          lastLoginAt: firestoreService.getServerTimestamp(),
          loginCount: 1,
          emailVerifiedAt: firebaseUser.emailVerified
            ? firestoreService.getServerTimestamp()
            : null,
          passwordChangedAt: null,
        },
        settings: {
          twoFactorEnabled: false,
          sessionTimeout: 30 * 24 * 60 * 60 * 1000,
          autoLogout: false,
        },
      };

      return await firestoreService.createDocument(
        this.collectionName,
        userDoc,
        firebaseUser.uid
      );
    } catch (error) {
      console.error("Create OAuth user error:", error);
      throw error;
    }
  }

  // =============================================
  // USER RETRIEVAL
  // =============================================

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      return await firestoreService.getDocument(this.collectionName, userId);
    } catch (error) {
      console.error("Get user by ID error:", error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    try {
      if (!this.currentUser) {
        return { success: false, error: "No authenticated user" };
      }

      return await this.getUserById(this.currentUser.uid);
    } catch (error) {
      console.error("Get current user error:", error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    try {
      const result = await firestoreService.getDocuments(this.collectionName, {
        filters: [
          { field: "email", operator: "==", value: email.toLowerCase() },
        ],
        limitCount: 1,
      });

      if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }

      return { success: false, error: "User not found" };
    } catch (error) {
      console.error("Get user by email error:", error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(options = {}) {
    try {
      const {
        role = null,
        status = null,
        orderBy = "createdAt",
        orderDirection = "desc",
        limit = 50,
        startAfter = null,
      } = options;

      const filters = [];
      if (role) filters.push({ field: "role", operator: "==", value: role });
      if (status)
        filters.push({ field: "status", operator: "==", value: status });

      return await firestoreService.getDocuments(this.collectionName, {
        filters,
        orderByField: `metadata.${orderBy}`,
        orderByDirection: orderDirection,
        limitCount: limit,
        startAfterDoc: startAfter,
      });
    } catch (error) {
      console.error("Get all users error:", error);
      throw error;
    }
  }

  /**
   * Get pending users (admin approval required)
   */
  async getPendingUsers() {
    try {
      return await firestoreService.getDocuments(this.collectionName, {
        filters: [{ field: "status", operator: "==", value: "pending" }],
        orderByField: "metadata.createdAt",
        orderByDirection: "asc",
      });
    } catch (error) {
      console.error("Get pending users error:", error);
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm, options = {}) {
    try {
      const { role = null, status = null, limit = 20 } = options;

      // Note: For full-text search, consider using Algolia or similar service
      // This is a basic implementation using name prefix search
      const filters = [];
      if (role) filters.push({ field: "role", operator: "==", value: role });
      if (status)
        filters.push({ field: "status", operator: "==", value: status });

      // Basic name search - in production, use proper search service
      return await firestoreService.getDocuments(this.collectionName, {
        filters,
        orderByField: "name",
        orderByDirection: "asc",
        limitCount: limit,
      });
    } catch (error) {
      console.error("Search users error:", error);
      throw error;
    }
  }

  // =============================================
  // USER UPDATE OPERATIONS
  // =============================================

  /**
   * Update user profile
   */
  async updateUserProfile(userId, profileData) {
    try {
      // Validate required fields
      if (!userId) {
        return { success: false, error: "User ID is required" };
      }

      // Normalize field names (handle both displayName and name)
      const normalizedData = { ...profileData };
      if (profileData.displayName && !profileData.name) {
        normalizedData.name = profileData.displayName;
      }
      if (profileData.name && !profileData.displayName) {
        normalizedData.displayName = profileData.name;
      }

      const updateData = {
        ...normalizedData,
        "metadata.updatedAt": firestoreService.getServerTimestamp(),
      };

      // Update display name in Firebase Auth if current user
      if (
        this.currentUser &&
        this.currentUser.uid === userId &&
        (normalizedData.displayName || normalizedData.name)
      ) {
        await updateProfile(this.currentUser, {
          displayName: normalizedData.displayName || normalizedData.name,
        });
      }

      const result = await firestoreService.updateDocument(
        this.collectionName,
        userId,
        updateData
      );

      return {
        success: true,
        message: "Profile updated successfully",
        ...result
      };
    } catch (error) {
      console.error("Update user profile error:", error);
      return {
        success: false,
        error: error.message || "Failed to update profile"
      };
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const updateData = {
        preferences,
        "metadata.updatedAt": firestoreService.getServerTimestamp(),
      };

      return await firestoreService.updateDocument(
        this.collectionName,
        userId,
        updateData
      );
    } catch (error) {
      console.error("Update user preferences error:", error);
      throw error;
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId, role, permissions = []) {
    try {
      const updateData = {
        role,
        permissions,
        "metadata.updatedAt": firestoreService.getServerTimestamp(),
      };

      return await firestoreService.updateDocument(
        this.collectionName,
        userId,
        updateData
      );
    } catch (error) {
      console.error("Update user role error:", error);
      throw error;
    }
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(userId, status) {
    try {
      const updateData = {
        status,
        "metadata.updatedAt": firestoreService.getServerTimestamp(),
      };

      return await firestoreService.updateDocument(
        this.collectionName,
        userId,
        updateData
      );
    } catch (error) {
      console.error("Update user status error:", error);
      throw error;
    }
  }

  /**
   * Approve user (admin only)
   */
  async approveUser(userId) {
    try {
      return await this.updateUserStatus(userId, "active");
    } catch (error) {
      console.error("Approve user error:", error);
      throw error;
    }
  }

  /**
   * Reject user (admin only)
   */
  async rejectUser(userId) {
    try {
      return await this.updateUserStatus(userId, "rejected");
    } catch (error) {
      console.error("Reject user error:", error);
      throw error;
    }
  }

  /**
   * Suspend user (admin only)
   */
  async suspendUser(userId) {
    try {
      return await this.updateUserStatus(userId, "suspended");
    } catch (error) {
      console.error("Suspend user error:", error);
      throw error;
    }
  }

  /**
   * Ban user (admin only)
   */
  async banUser(userId) {
    try {
      return await this.updateUserStatus(userId, "banned");
    } catch (error) {
      console.error("Ban user error:", error);
      throw error;
    }
  }

  /**
   * Update user avatar
   */
  async updateUserAvatar(userId, avatarUrl) {
    try {
      const updateData = {
        avatar: avatarUrl,
        "metadata.updatedAt": firestoreService.getServerTimestamp(),
      };

      // Update photo URL in Firebase Auth if current user
      if (this.currentUser && this.currentUser.uid === userId) {
        await updateProfile(this.currentUser, {
          photoURL: avatarUrl,
        });
      }

      return await firestoreService.updateDocument(
        this.collectionName,
        userId,
        updateData
      );
    } catch (error) {
      console.error("Update user avatar error:", error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changeUserPassword(newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error("No authenticated user");
      }

      await updatePassword(this.currentUser, newPassword);

      // Update password change timestamp
      await firestoreService.updateDocument(
        this.collectionName,
        this.currentUser.uid,
        {
          "metadata.passwordChangedAt": firestoreService.getServerTimestamp(),
          "metadata.updatedAt": firestoreService.getServerTimestamp(),
        }
      );

      return { success: true };
    } catch (error) {
      console.error("Change user password error:", error);
      throw error;
    }
  }

  /**
   * Change user email
   */
  async changeUserEmail(newEmail) {
    try {
      if (!this.currentUser) {
        throw new Error("No authenticated user");
      }

      await updateEmail(this.currentUser, newEmail);

      // Update email in Firestore
      await firestoreService.updateDocument(
        this.collectionName,
        this.currentUser.uid,
        {
          email: newEmail.toLowerCase(),
          verified: false,
          "metadata.updatedAt": firestoreService.getServerTimestamp(),
        }
      );

      // Send verification email
      await sendEmailVerification(this.currentUser);

      return { success: true };
    } catch (error) {
      console.error("Change user email error:", error);
      throw error;
    }
  }

  // =============================================
  // USER DELETION
  // =============================================

  /**
   * Delete user account
   */
  async deleteUser(userId, deleteAuth = true) {
    try {
      // Soft delete in Firestore first
      await firestoreService.updateDocument(this.collectionName, userId, {
        status: "deleted",
        "metadata.deletedAt": firestoreService.getServerTimestamp(),
        "metadata.updatedAt": firestoreService.getServerTimestamp(),
      });

      // Delete from Firebase Auth if requested and current user
      if (deleteAuth && this.currentUser && this.currentUser.uid === userId) {
        await deleteAuthUser(this.currentUser);
      }

      return { success: true };
    } catch (error) {
      console.error("Delete user error:", error);
      throw error;
    }
  }

  /**
   * Permanently delete user (admin only)
   */
  async permanentlyDeleteUser(userId) {
    try {
      // Delete user document
      await firestoreService.deleteDocument(this.collectionName, userId);

      return { success: true };
    } catch (error) {
      console.error("Permanently delete user error:", error);
      throw error;
    }
  }

  // =============================================
  // USER SESSIONS & ACTIVITY
  // =============================================

  /**
   * Update user login activity
   */
  async updateLoginActivity(userId) {
    try {
      const updateData = {
        "metadata.lastLoginAt": firestoreService.getServerTimestamp(),
        "metadata.loginCount": firestoreService.getIncrement(1),
        "metadata.updatedAt": firestoreService.getServerTimestamp(),
      };

      return await firestoreService.updateDocument(
        this.collectionName,
        userId,
        updateData
      );
    } catch (error) {
      console.error("Update login activity error:", error);
      throw error;
    }
  }

  /**
   * Log user activity
   */
  async logUserActivity(userId, activityData) {
    try {
      const activityDoc = {
        ...activityData,
        userId,
        timestamp: firestoreService.getServerTimestamp(),
      };

      // Create activity in subcollection
      const activityRef = `${this.collectionName}/${userId}/activity`;
      return await firestoreService.createDocument(activityRef, activityDoc);
    } catch (error) {
      console.error("Log user activity error:", error);
      throw error;
    }
  }

  /**
   * Get user activity log
   */
  async getUserActivityLog(userId, options = {}) {
    try {
      const {
        limit = 50,
        orderBy = "timestamp",
        orderDirection = "desc",
        startAfter = null,
      } = options;

      const activityRef = `${this.collectionName}/${userId}/activity`;
      return await firestoreService.getDocuments(activityRef, {
        orderByField: orderBy,
        orderByDirection: orderDirection,
        limitCount: limit,
        startAfterDoc: startAfter,
      });
    } catch (error) {
      console.error("Get user activity log error:", error);
      throw error;
    }
  }

  // =============================================
  // REAL-TIME OPERATIONS
  // =============================================

  /**
   * Listen to user changes
   */
  listenToUser(userId, callback) {
    return firestoreService.listenToDocument(
      this.collectionName,
      userId,
      callback
    );
  }

  /**
   * Listen to users collection
   */
  listenToUsers(callback, options = {}) {
    const {
      filters = [],
      orderBy = "metadata.createdAt",
      orderDirection = "desc",
      limit = 50,
    } = options;

    return firestoreService.listenToCollection(this.collectionName, callback, {
      filters,
      orderByField: orderBy,
      orderByDirection: orderDirection,
      limitCount: limit,
    });
  }

  /**
   * Add auth state listener
   */
  addAuthStateListener(callback) {
    this.authStateListeners.add(callback);
    // Call immediately with current state
    callback(this.currentUser);

    return () => {
      this.authStateListeners.delete(callback);
    };
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Check if user has role
   */
  hasRole(user, role) {
    return user && user.role === role;
  }

  /**
   * Check if user has permission
   */
  hasPermission(user, permission) {
    return user && user.permissions && user.permissions.includes(permission);
  }

  /**
   * Check if user is admin
   */
  isAdmin(user) {
    return this.hasRole(user, "admin");
  }

  /**
   * Check if user is active
   */
  isActive(user) {
    return user && user.status === "active";
  }

  /**
   * Get user display name
   */
  getDisplayName(user) {
    return user?.name || user?.email || "Unknown User";
  }

  /**
   * Get user avatar with fallback
   */
  getUserAvatar(user) {
    return (
      user?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        this.getDisplayName(user)
      )}&background=3B82F6&color=ffffff`
    );
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      ...firestoreService.getStatus(),
      currentUser: !!this.currentUser,
      authListeners: this.authStateListeners.size,
    };
  }
}

// Create and export singleton instance
const userService = new UserService();
export default userService;
