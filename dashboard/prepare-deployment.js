#!/usr/bin/env node

/**
 * Deployment Preparation Script
 * Checks and prepares the dashboard for deployment
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, required = true) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✅ ${filePath}`, 'green');
    return true;
  } else {
    if (required) {
      log(`❌ ${filePath} - REQUIRED but missing!`, 'red');
      return false;
    } else {
      log(`⚠️  ${filePath} - Optional, not found`, 'yellow');
      return true;
    }
  }
}

function checkEnvVariables() {
  log('\n📋 Checking Environment Variables...', 'cyan');
  
  const envProdPath = path.join(__dirname, '.env.production');
  const envProdExamplePath = path.join(__dirname, 'env.production.example');
  
  if (!fs.existsSync(envProdPath)) {
    log('⚠️  .env.production not found', 'yellow');
    if (fs.existsSync(envProdExamplePath)) {
      log('💡 Copy env.production.example to .env.production and fill in your values', 'blue');
    }
    return false;
  }
  
  const envContent = fs.readFileSync(envProdPath, 'utf8');
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID'
  ];
  
  let allPresent = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your-`)) {
      log(`✅ ${varName}`, 'green');
    } else {
      log(`❌ ${varName} - Missing or not configured`, 'red');
      allPresent = false;
    }
  });
  
  return allPresent;
}

function main() {
  log('\n🚀 DevInquire Dashboard - Deployment Preparation\n', 'cyan');
  
  let allChecksPassed = true;
  
  // Check essential files
  log('\n📁 Checking Essential Files...', 'cyan');
  allChecksPassed &= checkFile('package.json', true);
  allChecksPassed &= checkFile('firebase.json', true);
  allChecksPassed &= checkFile('vercel.json', false);
  allChecksPassed &= checkFile('netlify.toml', false);
  allChecksPassed &= checkFile('public/index.html', true);
  allChecksPassed &= checkFile('src/index.js', true);
  
  // Check environment variables
  const envOk = checkEnvVariables();
  allChecksPassed &= envOk;
  
  // Check build directory
  log('\n📦 Checking Build Configuration...', 'cyan');
  const buildDir = path.join(__dirname, 'build');
  if (fs.existsSync(buildDir)) {
    log('✅ Build directory exists', 'green');
    log('💡 Run "npm run build" to create a fresh production build', 'blue');
  } else {
    log('⚠️  Build directory not found - this is normal before first build', 'yellow');
    log('💡 Run "npm run build" to create production build', 'blue');
  }
  
  // Check node_modules
  log('\n📚 Checking Dependencies...', 'cyan');
  const nodeModules = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModules)) {
    log('✅ node_modules exists', 'green');
  } else {
    log('❌ node_modules not found - run "npm install"', 'red');
    allChecksPassed = false;
  }
  
  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  if (allChecksPassed && envOk) {
    log('\n✅ All checks passed! Ready for deployment.', 'green');
    log('\n📝 Next Steps:', 'cyan');
    log('1. Review and update .env.production with your Firebase credentials', 'blue');
    log('2. Run: npm run build', 'blue');
    log('3. Test the build locally: npx serve -s build', 'blue');
    log('4. Deploy to your chosen platform:', 'blue');
    log('   - Vercel: npm run deploy:vercel', 'blue');
    log('   - Netlify: npm run deploy:netlify', 'blue');
    log('   - Firebase: npm run deploy:firebase', 'blue');
  } else {
    log('\n⚠️  Some checks failed. Please fix the issues above before deploying.', 'yellow');
  }
  log('\n' + '='.repeat(50) + '\n', 'cyan');
  
  process.exit(allChecksPassed && envOk ? 0 : 1);
}

main();

