/**
 * Real-time Features and Optimistic Updates Service
 * Provides real-time functionality and optimistic UI updates
 */

import {
  onSnapshot,
  doc,
  collection,
  query,
  where,
  orderBy,
  limit as limitQuery,
} from "firebase/firestore";
import { getDbInstance, isFirebaseConfigured } from "../config/firebase";
import firestoreService from "./firestoreService";

class RealTimeFeaturesService {
  constructor() {
    this.isFirebaseAvailable = isFirebaseConfigured();
    this.subscriptions = new Map();
    this.optimisticUpdates = new Map();
    this.retryQueue = [];
    this.isOnline = navigator.onLine;
    this.listeners = new Map();

    this.setupNetworkMonitoring();
  }

  getStatus() {
    return {
      isAvailable: this.isFirebaseAvailable,
      isOnline: this.isOnline,
      activeSubscriptions: this.subscriptions.size,
      features: {
        realTimeSync: this.isFirebaseAvailable,
        optimisticUpdates: true,
        offlineSupport: this.isFirebaseAvailable,
      },
    };
  }

  setupNetworkMonitoring() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.processRetryQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  async processRetryQueue() {
    const queue = [...this.retryQueue];
    this.retryQueue = [];

    for (const operation of queue) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        if (operation.retryCount < 3) {
          operation.retryCount++;
          this.retryQueue.push(operation);
        }
      }
    }
  }

  async executeOperation(operation) {
    switch (operation.type) {
      case "create":
        return await firestoreService.createDocument(
          operation.collection,
          operation.data
        );
      case "update":
        return await firestoreService.updateDocument(
          operation.collection,
          operation.id,
          operation.data
        );
      case "delete":
        return await firestoreService.deleteDocument(
          operation.collection,
          operation.id
        );
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  async createDocumentOptimistic(collection, data, optimisticId = null) {
    const tempId = optimisticId || `temp_${Date.now()}_${Math.random()}`;

    try {
      const optimisticDoc = {
        id: tempId,
        ...data,
        _optimistic: true,
      };

      this.applyOptimisticUpdate(collection, tempId, optimisticDoc, "create");

      const result = await firestoreService.createDocument(collection, data);

      if (result.success) {
        this.resolveOptimisticUpdate(
          collection,
          tempId,
          result.id,
          result.data
        );
        return { success: true, id: result.id, data: result.data };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      if (!this.isOnline) {
        this.addToRetryQueue({
          type: "create",
          collection,
          data,
          retryCount: 0,
        });
        return { success: true, id: tempId, optimistic: true };
      } else {
        this.revertOptimisticUpdate(collection, tempId);
        throw error;
      }
    }
  }

  async updateDocumentOptimistic(collection, id, updates) {
    try {
      const optimisticData = {
        ...updates,
        _optimistic: true,
        updatedAt: new Date(),
      };

      this.applyOptimisticUpdate(collection, id, optimisticData, "update");

      const result = await firestoreService.updateDocument(
        collection,
        id,
        updates
      );

      if (result.success) {
        this.resolveOptimisticUpdate(collection, id, id, updates);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      if (!this.isOnline) {
        this.addToRetryQueue({
          type: "update",
          collection,
          id,
          data: updates,
          retryCount: 0,
        });
        return { success: true, optimistic: true };
      } else {
        this.revertOptimisticUpdate(collection, id);
        throw error;
      }
    }
  }

  subscribeToCollection(collectionName, options = {}, callback) {
    if (!this.isFirebaseAvailable) {
      console.warn("Firebase not available, real-time updates disabled");
      return null;
    }

    try {
      const {
        filters = [],
        orderByField = null,
        orderByDirection = "desc",
        limitCount = null,
      } = options;

      let q = collection(getDbInstance(), collectionName);

      filters.forEach((filter) => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      if (orderByField) {
        q = query(q, orderBy(orderByField, orderByDirection));
      }

      if (limitCount) {
        q = query(q, limitQuery(limitCount));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = [];
          snapshot.forEach((doc) => {
            docs.push({ id: doc.id, ...doc.data() });
          });

          const mergedDocs = this.mergeWithOptimisticUpdates(
            collectionName,
            docs
          );

          callback({
            success: true,
            docs: mergedDocs,
            metadata: {
              isFromCache: snapshot.metadata.fromCache,
            },
          });
        },
        (error) => {
          callback({ success: false, error: error.message });
        }
      );

      const subscriptionId = `collection_${collectionName}_${Date.now()}`;
      this.subscriptions.set(subscriptionId, unsubscribe);

      return subscriptionId;
    } catch (error) {
      console.error("Subscribe to collection error:", error);
      return null;
    }
  }

  subscribeToDocument(collectionName, id, callback) {
    if (!this.isFirebaseAvailable) {
      console.warn("Firebase not available, real-time updates disabled");
      return null;
    }

    try {
      const docRef = doc(getDbInstance(), collectionName, id);

      const unsubscribe = onSnapshot(
        docRef,
        (doc) => {
          if (doc.exists()) {
            const data = { id: doc.id, ...doc.data() };
            const mergedData = this.mergeDocumentWithOptimisticUpdates(
              collectionName,
              id,
              data
            );

            callback({
              success: true,
              doc: mergedData,
              metadata: {
                isFromCache: doc.metadata.fromCache,
              },
            });
          } else {
            callback({ success: false, error: "Document not found" });
          }
        },
        (error) => {
          callback({ success: false, error: error.message });
        }
      );

      const subscriptionId = `document_${collectionName}_${id}_${Date.now()}`;
      this.subscriptions.set(subscriptionId, unsubscribe);

      return subscriptionId;
    } catch (error) {
      console.error("Subscribe to document error:", error);
      return null;
    }
  }

  unsubscribe(subscriptionId) {
    if (this.subscriptions.has(subscriptionId)) {
      const unsubscribe = this.subscriptions.get(subscriptionId);
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
      return true;
    }
    return false;
  }

  applyOptimisticUpdate(collection, id, data, operation) {
    const key = `${collection}_${id}`;
    this.optimisticUpdates.set(key, {
      data,
      operation,
      timestamp: Date.now(),
    });

    this.notifyListeners("optimistic_update", {
      collection,
      id,
      data,
      operation,
    });
  }

  resolveOptimisticUpdate(collection, oldId, newId, data) {
    const oldKey = `${collection}_${oldId}`;
    this.optimisticUpdates.delete(oldKey);

    this.notifyListeners("optimistic_resolved", {
      collection,
      oldId,
      newId,
      data,
    });
  }

  revertOptimisticUpdate(collection, id) {
    const key = `${collection}_${id}`;
    this.optimisticUpdates.delete(key);

    this.notifyListeners("optimistic_reverted", {
      collection,
      id,
    });
  }

  mergeWithOptimisticUpdates(collection, docs) {
    return docs.map((doc) => {
      const key = `${collection}_${doc.id}`;
      if (this.optimisticUpdates.has(key)) {
        const optimistic = this.optimisticUpdates.get(key);
        return { ...doc, ...optimistic.data };
      }
      return doc;
    });
  }

  mergeDocumentWithOptimisticUpdates(collection, id, doc) {
    const key = `${collection}_${id}`;
    if (this.optimisticUpdates.has(key)) {
      const optimistic = this.optimisticUpdates.get(key);
      return { ...doc, ...optimistic.data };
    }
    return doc;
  }

  addToRetryQueue(operation) {
    this.retryQueue.push(operation);
    this.notifyListeners("operation_queued", { operation });
  }

  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Event listener error:", error);
        }
      });
    }
  }

  destroy() {
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.subscriptions.clear();
    this.optimisticUpdates.clear();
    this.retryQueue = [];
    this.listeners.clear();
  }
}

const realTimeFeaturesService = new RealTimeFeaturesService();

export default realTimeFeaturesService;
