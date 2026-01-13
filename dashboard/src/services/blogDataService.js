/**
 * Blog Data Service
 * Enhanced data fetching service with proper caching, error handling, and loading states
 * Eliminates infinite loading and provides smooth operation for blog management
 */

import { BLOG_API_CONFIG } from '../config';
import contentService from './contentService';

class BlogDataService {
  constructor() {
    this.cache = new Map();
    this.loadingStates = new Map();
    this.errorStates = new Map();
    this.subscribers = new Map();
    this.retryAttempts = 3;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.requestTimeout = 10000; // 10 seconds
    
    // Debounce timers
    this.debounceTimers = new Map();
    
    // Network status
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
  }

  /**
   * Trigger synchronization with the live website
   */
  async triggerSyncWithLiveSite() {
    try {
      console.log('Triggering sync with live site...');
      const response = await fetch(`${BLOG_API_CONFIG.mainWebsiteUrl}/api/sync-firebase-posts.php`, {
        method: 'GET',
        mode: 'no-cors' // Use no-cors since we just want to trigger it and might not have CORS setup specifically for this script
      });
      console.log('Sync trigger sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to trigger sync with live site:', error);
      return { success: false, error };
    }
  }

  /**
   * Setup network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifySubscribers('network', { online: true });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifySubscribers('network', { online: false });
    });
  }

  /**
   * Subscribe to data changes
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  /**
   * Notify subscribers of data changes
   */
  notifySubscribers(key, data) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  /**
   * Get cache key for posts
   */
  getPostsCacheKey(options = {}) {
    const { status, category, author, limit, search } = options;
    return `posts_${status || 'all'}_${category || 'all'}_${author || 'all'}_${limit || 10}_${search || ''}`;
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.cacheTimeout;
  }

  /**
   * Get cached data
   */
  getCachedData(key) {
    if (this.isCacheValid(key)) {
      return this.cache.get(key).data;
    }
    return null;
  }

  /**
   * Set cache data
   */
  setCacheData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for specific key or all
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Set loading state
   */
  setLoading(key, loading) {
    if (loading) {
      this.loadingStates.set(key, true);
    } else {
      this.loadingStates.delete(key);
    }
    this.notifySubscribers(`loading_${key}`, loading);
  }

  /**
   * Get loading state
   */
  isLoading(key) {
    return this.loadingStates.has(key);
  }

  /**
   * Set error state
   */
  setError(key, error) {
    if (error) {
      this.errorStates.set(key, error);
    } else {
      this.errorStates.delete(key);
    }
    this.notifySubscribers(`error_${key}`, error);
  }

  /**
   * Get error state
   */
  getError(key) {
    return this.errorStates.get(key) || null;
  }

