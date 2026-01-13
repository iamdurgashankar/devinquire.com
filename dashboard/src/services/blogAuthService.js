/**
 * Blog Authentication Service
 * Comprehensive authentication and authorization for blog management
 * Integrates with existing auth system and provides role-based access control
 */

import { enhancedAuthService } from './enhancedAuthService.js';
import rbacService from './rbacService.js';
import firestoreService from './firestoreService.js';
import authAuditService from './authAuditService.js';

class BlogAuthService {
  constructor() {
    this.permissions = {
      // Blog post permissions
      'blog:posts:create': 'Create new blog posts',
      'blog:posts:read': 'Read blog posts',
      'blog:posts:update': 'Update blog posts',
      'blog:posts:delete': 'Delete blog posts',
      'blog:posts:publish': 'Publish blog posts',
      'blog:posts:unpublish': 'Unpublish blog posts',
      'blog:posts:schedule': 'Schedule blog posts',
      
      // Blog management permissions
      'blog:manage:categories': 'Manage blog categories',
      'blog:manage:tags': 'Manage blog tags',
      'blog:manage:comments': 'Manage blog comments',
      'blog:manage:media': 'Manage blog media',
      
      // Blog analytics permissions
      'blog:analytics:view': 'View blog analytics',
      'blog:analytics:export': 'Export blog analytics',
      
      // Blog settings permissions
      'blog:settings:view': 'View blog settings',
      'blog:settings:update': 'Update blog settings',
      
      // Advanced permissions
      'blog:admin:all': 'Full blog administration access',
      'blog:moderate:all': 'Moderate all blog content',
      'blog:audit:view': 'View blog audit logs'
    };
    
    this.roles = {
      'blog_admin': {
        name: 'Blog Administrator',
        description: 'Full access to all blog management features',
        permissions: [
          'blog:admin:all',
          'blog:posts:create',
          'blog:posts:read',
          'blog:posts:update',
          'blog:posts:delete',
          'blog:posts:publish',
          'blog:posts:unpublish',
          'blog:posts:schedule',
          'blog:manage:categories',
          'blog:manage:tags',
          'blog:manage:comments',
          'blog:manage:media',
          'blog:analytics:view',
          'blog:analytics:export',
          'blog:settings:view',
          'blog:settings:update',
          'blog:moderate:all',
          'blog:audit:view'
        ]
      },
      'blog_editor': {
        name: 'Blog Editor',
        description: 'Can create, edit, and publish blog posts',
        permissions: [
          'blog:posts:create',
          'blog:posts:read',
          'blog:posts:update',
          'blog:posts:publish',
          'blog:posts:unpublish',
          'blog:posts:schedule',
          'blog:manage:tags',
          'blog:manage:media',
          'blog:analytics:view'
        ]
      },
      'blog_author': {
        name: 'Blog Author',
        description: 'Can create and edit own blog posts',
        permissions: [
          'blog:posts:create',
          'blog:posts:read',
          'blog:posts:update',
          'blog:manage:tags',
          'blog:manage:media'
        ]
      },
      'blog_contributor': {
        name: 'Blog Contributor',
        description: 'Can create draft blog posts for review',
        permissions: [
          'blog:posts:create',
          'blog:posts:read',
          'blog:manage:tags'
        ]
      },
      'blog_viewer': {
        name: 'Blog Viewer',
        description: 'Can only view blog content and analytics',
        permissions: [
          'blog:posts:read',
          'blog:analytics:view'
        ]
      }
    };
    
    this.sessionCache = new Map();
    this.permissionCache = new Map();
    this.rateLimits = new Map();
    
    this.config = {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      permissionCacheTimeout: 5 * 60 * 1000, // 5 minutes
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      requireMFA: false,
      auditAllActions: true
    };
    
    // Initialize service
    this.initialize();
  }

