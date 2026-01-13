#!/usr/bin/env node

/**
 * OAuth Configuration Setup Script
 * Configures both development and production OAuth settings
 */

const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

console.log(colors.bright + colors.blue + '🔧 OAuth Configuration Setup' + colors.reset + '\n');

// Load environment variables
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (error) {
  console.error(colors.red + '❌ Failed to load .env.local file' + colors.reset);
  process.exit(1);
}

// Current environment
const currentEnv = process.env.NODE_ENV || 'development';
const currentDomain = process.env.REACT_APP_BASE_URL || 'localhost';
const currentPort = process.env.PORT || '3000';

// Get current Google Client ID
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

console.log(colors.bright + '📊 Current Environment:' + colors.reset);
console.log('NODE_ENV: ' + colors.cyan + currentEnv + colors.reset);
console.log('BASE_URL: ' + colors.cyan + (process.env.REACT_APP_BASE_URL || 'not set') + colors.reset);
console.log('Current Domain: ' + colors.cyan + currentDomain + colors.reset);
console.log('Current Port: ' + colors.cyan + currentPort + colors.reset);
console.log('Google Client ID: ' + colors.cyan + googleClientId + colors.reset);

// Production environment variables
const prodEnvVars = {
  REACT_APP_ENABLE_PROD_OAUTH: 'true',
  REACT_APP_PROD_DOMAIN: 'yourdomain.com',
  REACT_APP_GOOGLE_PROD_REDIRECT_URI: 'https://yourdomain.com/auth/google/callback',
  REACT_APP_FIREBASE_PROD_REDIRECT_URI: 'https://yourdomain.com/auth/firebase/callback',
  REACT_APP_USE_FIREBASE_AUTH: 'true',
  REACT_APP_ENABLE_MFA: 'true',
  REACT_APP_SESSION_TIMEOUT: '1800000',
  REACT_APP_SECURE_STORAGE: 'true',
  REACT_APP_CSP_ENABLED: 'true',
  REACT_APP_HSTS_ENABLED: 'true',
  REACT_APP_RATE_LIMIT_WINDOW: '60000',
  REACT_APP_MAX_OPERATIONS_PER_MINUTE: '10',
  REACT_APP_LOG_LEVEL: 'warn',
  REACT_APP_ENABLE_CONSOLE_LOGS: 'false',
  REACT_APP_ENCRYPT_LOCAL_STORAGE: 'true',
  REACT_APP_CSP_REPORT_ONLY: 'false'
};

// Development environment variables
const devEnvVars = {
  REACT_APP_USE_FIREBASE_EMULATOR: 'true',
  REACT_APP_FIREBASE_EMULATOR_HOST: 'localhost',
  REACT_APP_FIREBASE_AUTH_EMULATOR_PORT: '9099',
  REACT_APP_ENABLE_CONSOLE_LOGS: 'true',
  REACT_APP_DEBUG_MODE: 'true',
  REACT_APP_VERBOSE_LOGGING: 'true',
  REACT_APP_SHOW_FIREBASE_STATUS: 'true',
  REACT_APP_SHOW_PERFORMANCE_METRICS: 'true',
  REACT_APP_ENABLE_DEV_TOOLS: 'true',
  REACT_APP_ENABLE_HOT_RELOAD: 'true',
  REACT_APP_LOG_LEVEL: 'info',
  REACT_APP_ALLOW_CORS: 'http://localhost:3000',
  REACT_APP_ALLOW_CREDENTIALS: 'true',
  REACT_APP_ENABLE_PREFLIGHT: 'true',
  REACT_APP_CORS_METHODS: 'GET,POST,PUT,DELETE,OPTIONS',
  REACT_APP_CORS_HEADERS: 'Content-Type,Authorization,X-Requested-With'
};

// Create a backup of the current .env.local file
const envLocalPath = path.join(__dirname, '../.env.local');
try {
  fs.copyFileSync(envLocalPath, path.join(__dirname, '../.env.local.backup'));
  console.log(colors.green + '✅ Created backup of .env.local' + colors.reset);
} catch (error) {
  console.log(colors.yellow + '⚠️  Could not create backup of .env.local - file may not exist' + colors.reset);
}

// Read current environment
let envContent = '';
try {
  envContent = fs.readFileSync(envLocalPath, 'utf8');
} catch (error) {
  console.error(colors.red + '❌ Failed to read .env.local file' + colors.reset);
  process.exit(1);
}

// Function to add or update environment variable
function setEnvVar(content, key, value, comment = '') {
  const regex = new RegExp('^' + key + '=.*$', 'm');
  const replacement = comment ? '\n# ' + comment + '\n' + key + '=' + value : key + '=' + value;
  
  if (regex.test(content)) {
    return content.replace(regex, replacement);
  } else {
    return content + '\n' + replacement;
  }
}

// Update environment content with production settings
let newEnvContent = envContent;

// Add production variables if not present
for (const key in prodEnvVars) {
  if (!envContent.includes(key)) {
    newEnvContent = setEnvVar(newEnvContent, key, prodEnvVars[key], 'Production OAuth Settings');
  }
}

