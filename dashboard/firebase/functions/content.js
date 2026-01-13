/**
 * Firebase Content Management Functions
 * Handles posts, pages, and content-related operations
 */

const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const Joi = require("joi");

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
const postSchema = Joi.object({
  title: Joi.string().min(1).required(),
  content: Joi.string().allow("").required(),
  excerpt: Joi.string().allow("").optional(),
  status: Joi.string().valid("draft", "published", "archived").default("draft"),
  featuredImage: Joi.string().uri().optional().allow(""),
  slug: Joi.string().optional(),
  metaTitle: Joi.string().optional(),
  metaDescription: Joi.string().optional(),
});

const pageSchema = Joi.object({
  title: Joi.string().min(1).required(),
  content: Joi.string().allow("").required(),
  slug: Joi.string().optional(),
  template: Joi.string().optional(),
  status: Joi.string().valid("draft", "published", "archived").default("draft"),
  metaTitle: Joi.string().optional(),
  metaDescription: Joi.string().optional(),
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
 * Utility function to check if user owns content
 */
async function isContentOwner(userId, contentAuthorId) {
  return userId === contentAuthorId;
}

/**
 * Firebase Function: Get All Posts
 */
exports.getPosts = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // Get all published posts
    const postsSnapshot = await db
      .collection("posts")
      .where("status", "==", "published")
      .orderBy("metadata.createdAt", "desc")
      .get();

    const posts = [];
    postsSnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Get posts function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/**
 * Firebase Function: Get Post by ID
 */
exports.getPostById = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const postId = req.query.postId;
    if (!postId) {
      return res
        .status(400)
        .json({ success: false, message: "Post ID is required" });
    }

    const postDoc = await db.collection("posts").doc(postId).get();

    if (!postDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const postData = postDoc.data();

    // Check if post is published or user has permission to view
    // In a real implementation, you'd verify the user's token
    if (postData.status !== "published") {
      return res
        .status(403)
        .json({ success: false, message: "Post not accessible" });
    }

    return res.status(200).json({
      success: true,
      post: {
        id: postDoc.id,
        ...postData,
      },
    });
  } catch (error) {
    console.error("Get post by ID function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/**
 * Firebase Function: Create Post
 */
exports.createPost = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // Validate request body
    const { error, value } = postSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // In a real implementation, you'd verify the user's token
    const userId = req.body.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // Create post document
    const postData = {
      ...value,
      authorId: userId,
      type: "post",
      tags: [],
      images: [],
      metadata: {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt:
          value.status === "published"
            ? admin.firestore.FieldValue.serverTimestamp()
            : null,
        deletedAt: null,
      },
      seo: {
        metaTitle: value.metaTitle || value.title,
        metaDescription: value.metaDescription || "",
        canonicalUrl: "",
        noIndex: false,
        noFollow: false,
      },
      analytics: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        readTime: 0,
      },
      settings: {
        allowComments: true,
        allowSharing: true,
        isPinned: false,
        isFeatured: false,
        requireAuth: false,
      },
    };

    const postRef = await db.collection("posts").add(postData);

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      postId: postRef.id,
    });
  } catch (error) {
    console.error("Create post function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create post" });
  }
});

/**
 * Firebase Function: Update Post
 */
exports.updatePost = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const postId = req.query.postId;
    if (!postId) {
      return res
        .status(400)
        .json({ success: false, message: "Post ID is required" });
    }

    // Validate request body
    const { error, value } = postSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // In a real implementation, you'd verify the user's token
    const userId = req.body.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // Check if post exists and user has permission
    const postDoc = await db.collection("posts").doc(postId).get();
    if (!postDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const postData = postDoc.data();
    const isAdminUser = await isAdmin(userId);
    const isOwner = await isContentOwner(userId, postData.authorId);

    if (!isAdminUser && !isOwner) {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied" });
    }

    // Update post document
    const updateData = {
      ...value,
      metadata: {
        ...postData.metadata,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt:
          value.status === "published" && !postData.metadata.publishedAt
            ? admin.firestore.FieldValue.serverTimestamp()
            : postData.metadata.publishedAt,
      },
      seo: {
        ...postData.seo,
        metaTitle: value.metaTitle || value.title,
        metaDescription:
          value.metaDescription || postData.seo?.metaDescription || "",
      },
    };

    await db.collection("posts").doc(postId).update(updateData);

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error("Update post function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update post" });
  }
});

/**
 * Firebase Function: Delete Post
 */
exports.deletePost = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow DELETE requests
    if (req.method !== "DELETE") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const postId = req.query.postId;
    if (!postId) {
      return res
        .status(400)
        .json({ success: false, message: "Post ID is required" });
    }

    // In a real implementation, you'd verify the user's token
    const userId = req.body.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // Check if post exists and user has permission
    const postDoc = await db.collection("posts").doc(postId).get();
    if (!postDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const postData = postDoc.data();
    const isAdminUser = await isAdmin(userId);
    const isOwner = await isContentOwner(userId, postData.authorId);

    if (!isAdminUser && !isOwner) {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied" });
    }

    // Delete post
    await db.collection("posts").doc(postId).delete();

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete post" });
  }
});

