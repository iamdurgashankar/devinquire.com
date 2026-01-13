/**
 * Persistent Data Storage Service
 * Handles data persistence, synchronization, and optimistic UI updates
 */

import enhancedApiService from "./enhancedApiService";
import realTimeService from "./realTimeService";
import authMiddleware from "./authMiddleware";

class PersistentDataService {
  constructor() {
    this.storageKey = "devinquire_data_store";
    this.syncQueue = "devinquire_sync_queue";
    this.lastSyncKey = "devinquire_last_sync";
    this.conflictResolutionKey = "devinquire_conflicts";

    this.data = new Map();
    this.pendingOperations = new Map();
    this.conflictQueue = [];
    this.syncInProgress = false;
    this.isOnline = navigator.onLine;

    this.initialize();
    this.setupNetworkHandlers();
    this.setupRealTimeSync();
  }

  /**
   * Initialize the service
   */
  initialize() {
    this.loadFromStorage();
    this.loadSyncQueue();
    this.loadConflicts();

    // Start background sync
    this.startBackgroundSync();
  }

  /**
   * Setup network status handlers
   */
  setupNetworkHandlers() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  /**
   * Setup real-time synchronization
   */
  setupRealTimeSync() {
    realTimeService.onBlogCreated(this.handleRealTimeCreate.bind(this));
    realTimeService.onBlogUpdated(this.handleRealTimeUpdate.bind(this));
    realTimeService.onBlogDeleted(this.handleRealTimeDelete.bind(this));
  }