// Add development variables if not present
for (const key in devEnvVars) {
  if (!envContent.includes(key)) {
    newEnvContent = setEnvVar(newEnvContent, key, devEnvVars[key], 'Development OAuth Settings');
  }
}

// Add environment-specific configuration
newEnvContent += '\n\n# ==============================================';
newEnvContent += '\n# 🌐 ENVIRONMENT-SPECIFIC CONFIGURATION';
newEnvContent += '\n# ==============================================';
newEnvContent += '\n\n# Development Environment Settings';
newEnvContent += '\nREACT_APP_DEV_REDIRECT_URI=http://localhost:3000/auth/google/callback';
newEnvContent += '\nREACT_APP_DEV_ORIGIN=http://localhost:3000';
newEnvContent += '\n\n# Production Environment Settings';
newEnvContent += '\nREACT_APP_PROD_REDIRECT_URI=https://yourdomain.com/auth/google/callback';
newEnvContent += '\nREACT_APP_PROD_ORIGIN=https://yourdomain.com';
newEnvContent += '\n\n# Environment Mode';
newEnvContent += '\nREACT_APP_ENV_MODE=development  # Options: development, staging, production';

// Write the updated environment file
try {
  fs.writeFileSync(envLocalPath, newEnvContent);
  console.log(colors.green + '✅ Updated .env.local with comprehensive OAuth configuration' + colors.reset);
} catch (error) {
  console.error(colors.red + '❌ Failed to update .env.local file' + colors.reset);
  process.exit(1);
}

// Create a production configuration example
const prodEnvExample = `# ==============================================
# 🌐 PRODUCTION ENVIRONMENT CONFIGURATION
# ==============================================

# Production Environment Settings
REACT_APP_ENV=production
REACT_APP_BASE_URL=https://yourdomain.com
REACT_APP_API_BASE=https://yourdomain.com/api
REACT_APP_BACKEND_URL=https://yourdomain.com

# Production OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
REACT_APP_GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
REACT_APP_GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID_HERE
REACT_APP_GITHUB_REDIRECT_URI=https://yourdomain.com/auth/github/callback

# Security Configuration
REACT_APP_CSP_ENABLED=true
REACT_APP_HSTS_ENABLED=true
REACT_APP_SECURE_STORAGE=true
REACT_APP_ENABLE_MFA=true
REACT_APP_ENCRYPT_LOCAL_STORAGE=true

# Firebase Production Configuration
REACT_APP_USE_FIREBASE_EMULATOR=false
REACT_APP_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY_HERE
REACT_APP_FIREBASE_AUTH_DOMAIN=yourdomain.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=yourdomain
REACT_APP_FIREBASE_STORAGE_BUCKET=yourdomain.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
REACT_APP_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID

# Performance Monitoring
REACT_APP_TRACK_PERFORMANCE=true
REACT_APP_PERFORMANCE_THRESHOLD=2000
REACT_APP_MEMORY_THRESHOLD=100

# Error Tracking
REACT_APP_TRACK_ERRORS=true
REACT_APP_ERROR_SAMPLE_RATE=1.0`;

// Write production environment example
try {
  fs.writeFileSync(path.join(__dirname, '../.env.production.example'), prodEnvExample);
  console.log(colors.green + '✅ Created .env.production.example template' + colors.reset);
} catch (error) {
  console.log(colors.yellow + '⚠️  Could not create .env.production.example' + colors.reset);
}

// Validation function
function validateConfiguration() {
  console.log('\n' + colors.bright + '🔍 Validating OAuth Configuration' + colors.reset);
  
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  let isValid = true;
  
  // Check Google Client ID format
  if (!clientId || clientId === 'your_google_client_id_here') {
    console.log(colors.red + '❌ Google Client ID is missing or using placeholder value' + colors.reset);
    isValid = false;
  } else if (!/^[0-9]+-[a-zA-Z0-9_\-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
    console.log(colors.red + '❌ Google Client ID format is invalid' + colors.reset);
    isValid = false;
  } else {
    console.log(colors.green + '✅ Google Client ID format is valid' + colors.reset);
  }
  
  // Check environment mode
  const envMode = process.env.REACT_APP_ENV_MODE || 'development';
  console.log('Environment Mode: ' + colors.cyan + envMode + colors.reset);
  
  if (isValid) {
    console.log('\n' + colors.green + '✅ OAuth configuration is valid!' + colors.reset);
  } else {
    console.log('\n' + colors.red + '❌ OAuth configuration has issues that need to be fixed' + colors.reset);
  }
  
  return isValid;
}

// Run validation
const isConfigValid = validateConfiguration();

console.log('\n' + colors.bright + '📋 Next Steps:' + colors.reset);
console.log('1. Update the Google Client ID in .env.local with your actual client ID');
console.log('2. Configure redirect URIs in Google Cloud Console');
console.log('3. Test the authentication flow');
console.log('4. For production, update the production domain in the configuration');

console.log('\n' + colors.bright + colors.blue + '🔧 OAuth Configuration Complete' + colors.reset + '\n');

// Export configuration for testing
module.exports = {
  googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  googleRedirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
  isValid: isConfigValid
};