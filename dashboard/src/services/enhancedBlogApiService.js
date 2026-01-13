/**
 * Enhanced Blog API Service
 * Comprehensive API integration with devinquire.com blog system
 * Includes CRUD operations, real-time sync, authentication, and error handling
 */

import blogCachingService from './blogCachingService.js';
import blogValidationService from './blogValidationService.js';
import blogVersionControlService from './blogVersionControlService.js';
import firestoreService from './firestoreService.js';
import { realTimeService } from './realTimeService.js';

class EnhancedBlogApiService {
  constructor() {
    // Initialize endpoints from environment
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'https://devinquire.com';
    this.blogEndpoint = '/api';

    // Firebase-based configuration - no external API needed
    this.config = {
      batchSize: 10,
      maxConcurrentRequests: 5,
      enableCaching: true,
      enableValidation: true,
      enableVersionControl: true,
      enableRealTimeSync: true,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000
    };
    
    this.requestQueue = [];
    this.activeRequests = new Set();
    this.authToken = null;
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    
    // Event listeners
    this.eventListeners = new Map();
    
    // Firebase real-time listeners
    this.firebaseUnsubscribe = null;
    this.publishedUnsubscribe = null;
    
    // Initialize services
    this.initializeServices();
  }

  /**
   * Initialize integrated services
   */
  async initializeServices() {
    try {
      // Initialize real-time connection
      if (this.config.enableRealTimeSync) {
        await this.initializeRealTimeSync();
      }
      
      // Warm up cache
      if (this.config.enableCaching) {
        await this.warmUpCache();
      }
      
      console.log('Enhanced Blog API Service initialized successfully');
    } catch (error) {
      console.error('Service initialization error:', error);
    }
  }

  /**
   * Set authentication tokens
   */
  setAuthTokens(accessToken, refreshToken = null) {
    this.authToken = accessToken;
    this.refreshToken = refreshToken;
  }

  /**
   * Get all blog posts with advanced filtering and pagination
   */
  async getBlogPosts(options = {}) {
    const {
      page = 1,
      limit = 10,
      category = null,
      author = null,
      tags = null,
      status = 'published',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = null,
      dateFrom = null,
      dateTo = null,
      includeMetrics = false,
      useCache = this.config.enableCaching
    } = options;

    const cacheKey = this.generateCacheKey('posts', {
      page, limit, category, author, tags, status, sortBy, sortOrder, search, dateFrom, dateTo
    });

    try {
      // Try cache first
      if (useCache) {
        const cached = await blogCachingService.get(cacheKey);
        if (cached) {
          this.emit('posts:cache_hit', { cacheKey, data: cached });
          return cached;
        }
      }

      // Use Firebase Firestore via firestoreService
      const filters = [];
      
      // Apply filters
      if (status) {
        filters.push({ field: 'status', operator: '==', value: status });
      }
      if (category) {
        filters.push({ field: 'category', operator: '==', value: category });
      }
      if (author) {
        filters.push({ field: 'author', operator: '==', value: author });
      }
      if (tags && tags.length > 0) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        filters.push({ field: 'tags', operator: 'array-contains-any', value: tagArray });
      }
      
      // Apply date filters
      if (dateFrom) {
        filters.push({ field: 'createdAt', operator: '>=', value: new Date(dateFrom) });
      }
      if (dateTo) {
        filters.push({ field: 'createdAt', operator: '<=', value: new Date(dateTo) });
      }
      
      // Prepare query options
      const queryOptions = {
        filters,
        orderByField: sortBy,
        orderByDirection: sortOrder,
        limitCount: limit,
        startAfterDoc: page > 1 ? (page - 1) * limit : null,
        useCache: useCache
      };
      
      const posts = await firestoreService.getDocuments('blogPosts', queryOptions);
      
      // Apply search filter (client-side for now)
      let filteredPosts = posts;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredPosts = posts.filter(post => 
          post.title?.toLowerCase().includes(searchLower) ||
          post.content?.toLowerCase().includes(searchLower) ||
          post.excerpt?.toLowerCase().includes(searchLower)
        );
      }
      
      const result = {
        success: true,
        data: {
          posts: filteredPosts,
          pagination: {
            page,
            limit,
            total: filteredPosts.length,
            totalPages: Math.ceil(filteredPosts.length / limit)
          }
        },
        meta: {
          cached: false,
          source: 'firebase'
        }
      };
      
      // Cache the result
      if (useCache) {
        await blogCachingService.cacheBlogList(result.data, page, {
          category, author, tags, status, sortBy, sortOrder, search
        });
      }

