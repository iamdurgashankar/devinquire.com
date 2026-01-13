/**
 * React Hooks for Real-time Features and Optimistic Updates
 * Provides easy-to-use hooks for integrating real-time functionality
 */

import { useState, useEffect, useCallback, useRef } from "react";
import realTimeFeaturesService from "../services/realTimeFeaturesService";

/**
 * Hook for real-time collection data
 */
export function useRealTimeCollection(collectionName, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState({});
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!collectionName) return;

    setLoading(true);
    setError(null);

    const subscriptionId = realTimeFeaturesService.subscribeToCollection(
      collectionName,
      options,
      (result) => {
        if (result.success) {
          setData(result.docs);
          setMetadata(result.metadata || {});
          setError(null);
        } else {
          setError(result.error);
        }
        setLoading(false);
      }
    );

    subscriptionRef.current = subscriptionId;

    return () => {
      if (subscriptionId) {
        realTimeFeaturesService.unsubscribe(subscriptionId);
      }
    };
  }, [collectionName, JSON.stringify(options)]);

  return {
    data,
    loading,
    error,
    metadata,
    isRealTime: !!subscriptionRef.current,
  };
}

/**
 * Hook for real-time document data
 */
export function useRealTimeDocument(collectionName, documentId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState({});
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!collectionName || !documentId) return;

    setLoading(true);
    setError(null);

    const subscriptionId = realTimeFeaturesService.subscribeToDocument(
      collectionName,
      documentId,
      (result) => {
        if (result.success) {
          setData(result.doc);
          setMetadata(result.metadata || {});
          setError(null);
        } else {
          setError(result.error);
        }
        setLoading(false);
      }
    );

    subscriptionRef.current = subscriptionId;

    return () => {
      if (subscriptionId) {
        realTimeFeaturesService.unsubscribe(subscriptionId);
      }
    };
  }, [collectionName, documentId]);

  return {
    data,
    loading,
    error,
    metadata,
    isRealTime: !!subscriptionRef.current,
  };
}

/**
 * Hook for optimistic CRUD operations
 */
export function useOptimisticCrud(collectionName) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(
    async (data, optimisticId = null) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await realTimeFeaturesService.createDocumentOptimistic(
          collectionName,
          data,
          optimisticId
        );
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  const update = useCallback(
    async (id, updates) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await realTimeFeaturesService.updateDocumentOptimistic(
          collectionName,
          id,
          updates
        );
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  const remove = useCallback(
    async (id) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await realTimeFeaturesService.deleteDocumentOptimistic(
          collectionName,
          id
        );
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  return {
    create,
    update,
    delete: remove,
    isLoading,
    error,
  };
}

/**
 * Hook for real-time status and connectivity
 */
export function useRealTimeStatus() {
  const [status, setStatus] = useState(realTimeFeaturesService.getStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(realTimeFeaturesService.getStatus());
    };

    // Listen for status changes
    realTimeFeaturesService.addEventListener("network_restored", updateStatus);
    realTimeFeaturesService.addEventListener("network_lost", updateStatus);
    realTimeFeaturesService.addEventListener(
      "sync_status_changed",
      updateStatus
    );

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);

    return () => {
      clearInterval(interval);
      realTimeFeaturesService.removeEventListener(
        "network_restored",
        updateStatus
      );
      realTimeFeaturesService.removeEventListener("network_lost", updateStatus);
      realTimeFeaturesService.removeEventListener(
        "sync_status_changed",
        updateStatus
      );
    };
  }, []);

  return status;
}

/**
 * Hook for optimistic UI feedback
 */
