/**
 * Blog Caching Service
 * Comprehensive caching solution with intelligent cache management,
 * performance optimization, and automatic invalidation strategies
 */

class BlogCachingService {
  constructor() {
    this.cache = new Map();
    this.cacheMetadata = new Map();
    this.subscribers = new Map();
    this.config = {
      maxCacheSize: 100, // Maximum number of cached items
      defaultTTL: 5 * 60 * 1000, // 5 minutes default TTL
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB max memory usage
      cleanupInterval: 2 * 60 * 1000, // 2 minutes cleanup interval
      compressionThreshold: 1024, // Compress items larger than 1KB
      prefetchThreshold: 0.8, // Prefetch when cache hit ratio drops below 80%
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0,
      memoryUsage: 0,
      lastCleanup: Date.now()
    };
    
    this.cacheStrategies = {
      LRU: 'lru', // Least Recently Used
      LFU: 'lfu', // Least Frequently Used
      TTL: 'ttl', // Time To Live
      FIFO: 'fifo' // First In First Out
    };
    
    this.currentStrategy = this.cacheStrategies.LRU;
    
    // Start cleanup interval
    this.startCleanupInterval();
    
    // Initialize performance monitoring
    this.initializePerformanceMonitoring();
  }

  /**
   * Get item from cache with intelligent fallback
   */
  async get(key, fallbackFn = null, options = {}) {
    const {
      ttl = this.config.defaultTTL,
      strategy = this.currentStrategy,
      skipFallback = false,
      updateMetadata = true
    } = options;

    try {
      // Check if item exists in cache
      if (this.cache.has(key)) {
        const cachedItem = this.cache.get(key);
        const metadata = this.cacheMetadata.get(key);
        
        // Check if item is still valid
        if (this.isItemValid(metadata, ttl)) {
          // Update access metadata
          if (updateMetadata) {
            this.updateAccessMetadata(key, metadata);
          }
          
          this.stats.hits++;
          
          // Decompress if needed
          const value = this.decompressIfNeeded(cachedItem);
          
          // Notify subscribers
          this.notifySubscribers(key, 'hit', value);
          
          return value;
        } else {
          // Item expired, remove from cache
          this.delete(key);
        }
      }
      
      this.stats.misses++;
      
      // Try fallback function if provided
      if (fallbackFn && !skipFallback) {
        const value = await fallbackFn();
        if (value !== null && value !== undefined) {
          await this.set(key, value, { ttl, strategy });
          return value;
        }
      }
      
      // Notify subscribers of miss
      this.notifySubscribers(key, 'miss', null);
      
      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      this.notifySubscribers(key, 'error', error);
      
      // Try fallback on error
      if (fallbackFn && !skipFallback) {
        try {
          return await fallbackFn();
        } catch (fallbackError) {
          console.error(`Fallback error for key ${key}:`, fallbackError);
          return null;
        }
      }
      
      return null;
    }
  }

  /**
   * Set item in cache with compression and eviction
   */
  async set(key, value, options = {}) {
    const {
      ttl = this.config.defaultTTL,
      strategy = this.currentStrategy,
      priority = 1,
      tags = [],
      compress = true
    } = options;

    try {
      // Prepare item for caching
      const serializedValue = this.serializeValue(value);
      const itemSize = this.calculateSize(serializedValue);
      
      // Check memory constraints
      if (itemSize > this.config.maxMemoryUsage / 4) {
        console.warn(`Item too large for cache: ${key} (${itemSize} bytes)`);
        return false;
      }
      
      // Compress if needed
      const finalValue = compress && itemSize > this.config.compressionThreshold 
        ? this.compressValue(serializedValue)
        : serializedValue;
      
      if (compress && itemSize > this.config.compressionThreshold) {
        this.stats.compressions++;
      }
      
      // Ensure cache size limits
      await this.ensureCacheSpace(itemSize);
      
      // Create metadata
      const metadata = {
        key,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        ttl,
        strategy,
        priority,
        tags,
        size: itemSize,
        compressed: compress && itemSize > this.config.compressionThreshold,
        version: this.generateVersion()
      };
      
      // Store in cache
      this.cache.set(key, finalValue);
      this.cacheMetadata.set(key, metadata);
      
      // Update memory usage
      this.updateMemoryUsage();
      
      // Notify subscribers
      this.notifySubscribers(key, 'set', value);
      
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      this.notifySubscribers(key, 'error', error);
      return false;
    }
  }

