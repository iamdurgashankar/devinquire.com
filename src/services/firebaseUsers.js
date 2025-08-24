// Firebase User Management Service
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db } from '../config/firebase';
import firebaseAuthService from './firebaseAuth';

class FirebaseUsersService {
  constructor() {
    this.usersCollection = 'users';
  }

  // Get all users (admin only)
  async getAllUsers() {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const q = query(
        collection(db, this.usersCollection),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          uid: data.uid,
          email: data.email,
          name: data.name,
          username: data.username,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        });
      });
      
      return {
        success: true,
        users
      };
    } catch (error) {
      console.error('Get all users error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get pending users (admin only)
  async getPendingUsers() {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const q = query(
        collection(db, this.usersCollection),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          uid: data.uid,
          email: data.email,
          name: data.name,
          username: data.username,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        });
      });
      
      return {
        success: true,
        users
      };
    } catch (error) {
      console.error('Get pending users error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Approve user (admin only)
  async approveUser(userId) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const userDocRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      await updateDoc(userDocRef, {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      
      return {
        success: true,
        message: 'User approved successfully'
      };
    } catch (error) {
      console.error('Approve user error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Reject user (admin only)
  async rejectUser(userId) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const userDocRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      await updateDoc(userDocRef, {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      
      return {
        success: true,
        message: 'User rejected successfully'
      };
    } catch (error) {
      console.error('Reject user error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update user role (admin only)
  async updateUserRole(userId, newRole) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const userDocRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      await updateDoc(userDocRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      return {
        success: true,
        message: 'User role updated successfully'
      };
    } catch (error) {
      console.error('Update user role error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update user (admin only)
  async updateUser(userId, userData) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      const userDocRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      const updateData = {
        ...userData,
        updatedAt: serverTimestamp()
      };
      
      // Remove sensitive fields that shouldn't be updated this way
      delete updateData.uid;
      delete updateData.password;
      delete updateData.createdAt;
      
      await updateDoc(userDocRef, updateData);
      
      return {
        success: true,
        message: 'User updated successfully'
      };
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Delete user (admin only)
  async deleteUser(userId) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      // Prevent admin from deleting themselves
      if (userId === currentUser.user.uid) {
        return {
          success: false,
          message: 'Cannot delete your own account'
        };
      }
      
      const userDocRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // Delete user document from Firestore
      await deleteDoc(userDocRef);
      
      // Note: Deleting the Firebase Auth user requires admin SDK
      // This would typically be done via Cloud Functions
      // For now, we'll just delete the Firestore document
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success) {
        return {
          success: false,
          message: 'Authentication required'
        };
      }
      
      // Users can only view their own profile unless they're admin
      if (userId !== currentUser.user.uid && currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Permission denied'
        };
      }
      
      const userDocRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      const userData = userDoc.data();
      
      return {
        success: true,
        user: {
          id: userDoc.id,
          uid: userData.uid,
          email: userData.email,
          name: userData.name,
          username: userData.username,
          role: userData.role,
          status: userData.status,
          createdAt: userData.createdAt?.toDate?.() || new Date(),
          updatedAt: userData.updatedAt?.toDate?.() || new Date()
        }
      };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get user activity log (placeholder for future implementation)
  async getUserActivityLog(userId) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success || currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin access required'
        };
      }
      
      // This would typically query an activity log collection
      // For now, return empty array
      return {
        success: true,
        activities: []
      };
    } catch (error) {
      console.error('Get user activity log error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get user preferences (placeholder for future implementation)
  async getUserPreferences(userId) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success) {
        return {
          success: false,
          message: 'Authentication required'
        };
      }
      
      // Users can only view their own preferences unless they're admin
      if (userId !== currentUser.user.uid && currentUser.user.role !== 'admin') {
        return {
          success: false,
          message: 'Permission denied'
        };
      }
      
      // This would typically query a preferences collection or subcollection
      // For now, return default preferences
      return {
        success: true,
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        }
      };
    } catch (error) {
      console.error('Get user preferences error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update user preferences
  async updateUserPreferences(userId, preferences) {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser.success) {
        return {
          success: false,
          message: 'Authentication required'
        };
      }
      
      // Users can only update their own preferences
      if (userId !== currentUser.user.uid) {
        return {
          success: false,
          message: 'Permission denied'
        };
      }
      
      // This would typically update a preferences collection or subcollection
      // For now, just return success
      return {
        success: true,
        message: 'Preferences updated successfully'
      };
    } catch (error) {
      console.error('Update user preferences error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Create singleton instance
const firebaseUsersService = new FirebaseUsersService();
export default firebaseUsersService;