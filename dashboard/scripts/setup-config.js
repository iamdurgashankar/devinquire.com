#!/usr/bin/env node
/**
 * Configuration Setup Script for DevInquire Dashboard
 * 
 * This script helps you set up environment variables by:
 * 1. Creating .env.local from env.example
 * 2. Prompting for Firebase configuration values
 * 3. Validating the configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupConfig() {
  console.log('\n🎯 DevInquire Dashboard - Configuration Setup\n');
  console.log('This script will help you configure your environment variables.\n');

  // Check if .env.local already exists
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  // Read example file
  const examplePath = path.join(__dirname, '..', 'env.example');
  if (!fs.existsSync(examplePath)) {
    console.error('❌ env.example file not found!');
    rl.close();
    process.exit(1);
  }

  let envContent = fs.readFileSync(examplePath, 'utf8');

  console.log('\n📝 Please provide your Firebase configuration values:');
  console.log('   (Get these from Firebase Console → Project Settings → General)\n');

  // Firebase configuration prompts
  const config = {
    apiKey: await question('Firebase API Key: '),
    authDomain: await question('Firebase Auth Domain (e.g., project.firebaseapp.com): '),
    projectId: await question('Firebase Project ID: '),
    storageBucket: await question('Firebase Storage Bucket (e.g., project.appspot.com): '),
    messagingSenderId: await question('Firebase Messaging Sender ID: '),
    appId: await question('Firebase App ID: '),
    measurementId: await question('Firebase Measurement ID (optional, press Enter to skip): '),
  };

  // Replace values in env content
  envContent = envContent.replace(/REACT_APP_FIREBASE_API_KEY=.*/, `REACT_APP_FIREBASE_API_KEY=${config.apiKey}`);
  envContent = envContent.replace(/REACT_APP_FIREBASE_AUTH_DOMAIN=.*/, `REACT_APP_FIREBASE_AUTH_DOMAIN=${config.authDomain}`);
  envContent = envContent.replace(/REACT_APP_FIREBASE_PROJECT_ID=.*/, `REACT_APP_FIREBASE_PROJECT_ID=${config.projectId}`);
  envContent = envContent.replace(/REACT_APP_FIREBASE_STORAGE_BUCKET=.*/, `REACT_APP_FIREBASE_STORAGE_BUCKET=${config.storageBucket}`);
  envContent = envContent.replace(/REACT_APP_FIREBASE_MESSAGING_SENDER_ID=.*/, `REACT_APP_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}`);
  envContent = envContent.replace(/REACT_APP_FIREBASE_APP_ID=.*/, `REACT_APP_FIREBASE_APP_ID=${config.appId}`);
  
  if (config.measurementId) {
    envContent = envContent.replace(/REACT_APP_FIREBASE_MEASUREMENT_ID=.*/, `REACT_APP_FIREBASE_MEASUREMENT_ID=${config.measurementId}`);
  }

  // Write .env.local
  fs.writeFileSync(envLocalPath, envContent);
  console.log('\n✅ Configuration saved to .env.local');

  // Validate
  console.log('\n🔍 Validating configuration...');
  const missing = [];
  if (!config.apiKey) missing.push('API Key');
  if (!config.authDomain) missing.push('Auth Domain');
  if (!config.projectId) missing.push('Project ID');
  if (!config.storageBucket) missing.push('Storage Bucket');
  if (!config.messagingSenderId) missing.push('Messaging Sender ID');
  if (!config.appId) missing.push('App ID');

  if (missing.length > 0) {
    console.log('⚠️  Warning: Missing required values:', missing.join(', '));
  } else {
    console.log('✅ All required configuration values provided!');
  }

  console.log('\n📚 Next steps:');
  console.log('   1. Review .env.local to ensure all values are correct');
  console.log('   2. Run: npm install');
  console.log('   3. Run: npm start (for development)');
  console.log('   4. Run: npm run build (for production)\n');

  rl.close();
}

setupConfig().catch((error) => {
  console.error('❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});

