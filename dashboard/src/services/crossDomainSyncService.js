/**
 * Cross-Domain Synchronization Service
 * Handles real-time synchronization between dashboard and main website
 * Uses postMessage API for secure cross-origin communication
 * Integrates with Firebase for real-time data updates
 */

import { onSnapshot, collection, doc, query, where, orderBy } from 'firebase/firestore';
import { getDatabase, isDatabaseReady, waitForFirebaseInit } from '../config/firebase';
import realTimeService from './realTimeService';
import authMiddleware from './authMiddleware';

class CrossDomainSyncService {
  constructor() {
    this.isInitialized = false;
    this.allowedOrigins = [
      'https://devinquire.com',
      'https://www.devinquire.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3006'
    ];
    this.messageHandlers = new Map();
    this.firebaseListeners = new Map();
    this.connectedDomains = new Set();
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    
    // Bind methods
    this.handleMessage = this.handleMessage.bind(this);
    this.handleOnlineStatus = this.handleOnlineStatus.bind(this);
    
    // Initialize event listeners
    this.initializeEventListeners();
  }

  /**
   * Initialize the cross-domain sync service
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('CrossDomainSyncService already initialized');
      return;
    }

    try {
      // Wait for Firebase to be ready
      await waitForFirebaseInit();
      
      if (!isDatabaseReady()) {
        throw new Error('Firebase database not ready');
      }
      
      // Set up Firebase real-time listeners
      await this.setupFirebaseListeners();
      
      // Set up real-time service integration
      this.setupRealTimeServiceIntegration();
      
      // Announce availability to other domains
      this.announceAvailability();
      
      this.isInitialized = true;
      console.log('CrossDomainSyncService initialized successfully');
      
      // Process any queued sync operations
      this.processQueuedOperations();
      
    } catch (error) {
      console.error('Failed to initialize CrossDomainSyncService:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for cross-domain communication
   */
  initializeEventListeners() {
    // Listen for postMessage events
    window.addEventListener('message', this.handleMessage);
    
    // Listen for online/offline status
    window.addEventListener('online', this.handleOnlineStatus);
    window.addEventListener('offline', this.handleOnlineStatus);
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isInitialized) {
        this.announceAvailability();
      }
    });
  }

  /**
   * Handle incoming postMessage events
   */
  handleMessage(event) {
    // Verify origin
    if (!this.isAllowedOrigin(event.origin)) {
      console.warn('Rejected message from unauthorized origin:', event.origin);
      return;
    }

    const { type, data, requestId } = event.data;
    
    if (!type) {
      console.warn('Received message without type:', event.data);
      return;
    }

    console.log('Received cross-domain message:', { type, origin: event.origin });

    try {
      switch (type) {
        case 'SYNC_REQUEST':
          this.handleSyncRequest(event.source, event.origin, data, requestId);
          break;
          
        case 'SYNC_RESPONSE':
          this.handleSyncResponse(data, requestId);
          break;
          
        case 'BLOG_UPDATE':
          this.handleBlogUpdate(data);
          break;
          
        case 'PING':
          this.handlePing(event.source, event.origin, requestId);
          break;
          
        case 'PONG':
          this.handlePong(event.origin, data);
          break;
          
        case 'DOMAIN_AVAILABLE':
          this.handleDomainAvailable(event.origin, data);
          break;
          
        default:
          console.warn('Unknown message type:', type);
      }
    } catch (error) {
      console.error('Error handling cross-domain message:', error);
      this.sendErrorResponse(event.source, event.origin, requestId, error.message);
    }
  }

  /**
   * Handle online/offline status changes
   */
  handleOnlineStatus() {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;
    
    if (!wasOnline && this.isOnline) {
      console.log('Back online - processing queued sync operations');
      this.processQueuedOperations();
      this.announceAvailability();
    } else if (wasOnline && !this.isOnline) {
      console.log('Gone offline - queuing sync operations');
    }
  }

  /**
   * Set up Firebase real-time listeners for blog posts
   */
  async setupFirebaseListeners() {
    try {
      const db = getDatabase();
      
      // Listen to published blog posts
      const publishedPostsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        orderBy('published_at', 'desc')
      );
      
      const unsubscribePublished = onSnapshot(publishedPostsQuery, (snapshot) => {
        const changes = snapshot.docChanges();
        
        changes.forEach((change) => {
          const post = { id: change.doc.id, ...change.doc.data() };
          
          switch (change.type) {
            case 'added':
              this.broadcastBlogChange('BLOG_PUBLISHED', post);
              break;
            case 'modified':
              this.broadcastBlogChange('BLOG_UPDATED', post);
              break;
            case 'removed':
              this.broadcastBlogChange('BLOG_DELETED', { id: post.id });
              break;
          }
        });
      }, (error) => {
        console.error('Error in published posts listener:', error);
      });
      
      this.firebaseListeners.set('publishedPosts', unsubscribePublished);
      
      // Listen to all posts for dashboard sync
      const allPostsQuery = query(
        collection(db, 'posts'),
        orderBy('updated_at', 'desc')
      );
      
      const unsubscribeAll = onSnapshot(allPostsQuery, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        this.broadcastBlogChange('POSTS_SYNC', { posts });
      }, (error) => {
        console.error('Error in all posts listener:', error);
      });
      
      this.firebaseListeners.set('allPosts', unsubscribeAll);
      
    } catch (error) {
      console.error('Error setting up Firebase listeners:', error);
      throw error;
    }
  }

  /**
   * Set up integration with existing real-time service
   */
  setupRealTimeServiceIntegration() {
    // Listen to real-time service events and broadcast them
    realTimeService.onBlogCreated((blog) => {
      this.broadcastBlogChange('BLOG_CREATED', blog);
    });
    
    realTimeService.onBlogUpdated((blog) => {
      this.broadcastBlogChange('BLOG_UPDATED', blog);
    });
    
    realTimeService.onBlogDeleted((data) => {
      this.broadcastBlogChange('BLOG_DELETED', data);
    });
    
    realTimeService.onBlogPublished((blog) => {
      this.broadcastBlogChange('BLOG_PUBLISHED', blog);
    });
  }

  /**
   * Broadcast blog changes to all connected domains
   */
  broadcastBlogChange(type, data) {
    const message = {
      type: 'BLOG_UPDATE',
      data: {
        changeType: type,
        payload: data,
        timestamp: Date.now(),
        source: 'dashboard'
      }
    };
    
    this.broadcastToAllDomains(message);
  }

  /**
   * Broadcast message to all connected domains
   */
  broadcastToAllDomains(message) {
    if (!this.isOnline) {
      this.syncQueue.push({ type: 'broadcast', message });
      return;
    }
    
    this.allowedOrigins.forEach(origin => {
      try {
        // Try to send to all possible windows/frames
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(message, origin);
        }
        
        // Send to opener if exists
        if (window.opener) {
          window.opener.postMessage(message, origin);
        }
        
        // Send to all frames
        for (let i = 0; i < window.frames.length; i++) {
          try {
            window.frames[i].postMessage(message, origin);
          } catch (e) {
            // Frame might not be accessible
          }
        }
      } catch (error) {
        // Origin might not be reachable
      }
    });
  }

  /**
   * Handle sync request from another domain
   */
  async handleSyncRequest(source, origin, data, requestId) {
    try {
      const { type: syncType, params } = data;
      
      let responseData = null;
      
      switch (syncType) {
        case 'GET_PUBLISHED_POSTS':
          responseData = await this.getPublishedPosts(params);
          break;
          
        case 'GET_POST_BY_ID':
          responseData = await this.getPostById(params.id);
          break;
          
        case 'GET_POSTS_BY_CATEGORY':
          responseData = await this.getPostsByCategory(params.category);
          break;
          
        default:
          throw new Error(`Unknown sync type: ${syncType}`);
      }
      
      this.sendResponse(source, origin, requestId, responseData);
      
    } catch (error) {
      console.error('Error handling sync request:', error);
      this.sendErrorResponse(source, origin, requestId, error.message);
    }
  }

  /**
   * Send response to sync request
   */
  sendResponse(target, origin, requestId, data) {
    const message = {
      type: 'SYNC_RESPONSE',
      requestId,
      data,
      success: true
    };
    
    target.postMessage(message, origin);
  }

  /**
   * Send error response
   */
  sendErrorResponse(target, origin, requestId, error) {
    const message = {
      type: 'SYNC_RESPONSE',
      requestId,
      error,
      success: false
    };
    
    target.postMessage(message, origin);
  }

  /**
   * Handle ping from another domain
   */
  handlePing(source, origin, requestId) {
    const pongMessage = {
      type: 'PONG',
      requestId,
      data: {
        timestamp: Date.now(),
        service: 'CrossDomainSyncService',
        version: '1.0.0',
        capabilities: ['blog-sync', 'real-time-updates']
      }
    };
    
    source.postMessage(pongMessage, origin);
  }

  /**
   * Announce availability to other domains
   */
  announceAvailability() {
    const announcement = {
      type: 'DOMAIN_AVAILABLE',
      data: {
        service: 'CrossDomainSyncService',
        timestamp: Date.now(),
        capabilities: ['blog-sync', 'real-time-updates'],
        authenticated: authMiddleware.isAuthenticated()
      }
    };
    
    this.broadcastToAllDomains(announcement);
  }

  /**
   * Check if origin is allowed
   */
  isAllowedOrigin(origin) {
    return this.allowedOrigins.includes(origin) || 
           origin.startsWith('http://localhost:') ||
           origin.startsWith('https://localhost:');
  }

  /**
   * Process queued operations when back online
   */
  processQueuedOperations() {
    while (this.syncQueue.length > 0) {
      const operation = this.syncQueue.shift();
      
      if (operation.type === 'broadcast') {
        this.broadcastToAllDomains(operation.message);
      }
    }
  }

  /**
   * Get published posts for sync
   */
  async getPublishedPosts(params = {}) {
    // This would typically fetch from your content service
    // For now, return a placeholder
    return {
      posts: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || 10
    };
  }

  /**
   * Get post by ID for sync
   */
  async getPostById(id) {
    // This would typically fetch from your content service
    return null;
  }

  /**
   * Get posts by category for sync
   */
  async getPostsByCategory(category) {
    // This would typically fetch from your content service
    return {
      posts: [],
      category,
      total: 0
    };
  }

  /**
   * Cleanup and disconnect
   */
  disconnect() {
    // Remove event listeners
    window.removeEventListener('message', this.handleMessage);
    window.removeEventListener('online', this.handleOnlineStatus);
    window.removeEventListener('offline', this.handleOnlineStatus);
    
    // Unsubscribe from Firebase listeners
    this.firebaseListeners.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.firebaseListeners.clear();
    
    // Clear state
    this.connectedDomains.clear();
    this.syncQueue = [];
    this.isInitialized = false;
    
    console.log('CrossDomainSyncService disconnected');
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      online: this.isOnline,
      connectedDomains: Array.from(this.connectedDomains),
      queuedOperations: this.syncQueue.length,
      firebaseListeners: this.firebaseListeners.size,
      allowedOrigins: this.allowedOrigins
    };
  }
}

// Create singleton instance
const crossDomainSyncService = new CrossDomainSyncService();

// Auto-initialize when service is imported
if (typeof window !== 'undefined') {
  // Initialize after a short delay to allow app to initialize
  setTimeout(() => {
    crossDomainSyncService.initialize().catch(error => {
      console.error('Failed to auto-initialize CrossDomainSyncService:', error);
    });
  }, 2000);
}

export default crossDomainSyncService;