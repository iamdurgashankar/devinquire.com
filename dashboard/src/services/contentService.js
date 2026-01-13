/**
 * Content Management Service
 * Firebase-based content management for posts and pages
 * Replaces PHP backend content operations with Firestore
 */

import firestoreService from "./firestoreService";
import { DB_CONFIG } from "../config/firebase";

class ContentService {
  constructor() {
    this.postsCollection = DB_CONFIG.collections.posts;
    this.pagesCollection = DB_CONFIG.collections.pages;
  }

  // =============================================
  // POSTS MANAGEMENT
  // =============================================

  /**
   * Create a new post
   */
  async createPost(postData, authorId) {
    try {
      const {
        title,
        content,
        excerpt = "",
        status = "draft",
        category = "uncategorized",
        tags = [],
        featuredImage = null,
        ...additionalData
      } = postData;

      const slug = this.generateSlug(title);

      const post = {
        title,
        slug,
        content,
        excerpt: excerpt || this.generateExcerpt(content),
        status,
        type: "post",
        authorId,
        category,
        tags,
        featuredImage,
        images: [],
        // Public API compatibility fields
        isPublic: status === "published", // Required for public API access
        publishedAt: status === "published" ? firestoreService.getServerTimestamp() : null,
        createdAt: firestoreService.getServerTimestamp(),
        updatedAt: firestoreService.getServerTimestamp(),
        author: {
          name: additionalData.author_name || "Admin User",
          avatar: additionalData.author_avatar || null
        },
        metadata: {
          createdAt: firestoreService.getServerTimestamp(),
          updatedAt: firestoreService.getServerTimestamp(),
          publishedAt:
            status === "published"
              ? firestoreService.getServerTimestamp()
              : null,
          deletedAt: null,
        },
        seo: {
          metaTitle: title,
          metaDescription: excerpt || this.generateExcerpt(content),
          canonicalUrl: "",
          noIndex: false,
          noFollow: false,
        },
        analytics: {
          views: 0,
          likes: 0,
          shares: 0,
          comments: 0,
          readTime: this.calculateReadTime(content),
        },
        settings: {
          allowComments: true,
          allowSharing: true,
          isPinned: false,
          isFeatured: false,
          requireAuth: false,
        },
        ...additionalData,
      };

      return await firestoreService.createDocument(this.postsCollection, post);
    } catch (error) {
      console.error("Create post error:", error);
      throw error;
    }
  }

  /**
   * Get post by ID
   */
  async getPost(postId) {
    try {
      const result = await firestoreService.getDocument(
        this.postsCollection,
        postId
      );

      if (result.success) {
        // Increment view count
        await this.incrementPostViews(postId);
      }

      return result;
    } catch (error) {
      console.error("Get post error:", error);
      throw error;
    }
  }

  /**
   * Get post by slug
   */
  async getPostBySlug(slug) {
    try {
      const result = await firestoreService.getDocuments(this.postsCollection, {
        filters: [{ field: "slug", operator: "==", value: slug }],
        limitCount: 1,
      });

      if (result.success && result.data.length > 0) {
        const post = result.data[0];
        // Increment view count
        await this.incrementPostViews(post.id);
        return { success: true, data: post };
      }

      return { success: false, error: "Post not found" };
    } catch (error) {
      console.error("Get post by slug error:", error);
      throw error;
    }
  }

  /**
   * Get all posts with filtering and pagination
   */
  async getPosts(options = {}) {
    try {
      const {
        status = null,
        category = null,
        author = null,
        tags = null,
        featured = null,
        orderBy = "metadata.createdAt",
        orderDirection = "desc",
        limit = 10,
        startAfter = null,
        search = null,
      } = options;

      const filters = [];

      if (status)
        filters.push({ field: "status", operator: "==", value: status });
      if (category)
        filters.push({ field: "category", operator: "==", value: category });
      if (author)
        filters.push({ field: "authorId", operator: "==", value: author });
      if (featured !== null)
        filters.push({
          field: "settings.isFeatured",
          operator: "==",
          value: featured,
        });
      if (tags)
        filters.push({
          field: "tags",
          operator: "array-contains-any",
          value: Array.isArray(tags) ? tags : [tags],
        });

      return await firestoreService.getDocuments(this.postsCollection, {
        filters,
        orderByField: orderBy,
        orderByDirection: orderDirection,
        limitCount: limit,
        startAfterDoc: startAfter,
      });
    } catch (error) {
      console.error("Get posts error:", error);
      throw error;
    }
  }

