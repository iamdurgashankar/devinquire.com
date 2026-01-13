const admin = require("firebase-admin");

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Import function modules
const authFunctions = require("./auth");
const contentFunctions = require("./content");
const userFunctions = require("./user");
const adminFunctions = require("./createAdminUser");

// =============================================
// AUTHENTICATION FUNCTIONS
// =============================================

// Export authentication functions
exports.login = authFunctions.login;
exports.register = authFunctions.register;
exports.changePassword = authFunctions.changePassword;
exports.getCurrentUser = authFunctions.getCurrentUser;
exports.logout = authFunctions.logout;

// =============================================
// CONTENT MANAGEMENT FUNCTIONS
// =============================================

// Export content management functions
exports.getPosts = contentFunctions.getPosts;
exports.getPostById = contentFunctions.getPostById;
exports.createPost = contentFunctions.createPost;
exports.updatePost = contentFunctions.updatePost;
exports.deletePost = contentFunctions.deletePost;

exports.getPages = contentFunctions.getPages;
exports.getPageById = contentFunctions.getPageById;
exports.createPage = contentFunctions.createPage;
exports.updatePage = contentFunctions.updatePage;
exports.deletePage = contentFunctions.deletePage;

// =============================================
// USER MANAGEMENT FUNCTIONS
// =============================================

// Export user management functions
exports.register = userFunctions.register;
exports.changePassword = userFunctions.changePassword;
exports.getAllUsers = userFunctions.getAllUsers;
exports.getPendingUsers = userFunctions.getPendingUsers;
exports.approveUser = userFunctions.approveUser;
exports.rejectUser = userFunctions.rejectUser;
exports.deleteUser = userFunctions.deleteUser;

// =============================================
// ADMIN SETUP FUNCTIONS
// =============================================

// Export admin setup functions
exports.createAdminUser = adminFunctions.createAdminUser;
