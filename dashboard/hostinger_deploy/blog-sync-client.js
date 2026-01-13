/**
 * Blog Sync Client Script
 * Embed this script in your main website (devinquire.com) to receive real-time blog updates
 * from the dashboard application.
 * 
 * Usage:
 * <script src="https://dashboard.devinquire.com/blog-sync-client.js"></script>
 * <script>
 *   BlogSyncClient.initialize({
 *     dashboardUrl: 'https://dashboard.devinquire.com',
 *     onBlogUpdate: function(data) {
 *       // Handle blog updates
 *       console.log('Blog updated:', data);
 *     }
 *   });
 * </script>
 */

(function(window) {
  'use strict';

  // Blog Sync Client Class
  function BlogSyncClient() {
    this.isInitialized = false;
    this.dashboardUrl = null;
    this.dashboardOrigin = null;
    this.callbacks = {
      onBlogUpdate: null,
      onConnectionChange: null,
      onError: null
    };
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.heartbeatInterval = null;
    this.messageQueue = [];
    
    // Bind methods
    this.handleMessage = this.handleMessage.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  /**
   * Initialize the blog sync client
   * @param {Object} options - Configuration options
   * @param {string} options.dashboardUrl - URL of the dashboard application
   * @param {Function} options.onBlogUpdate - Callback for blog updates
   * @param {Function} options.onConnectionChange - Callback for connection status changes
   * @param {Function} options.onError - Callback for errors
   */
  BlogSyncClient.prototype.initialize = function(options) {
    if (this.isInitialized) {
      console.warn('BlogSyncClient already initialized');
      return;
    }

    // Validate options
    if (!options || !options.dashboardUrl) {
      throw new Error('dashboardUrl is required');
    }

    this.dashboardUrl = options.dashboardUrl;
    this.dashboardOrigin = new URL(this.dashboardUrl).origin;
    this.callbacks.onBlogUpdate = options.onBlogUpdate || null;
    this.callbacks.onConnectionChange = options.onConnectionChange || null;
    this.callbacks.onError = options.onError || null;

    // Set up event listeners
    this.setupEventListeners();

    // Start connection process
    this.connect();

    this.isInitialized = true;
    console.log('BlogSyncClient initialized with dashboard:', this.dashboardUrl);
  };

  /**
   * Set up event listeners
   */
  BlogSyncClient.prototype.setupEventListeners = function() {
    // Listen for messages from dashboard
    window.addEventListener('message', this.handleMessage);
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
  };

  /**
   * Handle incoming messages from dashboard
   */
  BlogSyncClient.prototype.handleMessage = function(event) {
    // Verify origin
    if (event.origin !== this.dashboardOrigin) {
      return;
    }

    const { type, data } = event.data;
    
    if (!type) {
      return;
    }

    console.log('Received message from dashboard:', { type, origin: event.origin });

    try {
      switch (type) {
        case 'BLOG_UPDATE':
          this.handleBlogUpdate(data);
          break;
          
        case 'PONG':
          this.handlePong(data);
          break;
          
        case 'DOMAIN_AVAILABLE':
          this.handleDomainAvailable(data);
          break;
          
        case 'SYNC_RESPONSE':
          this.handleSyncResponse(data);
          break;
          
        default:
          console.log('Unknown message type:', type);
      }
    } catch (error) {
      console.error('Error handling message from dashboard:', error);
      this.triggerCallback('onError', { type: 'message_handling_error', error: error.message });
    }
  };

  /**
   * Handle blog updates from dashboard
   */
  BlogSyncClient.prototype.handleBlogUpdate = function(data) {
    const { changeType, payload, timestamp } = data;
    
    console.log('Blog update received:', { changeType, timestamp });
    
    // Trigger callback if provided
    this.triggerCallback('onBlogUpdate', {
      type: changeType,
      data: payload,
      timestamp: timestamp
    });
    
    // Handle specific update types
    switch (changeType) {
      case 'BLOG_PUBLISHED':
        this.handleBlogPublished(payload);
        break;
        
      case 'BLOG_UPDATED':
        this.handleBlogUpdated(payload);
        break;
        
      case 'BLOG_DELETED':
        this.handleBlogDeleted(payload);
        break;
        
      case 'POSTS_SYNC':
        this.handlePostsSync(payload);
        break;
    }
  };

  /**
   * Handle new blog publication
   */
  BlogSyncClient.prototype.handleBlogPublished = function(blog) {
    console.log('New blog published:', blog.title);
    
    // Try to update blog list if it exists on the page
    this.updateBlogListDOM(blog, 'add');
    
    // Show notification if possible
    this.showNotification('New blog post published: ' + blog.title);
  };

  /**
   * Handle blog update
   */
  BlogSyncClient.prototype.handleBlogUpdated = function(blog) {
    console.log('Blog updated:', blog.title);
    
    // Try to update blog list if it exists on the page
    this.updateBlogListDOM(blog, 'update');
  };

  /**
   * Handle blog deletion
   */
  BlogSyncClient.prototype.handleBlogDeleted = function(data) {
    console.log('Blog deleted:', data.id);
    
    // Try to remove from blog list if it exists on the page
    this.updateBlogListDOM(data, 'remove');
  };

  /**
   * Handle full posts synchronization
   */
  BlogSyncClient.prototype.handlePostsSync = function(data) {
    console.log('Posts sync received:', data.posts?.length, 'posts');
    
    // Trigger callback for full sync
    this.triggerCallback('onBlogUpdate', {
      type: 'FULL_SYNC',
      data: data.posts,
      timestamp: Date.now()
    });
  };

  /**
   * Update blog list in DOM (if applicable)
   */
  BlogSyncClient.prototype.updateBlogListDOM = function(blog, action) {
    // This is a generic implementation - customize based on your website structure
    const blogContainer = document.querySelector('.blog-list, .posts-container, #blog-posts');
    
    if (!blogContainer) {
      return;
    }
    
    switch (action) {
      case 'add':
        // Add new blog post to the top of the list
        const newPostElement = this.createBlogPostElement(blog);
        if (newPostElement) {
          blogContainer.insertBefore(newPostElement, blogContainer.firstChild);
        }
        break;
        
      case 'update':
        // Update existing blog post
        const existingElement = blogContainer.querySelector(`[data-blog-id="${blog.id}"]`);
        if (existingElement) {
          const updatedElement = this.createBlogPostElement(blog);
          if (updatedElement) {
            existingElement.replaceWith(updatedElement);
          }
        }
        break;
        
      case 'remove':
        // Remove blog post
        const elementToRemove = blogContainer.querySelector(`[data-blog-id="${blog.id}"]`);
        if (elementToRemove) {
          elementToRemove.remove();
        }
        break;
    }
  };

  /**
   * Create blog post DOM element (customize based on your website structure)
   */
  BlogSyncClient.prototype.createBlogPostElement = function(blog) {
    // This is a basic implementation - customize based on your website's HTML structure
    const article = document.createElement('article');
    article.className = 'blog-post';
    article.setAttribute('data-blog-id', blog.id);
    
    article.innerHTML = `
      <h2><a href="/blog/${blog.slug || blog.id}">${this.escapeHtml(blog.title)}</a></h2>
      <p class="blog-excerpt">${this.escapeHtml(blog.excerpt || '')}</p>
      <div class="blog-meta">
        <span class="author">By ${this.escapeHtml(blog.author_name || 'Admin')}</span>
        <span class="date">${new Date(blog.published_at || blog.created_at).toLocaleDateString()}</span>
      </div>
    `;
    
    return article;
  };

  /**
   * Escape HTML to prevent XSS
   */
  BlogSyncClient.prototype.escapeHtml = function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  /**
   * Show notification (if browser supports it)
   */
  BlogSyncClient.prototype.showNotification = function(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DevInquire Blog Update', {
        body: message,
        icon: '/favicon.ico'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
          new Notification('DevInquire Blog Update', {
            body: message,
            icon: '/favicon.ico'
          });
        }
      });
    }
  };

  /**
   * Connect to dashboard
   */
  BlogSyncClient.prototype.connect = function() {
    console.log('Attempting to connect to dashboard...');
    
    // Send ping to dashboard
    this.sendMessage({
      type: 'PING',
      data: {
        timestamp: Date.now(),
        origin: window.location.origin
      }
    });
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Set connection timeout
    setTimeout(() => {
      if (!this.isConnected) {
        this.handleConnectionTimeout();
      }
    }, 5000);
  };

  /**
   * Send message to dashboard
   */
  BlogSyncClient.prototype.sendMessage = function(message) {
    if (!this.dashboardOrigin) {
      console.warn('Dashboard origin not set');
      return;
    }
    
    try {
      // Try to send to dashboard iframe if it exists
      const dashboardFrame = document.querySelector('iframe[src*="dashboard"]');
      if (dashboardFrame && dashboardFrame.contentWindow) {
        dashboardFrame.contentWindow.postMessage(message, this.dashboardOrigin);
        return;
      }
      
      // Try to send to opener window
      if (window.opener) {
        window.opener.postMessage(message, this.dashboardOrigin);
        return;
      }
      
      // Try to send to parent window
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, this.dashboardOrigin);
        return;
      }
      
      console.log('No direct connection to dashboard found');
    } catch (error) {
      console.error('Error sending message to dashboard:', error);
    }
  };

  /**
   * Start heartbeat to maintain connection
   */
  BlogSyncClient.prototype.startHeartbeat = function() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: 'PING',
          data: { timestamp: Date.now() }
        });
      }
    }, 30000); // Send ping every 30 seconds
  };

  /**
   * Handle pong response from dashboard
   */
  BlogSyncClient.prototype.handlePong = function(data) {
    if (!this.isConnected) {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('Connected to dashboard successfully');
      this.triggerCallback('onConnectionChange', { connected: true, data });
    }
  };

  /**
   * Handle domain available announcement
   */
  BlogSyncClient.prototype.handleDomainAvailable = function(data) {
    console.log('Dashboard announced availability:', data);
    
    if (!this.isConnected) {
      // Respond with ping
      this.sendMessage({
        type: 'PING',
        data: {
          timestamp: Date.now(),
          origin: window.location.origin
        }
      });
    }
  };

  /**
   * Handle connection timeout
   */
  BlogSyncClient.prototype.handleConnectionTimeout = function() {
    console.log('Connection to dashboard timed out');
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.triggerCallback('onError', { type: 'connection_failed', message: 'Could not connect to dashboard' });
    }
  };

  /**
   * Handle page visibility changes
   */
  BlogSyncClient.prototype.handleVisibilityChange = function() {
    if (!document.hidden && this.isInitialized) {
      // Page became visible, try to reconnect if needed
      if (!this.isConnected) {
        this.connect();
      }
    }
  };

  /**
   * Handle online/offline status changes
   */
  BlogSyncClient.prototype.handleOnlineStatusChange = function() {
    if (navigator.onLine && !this.isConnected) {
      console.log('Back online - attempting to reconnect');
      this.connect();
    } else if (!navigator.onLine) {
      console.log('Gone offline');
      this.isConnected = false;
      this.triggerCallback('onConnectionChange', { connected: false, reason: 'offline' });
    }
  };

  /**
   * Trigger callback if it exists
   */
  BlogSyncClient.prototype.triggerCallback = function(callbackName, data) {
    if (typeof this.callbacks[callbackName] === 'function') {
      try {
        this.callbacks[callbackName](data);
      } catch (error) {
        console.error(`Error in ${callbackName} callback:`, error);
      }
    }
  };

  /**
   * Request specific data from dashboard
   */
  BlogSyncClient.prototype.requestData = function(type, params) {
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    this.sendMessage({
      type: 'SYNC_REQUEST',
      requestId: requestId,
      data: {
        type: type,
        params: params || {}
      }
    });
    
    return requestId;
  };

  /**
   * Handle sync response from dashboard
   */
  BlogSyncClient.prototype.handleSyncResponse = function(data) {
    console.log('Sync response received:', data);
    // Handle sync response - could trigger callbacks or update local state
  };

  /**
   * Disconnect from dashboard
   */
  BlogSyncClient.prototype.disconnect = function() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    window.removeEventListener('message', this.handleMessage);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('online', this.handleOnlineStatusChange);
    window.removeEventListener('offline', this.handleOnlineStatusChange);
    
    this.isConnected = false;
    this.isInitialized = false;
    
    console.log('BlogSyncClient disconnected');
  };

  /**
   * Get connection status
   */
  BlogSyncClient.prototype.getStatus = function() {
    return {
      initialized: this.isInitialized,
      connected: this.isConnected,
      dashboardUrl: this.dashboardUrl,
      reconnectAttempts: this.reconnectAttempts
    };
  };

  // Create global instance
  window.BlogSyncClient = new BlogSyncClient();

})(window);