  /**
   * Load data from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.data = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error("Error loading from storage:", error);
    }
  }

  /**
   * Save data to localStorage
   */
  saveToStorage() {
    try {
      const dataObj = Object.fromEntries(this.data);
      localStorage.setItem(this.storageKey, JSON.stringify(dataObj));
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  }

  /**
   * Load sync queue from localStorage
   */
  loadSyncQueue() {
    try {
      const queue = localStorage.getItem(this.syncQueue);
      if (queue) {
        this.pendingOperations = new Map(JSON.parse(queue));
      }
    } catch (error) {
      console.error("Error loading sync queue:", error);
    }
  }

  /**
   * Save sync queue to localStorage
   */
  saveSyncQueue() {
    try {
      const queueArray = Array.from(this.pendingOperations.entries());
      localStorage.setItem(this.syncQueue, JSON.stringify(queueArray));
    } catch (error) {
      console.error("Error saving sync queue:", error);
    }
  }

  /**
   * Load conflicts from localStorage
   */
  loadConflicts() {
    try {
      const conflicts = localStorage.getItem(this.conflictResolutionKey);
      if (conflicts) {
        this.conflictQueue = JSON.parse(conflicts);
      }
    } catch (error) {
      console.error("Error loading conflicts:", error);
    }
  }

  /**
   * Save conflicts to localStorage
   */
  saveConflicts() {
    try {
      localStorage.setItem(
        this.conflictResolutionKey,
        JSON.stringify(this.conflictQueue)
      );
    } catch (error) {
      console.error("Error saving conflicts:", error);
    }
  }

  /**
   * Generate unique operation ID
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add operation to sync queue
   */
  addToSyncQueue(operation) {
    const opId = this.generateOperationId();
    this.pendingOperations.set(opId, {
      ...operation,
      id: opId,
      timestamp: Date.now(),
      retryCount: 0,
      userId: authMiddleware.getCurrentUser()?.id,
    });

    this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return opId;
  }

  /**
   * Create blog post with optimistic update
   */
  async createPost(postData, options = {}) {
    const tempId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const { optimistic = true } = options;

    // Create optimistic data
    const optimisticPost = {
      ...postData,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_id: authMiddleware.getCurrentUser()?.id,
      author_name:
        authMiddleware.getCurrentUser()?.displayName || "Unknown Author",
      status: postData.status || "draft",
      _isOptimistic: true,
      _tempId: tempId,
    };

    // Apply optimistic update
    if (optimistic) {
      this.data.set(tempId, optimisticPost);
      this.saveToStorage();
    }

    try {
      if (this.isOnline) {
        // Try immediate sync
        const response = await enhancedApiService._createPostInternal(postData);

        if (response.success) {
          // Replace optimistic data with real data
          this.data.delete(tempId);
          this.data.set(response.data.id, {
            ...response.data,
            _wasOptimistic: tempId,
          });
          this.saveToStorage();

          return { success: true, data: response.data };
        }
      }
    } catch (error) {
      console.error("Immediate sync failed, adding to queue:", error);
    }

    // Add to sync queue for later
    const operation = {
      type: "create",
      entity: "post",
      data: postData,
      tempId: tempId,
      optimisticData: optimisticPost,
    };

    this.addToSyncQueue(operation);

    return {
      success: true,
      data: optimisticPost,
      pending: true,
      tempId: tempId,
    };
  }

  /**
   * Update blog post with optimistic update
   */
  async updatePost(postId, updateData, options = {}) {
    const { optimistic = true } = options;
    const existingPost = this.data.get(postId);

    if (!existingPost) {
      throw new Error("Post not found in local storage");
    }

    // Create optimistic data
    const optimisticPost = {
      ...existingPost,
      ...updateData,
      updated_at: new Date().toISOString(),
      _isOptimistic: true,
      _lastModified: Date.now(),
    };

    // Apply optimistic update
    if (optimistic) {
      this.data.set(postId, optimisticPost);
      this.saveToStorage();
    }

    try {
      if (this.isOnline) {
        // Try immediate sync
        const response = await enhancedApiService._updatePostInternal(
          postId,
          updateData
        );

        if (response.success) {
          // Update with real data
          this.data.set(postId, {
            ...response.data,
            _wasOptimistic: true,
          });
          this.saveToStorage();

          return { success: true, data: response.data };
        }
      }
    } catch (error) {
      console.error("Immediate sync failed, adding to queue:", error);
    }

    // Add to sync queue for later
    const operation = {
      type: "update",
      entity: "post",
      id: postId,
      data: updateData,
      optimisticData: optimisticPost,
      originalData: existingPost,
    };

    this.addToSyncQueue(operation);

    return {
      success: true,
      data: optimisticPost,
      pending: true,
    };
  }

  /**
   * Delete blog post with optimistic update
   */
  async deletePost(postId, options = {}) {
    const { optimistic = true } = options;
    const existingPost = this.data.get(postId);

    if (!existingPost) {
      throw new Error("Post not found in local storage");
    }

    // Apply optimistic delete
    if (optimistic) {
      this.data.delete(postId);
      this.saveToStorage();
    }

    try {
      if (this.isOnline) {
        // Try immediate sync
        const response = await enhancedApiService._deletePostInternal(postId);

        if (response.success) {
          return { success: true };
        }
      }
    } catch (error) {
      console.error("Immediate sync failed, adding to queue:", error);

      // Revert optimistic delete on error
      if (optimistic) {
        this.data.set(postId, existingPost);
        this.saveToStorage();
      }
    }

    // Add to sync queue for later
    const operation = {
      type: "delete",
      entity: "post",
      id: postId,
      originalData: existingPost,
    };

    this.addToSyncQueue(operation);

    return {
      success: true,
      pending: true,
    };
  }

  /**
   * Get post data
   */
  getPost(postId) {
    return this.data.get(postId) || null;
  }

  /**
   * Get all posts
   */
  getAllPosts(filters = {}) {
    let posts = Array.from(this.data.values());

    // Apply filters
    if (filters.status) {
      posts = posts.filter((post) => post.status === filters.status);
    }

    if (filters.category) {
      posts = posts.filter((post) => post.category === filters.category);
    }

    if (filters.author_id) {
      posts = posts.filter((post) => post.author_id === filters.author_id);
    }

    // Sort by updated_at
    posts.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB - dateA;
    });

