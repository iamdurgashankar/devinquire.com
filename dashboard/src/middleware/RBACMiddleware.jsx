/**
 * RBAC Middleware Components for React
 * Provides route protection and access control based on roles and permissions
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import rbacService, { USER_ROLES } from '../services/rbacService';

// RBAC Context
const RBACContext = createContext(null);

/**
 * RBAC Provider Component
 * Wraps the application to provide RBAC context
 */
export const RBACProvider = ({ children }) => {
  const [rbacState, setRbacState] = useState({
    currentUser: null,
    currentRole: null,
    permissions: [],
    isAuthenticated: false,
    isAdmin: false,
    isSuperAdmin: false,
    isActive: false,
    loading: true
  });

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribeAuth = rbacService.onAuthStateChange((user) => {
      updateRBACState();
    });

    // Subscribe to role changes
    const unsubscribeRole = rbacService.onRoleChange((role, permissions) => {
      updateRBACState();
    });

    // Initial state update
    updateRBACState();

    return () => {
      unsubscribeAuth();
      unsubscribeRole();
    };
  }, []);

  const updateRBACState = () => {
    setRbacState({
      currentUser: rbacService.getCurrentUser(),
      currentRole: rbacService.getCurrentRole(),
      permissions: rbacService.getCurrentPermissions(),
      isAuthenticated: rbacService.isAuthenticated(),
      isAdmin: rbacService.isAdmin(),
      isSuperAdmin: rbacService.isSuperAdmin(),
      isActive: rbacService.isActive(),
      loading: false
    });
  };

  const contextValue = {
    ...rbacState,
    hasRole: rbacService.hasRole.bind(rbacService),
    hasPermission: rbacService.hasPermission.bind(rbacService),
    hasMinimumRole: rbacService.hasMinimumRole.bind(rbacService),
    approveUser: rbacService.approveUser.bind(rbacService),
    rejectUser: rbacService.rejectUser.bind(rbacService),
    updateUserRole: rbacService.updateUserRole.bind(rbacService),
    suspendUser: rbacService.suspendUser.bind(rbacService),
    getPendingUsers: rbacService.getPendingUsers.bind(rbacService)
  };

  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  );
};

/**
 * Hook to use RBAC context
 */
export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 */
export const ProtectedRoute = ({ children, fallback = '/login' }) => {
  const { isAuthenticated, loading } = useRBAC();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallback} state={{ from: location }} replace />;
  }

  return children;
};

/**
 * Role-based Route Protection
 * Redirects if user doesn't have required role
 */
export const RoleProtectedRoute = ({ 
  children, 
  requiredRole, 
  fallback = '/unauthorized',
  exact = false 
}) => {
  const { isAuthenticated, hasRole, hasMinimumRole, loading } = useRBAC();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRequiredRole = exact ? hasRole(requiredRole) : hasMinimumRole(requiredRole);
  
  if (!hasRequiredRole) {
    return <Navigate to={fallback} replace />;
  }

  return children;
};

/**
 * Permission-based Route Protection
 * Redirects if user doesn't have required permission
 */
export const PermissionProtectedRoute = ({ 
  children, 
  requiredPermission, 
  fallback = '/unauthorized' 
}) => {
  const { isAuthenticated, hasPermission, loading } = useRBAC();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasPermission(requiredPermission)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
};

/**
 * Admin Route Protection
 * Redirects if user is not admin
 */
export const AdminRoute = ({ children, fallback = '/unauthorized' }) => {
  return (
    <RoleProtectedRoute requiredRole={USER_ROLES.ADMIN} fallback={fallback}>
      {children}
    </RoleProtectedRoute>
  );
};

/**
 * Super Admin Route Protection
 * Redirects if user is not super admin
 */
export const SuperAdminRoute = ({ children, fallback = '/unauthorized' }) => {
  return (
    <RoleProtectedRoute requiredRole={USER_ROLES.SUPER_ADMIN} fallback={fallback} exact>
      {children}
    </RoleProtectedRoute>
  );
};

/**
 * Active User Route Protection
 * Redirects if user account is not active (suspended, banned, pending)
 */
export const ActiveUserRoute = ({ children, fallback = '/account-inactive' }) => {
  const { isAuthenticated, isActive, loading } = useRBAC();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isActive) {
    return <Navigate to={fallback} replace />;
  }

  return children;
};

/**
 * Conditional Render Component
 * Renders children only if user has required role
 */
export const RoleGuard = ({ 
  children, 
  requiredRole, 
  fallback = null, 
  exact = false 
}) => {
  const { hasRole, hasMinimumRole } = useRBAC();
  
  const hasRequiredRole = exact ? hasRole(requiredRole) : hasMinimumRole(requiredRole);
  
  return hasRequiredRole ? children : fallback;
};

/**
 * Conditional Render Component
 * Renders children only if user has required permission
 */
export const PermissionGuard = ({ 
  children, 
  requiredPermission, 
  fallback = null 
}) => {
  const { hasPermission } = useRBAC();
  
  return hasPermission(requiredPermission) ? children : fallback;
};

/**
 * Admin Guard Component
 * Renders children only if user is admin
 */
export const AdminGuard = ({ children, fallback = null }) => {
  return (
    <RoleGuard requiredRole={USER_ROLES.ADMIN} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

/**
 * Super Admin Guard Component
 * Renders children only if user is super admin
 */
export const SuperAdminGuard = ({ children, fallback = null }) => {
  return (
    <RoleGuard requiredRole={USER_ROLES.SUPER_ADMIN} fallback={fallback} exact>
      {children}
    </RoleGuard>
  );
};

/**
 * Authentication Guard Component
 * Renders children only if user is authenticated
 */
export const AuthGuard = ({ children, fallback = null }) => {
  const { isAuthenticated } = useRBAC();
  
  return isAuthenticated ? children : fallback;
};

/**
 * Active User Guard Component
 * Renders children only if user account is active
 */
export const ActiveUserGuard = ({ children, fallback = null }) => {
  const { isActive } = useRBAC();
  
  return isActive ? children : fallback;
};

/**
 * Pending Approval Component
 * Shows pending approval message for users awaiting admin approval
 */
export const PendingApprovalMessage = () => {
  const { currentRole, currentUser } = useRBAC();
  
  if (currentRole !== USER_ROLES.PENDING) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Account Pending Approval
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Your account is currently pending admin approval. You'll receive an email notification once your account has been reviewed and approved.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Email:</strong> {currentUser?.email}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Status:</strong> Pending Approval
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Account Suspended Component
 * Shows suspension message for suspended users
 */
export const AccountSuspendedMessage = () => {
  const { currentRole } = useRBAC();
  
  if (currentRole !== USER_ROLES.SUSPENDED) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Account Suspended
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Your account has been suspended. Please contact support for more information.
          </p>
          <div className="mt-6">
            <a
              href="mailto:support@devinquire.com"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Unauthorized Access Component
 * Shows unauthorized message for insufficient permissions
 */
export const UnauthorizedMessage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Access Denied
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to access this resource.
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.history.back()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  RBACProvider,
  useRBAC,
  ProtectedRoute,
  RoleProtectedRoute,
  PermissionProtectedRoute,
  AdminRoute,
  SuperAdminRoute,
  ActiveUserRoute,
  RoleGuard,
  PermissionGuard,
  AdminGuard,
  SuperAdminGuard,
  AuthGuard,
  ActiveUserGuard,
  PendingApprovalMessage,
  AccountSuspendedMessage,
  UnauthorizedMessage
};