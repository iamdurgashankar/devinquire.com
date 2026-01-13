import { useState, useEffect, useCallback } from 'react';
import { requestService } from '../services/requestService';
import { useRBAC } from '../services/rbacService';

export const useNotifications = () => {
  const { currentUser } = useRBAC();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      
      const userNotifications = await requestService.getNotifications(
        currentUser.uid, 
        currentUser.role
      );
      
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = requestService.subscribeToNotifications(
      currentUser.uid,
      currentUser.role,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        setUnreadCount(updatedNotifications.filter(n => !n.read).length);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await requestService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, readAt: new Date() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      await Promise.all(
        unreadNotifications.map(notification => 
          requestService.markNotificationAsRead(notification.id)
        )
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true, readAt: new Date() }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  }, [notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = useCallback(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return notifications.filter(notification => {
      const createdAt = notification.createdAt?.toDate() || new Date(notification.createdAt);
      return createdAt >= oneDayAgo;
    });
  }, [notifications]);

  // Create notification (for internal use)
  const createNotification = useCallback(async (notificationData) => {
    try {
      await requestService.createNotification(notificationData);
    } catch (err) {
      console.error('Error creating notification:', err);
      setError('Failed to create notification');
    }
  }, []);

  // Get notification icon based on type
  const getNotificationIcon = useCallback((type) => {
    const icons = {
      new_request: '📝',
      request_response: '💬',
      request_status_update: '🔄',
      project_update: '📊',
      system_alert: '⚠️',
      user_action: '👤',
      deadline_reminder: '⏰',
      default: '🔔'
    };
    return icons[type] || icons.default;
  }, []);

  // Get notification color based on priority
  const getNotificationColor = useCallback((priority) => {
    const colors = {
      high: 'text-red-600 bg-red-50 border-red-200',
      medium: 'text-blue-600 bg-blue-50 border-blue-200',
      low: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[priority] || colors.medium;
  }, []);

  // Format notification time
  const formatNotificationTime = useCallback((timestamp) => {
    const date = timestamp?.toDate() || new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }, []);

  // Check if user has permission to see notification
  const canViewNotification = useCallback((notification) => {
    if (!currentUser) return false;
    
    // Admin can see all notifications
    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
      return true;
    }
    
    // Check if notification is targeted to user or their role
    return notification.targetUserId === currentUser.uid || 
           notification.targetRole === currentUser.role;
  }, [currentUser]);

  return {
    notifications: notifications.filter(canViewNotification),
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    getNotificationsByType,
    getRecentNotifications,
    createNotification,
    getNotificationIcon,
    getNotificationColor,
    formatNotificationTime,
    refresh: loadNotifications
  };
};

export default useNotifications;