// Firebase Blog Service
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import firebaseAuthService from './firebaseAuth';

class FirebaseBlogService {
  constructor() {
    this.postsCollection = 'posts';
  }

  // Get all posts with pagination and filtering
  async getPosts(page = 1, pageLimit = 10, category = null, status = 'published') {
    try {
      let q = collection(db, this.postsCollection);
      
      // Build query conditions
      const conditions = [];
      
      if (status) {
        conditions.push(where('status', '==', status));
      }
      
      if (category) {
        conditions.push(where('category', '==', category));
      }
      
      // Create query with conditions
      if (conditions.length > 0) {
        q = query(q, ...conditions, orderBy('createdAt', 'desc'), limit(pageLimit));
      } else {
        q = query(q, orderBy('createdAt', 'desc'), limit(pageLimit));
      }
      
      // Handle pagination (simplified - in production, use cursor-based pagination)
      if (page > 1) {
        const offset = (page - 1) * pageLimit;
        // Note: Firestore doesn't support offset directly
        // This is a simplified implementation
      }
      
      const querySnapshot = await getDocs(q);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        });
      });
      
      return {
        success: true,
        posts,
        pagination: {
          page,
          limit: pageLimit,
          total: posts.length // In production, get actual count
        }
      };
    } catch (error) {
      console.error('Get posts error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get single post by ID
  async getPost(id) {
    try {
      const docRef = doc(db, this.postsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Post not found'
        };
      }
      
      const data = docSnap.data();
      
      // Increment view count
      await updateDoc(docRef, {
        views: increment(1)
      });
      
      return {
        success: true,
        post: {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        }
      };
    } catch (error) {
      console.error('Get post error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Create new post
  async createPost(postData) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success) {
        return {
          success: false,
          message: 'Authentication required'
        };
      }
      
      const newPost = {
        ...postData,
        authorId: currentUser.user.uid,
        authorName: currentUser.user.name,
        views: 0,
        likes: 0,
        status: postData.status || 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.postsCollection), newPost);
      
      return {
        success: true,
        post: {
          id: docRef.id,
          ...newPost
        }
      };
    } catch (error) {
      console.error('Create post error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update existing post
  async updatePost(id, postData) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success) {
        return {
          success: false,
          message: 'Authentication required'
        };
      }
      
      const docRef = doc(db, this.postsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Post not found'
        };
      }
      
      const existingPost = docSnap.data();
      
      // Check if user owns the post or is admin
      if (existingPost.authorId !== currentUser.user.uid && currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Permission denied'
        };
      }
      
      const updatedData = {
        ...postData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updatedData);
      
      return {
        success: true,
        post: {
          id,
          ...existingPost,
          ...updatedData
        }
      };
    } catch (error) {
      console.error('Update post error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Delete post (soft delete)
  async deletePost(id) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success) {
        return {
          success: false,
          message: 'Authentication required'
        };
      }
      
      const docRef = doc(db, this.postsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Post not found'
        };
      }
      
      const existingPost = docSnap.data();
      
      // Check if user owns the post or is admin
      if (existingPost.authorId !== currentUser.user.uid && currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Permission denied'
        };
      }
      
      // Soft delete by updating status
      await updateDoc(docRef, {
        status: 'deleted',
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Delete post error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Permanently delete post
  async permanentDeletePost(id) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const docRef = doc(db, this.postsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Post not found'
        };
      }
      
      const postData = docSnap.data();
      
      // Delete associated images from storage
      if (postData.featuredImage && postData.featuredImage.includes('firebase')) {
        try {
          const imageRef = ref(storage, postData.featuredImage);
          await deleteObject(imageRef);
        } catch (imageError) {
          console.warn('Failed to delete image:', imageError);
        }
      }
      
      // Delete the document
      await deleteDoc(docRef);
      
      return { success: true };
    } catch (error) {
      console.error('Permanent delete post error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Upload image to Firebase Storage
  async uploadImage(file) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success) {
        return {
          success: false,
          message: 'Authentication required'
        };
      }
      
      // Create unique filename
      const timestamp = Date.now();
      const filename = `blog-images/${timestamp}-${file.name}`;
      
      // Upload file
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        url: downloadURL,
        filename: filename
      };
    } catch (error) {
      console.error('Upload image error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get posts by category
  async getPostsByCategory(category, limit = 10) {
    try {
      const q = query(
        collection(db, this.postsCollection),
        where('category', '==', category),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        });
      });
      
      return {
        success: true,
        posts
      };
    } catch (error) {
      console.error('Get posts by category error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Search posts
  async searchPosts(searchTerm, limit = 10) {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simplified implementation using array-contains for tags
      // In production, consider using Algolia or Elasticsearch
      
      const q = query(
        collection(db, this.postsCollection),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const post = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
        
        // Simple text search in title, excerpt, and content
        const searchLower = searchTerm.toLowerCase();
        if (
          post.title?.toLowerCase().includes(searchLower) ||
          post.excerpt?.toLowerCase().includes(searchLower) ||
          post.content?.toLowerCase().includes(searchLower) ||
          post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        ) {
          posts.push(post);
        }
      });
      
      return {
        success: true,
        posts
      };
    } catch (error) {
      console.error('Search posts error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      // Get all posts
      const allPostsQuery = query(collection(db, this.postsCollection));
      const allPostsSnapshot = await getDocs(allPostsQuery);
      
      let totalPosts = 0;
      let publishedPosts = 0;
      let draftPosts = 0;
      let totalViews = 0;
      
      allPostsSnapshot.forEach((doc) => {
        const data = doc.data();
        totalPosts++;
        totalViews += data.views || 0;
        
        if (data.status === 'published') {
          publishedPosts++;
        } else if (data.status === 'draft') {
          draftPosts++;
        }
      });
      
      return {
        success: true,
        stats: {
          totalPosts,
          publishedPosts,
          draftPosts,
          totalViews
        }
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Create singleton instance
const firebaseBlogService = new FirebaseBlogService();
export default firebaseBlogService;