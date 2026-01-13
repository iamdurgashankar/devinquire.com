import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  sendEmailVerification,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getAuthInstance, getDbInstance, getFunctionsInstance } from '../config/firebase';
import { rbacService } from './rbacService';
import toast from 'react-hot-toast';

class EnhancedAuthService {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.authStateListeners = [];
    this.initializeAuthListener();
  }

  // Initialize authentication state listener
  initializeAuthListener() {
    if (getAuthInstance()) {
      return onAuthStateChanged(getAuthInstance(), async (user) => {
        this.currentUser = user;
        
        if (user) {
          try {
            // Load user profile and check approval status
            await this.loadUserProfile(user.uid);
            
            // Notify listeners
            this.authStateListeners.forEach(listener => {
              listener(user, this.userProfile);
            });
          } catch (error) {
            console.error('Error loading user profile:', error);
            this.handleAuthError(error);
          }
        } else {
          this.userProfile = null;
          this.authStateListeners.forEach(listener => {
            listener(null, null);
          });
        }
      });
    }
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Load user profile from Firestore
  async loadUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(getDbInstance(), 'users', userId));
      
      if (userDoc.exists()) {
        this.userProfile = { id: userId, ...userDoc.data() };
        return this.userProfile;
      } else {
        // Create profile for existing Firebase user without profile
        await this.createUserProfile(userId);
        return this.userProfile;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  }

  // Create user profile in Firestore
  async createUserProfile(userId, additionalData = {}) {
    try {
      const user = this.currentUser || auth.currentUser;
      if (!user) throw new Error('No authenticated user found');

      const profileData = {
        email: user.email,
        displayName: user.displayName || additionalData.displayName || '',
        photoURL: user.photoURL || '',
        role: 'PENDING',
        status: 'pending',
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        approvalStatus: {
          status: 'pending',
          requestedAt: serverTimestamp(),
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
          rejectionReason: null
        },
        loginHistory: [],
        lastLoginAt: null,
        registrationMethod: additionalData.registrationMethod || 'email',
        ...additionalData
      };

      await setDoc(doc(getDbInstance(), 'users', userId), profileData);
      this.userProfile = { id: userId, ...profileData };

      // Send registration confirmation email
      await this.sendRegistrationConfirmation(user.email, user.displayName);
      
      // Notify admin of new registration
      await this.notifyAdminOfNewRegistration(userId, profileData);

      return this.userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Email/Password Registration
  async registerWithEmail(email, password, displayName) {
    try {
      // Check if user already exists
      const existingUser = await this.checkUserExists(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(getAuthInstance(), email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Create user profile
      await this.createUserProfile(user.uid, {
        displayName,
        registrationMethod: 'email'
      });

      toast.success('Registration successful! Please check your email for verification.');
      
      return {
        success: true,
        user: user,
        profile: this.userProfile,
        message: 'Registration successful. Please verify your email and wait for admin approval.'
      };
    } catch (error) {
      console.error('Registration error:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  // Email/Password Login
  async loginWithEmail(email, password) {
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(getAuthInstance(), email, password);
      const user = userCredential.user;

      // Check registration and approval status
      const loginResult = await this.validateUserAccess(user.uid);
      
      if (!loginResult.canAccess) {
        // Sign out the user if they can't access
        await firebaseSignOut(auth);
        
        // Send appropriate notification email
        await this.sendAccessDeniedEmail(user.email, loginResult.reason);
        
        throw new Error(loginResult.message);
      }

      // Update login history
      await this.updateLoginHistory(user.uid);

      toast.success('Login successful!');
      
      return {
        success: true,
        user: user,
        profile: this.userProfile
      };
    } catch (error) {
      console.error('Login error:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  // Google OAuth Login
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const userCredential = await signInWithPopup(getAuthInstance(), provider);
      const user = userCredential.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(getDbInstance(), 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New user - create profile and require approval
        await this.createUserProfile(user.uid, {
          registrationMethod: 'google'
        });
        
        // Sign out and require approval
        await firebaseSignOut(auth);
        throw new Error('Account created successfully. Please wait for admin approval before accessing the dashboard.');
      }

      // Existing user - validate access
      const loginResult = await this.validateUserAccess(user.uid);
      
      if (!loginResult.canAccess) {
        await firebaseSignOut(auth);
        await this.sendAccessDeniedEmail(user.email, loginResult.reason);
        throw new Error(loginResult.message);
      }

      await this.updateLoginHistory(user.uid);
      toast.success('Login successful!');
      
      return {
        success: true,
        user: user,
        profile: this.userProfile
      };
    } catch (error) {
      console.error('Google login error:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  // GitHub OAuth Login
  async loginWithGitHub() {
    try {
      const provider = new GithubAuthProvider();
      provider.addScope('user:email');

      const userCredential = await signInWithPopup(getAuthInstance(), provider);
      const user = userCredential.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(getDbInstance(), 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New user - create profile and require approval
        await this.createUserProfile(user.uid, {
          registrationMethod: 'github'
        });
        
        // Sign out and require approval
        await firebaseSignOut(auth);
        throw new Error('Account created successfully. Please wait for admin approval before accessing the dashboard.');
      }

      // Existing user - validate access
      const loginResult = await this.validateUserAccess(user.uid);
      
      if (!loginResult.canAccess) {
        await firebaseSignOut(auth);
        await this.sendAccessDeniedEmail(user.email, loginResult.reason);
        throw new Error(loginResult.message);
      }

      await this.updateLoginHistory(user.uid);
      toast.success('Login successful!');
      
      return {
        success: true,
        user: user,
        profile: this.userProfile
      };
    } catch (error) {
      console.error('GitHub login error:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  // Validate user access based on approval status
  async validateUserAccess(userId) {
    try {
      const userDoc = await getDoc(doc(getDbInstance(), 'users', userId));
      
      if (!userDoc.exists()) {
        return {
          canAccess: false,
          reason: 'unregistered',
          message: 'User not found. Please register first.'
        };
      }

      const userData = userDoc.data();
      const approvalStatus = userData.approvalStatus?.status || 'pending';
      const userStatus = userData.status || 'pending';

      // Check if user is suspended or banned
      if (userStatus === 'suspended') {
        return {
          canAccess: false,
          reason: 'suspended',
          message: 'Your account has been suspended. Please contact support.'
        };
      }

      if (userStatus === 'banned') {
        return {
          canAccess: false,
          reason: 'banned',
          message: 'Your account has been banned. Please contact support.'
        };
      }

      // Check approval status
      if (approvalStatus === 'pending') {
        return {
          canAccess: false,
          reason: 'pending_approval',
          message: 'Your account is pending admin approval. You will receive an email once approved.'
        };
      }

      if (approvalStatus === 'rejected') {
        const rejectionReason = userData.approvalStatus?.rejectionReason || 'No reason provided';
        return {
          canAccess: false,
          reason: 'rejected',
          message: `Your account was rejected. Reason: ${rejectionReason}`
        };
      }

      if (approvalStatus === 'approved') {
        return {
          canAccess: true,
          reason: 'approved',
          message: 'Access granted'
        };
      }

      return {
        canAccess: false,
        reason: 'unknown',
        message: 'Unknown account status. Please contact support.'
      };
    } catch (error) {
      console.error('Error validating user access:', error);
      return {
        canAccess: false,
        reason: 'error',
        message: 'Error validating account. Please try again.'
      };
    }
  }

  // Check if user exists by email
  async checkUserExists(email) {
    try {
      const usersRef = collection(getDbInstance(), 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  // Update login history
  async updateLoginHistory(userId) {
    try {
      const userRef = doc(getDbInstance(), 'users', userId);
      const loginEntry = {
        timestamp: serverTimestamp(),
        ip: await this.getUserIP(),
        userAgent: navigator.userAgent
      };

      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        'loginHistory': [...(this.userProfile?.loginHistory || []), loginEntry].slice(-10) // Keep last 10 logins
      });
    } catch (error) {
      console.error('Error updating login history:', error);
    }
  }

  // Get user IP address
  async getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // Send registration confirmation email
  async sendRegistrationConfirmation(email, displayName) {
    try {
      const sendEmail = httpsCallable(getFunctionsInstance(), 'sendEmail');
      
      await sendEmail({
        type: 'registration_confirmation',
        to: email,
        data: {
          displayName: displayName || 'User',
          email: email
        }
      });
    } catch (error) {
      console.error('Error sending registration confirmation:', error);
    }
  }

  // Notify admin of new registration
  async notifyAdminOfNewRegistration(userId, userData) {
    try {
      // Get admin emails
      const adminEmails = await this.getAdminEmails();
      
      if (adminEmails.length === 0) {
        console.warn('No admin emails found for notification');
        return;
      }

      const sendEmail = httpsCallable(getFunctionsInstance(), 'sendEmail');
      
      for (const adminEmail of adminEmails) {
        await sendEmail({
          type: 'admin_new_user_notification',
          to: adminEmail,
          data: {
            userId: userId,
            userEmail: userData.email,
            displayName: userData.displayName,
            registrationMethod: userData.registrationMethod,
            registrationDate: new Date().toISOString()
          }
        });
      }

      // Log admin notification
      await addDoc(collection(getDbInstance(), 'adminActions'), {
        type: 'new_user_notification',
        userId: userId,
        adminEmails: adminEmails,
        timestamp: serverTimestamp(),
        details: {
          userEmail: userData.email,
          registrationMethod: userData.registrationMethod
        }
      });
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  }

  // Send access denied email
  async sendAccessDeniedEmail(email, reason) {
    try {
      const sendEmail = httpsCallable(getFunctionsInstance(), 'sendEmail');
      
      await sendEmail({
        type: 'access_denied',
        to: email,
        data: {
          reason: reason,
          email: email
        }
      });
    } catch (error) {
      console.error('Error sending access denied email:', error);
    }
  }

  // Get admin emails
  async getAdminEmails() {
    try {
      const usersRef = collection(getDbInstance(), 'users');
      const adminQuery = query(
        usersRef, 
        where('role', 'in', ['ADMIN', 'SUPER_ADMIN'])
      );
      
      const querySnapshot = await getDocs(adminQuery);
      const adminEmails = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.email && userData.status === 'active') {
          adminEmails.push(userData.email);
        }
      });
      
      return adminEmails;
    } catch (error) {
      console.error('Error getting admin emails:', error);
      return [];
    }
  }

  // Sign out
  async signOut() {
    try {
      await firebaseSignOut(getAuthInstance());
      this.currentUser = null;
      this.userProfile = null;
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Handle authentication errors
  handleAuthError(error) {
    let message = 'An authentication error occurred';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/email-already-in-use':
        message = 'An account already exists with this email';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in popup was closed';
        break;
      case 'auth/cancelled-popup-request':
        message = 'Sign-in was cancelled';
        break;
      default:
        message = error.message || message;
    }
    
    toast.error(message);
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get user profile
  getUserProfile() {
    return this.userProfile;
  }

  // Check if user is authenticated and approved
  isAuthenticated() {
    return this.currentUser && this.userProfile?.approvalStatus?.status === 'approved';
  }

  // Check if user has specific role
  hasRole(role) {
    return this.userProfile?.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    return roles.includes(this.userProfile?.role);
  }

  // Middleware for route protection
  requireAuth() {
    return (req, res, next) => {
      if (!this.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      next();
    };
  }

  // Middleware for admin access
  requireAdmin() {
    return (req, res, next) => {
      if (!this.hasAnyRole(['ADMIN', 'SUPER_ADMIN'])) {
        throw new Error('Admin access required');
      }
      next();
    };
  }
}

// Create singleton instance
export const enhancedAuthService = new EnhancedAuthService();
export default enhancedAuthService;