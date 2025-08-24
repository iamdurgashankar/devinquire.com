// Firebase Authentication Service
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';

class FirebaseAuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    
    // Listen for auth state changes
    if (isFirebaseConfigured() && auth) {
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        this.authStateListeners.forEach(listener => listener(user));
      });
    } else {
      console.warn('FirebaseAuthService: Firebase auth not configured, skipping auth state listener');
    }
  }

  // Add auth state listener
  onAuthStateChange(callback) {
    if (!isFirebaseConfigured() || !auth) {
      console.warn('FirebaseAuthService: Firebase auth not configured, auth state changes unavailable');
      return () => {}; // Return empty unsubscribe function
    }
    
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Sign up new user
  async signUp(userData) {
    try {
      const { email, password, name, username } = userData;
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile
      await updateProfile(user, {
        displayName: name
      });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        name: name,
        username: username,
        role: 'user',
        status: 'pending', // Requires admin approval
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: name,
          username: username,
          role: 'user',
          status: 'pending'
        }
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Sign in user
  async signIn(credentials) {
    try {
      const { username, password } = credentials;
      
      // Username could be email or actual username
      let email = username;
      
      // If username doesn't contain @, it's a username, so we need to find the email
      if (!username.includes('@')) {
        const userDoc = await this.getUserByUsername(username);
        if (!userDoc) {
          return {
            success: false,
            message: 'Invalid credentials'
          };
        }
        email = userDoc.email;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      // Check if user is approved
      if (userData?.status !== 'approved') {
        await this.signOut();
        return {
          success: false,
          message: 'Account is pending approval'
        };
      }
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: userData.name,
          username: userData.username,
          role: userData.role,
          status: userData.status
        }
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Get current user session
  async getCurrentUser() {
    if (!this.currentUser) {
      return { success: false, message: 'No user logged in' };
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
      const userData = userDoc.data();
      
      return {
        success: true,
        user: {
          uid: this.currentUser.uid,
          email: this.currentUser.email,
          name: userData?.name,
          username: userData?.username,
          role: userData?.role,
          status: userData?.status
        }
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    if (!this.currentUser) {
      return { success: false, message: 'No user logged in' };
    }
    
    try {
      const { name, username } = profileData;
      
      // Update Firebase Auth profile
      if (name) {
        await updateProfile(this.currentUser, {
          displayName: name
        });
      }
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', this.currentUser.uid), {
        ...profileData,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    if (!this.currentUser) {
      return { success: false, message: 'No user logged in' };
    }
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        this.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(this.currentUser, credential);
      
      // Update password
      await updatePassword(this.currentUser, newPassword);
      
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Send password reset email
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Helper method to get user by username
  async getUserByUsername(username) {
    try {
      // This would require a compound query or a separate collection for username lookup
      // For now, we'll implement a simple approach
      // In production, consider using Cloud Functions for this
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error('Get user by username error:', error);
      return null;
    }
  }

  // Helper method to format error messages
  getErrorMessage(error) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid credentials';
      case 'auth/email-already-in-use':
        return 'Email is already registered';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return error.message || 'An error occurred';
    }
  }
}

// Create singleton instance
const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;