/**
 * Real-time service for blog system with WebSocket communication
 * Handles live updates, data synchronization, and event broadcasting
 * Now includes authentication context for secure operations
 */

import authMiddleware from "./authMiddleware";

class RealTimeService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.subscribers = new Map();
    this.messageQueue = [];
    this.heartbeatInterval = null;
    this.connectionId = null;
  }

  /**
   * Initialize WebSocket connection with authentication
   */
  async connect(userId = null) {
    // Get authenticated user if not provided
    if (!userId && authMiddleware.isAuthenticated()) {
      const currentUser = authMiddleware.getCurrentUser();
      userId = currentUser?.id;
    }
    try {
      // Use WebSocket for real-time communication
      // In production, this would connect to a WebSocket server
      const wsUrl =
        process.env.NODE_ENV === "development"
          ? "ws://localhost:8080/ws"
          : "wss://devinquire.com/ws";

      // For demo purposes, we'll simulate WebSocket with EventSource-like behavior
      this.simulateWebSocket(userId);
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      this.handleConnectionError();
    }
  }

  /**
   * Simulate WebSocket functionality for demo
   */
  simulateWebSocket(userId) {
    // Simulate connection success
    setTimeout(() => {
      this.isConnected = true;
      this.connectionId = `conn_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      this.reconnectAttempts = 0;

      console.log("Real-time service connected:", this.connectionId);

      // Start heartbeat
      this.startHeartbeat();

      // Notify subscribers of connection
      this.notifySubscribers("connection", {
        status: "connected",
        connectionId: this.connectionId,
        userId,
      });

      // Process queued messages
      this.processMessageQueue();
    }, 500);
  }

  /**
   * Start heartbeat to maintain connection
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        // In real implementation, send ping to server
        this.notifySubscribers("heartbeat", { timestamp: Date.now() });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle connection errors and implement reconnection logic
   */
  handleConnectionError() {
    this.isConnected = false;
    this.stopHeartbeat();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(
        `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
      );

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error("Max reconnection attempts reached");
      this.notifySubscribers("connection", {
        status: "failed",
        error: "Max reconnection attempts reached",
      });
    }
  }

  /**
   * Subscribe to real-time events
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventSubscribers = this.subscribers.get(event);
      if (eventSubscribers) {
        eventSubscribers.delete(callback);
      }
    };
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(event, callback = null) {
    if (callback) {
      const eventSubscribers = this.subscribers.get(event);
      if (eventSubscribers) {
        eventSubscribers.delete(callback);
      }
    } else {
      this.subscribers.delete(event);
    }
  }

  /**
   * Notify all subscribers of an event
   */
  notifySubscribers(event, data) {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in subscriber callback:", error);
        }
      });
    }
  }

  /**
   * Send message to server with authentication context
   */
  send(event, data) {
    // Add authentication context to message
    const authContext = authMiddleware.isAuthenticated()
      ? {
          userId: authMiddleware.getCurrentUser()?.id,
          userRole: authMiddleware.getCurrentUser()?.role,
          token: authMiddleware.getCurrentToken(),
        }
      : null;

    const message = {
      event,
      data,
      timestamp: Date.now(),
      connectionId: this.connectionId,
      auth: authContext,
    };

    if (this.isConnected) {
      // In real implementation, send via WebSocket
      this.simulateServerResponse(message);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  /**
   * Simulate server responses for demo
   */
  simulateServerResponse(message) {
    setTimeout(() => {
      switch (message.event) {
        case "blog:created":
        case "blog:updated":
        case "blog:deleted":
        case "blog:published":
          // Broadcast to all subscribers
          this.notifySubscribers(message.event, {
            ...message.data,
            timestamp: Date.now(),
            source: "server",
          });
          break;

        case "blog:draft_saved":
          // Acknowledge draft save
          this.notifySubscribers("blog:draft_acknowledged", {
            id: message.data.id,
            timestamp: Date.now(),
          });
          break;

        default:
          console.log("Unknown event:", message.event);
      }
    }, 100 + Math.random() * 200); // Simulate network delay
  }

  /**
   * Process queued messages when connection is restored
   */
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message.event, message.data);
    }
  }

  /**
   * Blog-specific methods
   */

  // Broadcast blog creation with authorization check
  broadcastBlogCreated(blog) {
    if (authMiddleware.canCreateBlog()) {
      const enrichedBlog = {
        ...blog,
        author_id: authMiddleware.getCurrentUser()?.id,
        author_name: authMiddleware.getCurrentUser()?.displayName,
        created_by_authenticated_user: true,
      };
      this.send("blog:created", enrichedBlog);
    } else {
      console.warn("User not authorized to broadcast blog creation");
    }
  }

  // Broadcast blog update with authorization check
  broadcastBlogUpdated(blog) {
    if (authMiddleware.canUpdateBlog(blog.id, blog.author_id)) {
      const enrichedBlog = {
        ...blog,
        modified_by: authMiddleware.getCurrentUser()?.displayName,
        modified_by_authenticated_user: true,
      };
      this.send("blog:updated", enrichedBlog);
    } else {
      console.warn("User not authorized to broadcast blog update");
    }
  }

  // Broadcast blog deletion with authorization check
  broadcastBlogDeleted(blogId, blogData = {}) {
    if (authMiddleware.canDeleteBlog(blogId, blogData.author_id)) {
      this.send("blog:deleted", {
        id: blogId,
        deleted_by: authMiddleware.getCurrentUser()?.displayName,
        deleted_by_authenticated_user: true,
      });
    } else {
      console.warn("User not authorized to broadcast blog deletion");
    }
  }

  // Broadcast blog publication with authorization check
  broadcastBlogPublished(blog) {
    if (authMiddleware.canPublishBlog(blog.id, blog.author_id)) {
      const enrichedBlog = {
        ...blog,
        published_by: authMiddleware.getCurrentUser()?.displayName,
        published_by_authenticated_user: true,
      };
      this.send("blog:published", enrichedBlog);
    } else {
      console.warn("User not authorized to broadcast blog publication");
    }
  }

  // Save draft with real-time sync and authorization
  saveDraft(blog) {
    if (
      authMiddleware.canCreateBlog() ||
      authMiddleware.canUpdateBlog(blog.id, blog.author_id)
    ) {
      const enrichedBlog = {
        ...blog,
        draft_saved_by: authMiddleware.getCurrentUser()?.displayName,
        author_id: blog.author_id || authMiddleware.getCurrentUser()?.id,
      };
      this.send("blog:draft_saved", enrichedBlog);
    } else {
      console.warn("User not authorized to save draft");
    }
  }

  // Subscribe to blog events
  onBlogCreated(callback) {
    return this.subscribe("blog:created", callback);
  }

  onBlogUpdated(callback) {
    return this.subscribe("blog:updated", callback);
  }

  onBlogDeleted(callback) {
    return this.subscribe("blog:deleted", callback);
  }

  onBlogPublished(callback) {
    return this.subscribe("blog:published", callback);
  }

  onDraftSaved(callback) {
    return this.subscribe("blog:draft_saved", callback);
  }

  onDraftAcknowledged(callback) {
    return this.subscribe("blog:draft_acknowledged", callback);
  }

  /**
   * Connection status methods
   */

  isConnectionActive() {
    return this.isConnected;
  }

  getConnectionId() {
    return this.connectionId;
  }

  onConnectionChange(callback) {
    return this.subscribe("connection", callback);
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    this.isConnected = false;
    this.stopHeartbeat();
    this.subscribers.clear();
    this.messageQueue = [];

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log("Real-time service disconnected");
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      connected: this.isConnected,
      connectionId: this.connectionId,
      subscribersCount: Array.from(this.subscribers.values()).reduce(
        (total, set) => total + set.size,
        0
      ),
      queuedMessages: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create singleton instance
const realTimeService = new RealTimeService();

// Auto-connect when service is imported
if (typeof window !== "undefined") {
  // Connect after a short delay to allow app to initialize
  setTimeout(() => {
    realTimeService.connect();
  }, 1000);
}

export default realTimeService;
