import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInAnonymously,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

class EnhancedAuthService {
  constructor() {
    this.googleProvider = new GoogleAuthProvider();
    this.githubProvider = new GithubAuthProvider();
    this.currentUser = null;
    
    // Configure providers
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
    this.githubProvider.addScope('user:email');
    
    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.updateUserPresence(user.uid, true);
      }
    });
  }

  // Email/Password Authentication
  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await this.updateUserProfile(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async signUpWithEmail(email, password, displayName) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(result.user, { displayName });
      
      // Send verification email
      await sendEmailVerification(result.user);
      
      // Create user document in Firestore
      await this.createUserDocument(result.user, { displayName });
      
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Social Authentication
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      await this.createUserDocument(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async signInWithGitHub() {
    try {
      const result = await signInWithPopup(auth, this.githubProvider);
      await this.createUserDocument(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async signInAnonymous() {
    try {
      const result = await signInAnonymously(auth);
      await this.createUserDocument(result.user, { isAnonymous: true });
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // User Management
  async createUserDocument(user, additionalData = {}) {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData.displayName || '',
        photoURL: user.photoURL || '',
        role: 'user',
        isEmailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous || additionalData.isAnonymous || false,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          newsletter: false,
          notifications: true,
          theme: 'light'
        },
        ...additionalData
      };
      
      await setDoc(userRef, userData);
    } else {
      // Update last login
      await updateDoc(userRef, {
        lastLoginAt: new Date(),
        isEmailVerified: user.emailVerified
      });
    }
  }

  async updateUserProfile(user, updates = {}) {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async updateUserPresence(uid, isOnline) {
    try {
      const presenceRef = doc(db, 'presence', uid);
      await setDoc(presenceRef, {
        isOnline,
        lastSeen: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  // Password Reset
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Sign Out
  async signOut() {
    try {
      if (this.currentUser) {
        await this.updateUserPresence(this.currentUser.uid, false);
      }
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Utility Methods
  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  getErrorMessage(error) {
    const errorMessages = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
      'auth/network-request-failed': 'Network error. Please check your connection.'
    };
    
    return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
  }
}

export default new EnhancedAuthService();