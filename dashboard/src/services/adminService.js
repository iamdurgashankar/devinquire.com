// Admin verification and privilege management
class AdminService {
  // Check if current user has admin privileges (supports both 'admin' and 'SUPER_ADMIN' roles)
  static isAdmin(user) {
    return user && (user.role === "admin" || user.role === "SUPER_ADMIN");
  }

  /**
   * Check if user is the default admin with enhanced validation
   * @param {Object} user - User object
   * @returns {boolean}
   */
  static isDefaultAdmin(user) {
    if (!user) return false;
    
    const isDefaultAdmin = (
      user.id === 'admin-bypass-uid' ||
      user.uid === 'admin-bypass-uid' ||
      user.email === 'admin@devinquire.com'
    );
    
    // Additional validation for default admin privileges
    if (isDefaultAdmin) {
      // Ensure default admin has required privileges
      const requiredPrivileges = ['admin', 'super_admin', 'default_admin'];
      const hasRequiredPrivileges = user.privileges && 
        requiredPrivileges.every(privilege => user.privileges.includes(privilege));
      
      if (!hasRequiredPrivileges) {
        console.warn('Default admin detected but missing required privileges');
        // Auto-assign missing privileges for default admin
        if (user.privileges) {
          user.privileges = [...new Set([...user.privileges, ...requiredPrivileges])];
        } else {
          user.privileges = requiredPrivileges;
        }
      }
    }
    
    return isDefaultAdmin;
  }

  // Verify admin access for sensitive operations
  static verifyAdminAccess(user) {
    if (!this.isAdmin(user)) {
      throw new Error("Admin privileges required for this operation");
    }
    return true;
  }

  /**
   * Get enhanced admin capabilities based on user role and privileges
   * @param {Object} user - User object
   * @returns {Object} Admin capabilities
   */
  static getAdminCapabilities(user) {
    if (!this.isAdmin(user)) {
      return {
        canManageUsers: false,
        canManageContent: false,
        canAccessAnalytics: false,
        canManageSystem: false,
        canManageSecurity: false,
        canBypassRestrictions: false,
        securityLevel: 'none'
      };
    }

    // Enhanced capabilities for default admin
    if (this.isDefaultAdmin(user)) {
      return {
        canManageUsers: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canManageSystem: true,
        canManageSecurity: true,
        canBypassRestrictions: true,
        canAccessAuditLogs: true,
        canManageAdminAccounts: true,
        canModifySecuritySettings: true,
        canOverridePermissions: true,
        canAccessDeveloperTools: true,
        canManageIntegrations: true,
        securityLevel: 'maximum',
        privilegeLevel: 'default_admin'
      };
    }

    // Super admin capabilities
    if (user.privileges && user.privileges.includes('super_admin')) {
      return {
        canManageUsers: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canManageSystem: true,
        canManageSecurity: true,
        canBypassRestrictions: true,
        canAccessAuditLogs: true,
        securityLevel: 'high',
        privilegeLevel: 'super_admin'
      };
    }

    // Regular admin capabilities
    return {
      canManageUsers: true,
      canManageContent: true,
      canAccessAnalytics: true,
      canManageSystem: false,
      canManageSecurity: false,
      canBypassRestrictions: false,
      securityLevel: 'standard',
      privilegeLevel: 'admin'
    };
  }

  /**
   * Check if user has specific permission with enhanced privilege validation
   * @param {Object} user - User object
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  static hasPermission(user, permission) {
    if (!user) return false;
    
    // Default admin has all permissions - ultimate override
    if (this.isDefaultAdmin(user)) {
      console.debug(`Default admin granted permission: ${permission}`);
      return true;
    }
    
    // Super admin privilege check
    if (user.privileges && user.privileges.includes('super_admin')) {
      const restrictedPermissions = ['system_shutdown', 'database_delete'];
      if (!restrictedPermissions.includes(permission)) {
        return true;
      }
    }
    
    // Check user permissions array
    const hasDirectPermission = user.permissions && user.permissions.includes(permission);
    
    // Enhanced permission mapping for admin users
    if (this.isAdmin(user) && !hasDirectPermission) {
      const adminPermissionMap = {
        'user_view': true,
        'content_view': true,
        'analytics_view': true,
        'dashboard_access': true
      };
      
      if (adminPermissionMap[permission]) {
        return true;
      }
    }
    
    return hasDirectPermission;
  }
}

export default AdminService;