/**
 * Firebase Function: Get All Pages
 */
exports.getPages = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // Get all published pages
    const pagesSnapshot = await db
      .collection("pages")
      .where("status", "==", "published")
      .orderBy("metadata.createdAt", "desc")
      .get();

    const pages = [];
    pagesSnapshot.forEach((doc) => {
      pages.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      pages,
    });
  } catch (error) {
    console.error("Get pages function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/**
 * Firebase Function: Get Page by ID
 */
exports.getPageById = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const pageId = req.query.pageId;
    if (!pageId) {
      return res
        .status(400)
        .json({ success: false, message: "Page ID is required" });
    }

    const pageDoc = await db.collection("pages").doc(pageId).get();

    if (!pageDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    const pageData = pageDoc.data();

    // Check if page is published or user has permission to view
    // In a real implementation, you'd verify the user's token
    if (
      pageData.status !== "published" &&
      pageData.permissions.visibility !== "public"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Page not accessible" });
    }

    return res.status(200).json({
      success: true,
      page: {
        id: pageDoc.id,
        ...pageData,
      },
    });
  } catch (error) {
    console.error("Get page by ID function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/**
 * Firebase Function: Create Page
 */
exports.createPage = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // Validate request body
    const { error, value } = pageSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // In a real implementation, you'd verify the user's token
    const userId = req.body.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // Create page document
    const pageData = {
      ...value,
      authorId: userId,
      parentId: null,
      order: 0,
      layout: {
        type: "default",
        components: [],
        styles: {},
        scripts: [],
      },
      metadata: {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt:
          value.status === "published"
            ? admin.firestore.FieldValue.serverTimestamp()
            : null,
      },
      seo: {
        metaTitle: value.metaTitle || value.title,
        metaDescription: value.metaDescription || "",
        canonicalUrl: "",
        ogImage: "",
      },
      permissions: {
        visibility: "public",
        allowedRoles: [],
        allowedUsers: [],
      },
    };

    const pageRef = await db.collection("pages").add(pageData);

    return res.status(201).json({
      success: true,
      message: "Page created successfully",
      pageId: pageRef.id,
    });
  } catch (error) {
    console.error("Create page function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create page" });
  }
});

/**
 * Firebase Function: Update Page
 */
exports.updatePage = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const pageId = req.query.pageId;
    if (!pageId) {
      return res
        .status(400)
        .json({ success: false, message: "Page ID is required" });
    }

    // Validate request body
    const { error, value } = pageSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // In a real implementation, you'd verify the user's token
    const userId = req.body.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // Check if page exists and user has permission
    const pageDoc = await db.collection("pages").doc(pageId).get();
    if (!pageDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    const pageData = pageDoc.data();
    const isAdminUser = await isAdmin(userId);
    const isOwner = await isContentOwner(userId, pageData.authorId);

    if (!isAdminUser && !isOwner) {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied" });
    }

    // Update page document
    const updateData = {
      ...value,
      metadata: {
        ...pageData.metadata,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt:
          value.status === "published" && !pageData.metadata.publishedAt
            ? admin.firestore.FieldValue.serverTimestamp()
            : pageData.metadata.publishedAt,
      },
      seo: {
        ...pageData.seo,
        metaTitle: value.metaTitle || value.title,
        metaDescription:
          value.metaDescription || pageData.seo?.metaDescription || "",
      },
    };

    await db.collection("pages").doc(pageId).update(updateData);

    return res.status(200).json({
      success: true,
      message: "Page updated successfully",
    });
  } catch (error) {
    console.error("Update page function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update page" });
  }
});

/**
 * Firebase Function: Delete Page
 */
exports.deletePage = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow DELETE requests
    if (req.method !== "DELETE") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const pageId = req.query.pageId;
    if (!pageId) {
      return res
        .status(400)
        .json({ success: false, message: "Page ID is required" });
    }

    // In a real implementation, you'd verify the user's token
    const userId = req.body.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // Check if page exists and user has permission
    const pageDoc = await db.collection("pages").doc(pageId).get();
    if (!pageDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    const pageData = pageDoc.data();
    const isAdminUser = await isAdmin(userId);
    const isOwner = await isContentOwner(userId, pageData.authorId);

    if (!isAdminUser && !isOwner) {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied" });
    }

    // Delete page
    await db.collection("pages").doc(pageId).delete();

    return res.status(200).json({
      success: true,
      message: "Page deleted successfully",
    });
  } catch (error) {
    console.error("Delete page function error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete page" });
  }
});
