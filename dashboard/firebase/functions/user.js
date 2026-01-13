/**
 * Firebase User Management Functions
 * Handles user-related operations like registration, password changes, etc.
 */

const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const Joi = require("joi");
const bcrypt = require("bcrypt");

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).required(),
  newPassword: Joi.string().min(8).required(),
});

/**
 * Utility function to check if user is admin
 */
async function isAdmin(userId) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    return userDoc.exists && userDoc.data().role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Firebase Function: User Registration
 * Replaces the PHP signup endpoint
 */
exports.register = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { name, email, password } = value;

    // Check if user already exists
    const existingUser = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // Create user document in Firestore
    const userDoc = {
      uid: userRecord.uid,
      email: email,
      name: name,
      role: "user",
      status: "pending", // Requires admin approval
      provider: "email",
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
      },
      metadata: {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: null,
        loginCount: 0,
        emailVerifiedAt: null,
      },
    };

    await db.collection("users").doc(userRecord.uid).set(userDoc);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Awaiting admin approval.",
      userId: userRecord.uid,
    });
  } catch (error) {
    console.error("Registration function error:", error);

    if (error.code === "auth/email-already-exists") {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    return res
      .status(500)
      .json({ success: false, message: "Registration failed" });
  }
});

/**
 * Firebase Function: Change Password
 * Replaces the PHP change password endpoint
 */
exports.changePassword = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // Validate request body
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { currentPassword, newPassword } = value;

    // Get user from Firebase Auth (assuming they're authenticated)
    // In a real implementation, you'd verify the ID token first
    // For this example, we'll assume the user ID is passed in the request
    const userId = req.body.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Update password in Firebase Auth
    await auth.updateUser(userId, {
      password: newPassword,
    });

    // Update password changed timestamp in Firestore
    await db.collection("users").doc(userId).update({
      "metadata.passwordChangedAt":
        admin.firestore.FieldValue.serverTimestamp(),
      "metadata.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to change password" });
  }
});

/**
 * Firebase Function: Get All Users (Admin only)
 * Replaces various PHP user management endpoints
 */
exports.getAllUsers = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // In a real implementation, you'd verify the ID token from the Authorization header
    // For this example, we'll assume the user ID is passed in the request
    const userId = req.query.userId || req.body.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user is admin
    const isAdminUser = await isAdmin(userId);
    if (!isAdminUser) {
      return res.status(403).json({
        success: false,
        message: "Admin privileges required",
      });
    }

    // Get all users
    const usersSnapshot = await db.collection("users").get();

    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get all users function error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * Firebase Function: Get Pending Users (Admin only)
 */
exports.getPendingUsers = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // In a real implementation, you'd verify the ID token from the Authorization header
    // For this example, we'll assume the user ID is passed in the request
    const userId = req.query.userId || req.body.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user is admin
    const isAdminUser = await isAdmin(userId);
    if (!isAdminUser) {
      return res.status(403).json({
        success: false,
        message: "Admin privileges required",
      });
    }

    // Get pending users
    const usersSnapshot = await db
      .collection("users")
      .where("status", "==", "pending")
      .get();

    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get pending users function error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * Firebase Function: Approve User (Admin only)
 */
exports.approveUser = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const targetUserId = req.body.userId;
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required",
      });
    }

    // In a real implementation, you'd verify the ID token from the Authorization header
    // For this example, we'll assume the admin user ID is passed in the request
    const adminUserId = req.body.adminUserId;
    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user is admin
    const isAdminUser = await isAdmin(adminUserId);
    if (!isAdminUser) {
      return res.status(403).json({
        success: false,
        message: "Admin privileges required",
      });
    }

    // Update user status
    await db.collection("users").doc(targetUserId).update({
      status: "active",
      "metadata.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "User approved successfully",
    });
  } catch (error) {
    console.error("Approve user function error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * Firebase Function: Reject User (Admin only)
 */
exports.rejectUser = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const targetUserId = req.body.userId;
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required",
      });
    }

    // In a real implementation, you'd verify the ID token from the Authorization header
    // For this example, we'll assume the admin user ID is passed in the request
    const adminUserId = req.body.adminUserId;
    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user is admin
    const isAdminUser = await isAdmin(adminUserId);
    if (!isAdminUser) {
      return res.status(403).json({
        success: false,
        message: "Admin privileges required",
      });
    }

    // Update user status
    await db.collection("users").doc(targetUserId).update({
      status: "rejected",
      "metadata.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "User rejected successfully",
    });
  } catch (error) {
    console.error("Reject user function error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * Firebase Function: Delete User (Admin only)
 */
exports.deleteUser = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow DELETE requests
    if (req.method !== "DELETE") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const targetUserId = req.query.userId;
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required",
      });
    }

    // In a real implementation, you'd verify the ID token from the Authorization header
    // For this example, we'll assume the admin user ID is passed in the request
    const adminUserId = req.body.adminUserId;
    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user is admin
    const isAdminUser = await isAdmin(adminUserId);
    if (!isAdminUser) {
      return res.status(403).json({
        success: false,
        message: "Admin privileges required",
      });
    }

    // Delete user from Firebase Auth
    await auth.deleteUser(targetUserId);

    // Delete user document from Firestore
    await db.collection("users").doc(targetUserId).delete();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user function error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
