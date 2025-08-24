import { 
  ref, 
  push, 
  set, 
  get, 
  onValue, 
  off, 
  remove, 
  serverTimestamp,
  onDisconnect,
  query,
  orderByChild,
  limitToLast,
  startAt,
  endAt
} from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import enhancedAuth from './enhancedAuth';

class RealtimeService {
  constructor() {
    this.listeners = new Map();
    this.presenceRef = null;
    
    // Setup presence system
    this.setupPresence();
  }

  // Comments System
  async addComment(postId, commentData) {
    try {
      const user = enhancedAuth.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to comment');
      }

      // Validate comment
      if (!commentData.content || commentData.content.trim().length === 0) {
        throw new Error('Comment content is required');
      }

      if (commentData.content.length > 1000) {
        throw new Error('Comment must be less than 1000 characters');
      }

      const commentsRef = ref(realtimeDb, `comments/${postId}`);
      const newCommentRef = push(commentsRef);
      
      const comment = {
        content: commentData.content.trim(),
        author: {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          email: user.email,
          photoURL: user.photoURL || null
        },
        timestamp: serverTimestamp(),
        likes: 0,
        replies: {},
        edited: false,
        status: 'published'
      };

      await set(newCommentRef, comment);
      
      // Log activity
      await this.logActivity({
        type: 'comment',
        userId: user.uid,
        action: 'created',
        targetId: postId,
        commentId: newCommentRef.key
      });

      return {
        success: true,
        commentId: newCommentRef.key,
        comment
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async addReply(postId, commentId, replyData) {
    try {
      const user = enhancedAuth.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to reply');
      }

      const repliesRef = ref(realtimeDb, `comments/${postId}/${commentId}/replies`);
      const newReplyRef = push(repliesRef);
      
      const reply = {
        content: replyData.content.trim(),
        author: {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          email: user.email,
          photoURL: user.photoURL || null
        },
        timestamp: serverTimestamp(),
        likes: 0
      };

      await set(newReplyRef, reply);
      
      return {
        success: true,
        replyId: newReplyRef.key,
        reply
      };
    } catch (error) {
      console.error('Error adding reply:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listen to comments for a post
  listenToComments(postId, callback) {
    const commentsRef = ref(realtimeDb, `comments/${postId}`);
    const listener = onValue(commentsRef, (snapshot) => {
      const comments = snapshot.val() || {};
      callback(comments);
    });
    
    this.listeners.set(`comments_${postId}`, { ref: commentsRef, listener });
    return () => this.stopListening(`comments_${postId}`);
  }

  // Presence System
  setupPresence() {
    const user = enhancedAuth.getCurrentUser();
    if (!user) return;

    this.presenceRef = ref(realtimeDb, `presence/${user.uid}`);
    const connectedRef = ref(realtimeDb, '.info/connected');
    
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // Set user as online
        set(this.presenceRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
          displayName: user.displayName || 'Anonymous'
        });
        
        // Set user as offline when disconnected
        onDisconnect(this.presenceRef).set({
          isOnline: false,
          lastSeen: serverTimestamp(),
          displayName: user.displayName || 'Anonymous'
        });
      }
    });
  }

  // Listen to online users
  listenToOnlineUsers(callback) {
    const presenceRef = ref(realtimeDb, 'presence');
    const listener = onValue(presenceRef, (snapshot) => {
      const presence = snapshot.val() || {};
      const onlineUsers = Object.entries(presence)
        .filter(([_, data]) => data.isOnline)
        .map(([uid, data]) => ({ uid, ...data }));
      
      callback(onlineUsers);
    });
    
    this.listeners.set('online_users', { ref: presenceRef, listener });
    return () => this.stopListening('online_users');
  }

  // Notifications System
  async sendNotification(userId, notification) {
    try {
      const notificationsRef = ref(realtimeDb, `notifications/${userId}`);
      const newNotificationRef = push(notificationsRef);
      
      const notificationData = {
        ...notification,
        id: newNotificationRef.key,
        timestamp: serverTimestamp(),
        read: false
      };

      await set(newNotificationRef, notificationData);
      
      return {
        success: true,
        notificationId: newNotificationRef.key
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listen to user notifications
  listenToNotifications(userId, callback) {
    const notificationsRef = query(
      ref(realtimeDb, `notifications/${userId}`),
      orderByChild('timestamp'),
      limitToLast(50)
    );
    
    const listener = onValue(notificationsRef, (snapshot) => {
      const notifications = [];
      snapshot.forEach((child) => {
        notifications.unshift({ id: child.key, ...child.val() });
      });
      callback(notifications);
    });
    
    this.listeners.set(`notifications_${userId}`, { ref: notificationsRef, listener });
    return () => this.stopListening(`notifications_${userId}`);
  }

  // Mark notification as read
  async markNotificationAsRead(userId, notificationId) {
    try {
      const notificationRef = ref(realtimeDb, `notifications/${userId}/${notificationId}`);
      await set(ref(realtimeDb, `notifications/${userId}/${notificationId}/read`), true);
      
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Activity Logging
  async logActivity(activityData) {
    try {
      const activityRef = ref(realtimeDb, 'activity');
      const newActivityRef = push(activityRef);
      
      const activity = {
        ...activityData,
        timestamp: serverTimestamp(),
        id: newActivityRef.key
      };

      await set(newActivityRef, activity);
      
      return { success: true, activityId: newActivityRef.key };
    } catch (error) {
      console.error('Error logging activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Listen to recent activity
  listenToActivity(callback, limit = 20) {
    const activityRef = query(
      ref(realtimeDb, 'activity'),
      orderByChild('timestamp'),
      limitToLast(limit)
    );
    
    const listener = onValue(activityRef, (snapshot) => {
      const activities = [];
      snapshot.forEach((child) => {
        activities.unshift({ id: child.key, ...child.val() });
      });
      callback(activities);
    });
    
    this.listeners.set('activity', { ref: activityRef, listener });
    return () => this.stopListening('activity');
  }

  // Real-time Search
  async searchComments(postId, searchTerm) {
    try {
      const commentsRef = ref(realtimeDb, `comments/${postId}`);
      const snapshot = await get(commentsRef);
      const comments = snapshot.val() || {};
      
      const results = Object.entries(comments)
        .filter(([_, comment]) => 
          comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comment.author.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(([id, comment]) => ({ id, ...comment }));
      
      return { success: true, results };
    } catch (error) {
      console.error('Error searching comments:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility Methods
  stopListening(key) {
    const listener = this.listeners.get(key);
    if (listener) {
      off(listener.ref, 'value', listener.listener);
      this.listeners.delete(key);
    }
  }

  stopAllListeners() {
    this.listeners.forEach((listener, key) => {
      this.stopListening(key);
    });
  }

  // Connection monitoring
  monitorConnection(callback) {
    const connectedRef = ref(realtimeDb, '.info/connected');
    const listener = onValue(connectedRef, (snapshot) => {
      callback(snapshot.val() === true);
    });
    
    this.listeners.set('connection', { ref: connectedRef, listener });
    return () => this.stopListening('connection');
  }

  // Cleanup on user logout
  cleanup() {
    this.stopAllListeners();
    if (this.presenceRef) {
      set(this.presenceRef, {
        isOnline: false,
        lastSeen: serverTimestamp()
      });
    }
  }
}

export default new RealtimeService();