  /**
   * Initialize the blog auth service
   */
  async initialize() {
    try {
      // Ensure blog roles exist in RBAC system
      await this.ensureBlogRoles();
      
      // Set up permission cache cleanup
      this.startCacheCleanup();
      
      console.log('Blog Auth Service initialized successfully');
    } catch (error) {
      console.error('Blog Auth Service initialization error:', error);
    }
  }

  /**
   * Authenticate user for blog operations
   */
  async authenticateUser(token, requiredPermission = null) {
    try {
      // Verify the authentication token
      const authResult = await enhancedAuthService.verifyToken(token);
      if (!authResult.valid) {
        throw new Error('Invalid authentication token');
      }

      const user = authResult.user;
      const userId = user.uid || user.id;

      // Check if user is locked out
      if (await this.isUserLockedOut(userId)) {
        throw new Error('User account is temporarily locked');
      }

      // Get user's blog permissions
      const permissions = await this.getUserBlogPermissions(userId);
      
      // Check specific permission if required
      if (requiredPermission && !permissions.includes(requiredPermission)) {
        await this.logSecurityEvent(userId, 'permission_denied', {
          requiredPermission,
          userPermissions: permissions
        });
        throw new Error(`Insufficient permissions: ${requiredPermission} required`);
      }

      // Create session
      const session = await this.createBlogSession(user, permissions);
      
      // Log successful authentication
      if (this.config.auditAllActions) {
        await this.logSecurityEvent(userId, 'blog_auth_success', {
          permissions: permissions.length,
          requiredPermission
        });
      }

      return {
        success: true,
        user,
        session,
        permissions
      };
    } catch (error) {
      console.error('Blog authentication error:', error);
      throw error;
    }
  }