  /**
   * Delete item from cache
   */
  delete(key) {
    try {
      const existed = this.cache.has(key);
      
      if (existed) {
        this.cache.delete(key);
        this.cacheMetadata.delete(key);
        this.updateMemoryUsage();
        this.notifySubscribers(key, 'delete', null);
      }
      
      return existed;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear cache with optional pattern matching
   */
  clear(pattern = null, tags = null) {
    try {
      let clearedCount = 0;
      
      if (!pattern && !tags) {
        // Clear all
        clearedCount = this.cache.size;
        this.cache.clear();
        this.cacheMetadata.clear();
      } else {
        // Clear matching items
        const keysToDelete = [];
        
        for (const [key, metadata] of this.cacheMetadata.entries()) {
          let shouldDelete = false;
          
          // Pattern matching
          if (pattern && this.matchesPattern(key, pattern)) {
            shouldDelete = true;
          }
          
          // Tag matching
          if (tags && this.matchesTags(metadata.tags, tags)) {
            shouldDelete = true;
          }
          
          if (shouldDelete) {
            keysToDelete.push(key);
          }
        }
        
        keysToDelete.forEach(key => {
          this.cache.delete(key);
          this.cacheMetadata.delete(key);
        });
        
        clearedCount = keysToDelete.length;
      }
      
      this.updateMemoryUsage();
      this.notifySubscribers('*', 'clear', { count: clearedCount });
      
      return clearedCount;
    } catch (error) {
      console.error('Cache clear error:', error);
      return 0;
    }
  }

  /**
   * Get multiple items efficiently
   */
  async getMultiple(keys, fallbackFn = null, options = {}) {
    const results = {};
    const missingKeys = [];
    
    // First pass: get cached items
    for (const key of keys) {
      const cachedValue = await this.get(key, null, { ...options, skipFallback: true });
      if (cachedValue !== null) {
        results[key] = cachedValue;
      } else {
        missingKeys.push(key);
      }
    }
    
    // Second pass: fetch missing items
    if (missingKeys.length > 0 && fallbackFn) {
      try {
        const fallbackResults = await fallbackFn(missingKeys);
        
        if (fallbackResults && typeof fallbackResults === 'object') {
          for (const [key, value] of Object.entries(fallbackResults)) {
            if (value !== null && value !== undefined) {
              results[key] = value;
              await this.set(key, value, options);
            }
          }
        }
      } catch (error) {
        console.error('Batch fallback error:', error);
      }
    }
    
    return results;
  }

  /**
   * Set multiple items efficiently
   */
  async setMultiple(items, options = {}) {
    const results = {};
    
    for (const [key, value] of Object.entries(items)) {
      results[key] = await this.set(key, value, options);
    }
    
    return results;
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTags(tags) {
    if (!Array.isArray(tags)) {
      tags = [tags];
    }
    
    return this.clear(null, tags);
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateByPattern(pattern) {
    return this.clear(pattern, null);
  }

  /**
   * Prefetch data based on usage patterns
   */
  async prefetch(keys, fallbackFn, options = {}) {
    const { priority = 0.5 } = options;
    
    // Only prefetch if cache hit ratio is below threshold
    const hitRatio = this.getHitRatio();
    if (hitRatio >= this.config.prefetchThreshold) {
      return;
    }
    
    // Prefetch in background
    setTimeout(async () => {
      for (const key of keys) {
        if (!this.cache.has(key)) {
          try {
            const value = await fallbackFn(key);
            if (value !== null && value !== undefined) {
              await this.set(key, value, { ...options, priority });
            }
          } catch (error) {
            console.warn(`Prefetch failed for key ${key}:`, error);
          }
        }
      }
    }, 0);
  }

  /**
   * Subscribe to cache events
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRatio = this.getHitRatio();
    const memoryUsage = this.stats.memoryUsage;
    const cacheSize = this.cache.size;
    
    return {
      ...this.stats,
      hitRatio,
      cacheSize,
      memoryUsagePercent: (memoryUsage / this.config.maxMemoryUsage) * 100,
      averageItemSize: cacheSize > 0 ? memoryUsage / cacheSize : 0,
      uptime: Date.now() - (this.stats.lastCleanup - this.config.cleanupInterval)
    };
  }

  /**
   * Get cache contents for debugging
   */
  getDebugInfo() {
    const items = [];
    
    for (const [key, metadata] of this.cacheMetadata.entries()) {
      items.push({
        key,
        ...metadata,
        isValid: this.isItemValid(metadata),
        ageMs: Date.now() - metadata.createdAt,
        timeSinceAccess: Date.now() - metadata.lastAccessed
      });
    }
    
    return {
      items: items.sort((a, b) => b.lastAccessed - a.lastAccessed),
      stats: this.getStats(),
      config: this.config
    };
  }

  /**
   * Optimize cache performance
   */
  optimize() {
    try {
      // Clean expired items
      this.cleanupExpired();
      
      // Optimize memory usage
      this.optimizeMemory();
      
      // Adjust strategy based on usage patterns
      this.adjustStrategy();
      
      // Compress large items
      this.compressLargeItems();
      
      console.log('Cache optimization completed');
    } catch (error) {
      console.error('Cache optimization error:', error);
    }
  }

  // Private helper methods

  isItemValid(metadata, customTTL = null) {
    if (!metadata) return false;
    
    const ttl = customTTL || metadata.ttl;
    const age = Date.now() - metadata.createdAt;
    
    return age < ttl;
  }

  updateAccessMetadata(key, metadata) {
    metadata.lastAccessed = Date.now();
    metadata.accessCount++;
    
    // Move to end for LRU
    if (this.currentStrategy === this.cacheStrategies.LRU) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
    }
  }

  async ensureCacheSpace(requiredSize) {
    // Check if we need to make space
    while (
      this.cache.size >= this.config.maxCacheSize ||
      this.stats.memoryUsage + requiredSize > this.config.maxMemoryUsage
    ) {
      const evicted = this.evictItem();
      if (!evicted) break; // No more items to evict
    }
  }

  evictItem() {
    if (this.cache.size === 0) return false;
    
    let keyToEvict;
    
    switch (this.currentStrategy) {
      case this.cacheStrategies.LRU:
        keyToEvict = this.findLRUKey();
        break;
      case this.cacheStrategies.LFU:
        keyToEvict = this.findLFUKey();
        break;
      case this.cacheStrategies.TTL:
        keyToEvict = this.findExpiredKey() || this.findLRUKey();
        break;
      case this.cacheStrategies.FIFO:
        keyToEvict = this.cache.keys().next().value;
        break;
      default:
        keyToEvict = this.findLRUKey();
    }
    
    if (keyToEvict) {
      this.delete(keyToEvict);
      this.stats.evictions++;
      return true;
    }
    
    return false;
  }

  findLRUKey() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, metadata] of this.cacheMetadata.entries()) {
      if (metadata.lastAccessed < oldestTime) {
        oldestTime = metadata.lastAccessed;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  findLFUKey() {
    let leastUsedKey = null;
    let leastCount = Infinity;
    
    for (const [key, metadata] of this.cacheMetadata.entries()) {
      if (metadata.accessCount < leastCount) {
        leastCount = metadata.accessCount;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey;
  }

  findExpiredKey() {
    for (const [key, metadata] of this.cacheMetadata.entries()) {
      if (!this.isItemValid(metadata)) {
        return key;
      }
    }
    return null;
  }

  serializeValue(value) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn('Serialization error:', error);
      return String(value);
    }
  }

  calculateSize(value) {
    if (typeof value === 'string') {
      return new Blob([value]).size;
    }
    return JSON.stringify(value).length * 2; // Rough estimate
  }

  compressValue(value) {
    // Simple compression simulation (in real implementation, use actual compression)
    try {
      return {
        compressed: true,
        data: value,
        originalSize: this.calculateSize(value)
      };
    } catch (error) {
      console.warn('Compression error:', error);
      return value;
    }
  }

  decompressIfNeeded(value) {
    if (value && typeof value === 'object' && value.compressed) {
      return JSON.parse(value.data);
    }
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }

  updateMemoryUsage() {
    let totalSize = 0;
    
    for (const metadata of this.cacheMetadata.values()) {
      totalSize += metadata.size || 0;
    }
    
    this.stats.memoryUsage = totalSize;
  }

  matchesPattern(key, pattern) {
    if (typeof pattern === 'string') {
      return key.includes(pattern);
    }
    
    if (pattern instanceof RegExp) {
      return pattern.test(key);
    }
    
    return false;
  }

  matchesTags(itemTags, targetTags) {
    if (!Array.isArray(itemTags) || !Array.isArray(targetTags)) {
      return false;
    }
    
    return targetTags.some(tag => itemTags.includes(tag));
  }

  generateVersion() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getHitRatio() {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  notifySubscribers(key, eventType, data) {
    const callbacks = this.subscribers.get(eventType) || new Set();
    const allCallbacks = this.subscribers.get('*') || new Set();
    
    const event = { key, eventType, data, timestamp: Date.now() };
    
    [...callbacks, ...allCallbacks].forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  startCleanupInterval() {
    setInterval(() => {
      this.cleanupExpired();
      this.stats.lastCleanup = Date.now();
    }, this.config.cleanupInterval);
  }

  cleanupExpired() {
    const expiredKeys = [];
    
    for (const [key, metadata] of this.cacheMetadata.entries()) {
      if (!this.isItemValid(metadata)) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
    
    return expiredKeys.length;
  }

  optimizeMemory() {
    // Remove duplicate values
    const valueMap = new Map();
    const duplicates = [];
    
    for (const [key, value] of this.cache.entries()) {
      const serialized = JSON.stringify(value);
      if (valueMap.has(serialized)) {
        duplicates.push(key);
      } else {
        valueMap.set(serialized, key);
      }
    }
    
    duplicates.forEach(key => this.delete(key));
  }

  adjustStrategy() {
    const stats = this.getStats();
    
    // Switch to LFU if hit ratio is low
    if (stats.hitRatio < 0.5 && this.currentStrategy !== this.cacheStrategies.LFU) {
      this.currentStrategy = this.cacheStrategies.LFU;
      console.log('Switched to LFU caching strategy');
    }
    
    // Switch to TTL if memory usage is high
    if (stats.memoryUsagePercent > 80 && this.currentStrategy !== this.cacheStrategies.TTL) {
      this.currentStrategy = this.cacheStrategies.TTL;
      console.log('Switched to TTL caching strategy');
    }
  }

  compressLargeItems() {
    for (const [key, metadata] of this.cacheMetadata.entries()) {
      if (!metadata.compressed && metadata.size > this.config.compressionThreshold) {
        const value = this.cache.get(key);
        const compressed = this.compressValue(value);
        
        if (compressed !== value) {
          this.cache.set(key, compressed);
          metadata.compressed = true;
          this.stats.compressions++;
        }
      }
    }
  }

  initializePerformanceMonitoring() {
    // Monitor performance metrics
    if (typeof window !== 'undefined' && window.performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('cache')) {
            console.log('Cache performance:', entry);
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        // Performance observer not supported
      }
    }
  }

  /**
   * Blog-specific caching methods
   */

  // Cache blog posts with intelligent tagging
  async cacheBlogPost(post, options = {}) {
    const key = `blog:post:${post.id}`;
    const tags = [
      'blog',
      'post',
      `category:${post.category}`,
      `author:${post.author}`,
      ...(post.tags || []).map(tag => `tag:${tag}`)
    ];
    
    return this.set(key, post, {
      ...options,
      tags,
      ttl: 10 * 60 * 1000 // 10 minutes for blog posts
    });
  }

  // Cache blog list with pagination
  async cacheBlogList(posts, page = 1, filters = {}, options = {}) {
    const filterKey = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    
    const key = `blog:list:${page}:${filterKey}`;
    const tags = ['blog', 'list', `page:${page}`];
    
    return this.set(key, posts, {
      ...options,
      tags,
      ttl: 5 * 60 * 1000 // 5 minutes for lists
    });
  }

  // Invalidate blog-related cache
  invalidateBlogCache(type = 'all', identifier = null) {
    switch (type) {
      case 'post':
        return this.invalidateByPattern(`blog:post:${identifier}`);
      case 'category':
        return this.invalidateByTags([`category:${identifier}`]);
      case 'author':
        return this.invalidateByTags([`author:${identifier}`]);
      case 'tag':
        return this.invalidateByTags([`tag:${identifier}`]);
      case 'lists':
        return this.invalidateByTags(['list']);
      case 'all':
      default:
        return this.invalidateByTags(['blog']);
    }
  }

  // Warm up cache with popular content
  async warmUpBlogCache(apiService) {
    try {
      // Cache recent posts
      const recentPosts = await apiService.getBlogPosts({ limit: 10, sort: 'recent' });
      await this.cacheBlogList(recentPosts, 1, { sort: 'recent' });
      
      // Cache popular posts
      const popularPosts = await apiService.getBlogPosts({ limit: 10, sort: 'popular' });
      await this.cacheBlogList(popularPosts, 1, { sort: 'popular' });
      
      // Cache individual popular posts
      for (const post of popularPosts.slice(0, 5)) {
        await this.cacheBlogPost(post);
      }
      
      console.log('Blog cache warmed up successfully');
    } catch (error) {
      console.error('Cache warm-up error:', error);
    }
  }
}

const blogCachingService = new BlogCachingService();
export default blogCachingService;