# Firestore Database Schema for DevInquire Dashboard

This document outlines the complete Firestore database schema for migrating from PHP/SQLite to Firebase backend.

## Collections Overview

### 1. Users Collection

**Path:** `/users/{userId}`

**Purpose:** Store user accounts, profiles, authentication data, and permissions.

**Document Structure:**

```json
{
  "uid": "string", // Firebase Authentication UID
  "email": "string", // User email (unique)
  "name": "string", // Display name
  "role": "string", // user, admin, moderator
  "status": "string", // active, pending, suspended, banned
  "avatar": "string", // URL to avatar image
  "provider": "string", // email, google.com, github.com
  "providerId": "string", // Provider-specific ID
  "verified": "boolean", // Email verification status
  "permissions": "array", // Additional permissions
  "preferences": {
    "theme": "string", // light, dark, system
    "language": "string", // en, es, fr, etc.
    "notifications": {
      "email": "boolean",
      "push": "boolean",
      "marketing": "boolean"
    },
    "privacy": {
      "profileVisibility": "string", // public, private, friends
      "showEmail": "boolean",
      "showActivity": "boolean"
    }
  },
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "bio": "string",
    "website": "string",
    "location": "string",
    "company": "string",
    "jobTitle": "string",
    "socialLinks": {
      "twitter": "string",
      "linkedin": "string",
      "github": "string"
    }
  },
  "metadata": {
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "lastLoginAt": "timestamp",
    "loginCount": "number",
    "emailVerifiedAt": "timestamp",
    "passwordChangedAt": "timestamp"
  },
  "settings": {
    "twoFactorEnabled": "boolean",
    "sessionTimeout": "number",
    "autoLogout": "boolean"
  }
}
```

**Subcollections:**

- `/users/{userId}/sessions/{sessionId}` - Active user sessions
- `/users/{userId}/preferences/{preferenceId}` - User preferences
- `/users/{userId}/activity/{activityId}` - User activity log

### 2. Posts Collection

**Path:** `/posts/{postId}`

**Purpose:** Store blog posts, articles, and content management.

**Document Structure:**

```json
{
  "id": "string", // Auto-generated document ID
  "title": "string", // Post title
  "slug": "string", // URL-friendly slug
  "content": "string", // Post content (HTML/Markdown)
  "excerpt": "string", // Short description
  "status": "string", // draft, published, archived, deleted
  "type": "string", // post, page, article
  "authorId": "string", // Reference to users collection
  "authorName": "string", // Cached author name
  "authorAvatar": "string", // Cached author avatar
  "category": "string", // Post category
  "tags": "array", // Array of tags
  "featuredImage": "string", // URL to featured image
  "images": "array", // Array of image URLs
  "metadata": {
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "publishedAt": "timestamp",
    "deletedAt": "timestamp"
  },
  "seo": {
    "metaTitle": "string",
    "metaDescription": "string",
    "canonicalUrl": "string",
    "noIndex": "boolean",
    "noFollow": "boolean"
  },
  "analytics": {
    "views": "number",
    "likes": "number",
    "shares": "number",
    "comments": "number",
    "readTime": "number" // Estimated read time in minutes
  },
  "settings": {
    "allowComments": "boolean",
    "allowSharing": "boolean",
    "isPinned": "boolean",
    "isFeatured": "boolean",
    "requireAuth": "boolean"
  }
}
```

**Subcollections:**

- `/posts/{postId}/comments/{commentId}` - Post comments
- `/posts/{postId}/analytics/{analyticsId}` - Detailed analytics
- `/posts/{postId}/revisions/{revisionId}` - Content revision history

### 3. Pages Collection

**Path:** `/pages/{pageId}`

**Purpose:** Store custom pages and page builder content.

**Document Structure:**

```json
{
  "id": "string", // Auto-generated document ID
  "title": "string", // Page title
  "slug": "string", // URL-friendly slug
  "content": "string", // Page content
  "template": "string", // Template type
  "status": "string", // draft, published, archived
  "authorId": "string", // Reference to users collection
  "parentId": "string", // Parent page ID (for hierarchy)
  "order": "number", // Display order
  "layout": {
    "type": "string", // layout type
    "components": "array", // Page builder components
    "styles": "object", // Custom styles
    "scripts": "array" // Custom scripts
  },
  "metadata": {
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "publishedAt": "timestamp"
  },
  "seo": {
    "metaTitle": "string",
    "metaDescription": "string",
    "canonicalUrl": "string",
    "ogImage": "string"
  },
  "permissions": {
    "visibility": "string", // public, private, authenticated
    "allowedRoles": "array", // Roles that can view
    "allowedUsers": "array" // Specific users that can view
  }
}
```