    return posts;
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      const operations = Array.from(this.pendingOperations.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      for (const operation of operations) {
        try {
          await this.syncOperation(operation);
          this.pendingOperations.delete(operation.id);
        } catch (error) {
          console.error("Sync operation failed:", error);

          // Increment retry count
          operation.retryCount++;

          // Remove after max retries
          if (operation.retryCount >= 3) {
            this.handleSyncFailure(operation, error);
            this.pendingOperations.delete(operation.id);
          } else {
            this.pendingOperations.set(operation.id, operation);
          }
        }
      }

      this.saveSyncQueue();
      localStorage.setItem(this.lastSyncKey, Date.now().toString());
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync individual operation
   */
  async syncOperation(operation) {
    switch (operation.type) {
      case "create":
        return await this.syncCreate(operation);
      case "update":
        return await this.syncUpdate(operation);
      case "delete":
        return await this.syncDelete(operation);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Sync create operation
   */
  async syncCreate(operation) {
    const response = await enhancedApiService._createPostInternal(
      operation.data
    );

    if (response.success) {
      // Replace temp data with real data
      this.data.delete(operation.tempId);
      this.data.set(response.data.id, response.data);
      this.saveToStorage();
    }

    return response;
  }

  /**
   * Sync update operation
   */
  async syncUpdate(operation) {
    const response = await enhancedApiService._updatePostInternal(
      operation.id,
      operation.data
    );

    if (response.success) {
      this.data.set(operation.id, response.data);
      this.saveToStorage();
    }

    return response;
  }

  /**
   * Sync delete operation
   */
  async syncDelete(operation) {
    const response = await enhancedApiService._deletePostInternal(operation.id);

    if (response.success) {
      this.data.delete(operation.id);
      this.saveToStorage();
    }

    return response;
  }

  /**
   * Handle sync failure
   */
  handleSyncFailure(operation, error) {
    console.error("Sync operation failed permanently:", operation, error);

    // Add to conflict queue for manual resolution
    this.conflictQueue.push({
      operation,
      error: error.message,
      timestamp: Date.now(),
    });

    this.saveConflicts();
  }

  /**
   * Handle real-time create event
   */
  handleRealTimeCreate(blogData) {
    if (blogData._isOptimistic || blogData._wasOptimistic) {
      return; // Skip our own optimistic updates
    }

    this.data.set(blogData.id, blogData);
    this.saveToStorage();
  }

  /**
   * Handle real-time update event
   */
  handleRealTimeUpdate(blogData) {
    if (blogData._isOptimistic) {
      return; // Skip optimistic updates
    }

    const existing = this.data.get(blogData.id);
    if (existing && existing._isOptimistic) {
      // Conflict with local optimistic change
      this.handleConflict(existing, blogData);
    } else {
      this.data.set(blogData.id, blogData);
      this.saveToStorage();
    }
  }

  /**
   * Handle real-time delete event
   */
  handleRealTimeDelete(deleteData) {
    this.data.delete(deleteData.id);
    this.saveToStorage();
  }

  /**
   * Handle data conflicts
   */
  handleConflict(localData, remoteData) {
    // Simple conflict resolution: remote wins
    this.data.set(remoteData.id, {
      ...remoteData,
      _hasConflict: true,
      _localVersion: localData,
      _remoteVersion: remoteData,
    });

    this.saveToStorage();

    // Add to conflict queue for user resolution
    this.conflictQueue.push({
      type: "data_conflict",
      entityId: remoteData.id,
      localData,
      remoteData,
      timestamp: Date.now(),
    });

    this.saveConflicts();
  }

  /**
   * Start background sync
   */
  startBackgroundSync() {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline) {
        this.processSyncQueue();
      }
    }, 30000);
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingOperations: this.pendingOperations.size,
      conflicts: this.conflictQueue.length,
      lastSync: localStorage.getItem(this.lastSyncKey),
    };
  }

  /**
   * Force sync all pending operations
   */
  async forceSync() {
    if (!this.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    return await this.processSyncQueue();
  }

  /**
   * Clear all data (for testing/reset)
   */
  clearAllData() {
    this.data.clear();
    this.pendingOperations.clear();
    this.conflictQueue = [];

    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.syncQueue);
    localStorage.removeItem(this.lastSyncKey);
    localStorage.removeItem(this.conflictResolutionKey);
  }

  /**
   * Export data for backup
   */
  exportData() {
    return {
      data: Object.fromEntries(this.data),
      pendingOperations: Object.fromEntries(this.pendingOperations),
      conflicts: this.conflictQueue,
      timestamp: Date.now(),
    };
  }

  /**
   * Import data from backup
   */
  importData(backupData) {
    if (backupData.data) {
      this.data = new Map(Object.entries(backupData.data));
    }

    if (backupData.pendingOperations) {
      this.pendingOperations = new Map(
        Object.entries(backupData.pendingOperations)
      );
    }

    if (backupData.conflicts) {
      this.conflictQueue = backupData.conflicts;
    }

    this.saveToStorage();
    this.saveSyncQueue();
    this.saveConflicts();
  }
}

// Create singleton instance
const persistentDataService = new PersistentDataService();

export default persistentDataService;
