/**
 * Data Migration Utilities
 * Tools for migrating data from PHP/SQLite backend to Firebase Firestore
 * Provides automated migration scripts and manual migration helpers
 */

import firestoreService from "../services/firestoreService";
import userService from "../services/userService";
import contentService from "../services/contentService";
// Firebase-only: API_BASE no longer available

class DataMigrationService {
  constructor() {
    this.migrationStatus = {
      users: { total: 0, migrated: 0, errors: [] },
      posts: { total: 0, migrated: 0, errors: [] },
      pages: { total: 0, migrated: 0, errors: [] },
      settings: { total: 0, migrated: 0, errors: [] }
    };
    this.batchSize = 50; // Process items in batches
    this.delayBetweenBatches = 1000; // 1 second delay between batches
  }

  // =============================================
  // MAIN MIGRATION METHODS
  // =============================================

  /**
   * Run complete migration from PHP/SQLite to Firebase
   */
  async runFullMigration(options = {}) {
    try {
      const {
        migrateUsers = true,
        migratePosts = true,
        migratePages = true,
        migrateSettings = true,
        createBackup = true
      } = options;

      console.log('🚀 Starting complete data migration to Firebase...');
      
      // Create backup before migration
      if (createBackup) {
        console.log('📦 Creating backup of existing data...');
        await this.createDataBackup();
      }

      // Check Firebase connectivity
      if (!firestoreService.isAvailable()) {
        throw new Error('Firebase Firestore is not available. Please check your configuration.');
      }

      // Migrate users first (required for other data)
      if (migrateUsers) {
        console.log('👥 Migrating users...');
        await this.migrateUsers();
      }

      // Migrate posts
      if (migratePosts) {
        console.log('📄 Migrating posts...');
        await this.migratePosts();
      }

      // Migrate pages
      if (migratePages) {
        console.log('📃 Migrating pages...');
        await this.migratePages();
      }

      // Migrate settings
      if (migrateSettings) {
        console.log('⚙️ Migrating settings...');
        await this.migrateSettings();
      }

      console.log('✅ Migration completed successfully!');
      return {
        success: true,
        status: this.migrationStatus,
        message: 'Data migration completed successfully'
      };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return {
        success: false,
        error: error.message,
        status: this.migrationStatus
      };
    }
  }

  // =============================================
  // USER MIGRATION
  // =============================================

  /**
   * Migrate users from PHP/SQLite to Firebase
   */
  async migrateUsers() {
    try {
      // Fetch users from PHP backend
      const phpUsers = await this.fetchPhpUsers();
      this.migrationStatus.users.total = phpUsers.length;

      console.log(`Found ${phpUsers.length} users to migrate`);

      // Process users in batches
      for (let i = 0; i < phpUsers.length; i += this.batchSize) {
        const batch = phpUsers.slice(i, i + this.batchSize);
        await this.migrateUserBatch(batch);
        
        // Delay between batches to avoid rate limiting
        if (i + this.batchSize < phpUsers.length) {
          await this.delay(this.delayBetweenBatches);
        }
      }

      console.log(`✅ Users migration completed: ${this.migrationStatus.users.migrated}/${this.migrationStatus.users.total}`);
    } catch (error) {
      console.error('User migration error:', error);
      throw error;
    }
  }

  /**
   * Migrate a batch of users
   */
  async migrateUserBatch(users) {
    const operations = [];

    for (const phpUser of users) {
      try {
        const firestoreUser = this.transformPhpUserToFirestore(phpUser);
        
        operations.push({
          type: 'set',
          collectionName: 'users',
          docId: this.generateUserId(phpUser),
          data: firestoreUser
        });
      } catch (error) {
        console.error(`Error transforming user ${phpUser.id}:`, error);
        this.migrationStatus.users.errors.push({
          userId: phpUser.id,
          error: error.message
        });
      }
    }

    // Execute batch operations
    if (operations.length > 0) {
      try {
        await firestoreService.performBatch(operations);
        this.migrationStatus.users.migrated += operations.length;
      } catch (error) {
        console.error('Batch user migration error:', error);
        this.migrationStatus.users.errors.push({
          batch: true,
          error: error.message
        });
      }
    }
  }