  /**
   * Check if user has specific blog permission
   */
  async hasPermission(userId, permission) {
    try {
      // Check cache first
      const cacheKey = `${userId}:${permission}`;
      const cached = this.permissionCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.config.permissionCacheTimeout) {
        return cached.hasPermission;
      }

      // Get user permissions
      const permissions = await this.getUserBlogPermissions(userId);
      const hasPermission = permissions.includes(permission) || permissions.includes('blog:admin:all');
      
      // Cache result
      this.permissionCache.set(cacheKey, {
        hasPermission,
        timestamp: Date.now()
      });

      return hasPermission;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Check multiple permissions at once
   */
  async hasPermissions(userId, permissions) {
    const results = {};
    
    for (const permission of permissions) {
      results[permission] = await this.hasPermission(userId, permission);
    }
    
    return results;
  }

  /**
   * Get user's blog permissions
   */
  async getUserBlogPermissions(userId) {
    try {
      // Get user roles from RBAC service
      const userRoles = await rbacService.getUserRoles(userId);
      
      // Collect all blog permissions from roles
      const permissions = new Set();
      
      for (const roleName of userRoles) {
        const role = this.roles[roleName];
        if (role) {
          role.permissions.forEach(permission => permissions.add(permission));
        }
      }
      
      // Add any direct permissions
      const directPermissions = await this.getDirectBlogPermissions(userId);
      directPermissions.forEach(permission => permissions.add(permission));
      
      return Array.from(permissions);
    } catch (error) {
      console.error('Error getting user blog permissions:', error);
      return [];
    }
  }

  /**
   * Get direct blog permissions for user
   */
  async getDirectBlogPermissions(userId) {
    try {
      const userDoc = await firestoreService.getDocument('users', userId);
      return userDoc?.blogPermissions || [];
    } catch (error) {
      console.error('Error getting direct blog permissions:', error);
      return [];
    }
  }

  /**
   * Assign blog role to user
   */
  async assignBlogRole(userId, roleName, assignedBy) {
    try {
      // Validate role exists
      if (!this.roles[roleName]) {
        throw new Error(`Invalid blog role: ${roleName}`);
      }

      // Check if assigner has permission
      const canAssign = await this.hasPermission(assignedBy, 'blog:admin:all');
      if (!canAssign) {
        throw new Error('Insufficient permissions to assign blog roles');
      }

      // Store role assignment in Firestore (RBAC service handles role management)
      await firestoreService.updateDocument('users', userId, {
        blogRole: roleName,
        blogPermissions: this.roles[roleName].permissions,
        updatedAt: new Date().toISOString()
      });
      
      // Clear permission cache for user
      this.clearUserPermissionCache(userId);
      
      // Log role assignment
      await this.logSecurityEvent(assignedBy, 'blog_role_assigned', {
        targetUserId: userId,
        roleName,
        rolePermissions: this.roles[roleName].permissions
      });

      return {
        success: true,
        message: `Blog role '${roleName}' assigned successfully`
      };
    } catch (error) {
      console.error('Error assigning blog role:', error);
      throw error;
    }
  }

  /**
   * Remove blog role from user
   */
  async removeBlogRole(userId, roleName, removedBy) {
    try {
      // Check if remover has permission
      const canRemove = await this.hasPermission(removedBy, 'blog:admin:all');
      if (!canRemove) {
        throw new Error('Insufficient permissions to remove blog roles');
      }

      // Remove role using RBAC service
      await rbacService.removeRole(userId, roleName);
      
      // Clear permission cache for user
      this.clearUserPermissionCache(userId);
      
      // Log role removal
      await this.logSecurityEvent(removedBy, 'blog_role_removed', {
        targetUserId: userId,
        roleName
      });

      return {
        success: true,
        message: `Blog role '${roleName}' removed successfully`
      };
    } catch (error) {
      console.error('Error removing blog role:', error);
      throw error;
    }
  }

  /**
   * Grant direct blog permission to user
   */
  async grantBlogPermission(userId, permission, grantedBy) {
    try {
      // Validate permission exists
      if (!this.permissions[permission]) {
        throw new Error(`Invalid blog permission: ${permission}`);
      }

      // Check if granter has permission
      const canGrant = await this.hasPermission(grantedBy, 'blog:admin:all');
      if (!canGrant) {
        throw new Error('Insufficient permissions to grant blog permissions');
      }

      // Get current direct permissions
      const currentPermissions = await this.getDirectBlogPermissions(userId);
      
      // Add new permission if not already present
      if (!currentPermissions.includes(permission)) {
        currentPermissions.push(permission);
        
        // Update user document
        await firestoreService.updateDocument('users', userId, {
          blogPermissions: currentPermissions,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Clear permission cache for user
      this.clearUserPermissionCache(userId);
      
      // Log permission grant
      await this.logSecurityEvent(grantedBy, 'blog_permission_granted', {
        targetUserId: userId,
        permission
      });

      return {
        success: true,
        message: `Blog permission '${permission}' granted successfully`
      };
    } catch (error) {
      console.error('Error granting blog permission:', error);
      throw error;
    }
  }

  /**
   * Revoke direct blog permission from user
   */
  async revokeBlogPermission(userId, permission, revokedBy) {
    try {
      // Check if revoker has permission
      const canRevoke = await this.hasPermission(revokedBy, 'blog:admin:all');
      if (!canRevoke) {
        throw new Error('Insufficient permissions to revoke blog permissions');
      }

      // Get current direct permissions
      const currentPermissions = await this.getDirectBlogPermissions(userId);
      
      // Remove permission if present
      const updatedPermissions = currentPermissions.filter(p => p !== permission);
      
      if (updatedPermissions.length !== currentPermissions.length) {
        // Update user document
        await firestoreService.updateDocument('users', userId, {
          blogPermissions: updatedPermissions,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Clear permission cache for user
      this.clearUserPermissionCache(userId);
      
      // Log permission revocation
      await this.logSecurityEvent(revokedBy, 'blog_permission_revoked', {
        targetUserId: userId,
        permission
      });

      return {
        success: true,
        message: `Blog permission '${permission}' revoked successfully`
      };
    } catch (error) {
      console.error('Error revoking blog permission:', error);
      throw error;
    }
  }

  /**
   * Create blog session for authenticated user
   */
  async createBlogSession(user, permissions) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      userId: user.uid || user.id,
      user,
      permissions,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + this.config.sessionTimeout
    };
    
    this.sessionCache.set(sessionId, session);
    
    return session;
  }

  /**
   * Validate blog session
   */
  async validateBlogSession(sessionId) {
    try {
      const session = this.sessionCache.get(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (Date.now() > session.expiresAt) {
        this.sessionCache.delete(sessionId);
        throw new Error('Session expired');
      }
      
      // Update last activity
      session.lastActivity = Date.now();
      
      return {
        valid: true,
        session
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Invalidate blog session
   */
  async invalidateBlogSession(sessionId) {
    const session = this.sessionCache.get(sessionId);
    if (session) {
      this.sessionCache.delete(sessionId);
      
      // Log session invalidation
      if (this.config.auditAllActions) {
        await this.logSecurityEvent(session.userId, 'blog_session_invalidated', {
          sessionId
        });
      }
    }
  }

  /**
   * Check if user is locked out
   */
  async isUserLockedOut(userId) {
    const lockoutKey = `lockout:${userId}`;
    const lockout = this.rateLimits.get(lockoutKey);
    
    if (lockout && Date.now() < lockout.expiresAt) {
      return true;
    }
    
    if (lockout && Date.now() >= lockout.expiresAt) {
      this.rateLimits.delete(lockoutKey);
    }
    
    return false;
  }

  /**
   * Lock user account temporarily
   */
  async lockUserAccount(userId, reason = 'Security violation') {
    const lockoutKey = `lockout:${userId}`;
    const lockout = {
      userId,
      reason,
      lockedAt: Date.now(),
      expiresAt: Date.now() + this.config.lockoutDuration
    };
    
    this.rateLimits.set(lockoutKey, lockout);
    
    // Log lockout
    await this.logSecurityEvent(userId, 'account_locked', {
      reason,
      duration: this.config.lockoutDuration
    });
  }

  /**
   * Authorize blog post operation
   */
  async authorizePostOperation(userId, operation, postData = null) {
    try {
      // Define operation permissions
      const operationPermissions = {
        'create': 'blog:posts:create',
        'read': 'blog:posts:read',
        'update': 'blog:posts:update',
        'delete': 'blog:posts:delete',
        'publish': 'blog:posts:publish',
        'unpublish': 'blog:posts:unpublish',
        'schedule': 'blog:posts:schedule'
      };
      
      const requiredPermission = operationPermissions[operation];
      if (!requiredPermission) {
        throw new Error(`Invalid blog operation: ${operation}`);
      }
      
      // Check basic permission
      const hasBasicPermission = await this.hasPermission(userId, requiredPermission);
      if (!hasBasicPermission) {
        throw new Error(`Insufficient permissions for operation: ${operation}`);
      }
      
      // Additional authorization checks
      if (postData) {
        // Check if user can only edit their own posts
        const userRoles = await rbacService.getUserRoles(userId);
        const isAuthorOnly = userRoles.includes('blog_author') && 
                            !userRoles.includes('blog_editor') && 
                            !userRoles.includes('blog_admin');
        
        if (isAuthorOnly && postData.authorId && postData.authorId !== userId) {
          throw new Error('Authors can only edit their own posts');
        }
        
        // Check if user can publish (contributors cannot)
        if (operation === 'publish') {
          const canPublish = await this.hasPermission(userId, 'blog:posts:publish');
          if (!canPublish) {
            throw new Error('Insufficient permissions to publish posts');
          }
        }
      }
      
      // Log authorization success
      if (this.config.auditAllActions) {
        await this.logSecurityEvent(userId, 'blog_operation_authorized', {
          operation,
          postId: postData?.id
        });
      }
      
      return {
        authorized: true,
        operation,
        userId
      };
    } catch (error) {
      // Log authorization failure
      await this.logSecurityEvent(userId, 'blog_operation_denied', {
        operation,
        error: error.message,
        postId: postData?.id
      });
      
      throw error;
    }
  }

  /**
   * Get user's blog access summary
   */
  async getUserBlogAccess(userId) {
    try {
      const permissions = await this.getUserBlogPermissions(userId);
      const roles = await rbacService.getUserRoles(userId);
      const blogRoles = roles.filter(role => this.roles[role]);
      
      return {
        userId,
        roles: blogRoles,
        permissions,
        accessLevel: this.determineAccessLevel(permissions),
        canCreate: permissions.includes('blog:posts:create'),
        canEdit: permissions.includes('blog:posts:update'),
        canPublish: permissions.includes('blog:posts:publish'),
        canDelete: permissions.includes('blog:posts:delete'),
        canManage: permissions.includes('blog:admin:all'),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting user blog access:', error);
      throw error;
    }
  }

  /**
   * Determine user's access level
   */
  determineAccessLevel(permissions) {
    if (permissions.includes('blog:admin:all')) {
      return 'admin';
    } else if (permissions.includes('blog:posts:publish')) {
      return 'editor';
    } else if (permissions.includes('blog:posts:update')) {
      return 'author';
    } else if (permissions.includes('blog:posts:create')) {
      return 'contributor';
    } else if (permissions.includes('blog:posts:read')) {
      return 'viewer';
    } else {
      return 'none';
    }
  }

  // Helper methods

  async ensureBlogRoles() {
    try {
      // Blog roles are already defined in ROLE_PERMISSIONS
      // This method ensures roles are available for assignment
      console.log('Blog roles initialized:', Object.keys(this.roles));
    } catch (error) {
      console.error('Error ensuring blog roles:', error);
    }
  }

  generateSessionId() {
    return `blog_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearUserPermissionCache(userId) {
    // Remove all cached permissions for the user
    for (const [key] of this.permissionCache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionCache.delete(key);
      }
    }
  }

  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      
      // Clean up expired sessions
      for (const [sessionId, session] of this.sessionCache.entries()) {
        if (now > session.expiresAt) {
          this.sessionCache.delete(sessionId);
        }
      }
      
      // Clean up expired permission cache
      for (const [key, cached] of this.permissionCache.entries()) {
        if (now - cached.timestamp > this.config.permissionCacheTimeout) {
          this.permissionCache.delete(key);
        }
      }
      
      // Clean up expired rate limits
      for (const [key, limit] of this.rateLimits.entries()) {
        if (now > limit.expiresAt) {
          this.rateLimits.delete(key);
        }
      }
    }, 60000); // Run every minute
  }

  async logSecurityEvent(userId, eventType, details = {}) {
    try {
      await authAuditService.logEvent({
        userId,
        eventType: `blog_${eventType}`,
        details,
        timestamp: new Date().toISOString(),
        service: 'blog_auth'
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Middleware for blog route protection
   */
  createBlogAuthMiddleware(requiredPermission) {
    return async (req, res, next) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'Authentication token required' });
        }

        const authResult = await this.authenticateUser(token, requiredPermission);
        
        // Attach user and permissions to request
        req.blogUser = authResult.user;
        req.blogSession = authResult.session;
        req.blogPermissions = authResult.permissions;
        
        next();
      } catch (error) {
        console.error('Blog auth middleware error:', error);
        res.status(403).json({ error: error.message });
      }
    };
  }

  /**
   * Get available blog roles
   */
  getBlogRoles() {
    return Object.entries(this.roles).map(([key, role]) => ({
      id: key,
      name: role.name,
      description: role.description,
      permissionCount: role.permissions.length
    }));
  }

  /**
   * Get available blog permissions
   */
  getBlogPermissions() {
    return Object.entries(this.permissions).map(([key, description]) => ({
      id: key,
      description
    }));
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      activeSessions: this.sessionCache.size,
      cachedPermissions: this.permissionCache.size,
      rateLimits: this.rateLimits.size,
      availableRoles: Object.keys(this.roles).length,
      availablePermissions: Object.keys(this.permissions).length
    };
  }
}

const blogAuthService = new BlogAuthService();
export default blogAuthService;