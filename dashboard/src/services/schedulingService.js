/**
 * Scheduling Service
 * Handles scheduled blog post publishing and workflow automation
 */

import { doc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getDatabase, isDatabaseReady, waitForFirebaseInit } from '../config/firebase';
import enhancedApiService from './enhancedApiService';
import realTimeService from './realTimeService';

class SchedulingService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 60000; // Check every minute
    this.intervalId = null;
    this.scheduledPosts = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    
    // Bind methods
    this.checkScheduledPosts = this.checkScheduledPosts.bind(this);
    this.publishScheduledPost = this.publishScheduledPost.bind(this);
  }

  /**
   * Start the scheduling service
   */
  async start() {
    if (this.isRunning) {
      console.warn('SchedulingService is already running');
      return;
    }

    try {
      console.log('Starting SchedulingService...');
      
      // Wait for Firebase to be ready
      await waitForFirebaseInit();
      
      if (!isDatabaseReady()) {
        throw new Error('Firebase database not ready');
      }
      
      this.isRunning = true;
      
      // Initial check
      await this.checkScheduledPosts();
      
      // Set up interval for regular checks
      this.intervalId = setInterval(this.checkScheduledPosts, this.checkInterval);
      
      // Load existing scheduled posts
      await this.loadScheduledPosts();
      
      console.log('SchedulingService started successfully');
    } catch (error) {
      console.error('Failed to start SchedulingService:', error);
      this.isRunning = false;
    }
  }

  /**
   * Stop the scheduling service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping SchedulingService...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.scheduledPosts.clear();
    this.retryAttempts.clear();
  }

  /**
   * Load scheduled posts from database
   */
  async loadScheduledPosts() {
    try {
      const db = getDatabase();
      
      const scheduledQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'scheduled'),
        orderBy('scheduled_at', 'asc')
      );
      
      const snapshot = await getDocs(scheduledQuery);
      
      snapshot.forEach(doc => {
        const post = { id: doc.id, ...doc.data() };
        if (post.scheduled_at) {
          this.scheduledPosts.set(post.id, {
            ...post,
            scheduledTime: new Date(post.scheduled_at)
          });
        }
      });
      
      console.log(`Loaded ${this.scheduledPosts.size} scheduled posts`);
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
    }
  }

  /**
   * Check for posts that need to be published
   */
  async checkScheduledPosts() {
    if (!this.isRunning) return;
    
    const now = new Date();
    const postsToPublish = [];
    
    // Check in-memory scheduled posts
    for (const [postId, post] of this.scheduledPosts.entries()) {
      if (post.scheduledTime <= now) {
        postsToPublish.push(post);
      }
    }
    
    // Also check database for any missed posts
    try {
      const db = getDatabase();
      
      const overdueQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'scheduled'),
        where('scheduled_at', '<=', now.toISOString()),
        orderBy('scheduled_at', 'asc'),
        limit(10)
      );
      
      const snapshot = await getDocs(overdueQuery);
      
      snapshot.forEach(doc => {
        const post = { id: doc.id, ...doc.data() };
        if (!postsToPublish.find(p => p.id === post.id)) {
          postsToPublish.push({
            ...post,
            scheduledTime: new Date(post.scheduled_at)
          });
        }
      });
    } catch (error) {
      console.error('Failed to check overdue scheduled posts:', error);
    }
    
    // Publish posts that are due
    for (const post of postsToPublish) {
      await this.publishScheduledPost(post);
    }
  }

  /**
   * Publish a scheduled post
   */
  async publishScheduledPost(post) {
    const postId = post.id;
    
    try {
      console.log(`Publishing scheduled post: ${post.title}`);
      
      // Validate post before publishing
      const validation = this.validatePostForPublishing(post);
      if (!validation.valid) {
        throw new Error(`Post validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Update post status to published
      const updateData = {
        status: 'published',
        published_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        scheduled_at: null, // Clear scheduled time
        workflow_history: [
          ...(post.workflow_history || []),
          {
            status: 'published',
            timestamp: new Date().toISOString(),
            user: 'System (Scheduled)',
            action: 'Automatically published from scheduled status'
          }
        ]
      };
      
      // Update in database
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, updateData);
      
      // Remove from scheduled posts
      this.scheduledPosts.delete(postId);
      this.retryAttempts.delete(postId);
      
      // Broadcast the publication
      if (realTimeService.isConnected()) {
        realTimeService.broadcastBlogPublished({
          ...post,
          ...updateData
        });
      }
      
      // Send notifications if enabled
      await this.sendPublicationNotifications({
        ...post,
        ...updateData
      });
      
      console.log(`Successfully published scheduled post: ${post.title}`);
      
      // Analytics tracking
      if (window.gtag) {
        window.gtag('event', 'scheduled_post_published', {
          'event_category': 'Blog Management',
          'event_label': post.category || 'uncategorized'
        });
      }
      
    } catch (error) {
      console.error(`Failed to publish scheduled post ${postId}:`, error);
      
      // Handle retry logic
      const retryCount = this.retryAttempts.get(postId) || 0;
      
      if (retryCount < this.maxRetries) {
        this.retryAttempts.set(postId, retryCount + 1);
        console.log(`Will retry publishing post ${postId} (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        // Retry after exponential backoff
        setTimeout(() => {
          this.publishScheduledPost(post);
        }, Math.pow(2, retryCount) * 60000); // 1min, 2min, 4min delays
        
      } else {
        // Max retries reached, mark as failed
        console.error(`Max retries reached for post ${postId}, marking as failed`);
        
        try {
          const db = getDatabase();
          const postRef = doc(db, 'posts', postId);
          await updateDoc(postRef, {
            status: 'draft',
            last_modified: new Date().toISOString(),
            scheduling_error: {
              message: error.message,
              timestamp: new Date().toISOString(),
              retryCount: retryCount
            },
            workflow_history: [
              ...(post.workflow_history || []),
              {
                status: 'draft',
                timestamp: new Date().toISOString(),
                user: 'System',
                action: `Failed to publish automatically: ${error.message}`
              }
            ]
          });
          
          // Remove from scheduled posts and retry attempts
          this.scheduledPosts.delete(postId);
          this.retryAttempts.delete(postId);
          
          // Send error notification
          await this.sendErrorNotification(post, error);
          
        } catch (updateError) {
          console.error('Failed to update post after scheduling failure:', updateError);
        }
      }
    }
  }

  /**
   * Validate post before publishing
   */
  validatePostForPublishing(post) {
    const errors = [];
    
    if (!post.title?.trim() || post.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters');
    }
    
    if (!post.content?.trim() || post.content.trim().length < 100) {
      errors.push('Content must be at least 100 characters');
    }
    
    if (!post.excerpt?.trim() || post.excerpt.trim().length < 10) {
      errors.push('Excerpt must be at least 10 characters');
    }
    
    if (!post.category?.trim()) {
      errors.push('Category is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Schedule a post for future publication
   */
  async schedulePost(postId, scheduledTime, options = {}) {
    try {
      const scheduledAt = new Date(scheduledTime);
      const now = new Date();
      
      if (scheduledAt <= now) {
        throw new Error('Scheduled time must be in the future');
      }
      
      // Update post in database
      const postRef = doc(db, 'posts', postId);
      const updateData = {
        status: 'scheduled',
        scheduled_at: scheduledAt.toISOString(),
        last_modified: now.toISOString(),
        scheduling_options: {
          notifySubscribers: options.notifySubscribers !== false,
          socialMediaShare: options.socialMediaShare === true,
          seoOptimization: options.seoOptimization !== false,
          ...options
        },
        workflow_history: [
          ...(options.workflowHistory || []),
          {
            status: 'scheduled',
            timestamp: now.toISOString(),
            user: options.user || 'System',
            action: `Scheduled for publication at ${scheduledAt.toLocaleString()}`
          }
        ]
      };
      
      await updateDoc(postRef, updateData);
      
      // Add to in-memory scheduled posts
      const post = await enhancedApiService.getPost(postId);
      if (post) {
        this.scheduledPosts.set(postId, {
          ...post,
          ...updateData,
          scheduledTime: scheduledAt
        });
      }
      
      console.log(`Post ${postId} scheduled for ${scheduledAt.toLocaleString()}`);
      
      return {
        success: true,
        scheduledAt: scheduledAt.toISOString()
      };
      
    } catch (error) {
      console.error('Failed to schedule post:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled publication
   */
  async cancelScheduledPost(postId) {
    try {
      const db = getDatabase();
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        status: 'draft',
        scheduled_at: null,
        last_modified: new Date().toISOString(),
        workflow_history: [
          {
            status: 'draft',
            timestamp: new Date().toISOString(),
            user: 'User',
            action: 'Cancelled scheduled publication'
          }
        ]
      });
      
      // Remove from scheduled posts
      this.scheduledPosts.delete(postId);
      this.retryAttempts.delete(postId);
      
      console.log(`Cancelled scheduled publication for post ${postId}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('Failed to cancel scheduled post:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled posts
   */
  getScheduledPosts() {
    return Array.from(this.scheduledPosts.values())
      .sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  /**
   * Get next scheduled post
   */
  getNextScheduledPost() {
    const scheduled = this.getScheduledPosts();
    return scheduled.length > 0 ? scheduled[0] : null;
  }

  /**
   * Send publication notifications
   */
  async sendPublicationNotifications(post) {
    try {
      const options = post.scheduling_options || {};
      
      // Send email notifications to subscribers
      if (options.notifySubscribers) {
        // Implementation would depend on your email service
        console.log('Sending subscriber notifications for:', post.title);
      }
      
      // Share on social media
      if (options.socialMediaShare) {
        // Implementation would depend on your social media integration
        console.log('Sharing on social media:', post.title);
      }
      
      // Send webhook notifications
      if (options.webhookUrl) {
        try {
          await fetch(options.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              event: 'post_published',
              post: {
                id: post.id,
                title: post.title,
                url: `${window.location.origin}/blog/${post.slug || post.id}`,
                published_at: post.published_at
              }
            })
          });
        } catch (webhookError) {
          console.error('Failed to send webhook notification:', webhookError);
        }
      }
      
    } catch (error) {
      console.error('Failed to send publication notifications:', error);
    }
  }

  /**
   * Send error notification
   */
  async sendErrorNotification(post, error) {
    try {
      // Log error for monitoring
      console.error('Scheduling error notification:', {
        postId: post.id,
        title: post.title,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Send to error tracking service if available
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          tags: {
            component: 'SchedulingService',
            postId: post.id
          },
          extra: {
            postTitle: post.title,
            scheduledAt: post.scheduled_at
          }
        });
      }
      
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      scheduledPostsCount: this.scheduledPosts.size,
      retryAttemptsCount: this.retryAttempts.size,
      checkInterval: this.checkInterval,
      nextCheck: this.intervalId ? new Date(Date.now() + this.checkInterval) : null,
      nextScheduledPost: this.getNextScheduledPost()
    };
  }
}

// Create singleton instance
const schedulingService = new SchedulingService();

// Auto-start the service
if (typeof window !== 'undefined') {
  // Start after a short delay to allow app initialization
  setTimeout(() => {
    schedulingService.start();
  }, 5000);
  
  // Stop service when page unloads
  window.addEventListener('beforeunload', () => {
    schedulingService.stop();
  });
}

export default schedulingService;