  /**
   * Search posts
   */
  async searchPosts(searchTerm, options = {}) {
    try {
      const { limit = 20, status = "published" } = options;

      // Basic search implementation - for full-text search, use Algolia or similar
      const filters = [];
      if (status)
        filters.push({ field: "status", operator: "==", value: status });

      return await firestoreService.searchDocuments(
        this.postsCollection,
        searchTerm,
        {
          searchFields: ["title", "content", "excerpt", "tags"],
          filters,
          limitCount: limit,
        }
      );
    } catch (error) {
      console.error("Search posts error:", error);
      throw error;
    }
  }

  /**
   * Update post
   */
  async updatePost(postId, updates, authorId) {
    try {
      const updateData = {
        ...updates,
        updatedAt: firestoreService.getServerTimestamp(),
        "metadata.updatedAt": firestoreService.getServerTimestamp(),
      };

      // If status is being changed to published, set publishedAt and isPublic
      if (updates.status === "published") {
        updateData["metadata.publishedAt"] =
          firestoreService.getServerTimestamp();
        updateData.publishedAt = firestoreService.getServerTimestamp();
        updateData.isPublic = true; // Required for public API access
      } else if (updates.status && updates.status !== "published") {
        // If status is changed from published to something else, set isPublic to false
        updateData.isPublic = false;
      }

      // Update slug if title changed
      if (updates.title) {
        updateData.slug = this.generateSlug(updates.title);
      }

      // Update excerpt if content changed
      if (updates.content) {
        updateData.excerpt =
          updates.excerpt || this.generateExcerpt(updates.content);
        updateData["analytics.readTime"] = this.calculateReadTime(
          updates.content
        );
      }

      return await firestoreService.updateDocument(
        this.postsCollection,
        postId,
        updateData
      );
    } catch (error) {
      console.error("Update post error:", error);
      throw error;
    }
  }

  /**
   * Delete post (soft delete)
   */
  async deletePost(postId) {
    try {
      return await firestoreService.deleteDocument(
        this.postsCollection,
        postId,
        true
      );
    } catch (error) {
      console.error("Delete post error:", error);
      throw error;
    }
  }

  /**
   * Permanently delete post
   */
  async permanentlyDeletePost(postId) {
    try {
      return await firestoreService.deleteDocument(
        this.postsCollection,
        postId,
        false
      );
    } catch (error) {
      console.error("Permanently delete post error:", error);
      throw error;
    }
  }

  /**
   * Publish post
   */
  async publishPost(postId) {
    try {
      return await this.updatePost(postId, {
        status: "published",
        "metadata.publishedAt": firestoreService.getServerTimestamp(),
      });
    } catch (error) {
      console.error("Publish post error:", error);
      throw error;
    }
  }

  /**
   * Unpublish post
   */
  async unpublishPost(postId) {
    try {
      return await this.updatePost(postId, { status: "draft" });
    } catch (error) {
      console.error("Unpublish post error:", error);
      throw error;
    }
  }

  /**
   * Feature post
   */
  async featurePost(postId, featured = true) {
    try {
      return await this.updatePost(postId, { "settings.isFeatured": featured });
    } catch (error) {
      console.error("Feature post error:", error);
      throw error;
    }
  }

  /**
   * Pin post
   */
  async pinPost(postId, pinned = true) {
    try {
      return await this.updatePost(postId, { "settings.isPinned": pinned });
    } catch (error) {
      console.error("Pin post error:", error);
      throw error;
    }
  }

  // =============================================
  // PAGES MANAGEMENT
  // =============================================

  /**
   * Create a new page
   */
  async createPage(pageData, authorId) {
    try {
      const {
        title,
        content,
        template = "default",
        status = "draft",
        parentId = null,
        order = 0,
        layout = {},
        ...additionalData
      } = pageData;

      const slug = this.generateSlug(title);

      const page = {
        title,
        slug,
        content,
        template,
        status,
        authorId,
        parentId,
        order,
        layout: {
          type: "default",
          components: [],
          styles: {},
          scripts: [],
          ...layout,
        },
        metadata: {
          createdAt: firestoreService.getServerTimestamp(),
          updatedAt: firestoreService.getServerTimestamp(),
          publishedAt:
            status === "published"
              ? firestoreService.getServerTimestamp()
              : null,
        },
        seo: {
          metaTitle: title,
          metaDescription: this.generateExcerpt(content),
          canonicalUrl: "",
          ogImage: "",
        },
        permissions: {
          visibility: "public",
          allowedRoles: [],
          allowedUsers: [],
        },
        ...additionalData,
      };

      return await firestoreService.createDocument(this.pagesCollection, page);
    } catch (error) {
      console.error("Create page error:", error);
      throw error;
    }
  }

