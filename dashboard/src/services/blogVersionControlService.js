/**
 * Blog Version Control Service
 * Provides comprehensive version control for blog posts with revision tracking,
 * history management, and rollback capabilities
 */

import firestoreService from './firestoreService';
import { DB_CONFIG } from '../config/firebase';
import contentService from './contentService';

class BlogVersionControlService {
  constructor() {
    this.revisionsCollection = 'post_revisions';
    this.maxRevisions = 50; // Maximum revisions to keep per post
  }

  /**
   * Create a new revision when a post is updated
   */
  async createRevision(postId, postData, authorId, changeType = 'update') {
    try {
      const revision = {
        postId,
        version: await this.getNextVersionNumber(postId),
        data: {
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt,
          category: postData.category,
          tags: postData.tags,
          featuredImage: postData.featuredImage,
          status: postData.status,
          seo: postData.seo || {},
          settings: postData.settings || {}
        },
        metadata: {
          authorId,
          changeType, // 'create', 'update', 'publish', 'unpublish', 'restore'
          timestamp: firestoreService.getServerTimestamp(),
          userAgent: navigator.userAgent,
          ipAddress: await this.getClientIP(),
          changeDescription: this.generateChangeDescription(changeType, postData)
        },
        diff: await this.generateDiff(postId, postData),
        size: JSON.stringify(postData).length
      };

      const result = await firestoreService.createDocument(
        this.revisionsCollection,
        revision
      );

      if (result.success) {
        // Clean up old revisions if we exceed the limit
        await this.cleanupOldRevisions(postId);
        return result;
      }

      throw new Error(result.error || 'Failed to create revision');
    } catch (error) {
      console.error('Error creating revision:', error);
      throw error;
    }
  }