export function useOptimisticFeedback() {
  const [optimisticOperations, setOptimisticOperations] = useState(new Map());

  useEffect(() => {
    const handleOptimisticUpdate = (data) => {
      setOptimisticOperations((prev) => {
        const newMap = new Map(prev);
        const key = `${data.collection}_${data.id}`;
        newMap.set(key, {
          operation: data.operation,
          timestamp: Date.now(),
        });
        return newMap;
      });
    };

    const handleOptimisticResolved = (data) => {
      setOptimisticOperations((prev) => {
        const newMap = new Map(prev);
        const oldKey = `${data.collection}_${data.oldId}`;
        newMap.delete(oldKey);
        return newMap;
      });
    };

    const handleOptimisticReverted = (data) => {
      setOptimisticOperations((prev) => {
        const newMap = new Map(prev);
        const key = `${data.collection}_${data.id}`;
        newMap.delete(key);
        return newMap;
      });
    };

    realTimeFeaturesService.addEventListener(
      "optimistic_update",
      handleOptimisticUpdate
    );
    realTimeFeaturesService.addEventListener(
      "optimistic_resolved",
      handleOptimisticResolved
    );
    realTimeFeaturesService.addEventListener(
      "optimistic_reverted",
      handleOptimisticReverted
    );

    return () => {
      realTimeFeaturesService.removeEventListener(
        "optimistic_update",
        handleOptimisticUpdate
      );
      realTimeFeaturesService.removeEventListener(
        "optimistic_resolved",
        handleOptimisticResolved
      );
      realTimeFeaturesService.removeEventListener(
        "optimistic_reverted",
        handleOptimisticReverted
      );
    };
  }, []);

  const isOptimistic = useCallback(
    (collection, id) => {
      const key = `${collection}_${id}`;
      return optimisticOperations.has(key);
    },
    [optimisticOperations]
  );

  const getOptimisticOperation = useCallback(
    (collection, id) => {
      const key = `${collection}_${id}`;
      return optimisticOperations.get(key);
    },
    [optimisticOperations]
  );

  return {
    isOptimistic,
    getOptimisticOperation,
    optimisticOperations: Array.from(optimisticOperations.entries()),
  };
}

/**
 * Hook for real-time presence (who's online)
 */
export function usePresence(documentId, collection = "presence") {
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // This would be implemented based on your authentication system
    // For now, we'll create a simple presence system

    if (!documentId) return;

    // Subscribe to presence updates
    const subscriptionId = realTimeFeaturesService.subscribeToDocument(
      collection,
      documentId,
      (result) => {
        if (result.success && result.doc) {
          const users = Object.entries(result.doc.activeUsers || {}).map(
            ([userId, userData]) => ({
              id: userId,
              ...userData,
            })
          );
          setActiveUsers(users);
        }
      }
    );

    return () => {
      if (subscriptionId) {
        realTimeFeaturesService.unsubscribe(subscriptionId);
      }
    };
  }, [documentId, collection]);

  return {
    activeUsers,
    currentUser,
    isPresenceEnabled: true,
  };
}

/**
 * Hook for live cursors and collaborative editing
 */
export function useLiveCursors(documentId) {
  const [cursors, setCursors] = useState(new Map());
  const [myCursor, setMyCursor] = useState(null);

  const updateCursor = useCallback((position) => {
    setMyCursor(position);
    // This would send cursor position to other users
    // Implementation depends on your real-time collaboration needs
  }, []);

  const updateOtherCursor = useCallback((userId, position) => {
    setCursors((prev) => {
      const newMap = new Map(prev);
      if (position) {
        newMap.set(userId, position);
      } else {
        newMap.delete(userId);
      }
      return newMap;
    });
  }, []);

  return {
    cursors: Array.from(cursors.entries()),
    myCursor,
    updateCursor,
    updateOtherCursor,
  };
}

/**
 * Hook for real-time notifications
 */
export function useRealTimeNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const subscriptionId = realTimeFeaturesService.subscribeToCollection(
      "notifications",
      {
        filters: [{ field: "userId", operator: "==", value: userId }],
        orderByField: "createdAt",
        orderByDirection: "desc",
        limitCount: 50,
      },
      (result) => {
        if (result.success) {
          setNotifications(result.docs);
          const unread = result.docs.filter(
            (notification) => !notification.read
          ).length;
          setUnreadCount(unread);
        }
      }
    );

    return () => {
      if (subscriptionId) {
        realTimeFeaturesService.unsubscribe(subscriptionId);
      }
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId) => {
    const crud = useOptimisticCrud("notifications");
    return await crud.update(notificationId, {
      read: true,
      readAt: new Date(),
    });
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
  };
}

export default {
  useRealTimeCollection,
  useRealTimeDocument,
  useOptimisticCrud,
  useRealTimeStatus,
  useOptimisticFeedback,
  usePresence,
  useLiveCursors,
  useRealTimeNotifications,
};