  /**
   * Execute request with timeout and retry logic
   */
  async executeWithRetry(operation, key, retries = this.retryAttempts) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Set loading state
        this.setLoading(key, true);
        this.setError(key, null);

        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), this.requestTimeout);
        });

        // Race between operation and timeout
        const result = await Promise.race([operation(), timeoutPromise]);
        
        // Success - clear loading and return result
        this.setLoading(key, false);
        return result;
        
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed for ${key}:`, error.message);
        
        // If not the last attempt, wait before retrying
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All attempts failed
    this.setLoading(key, false);
    this.setError(key, lastError);
    throw lastError;
  }

  /**
   * Debounced operation execution
   */
  debounce(key, operation, delay = 300) {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(key);
        }
      }, delay);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * Get posts with caching and error handling
   */
  async getPosts(options = {}) {
    const cacheKey = this.getPostsCacheKey(options);
    
    // Return cached data if available and valid
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      this.notifySubscribers('posts', cachedData);
      return cachedData;
    }

    // Prevent duplicate requests
    if (this.isLoading(cacheKey)) {
      return new Promise((resolve, reject) => {
        const unsubscribe = this.subscribe(`posts_${cacheKey}`, (data) => {
          unsubscribe();
          if (data.error) {
            reject(data.error);
          } else {
            resolve(data);
          }
        });
      });
    }

    try {
      const result = await this.executeWithRetry(async () => {
        const response = await contentService.getPosts(options);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch posts');
        }
        
        return response.data || [];
      }, cacheKey);

      // Cache the result
      this.setCacheData(cacheKey, result);
      
      // Notify subscribers
      this.notifySubscribers('posts', result);
      this.notifySubscribers(`posts_${cacheKey}`, { data: result });
      
      return result;
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      
      // Try to return stale cache data if available
      const staleData = this.cache.get(cacheKey)?.data;
      if (staleData) {
        console.warn('Returning stale cache data due to error');
        this.notifySubscribers('posts', staleData);
        return staleData;
      }
      
      // Notify subscribers of error
      this.notifySubscribers(`posts_${cacheKey}`, { error });
      throw error;
    }
  }

  /**
   * Listen to blog posts in real-time
   */
  listenToPosts(callback, options = {}) {
    const { status, category, author, limit = 50 } = options;
    const filters = [];
    
    if (status && status !== 'all') filters.push({ field: 'status', operator: '==', value: status });
    if (category && category !== 'all') filters.push({ field: 'category', operator: '==', value: category });
    if (author && author !== 'all') filters.push({ field: 'authorId', operator: '==', value: author });

    console.log('📡 Setting up real-time listener for posts...', { filters, limit });

    return contentService.listenToPosts((result) => {
      if (result.success) {
        // Update cache with fresh data
        const cacheKey = this.getPostsCacheKey(options);
        this.setCacheData(cacheKey, result.data);
        
        // Notify subscribers of the new data
        this.notifySubscribers('posts', result.data);
      }
      callback(result);
    }, {
      filters,
      orderByField: 'metadata.createdAt',
      orderByDirection: 'desc',
      limitCount: limit
    });
  }

  /**
   * Get single post with caching
   */
  async getPost(postId) {
    const cacheKey = `post_${postId}`;
    
    // Return cached data if available
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const result = await this.executeWithRetry(async () => {
        const response = await contentService.getPost(postId);
        
        if (!response.success) {
          throw new Error(response.error || 'Post not found');
        }
        
        return response.data;
      }, cacheKey);

      // Cache the result
      this.setCacheData(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  /**
   * Create post with optimistic updates
   */
  async createPost(postData, authorId) {
    const tempId = `temp_${Date.now()}`;
    const optimisticPost = {
      id: tempId,
      ...postData,
      authorId,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      _isOptimistic: true
    };

    try {
      // Add optimistic update
      this.notifySubscribers('post_created', optimisticPost);
      
      const result = await this.executeWithRetry(async () => {
        const response = await contentService.createPost(postData, authorId);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to create post');
        }
        
        return response.data;
      }, `create_${tempId}`);

      // Replace optimistic update with real data
      this.notifySubscribers('post_created_success', { tempId, realPost: result });
      
      // Clear relevant caches
      this.clearPostsCaches();
      
      return result;
      
    } catch (error) {
      // Remove optimistic update on error
      this.notifySubscribers('post_created_error', { tempId, error });
      throw error;
    }
  }

  /**
   * Update post with optimistic updates
   */
  async updatePost(postId, updates) {
    try {
      // Apply optimistic update
      this.notifySubscribers('post_updated_optimistic', { postId, updates });
      
      const result = await this.executeWithRetry(async () => {
        const response = await contentService.updatePost(postId, updates);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to update post');
        }
        
        return response.data;
      }, `update_${postId}`);

      // Confirm update with real data
      this.notifySubscribers('post_updated_success', { postId, post: result });
      
      // Clear relevant caches
      this.clearCache(`post_${postId}`);
      this.clearPostsCaches();
      
      return result;
      
    } catch (error) {
      // Revert optimistic update on error
      this.notifySubscribers('post_updated_error', { postId, error });
      throw error;
    }
  }

  /**
   * Delete post with optimistic updates
   */
  async deletePost(postId) {
    try {
      // Apply optimistic update
      this.notifySubscribers('post_deleted_optimistic', { postId });
      
      const result = await this.executeWithRetry(async () => {
        const response = await contentService.deletePost(postId);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete post');
        }
        
        return response;
      }, `delete_${postId}`);

      // Confirm deletion
      this.notifySubscribers('post_deleted_success', { postId });
      
      // Clear relevant caches
      this.clearCache(`post_${postId}`);
      this.clearPostsCaches();
      
      return result;
      
    } catch (error) {
      // Revert optimistic update on error
      this.notifySubscribers('post_deleted_error', { postId, error });
      throw error;
    }
  }

  /**
   * Clear all posts-related caches
   */
  clearPostsCaches() {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith('posts_')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Refresh posts data
   */
  async refreshPosts(options = {}) {
    const cacheKey = this.getPostsCacheKey(options);
    this.clearCache(cacheKey);
    return await this.getPosts(options);
  }

  /**
   * Get loading states for UI
   */
  getLoadingStates() {
    const states = {};
    for (const [key, value] of this.loadingStates) {
      states[key] = value;
    }
    return states;
  }

  /**
   * Get error states for UI
   */
  getErrorStates() {
    const states = {};
    for (const [key, value] of this.errorStates) {
      states[key] = value;
    }
    return states;
  }

  /**
   * Clear all states (useful for cleanup)
   */
  clearAllStates() {
    this.cache.clear();
    this.loadingStates.clear();
    this.errorStates.clear();
    this.subscribers.clear();
    
    // Clear debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }
}

// Create singleton instance
const blogDataService = new BlogDataService();

export default blogDataService;