  /**
   * Get all revisions for a post
   */
  async getPostRevisions(postId, limit = 20) {
    try {
      const result = await firestoreService.getDocuments(
        this.revisionsCollection,
        {
          where: [['postId', '==', postId]],
          orderBy: [['metadata.timestamp', 'desc']],
          limit
        }
      );

      if (result.success) {
        return result.data.map(revision => ({
          ...revision,
          formattedTimestamp: this.formatTimestamp(revision.metadata.timestamp),
          sizeFormatted: this.formatFileSize(revision.size)
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching post revisions:', error);
      return [];
    }
  }

  /**
   * Get a specific revision by ID
   */
  async getRevision(revisionId) {
    try {
      const result = await firestoreService.getDocument(
        this.revisionsCollection,
        revisionId
      );

      if (result.success) {
        return result.data;
      }

      throw new Error(result.error || 'Revision not found');
    } catch (error) {
      console.error('Error fetching revision:', error);
      throw error;
    }
  }

  /**
   * Restore a post to a specific revision
   */
  async restoreToRevision(postId, revisionId, authorId) {
    try {
      // Get the revision data
      const revision = await this.getRevision(revisionId);
      if (!revision) {
        throw new Error('Revision not found');
      }

      // Create a new revision for the current state before restoring
      const currentPost = await contentService.getPost(postId);
      if (currentPost.success) {
        await this.createRevision(
          postId,
          currentPost.data,
          authorId,
          'pre_restore'
        );
      }

      // Update the post with revision data
      const updateData = {
        ...revision.data,
        metadata: {
          ...revision.data.metadata,
          updatedAt: firestoreService.getServerTimestamp(),
          restoredFrom: revisionId,
          restoredBy: authorId
        }
      };

      const result = await contentService.updatePost(postId, updateData, authorId);

      if (result.success) {
        // Create a revision for the restore action
        await this.createRevision(
          postId,
          updateData,
          authorId,
          'restore'
        );

        return result;
      }

      throw new Error(result.error || 'Failed to restore revision');
    } catch (error) {
      console.error('Error restoring revision:', error);
      throw error;
    }
  }

  /**
   * Compare two revisions
   */
  async compareRevisions(revisionId1, revisionId2) {
    try {
      const [revision1, revision2] = await Promise.all([
        this.getRevision(revisionId1),
        this.getRevision(revisionId2)
      ]);

      if (!revision1 || !revision2) {
        throw new Error('One or both revisions not found');
      }

      return {
        revision1: {
          id: revisionId1,
          version: revision1.version,
          timestamp: revision1.metadata.timestamp,
          author: revision1.metadata.authorId,
          data: revision1.data
        },
        revision2: {
          id: revisionId2,
          version: revision2.version,
          timestamp: revision2.metadata.timestamp,
          author: revision2.metadata.authorId,
          data: revision2.data
        },
        differences: this.calculateDifferences(revision1.data, revision2.data)
      };
    } catch (error) {
      console.error('Error comparing revisions:', error);
      throw error;
    }
  }

  /**
   * Get revision statistics for a post
   */
  async getRevisionStats(postId) {
    try {
      const revisions = await this.getPostRevisions(postId, 1000);
      
      const stats = {
        totalRevisions: revisions.length,
        firstRevision: revisions[revisions.length - 1]?.metadata.timestamp,
        lastRevision: revisions[0]?.metadata.timestamp,
        authors: [...new Set(revisions.map(r => r.metadata.authorId))],
        changeTypes: this.groupBy(revisions, 'metadata.changeType'),
        averageSize: revisions.reduce((sum, r) => sum + r.size, 0) / revisions.length,
        totalSize: revisions.reduce((sum, r) => sum + r.size, 0)
      };

      return stats;
    } catch (error) {
      console.error('Error getting revision stats:', error);
      return null;
    }
  }

  /**
   * Generate diff between current post and previous version
   */
  async generateDiff(postId, newData) {
    try {
      const revisions = await this.getPostRevisions(postId, 1);
      if (revisions.length === 0) {
        return { type: 'initial', changes: [] };
      }

      const previousData = revisions[0].data;
      const changes = [];

      // Compare each field
      const fields = ['title', 'content', 'excerpt', 'category', 'tags', 'status'];
      
      fields.forEach(field => {
        if (JSON.stringify(previousData[field]) !== JSON.stringify(newData[field])) {
          changes.push({
            field,
            oldValue: previousData[field],
            newValue: newData[field],
            type: this.getChangeType(previousData[field], newData[field])
          });
        }
      });

      return {
        type: 'update',
        changes,
        summary: this.generateChangeSummary(changes)
      };
    } catch (error) {
      console.error('Error generating diff:', error);
      return { type: 'error', changes: [] };
    }
  }

  /**
   * Get next version number for a post
   */
  async getNextVersionNumber(postId) {
    try {
      const revisions = await this.getPostRevisions(postId, 1);
      return revisions.length > 0 ? revisions[0].version + 1 : 1;
    } catch (error) {
      console.error('Error getting next version number:', error);
      return 1;
    }
  }

  /**
   * Clean up old revisions to maintain the limit
   */
  async cleanupOldRevisions(postId) {
    try {
      const allRevisions = await this.getPostRevisions(postId, 1000);
      
      if (allRevisions.length > this.maxRevisions) {
        const toDelete = allRevisions.slice(this.maxRevisions);
        
        for (const revision of toDelete) {
          await firestoreService.deleteDocument(
            this.revisionsCollection,
            revision.id
          );
        }

        console.log(`Cleaned up ${toDelete.length} old revisions for post ${postId}`);
      }
    } catch (error) {
      console.error('Error cleaning up old revisions:', error);
    }
  }

  /**
   * Generate change description
   */
  generateChangeDescription(changeType, postData) {
    switch (changeType) {
      case 'create':
        return `Created new post: "${postData.title}"`;
      case 'update':
        return `Updated post: "${postData.title}"`;
      case 'publish':
        return `Published post: "${postData.title}"`;
      case 'unpublish':
        return `Unpublished post: "${postData.title}"`;
      case 'restore':
        return `Restored post from previous version: "${postData.title}"`;
      default:
        return `Modified post: "${postData.title}"`;
    }
  }

  /**
   * Calculate differences between two data objects
   */
  calculateDifferences(data1, data2) {
    const differences = [];
    const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);

    allKeys.forEach(key => {
      const value1 = data1[key];
      const value2 = data2[key];

      if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        differences.push({
          field: key,
          oldValue: value1,
          newValue: value2,
          type: this.getChangeType(value1, value2)
        });
      }
    });

    return differences;
  }

  /**
   * Get change type for a field
   */
  getChangeType(oldValue, newValue) {
    if (oldValue === undefined || oldValue === null) {
      return 'added';
    }
    if (newValue === undefined || newValue === null) {
      return 'removed';
    }
    return 'modified';
  }

  /**
   * Generate change summary
   */
  generateChangeSummary(changes) {
    if (changes.length === 0) {
      return 'No changes';
    }

    const summary = [];
    const fieldCounts = this.groupBy(changes, 'type');

    Object.entries(fieldCounts).forEach(([type, items]) => {
      summary.push(`${items.length} ${type}`);
    });

    return summary.join(', ');
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Group array by property
   */
  groupBy(array, property) {
    return array.reduce((groups, item) => {
      const key = this.getNestedProperty(item, property);
      groups[key] = groups[key] || [];
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Get nested property value
   */
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get client IP address (simplified)
   */
  async getClientIP() {
    try {
      // In a real implementation, you might use a service to get the IP
      // For now, return a placeholder
      return 'client-ip';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Listen to revision changes for a post
   */
  listenToPostRevisions(postId, callback) {
    return firestoreService.listenToDocuments(
      this.revisionsCollection,
      {
        where: [['postId', '==', postId]],
        orderBy: [['metadata.timestamp', 'desc']]
      },
      callback
    );
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isAvailable: true,
      maxRevisions: this.maxRevisions,
      collection: this.revisionsCollection
    };
  }
}

const blogVersionControlService = new BlogVersionControlService();
export default blogVersionControlService;