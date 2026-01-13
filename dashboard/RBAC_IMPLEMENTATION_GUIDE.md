# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing and using the Role-Based Access Control (RBAC) system in your Firebase-powered application. The RBAC system provides secure, scalable user management with granular permissions and admin approval workflows.

## 🏗️ Architecture Overview

The RBAC system consists of several key components:

### Core Components

1. **RBACService** (`src/services/rbacService.js`) - Core service handling all RBAC operations
2. **RBACMiddleware** (`src/middleware/RBACMiddleware.jsx`) - React components for route protection
3. **UserApprovalDashboard** (`src/components/admin/UserApprovalDashboard.jsx`) - Admin interface for user management
4. **Firestore Security Rules** (`firestore.rules`) - Database-level security
5. **Storage Security Rules** (`storage.rules`) - File storage security
6. **Firebase Configuration** (`src/config/firebase.js`) - Enhanced with RBAC settings

### User Roles Hierarchy

```
SUPER_ADMIN (Level 100)
├── ADMIN (Level 80)
│   ├── MODERATOR (Level 60)
│   │   ├── AUTHOR (Level 40)
│   │   │   ├── USER (Level 20)
│   │   │   └── PENDING (Level 0)
│   │   └── SUSPENDED/BANNED (Inactive)
```

## 🚀 Quick Start

### 1. Environment Configuration

Add these environment variables to your `.env.local` file:

```bash
# RBAC Configuration
REACT_APP_REQUIRE_USER_APPROVAL=true
REACT_APP_REQUIRE_EMAIL_VERIFICATION=true
REACT_APP_DEFAULT_USER_ROLE=PENDING
REACT_APP_ADMIN_EMAIL=your-admin@example.com
```

### 2. Firebase Setup

#### Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

#### Initialize Collections

The system will automatically create necessary collections, but you can pre-populate them:

```javascript
// Create your first super admin user
import { rbacService } from './src/services/rbacService';

// After authentication
const createSuperAdmin = async (userId) => {
  await rbacService.updateUserRole(userId, 'SUPER_ADMIN', 'system');
};
```

### 3. Integration in Your App

#### Wrap Your App with RBAC Provider

```jsx
// src/App.js
import React from 'react';
import { RBACProvider } from './middleware/RBACMiddleware';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <RBACProvider>
      <div className="App">
        {/* Your app content */}
        <Toaster position="top-right" />
      </div>
    </RBACProvider>
  );
}

export default App;
```

#### Protect Routes

```jsx
// src/components/Routes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  ProtectedRoute,
  AdminRoute,
  RoleProtectedRoute,
  PermissionProtectedRoute
} from '../middleware/RBACMiddleware';

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* Admin only routes */}
      <Route path="/admin/*" element={
        <AdminRoute>
          <AdminPanel />
        </AdminRoute>
      } />
      
      {/* Role-based routes */}
      <Route path="/create-post" element={
        <RoleProtectedRoute allowedRoles={['AUTHOR', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']}>
          <CreatePost />
        </RoleProtectedRoute>
      } />
      
      {/* Permission-based routes */}
      <Route path="/moderate" element={
        <PermissionProtectedRoute requiredPermissions={['content:moderate']}>
          <ModerationPanel />
        </PermissionProtectedRoute>
      } />
    </Routes>
  );
}
```

#### Use RBAC Hooks

```jsx
// src/components/UserProfile.jsx
import React from 'react';
import { useRBAC } from '../middleware/RBACMiddleware';

function UserProfile() {
  const { 
    currentUser, 
    userRole, 
    hasRole, 
    hasPermission, 
    isLoading 
  } = useRBAC();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {currentUser?.displayName}</h1>
      <p>Your role: {userRole}</p>
      
      {hasRole('ADMIN') && (
        <button>Admin Panel</button>
      )}
      
      {hasPermission('content:write') && (
        <button>Create Content</button>
      )}
    </div>
  );
}
```

## 🔐 User Management

### Admin Approval Workflow

1. **User Registration**: New users are created with `PENDING` status
2. **Email Verification**: Users must verify their email (optional)
3. **Admin Review**: Admins review pending users in the approval dashboard
4. **Approval/Rejection**: Admins can approve users with specific roles or reject them
5. **Notification**: Users are notified of approval/rejection status

### Using the User Approval Dashboard

```jsx
// src/pages/AdminPage.jsx
import React from 'react';
import UserApprovalDashboard from '../components/admin/UserApprovalDashboard';
import { AdminRoute } from '../middleware/RBACMiddleware';

function AdminPage() {
  return (
    <AdminRoute>
      <div>
        <h1>Admin Panel</h1>
        <UserApprovalDashboard />
      </div>
    </AdminRoute>
  );
}
```

