/**
 * Utility to generate API key for main website blog integration
 * This can be called from the React app or admin dashboard
 */

import blogApiKeyService from '../services/blogApiKeyService.js';

export const generateWebsiteApiKey = async () => {
  try {
    console.log('🔑 Generating API key for main website blog integration...');
    
    // Create or get existing default API key
    const result = await blogApiKeyService.createDefaultWebsiteApiKey();
    
    if (result.success) {
      // Get the full API key details
      const keys = await blogApiKeyService.listApiKeys();
      const websiteKey = keys.data.find(key => key.name === 'Main Website Blog Access');
      
      if (websiteKey) {
        const keyInfo = {
          apiKey: websiteKey.apiKey,
          name: websiteKey.name,
          domain: websiteKey.domain || 'Any domain',
          rateLimit: websiteKey.rateLimit,
          permissions: websiteKey.permissions,
          createdAt: new Date(websiteKey.createdAt.seconds * 1000).toLocaleString(),
          expiresAt: websiteKey.expiresAt ? new Date(websiteKey.expiresAt.seconds * 1000).toLocaleString() : 'Never'
        };
        
        console.log('\n✅ API Key Generated Successfully!');
        console.log('=' .repeat(60));
        console.log(`🔑 API Key: ${keyInfo.apiKey}`);
        console.log(`📝 Name: ${keyInfo.name}`);
        console.log(`🌐 Domain: ${keyInfo.domain}`);
        console.log(`📊 Rate Limit: ${keyInfo.rateLimit} requests/hour`);
        console.log(`🔒 Permissions: ${keyInfo.permissions.join(', ')}`);
        console.log(`📅 Created: ${keyInfo.createdAt}`);
        console.log(`⏰ Expires: ${keyInfo.expiresAt}`);
        console.log('=' .repeat(60));
        
        return {
          success: true,
          keyInfo,
          integrationInstructions: {
            endpoints: [
              'GET /api/blog/posts - Get all published posts',
              'GET /api/blog/posts/:id - Get specific post',
              'GET /api/blog/categories - Get all categories',
              'GET /api/blog/tags - Get all tags'
            ],
            exampleUsage: `fetch('http://localhost:3006/api/blog/posts', {
  headers: {
    'X-API-Key': '${keyInfo.apiKey}',
    'Content-Type': 'application/json'
  }
})`
          }
        };
      }
    }
    
    throw new Error('Failed to retrieve API key details');
    
  } catch (error) {
    console.error('❌ Error generating API key:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

export default generateWebsiteApiKey;