/**
 * Enhanced API service with real-time capabilities for blog management
 * Includes optimistic updates, offline support, and data synchronization
 */

// Firebase-only configuration - no API_BASE needed
import realTimeService from "./realTimeService";
import authMiddleware from "./authMiddleware";

class EnhancedApiService {
  constructor() {
    // Try to get token from session management service, fallback to localStorage
    this.token = null;
    try {
      import('./sessionManagementService.js')
        .then(({ default: sessionManagementService }) => {
          const sessionData = sessionManagementService.getSessionData();
          this.token = sessionData?.authToken || null;
        })
        .catch(() => {
          // Fallback to direct localStorage if session service unavailable
          this.token = localStorage.getItem("authToken");
        });
    } catch (error) {
      this.token = localStorage.getItem("authToken");
    }
    
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;
    this.retryAttempts = 3;
    this.retryDelay = 1000;

    // Setup offline/online handlers
    this.setupNetworkHandlers();

    // Initialize local storage for persistence
    this.initializeStorage();
  }

  /**
   * Setup network status handlers
   */
  setupNetworkHandlers() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  /**
   * Initialize local storage for offline persistence
   */
  initializeStorage() {
    if (!localStorage.getItem("blog_cache")) {
      localStorage.setItem("blog_cache", JSON.stringify({}));
    }
    if (!localStorage.getItem("draft_queue")) {
      localStorage.setItem("draft_queue", JSON.stringify([]));
    }
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    
    // Use session management service for token storage
    if (token) {
      import('./sessionManagementService.js')
        .then(({ default: sessionManagementService }) => {
          sessionManagementService.storeSessionData({ authToken: token });
        })
        .catch(() => {
          // Fallback to direct localStorage if session service unavailable
          localStorage.setItem("authToken", token);
        });
    } else {
      import('./sessionManagementService.js')
        .then(({ default: sessionManagementService }) => {
          sessionManagementService.clearSessionData();
        })
        .catch(() => {
          // Fallback to direct localStorage if session service unavailable
          localStorage.removeItem("authToken");
        });
    }
  }

  /**
   * Enhanced fetch with retry logic and error handling
   */
  async enhancedFetch(url, options = {}) {
    // Add authentication header if available
    const token = authMiddleware.getCurrentToken();
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    const requestId = `${options.method || "GET"}_${url}_${Date.now()}`;

    // Check if same request is already pending
    if (this.pendingRequests.has(requestId)) {
      return this.pendingRequests.get(requestId);
    }

    const requestPromise = this.executeRequest(url, options);
    this.pendingRequests.set(requestId, requestPromise);

    try {
      const result = await requestPromise;
      this.pendingRequests.delete(requestId);
      return result;
    } catch (error) {
      this.pendingRequests.delete(requestId);
      throw error;
    }
  }