      this.emit('posts:fetched', { options, data: result.data });
      return result;
    } catch (error) {
      console.error('Error fetching blog posts from Firebase:', error);
      this.emit('posts:error', { error, options });
      
      // Return cached data if available on error
      if (useCache) {
        const cached = await blogCachingService.get(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            meta: { cached: true, source: 'cache_fallback' }
          };
        }
      }
      
      throw new Error(`Failed to fetch blog posts: ${error.message}`);
    }
  }

  /**
   * Get single blog post by ID
   */
  async getBlogPost(id, options = {}) {
    const {
      includeContent = true,
      includeMetrics = false,
      includeComments = false,
      useCache = this.config.enableCaching
    } = options;

    const cacheKey = `post:${id}:${includeContent}:${includeMetrics}:${includeComments}`;
    
    try {
      // Try cache first
      if (useCache) {
        const cached = await blogCachingService.get(cacheKey);
        if (cached) {
          this.emit('post:cache_hit', { id, data: cached });
          return cached;
        }
      }
      
      // Get post from Firebase using firestoreService
      const postData = await firestoreService.getDocument('blogPosts', id, useCache);
      
      if (!postData) {
        throw new Error(`Blog post with ID ${id} not found`);
      }
      
      const result = {
        success: true,
        data: postData,
        meta: {
          cached: false,
          source: 'firebase'
        }
      };
      
      // Cache the result
      if (useCache) {
        await blogCachingService.set(cacheKey, result);
      }
      
      this.emit('post:fetched', { id, data: postData });
      return result;
    } catch (error) {
      console.error(`Error fetching blog post ${id}:`, error);
      this.emit('post:error', { error, id });
      
      // Return cached data if available on error
      if (useCache) {
        const cached = await blogCachingService.get(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached.data,
            meta: { cached: true, source: 'cache_fallback' }
          };
        }
      }
      
      throw new Error(`Failed to fetch blog post: ${error.message}`);
    }
  }

  /**
   * Create new blog post
   */
  async createBlogPost(postData, options = {}) {
    const {
      validateBeforeCreate = this.config.enableValidation,
      enableVersionControl = this.config.enableVersionControl,
      autoPublish = false,
      scheduledPublishDate = null
    } = options;

    try {
      // Validate post data
      if (validateBeforeCreate) {
        const validation = await blogValidationService.validatePost(postData, {
          validateForPublishing: autoPublish
        });
        
        if (!validation.isValid) {
          const error = new Error('Validation failed');
          error.validation = validation;
          throw error;
        }
      }

      // Prepare post data
      const processedData = {
        ...postData,
        id: this.generatePostId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        status: autoPublish ? 'published' : 'draft'
      };

      if (scheduledPublishDate) {
        processedData.scheduledPublishDate = scheduledPublishDate;
        processedData.status = 'scheduled';
      }

      // Create version control entry
      if (enableVersionControl) {
        await blogVersionControlService.createRevision(processedData.id, processedData, {
          action: 'create',
          comment: 'Initial post creation'
        });
      }

      // Make API request
      const response = await this.makeRequest('POST', `${this.blogEndpoint}/posts`, processedData);
      
      if (response.success) {
        // Invalidate relevant caches
        await this.invalidateRelatedCaches('create', response.data);
        
        // Sync to live site if published
        if (autoPublish) {
          await this.syncToLiveSite(response.data);
        }
        
        this.emit('post:created', { data: response.data });
      }

      return response;
    } catch (error) {
      this.emit('post:create_error', { error, postData });
      throw this.handleApiError(error, 'createBlogPost');
    }
  }

  /**
   * Update existing blog post
   */
  async updateBlogPost(id, updateData, options = {}) {
    const {
      validateBeforeUpdate = this.config.enableValidation,
      enableVersionControl = this.config.enableVersionControl,
      createRevision = true,
      revisionComment = 'Post updated'
    } = options;

    try {
      // Get current post for version control
      let currentPost = null;
      if (enableVersionControl) {
        const currentResponse = await this.getBlogPost(id, { useCache: false });
        if (currentResponse.success) {
          currentPost = currentResponse.data;
        }
      }

      // Validate update data
      if (validateBeforeUpdate) {
        const validation = await blogValidationService.validatePost(updateData);
        
        if (!validation.isValid) {
          const error = new Error('Validation failed');
          error.validation = validation;
          throw error;
        }
      }

      // Prepare update data
      const processedData = {
        ...updateData,
        updatedAt: new Date().toISOString(),
        version: currentPost ? currentPost.version + 1 : 1
      };

      // Create version control entry
      if (enableVersionControl && createRevision && currentPost) {
        await blogVersionControlService.createRevision(id, processedData, {
          action: 'update',
          comment: revisionComment,
          previousVersion: currentPost
        });
      }

      // Make API request
      const response = await this.makeRequest('PUT', `${this.blogEndpoint}/posts/${id}`, processedData);
      
      if (response.success) {
        // Invalidate relevant caches
        await this.invalidateRelatedCaches('update', response.data);
        
        // Sync to live site if published
        if (response.data.status === 'published') {
          await this.syncToLiveSite(response.data);
        }
        
        this.emit('post:updated', { id, data: response.data });
      }

      return response;
    } catch (error) {
      this.emit('post:update_error', { error, id, updateData });
      throw this.handleApiError(error, 'updateBlogPost');
    }
  }

  /**
   * Delete blog post
   */
  async deleteBlogPost(id, options = {}) {
    const {
      softDelete = true,
      enableVersionControl = this.config.enableVersionControl,
      revisionComment = 'Post deleted'
    } = options;

    try {
      // Get current post for version control
      let currentPost = null;
      if (enableVersionControl) {
        const currentResponse = await this.getBlogPost(id, { useCache: false });
        if (currentResponse.success) {
          currentPost = currentResponse.data;
        }
      }

      // Create version control entry
      if (enableVersionControl && currentPost) {
        await blogVersionControlService.createRevision(id, currentPost, {
          action: 'delete',
          comment: revisionComment
        });
      }

      // Make API request
      const method = softDelete ? 'PATCH' : 'DELETE';
      const data = softDelete ? { status: 'deleted', deletedAt: new Date().toISOString() } : null;
      
      const response = await this.makeRequest(method, `${this.blogEndpoint}/posts/${id}`, data);
      
      if (response.success) {
        // Invalidate relevant caches
        await this.invalidateRelatedCaches('delete', { id, ...currentPost });
        
        // Remove from live site
        await this.removeFromLiveSite(id);
        
        this.emit('post:deleted', { id, softDelete });
      }

      return response;
    } catch (error) {
      this.emit('post:delete_error', { error, id });
      throw this.handleApiError(error, 'deleteBlogPost');
    }
  }

  /**
   * Publish blog post
   */
  async publishBlogPost(id, options = {}) {
    const {
      scheduledDate = null,
      validateBeforePublish = true
    } = options;

    try {
      // Get current post
      const currentResponse = await this.getBlogPost(id, { useCache: false });
      if (!currentResponse.success) {
        throw new Error('Post not found');
      }

      const currentPost = currentResponse.data;

      // Validate for publishing
      if (validateBeforePublish) {
        const validation = await blogValidationService.validatePost(currentPost, {
          validateForPublishing: true
        });
        
        if (!validation.isValid) {
          const error = new Error('Post not ready for publishing');
          error.validation = validation;
          throw error;
        }
      }

      // Prepare publish data
      const publishData = {
        status: scheduledDate ? 'scheduled' : 'published',
        publishedAt: scheduledDate || new Date().toISOString()
      };

      if (scheduledDate) {
        publishData.scheduledPublishDate = scheduledDate;
      }

      // Update post
      const response = await this.updateBlogPost(id, publishData, {
        revisionComment: scheduledDate ? 'Post scheduled for publishing' : 'Post published'
      });

      if (response.success && !scheduledDate) {
        // Sync to live site immediately
        await this.syncToLiveSite(response.data);
        this.emit('post:published', { id, data: response.data });
      } else if (response.success && scheduledDate) {
        this.emit('post:scheduled', { id, scheduledDate, data: response.data });
      }

      return response;
    } catch (error) {
      this.emit('post:publish_error', { error, id });
      throw this.handleApiError(error, 'publishBlogPost');
    }
  }

  /**
   * Unpublish blog post
   */
  async unpublishBlogPost(id, options = {}) {
    try {
      const response = await this.updateBlogPost(id, {
        status: 'draft',
        unpublishedAt: new Date().toISOString()
      }, {
        revisionComment: 'Post unpublished'
      });

      if (response.success) {
        // Remove from live site
        await this.removeFromLiveSite(id);
        this.emit('post:unpublished', { id, data: response.data });
      }

      return response;
    } catch (error) {
      this.emit('post:unpublish_error', { error, id });
      throw this.handleApiError(error, 'unpublishBlogPost');
    }
  }

  /**
   * Bulk operations
   */
  async bulkUpdatePosts(updates, options = {}) {
    const {
      batchSize = this.config.batchSize,
      validateEach = false
    } = options;

    const results = [];
    const errors = [];

    // Process in batches
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const batchPromises = batch.map(async (update) => {
        try {
          const result = await this.updateBlogPost(update.id, update.data, {
            validateBeforeUpdate: validateEach
          });
          return { id: update.id, success: true, data: result.data };
        } catch (error) {
          return { id: update.id, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value);
          } else {
            errors.push(result.value);
          }
        } else {
          errors.push({
            id: batch[index].id,
            success: false,
            error: result.reason.message
          });
        }
      });
    }

    this.emit('posts:bulk_updated', { results, errors });
    
    return {
      success: errors.length === 0,
      results,
      errors,
      total: updates.length,
      successful: results.length,
      failed: errors.length
    };
  }

  /**
   * Search blog posts
   */
  async searchBlogPosts(query, options = {}) {
    const {
      filters = {},
      sortBy = 'relevance',
      page = 1,
      limit = 10,
      useCache = true
    } = options;

    const cacheKey = this.generateCacheKey('search', { query, filters, sortBy, page, limit });

    try {
      // Try cache first
      if (useCache) {
        const cached = await blogCachingService.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const searchData = {
        query,
        filters,
        sortBy,
        page,
        limit
      };

      const response = await this.makeRequest('POST', `${this.blogEndpoint}/search`, searchData);
      
      // Cache search results
      if (useCache && response.success) {
        await blogCachingService.set(cacheKey, response, {
          ttl: 2 * 60 * 1000, // 2 minutes for search results
          tags: ['search', 'blog']
        });
      }

      this.emit('posts:searched', { query, results: response.data });
      return response;
    } catch (error) {
      this.emit('posts:search_error', { error, query });
      throw this.handleApiError(error, 'searchBlogPosts');
    }
  }

  /**
   * Get blog analytics
   */
  async getBlogAnalytics(options = {}) {
    const {
      dateFrom = null,
      dateTo = null,
      metrics = ['views', 'shares', 'comments', 'engagement'],
      groupBy = 'day'
    } = options;

    try {
      const params = new URLSearchParams({ groupBy });
      
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      metrics.forEach(metric => params.append('metrics', metric));

      const response = await this.makeRequest('GET', `${this.blogEndpoint}/analytics?${params}`);
      
      this.emit('analytics:fetched', { options, data: response.data });
      return response;
    } catch (error) {
      this.emit('analytics:error', { error, options });
      throw this.handleApiError(error, 'getBlogAnalytics');
    }
  }

  /**
   * Sync post to live website
   */
  async syncToLiveSite(post) {
    try {
      const syncData = {
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        category: post.category,
        tags: post.tags,
        author: post.author,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
        seo: post.seo
      };

      const response = await this.makeRequest('POST', '/api/v1/sync/blog', syncData);
      
      if (response.success) {
        this.emit('post:synced', { id: post.id, data: syncData });
      }

      return response;
    } catch (error) {
      console.error('Sync to live site error:', error);
      this.emit('post:sync_error', { error, post });
      throw error;
    }
  }

  /**
   * Remove post from live website
   */
  async removeFromLiveSite(postId) {
    try {
      const response = await this.makeRequest('DELETE', `/api/v1/sync/blog/${postId}`);
      
      if (response.success) {
        this.emit('post:removed_from_live', { id: postId });
      }

      return response;
    } catch (error) {
      console.error('Remove from live site error:', error);
      this.emit('post:remove_error', { error, postId });
      throw error;
    }
  }

  // Helper methods

  async makeRequest(method, url, data = null, options = {}) {
    const {
      timeout = this.config.timeout,
      retryAttempts = this.config.retryAttempts,
      retryDelay = this.config.retryDelay
    } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const requestId = this.generateRequestId();

    // Check concurrent request limit
    if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
      await this.waitForRequestSlot();
    }

    this.activeRequests.add(requestId);

    try {
      const requestConfig = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
        },
        ...(data && { body: JSON.stringify(data) })
      };

      // Apply request interceptors
      for (const interceptor of this.requestInterceptors) {
        await interceptor(requestConfig);
      }

      let lastError;
      
      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetch(fullUrl, {
            ...requestConfig,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          // Apply response interceptors
          for (const interceptor of this.responseInterceptors) {
            await interceptor(response);
          }

          if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401 && this.refreshToken) {
              const refreshed = await this.refreshAuthToken();
              if (refreshed) {
                // Retry with new token
                requestConfig.headers['Authorization'] = `Bearer ${this.authToken}`;
                continue;
              }
            }
            
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          
          return {
            success: true,
            data: result.data || result,
            meta: result.meta || {},
            requestId
          };
        } catch (error) {
          lastError = error;
          
          if (attempt < retryAttempts) {
            await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
          }
        }
      }
      
      throw lastError;
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  async refreshAuthToken() {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.authToken = data.accessToken;
        if (data.refreshToken) {
          this.refreshToken = data.refreshToken;
        }
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    return false;
  }

  async waitForRequestSlot() {
    return new Promise((resolve) => {
      const checkSlot = () => {
        if (this.activeRequests.size < this.config.maxConcurrentRequests) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }

  generateCacheKey(type, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `blog:${type}:${sortedParams}`;
  }

  generatePostId() {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handleApiError(error, context) {
    const enhancedError = new Error(`${context}: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.context = context;
    enhancedError.timestamp = new Date().toISOString();
    
    if (error.validation) {
      enhancedError.validation = error.validation;
    }
    
    return enhancedError;
  }

  async invalidateRelatedCaches(action, post) {
    try {
      // Invalidate specific post cache
      await blogCachingService.invalidateBlogCache('post', post.id);
      
      // Invalidate list caches
      await blogCachingService.invalidateBlogCache('lists');
      
      // Invalidate category cache
      if (post.category) {
        await blogCachingService.invalidateBlogCache('category', post.category);
      }
      
      // Invalidate author cache
      if (post.author) {
        await blogCachingService.invalidateBlogCache('author', post.author);
      }
      
      // Invalidate tag caches
      if (post.tags && Array.isArray(post.tags)) {
        for (const tag of post.tags) {
          await blogCachingService.invalidateBlogCache('tag', tag);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async initializeRealTimeSync() {
    try {
      // Initialize Firebase real-time listeners for blog posts using firestoreService
      console.log('Real-time sync connected via Firebase');
      this.emit('realtime:connected');
      
      // Listen to all blog posts for real-time updates
      this.firebaseUnsubscribe = await firestoreService.listenToCollection(
        'posts',
        (posts) => {
          // Handle real-time updates for all posts
          posts.forEach((post) => {
            this.handleRealTimeUpdate({ type: 'post:updated', payload: post });
          });
        },
        {
          orderByField: 'updated_at',
          orderByDirection: 'desc'
        }
      );
      
      // Listen to published posts separately for live site updates
      this.publishedUnsubscribe = await firestoreService.listenToCollection(
        'posts',
        (posts) => {
          posts.forEach((post) => {
            if (post.status === 'published') {
              this.handleRealTimeUpdate({ type: 'post:published', payload: post });
            }
          });
        },
        {
          filters: [{ field: 'status', operator: '==', value: 'published' }],
          orderByField: 'published_at',
          orderByDirection: 'desc'
        }
      );
      
    } catch (error) {
      console.error('Real-time sync initialization error:', error);
      this.emit('realtime:error', error);
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.initializeRealTimeSync(), 5000);
    }
  }

  handleRealTimeUpdate(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'post:created':
      case 'post:updated':
      case 'post:deleted':
        // Invalidate relevant caches
        this.invalidateRelatedCaches(type.split(':')[1], payload);
        this.emit(type, payload);
        break;
      
      case 'post:published':
        this.emit('post:published', payload);
        break;
      
      default:
        console.log('Unknown real-time update type:', type);
    }
  }

  async warmUpCache() {
    try {
      await blogCachingService.warmUpBlogCache(this);
    } catch (error) {
      console.error('Cache warm-up error:', error);
    }
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
    
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error);
        }
      });
    }
  }

  // Request/Response interceptors
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  // Configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig() {
    return { ...this.config };
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.makeRequest('GET', '/api/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup Firebase listeners and resources
   */
  cleanup() {
    try {
      // Unsubscribe from Firebase listeners
      if (this.firebaseUnsubscribe) {
        this.firebaseUnsubscribe();
        this.firebaseUnsubscribe = null;
      }
      
      if (this.publishedUnsubscribe) {
        this.publishedUnsubscribe();
        this.publishedUnsubscribe = null;
      }
      
      // Clear event listeners
      this.eventListeners.clear();
      
      // Clear request queue
      this.requestQueue = [];
      this.activeRequests.clear();
      
      console.log('Enhanced Blog API Service cleaned up successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

const enhancedBlogApiService = new EnhancedBlogApiService();
export default enhancedBlogApiService;