/**
 * Firestore Database Service
 * Complete backend replacement for PHP/SQLite with Firebase Firestore
 * Provides all CRUD operations, real-time updates, and advanced querying
 */

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";

import { db as dbImport, DB_CONFIG, isFirebaseConfigured, waitForFirebaseInit, getDbInstance } from "../config/firebase";
import { getFirebaseErrorMessage } from "../config/firebase";
import phpApiService from "./phpApiService";

const USE_PHP_BACKEND = true; // Toggle to switch between Firebase SDK and PHP Backend

class FirestoreService {
  constructor() {
    this.collections = DB_CONFIG.collections;
    this.listeners = new Map(); // Track real-time listeners
    this.cache = new Map(); // Simple in-memory cache
    this.isOnline = true;
  }

  // Get the current db instance dynamically
  getDb() {
    return getDbInstance();
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Check if Firestore is available (synchronous)
   */
  isAvailable() {
    try {
      const configured = isFirebaseConfigured();
      const currentDb = this.getDb();
      const dbExists = currentDb !== null && currentDb !== undefined;
      
      return configured && dbExists;
    } catch (error) {
      console.error("Firebase availability check failed:", error);
      return false;
    }
  }

  /**
   * Wait for Firebase initialization (async version)
   */
  async waitForInitialization() {
    try {
      await waitForFirebaseInit();
      return this.isAvailable();
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      return false;
    }
  }

  /**
   * Get collection reference
   */
  getCollectionRef(collectionName) {
    const currentDb = this.getDb();
    
    if (!currentDb) {
      throw new Error("Firestore database instance is null or undefined");
    }
    
    if (!this.isAvailable()) {
      throw new Error("Firestore is not configured");
    }
    
    if (!currentDb) {
      throw new Error("Firestore database instance is null or undefined");
    }
    
    return collection(currentDb, collectionName);
  }

  /**
   * Get document reference
   */
  getDocRef(collectionName, docId) {
    if (!this.isAvailable()) {
      throw new Error("Firestore is not configured");
    }
    const currentDb = this.getDb();
    if (!currentDb) {
      throw new Error("Firestore database instance is null or undefined");
    }
    return doc(currentDb, collectionName, docId);
  }

  /**
   * Generate cache key
   */
  getCacheKey(collectionName, docId = null, queryParams = null) {
    const key = `${collectionName}${docId ? `_${docId}` : ""}${
      queryParams ? `_${JSON.stringify(queryParams)}` : ""
    }`;
    return key;
  }

  /**
   * Set cache with TTL
   */
  setCache(key, data, ttl = 300000) {
    // 5 minutes default TTL
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }

  /**
   * Get from cache
   */
  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Clear cache
   */
  clearCache(pattern = null) {
    if (pattern) {
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Handle Firestore errors
   */
  handleError(error, operation = "operation") {
    console.error(`Firestore ${operation} error:`, error);
    const message = getFirebaseErrorMessage(error.code) || error.message;
    throw new Error(message);
  }

  // =============================================
  // BASIC CRUD OPERATIONS
  // =============================================

  /**
   * Create a new document
   */
  async createDocument(collectionName, data, docId = null) {
    // Intercept writes for PHP-managed collections
    if (USE_PHP_BACKEND && ['tasks', 'teamMembers'].includes(collectionName)) {
      try {
        const apiCollection = collectionName === 'teamMembers' ? 'team' : collectionName;
        // Note: PHP backend handles createdAt, updatedAt, and createdBy automatically
        const response = await phpApiService.post(apiCollection, data);
        
        // Clear cache for this collection
        this.clearCache(collectionName);

        return {
          success: true,
          id: response.data.id,
          data: response.data,
        };
      } catch (error) {
        console.error("PHP Backend Create Error:", error);
        // Fallback or throw? Throwing allows UI to show error.
        this.handleError(error, "create document via PHP");
      }
    }

    try {
      await waitForFirebaseInit();
      if (!(await this.isAvailable())) {
        throw new Error("Firestore is not configured");
      }
      
      const timestamp = serverTimestamp();
      const documentData = {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      let docRef;
      if (docId) {
        docRef = this.getDocRef(collectionName, docId);
        await setDoc(docRef, documentData);
      } else {
        const collectionRef = this.getCollectionRef(collectionName);
        docRef = await addDoc(collectionRef, documentData);
      }

      // Clear cache for this collection
      this.clearCache(collectionName);

      return {
        success: true,
        id: docRef.id,
        data: documentData,
      };
    } catch (error) {
      this.handleError(error, "create document");
    }
  }

  /**
   * Get a single document
   */
  async getDocument(collectionName, docId, useCache = true) {
    // Intercept reads for PHP-managed collections (optional, but good for consistency)
    if (USE_PHP_BACKEND && ['tasks', 'teamMembers'].includes(collectionName)) {
      try {
        const cacheKey = this.getCacheKey(collectionName, docId);
        if (useCache) {
          const cached = this.getCache(cacheKey);
          if (cached) return { success: true, data: cached };
        }

        const apiCollection = collectionName === 'teamMembers' ? 'team' : collectionName;
        const response = await phpApiService.get(`${apiCollection}/${docId}`);
        
        const data = response.data;
        if (useCache) this.setCache(cacheKey, data);
        
        return { success: true, data };
      } catch (error) {
        // If 404, return success: false
        if (error.message.includes('404')) {
           return { success: false, error: "Document not found" };
        }
        console.error("PHP Backend Get Error:", error);
        this.handleError(error, "get document via PHP");
      }
    }

    try {
      await waitForFirebaseInit();
      if (!(await this.isAvailable())) {
        throw new Error("Firestore is not configured");
      }
      
      const cacheKey = this.getCacheKey(collectionName, docId);

      // Check cache first
      if (useCache) {
        const cached = this.getCache(cacheKey);
        if (cached) {
          return { success: true, data: cached };
        }
      }

      const docRef = this.getDocRef(collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };

        // Cache the result
        if (useCache) {
          this.setCache(cacheKey, data);
        }

        return { success: true, data };
      } else {
        return { success: false, error: "Document not found" };
      }
    } catch (error) {
      this.handleError(error, "get document");
    }
  }

  /**
   * Update a document
   */
  async updateDocument(collectionName, docId, data, merge = true) {
    if (USE_PHP_BACKEND && ['tasks', 'teamMembers'].includes(collectionName)) {
      try {
        const apiCollection = collectionName === 'teamMembers' ? 'team' : collectionName;
        // PHP backend handles updatedAt and updatedBy
        const response = await phpApiService.put(`${apiCollection}/${docId}`, data);
        
        // Clear cache for this document and collection
        this.clearCache(collectionName);

        return { success: true, id: docId, data: response.data };
      } catch (error) {
        console.error("PHP Backend Update Error:", error);
        this.handleError(error, "update document via PHP");
      }
    }

    try {
      const docRef = this.getDocRef(collectionName, docId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      if (merge) {
        await updateDoc(docRef, updateData);
      } else {
        await setDoc(docRef, updateData);
      }

      // Clear cache for this document and collection
      this.clearCache(collectionName);

      return { success: true, id: docId, data: updateData };
    } catch (error) {
      this.handleError(error, "update document");
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collectionName, docId, softDelete = false) {
    if (USE_PHP_BACKEND && ['tasks', 'teamMembers'].includes(collectionName)) {
      try {
        if (softDelete) {
           // Treat soft delete as update
           return this.updateDocument(collectionName, docId, { 
             status: "deleted",
             deletedAt: new Date().toISOString() // PHP expects string or handles it
           });
        }

        const apiCollection = collectionName === 'teamMembers' ? 'team' : collectionName;
        await phpApiService.delete(`${apiCollection}/${docId}`);

        // Clear cache for this document and collection
        this.clearCache(collectionName);

        return { success: true, id: docId };
      } catch (error) {
        console.error("PHP Backend Delete Error:", error);
        this.handleError(error, "delete document via PHP");
      }
    }

    try {
      const docRef = this.getDocRef(collectionName, docId);

      if (softDelete) {
        await updateDoc(docRef, {
          status: "deleted",
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await deleteDoc(docRef);
      }

      // Clear cache for this document and collection
      this.clearCache(collectionName);

      return { success: true, id: docId };
    } catch (error) {
      this.handleError(error, "delete document");
    }
  }

  // =============================================
  // QUERY OPERATIONS
  // =============================================

  /**
   * Get multiple documents with advanced querying
   */
  async getDocuments(
    collectionName,
    {
      filters = [],
      orderByField = null,
      orderByDirection = "asc",
      limitCount = null,
      startAfterDoc = null,
      endBeforeDoc = null,
      useCache = true,
    } = {}
  ) {
    try {
      await waitForFirebaseInit();
      if (!(await this.isAvailable())) {
        throw new Error("Firestore is not configured");
      }
      
      const queryParams = {
        filters,
        orderByField,
        orderByDirection,
        limitCount,
        startAfterDoc,
        endBeforeDoc,
      };
      const cacheKey = this.getCacheKey(collectionName, null, queryParams);

      // Check cache first
      if (useCache) {
        const cached = this.getCache(cacheKey);
        if (cached) {
          return { success: true, data: cached };
        }
      }

      const collectionRef = this.getCollectionRef(collectionName);
      let q = query(collectionRef);

      // Apply filters
      filters.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value));
      });

      // Apply ordering
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderByDirection));
      }

      // Apply pagination
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }
      if (endBeforeDoc) {
        q = query(q, endBefore(endBeforeDoc));
      }
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const documents = [];

      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });

      // Cache the result
      if (useCache) {
        this.setCache(cacheKey, documents);
      }

      return {
        success: true,
        data: documents,
        count: documents.length,
        hasMore: documents.length === limitCount,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        firstDoc: querySnapshot.docs[0] || null,
      };
    } catch (error) {
      this.handleError(error, "get documents");
    }
  }

  /**
   * Search documents with text search capabilities
   */
  async searchDocuments(
    collectionName,
    searchTerms,
    {
      searchFields = ["title", "content", "name"],
      filters = [],
      orderByField = "createdAt",
      orderByDirection = "desc",
      limitCount = 50,
    } = {}
  ) {
    try {
      // For basic text search, we'll use array-contains for tags or startswith for text
      // Note: Full-text search requires Algolia or similar service
      const searchFilters = [];

      // Add search filters
      searchFields.forEach((field) => {
        if (field.includes("tags")) {
          searchFilters.push({
            field: "tags",
            operator: "array-contains-any",
            value: searchTerms.split(" "),
          });
        }
      });

      const combinedFilters = [...filters, ...searchFilters];

      return await this.getDocuments(collectionName, {
        filters: combinedFilters,
        orderByField,
        orderByDirection,
        limitCount,
        useCache: false, // Don't cache search results
      });
    } catch (error) {
      this.handleError(error, "search documents");
    }
  }

  // =============================================
  // REAL-TIME OPERATIONS
  // =============================================

  /**
   * Listen to document changes in real-time
   */
  listenToDocument(collectionName, docId, callback, options = {}) {
    try {
      const docRef = this.getDocRef(collectionName, docId);
      const listenerId = `${collectionName}_${docId}`;

      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            callback({ success: true, data, type: "document" });
          } else {
            callback({ success: false, error: "Document not found" });
          }
        },
        (error) => {
          console.error("Document listener error:", error);
          callback({ success: false, error: error.message });
        }
      );

      this.listeners.set(listenerId, unsubscribe);
      return listenerId;
    } catch (error) {
      this.handleError(error, "listen to document");
    }
  }

  /**
   * Listen to collection changes in real-time
   */
  async listenToCollection(
    collectionName,
    callback,
    {
      filters = [],
      orderByField = null,
      orderByDirection = "asc",
      limitCount = null,
    } = {}
  ) {
    try {
      // Wait for Firebase initialization
      const isReady = await this.waitForInitialization();
      if (!isReady) {
        throw new Error("Firestore database instance is null or undefined");
      }
      
      const collectionRef = this.getCollectionRef(collectionName);
      let q = query(collectionRef);

      // Apply filters
      filters.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value));
      });

      // Apply ordering
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderByDirection));
      }

      // Apply limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const listenerId = `${collectionName}_${Date.now()}`;

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const documents = [];
          const changes = [];

          querySnapshot.docChanges().forEach((change) => {
            const docData = { id: change.doc.id, ...change.doc.data() };
            changes.push({
              type: change.type, // added, modified, removed
              doc: docData,
              oldIndex: change.oldIndex,
              newIndex: change.newIndex,
            });
          });

          querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
          });

          callback({
            success: true,
            data: documents,
            changes,
            type: "collection",
          });
        },
        (error) => {
          console.error("Collection listener error:", error);
          callback({ success: false, error: error.message });
        }
      );

      this.listeners.set(listenerId, unsubscribe);
      return listenerId;
    } catch (error) {
      this.handleError(error, "listen to collection");
    }
  }

  /**
   * Stop listening to real-time updates
   */
  stopListening(listenerId) {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
      return true;
    }
    return false;
  }

  /**
   * Stop all listeners
   */
  stopAllListeners() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  // =============================================
  // BATCH OPERATIONS
  // =============================================

  /**
   * Perform batch operations (max 500 operations)
   */
  async performBatch(operations) {
    try {
      if (!this.isAvailable()) {
        throw new Error("Firestore is not configured");
      }

      const batch = writeBatch(this.getDb());
      const timestamp = serverTimestamp();

      operations.forEach((operation) => {
        const { type, collectionName, docId, data } = operation;
        const docRef = this.getDocRef(collectionName, docId);

        switch (type) {
          case "create":
          case "set":
            batch.set(docRef, {
              ...data,
              createdAt: timestamp,
              updatedAt: timestamp,
            });
            break;
          case "update":
            batch.update(docRef, {
              ...data,
              updatedAt: timestamp,
            });
            break;
          case "delete":
            batch.delete(docRef);
            break;
          default:
            throw new Error(`Unknown batch operation type: ${type}`);
        }
      });

      await batch.commit();

      // Clear relevant caches
      const collections = [
        ...new Set(operations.map((op) => op.collectionName)),
      ];
      collections.forEach((collectionName) => {
        this.clearCache(collectionName);
      });

      return { success: true, operationsCount: operations.length };
    } catch (error) {
      this.handleError(error, "batch operations");
    }
  }

  // =============================================
  // TRANSACTION OPERATIONS
  // =============================================

  /**
   * Perform atomic transaction
   */
  async performTransaction(transactionFunction) {
    try {
      if (!this.isAvailable()) {
        throw new Error("Firestore is not configured");
      }

      const result = await runTransaction(this.getDb(), transactionFunction);

      // Clear cache after transaction
      this.clearCache();

      return { success: true, result };
    } catch (error) {
      this.handleError(error, "transaction");
    }
  }

  // =============================================
  // OFFLINE SUPPORT
  // =============================================

  /**
   * Enable offline support
   */
  async enableOffline() {
    try {
      if (!this.isAvailable()) {
        throw new Error("Firestore is not configured");
      }

      await disableNetwork(this.getDb());
      this.isOnline = false;
      console.log("Firestore offline mode enabled");
      return { success: true };
    } catch (error) {
      this.handleError(error, "enable offline");
    }
  }

  /**
   * Enable online support
   */
  async enableOnline() {
    try {
      if (!this.isAvailable()) {
        throw new Error("Firestore is not configured");
      }

      await enableNetwork(this.getDb());
      this.isOnline = true;
      console.log("Firestore online mode enabled");
      return { success: true };
    } catch (error) {
      this.handleError(error, "enable online");
    }
  }

  // =============================================
  // UTILITY HELPERS
  // =============================================

  /**
   * Get server timestamp
   */
  getServerTimestamp() {
    return serverTimestamp();
  }

  /**
   * Get increment value
   */
  getIncrement(value = 1) {
    return increment(value);
  }

  /**
   * Get array union
   */
  getArrayUnion(...elements) {
    return arrayUnion(...elements);
  }

  /**
   * Get array remove
   */
  getArrayRemove(...elements) {
    return arrayRemove(...elements);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isAvailable: this.isAvailable(),
      isOnline: this.isOnline,
      collections: this.collections,
      activeListeners: this.listeners.size,
      cacheSize: this.cache.size,
      db: !!this.getDb(),
    };
  }

  /**
   * Clear all resources
   */
  cleanup() {
    this.stopAllListeners();
    this.clearCache();
    console.log("Firestore service cleaned up");
  }
}

// Create and export singleton instance
const firestoreService = new FirestoreService();

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    firestoreService.cleanup();
  });
}

export default firestoreService;