### Programmatic User Management

```javascript
import { useRBAC } from '../middleware/RBACMiddleware';

function useUserManagement() {
  const { 
    approveUser, 
    rejectUser, 
    updateUserRole, 
    suspendUser, 
    getPendingUsers 
  } = useRBAC();

  const handleApproveUser = async (userId, role = 'USER') => {
    try {
      await approveUser(userId, 'admin-user-id', role);
      console.log('User approved successfully');
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const handleSuspendUser = async (userId, reason) => {
    try {
      await suspendUser(userId, 'admin-user-id', reason);
      console.log('User suspended successfully');
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  return {
    handleApproveUser,
    handleSuspendUser,
    // ... other functions
  };
}
```

## 🛡️ Security Features

### Firestore Security Rules

The security rules implement:

- **Role-based read/write access** to collections
- **Owner-based access** for user-generated content
- **Admin-only access** to sensitive operations
- **Audit logging** for administrative actions
- **Input validation** for data integrity

### Storage Security Rules

The storage rules provide:

- **File type validation** (images, documents, videos)
- **File size limits** based on content type
- **User-based access control** for uploads
- **Admin override capabilities**
- **Temporary file cleanup**

### Session Management

```javascript
// Automatic session validation
import { rbacService } from './services/rbacService';

// Initialize session monitoring
rbacService.initializeAuthListener();

// Manual session validation
const validateSession = async () => {
  const isValid = await rbacService.validateUserSession();
  if (!isValid) {
    // Redirect to login
    window.location.href = '/login';
  }
};
```

## 🎨 UI Components

### Conditional Rendering Guards

```jsx
import { AdminGuard, RoleGuard, PermissionGuard } from '../middleware/RBACMiddleware';

function MyComponent() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <AdminGuard>
        <button>Admin Only Button</button>
      </AdminGuard>
      
      <RoleGuard allowedRoles={['AUTHOR', 'MODERATOR']}>
        <button>Create Content</button>
      </RoleGuard>
      
      <PermissionGuard requiredPermissions={['users:read']}>
        <UserList />
      </PermissionGuard>
    </div>
  );
}
```

### Status Messages

```jsx
import { PendingApprovalMessage, SuspendedAccountMessage } from '../middleware/RBACMiddleware';

function AuthWrapper({ children }) {
  const { userStatus } = useRBAC();
  
  if (userStatus === 'pending') {
    return <PendingApprovalMessage />;
  }
  
  if (userStatus === 'suspended') {
    return <SuspendedAccountMessage />;
  }
  
  return children;
}
```

## 📊 Analytics and Monitoring

### Admin Action Logging

All administrative actions are automatically logged:

```javascript
// Automatic logging for:
// - User role changes
// - User approvals/rejections
// - User suspensions
// - Permission grants/revokes

// View logs in Firestore collection: adminActions
```

### User Activity Monitoring

```javascript
// Monitor user sessions
const monitorUserActivity = () => {
  rbacService.onUserStatusChange((user, status) => {
    console.log(`User ${user.uid} status changed to: ${status}`);
    
    // Send notifications, update UI, etc.
  });
};
```

## 🔧 Customization

### Adding Custom Roles

1. Update `rbacService.js`:

```javascript
export const USER_ROLES = {
  // ... existing roles
  CUSTOM_ROLE: 'CUSTOM_ROLE',
};

export const ROLE_PERMISSIONS = {
  // ... existing permissions
  [USER_ROLES.CUSTOM_ROLE]: [
    'custom:permission1',
    'custom:permission2',
  ],
};

export const ROLE_HIERARCHY = {
  // ... existing hierarchy
  [USER_ROLES.CUSTOM_ROLE]: 30, // Set appropriate level
};
```

2. Update Firebase configuration:

```javascript
// src/config/firebase.js
rbac: {
  roles: {
    // ... existing roles
    CUSTOM_ROLE: {
      level: 30,
      permissions: ['custom:permission1', 'custom:permission2'],
      canAssignRoles: [],
      canDeleteUsers: false,
    },
  },
},
```

3. Update Firestore security rules:

```javascript
// firestore.rules
function hasCustomRole() {
  return hasRole('CUSTOM_ROLE');
}

// Add custom access rules
match /customCollection/{docId} {
  allow read, write: if hasCustomRole();
}
```

### Custom Permissions

```javascript
// Define custom permissions
export const CUSTOM_PERMISSIONS = {
  MANAGE_INVENTORY: 'inventory:manage',
  VIEW_REPORTS: 'reports:view',
  EXPORT_DATA: 'data:export',
};

// Use in components
const { hasPermission } = useRBAC();

if (hasPermission(CUSTOM_PERMISSIONS.MANAGE_INVENTORY)) {
  // Show inventory management UI
}
```

