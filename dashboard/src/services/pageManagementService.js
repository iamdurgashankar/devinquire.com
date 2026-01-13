/**
 * Firebase Page Management Service
 * Comprehensive page management functionality using Firebase backend
 * Includes page creation, editing, publishing, templates, and real-time collaboration
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getDbInstance, getStorageInstance, isFirebaseConfigured } from "../config/firebase";
import { getCurrentUser } from "./firebaseAuthService";
import firestoreService from "./firestoreService";

class PageManagementService {
  constructor() {
    this.isFirebaseAvailable = isFirebaseConfigured();
    this.collections = {
      pages: "pages",
      pageTemplates: "pageTemplates",
      pageVersions: "pageVersions",
      pageAssets: "pageAssets",
    };
    this.cache = new Map();
    this.subscribers = new Map();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isAvailable: this.isFirebaseAvailable,
      features: {
        pageCreation: this.isFirebaseAvailable,
        realTimeEditing: this.isFirebaseAvailable,
        versionHistory: this.isFirebaseAvailable,
        templates: this.isFirebaseAvailable,
        assetManagement: this.isFirebaseAvailable,
        collaboration: this.isFirebaseAvailable,
      },
    };
  }

  /**
   * Create a new page
   */
  async createPage(pageData) {
    try {
      if (!this.isFirebaseAvailable) {
        throw new Error("Firebase not configured");
      }

      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Generate slug from title if not provided
      const slug = pageData.slug || this.generateSlug(pageData.title);

      // Check if page with this slug already exists
      const existingPage = await this.getPageBySlug(slug);
      if (existingPage.success && existingPage.page) {
        throw new Error(`Page with slug "${slug}" already exists`);
      }

      const page = {
        title: pageData.title,
        slug: slug,
        content: pageData.content || "",
        htmlContent: pageData.htmlContent || "",
        cssContent: pageData.cssContent || "",
        jsContent: pageData.jsContent || "",
        status: pageData.status || "draft",
        template: pageData.template || "default",
        seo: {
          metaTitle: pageData.seo?.metaTitle || pageData.title,
          metaDescription: pageData.seo?.metaDescription || "",
          keywords: pageData.seo?.keywords || [],
          canonicalUrl: pageData.seo?.canonicalUrl || "",
          ogImage: pageData.seo?.ogImage || "",
          ogTitle: pageData.seo?.ogTitle || pageData.title,
          ogDescription: pageData.seo?.ogDescription || "",
          twitterCard: pageData.seo?.twitterCard || "summary",
          robots: pageData.seo?.robots || "index,follow",
        },
        settings: {
          allowComments: pageData.settings?.allowComments || false,
          featuredPage: pageData.settings?.featuredPage || false,
          requireAuth: pageData.settings?.requireAuth || false,
          showInNavigation: pageData.settings?.showInNavigation || true,
          navigationOrder: pageData.settings?.navigationOrder || 0,
          customCSS: pageData.settings?.customCSS || "",
          customJS: pageData.settings?.customJS || "",
        },
        author: {
          id: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
        },
        collaboration: {
          editors: [user.uid],
          viewers: [],
          isPublic: pageData.collaboration?.isPublic || false,
          editMode: "single", // single, collaborative, locked
        },
        analytics: {
          views: 0,
          uniqueViews: 0,
          lastViewed: null,
          popularityScore: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: pageData.status === "published" ? serverTimestamp() : null,
        version: 1,
      };

      const result = await firestoreService.createDocument(
        this.collections.pages,
        page
      );

      if (result.success) {
        // Create initial version
        await this.createPageVersion(result.id, page, "Initial version");

        // Clear cache
        this.clearCache();

        return {
          success: true,
          page: { id: result.id, ...page },
          message: "Page created successfully",
        };
      }

      throw new Error("Failed to create page");
    } catch (error) {
      console.error("Create page error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to create page",
      };
    }
  }

  /**
   * Get page by ID
   */
  async getPage(pageId) {
    try {
      if (!this.isFirebaseAvailable) {
        throw new Error("Firebase not configured");
      }

      // Check cache first
      if (this.cache.has(`page_${pageId}`)) {
        const cached = this.cache.get(`page_${pageId}`);
        if (Date.now() - cached.timestamp < 60000) {
          // 1 minute cache
          return { success: true, page: cached.data };
        }
      }

      const result = await firestoreService.getDocument(
        this.collections.pages,
        pageId
      );

      if (result.success) {
        const page = { id: pageId, ...result.data };

        // Cache the result
        this.cache.set(`page_${pageId}`, {
          data: page,
          timestamp: Date.now(),
        });

        return { success: true, page };
      }

      return { success: false, error: "Page not found" };
    } catch (error) {
      console.error("Get page error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to get page",
      };
    }
  }

  /**
   * Get page by slug
   */
  async getPageBySlug(slug) {
    try {
      if (!this.isFirebaseAvailable) {
        throw new Error("Firebase not configured");
      }

      const result = await firestoreService.getDocuments(
        this.collections.pages,
        {
          filters: [{ field: "slug", operator: "==", value: slug }],
          limitCount: 1,
        }
      );

      if (result.success && result.data.length > 0) {
        return { success: true, page: result.data[0] };
      }

      return { success: false, error: "Page not found" };
    } catch (error) {
      console.error("Get page by slug error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to get page",
      };
    }
  }

  /**
   * Get all pages with filtering and pagination
   */
  async getPages(options = {}) {
    try {
      if (!this.isFirebaseAvailable) {
        throw new Error("Firebase not configured");
      }

      const {
        status = null,
        author = null,
        template = null,
        featured = null,
        page = 1,
        limit: limitCount = 20,
        orderByField = "updatedAt",
        orderByDirection = "desc",
        searchTerm = null,
      } = options;

      const filters = [];

      if (status) {
        filters.push({ field: "status", operator: "==", value: status });
      }

      if (author) {
        filters.push({ field: "author.id", operator: "==", value: author });
      }

      if (template) {
        filters.push({ field: "template", operator: "==", value: template });
      }

      if (featured !== null) {
        filters.push({
          field: "settings.featuredPage",
          operator: "==",
          value: featured,
        });
      }

      const queryOptions = {
        filters,
        orderByField,
        orderByDirection,
        limitCount,
      };

      const result = await firestoreService.getDocuments(
        this.collections.pages,
        queryOptions
      );

      if (result.success) {
        let pages = result.data;

        // Client-side search if searchTerm provided
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          pages = pages.filter(
            (page) =>
              page.title.toLowerCase().includes(term) ||
              page.slug.toLowerCase().includes(term) ||
              (page.seo.metaDescription &&
                page.seo.metaDescription.toLowerCase().includes(term))
          );
        }

        return {
          success: true,
          pages,
          pagination: {
            page,
            limit: limitCount,
            total: pages.length,
            hasMore: pages.length === limitCount,
          },
        };
      }

      throw new Error("Failed to get pages");
    } catch (error) {
      console.error("Get pages error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to get pages",
      };
    }
  }

  /**
   * Update page
   */
  async updatePage(pageId, updates) {
    try {
      if (!this.isFirebaseAvailable) {
        throw new Error("Firebase not configured");
      }

      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get current page to check permissions
      const currentPage = await this.getPage(pageId);
      if (!currentPage.success) {
        throw new Error("Page not found");
      }

      // Check if user has edit permissions
      if (!this.canEditPage(currentPage.page, user)) {
        throw new Error("Insufficient permissions to edit this page");
      }

      // Prepare update data
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        version: increment(1),
      };

      // If publishing, set publishedAt
      if (
        updates.status === "published" &&
        currentPage.page.status !== "published"
      ) {
        updateData.publishedAt = serverTimestamp();
      }

      const result = await firestoreService.updateDocument(
        this.collections.pages,
        pageId,
        updateData
      );

      if (result.success) {
        // Create version snapshot
        await this.createPageVersion(
          pageId,
          { ...currentPage.page, ...updates },
          updates.versionNote || "Page updated"
        );

        // Clear cache
        this.clearCache(`page_${pageId}`);

        return {
          success: true,
          message: "Page updated successfully",
        };
      }

      throw new Error("Failed to update page");
    } catch (error) {
      console.error("Update page error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to update page",
      };
    }
  }

  /**
   * Delete page
   */
  async deletePage(pageId) {
    try {
      if (!this.isFirebaseAvailable) {
        throw new Error("Firebase not configured");
      }

      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get current page to check permissions
      const currentPage = await this.getPage(pageId);
      if (!currentPage.success) {
        throw new Error("Page not found");
      }

      // Check if user has delete permissions
      if (!this.canDeletePage(currentPage.page, user)) {
        throw new Error("Insufficient permissions to delete this page");
      }

      const result = await firestoreService.deleteDocument(
        this.collections.pages,
        pageId
      );

      if (result.success) {
        // Delete associated versions and assets
        await this.deletePageVersions(pageId);
        await this.deletePageAssets(pageId);

        // Clear cache
        this.clearCache();

        return {
          success: true,
          message: "Page deleted successfully",
        };
      }

      throw new Error("Failed to delete page");
    } catch (error) {
      console.error("Delete page error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to delete page",
      };
    }
  }

  /**
   * Duplicate page
   */
  async duplicatePage(pageId, newTitle, newSlug = null) {
    try {
      const originalPage = await this.getPage(pageId);
      if (!originalPage.success) {
        throw new Error("Original page not found");
      }

      const pageData = {
        ...originalPage.page,
        title: newTitle,
        slug: newSlug || this.generateSlug(newTitle),
        status: "draft",
        publishedAt: null,
      };

      // Remove ID and timestamps
      delete pageData.id;
      delete pageData.createdAt;
      delete pageData.updatedAt;

      return await this.createPage(pageData);
    } catch (error) {
      console.error("Duplicate page error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to duplicate page",
      };
    }
  }

  /**
   * Create page template
   */
  async createTemplate(templateData) {
    try {
      if (!this.isFirebaseAvailable) {
        throw new Error("Firebase not configured");
      }

      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const template = {
        name: templateData.name,
        description: templateData.description || "",
        category: templateData.category || "general",
        htmlContent: templateData.htmlContent || "",
        cssContent: templateData.cssContent || "",
        jsContent: templateData.jsContent || "",
        preview: templateData.preview || "",
        isPublic: templateData.isPublic || false,
        author: {
          id: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
        },
        usageCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const result = await firestoreService.createDocument(
        this.collections.pageTemplates,
        template
      );

      if (result.success) {
        return {
          success: true,
          template: { id: result.id, ...template },
          message: "Template created successfully",
        };
      }

      throw new Error("Failed to create template");
    } catch (error) {
      console.error("Create template error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to create template",
      };
    }
  }

  /**
   * Get page templates
   */
  async getTemplates(options = {}) {
    try {
      if (!this.isFirebaseAvailable) {
        throw new Error("Firebase not configured");
      }

      const {
        category = null,
        isPublic = null,
        author = null,
        limit: limitCount = 20,
      } = options;

      const filters = [];

      if (category) {
        filters.push({ field: "category", operator: "==", value: category });
      }

      if (isPublic !== null) {
        filters.push({ field: "isPublic", operator: "==", value: isPublic });
      }

      if (author) {
        filters.push({ field: "author.id", operator: "==", value: author });
      }

      const result = await firestoreService.getDocuments(
        this.collections.pageTemplates,
        {
          filters,
          orderByField: "usageCount",
          orderByDirection: "desc",
          limitCount,
        }
      );

      if (result.success) {
        return {
          success: true,
          templates: result.data,
        };
      }

      throw new Error("Failed to get templates");
    } catch (error) {
      console.error("Get templates error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to get templates",
      };
    }
  }

  /**
   * Create page version
   */
  async createPageVersion(pageId, pageData, note = "") {
    try {
      if (!this.isFirebaseAvailable) {
        return { success: false, error: "Firebase not configured" };
      }

      const user = await getCurrentUser();

      const version = {
        pageId,
        content: pageData.content || "",
        htmlContent: pageData.htmlContent || "",
        cssContent: pageData.cssContent || "",
        jsContent: pageData.jsContent || "",
        title: pageData.title,
        status: pageData.status,
        note,
        author: user
          ? {
              id: user.uid,
              email: user.email,
              displayName: user.displayName || user.email,
            }
          : null,
        createdAt: serverTimestamp(),
      };

      const result = await firestoreService.createDocument(
        this.collections.pageVersions,
        version
      );
      return result;
    } catch (error) {
      console.error("Create page version error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get page versions
   */
  async getPageVersions(pageId, limit = 10) {
    try {
      if (!this.isFirebaseAvailable) {
        throw new Error("Firebase not configured");
      }

      const result = await firestoreService.getDocuments(
        this.collections.pageVersions,
        {
          filters: [{ field: "pageId", operator: "==", value: pageId }],
          orderByField: "createdAt",
          orderByDirection: "desc",
          limitCount: limit,
        }
      );

      if (result.success) {
        return {
          success: true,
          versions: result.data,
        };
      }

      throw new Error("Failed to get page versions");
    } catch (error) {
      console.error("Get page versions error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to get page versions",
      };
    }
  }

  /**
   * Subscribe to real-time page updates
   */
  subscribeToPage(pageId, callback) {
    if (!this.isFirebaseAvailable) {
      console.warn("Firebase not configured, real-time updates not available");
      return null;
    }

    try {
      const pageRef = doc(getDbInstance(), this.collections.pages, pageId);
      const unsubscribe = onSnapshot(
        pageRef,
        (doc) => {
          if (doc.exists()) {
            const page = { id: doc.id, ...doc.data() };
            callback({ success: true, page });
          } else {
            callback({ success: false, error: "Page not found" });
          }
        },
        (error) => {
          console.error("Page subscription error:", error);
          callback({ success: false, error: error.message });
        }
      );

      const subscriberId = `page_${pageId}_${Date.now()}`;
      this.subscribers.set(subscriberId, unsubscribe);

      return subscriberId;
    } catch (error) {
      console.error("Subscribe to page error:", error);
      return null;
    }
  }

  /**
   * Subscribe to real-time pages list updates
   */
  subscribeToPages(filters = {}, callback) {
    if (!this.isFirebaseAvailable) {
      console.warn("Firebase not configured, real-time updates not available");
      return null;
    }

    try {
      let q = collection(getDbInstance(), this.collections.pages);

      // Apply filters
      if (filters.status) {
        q = query(q, where("status", "==", filters.status));
      }

      if (filters.author) {
        q = query(q, where("author.id", "==", filters.author));
      }

      // Apply ordering
      q = query(
        q,
        orderBy(filters.orderBy || "updatedAt", filters.direction || "desc")
      );

      // Apply limit
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const pages = [];
          snapshot.forEach((doc) => {
            pages.push({ id: doc.id, ...doc.data() });
          });
          callback({ success: true, pages });
        },
        (error) => {
          console.error("Pages subscription error:", error);
          callback({ success: false, error: error.message });
        }
      );

      const subscriberId = `pages_${Date.now()}`;
      this.subscribers.set(subscriberId, unsubscribe);

      return subscriberId;
    } catch (error) {
      console.error("Subscribe to pages error:", error);
      return null;
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriberId) {
    if (this.subscribers.has(subscriberId)) {
      const unsubscribe = this.subscribers.get(subscriberId);
      unsubscribe();
      this.subscribers.delete(subscriberId);
      return true;
    }
    return false;
  }

  /**
   * Helper methods
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  canEditPage(page, user) {
    if (!user) return false;

    // Check if user is author
    if (page.author.id === user.uid) return true;

    // Check if user is in editors list
    if (page.collaboration.editors.includes(user.uid)) return true;

    // Check if user is admin (you can implement admin role check here)
    // if (user.role === 'admin') return true;

    return false;
  }

  canDeletePage(page, user) {
    if (!user) return false;

    // Only author can delete
    if (page.author.id === user.uid) return true;

    // Check if user is admin (you can implement admin role check here)
    // if (user.role === 'admin') return true;

    return false;
  }

  async deletePageVersions(pageId) {
    try {
      const versions = await this.getPageVersions(pageId, 100);
      if (versions.success && versions.versions.length > 0) {
        const batch = writeBatch(getDbInstance());
        versions.versions.forEach((version) => {
          const versionRef = doc(getDbInstance(), this.collections.pageVersions, version.id);
          batch.delete(versionRef);
        });
        await batch.commit();
      }
    } catch (error) {
      console.error("Delete page versions error:", error);
    }
  }

  async deletePageAssets(pageId) {
    try {
      // Implementation for deleting page assets from Firebase Storage
      // This would require tracking assets associated with each page
      console.log("Cleaning up assets for page:", pageId);
    } catch (error) {
      console.error("Delete page assets error:", error);
    }
  }

  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Clean up resources
  destroy() {
    // Unsubscribe from all real-time listeners
    this.subscribers.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.subscribers.clear();

    // Clear cache
    this.cache.clear();
  }
}

// Create singleton instance
const pageManagementService = new PageManagementService();

export default pageManagementService;
