/**
 * Simple API Key Generator Script
 * Generates a default API key for main website blog integration
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure API key
function generateSecureApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Create API key configuration
function createApiKeyConfig() {
  const apiKey = generateSecureApiKey();
  const config = {
    key: apiKey,
    name: 'Main Website Blog Integration',
    domain: '*', // Allow all domains for development
    permissions: [
      'blog:read',
      'posts:list',
      'posts:read',
      'categories:read',
      'tags:read'
    ],
    rateLimit: {
      requests: 1000,
      window: 3600000 // 1 hour
    },
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    active: true
  };
  
  return config;
}

// Main function
function main() {
  console.log('🔑 Generating API Key for Main Website Blog Integration\n');
  
  const apiKeyConfig = createApiKeyConfig();
  
  // Save to file for reference
  const configPath = path.join(__dirname, 'api-key-config.json');
  fs.writeFileSync(configPath, JSON.stringify(apiKeyConfig, null, 2));
  
  console.log('✅ API Key Generated Successfully!');
  console.log('\n📋 API Key Details:');
  console.log('━'.repeat(50));
  console.log(`🔑 API Key: ${apiKeyConfig.key}`);
  console.log(`📝 Name: ${apiKeyConfig.name}`);
  console.log(`🌐 Domain: ${apiKeyConfig.domain}`);
  console.log(`⏰ Expires: ${new Date(apiKeyConfig.expiresAt).toLocaleDateString()}`);
  console.log(`📊 Rate Limit: ${apiKeyConfig.rateLimit.requests} requests/hour`);
  
  console.log('\n🔧 Integration Instructions:');
  console.log('━'.repeat(50));
  console.log('1. Add this API key to your main website environment:');
  console.log(`   BLOG_API_KEY=${apiKeyConfig.key}`);
  console.log('\n2. Use this endpoint for blog data:');
  console.log('   http://localhost:3006/api/public/blog/posts');
  console.log('\n3. Include the API key in your requests:');
  console.log('   Headers: { "X-API-Key": "' + apiKeyConfig.key + '" }');
  
  console.log('\n📄 Example Usage:');
  console.log('━'.repeat(50));
  console.log(`fetch('http://localhost:3006/api/public/blog/posts', {`);
  console.log(`  headers: {`);
  console.log(`    'X-API-Key': '${apiKeyConfig.key}',`);
  console.log(`    'Content-Type': 'application/json'`);
  console.log(`  }`);
  console.log(`})`);
  console.log(`.then(response => response.json())`);
  console.log(`.then(data => console.log(data));`);
  
  console.log(`\n💾 Configuration saved to: ${configPath}`);
  console.log('\n🚀 Your blog integration is ready!');
}

if (require.main === module) {
  main();
}

module.exports = { generateSecureApiKey, createApiKeyConfig };