## 🚨 Error Handling

### Common Error Scenarios

```javascript
// Handle RBAC errors
import { rbacService } from './services/rbacService';

try {
  await rbacService.updateUserRole(userId, newRole, adminId);
} catch (error) {
  switch (error.code) {
    case 'rbac/insufficient-permissions':
      toast.error('You do not have permission to perform this action');
      break;
    case 'rbac/user-not-found':
      toast.error('User not found');
      break;
    case 'rbac/invalid-role':
      toast.error('Invalid role specified');
      break;
    default:
      toast.error('An unexpected error occurred');
  }
}
```

### Debugging

```javascript
// Enable debug mode
process.env.REACT_APP_RBAC_DEBUG = 'true';

// Check RBAC status
const debugRBAC = () => {
  console.log('RBAC Status:', {
    currentUser: rbacService.getCurrentUser(),
    userRole: rbacService.getUserRole(),
    permissions: rbacService.getUserPermissions(),
    isInitialized: rbacService.isInitialized(),
  });
};
```

## 📚 API Reference

### RBACService Methods

```javascript
// User management
rbacService.approveUser(userId, adminId, role)
rbacService.rejectUser(userId, adminId, reason)
rbacService.suspendUser(userId, adminId, reason)
rbacService.updateUserRole(userId, newRole, adminId)

// Permission checking
rbacService.hasRole(role)
rbacService.hasPermission(permission)
rbacService.hasAnyRole(roles)
rbacService.hasAllPermissions(permissions)

// User queries
rbacService.getPendingUsers()
rbacService.getUsersByRole(role)
rbacService.getActiveUsers()

// Session management
rbacService.validateUserSession()
rbacService.refreshUserData()
rbacService.signOut()
```

### React Hooks

```javascript
const {
  currentUser,        // Current Firebase user
  userRole,          // User's role
  userPermissions,   // User's permissions array
  userStatus,        // User's status (active, pending, suspended)
  isLoading,         // Loading state
  hasRole,           // Function to check role
  hasPermission,     // Function to check permission
  hasAnyRole,        // Function to check multiple roles
  // ... management functions
} = useRBAC();
```

## 🔄 Migration Guide

### From Basic Auth to RBAC

1. **Backup existing user data**
2. **Deploy new security rules**
3. **Update user documents** with role information
4. **Replace auth checks** with RBAC components
5. **Test thoroughly** in development

```javascript
// Migration script example
const migrateUsersToRBAC = async () => {
  const users = await getAllUsers(); // Your existing function
  
  for (const user of users) {
    await rbacService.createUserProfile(user.uid, {
      email: user.email,
      displayName: user.displayName,
      role: determineUserRole(user), // Your logic
      status: 'active',
      approvalStatus: {
        status: 'approved',
        timestamp: new Date(),
        approvedBy: 'migration-script'
      }
    });
  }
};
```

## 🎯 Best Practices

### Security

1. **Always validate permissions** on both client and server
2. **Use least privilege principle** - grant minimum required permissions
3. **Regularly audit user roles** and permissions
4. **Monitor admin actions** through audit logs
5. **Implement session timeouts** for sensitive operations

### Performance

1. **Cache user roles** and permissions locally
2. **Use Firestore offline persistence** for better UX
3. **Implement pagination** for user lists
4. **Optimize security rules** to minimize reads
5. **Use real-time listeners** judiciously

### User Experience

1. **Provide clear feedback** for permission denials
2. **Show loading states** during role checks
3. **Implement graceful fallbacks** for offline scenarios
4. **Use progressive disclosure** for complex permissions
5. **Provide help documentation** for users

## 🆘 Troubleshooting

### Common Issues

**Issue**: Users can't access protected routes
**Solution**: Check if RBAC provider is properly wrapped around the app

**Issue**: Security rules deny legitimate access
**Solution**: Verify user role data exists in Firestore

**Issue**: Admin approval not working
**Solution**: Ensure admin has proper permissions and user exists

**Issue**: Performance issues with role checking
**Solution**: Implement proper caching and optimize Firestore queries

### Debug Checklist

- [ ] Firebase configuration is correct
- [ ] Security rules are deployed
- [ ] User has proper role in Firestore
- [ ] RBAC provider is initialized
- [ ] Network connectivity is stable
- [ ] Console shows no JavaScript errors

## 📞 Support

For additional support:

1. Check the console for detailed error messages
2. Review Firestore security rules logs
3. Verify user data structure in Firestore
4. Test with different user roles
5. Check network requests in browser dev tools

---

**🎉 Congratulations!** You now have a fully functional Role-Based Access Control system. This implementation provides enterprise-grade security while maintaining flexibility for future enhancements.