**Subcollections:**

- `/pages/{pageId}/revisions/{revisionId}` - Page revision history

### 4. Sessions Collection

**Path:** `/sessions/{sessionId}`

**Purpose:** Track user sessions and authentication state.

**Document Structure:**

```json
{
  "id": "string", // Session ID
  "userId": "string", // Reference to users collection
  "deviceInfo": {
    "userAgent": "string",
    "browser": "string",
    "os": "string",
    "device": "string",
    "ipAddress": "string",
    "location": "string"
  },
  "status": "string", // active, expired, terminated
  "createdAt": "timestamp",
  "lastActivityAt": "timestamp",
  "expiresAt": "timestamp",
  "permissions": "array", // Session-specific permissions
  "metadata": {
    "loginMethod": "string", // email, google, github
    "isRemembered": "boolean",
    "isMobile": "boolean"
  }
}
```

### 5. Analytics Collection

**Path:** `/analytics/{analyticsId}`

**Purpose:** Store detailed analytics and metrics.

**Document Structure:**

```json
{
  "id": "string",
  "type": "string", // page_view, user_action, system_event
  "event": "string", // login, logout, post_view, etc.
  "userId": "string", // Optional user reference
  "sessionId": "string", // Session reference
  "data": "object", // Event-specific data
  "metadata": {
    "timestamp": "timestamp",
    "ipAddress": "string",
    "userAgent": "string",
    "referrer": "string",
    "duration": "number"
  },
  "aggregated": {
    "daily": "object", // Daily aggregated data
    "weekly": "object", // Weekly aggregated data
    "monthly": "object" // Monthly aggregated data
  }
}
```

### 6. Settings Collection

**Path:** `/settings/{settingId}`

**Purpose:** Store application-wide settings and configuration.

**Document Structure:**

```json
{
  "id": "string", // Setting key/identifier
  "category": "string", // auth, ui, email, analytics, etc.
  "key": "string", // Setting key
  "value": "any", // Setting value
  "type": "string", // string, number, boolean, object, array
  "description": "string", // Setting description
  "defaultValue": "any", // Default value
  "isPublic": "boolean", // Can be read by non-admins
  "metadata": {
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "updatedBy": "string" // User who last updated
  },
  "validation": {
    "required": "boolean",
    "min": "number",
    "max": "number",
    "pattern": "string",
    "options": "array"
  }
}
```

### 7. Notifications Collection

**Path:** `/notifications/{notificationId}`

**Purpose:** Store user notifications and system messages.

**Document Structure:**

```json
{
  "id": "string",
  "recipientId": "string", // User ID
  "senderId": "string", // Optional sender ID
  "type": "string", // info, warning, error, success
  "category": "string", // system, user_action, comment, etc.
  "title": "string",
  "message": "string",
  "data": "object", // Additional notification data
  "channels": "array", // email, push, in_app
  "status": "string", // pending, sent, delivered, failed
  "read": "boolean",
  "metadata": {
    "createdAt": "timestamp",
    "sentAt": "timestamp",
    "readAt": "timestamp",
    "deletedAt": "timestamp"
  },
  "actions": "array", // Notification actions
  "priority": "string", // low, normal, high, urgent
  "expiresAt": "timestamp"
}
```

### 8. Files Collection

**Path:** `/files/{fileId}`

**Purpose:** Store file metadata for Firebase Storage integration.

**Document Structure:**

```json
{
  "id": "string",
  "name": "string", // Original filename
  "path": "string", // Storage path
  "url": "string", // Download URL
  "type": "string", // image, document, video, etc.
  "mimeType": "string", // MIME type
  "size": "number", // File size in bytes
  "uploadedBy": "string", // User ID
  "status": "string", // uploading, completed, failed, deleted
  "metadata": {
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "deletedAt": "timestamp"
  },
  "imageData": {
    // For images only
    "width": "number",
    "height": "number",
    "thumbnails": "object", // Thumbnail URLs
    "alt": "string",
    "caption": "string"
  },
  "usage": "array", // Where file is used
  "tags": "array", // File tags
  "permissions": {
    "visibility": "string", // public, private, authenticated
    "allowedUsers": "array"
  }
}
```

