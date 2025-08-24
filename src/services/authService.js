// Firebase Authentication Service
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  updatePassword,
  updateProfile as firebaseUpdateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  updateEmail as firebaseUpdateEmail,
  verifyBeforeUpdateEmail,
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
  multiFactor,
  PhoneAuthProvider,
  RecaptchaVerifier
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';

// Auth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Configure providers
googleProvider.addScope('profile');
googleProvider.addScope('email');
githubProvider.addScope('user:email');

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.initializeAuthListener();
  }

  // Initialize auth state listener
  initializeAuthListener() {
    if (!isFirebaseConfigured() || !auth) {
      console.warn('AuthService: Firebase auth not configured, skipping auth state listener');
      return;
    }
    
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        // Update user's last login time
        await this.updateUserLastLogin(user.uid);
        
        // Sync user data with Firestore
        await this.syncUserData(user);
      }
      
      // Notify all listeners
      this.authStateListeners.forEach(callback => callback(user));
    });
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    if (!isFirebaseConfigured() || !auth) {
      console.warn('AuthService: Firebase auth not configured, auth state changes unavailable');
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

  // Email/Password Authentication
  async register(name, email, password) {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase authentication is not configured. Please check your Firebase setup.');
    }
    
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      await this.createUserProfile(user, { name, displayName: name });
      
      // Send email verification
      await this.sendEmailVerification();
      
      return {
        success: true,
        user,
        message: 'Account created successfully. Please check your email for verification.'
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  async login(email, password) {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase authentication is not configured. Please check your Firebase setup.');
    }
    
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      return {
        success: true,
        user,
        message: 'Signed in successfully'
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  async logout() {
    if (!isFirebaseConfigured() || !auth) {
      console.warn('AuthService: Firebase auth not configured, logout unavailable');
      return;
    }
    
    try {
      await signOut(auth);
      return {
        success: true,
        message: 'Signed out successfully'
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  // Social Authentication
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;
      
      // Create or update user profile
      await this.syncUserData(user);
      
      return {
        success: true,
        user,
        message: 'Signed in with Google successfully'
      };
    } catch (error) {
      console.error('Google sign in error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  async signInWithGithub() {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const { user } = result;
      
      // Create or update user profile
      await this.syncUserData(user);
      
      return {
        success: true,
        user,
        message: 'Signed in with GitHub successfully'
      };
    } catch (error) {
      console.error('GitHub sign in error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  // Password Management
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent successfully'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  async confirmPasswordReset(oobCode, newPassword) {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      console.error('Confirm password reset error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  // Email Management
  async sendEmailVerification() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      
      await firebaseSendEmailVerification(user);
      return {
        success: true,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      console.error('Send email verification error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  async updateEmail(newEmail, password) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await verifyBeforeUpdateEmail(user, newEmail);
      
      return {
        success: true,
        message: 'Email update verification sent. Please check your new email.'
      };
    } catch (error) {
      console.error('Update email error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  // Profile Management
  async updateProfile(profileData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      
      // Update Firebase Auth profile
      await firebaseUpdateProfile(user, {
        displayName: profileData.displayName || profileData.name,
        photoURL: profileData.photoURL
      });
      
      // Update Firestore user document
      await this.updateUserProfile(user.uid, profileData);
      
      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  async deleteAccount(password) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      
      // Reauthenticate user
      if (password) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }
      
      // Delete user data from Firestore
      await this.deleteUserData(user.uid);
      
      // Delete user account
      await deleteUser(user);
      
      return {
        success: true,
        message: 'Account deleted successfully'
      };
    } catch (error) {
      console.error('Delete account error:', error);
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  // User Data Management
  async createUserProfile(user, additionalData = {}) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData.displayName || additionalData.name || '',
        name: additionalData.name || user.displayName || '',
        photoURL: user.photoURL || additionalData.photoURL || '',
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        role: 'user',
        status: 'active',
        preferences: {
          theme: 'light',
          notifications: true,
          newsletter: false
        },
        ...additionalData
      };
      
      await setDoc(userRef, userData);
      return userData;
    } catch (error) {
      console.error('Create user profile error:', error);
      throw error;
    }
  }

  async syncUserData(user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user profile
        await this.createUserProfile(user);
      } else {
        // Update existing user data
        await updateDoc(userRef, {
          email: user.email,
          displayName: user.displayName || userDoc.data().displayName,
          photoURL: user.photoURL || userDoc.data().photoURL,
          emailVerified: user.emailVerified,
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Sync user data error:', error);
    }
  }

  async updateUserProfile(uid, profileData) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  async updateUserLastLogin(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Update last login error:', error);
    }
  }

  async deleteUserData(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Delete user data error:', error);
      throw error;
    }
  }

  async getUserProfile(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  // Get current user (compatible with existing code)
  async getCurrentUser() {
    if (!isFirebaseConfigured() || !auth) {
      console.warn('AuthService: Firebase auth not configured, returning null user');
      return null;
    }
    
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
      const userProfile = await this.getUserProfile(user.uid);
      return {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        name: userProfile?.name || user.displayName || '',
        displayName: user.displayName || userProfile?.name || '',
        photoURL: user.photoURL || userProfile?.photoURL || '',
        role: userProfile?.role || 'user',
        status: userProfile?.status || 'active',
        emailVerified: user.emailVerified,
        createdAt: userProfile?.createdAt,
        updatedAt: userProfile?.updatedAt,
        lastLoginAt: userProfile?.lastLoginAt
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        name: user.displayName || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'user',
        status: 'active',
        emailVerified: user.emailVerified
      };
    }
  }

  // Utility Methods
  isAuthenticated() {
    if (!isFirebaseConfigured() || !auth) {
      return false;
    }
    return !!auth.currentUser;
  }

  async getIdToken(forceRefresh = false) {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  }

  async refreshToken() {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      
      return await user.getIdToken(true);
    } catch (error) {
      console.error('Refresh token error:', error);
      return null;
    }
  }

  // Error handling
  handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/requires-recent-login': 'Please sign in again to complete this action.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
      'auth/popup-blocked': 'Sign-in popup was blocked by the browser.'
    };
    
    return {
      code: error.code,
      message: errorMessages[error.code] || error.message || 'An unexpected error occurred.'
    };
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;

// Export individual methods for convenience
export const {
  register,
  login,
  logout,
  signInWithGoogle,
  signInWithGithub,
  resetPassword,
  changePassword,
  sendEmailVerification,
  updateEmail,
  updateProfile,
  deleteAccount,
  getCurrentUser,
  isAuthenticated,
  getIdToken,
  refreshToken,
  onAuthStateChange,
  getUserProfile
} = authService;
