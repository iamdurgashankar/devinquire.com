import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../config/firebase';
import { rbacService } from '../services/rbacService';

// Authentication Context
const AuthContext = createContext({});

// User status constants
const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  BANNED: 'banned'
};

// Enhanced Authentication Provider
export const EnhancedAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize authentication listener
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Load user profile from Firestore
          const profile = await loadUserProfile(firebaseUser.uid);
          setUser(firebaseUser);
          setUserProfile(profile);
          
          // Update last login
          await updateLastLogin(firebaseUser.uid);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Load user profile from Firestore
  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: uid, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (firebaseUser, additionalData = {}) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          status: USER_STATUS.PENDING,
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          loginHistory: [],
          approvedAt: null,
          approvedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
          ...additionalData
        };
        
        await setDoc(userRef, userData);
        
        // Send registration confirmation email
        await sendRegistrationEmail(userData);
        
        // Notify admins about new user
        await notifyAdminsNewUser(userData);
        
        return userData;
      }
      
      return { id: firebaseUser.uid, ...userDoc.data() };
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  // Update last login timestamp
  const updateLastLogin = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const loginEntry = {
        timestamp: new Date().toISOString(),
        ip: 'unknown', // You can implement IP detection
        userAgent: navigator.userAgent
      };
      
      await updateDoc(userRef, {
        lastLogin: loginEntry.timestamp,
        updatedAt: new Date().toISOString(),
        loginHistory: [...(userProfile?.loginHistory || []), loginEntry].slice(-10) // Keep last 10 logins
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  // Send registration confirmation email
  const sendRegistrationEmail = async (userData) => {
    try {
      const sendEmail = httpsCallable(functions, 'sendEmail');
      await sendEmail({
        template: 'registration_confirmation',
        to: userData.email,
        data: {
          displayName: userData.displayName || userData.email,
          email: userData.email,
          registrationDate: new Date(userData.createdAt).toLocaleDateString()
        }
      });
    } catch (error) {
      console.error('Error sending registration email:', error);
    }
  };

  // Notify admins about new user registration
  const notifyAdminsNewUser = async (userData) => {
    try {
      const sendEmail = httpsCallable(functions, 'sendEmail');
      
      // Get admin emails
      const adminsQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['super_admin', 'admin'])
      );
      const adminDocs = await getDocs(adminsQuery);
      const adminEmails = adminDocs.docs.map(doc => doc.data().email);
      
      if (adminEmails.length > 0) {
        await sendEmail({
          template: 'admin_new_user_notification',
          to: adminEmails[0], // Send to first admin, or implement batch sending
          data: {
            newUserName: userData.displayName || userData.email,
            newUserEmail: userData.email,
            registrationDate: new Date(userData.createdAt).toLocaleDateString(),
            dashboardUrl: `${window.location.origin}/admin/users`
          }
        });
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  };

  // Send access denied email
  const sendAccessDeniedEmail = async (email, reason) => {
    try {
      const sendEmail = httpsCallable(functions, 'sendEmail');
      await sendEmail({
        template: 'access_denied',
        to: email,
        data: {
          reason: reason,
          attemptTime: new Date().toLocaleString()
        }
      });
    } catch (error) {
      console.error('Error sending access denied email:', error);
    }
  };

  // Email/Password Registration
  const registerWithEmail = async (email, password, additionalData = {}) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      const profile = await createUserProfile(firebaseUser, additionalData);
      
      setUserProfile(profile);
      return { user: firebaseUser, profile };
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Login
  const loginWithEmail = async (email, password) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const profile = await loadUserProfile(firebaseUser.uid);
      
      // Check approval status
      if (profile && profile.status !== USER_STATUS.APPROVED) {
        await sendAccessDeniedEmail(email, profile.status);
        await signOut(auth);
        throw new Error(`Access denied: Account is ${profile.status}`);
      }
      
      setUserProfile(profile);
      return { user: firebaseUser, profile };
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Registration
  const registerWithGoogle = async (additionalData = {}) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const provider = new GoogleAuthProvider();
      const { user: firebaseUser } = await signInWithPopup(auth, provider);
      const profile = await createUserProfile(firebaseUser, additionalData);
      
      setUserProfile(profile);
      return { user: firebaseUser, profile };
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login
  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const provider = new GoogleAuthProvider();
      const { user: firebaseUser } = await signInWithPopup(auth, provider);
      
      // Check if user exists in our database
      const profile = await loadUserProfile(firebaseUser.uid);
      if (!profile) {
        await signOut(auth);
        throw new Error('User not registered. Please register first.');
      }
      
      // Check approval status
      if (profile.status !== USER_STATUS.APPROVED) {
        await sendAccessDeniedEmail(firebaseUser.email, profile.status);
        await signOut(auth);
        throw new Error(`Access denied: Account is ${profile.status}`);
      }
      
      setUserProfile(profile);
      return { user: firebaseUser, profile };
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // GitHub OAuth Registration
  const registerWithGitHub = async (additionalData = {}) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const provider = new GithubAuthProvider();
      const { user: firebaseUser } = await signInWithPopup(auth, provider);
      const profile = await createUserProfile(firebaseUser, additionalData);
      
      setUserProfile(profile);
      return { user: firebaseUser, profile };
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // GitHub OAuth Login
  const loginWithGitHub = async () => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const provider = new GithubAuthProvider();
      const { user: firebaseUser } = await signInWithPopup(auth, provider);
      
      // Check if user exists in our database
      const profile = await loadUserProfile(firebaseUser.uid);
      if (!profile) {
        await signOut(auth);
        throw new Error('User not registered. Please register first.');
      }
      
      // Check approval status
      if (profile.status !== USER_STATUS.APPROVED) {
        await sendAccessDeniedEmail(firebaseUser.email, profile.status);
        await signOut(auth);
        throw new Error(`Access denied: Account is ${profile.status}`);
      }
      
      setUserProfile(profile);
      return { user: firebaseUser, profile };
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setAuthError(null);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  // Check if user is authenticated and approved
  const isAuthenticated = () => {
    return user && userProfile && userProfile.status === USER_STATUS.APPROVED;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return userProfile && rbacService.hasRole(userProfile, role);
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return userProfile && rbacService.hasAnyRole(userProfile, roles);
  };

  const value = {
    user,
    userProfile,
    loading,
    authError,
    registerWithEmail,
    loginWithEmail,
    registerWithGoogle,
    loginWithGoogle,
    registerWithGitHub,
    loginWithGitHub,
    logout,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    USER_STATUS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use authentication context
export const useEnhancedAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};

// Enhanced Protected Route Component
export const EnhancedProtectedRoute = ({ children, requiredRole = null, requiredRoles = null }) => {
  const { user, userProfile, loading, isAuthenticated, hasRole, hasAnyRole } = useEnhancedAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginRequired />;
  }

  if (!userProfile) {
    return <ProfileNotFound />;
  }

  // Check approval status
  switch (userProfile.status) {
    case USER_STATUS.PENDING:
      return <PendingApprovalMessage />;
    case USER_STATUS.REJECTED:
      return <RejectedAccountMessage reason={userProfile.rejectionReason} />;
    case USER_STATUS.SUSPENDED:
      return <SuspendedAccountMessage />;
    case USER_STATUS.BANNED:
      return <BannedAccountMessage />;
    case USER_STATUS.APPROVED:
      break;
    default:
      return <UnknownStatusMessage status={userProfile.status} />;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return <UnauthorizedMessage requiredRole={requiredRole} />;
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <UnauthorizedMessage requiredRoles={requiredRoles} />;
  }

  return children;
};

// Status Message Components
const LoginRequired = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
      <p className="text-gray-600 mb-6">Please log in to access this page.</p>
      <button 
        onClick={() => window.location.href = '/login'}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
      >
        Go to Login
      </button>
    </div>
  </div>
);

const ProfileNotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
      <p className="text-gray-600 mb-6">Your user profile could not be loaded. Please contact support.</p>
      <button 
        onClick={() => window.location.href = '/support'}
        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200"
      >
        Contact Support
      </button>
    </div>
  </div>
);

const PendingApprovalMessage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
      <p className="text-gray-600 mb-6">
        Your account is currently under review. You'll receive an email notification once your account has been approved by an administrator.
      </p>
      <div className="space-y-3">
        <button 
          onClick={() => window.location.href = '/logout'}
          className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
        >
          Logout
        </button>
        <button 
          onClick={() => window.location.href = '/support'}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Contact Support
        </button>
      </div>
    </div>
  </div>
);

const RejectedAccountMessage = ({ reason }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Registration Declined</h2>
      <p className="text-gray-600 mb-4">
        Unfortunately, your account registration has been declined.
      </p>
      {reason && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800 text-sm">
            <strong>Reason:</strong> {reason}
          </p>
        </div>
      )}
      <div className="space-y-3">
        <button 
          onClick={() => window.location.href = '/register'}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Register Again
        </button>
        <button 
          onClick={() => window.location.href = '/support'}
          className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
        >
          Contact Support
        </button>
      </div>
    </div>
  </div>
);

const SuspendedAccountMessage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Suspended</h2>
      <p className="text-gray-600 mb-6">
        Your account has been temporarily suspended. Please contact support for more information.
      </p>
      <button 
        onClick={() => window.location.href = '/support'}
        className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition duration-200"
      >
        Contact Support
      </button>
    </div>
  </div>
);

const BannedAccountMessage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Banned</h2>
      <p className="text-gray-600 mb-6">
        Your account has been permanently banned. If you believe this is an error, please contact support.
      </p>
      <button 
        onClick={() => window.location.href = '/support'}
        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200"
      >
        Contact Support
      </button>
    </div>
  </div>
);

const UnauthorizedMessage = ({ requiredRole, requiredRoles }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
      <p className="text-gray-600 mb-4">
        You don't have permission to access this page.
      </p>
      {requiredRole && (
        <p className="text-sm text-gray-500 mb-6">
          Required role: <span className="font-semibold">{requiredRole}</span>
        </p>
      )}
      {requiredRoles && (
        <p className="text-sm text-gray-500 mb-6">
          Required roles: <span className="font-semibold">{requiredRoles.join(', ')}</span>
        </p>
      )}
      <button 
        onClick={() => window.history.back()}
        className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
      >
        Go Back
      </button>
    </div>
  </div>
);

const UnknownStatusMessage = ({ status }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Unknown Account Status</h2>
      <p className="text-gray-600 mb-4">
        Your account has an unknown status: <span className="font-semibold">{status}</span>
      </p>
      <p className="text-gray-600 mb-6">
        Please contact support for assistance.
      </p>
      <button 
        onClick={() => window.location.href = '/support'}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
      >
        Contact Support
      </button>
    </div>
  </div>
);

export default EnhancedAuthProvider;