### 9. Logs Collection

**Path:** `/logs/{logId}`

**Purpose:** Store system logs and audit trails.

**Document Structure:**

```json
{
  "id": "string",
  "level": "string", // debug, info, warn, error, fatal
  "message": "string",
  "category": "string", // auth, database, api, system
  "userId": "string", // Optional user reference
  "sessionId": "string", // Optional session reference
  "data": "object", // Additional log data
  "stack": "string", // Error stack trace
  "metadata": {
    "timestamp": "timestamp",
    "source": "string", // Function/component source
    "environment": "string", // development, staging, production
    "version": "string" // App version
  }
}
```

## Indexes

### Composite Indexes

```javascript
// Users collection
{ collection: "users", fields: [{ "status": "asc" }, { "role": "asc" }] }
{ collection: "users", fields: [{ "email": "asc" }, { "provider": "asc" }] }

// Posts collection
{ collection: "posts", fields: [{ "status": "asc" }, { "createdAt": "desc" }] }
{ collection: "posts", fields: [{ "authorId": "asc" }, { "status": "asc" }] }
{ collection: "posts", fields: [{ "category": "asc" }, { "publishedAt": "desc" }] }
{ collection: "posts", fields: [{ "tags": "array-contains" }, { "publishedAt": "desc" }] }

// Pages collection
{ collection: "pages", fields: [{ "status": "asc" }, { "order": "asc" }] }
{ collection: "pages", fields: [{ "authorId": "asc" }, { "updatedAt": "desc" }] }

// Analytics collection
{ collection: "analytics", fields: [{ "type": "asc" }, { "timestamp": "desc" }] }
{ collection: "analytics", fields: [{ "userId": "asc" }, { "timestamp": "desc" }] }

// Notifications collection
{ collection: "notifications", fields: [{ "recipientId": "asc" }, { "read": "asc" }, { "createdAt": "desc" }] }
{ collection: "notifications", fields: [{ "recipientId": "asc" }, { "type": "asc" }, { "createdAt": "desc" }] }

// Files collection
{ collection: "files", fields: [{ "uploadedBy": "asc" }, { "type": "asc" }] }
{ collection: "files", fields: [{ "status": "asc" }, { "createdAt": "desc" }] }

// Logs collection
{ collection: "logs", fields: [{ "level": "asc" }, { "timestamp": "desc" }] }
{ collection: "logs", fields: [{ "category": "asc" }, { "timestamp": "desc" }] }
```

## Data Migration Mapping

### From PHP/SQLite to Firestore

| SQLite Table | Firestore Collection       | Notes                                 |
| ------------ | -------------------------- | ------------------------------------- |
| `users`      | `/users`                   | Direct mapping with enhanced fields   |
| `sessions`   | `/users/{userId}/sessions` | Move to subcollection                 |
| `posts`      | `/posts`                   | Enhanced with analytics and SEO       |
| `pages`      | `/pages`                   | Enhanced with page builder support    |
| -            | `/analytics`               | New collection for detailed analytics |
| -            | `/settings`                | New collection for app settings       |
| -            | `/notifications`           | New collection for user notifications |
| -            | `/files`                   | New collection for file metadata      |
| -            | `/logs`                    | New collection for system logs        |

## Performance Considerations

1. **Document Size Limits**: Max 1MB per document
2. **Batch Operations**: Max 500 operations per batch
3. **Query Limits**: Max 100 composite indexes per collection
4. **Real-time Listeners**: Limit concurrent listeners
5. **Offline Support**: Enable for better user experience
6. **Caching**: Implement client-side caching for frequently accessed data

## Security Rules Summary

- **Authentication Required**: All operations require authentication
- **Role-Based Access**: Admin, user, and custom roles
- **Owner-Based Access**: Users can only modify their own data
- **Admin Override**: Admins can access and modify most collections
- **Granular Permissions**: Field-level access control where needed
- **Audit Trail**: All sensitive operations are logged

This schema provides a robust foundation for migrating from PHP/SQLite to Firebase while maintaining all existing functionality and adding new capabilities for scalability and real-time features.
