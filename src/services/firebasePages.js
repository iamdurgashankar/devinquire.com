// Firebase Pages Management Service
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import firebaseAuthService from './firebaseAuth';

class FirebasePagesService {
  constructor() {
    this.pagesCollection = 'pages';
  }

  // Get all pages
  async getPages() {
    if (!isFirebaseConfigured() || !db) {
      console.warn('FirebasePagesService: Firebase not configured, returning empty pages');
      return { success: true, pages: [] };
    }
    
    try {
      const q = query(
        collection(db, this.pagesCollection),
        where('deleted', '==', false),
        orderBy('position', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const pages = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pages.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        });
      });
      
      return {
        success: true,
        pages
      };
    } catch (error) {
      console.error('Get pages error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get single page by ID
  async getPage(id) {
    if (!isFirebaseConfigured() || !db) {
      console.warn('FirebasePagesService: Firebase not configured, cannot get page');
      return { success: false, error: 'Firebase not configured' };
    }
    
    try {
      const docRef = doc(db, this.pagesCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Page not found'
        };
      }
      
      const data = docSnap.data();
      
      // Check if page is deleted
      if (data.deleted) {
        return {
          success: false,
          message: 'Page not found'
        };
      }
      
      return {
        success: true,
        page: {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        }
      };
    } catch (error) {
      console.error('Get page error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Create new page (admin only)
  async createPage(pageData) {
    if (!isFirebaseConfigured() || !db) {
      console.warn('FirebasePagesService: Firebase not configured, cannot create page');
      return { success: false, error: 'Firebase not configured' };
    }
    
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      // Get the highest position for ordering
      const pagesQuery = query(
        collection(db, this.pagesCollection),
        orderBy('position', 'desc')
      );
      const pagesSnapshot = await getDocs(pagesQuery);
      let maxPosition = 0;
      
      if (!pagesSnapshot.empty) {
        const firstDoc = pagesSnapshot.docs[0];
        maxPosition = firstDoc.data().position || 0;
      }
      
      const newPage = {
        ...pageData,
        deleted: false,
        position: maxPosition + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.pagesCollection), newPage);
      
      return {
        success: true,
        page: {
          id: docRef.id,
          ...newPage
        }
      };
    } catch (error) {
      console.error('Create page error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update existing page (admin only)
  async updatePage(id, pageData) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const docRef = doc(db, this.pagesCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Page not found'
        };
      }
      
      const updatedData = {
        ...pageData,
        updatedAt: serverTimestamp()
      };
      
      // Don't allow updating certain system fields
      delete updatedData.id;
      delete updatedData.createdAt;
      
      await updateDoc(docRef, updatedData);
      
      return {
        success: true,
        page: {
          id,
          ...docSnap.data(),
          ...updatedData
        }
      };
    } catch (error) {
      console.error('Update page error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Save page content (admin only)
  async savePage(id, pageData) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const docRef = doc(db, this.pagesCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        // Create new page if it doesn't exist
        const newPage = {
          id: id,
          title: pageData.title || 'Untitled Page',
          html: pageData.html || '',
          css: pageData.css || '',
          deleted: false,
          position: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(docRef, newPage);
        
        return {
          success: true,
          page: newPage
        };
      } else {
        // Update existing page
        const updatedData = {
          title: pageData.title,
          html: pageData.html,
          css: pageData.css,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(docRef, updatedData);
        
        return {
          success: true,
          page: {
            id,
            ...docSnap.data(),
            ...updatedData
          }
        };
      }
    } catch (error) {
      console.error('Save page error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Delete page (soft delete) (admin only)
  async deletePage(id) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const docRef = doc(db, this.pagesCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Page not found'
        };
      }
      
      // Soft delete by setting deleted flag
      await updateDoc(docRef, {
        deleted: true,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Delete page error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Restore deleted page (admin only)
  async restorePage(id) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const docRef = doc(db, this.pagesCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Page not found'
        };
      }
      
      // Restore by setting deleted flag to false
      await updateDoc(docRef, {
        deleted: false,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Restore page error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Duplicate page (admin only)
  async duplicatePage(id) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const docRef = doc(db, this.pagesCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Page not found'
        };
      }
      
      const originalPage = docSnap.data();
      
      // Get the highest position for ordering
      const pagesQuery = query(
        collection(db, this.pagesCollection),
        orderBy('position', 'desc')
      );
      const pagesSnapshot = await getDocs(pagesQuery);
      let maxPosition = 0;
      
      if (!pagesSnapshot.empty) {
        const firstDoc = pagesSnapshot.docs[0];
        maxPosition = firstDoc.data().position || 0;
      }
      
      const duplicatedPage = {
        title: `${originalPage.title} (Copy)`,
        html: originalPage.html,
        css: originalPage.css,
        deleted: false,
        position: maxPosition + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const newDocRef = await addDoc(collection(db, this.pagesCollection), duplicatedPage);
      
      return {
        success: true,
        page: {
          id: newDocRef.id,
          ...duplicatedPage
        }
      };
    } catch (error) {
      console.error('Duplicate page error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Rename page (admin only)
  async renamePage(id, newTitle) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const docRef = doc(db, this.pagesCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Page not found'
        };
      }
      
      await updateDoc(docRef, {
        title: newTitle,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Rename page error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Save page order (admin only)
  async savePageOrder(pageOrder) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      // Update position for each page
      const updatePromises = pageOrder.map((pageId, index) => {
        const docRef = doc(db, this.pagesCollection, pageId);
        return updateDoc(docRef, {
          position: index,
          updatedAt: serverTimestamp()
        });
      });
      
      await Promise.all(updatePromises);
      
      return { success: true };
    } catch (error) {
      console.error('Save page order error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get deleted pages (admin only)
  async getDeletedPages() {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const q = query(
        collection(db, this.pagesCollection),
        where('deleted', '==', true),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const pages = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pages.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        });
      });
      
      return {
        success: true,
        pages
      };
    } catch (error) {
      console.error('Get deleted pages error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Create singleton instance
const firebasePagesService = new FirebasePagesService();
export default firebasePagesService;