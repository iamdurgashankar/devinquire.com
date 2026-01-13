/**
 * Blog API Key Management Service
 * Provides secure API key generation and validation for external blog access
 */

import firestoreService from './firestoreService.js';
import { enhancedAuthService } from './enhancedAuthService.js';

class BlogApiKeyService {
  constructor() {
    this.collection = 'blogApiKeys';
    this.keyPrefix = 'bak_'; // Blog API Key prefix
  }

  /**
   * Generate a new API key for blog access
   */
  async generateApiKey(options = {}) {
    const {
      name = 'Default Blog API Key',
      permissions = ['read'],
      expiresIn = null, // null = never expires
      domain = null, // allowed domain
      rateLimit = 1000, // requests per hour
      userId = null
    } = options;

    try {
      // Generate secure API key
      const keyId = this.generateKeyId();
      const secretKey = this.generateSecretKey();
      const apiKey = `${this.keyPrefix}${keyId}_${secretKey}`;

      const keyData = {
        id: keyId,
        name,
        apiKey,
        permissions,
        domain,
        rateLimit,
        userId,
        createdAt: new Date(),
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : null,
        isActive: true,
        usage: {
          totalRequests: 0,
          lastUsed: null,
          currentHourRequests: 0,
          currentHourStart: new Date()
        }
      };

      // Store in Firestore
      await firestoreService.collection(this.collection).doc(keyId).set(keyData);

      return {
        success: true,
        data: {
          keyId,
          apiKey,
          name,
          permissions,
          domain,
          rateLimit,
          expiresAt: keyData.expiresAt
        }
      };
    } catch (error) {
      console.error('Error generating API key:', error);
      throw new Error(`Failed to generate API key: ${error.message}`);
    }
  }

  /**
   * Validate API key and check permissions
   */
  async validateApiKey(apiKey, requiredPermission = 'read', domain = null) {
    try {
      if (!apiKey || !apiKey.startsWith(this.keyPrefix)) {
        return { valid: false, error: 'Invalid API key format' };
      }

      // Extract key ID
      const keyParts = apiKey.replace(this.keyPrefix, '').split('_');
      if (keyParts.length !== 2) {
        return { valid: false, error: 'Invalid API key format' };
      }

      const keyId = keyParts[0];

      // Get key data from Firestore
      const doc = await firestoreService.collection(this.collection).doc(keyId).get();
      
      if (!doc.exists) {
        return { valid: false, error: 'API key not found' };
      }

      const keyData = doc.data();

      // Check if key is active
      if (!keyData.isActive) {
        return { valid: false, error: 'API key is disabled' };
      }

      // Check if key has expired
      if (keyData.expiresAt && new Date() > keyData.expiresAt.toDate()) {
        return { valid: false, error: 'API key has expired' };
      }

      // Verify the full API key matches
      if (keyData.apiKey !== apiKey) {
        return { valid: false, error: 'Invalid API key' };
      }

      // Check domain restriction
      if (keyData.domain && domain && keyData.domain !== domain) {
        return { valid: false, error: 'Domain not allowed for this API key' };
      }

      // Check permissions
      if (!keyData.permissions.includes(requiredPermission) && !keyData.permissions.includes('admin')) {
        return { valid: false, error: `Permission '${requiredPermission}' not granted` };
      }

      // Check rate limit
      const rateLimitCheck = await this.checkRateLimit(keyId, keyData);
      if (!rateLimitCheck.allowed) {
        return { valid: false, error: 'Rate limit exceeded' };
      }

      // Update usage statistics
      await this.updateUsageStats(keyId, keyData);

      return {
        valid: true,
        keyData: {
          id: keyData.id,
          name: keyData.name,
          permissions: keyData.permissions,
          domain: keyData.domain,
          userId: keyData.userId
        }
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return { valid: false, error: 'Internal validation error' };
    }
  }

  /**
   * Check rate limit for API key
   */
  async checkRateLimit(keyId, keyData) {
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    
    // Reset counter if it's a new hour
    if (keyData.usage.currentHourStart.toDate() < hourStart) {
      keyData.usage.currentHourRequests = 0;
      keyData.usage.currentHourStart = hourStart;
    }

    return {
      allowed: keyData.usage.currentHourRequests < keyData.rateLimit,
      remaining: Math.max(0, keyData.rateLimit - keyData.usage.currentHourRequests),
      resetTime: new Date(hourStart.getTime() + 60 * 60 * 1000) // Next hour
    };
  }

  /**
   * Update usage statistics
   */
  async updateUsageStats(keyId, keyData) {
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    
    const updates = {
      'usage.totalRequests': keyData.usage.totalRequests + 1,
      'usage.lastUsed': now,
      'usage.currentHourRequests': keyData.usage.currentHourRequests + 1,
      'usage.currentHourStart': hourStart
    };

    await firestoreService.collection(this.collection).doc(keyId).update(updates);
  }

  /**
   * List all API keys for a user
   */
  async listApiKeys(userId = null) {
    try {
      let query = firestoreService.collection(this.collection);
      
      if (userId) {
        query = query.where('userId', '==', userId);
      }
      
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      
      const keys = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          name: data.name,
          permissions: data.permissions,
          domain: data.domain,
          rateLimit: data.rateLimit,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          isActive: data.isActive,
          usage: data.usage,
          // Don't return the actual API key for security
          apiKeyPreview: `${this.keyPrefix}${data.id}_****`
        };
      });

      return { success: true, data: keys };
    } catch (error) {
      console.error('Error listing API keys:', error);
      throw new Error(`Failed to list API keys: ${error.message}`);
    }
  }

  /**
   * Revoke/disable an API key
   */
  async revokeApiKey(keyId, userId = null) {
    try {
      const doc = await firestoreService.collection(this.collection).doc(keyId).get();
      
      if (!doc.exists) {
        throw new Error('API key not found');
      }

      const keyData = doc.data();
      
      // Check if user owns this key (unless admin)
      if (userId && keyData.userId !== userId) {
        throw new Error('Unauthorized to revoke this API key');
      }

      await firestoreService.collection(this.collection).doc(keyId).update({
        isActive: false,
        revokedAt: new Date()
      });

      return { success: true, message: 'API key revoked successfully' };
    } catch (error) {
      console.error('Error revoking API key:', error);
      throw new Error(`Failed to revoke API key: ${error.message}`);
    }
  }

  /**
   * Generate unique key ID
   */
  generateKeyId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate secure secret key
   */
  generateSecretKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create default API key for main website
   */
  async createDefaultWebsiteApiKey() {
    try {
      // Check if default key already exists
      const existingKeys = await this.listApiKeys();
      const defaultKey = existingKeys.data.find(key => key.name === 'Main Website Blog Access');
      
      if (defaultKey && defaultKey.isActive) {
        return {
          success: true,
          data: {
            keyId: defaultKey.id,
            apiKeyPreview: defaultKey.apiKeyPreview,
            message: 'Default API key already exists'
          }
        };
      }

      // Create new default key
      const result = await this.generateApiKey({
        name: 'Main Website Blog Access',
        permissions: ['read'],
        domain: 'devinquire.com',
        rateLimit: 10000, // Higher limit for main website
        expiresIn: null // Never expires
      });

      return result;
    } catch (error) {
      console.error('Error creating default website API key:', error);
      throw new Error(`Failed to create default API key: ${error.message}`);
    }
  }
}

const blogApiKeyService = new BlogApiKeyService();
export default blogApiKeyService;