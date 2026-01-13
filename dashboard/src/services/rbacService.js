/**
 * Role-Based Access Control (RBAC) Service
 * Implements comprehensive role management, permissions, and admin approval workflows
 * Integrates with Firebase Authentication and Firestore
 */

import { getAuthInstance, getDbInstance } from '../config/firebase';
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
  onSnapshot
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';

// Define user roles and their hierarchy
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  CLIENT: 'client',
  MODERATOR: 'moderator',
  AUTHOR: 'author',
  USER: 'user',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  BANNED: 'banned'
};

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: [
    'system:manage',
    'users:create', 'users:read', 'users:update', 'users:delete',
    'content:create', 'content:read', 'content:update', 'content:delete',
    'admin:access', 'admin:manage',
    'roles:assign', 'roles:revoke',
    'settings:manage',
    'analytics:view',
    'audit:view',
    'editor:access', 'client:access',
    'requests:manage'
  ],
  [USER_ROLES.ADMIN]: [
    'users:read', 'users:update',
    'content:create', 'content:read', 'content:update', 'content:delete',
    'admin:access',
    'roles:assign:limited',
    'analytics:view',
    'audit:view',
    'editor:access', 'client:access',
    'requests:manage'
  ],
  [USER_ROLES.EDITOR]: [
    'content:create', 'content:read', 'content:update', 'content:delete',
    'editor:access',
    'requests:read', 'requests:respond',
    'clients:view:assigned',
    'blog:manage'
  ],
  [USER_ROLES.CLIENT]: [
    'client:access',
    'content:read:own',
    'requests:create', 'requests:read:own',
    'progress:view:own'
  ],
  [USER_ROLES.MODERATOR]: [
    'users:read',
    'content:read', 'content:update', 'content:moderate',
    'comments:moderate'
  ],
  [USER_ROLES.AUTHOR]: [
    'content:create', 'content:read', 'content:update:own',
    'profile:update:own'
  ],
  [USER_ROLES.USER]: [
    'content:read',
    'profile:update:own',
    'comments:create'
  ],
  [USER_ROLES.PENDING]: [
    'content:read:limited'
  ],
  [USER_ROLES.SUSPENDED]: [],
  [USER_ROLES.BANNED]: []
};

// Role hierarchy for permission inheritance
const ROLE_HIERARCHY = {
  [USER_ROLES.SUPER_ADMIN]: 100,
  [USER_ROLES.ADMIN]: 80,
  [USER_ROLES.EDITOR]: 65,
  [USER_ROLES.MODERATOR]: 60,
  [USER_ROLES.AUTHOR]: 40,
  [USER_ROLES.CLIENT]: 30,
  [USER_ROLES.USER]: 20,
  [USER_ROLES.PENDING]: 10,
  [USER_ROLES.SUSPENDED]: 0,
  [USER_ROLES.BANNED]: -10
};

class RBACService {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.userPermissions = new Set();
    this.authStateListeners = new Set();
    this.roleChangeListeners = new Set();
    
