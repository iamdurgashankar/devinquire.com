#!/usr/bin/env node

/**
 * Firebase Deployment Script
 * Automates the deployment of Firebase configuration, functions, and security rules
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class FirebaseDeployer {
  constructor() {
    this.projectRoot = process.cwd();
    this.deploymentLog = [];
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async deploy() {
    console.log('🚀 Firebase Deployment Script');
    console.log('=' .repeat(50));

    try {
      // Pre-deployment checks
      await this.preDeploymentChecks();
      
      // Environment selection
      const environment = await this.selectEnvironment();
      
      // Deployment confirmation
      const confirmed = await this.confirmDeployment(environment);
      if (!confirmed) {
        console.log('❌ Deployment cancelled by user.');
        return;
      }
      
      // Execute deployment steps
      await this.deploySecurityRules();
      await this.deployFunctions();
      await this.deployHosting();
      await this.deployFirestoreIndexes();
      
      // Post-deployment verification
      await this.postDeploymentVerification();
      
      // Generate deployment report
      await this.generateDeploymentReport();
      
      console.log('\n✅ Deployment completed successfully!');
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      this.logError('DEPLOYMENT_FAILED', error.message, error.stack);
    } finally {
      this.rl.close();
    }
  }

  async preDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    // Check if Firebase CLI is installed
    try {
      execSync('firebase --version', { stdio: 'pipe' });
      this.logSuccess('Firebase CLI is installed');
    } catch (error) {
      throw new Error('Firebase CLI is not installed. Please install it with: npm install -g firebase-tools');
    }
    
    // Check if user is logged in
    try {
      execSync('firebase projects:list', { stdio: 'pipe' });
      this.logSuccess('User is authenticated with Firebase');
    } catch (error) {
      throw new Error('Please login to Firebase CLI with: firebase login');
    }
    
    // Check if firebase.json exists
    if (!fs.existsSync(path.join(this.projectRoot, 'firebase.json'))) {
      throw new Error('firebase.json not found. Please initialize Firebase project with: firebase init');
    }
    this.logSuccess('firebase.json found');
    
    // Check if required files exist
    const requiredFiles = [
      'firestore.rules',
      'database.rules.json',
      '.env.example'
    ];
    
    for (const file of requiredFiles) {
      if (fs.existsSync(path.join(this.projectRoot, file))) {
        this.logSuccess(`${file} found`);
      } else {
        this.logWarning(`${file} not found - will skip related deployment`);
      }
    }
    
    // Check environment variables
    if (fs.existsSync('.env')) {
      this.logSuccess('.env file found');
    } else {
      this.logWarning('.env file not found - make sure environment variables are set');
    }
  }

  async selectEnvironment() {
    console.log('\n🌍 Select deployment environment:');
    console.log('1. Development');
    console.log('2. Staging');
    console.log('3. Production');
    
    const answer = await this.question('Enter your choice (1-3): ');
    
    switch (answer.trim()) {
      case '1':
        return 'development';
      case '2':
        return 'staging';
      case '3':
        return 'production';
      default:
        console.log('Invalid choice, defaulting to development');
        return 'development';
    }
  }

  async confirmDeployment(environment) {
    console.log(`\n⚠️  You are about to deploy to ${environment.toUpperCase()} environment.`);
    console.log('This will update:');
    console.log('  • Firestore security rules');
    console.log('  • Realtime Database security rules');
    console.log('  • Cloud Functions');
    console.log('  • Hosting configuration');
    console.log('  • Firestore indexes');
    
    const answer = await this.question('\nDo you want to continue? (y/N): ');
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  async deploySecurityRules() {
    console.log('\n🔒 Deploying security rules...');
    
    try {
      // Deploy Firestore rules
      if (fs.existsSync('firestore.rules')) {
        console.log('  📄 Deploying Firestore rules...');
        execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
        this.logSuccess('Firestore rules deployed');
      }
      
      // Deploy Realtime Database rules
      if (fs.existsSync('database.rules.json')) {
        console.log('  📄 Deploying Realtime Database rules...');
        execSync('firebase deploy --only database', { stdio: 'inherit' });
        this.logSuccess('Realtime Database rules deployed');
      }
      
    } catch (error) {
      this.logError('SECURITY_RULES_DEPLOYMENT', 'Failed to deploy security rules', error.message);
      throw error;
    }
  }

  async deployFunctions() {
    console.log('\n⚡ Deploying Cloud Functions...');
    
    try {
      // Check if functions directory exists
      if (fs.existsSync('functions')) {
        console.log('  📦 Installing function dependencies...');
        execSync('cd functions && npm install', { stdio: 'inherit' });
        
        console.log('  🚀 Deploying functions...');
        execSync('firebase deploy --only functions', { stdio: 'inherit' });
        this.logSuccess('Cloud Functions deployed');
      } else {
        this.logWarning('Functions directory not found - skipping function deployment');
      }
      
    } catch (error) {
      this.logError('FUNCTIONS_DEPLOYMENT', 'Failed to deploy Cloud Functions', error.message);
      throw error;
    }
  }

  async deployHosting() {
    console.log('\n🌐 Deploying hosting...');
    
    try {
      // Build the project if build script exists
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (packageJson.scripts && packageJson.scripts.build) {
        console.log('  🔨 Building project...');
        execSync('npm run build', { stdio: 'inherit' });
        this.logSuccess('Project built successfully');
      }
      
      // Deploy hosting
      console.log('  🚀 Deploying to Firebase Hosting...');
      execSync('firebase deploy --only hosting', { stdio: 'inherit' });
      this.logSuccess('Hosting deployed');
      
    } catch (error) {
      this.logError('HOSTING_DEPLOYMENT', 'Failed to deploy hosting', error.message);
      throw error;
    }
  }

  async deployFirestoreIndexes() {
    console.log('\n📊 Deploying Firestore indexes...');
    
    try {
      if (fs.existsSync('firestore.indexes.json')) {
        console.log('  📄 Deploying Firestore indexes...');
        execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
        this.logSuccess('Firestore indexes deployed');
      } else {
        this.logWarning('firestore.indexes.json not found - skipping index deployment');
      }
      
    } catch (error) {
      this.logError('INDEXES_DEPLOYMENT', 'Failed to deploy Firestore indexes', error.message);
      // Don't throw error for indexes as they're not critical
    }
  }

  async postDeploymentVerification() {
    console.log('\n🔍 Running post-deployment verification...');
    
    try {
      // Get project info
      const projectInfo = execSync('firebase projects:list --json', { encoding: 'utf8' });
      const projects = JSON.parse(projectInfo);
      const currentProject = projects.find(p => p.id === this.getCurrentProject());
      
      if (currentProject) {
        console.log(`  ✅ Project: ${currentProject.displayName} (${currentProject.id})`);
        this.logSuccess(`Deployed to project: ${currentProject.displayName}`);
      }
      
      // Check hosting URL
      try {
        const hostingInfo = execSync('firebase hosting:sites:list --json', { encoding: 'utf8' });
        const sites = JSON.parse(hostingInfo);
        if (sites.length > 0) {
          const primarySite = sites[0];
          console.log(`  🌐 Hosting URL: https://${primarySite.defaultDomain}`);
          this.logSuccess(`Hosting available at: https://${primarySite.defaultDomain}`);
        }
      } catch (error) {
        this.logWarning('Could not retrieve hosting information');
      }
      
    } catch (error) {
      this.logWarning('Post-deployment verification failed: ' + error.message);
    }
  }

  getCurrentProject() {
    try {
      const firebaseRc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
      return firebaseRc.projects.default;
    } catch (error) {
      return 'unknown';
    }
  }

  async generateDeploymentReport() {
    console.log('\n📋 Generating deployment report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      project: this.getCurrentProject(),
      deploymentLog: this.deploymentLog,
      summary: {
        total: this.deploymentLog.length,
        successful: this.deploymentLog.filter(log => log.type === 'SUCCESS').length,
        warnings: this.deploymentLog.filter(log => log.type === 'WARNING').length,
        errors: this.deploymentLog.filter(log => log.type === 'ERROR').length
      }
    };
    
    const reportPath = path.join(this.projectRoot, 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`  📄 Report saved to: ${reportPath}`);
    
    // Print summary
    console.log('\n📊 Deployment Summary:');
    console.log(`  ✅ Successful operations: ${report.summary.successful}`);
    console.log(`  ⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`  ❌ Errors: ${report.summary.errors}`);
    
    if (report.summary.warnings > 0) {
      console.log('\n⚠️  Warnings:');
      this.deploymentLog
        .filter(log => log.type === 'WARNING')
        .forEach(log => console.log(`    • ${log.message}`));
    }
    
    if (report.summary.errors > 0) {
      console.log('\n❌ Errors:');
      this.deploymentLog
        .filter(log => log.type === 'ERROR')
        .forEach(log => console.log(`    • ${log.message}`));
    }
  }

  logSuccess(message) {
    this.deploymentLog.push({
      type: 'SUCCESS',
      message,
      timestamp: new Date().toISOString()
    });
  }

  logWarning(message) {
    this.deploymentLog.push({
      type: 'WARNING',
      message,
      timestamp: new Date().toISOString()
    });
    console.log(`  ⚠️  ${message}`);
  }

  logError(code, message, details = '') {
    this.deploymentLog.push({
      type: 'ERROR',
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    });
    console.log(`  ❌ ${message}`);
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}

// Additional utility functions
class FirebaseSetupHelper {
  static async initializeProject() {
    console.log('🔧 Firebase Project Initialization Helper');
    console.log('=' .repeat(50));
    
    try {
      // Check if already initialized
      if (fs.existsSync('firebase.json')) {
        console.log('✅ Firebase project already initialized');
        return;
      }
      
      console.log('Initializing Firebase project...');
      execSync('firebase init', { stdio: 'inherit' });
      
      console.log('\n✅ Firebase project initialized successfully!');
      console.log('\nNext steps:');
      console.log('1. Update your .env file with Firebase configuration');
      console.log('2. Review and customize security rules');
      console.log('3. Run deployment script: node deploy-firebase.js');
      
    } catch (error) {
      console.error('❌ Failed to initialize Firebase project:', error.message);
    }
  }
  
  static async setupEnvironment() {
    console.log('🌍 Environment Setup Helper');
    console.log('=' .repeat(50));
    
    const envExample = `# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Emulators (Development)
REACT_APP_FIREBASE_EMULATOR_HOST=localhost
REACT_APP_FIREBASE_EMULATOR_AUTH_PORT=9099
REACT_APP_FIREBASE_EMULATOR_FIRESTORE_PORT=8080
REACT_APP_FIREBASE_EMULATOR_DATABASE_PORT=9000
REACT_APP_FIREBASE_EMULATOR_FUNCTIONS_PORT=5001

# Email Configuration (for Cloud Functions)
EMAIL_SERVICE_API_KEY=your_email_service_api_key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Your App Name

# Application Settings
NODE_ENV=development
REACT_APP_USE_FIREBASE=true
`;
    
    if (!fs.existsSync('.env.example')) {
      fs.writeFileSync('.env.example', envExample);
      console.log('✅ Created .env.example file');
    }
    
    if (!fs.existsSync('.env')) {
      fs.writeFileSync('.env', envExample);
      console.log('✅ Created .env file (please update with your actual values)');
    }
    
    console.log('\n📝 Please update your .env file with actual Firebase configuration values.');
    console.log('You can find these values in your Firebase Console > Project Settings > General tab.');
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'init':
      FirebaseSetupHelper.initializeProject();
      break;
    case 'setup-env':
      FirebaseSetupHelper.setupEnvironment();
      break;
    case 'deploy':
    default:
      const deployer = new FirebaseDeployer();
      deployer.deploy();
      break;
  }
}

module.exports = { FirebaseDeployer, FirebaseSetupHelper };