  /**
   * Execute request with retry logic
   */
  async executeRequest(url, options, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeRequest(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Determine if request should be retried
   */
  shouldRetry(error) {
    return (
      error.name === "AbortError" ||
      error.message.includes("NetworkError") ||
      error.message.includes("503") ||
      error.message.includes("502")
    );
  }

  /**
   * Cache management
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 minutes
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Process offline queue when connection is restored
   */
  async processOfflineQueue() {
    // Process general offline queue
    const queue = JSON.parse(localStorage.getItem("draft_queue") || "[]");

    for (const item of queue) {
      try {
        await this.executeRequest(item.url, item.options);
      } catch (error) {
        console.error("Failed to process offline item:", error);
      }
    }

    localStorage.setItem("draft_queue", JSON.stringify([]));
    
    // Process draft sync queue
    await this.processDraftSyncQueue();
  }

  /**
   * Process draft synchronization queue
   */
  async processDraftSyncQueue() {
    try {
      const syncQueue = JSON.parse(localStorage.getItem("draft_sync_queue") || "[]");
      const processedItems = [];
      
      for (const draftData of syncQueue) {
        try {
          console.log('Syncing queued draft:', draftData.title || draftData.id);
          
          let result;
          if (draftData.id && draftData.id !== 'new') {
            result = await this.updatePost(draftData.id, draftData);
          } else {
            result = await this.createPost(draftData);
          }
          
          if (result.success) {
            processedItems.push(draftData);
            console.log('Successfully synced draft:', draftData.title || draftData.id);
          }
        } catch (error) {
          console.warn('Failed to sync draft, will retry later:', error);
          // Keep item in queue for next attempt
        }
      }
      
      // Remove successfully processed items from queue
      const remainingQueue = syncQueue.filter(item => 
        !processedItems.some(processed => 
          (processed.id && processed.id === item.id) ||
          (!processed.id && !item.id && processed.title === item.title)
        )
      );
      
      localStorage.setItem("draft_sync_queue", JSON.stringify(remainingQueue));
      
      if (processedItems.length > 0) {
        console.log(`Successfully synced ${processedItems.length} drafts`);
      }
    } catch (error) {
      console.error('Error processing draft sync queue:', error);
    }
  }

  /**
   * Add request to offline queue
   */
  addToOfflineQueue(url, options) {
    const queue = JSON.parse(localStorage.getItem("draft_queue") || "[]");
    queue.push({
      url,
      options,
      timestamp: Date.now(),
    });
    localStorage.setItem("draft_queue", JSON.stringify(queue));
  }

  // ==================== BLOG API METHODS ====================

  /**
   * Get all posts with caching and real-time updates
   */
  async getPosts(page = 1, limit = 10, category = null, status = null) {
    const cacheKey = `posts_${page}_${limit}_${category}_${status}`;

    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (category) params.append("category", category);
      if (status) params.append("status", status);

      // Firebase-only: Use contentService or firestoreService for posts
      throw new Error('Please use Firebase contentService for fetching posts');

      // Cache the result
      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      console.error("Error fetching posts:", error);

      // Return cached data if available, even if expired
      const expiredCache = this.cache.get(cacheKey);
      if (expiredCache) {
        return expiredCache.data;
      }

      throw error;
    }
  }

  /**
   * Get single post
   */
  async getPost(id) {
    const cacheKey = `post_${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Firebase-only: Use contentService or firestoreService for single post
      throw new Error('Please use Firebase contentService for fetching single post');
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Error fetching post:", error);
      throw error;
    }
  }

  /**
   * Create post with optimistic updates and real-time sync
   */
  async createPost(postData) {
    return await authMiddleware.protectBlogCreate(async (context) => {
      return await this._createPostInternal(postData, context);
    });
  }

  /**
   * Internal create post method
   */
  async _createPostInternal(postData, context = null) {
    // Generate temporary ID for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const optimisticPost = {
      ...postData,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: postData.status || "draft",
      author_id: context?.user?.id || "current_user",
      author_name:
        context?.user?.displayName || postData.author_name || "Unknown Author",
      _isOptimistic: true,
    };

    // Broadcast optimistic update
    realTimeService.broadcastBlogCreated(optimisticPost);

    try {
      // Firebase-only: Use contentService or firestoreService for creating posts
      throw new Error('Please use Firebase contentService for creating posts');

      if (data.success) {
        const finalPost = {
          ...data.data,
          _wasOptimistic: tempId,
        };

        // Broadcast real update
        realTimeService.broadcastBlogCreated(finalPost);

        // Clear related caches
        this.clearPostCaches();

        return data;
      } else {
        throw new Error(data.message || "Failed to create post");
      }
    } catch (error) {
      // Revert optimistic update
      realTimeService.broadcastBlogDeleted(tempId);

      if (!this.isOnline) {
        // Firebase-only: Offline operations should use Firebase offline persistence
        console.warn('Offline post creation not supported in Firebase-only mode');
      }

      throw error;
    }
  }

  /**
   * Update post with optimistic updates
   */
  async updatePost(id, postData) {
    // Get existing post to check permissions
    const existingPost = this.getCached(`post_${id}`);
    const blogData = {
      id,
      author_id: existingPost?.data?.author_id,
      ...postData,
    };

    return await authMiddleware.protectBlogUpdate(blogData, async (context) => {
      return await this._updatePostInternal(id, postData, context);
    });
  }

  /**
   * Internal update post method
   */
  async _updatePostInternal(id, postData, context = null) {
    const cacheKey = `post_${id}`;
    const existingPost = this.getCached(cacheKey);

    // Create optimistic update
    const optimisticPost = {
      ...(existingPost || {}),
      ...postData,
      id,
      updated_at: new Date().toISOString(),
      modified_by: context?.user?.displayName || "Unknown User",
      _isOptimistic: true,
    };

    // Update cache optimistically
    this.setCache(cacheKey, { success: true, data: optimisticPost });

    // Broadcast optimistic update
    realTimeService.broadcastBlogUpdated(optimisticPost);

    try {
      // Firebase-only: Use contentService or firestoreService for updating posts
      throw new Error('Please use Firebase contentService for updating posts');

      if (data.success) {
        const finalPost = {
          ...data.data,
          _wasOptimistic: true,
        };

        // Update cache with real data
        this.setCache(cacheKey, { success: true, data: finalPost });

        // Broadcast real update
        realTimeService.broadcastBlogUpdated(finalPost);

        // Clear related caches
        this.clearPostCaches();

        return data;
      } else {
        throw new Error(data.message || "Failed to update post");
      }
    } catch (error) {
      // Revert optimistic update
      if (existingPost) {
        this.setCache(cacheKey, { success: true, data: existingPost });
        realTimeService.broadcastBlogUpdated(existingPost);
      }

      if (!this.isOnline) {
        console.warn('Offline post update not supported in Firebase-only mode');
        // Firebase-only: No offline queue for PHP endpoints
      }

      throw error;
    }
  }

  /**
   * Delete post with optimistic updates
   */
  async deletePost(id) {
    // Get existing post to check permissions
    const existingPost = this.getCached(`post_${id}`);
    const blogData = { id, author_id: existingPost?.data?.author_id };

    return await authMiddleware.protectBlogDelete(blogData, async (context) => {
      return await this._deletePostInternal(id, context);
    });
  }

  /**
   * Internal delete post method
   */
  async _deletePostInternal(id, context = null) {
    // Broadcast optimistic delete
    realTimeService.broadcastBlogDeleted(id);

    try {
      // Firebase-only: Use contentService or firestoreService for deleting posts
      throw new Error('Please use Firebase contentService for deleting posts');

      if (data.success) {
        // Clear caches
        this.cache.delete(`post_${id}`);
        this.clearPostCaches();

        return data;
      } else {
        throw new Error(data.message || "Failed to delete post");
      }
    } catch (error) {
      // Could implement revert logic here by fetching the post again
      console.error("Delete failed, optimistic update may be inconsistent");

      if (!this.isOnline) {
        // Firebase-only: Offline operations should use Firebase offline persistence
        console.warn('Offline post deletion not supported in Firebase-only mode');
      }

      throw error;
    }
  }

  /**
   * Publish post with immediate real-time broadcast
   */
  async publishPost(id, postData = {}) {
    // Get existing post to check permissions
    const existingPost = this.getCached(`post_${id}`);
    const blogData = {
      id,
      author_id: existingPost?.data?.author_id,
      ...postData,
    };

    return await authMiddleware.protectBlogPublish(
      blogData,
      async (context) => {
        return await this._publishPostInternal(id, postData, context);
      }
    );
  }

  /**
   * Internal publish post method
   */
  async _publishPostInternal(id, postData = {}, context = null) {
    const publishData = {
      ...postData,
      status: "published",
      published_at: new Date().toISOString(),
      published_by: context?.user?.displayName || "Unknown User",
    };

    const data = await this._updatePostInternal(id, publishData, context);

    if (data.success) {
      // Special broadcast for publication
      realTimeService.broadcastBlogPublished(data.data);
    }

    return data;
  }

  /**
   * Save draft with enhanced auto-save functionality and session persistence
   */
  async saveDraft(postData, isAutoSave = false) {
    try {
      const timestamp = new Date().toISOString();
      const draftData = {
        ...postData,
        status: "draft",
        updated_at: timestamp,
        last_saved: timestamp,
        session_id: this.getSessionId(),
        auto_saved: isAutoSave
      };

      // Always store locally first for immediate persistence
      await this.storeLocalDraft(draftData, isAutoSave);

      // For auto-saves, prioritize local storage and queue for sync
      if (isAutoSave) {
        // Use real-time service for immediate sync if online
        if (this.isOnline) {
          try {
            realTimeService.saveDraft(draftData);
          } catch (error) {
            console.warn('Real-time draft save failed, queued for later:', error);
            this.queueDraftForSync(draftData);
          }
        } else {
          // Queue for sync when online
          this.queueDraftForSync(draftData);
        }

        return { success: true, data: draftData, source: 'local' };
      }

      // For manual saves, attempt API save with fallback to local
      try {
        let result;
        if (postData.id) {
          result = await this.updatePost(postData.id, draftData);
        } else {
          result = await this.createPost(draftData);
        }
        
        // Clear local draft on successful API save
        this.clearLocalDraft(postData.id || 'new');
        return result;
      } catch (error) {
        console.warn('API draft save failed, using local storage:', error);
        // Queue for sync when connection is restored
        this.queueDraftForSync(draftData);
        return { success: true, data: draftData, source: 'local', queued: true };
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      throw error;
    }
  }

  /**
   * Store draft locally with enhanced metadata
   */
  async storeLocalDraft(draftData, isAutoSave = false) {
    try {
      const drafts = JSON.parse(localStorage.getItem("local_drafts") || "{}");
      const draftId = draftData.id || 'new';
      
      drafts[draftId] = {
        ...draftData,
        local_metadata: {
          saved_at: new Date().toISOString(),
          is_auto_save: isAutoSave,
          session_id: this.getSessionId(),
          word_count: this.getWordCount(draftData.content || ''),
          version: (drafts[draftId]?.local_metadata?.version || 0) + 1
        }
      };
      
      localStorage.setItem("local_drafts", JSON.stringify(drafts));
      
      // Also store in session storage for cross-tab sync
      sessionStorage.setItem(`draft_${draftId}`, JSON.stringify(drafts[draftId]));
      
    } catch (error) {
      console.error('Error storing local draft:', error);
      throw error;
    }
  }

  /**
   * Queue draft for synchronization when online
   */
  queueDraftForSync(draftData) {
    try {
      const queue = JSON.parse(localStorage.getItem("draft_sync_queue") || "[]");
      const existingIndex = queue.findIndex(item => 
        (item.id && item.id === draftData.id) || 
        (!item.id && !draftData.id && item.title === draftData.title)
      );
      
      if (existingIndex >= 0) {
        // Update existing queued item
        queue[existingIndex] = { ...draftData, queued_at: new Date().toISOString() };
      } else {
        // Add new item to queue
        queue.push({ ...draftData, queued_at: new Date().toISOString() });
      }
      
      localStorage.setItem("draft_sync_queue", JSON.stringify(queue));
    } catch (error) {
      console.error('Error queuing draft for sync:', error);
    }
  }

  /**
   * Get session ID for tracking
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('blog_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('blog_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get word count from content
   */
  getWordCount(content) {
    if (!content) return 0;
    // Remove HTML tags and count words
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text ? text.split(/\s+/).length : 0;
  }

  /**
   * Upload image with progress tracking
   */
  async uploadImage(file, onProgress = null) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("image", file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error("Invalid response format"));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      // For demo purposes, simulate upload
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            filename: `uploaded_${Date.now()}_${file.name}`,
            url: URL.createObjectURL(file),
            size: file.size,
            type: file.type,
          },
        });
      }, 1000 + Math.random() * 2000);
    });
  }

  /**
   * Clear post-related caches
   */
  clearPostCaches() {
    for (const key of this.cache.keys()) {
      if (key.startsWith("posts_")) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get local drafts (offline support)
   */
  getLocalDrafts() {
    try {
      return JSON.parse(localStorage.getItem("local_drafts") || "{}");
    } catch (error) {
      console.error("Error reading local drafts:", error);
      return {};
    }
  }

  /**
   * Get recoverable drafts from current and previous sessions
   */
  getRecoverableDrafts() {
    try {
      const localDrafts = this.getLocalDrafts();
      const syncQueue = JSON.parse(localStorage.getItem("draft_sync_queue") || "[]");
      const currentSessionId = this.getSessionId();
      
      const recoverableDrafts = [];
      
      // Add local drafts
      Object.entries(localDrafts).forEach(([id, draft]) => {
        const metadata = draft.local_metadata || {};
        const isCurrentSession = metadata.session_id === currentSessionId;
        const savedAt = new Date(metadata.saved_at || draft.updated_at);
        const isRecent = (Date.now() - savedAt.getTime()) < (24 * 60 * 60 * 1000); // 24 hours
        
        if (isRecent && draft.title?.trim()) {
          recoverableDrafts.push({
            id: id === 'new' ? null : id,
            title: draft.title,
            content: draft.content,
            saved_at: savedAt.toISOString(),
            word_count: metadata.word_count || this.getWordCount(draft.content || ''),
            is_current_session: isCurrentSession,
            is_auto_save: metadata.is_auto_save || false,
            version: metadata.version || 1,
            source: 'local',
            data: draft
          });
        }
      });
      
      // Add queued drafts
      syncQueue.forEach(draft => {
        const queuedAt = new Date(draft.queued_at);
        const isRecent = (Date.now() - queuedAt.getTime()) < (24 * 60 * 60 * 1000);
        
        if (isRecent && draft.title?.trim()) {
          // Check if not already in local drafts
          const existsInLocal = recoverableDrafts.some(local => 
            (local.id && local.id === draft.id) ||
            (!local.id && !draft.id && local.title === draft.title)
          );
          
          if (!existsInLocal) {
            recoverableDrafts.push({
              id: draft.id === 'new' ? null : draft.id,
              title: draft.title,
              content: draft.content,
              saved_at: queuedAt.toISOString(),
              word_count: this.getWordCount(draft.content || ''),
              is_current_session: false,
              is_auto_save: draft.auto_saved || false,
              version: 1,
              source: 'queued',
              data: draft
            });
          }
        }
      });
      
      // Sort by saved date (most recent first)
      return recoverableDrafts.sort((a, b) => 
        new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
      );
    } catch (error) {
      console.error('Error getting recoverable drafts:', error);
      return [];
    }
  }

  /**
   * Recover a specific draft
   */
  recoverDraft(draftInfo) {
    try {
      if (draftInfo.source === 'local') {
        return draftInfo.data;
      } else if (draftInfo.source === 'queued') {
        return draftInfo.data;
      }
      return null;
    } catch (error) {
      console.error('Error recovering draft:', error);
      return null;
    }
  }

  /**
   * Clear local draft
   */
  clearLocalDraft(id) {
    try {
      const drafts = JSON.parse(localStorage.getItem("local_drafts") || "{}");
      delete drafts[id];
      localStorage.setItem("local_drafts", JSON.stringify(drafts));
    } catch (error) {
      console.error("Error clearing local draft:", error);
    }
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      isOnline: this.isOnline,
      offlineQueue: JSON.parse(localStorage.getItem("draft_queue") || "[]")
        .length,
      localDrafts: Object.keys(this.getLocalDrafts()).length,
      realTimeStats: realTimeService.getStats(),
    };
  }
}

// Create singleton instance
const enhancedApiService = new EnhancedApiService();

export default enhancedApiService;