    // Initialize auth state listener
    this.initializeAuthListener();
  }

  /**
   * Initialize Firebase auth state listener
   */
  initializeAuthListener() {
    const authInstance = getAuthInstance();
    if (!authInstance) {
      console.warn('Firebase auth not available, skipping auth listener initialization');
      return;
    }
    
    onAuthStateChanged(authInstance, async (user) => {
      if (user) {
        await this.loadUserRoleAndPermissions(user);
      } else {
        this.clearUserData();
      }
      
      // Notify listeners
      this.authStateListeners.forEach(listener => listener(user));
    });
  }

  /**
   * Load user role and permissions from Firestore
   */
  async loadUserRoleAndPermissions(user) {
    try {
      this.currentUser = user;
      
      // Get user document from Firestore
      const userDoc = await getDoc(doc(getDbInstance(), 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userRole = userData.role || USER_ROLES.PENDING;
        
        // Load permissions based on role
        this.loadPermissions(this.userRole);
        
        // Check if user needs admin approval
        if (this.userRole === USER_ROLES.PENDING) {
          await this.handlePendingUser(user, userData);
        }
      } else {
        // Create new user document with pending status
        await this.createUserProfile(user);
      }
      
      // Notify role change listeners
      this.roleChangeListeners.forEach(listener => 
        listener(this.userRole, this.userPermissions)
      );
      
    } catch (error) {
      console.error('Error loading user role and permissions:', error);
      this.userRole = USER_ROLES.PENDING;
      this.loadPermissions(USER_ROLES.PENDING);
    }
  }

  /**
   * Create user profile in Firestore
   */
  async createUserProfile(user) {
    try {
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: USER_ROLES.PENDING,
        status: 'pending_approval',
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        metadata: {
          signInProvider: user.providerData[0]?.providerId || 'email',
          ipAddress: null, // Would be set by Cloud Function
          userAgent: navigator.userAgent
        },
        permissions: [],
        approvalStatus: {
          status: 'pending',
          requestedAt: serverTimestamp(),
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
          reason: null
        }
      };
      
      await setDoc(doc(getDbInstance(), 'users', user.uid), userProfile);
      
      this.userRole = USER_ROLES.PENDING;
      this.loadPermissions(USER_ROLES.PENDING);
      
      // Send notification to admins about new user registration
      await this.notifyAdminsOfNewUser(userProfile);
      
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Handle pending user - send email verification if needed
   */
  async handlePendingUser(user, userData) {
    try {
      // Send email verification if not verified
      if (!user.emailVerified && !userData.emailVerificationSent) {
        await sendEmailVerification(user);
        
        // Update user document to mark verification email as sent
        await updateDoc(doc(getDbInstance(), 'users', user.uid), {
          emailVerificationSent: true,
          emailVerificationSentAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error handling pending user:', error);
    }
  }

  /**
   * Load permissions for a given role
   */
  loadPermissions(role) {
    this.userPermissions.clear();
    
    const permissions = ROLE_PERMISSIONS[role] || [];
    permissions.forEach(permission => {
      this.userPermissions.add(permission);
    });
  }

  /**
   * Check if current user has a specific permission
   */
  hasPermission(permission) {
    if (!this.currentUser || !this.userRole) {
      return false;
    }
    
    // Super admin has all permissions
    if (this.userRole === USER_ROLES.SUPER_ADMIN) {
      return true;
    }
    
    return this.userPermissions.has(permission);
  }

  /**
   * Check if current user has a specific role
   */
  hasRole(role) {
    return this.userRole === role;
  }

  /**
   * Check if current user has role with minimum hierarchy level
   */
  hasMinimumRole(role) {
    const currentLevel = ROLE_HIERARCHY[this.userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[role] || 0;
    return currentLevel >= requiredLevel;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Check if user is admin (admin or super admin)
   */
  isAdmin() {
    return this.hasRole(USER_ROLES.ADMIN) || this.hasRole(USER_ROLES.SUPER_ADMIN);
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin() {
    return this.hasRole(USER_ROLES.SUPER_ADMIN);
  }

  /**
   * Check if user account is active
   */
  isActive() {
    return this.userRole && ![USER_ROLES.SUSPENDED, USER_ROLES.BANNED, USER_ROLES.PENDING].includes(this.userRole);
  }

  /**
   * Get current user role
   */
  getCurrentRole() {
    return this.userRole;
  }

  /**
   * Get current user permissions
   */
  getCurrentPermissions() {
    return Array.from(this.userPermissions);
  }

  /**
   * Get current user data
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Admin function: Approve user registration
   */
  async approveUser(userId, approverUid, newRole = USER_ROLES.USER) {
    if (!this.hasPermission('users:update') && !this.hasPermission('roles:assign')) {
      throw new Error('Insufficient permissions to approve users');
    }
    
    try {
      const updateData = {
        role: newRole,
        status: 'active',
        updatedAt: serverTimestamp(),
        'approvalStatus.status': 'approved',
        'approvalStatus.approvedBy': approverUid,
        'approvalStatus.approvedAt': serverTimestamp()
      };
      
      await updateDoc(doc(getDbInstance(), 'users', userId), updateData);
      
      // Log the approval action
      await this.logAdminAction('user_approved', {
        targetUserId: userId,
        newRole,
        approverUid
      });
      
      return { success: true, message: 'User approved successfully' };
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  }

  /**
   * Admin function: Reject user registration
   */
  async rejectUser(userId, approverUid, reason = '') {
    if (!this.hasPermission('users:update')) {
      throw new Error('Insufficient permissions to reject users');
    }
    
    try {
      const updateData = {
        status: 'rejected',
        updatedAt: serverTimestamp(),
        'approvalStatus.status': 'rejected',
        'approvalStatus.rejectedBy': approverUid,
        'approvalStatus.rejectedAt': serverTimestamp(),
        'approvalStatus.reason': reason
      };
      
      await updateDoc(doc(getDbInstance(), 'users', userId), updateData);
      
      // Log the rejection action
      await this.logAdminAction('user_rejected', {
        targetUserId: userId,
        reason,
        approverUid
      });
      
      return { success: true, message: 'User rejected successfully' };
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  }

  /**
   * Admin function: Update user role
   */
  async updateUserRole(userId, newRole, updaterUid) {
    if (!this.hasPermission('roles:assign') && !this.hasPermission('roles:assign:limited')) {
      throw new Error('Insufficient permissions to update user roles');
    }
    
    // Limited role assignment check
    if (this.hasPermission('roles:assign:limited') && !this.hasPermission('roles:assign')) {
      const allowedRoles = [USER_ROLES.USER, USER_ROLES.AUTHOR, USER_ROLES.MODERATOR];
      if (!allowedRoles.includes(newRole)) {
        throw new Error('Insufficient permissions to assign this role');
      }
    }
    
    try {
      const updateData = {
        role: newRole,
        updatedAt: serverTimestamp(),
        'metadata.roleUpdatedBy': updaterUid,
        'metadata.roleUpdatedAt': serverTimestamp()
      };
      
      await updateDoc(doc(getDbInstance(), 'users', userId), updateData);
      
      // Log the role change action
      await this.logAdminAction('role_updated', {
        targetUserId: userId,
        newRole,
        updaterUid
      });
      
      return { success: true, message: 'User role updated successfully' };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Admin function: Suspend user
   */
  async suspendUser(userId, suspenderUid, reason = '', duration = null) {
    if (!this.hasPermission('users:update')) {
      throw new Error('Insufficient permissions to suspend users');
    }
    
    try {
      const updateData = {
        role: USER_ROLES.SUSPENDED,
        status: 'suspended',
        updatedAt: serverTimestamp(),
        suspensionInfo: {
          suspendedBy: suspenderUid,
          suspendedAt: serverTimestamp(),
          reason,
          duration,
          expiresAt: duration ? new Date(Date.now() + duration) : null
        }
      };
      
      await updateDoc(doc(getDbInstance(), 'users', userId), updateData);
      
      // Log the suspension action
      await this.logAdminAction('user_suspended', {
        targetUserId: userId,
        reason,
        duration,
        suspenderUid
      });
      
      return { success: true, message: 'User suspended successfully' };
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  /**
   * Get pending users for admin approval
   */
  async getPendingUsers() {
    if (!this.hasPermission('users:read')) {
      throw new Error('Insufficient permissions to view pending users');
    }
    
    try {
      const q = query(
        collection(getDbInstance(), 'users'),
        where('role', '==', USER_ROLES.PENDING)
      );
      
      const querySnapshot = await getDocs(q);
      const pendingUsers = [];
      
      querySnapshot.forEach((doc) => {
        pendingUsers.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return pendingUsers;
    } catch (error) {
      console.error('Error fetching pending users:', error);
      throw error;
    }
  }

  /**
   * Log admin actions for audit trail
   */
  async logAdminAction(action, details) {
    try {
      const logEntry = {
        action,
        performedBy: this.currentUser.uid,
        performedAt: serverTimestamp(),
        details,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      
      await setDoc(doc(collection(getDbInstance(), 'admin_logs')), logEntry);
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Notify admins of new user registration
   */
  async notifyAdminsOfNewUser(userProfile) {
    try {
      // Get all admin users
      const adminQuery = query(
        collection(getDbInstance(), 'users'),
        where('role', 'in', [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      
      // Create notification for each admin
      const notifications = [];
      adminSnapshot.forEach((doc) => {
        notifications.push({
          recipientId: doc.id,
          type: 'new_user_registration',
          title: 'New User Registration',
          message: `New user ${userProfile.email} has registered and is pending approval.`,
          data: {
            userId: userProfile.uid,
            userEmail: userProfile.email,
            userDisplayName: userProfile.displayName
          },
          read: false,
          createdAt: serverTimestamp()
        });
      });
      
      // Save notifications to Firestore
      for (const notification of notifications) {
        await setDoc(doc(collection(getDbInstance(), 'notifications')), notification);
      }
      
    } catch (error) {
      console.error('Error notifying admins of new user:', error);
    }
  }

  /**
   * Add auth state change listener
   */
  onAuthStateChange(listener) {
    this.authStateListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(listener);
    };
  }

  /**
   * Add role change listener
   */
  onRoleChange(listener) {
    this.roleChangeListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.roleChangeListeners.delete(listener);
    };
  }

  /**
   * Clear user data and sign out
   */
  clearUserData() {
    try {
      const auth = getAuthInstance();
      this.currentUser = null;
      this.userRole = null;
      this.userPermissions.clear();
      
      // Clear any stored data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userPermissions');
      
      // Sign out from Firebase
      return auth.signOut();
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }

  /**
   * Set user role (for demo/testing purposes)
   * In production, this should be handled through proper admin approval
   */
  setUserRole(role) {
    try {
      if (!Object.values(USER_ROLES).includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }
      
      // For demo purposes, temporarily set the role
      this.userRole = role;
      this.loadPermissions(role);
      
      // Store in localStorage for persistence during demo
      localStorage.setItem('demoUserRole', role);
      localStorage.setItem('demoUserPermissions', JSON.stringify(Array.from(this.userPermissions)));
      
      // Notify listeners of role change
      this.roleChangeListeners.forEach(listener => {
        try {
          listener(role, this.userPermissions);
        } catch (error) {
          console.error('Error in role change listener:', error);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  }

  /**
   * Get demo role from localStorage
   */
  getDemoRole() {
    try {
      const demoRole = localStorage.getItem('demoUserRole');
      const demoPermissions = localStorage.getItem('demoUserPermissions');
      
      if (demoRole && demoPermissions) {
        return {
          role: demoRole,
          permissions: JSON.parse(demoPermissions)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting demo role:', error);
      return null;
    }
  }

  /**
   * Middleware function for route protection
   */
  requireAuth() {
    return (req, res, next) => {
      if (!this.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      next();
    };
  }

  /**
   * Middleware function for role-based route protection
   */
  requireRole(requiredRole) {
    return (req, res, next) => {
      if (!this.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      if (!this.hasMinimumRole(requiredRole)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredRole,
          current: this.userRole
        });
      }
      
      next();
    };
  }

  /**
   * Middleware function for permission-based route protection
   */
  requirePermission(permission) {
    return (req, res, next) => {
      if (!this.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      if (!this.hasPermission(permission)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permission,
          current: this.getCurrentPermissions()
        });
      }
      
      next();
    };
  }
}

// Create and export singleton instance
const rbacService = new RBACService();
export default rbacService;

// Export utility functions
export const createRoleGuard = (requiredRole) => {
  return () => {
    if (!rbacService.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    if (!rbacService.hasMinimumRole(requiredRole)) {
      throw new Error(`Insufficient permissions. Required: ${requiredRole}, Current: ${rbacService.getCurrentRole()}`);
    }
    
    return true;
  };
};

export const createPermissionGuard = (permission) => {
  return () => {
    if (!rbacService.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    if (!rbacService.hasPermission(permission)) {
      throw new Error(`Insufficient permissions. Required: ${permission}`);
    }
    
    return true;
  };
};

// React hooks for RBAC
export const useRBAC = () => {
  return {
    currentUser: rbacService.getCurrentUser(),
    currentRole: rbacService.getCurrentRole(),
    permissions: rbacService.getCurrentPermissions(),
    isAuthenticated: rbacService.isAuthenticated(),
    isAdmin: rbacService.isAdmin(),
    isSuperAdmin: rbacService.isSuperAdmin(),
    isActive: rbacService.isActive(),
    hasRole: rbacService.hasRole.bind(rbacService),
    hasPermission: rbacService.hasPermission.bind(rbacService),
    hasMinimumRole: rbacService.hasMinimumRole.bind(rbacService),
    clearUserData: rbacService.clearUserData.bind(rbacService),
    setUserRole: rbacService.setUserRole.bind(rbacService),
    getDemoRole: rbacService.getDemoRole.bind(rbacService)
  };
};