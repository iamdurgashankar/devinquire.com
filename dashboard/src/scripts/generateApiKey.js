/**
 * Script to generate API key for main website blog integration
 * Run this script to get a valid API key for your main website
 */

import blogApiKeyService from '../services/blogApiKeyService.js';
import firestoreService from '../services/firestoreService.js';
import { waitForFirebaseInit } from '../config/firebase.js';

class ApiKeyGenerator {
  async generateWebsiteApiKey() {
    try {
      console.log('🔑 Generating API key for main website blog integration...');
      
      // Wait for Firebase to initialize
      await waitForFirebaseInit();
      
      // Create or get existing default API key
      const result = await blogApiKeyService.createDefaultWebsiteApiKey();
      
      if (result.success) {
        // Get the full API key details
        const keys = await blogApiKeyService.listApiKeys();
        const websiteKey = keys.data.find(key => key.name === 'Main Website Blog Access');
        
        if (websiteKey) {
          console.log('\n✅ API Key Generated Successfully!');
          console.log('=' .repeat(60));
          console.log(`🔑 API Key: ${websiteKey.apiKey}`);
          console.log(`📝 Name: ${websiteKey.name}`);
          console.log(`🌐 Domain: ${websiteKey.domain || 'Any domain'}`);
          console.log(`📊 Rate Limit: ${websiteKey.rateLimit} requests/hour`);
          console.log(`🔒 Permissions: ${websiteKey.permissions.join(', ')}`);
          console.log(`📅 Created: ${new Date(websiteKey.createdAt.seconds * 1000).toLocaleString()}`);
          console.log(`⏰ Expires: ${websiteKey.expiresAt ? new Date(websiteKey.expiresAt.seconds * 1000).toLocaleString() : 'Never'}`);
          console.log('=' .repeat(60));
          
          console.log('\n📋 Integration Instructions:');
          console.log('1. Copy the API key above');
          console.log('2. Add it to your main website\'s environment variables');
          console.log('3. Use the public API endpoints:');
          console.log('   - GET /api/blog/posts - Get all published posts');
          console.log('   - GET /api/blog/posts/:id - Get specific post');
          console.log('   - GET /api/blog/categories - Get all categories');
          console.log('   - GET /api/blog/tags - Get all tags');
          console.log('\n🔗 Example usage:');
          console.log(`   fetch('http://localhost:3006/api/blog/posts', {`);
          console.log(`     headers: {`);
          console.log(`       'X-API-Key': '${websiteKey.apiKey}',`);
          console.log(`       'Content-Type': 'application/json'`);
          console.log(`     }`);
          console.log(`   })`);
          
          return {
            success: true,
            apiKey: websiteKey.apiKey,
            keyDetails: websiteKey
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
  }
}

// Export for use in other scripts
export default ApiKeyGenerator;

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new ApiKeyGenerator();
  generator.generateWebsiteApiKey()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 API key generation completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 API key generation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}