  /**
   * Transform PHP user data to Firestore format
   */
  transformPhpUserToFirestore(phpUser) {
    const now = new Date();
    
    return {
      uid: this.generateUserId(phpUser),
      email: phpUser.email?.toLowerCase() || '',
      name: phpUser.name || '',
      role: phpUser.role || 'user',
      status: phpUser.status || 'active',
      avatar: phpUser.avatar || null,
      provider: phpUser.provider || 'email',
      providerId: phpUser.provider_id || this.generateUserId(phpUser),
      verified: phpUser.verified || false,
      permissions: phpUser.permissions ? JSON.parse(phpUser.permissions) : [],
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          marketing: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showActivity: true
        }
      },
      profile: {
        firstName: phpUser.name?.split(' ')[0] || '',
        lastName: phpUser.name?.split(' ').slice(1).join(' ') || '',
        bio: '',
        website: '',
        location: '',
        company: '',
        jobTitle: '',
        socialLinks: {
          twitter: '',
          linkedin: '',
          github: ''
        }
      },
      metadata: {
        createdAt: phpUser.created_at ? new Date(phpUser.created_at) : now,
        updatedAt: phpUser.updated_at ? new Date(phpUser.updated_at) : now,
        lastLoginAt: phpUser.last_login ? new Date(phpUser.last_login) : null,
        loginCount: phpUser.login_count || 0,
        emailVerifiedAt: phpUser.verified ? now : null,
        passwordChangedAt: null
      },
      settings: {
        twoFactorEnabled: false,
        sessionTimeout: 30 * 24 * 60 * 60 * 1000,
        autoLogout: false
      }
    };
  }

  // =============================================
  // POSTS MIGRATION
  // =============================================

  /**
   * Migrate posts from PHP/SQLite to Firebase
   */
  async migratePosts() {
    try {
      const phpPosts = await this.fetchPhpPosts();
      this.migrationStatus.posts.total = phpPosts.length;

      console.log(`Found ${phpPosts.length} posts to migrate`);

      for (let i = 0; i < phpPosts.length; i += this.batchSize) {
        const batch = phpPosts.slice(i, i + this.batchSize);
        await this.migratePostBatch(batch);
        
        if (i + this.batchSize < phpPosts.length) {
          await this.delay(this.delayBetweenBatches);
        }
      }

      console.log(`✅ Posts migration completed: ${this.migrationStatus.posts.migrated}/${this.migrationStatus.posts.total}`);
    } catch (error) {
      console.error('Posts migration error:', error);
      throw error;
    }
  }

  /**
   * Migrate a batch of posts
   */
  async migratePostBatch(posts) {
    for (const phpPost of posts) {
      try {
        const firestorePost = this.transformPhpPostToFirestore(phpPost);
        await contentService.createPost(firestorePost, phpPost.author_id || 'unknown');
        this.migrationStatus.posts.migrated++;
      } catch (error) {
        console.error(`Error migrating post ${phpPost.id}:`, error);
        this.migrationStatus.posts.errors.push({
          postId: phpPost.id,
          error: error.message
        });
      }
    }
  }

  /**
   * Transform PHP post data to Firestore format
   */
  transformPhpPostToFirestore(phpPost) {
    return {
      title: phpPost.title || '',
      content: phpPost.content || '',
      excerpt: phpPost.excerpt || '',
      status: phpPost.status || 'draft',
      category: phpPost.category || 'uncategorized',
      tags: phpPost.tags ? phpPost.tags.split(',').map(tag => tag.trim()) : [],
      featuredImage: phpPost.featured_image || null
    };
  }

  // =============================================
  // PAGES MIGRATION
  // =============================================

  /**
   * Migrate pages from PHP/SQLite to Firebase
   */
  async migratePages() {
    try {
      const phpPages = await this.fetchPhpPages();
      this.migrationStatus.pages.total = phpPages.length;

      console.log(`Found ${phpPages.length} pages to migrate`);

      for (const phpPage of phpPages) {
        try {
          const firestorePage = this.transformPhpPageToFirestore(phpPage);
          await contentService.createPage(firestorePage, phpPage.author_id || 'unknown');
          this.migrationStatus.pages.migrated++;
        } catch (error) {
          console.error(`Error migrating page ${phpPage.id}:`, error);
          this.migrationStatus.pages.errors.push({
            pageId: phpPage.id,
            error: error.message
          });
        }
      }

      console.log(`✅ Pages migration completed: ${this.migrationStatus.pages.migrated}/${this.migrationStatus.pages.total}`);
    } catch (error) {
      console.error('Pages migration error:', error);
      throw error;
    }
  }

  /**
   * Transform PHP page data to Firestore format
   */
  transformPhpPageToFirestore(phpPage) {
    return {
      title: phpPage.title || '',
      content: phpPage.content || '',
      template: phpPage.template || 'default',
      status: phpPage.status || 'draft',
      order: phpPage.order || 0
    };
  }

  // =============================================
  // SETTINGS MIGRATION
  // =============================================

  /**
   * Migrate settings from PHP/SQLite to Firebase
   */
  async migrateSettings() {
    try {
      // Default settings to migrate
      const defaultSettings = [
        {
          id: 'app_name',
          category: 'general',
          key: 'app_name',
          value: 'DevInquire Dashboard',
          type: 'string',
          description: 'Application name',
          isPublic: true
        },
        {
          id: 'app_version',
          category: 'general',
          key: 'app_version',
          value: '1.0.0',
          type: 'string',
          description: 'Application version',
          isPublic: true
        },
        {
          id: 'default_theme',
          category: 'ui',
          key: 'default_theme',
          value: 'system',
          type: 'string',
          description: 'Default theme for new users',
          isPublic: true
        }
      ];

      for (const setting of defaultSettings) {
        try {
          await firestoreService.createDocument('settings', setting, setting.id);
          this.migrationStatus.settings.migrated++;
        } catch (error) {
          console.error(`Error migrating setting ${setting.id}:`, error);
          this.migrationStatus.settings.errors.push({
            settingId: setting.id,
            error: error.message
          });
        }
      }

      this.migrationStatus.settings.total = defaultSettings.length;
      console.log(`✅ Settings migration completed: ${this.migrationStatus.settings.migrated}/${this.migrationStatus.settings.total}`);
    } catch (error) {
      console.error('Settings migration error:', error);
      throw error;
    }
  }

  // =============================================
  // DATA FETCHING FROM PHP BACKEND
  // =============================================

  /**
   * Fetch users from PHP backend
   */
  async fetchPhpUsers() {
    try {
      // Firebase-only: No PHP backend available
      console.warn('PHP backend not available in Firebase-only mode');
      return [];
    } catch (error) {
      console.warn('Could not fetch users from PHP backend:', error);
      return [];
    }
  }

  /**
   * Fetch posts from PHP backend
   */
  async fetchPhpPosts() {
    try {
      // Firebase-only: No PHP backend available
      console.warn('PHP backend not available in Firebase-only mode');
      return [];
    } catch (error) {
      console.warn('Could not fetch posts from PHP backend:', error);
      return [];
    }
  }

  /**
   * Fetch pages from PHP backend
   */
  async fetchPhpPages() {
    try {
      // Firebase-only: No PHP backend available
      console.warn('PHP backend not available in Firebase-only mode');
      return [];
    } catch (error) {
      console.warn('Could not fetch pages from PHP backend:', error);
      return [];
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Generate consistent user ID for migration
   */
  generateUserId(phpUser) {
    // Use email as base for consistent ID generation
    if (phpUser.email) {
      return `migrated_${phpUser.email.replace(/[^a-zA-Z0-9]/g, '_')}_${phpUser.id}`;
    }
    return `migrated_user_${phpUser.id}`;
  }

  /**
   * Create backup of existing data
   */
  async createDataBackup() {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        users: await this.fetchPhpUsers(),
        posts: await this.fetchPhpPosts(),
        pages: await this.fetchPhpPages()
      };

      // Store backup in localStorage for now
      localStorage.setItem('migration_backup', JSON.stringify(backup));
      
      console.log('✅ Backup created successfully');
      return backup;
    } catch (error) {
      console.error('Backup creation error:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup() {
    try {
      const backup = localStorage.getItem('migration_backup');
      if (!backup) {
        throw new Error('No backup found');
      }

      const backupData = JSON.parse(backup);
      console.log('Backup found:', backupData.timestamp);
      
      return backupData;
    } catch (error) {
      console.error('Restore from backup error:', error);
      throw error;
    }
  }

  /**
   * Delay helper for rate limiting
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get migration progress
   */
  getMigrationStatus() {
    return {
      ...this.migrationStatus,
      totalItems: Object.values(this.migrationStatus).reduce((sum, status) => sum + status.total, 0),
      totalMigrated: Object.values(this.migrationStatus).reduce((sum, status) => sum + status.migrated, 0),
      totalErrors: Object.values(this.migrationStatus).reduce((sum, status) => sum + status.errors.length, 0)
    };
  }

  /**
   * Reset migration status
   */
  resetMigrationStatus() {
    this.migrationStatus = {
      users: { total: 0, migrated: 0, errors: [] },
      posts: { total: 0, migrated: 0, errors: [] },
      pages: { total: 0, migrated: 0, errors: [] },
      settings: { total: 0, migrated: 0, errors: [] }
    };
  }

  /**
   * Export migration report
   */
  exportMigrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: this.getMigrationStatus(),
      details: this.migrationStatus
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `migration_report_${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
}

// Create and export singleton instance
const dataMigrationService = new DataMigrationService();
export default dataMigrationService;