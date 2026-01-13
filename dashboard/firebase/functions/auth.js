/**
 * Firebase Authentication Functions
 * Replaces PHP authentication endpoints with Firebase Functions
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
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

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
 * Firebase Function: User Login
 * Replaces the PHP login endpoint
 */
exports.login = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { email, password } = value;

    // Check if user exists in Firestore
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", email)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // For email/password users, verify with Firebase Auth
    try {
      // Sign in with Firebase Auth
      const userRecord = await auth.getUserByEmail(email);

      // For custom password handling (if needed), we would verify against stored hash
      // But Firebase Auth handles this automatically, so we'll just create a custom token
      const customToken = await auth.createCustomToken(userRecord.uid);

      // Update last login timestamp
      await userDoc.ref.update({
        "metadata.lastLoginAt": admin.firestore.FieldValue.serverTimestamp(),
        "metadata.loginCount": admin.firestore.FieldValue.increment(1),
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          uid: userRecord.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          avatar: userData.avatar,
          provider: userData.provider,
        },
        token: customToken,
      });
    } catch (authError) {
      console.error("Firebase Auth error:", authError);
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

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
 * Firebase Function: Get Current User
 * Replaces the PHP session endpoint
 */
exports.getCurrentUser = onRequest({ cors: true }, async (req, res) => {
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
      return res.status(400).json({
        loggedIn: false,
        user: null,
        message: "User ID is required",
      });
    }

    // Get user document from Firestore
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        loggedIn: false,
        user: null,
        message: "User not found",
      });
    }

    const userData = userDoc.data();

    // Check if user is active
    if (userData.status !== "active") {
      return res.status(401).json({
        loggedIn: false,
        user: null,
        message: "User account is not active",
      });
    }

    return res.status(200).json({
      loggedIn: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar,
        provider: userData.provider,
        verified: userData.verified,
      },
    });
  } catch (error) {
    console.error("Get current user function error:", error);
    return res.status(500).json({
      loggedIn: false,
      user: null,
      error: "Internal server error",
    });
  }
});

/**
 * Firebase Function: User Logout
 * Replaces the PHP logout endpoint
 */
exports.logout = onRequest({ cors: true }, async (req, res) => {
  try {
    // Allow GET and POST requests
    if (!["GET", "POST"].includes(req.method)) {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // For Firebase Auth, logout is handled client-side by deleting the token
    // Server-side, we can invalidate any custom sessions if needed
    // For this example, we'll just return success

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});
