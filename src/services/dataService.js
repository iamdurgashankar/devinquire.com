// Firebase Firestore Data Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  startAt,
  endAt,
  endBefore,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
  getCountFromServer
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import authService from './authService';

class DataService {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
  }

  // Generic CRUD Operations
  async create(collectionName, data, customId = null) {
    try {
      const timestamp = serverTimestamp();
      const docData = {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      let docRef;
      if (customId) {
        docRef = doc(db, collectionName, customId);
        await setDoc(docRef, docData);
      } else {
        docRef = await addDoc(collection(db, collectionName), docData);
      }

      return {
        success: true,
        id: docRef.id,
        data: docData
      };
    } catch (error) {
      console.error(`Create ${collectionName} error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async read(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          success: true,
          id: docSnap.id,
          data: docSnap.data()
        };
      } else {
        return {
          success: false,
          error: 'Document not found'
        };
      }
    } catch (error) {
      console.error(`Read ${collectionName} error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async update(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);

      return {
        success: true,
        id: docId,
        data: updateData
      };
    } catch (error) {
      console.error(`Update ${collectionName} error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async delete(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);

      return {
        success: true,
        id: docId
      };
    } catch (error) {
      console.error(`Delete ${collectionName} error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Posts Management
  async getPosts(options = {}) {
    try {
      const {
        category = null,
        tag = null,
        author = null,
        status = 'published',
        orderByField = 'createdAt',
        orderDirection = 'desc',
        limitCount = 10,
        startAfterDoc = null,
        searchTerm = null
      } = options;

      let q = collection(db, 'posts');
      const constraints = [];

      // Add filters
      if (status) constraints.push(where('status', '==', status));
      if (category) constraints.push(where('category', '==', category));
      if (tag) constraints.push(where('tags', 'array-contains', tag));
      if (author) constraints.push(where('authorId', '==', author));
      if (searchTerm) {
        constraints.push(where('title', '>=', searchTerm));
        constraints.push(where('title', '<=', searchTerm + '\uf8ff'));
      }

      // Add ordering
      constraints.push(orderBy(orderByField, orderDirection));

      // Add pagination
      if (startAfterDoc) constraints.push(startAfter(startAfterDoc));
      if (limitCount) constraints.push(limit(limitCount));

      q = query(q, ...constraints);
      const querySnapshot = await getDocs(q);

      const posts = [];
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        data: posts,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Get posts error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getPost(postId) {
    try {
      const result = await this.read('posts', postId);
      
      if (result.success) {
        // Increment view count
        await this.incrementPostViews(postId);
        
        // Get author details
        if (result.data.authorId) {
          const authorResult = await this.read('users', result.data.authorId);
          if (authorResult.success) {
            result.data.author = {
              id: authorResult.id,
              name: authorResult.data.name || authorResult.data.displayName,
              photoURL: authorResult.data.photoURL,
              role: authorResult.data.role
            };
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Get post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createPost(postData) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const data = {
        ...postData,
        authorId: user.uid,
        authorName: user.name || user.displayName,
        status: postData.status || 'draft',
        views: 0,
        likes: 0,
        commentsCount: 0,
        slug: this.generateSlug(postData.title)
      };

      return await this.create('posts', data);
    } catch (error) {
      console.error('Create post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updatePost(postId, postData) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      // Check ownership or admin role
      const postResult = await this.read('posts', postId);
      if (!postResult.success) return postResult;

      if (postResult.data.authorId !== user.uid && user.role !== 'admin') {
        return {
          success: false,
          error: 'Permission denied'
        };
      }

      return await this.update('posts', postId, postData);
    } catch (error) {
      console.error('Update post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deletePost(postId) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      // Check ownership or admin role
      const postResult = await this.read('posts', postId);
      if (!postResult.success) return postResult;

      if (postResult.data.authorId !== user.uid && user.role !== 'admin') {
        return {
          success: false,
          error: 'Permission denied'
        };
      }

      // Delete associated comments
      await this.deletePostComments(postId);

      return await this.delete('posts', postId);
    } catch (error) {
      console.error('Delete post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async incrementPostViews(postId) {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        views: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Increment post views error:', error);
    }
  }

  async likePost(postId) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const batch = writeBatch(db);
      
      // Update post likes count
      const postRef = doc(db, 'posts', postId);
      batch.update(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(user.uid)
      });

      // Add to user's liked posts
      const userRef = doc(db, 'users', user.uid);
      batch.update(userRef, {
        likedPosts: arrayUnion(postId)
      });

      await batch.commit();

      return {
        success: true,
        message: 'Post liked successfully'
      };
    } catch (error) {
      console.error('Like post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async unlikePost(postId) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const batch = writeBatch(db);
      
      // Update post likes count
      const postRef = doc(db, 'posts', postId);
      batch.update(postRef, {
        likes: increment(-1),
        likedBy: arrayRemove(user.uid)
      });

      // Remove from user's liked posts
      const userRef = doc(db, 'users', user.uid);
      batch.update(userRef, {
        likedPosts: arrayRemove(postId)
      });

      await batch.commit();

      return {
        success: true,
        message: 'Post unliked successfully'
      };
    } catch (error) {
      console.error('Unlike post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Comments Management
  async getComments(postId, options = {}) {
    try {
      const {
        orderByField = 'createdAt',
        orderDirection = 'asc',
        limitCount = 50
      } = options;

      const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        where('status', '==', 'approved'),
        orderBy(orderByField, orderDirection),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const comments = [];

      for (const docSnap of querySnapshot.docs) {
        const commentData = docSnap.data();
        
        // Get author details
        if (commentData.authorId) {
          const authorResult = await this.read('users', commentData.authorId);
          if (authorResult.success) {
            commentData.author = {
              id: authorResult.id,
              name: authorResult.data.name || authorResult.data.displayName,
              photoURL: authorResult.data.photoURL
            };
          }
        }

        comments.push({
          id: docSnap.id,
          ...commentData
        });
      }

      return {
        success: true,
        data: comments
      };
    } catch (error) {
      console.error('Get comments error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createComment(postId, commentData) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const data = {
        ...commentData,
        postId,
        authorId: user.uid,
        authorName: user.name || user.displayName,
        status: 'approved', // Auto-approve for now
        likes: 0,
        replies: []
      };

      const result = await this.create('comments', data);

      if (result.success) {
        // Increment post comments count
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          commentsCount: increment(1)
        });
      }

      return result;
    } catch (error) {
      console.error('Create comment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteComment(commentId) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      // Check ownership or admin role
      const commentResult = await this.read('comments', commentId);
      if (!commentResult.success) return commentResult;

      if (commentResult.data.authorId !== user.uid && user.role !== 'admin') {
        return {
          success: false,
          error: 'Permission denied'
        };
      }

      const result = await this.delete('comments', commentId);

      if (result.success) {
        // Decrement post comments count
        const postRef = doc(db, 'posts', commentResult.data.postId);
        await updateDoc(postRef, {
          commentsCount: increment(-1)
        });
      }

      return result;
    } catch (error) {
      console.error('Delete comment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deletePostComments(postId) {
    try {
      const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Delete post comments error:', error);
    }
  }

  // Categories and Tags
  async getCategories() {
    try {
      const q = query(
        collection(db, 'posts'),
        where('status', '==', 'published')
      );

      const querySnapshot = await getDocs(q);
      const categories = new Set();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });

      return {
        success: true,
        data: Array.from(categories).sort()
      };
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getTags() {
    try {
      const q = query(
        collection(db, 'posts'),
        where('status', '==', 'published')
      );

      const querySnapshot = await getDocs(q);
      const tags = new Set();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach(tag => tags.add(tag));
        }
      });

      return {
        success: true,
        data: Array.from(tags).sort()
      };
    } catch (error) {
      console.error('Get tags error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // File Upload
  async uploadFile(file, path) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        url: downloadURL,
        path: path
      };
    } catch (error) {
      console.error('Upload file error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFile(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);

      return {
        success: true
      };
    } catch (error) {
      console.error('Delete file error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Real-time listeners
  subscribeToCollection(collectionName, callback, constraints = []) {
    try {
      let q = collection(db, collectionName);
      
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const docs = [];
        querySnapshot.forEach((doc) => {
          docs.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(docs);
      }, (error) => {
        console.error(`Subscribe to ${collectionName} error:`, error);
        callback(null, error);
      });

      this.listeners.set(`${collectionName}_${Date.now()}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Subscribe to collection error:', error);
      return null;
    }
  }

  subscribeToDocument(collectionName, docId, callback) {
    try {
      const docRef = doc(db, collectionName, docId);
      
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          callback({
            id: docSnap.id,
            ...docSnap.data()
          });
        } else {
          callback(null);
        }
      }, (error) => {
        console.error(`Subscribe to ${collectionName}/${docId} error:`, error);
        callback(null, error);
      });

      this.listeners.set(`${collectionName}_${docId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Subscribe to document error:', error);
      return null;
    }
  }

  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners.clear();
  }

  // Utility methods
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  // Analytics
  async trackPageView(page, userId = null) {
    try {
      const data = {
        page,
        userId,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };

      await this.create('analytics', data);
    } catch (error) {
      console.error('Track page view error:', error);
    }
  }

  async trackEvent(eventName, eventData = {}, userId = null) {
    try {
      const data = {
        eventName,
        eventData,
        userId,
        timestamp: serverTimestamp()
      };

      await this.create('events', data);
    } catch (error) {
      console.error('Track event error:', error);
    }
  }
}

// Create and export singleton instance
const dataService = new DataService();
export default dataService;

// Export individual methods for convenience
export const {
  create,
  read,
  update,
  delete: deleteDoc,
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getComments,
  createComment,
  deleteComment,
  getCategories,
  getTags,
  uploadFile,
  deleteFile,
  subscribeToCollection,
  subscribeToDocument,
  unsubscribeAll,
  trackPageView,
  trackEvent
} = dataService;