  /**
   * Get page by ID
   */
  async getPage(pageId) {
    try {
      return await firestoreService.getDocument(this.pagesCollection, pageId);
    } catch (error) {
      console.error("Get page error:", error);
      throw error;
    }
  }

  /**
   * Get page by slug
   */
  async getPageBySlug(slug) {
    try {
      const result = await firestoreService.getDocuments(this.pagesCollection, {
        filters: [{ field: "slug", operator: "==", value: slug }],
        limitCount: 1,
      });

      if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }

      return { success: false, error: "Page not found" };
    } catch (error) {
      console.error("Get page by slug error:", error);
      throw error;
    }
  }

  /**
   * Get all pages
   */
  async getPages(options = {}) {
    try {
      const {
        status = null,
        template = null,
        author = null,
        parent = null,
        orderBy = "order",
        orderDirection = "asc",
        limit = 50,
        startAfter = null,
      } = options;

      const filters = [];

      if (status)
        filters.push({ field: "status", operator: "==", value: status });
      if (template)
        filters.push({ field: "template", operator: "==", value: template });
      if (author)
        filters.push({ field: "authorId", operator: "==", value: author });
      if (parent !== null)
        filters.push({ field: "parentId", operator: "==", value: parent });

      return await firestoreService.getDocuments(this.pagesCollection, {
        filters,
        orderByField: orderBy,
        orderByDirection: orderDirection,
        limitCount: limit,
        startAfterDoc: startAfter,
      });
    } catch (error) {
      console.error("Get pages error:", error);
      throw error;
    }
  }

  /**
   * Update page
   */
  async updatePage(pageId, updates) {
    try {
      const updateData = {
        ...updates,
        "metadata.updatedAt": firestoreService.getServerTimestamp(),
      };

      // If status is being changed to published, set publishedAt
      if (updates.status === "published") {
        updateData["metadata.publishedAt"] =
          firestoreService.getServerTimestamp();
      }

      // Update slug if title changed
      if (updates.title) {
        updateData.slug = this.generateSlug(updates.title);
      }

      return await firestoreService.updateDocument(
        this.pagesCollection,
        pageId,
        updateData
      );
    } catch (error) {
      console.error("Update page error:", error);
      throw error;
    }
  }

  /**
   * Delete page
   */
  async deletePage(pageId) {
    try {
      return await firestoreService.deleteDocument(
        this.pagesCollection,
        pageId,
        true
      );
    } catch (error) {
      console.error("Delete page error:", error);
      throw error;
    }
  }

  /**
   * Update page order
   */
  async updatePageOrder(pageId, newOrder) {
    try {
      return await this.updatePage(pageId, { order: newOrder });
    } catch (error) {
      console.error("Update page order error:", error);
      throw error;
    }
  }

  /**
   * Update pages order (batch operation)
   */
  async updatePagesOrder(orderUpdates) {
    try {
      const operations = orderUpdates.map(({ pageId, order }) => ({
        type: "update",
        collectionName: this.pagesCollection,
        docId: pageId,
        data: {
          order,
          "metadata.updatedAt": firestoreService.getServerTimestamp(),
        },
      }));

      return await firestoreService.performBatch(operations);
    } catch (error) {
      console.error("Update pages order error:", error);
      throw error;
    }
  }

  // =============================================
  // ANALYTICS & METRICS
  // =============================================

  /**
   * Increment post views
   */
  async incrementPostViews(postId) {
    try {
      return await firestoreService.updateDocument(
        this.postsCollection,
        postId,
        {
          "analytics.views": firestoreService.getIncrement(1),
        }
      );
    } catch (error) {
      console.error("Increment post views error:", error);
      // Don't throw error for analytics - fail silently
    }
  }

  /**
   * Update post analytics
   */
  async updatePostAnalytics(postId, analyticsData) {
    try {
      const updateData = {};
      Object.keys(analyticsData).forEach((key) => {
        updateData[`analytics.${key}`] = analyticsData[key];
      });

      return await firestoreService.updateDocument(
        this.postsCollection,
        postId,
        updateData
      );
    } catch (error) {
      console.error("Update post analytics error:", error);
      throw error;
    }
  }

  /**
   * Get content statistics
   */
  async getContentStats() {
    try {
      // Get posts by status
      const publishedPosts = await this.getPosts({
        status: "published",
        limit: 1,
      });
      const draftPosts = await this.getPosts({ status: "draft", limit: 1 });
      const totalPosts = await this.getPosts({ limit: 1 });

      // Get pages by status
      const publishedPages = await this.getPages({
        status: "published",
        limit: 1,
      });
      const totalPages = await this.getPages({ limit: 1 });

      return {
        success: true,
        data: {
          posts: {
            total: totalPosts.count || 0,
            published: publishedPosts.count || 0,
            draft: draftPosts.count || 0,
          },
          pages: {
            total: totalPages.count || 0,
            published: publishedPages.count || 0,
          },
        },
      };
    } catch (error) {
      console.error("Get content stats error:", error);
      throw error;
    }
  }

  // =============================================
  // REAL-TIME OPERATIONS
  // =============================================

  /**
   * Listen to posts changes
   */
  listenToPosts(callback, options = {}) {
    const {
      filters = [],
      orderBy = "metadata.createdAt",
      orderDirection = "desc",
      limit = 20,
    } = options;

    return firestoreService.listenToCollection(this.postsCollection, callback, {
      filters,
      orderByField: orderBy,
      orderByDirection: orderDirection,
      limitCount: limit,
    });
  }

  /**
   * Listen to pages changes
   */
  listenToPages(callback, options = {}) {
    const {
      filters = [],
      orderBy = "order",
      orderDirection = "asc",
      limit = 50,
    } = options;

    return firestoreService.listenToCollection(this.pagesCollection, callback, {
      filters,
      orderByField: orderBy,
      orderByDirection: orderDirection,
      limitCount: limit,
    });
  }

  /**
   * Listen to specific post
   */
  listenToPost(postId, callback) {
    return firestoreService.listenToDocument(
      this.postsCollection,
      postId,
      callback
    );
  }

  /**
   * Listen to specific page
   */
  listenToPage(pageId, callback) {
    return firestoreService.listenToDocument(
      this.pagesCollection,
      pageId,
      callback
    );
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Generate URL-friendly slug from title
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Generate excerpt from content
   */
  generateExcerpt(content, length = 160) {
    if (!content) return "";

    // Strip HTML tags
    const plainText = content.replace(/<[^>]*>/g, "");

    // Truncate to desired length
    if (plainText.length <= length) return plainText;

    return plainText.substring(0, length).trim() + "...";
  }

  /**
   * Calculate estimated reading time
   */
  calculateReadTime(content) {
    if (!content) return 0;

    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);

    return Math.max(1, readTime); // Minimum 1 minute
  }

  /**
   * Validate slug uniqueness
   */
  async validateSlug(slug, collectionName, excludeId = null) {
    try {
      const filters = [{ field: "slug", operator: "==", value: slug }];
      const result = await firestoreService.getDocuments(collectionName, {
        filters,
        limitCount: 1,
      });

      if (!result.success || result.data.length === 0) {
        return { isUnique: true, slug };
      }

      // If excluding an ID (for updates), check if the found document is the one being updated
      if (excludeId && result.data[0].id === excludeId) {
        return { isUnique: true, slug };
      }

      // Generate unique slug by appending number
      let counter = 1;
      let uniqueSlug = `${slug}-${counter}`;

      while (true) {
        const checkResult = await firestoreService.getDocuments(
          collectionName,
          {
            filters: [{ field: "slug", operator: "==", value: uniqueSlug }],
            limitCount: 1,
          }
        );

        if (!checkResult.success || checkResult.data.length === 0) {
          return { isUnique: false, slug: uniqueSlug };
        }

        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }
    } catch (error) {
      console.error("Validate slug error:", error);
      return { isUnique: true, slug }; // Default to original slug on error
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      ...firestoreService.getStatus(),
      collections: {
        posts: this.postsCollection,
        pages: this.pagesCollection,
      },
    };
  }
}

// Create and export singleton instance
const contentService = new ContentService();
export default contentService;
