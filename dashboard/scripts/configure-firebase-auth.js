#!/usr/bin/env node

/**
 * Firebase Authentication Configuration Script
 * Helps configure Firebase Authentication with Google OAuth integration
 */

const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

console.log("🔐 Firebase Authentication Configuration Script");
console.log("==============================================\n");

// Check Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

console.log("📋 Firebase Configuration Check:");
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (value && !value.includes("your_")) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${key}: Missing or placeholder value`);
  }
});

// Check Google OAuth configuration
const googleConfig = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI,
};

console.log("\n🔍 Google OAuth Configuration Check:");
if (googleConfig.clientId && !googleConfig.clientId.includes("your_")) {
  console.log(`✅ Google Client ID: ${googleConfig.clientId}`);
} else {
  console.log(`❌ Google Client ID: Missing or placeholder value`);
}

if (googleConfig.redirectUri) {
  console.log(`ℹ️  Google Redirect URI: ${googleConfig.redirectUri}`);
} else {
  console.log(`❌ Google Redirect URI: Missing`);
}

// Instructions for Google Cloud Console configuration
console.log("\n🔧 Google Cloud Console Configuration Instructions:");
console.log("1. Go to https://console.cloud.google.com/");
console.log("2. Select your project (devinquirecom)");
console.log('3. Navigate to "APIs & Services" > "Credentials"');
console.log("4. Find your OAuth 2.0 Client ID:");
console.log(`   Client ID: ${googleConfig.clientId || "Not configured"}`);
console.log("5. Click the edit icon (pencil)");
console.log('6. Under "Authorized redirect URIs", ensure these are added:');
console.log("   - http://localhost:3000/auth/google/callback");
console.log("   - http://localhost:3001/auth/google/callback");
console.log("   - http://localhost:3002/auth/google/callback");
console.log("   - http://127.0.0.1:3000/auth/google/callback");
console.log(
  "   - https://yourdomain.com/auth/google/callback (for production)"
);
console.log(
  '7. Under "Authorized JavaScript origins", ensure these are added:'
);
console.log("   - http://localhost:3000");
console.log("   - http://localhost:3001");
console.log("   - http://localhost:3002");
console.log("   - http://127.0.0.1:3000");
console.log("   - https://yourdomain.com (for production)");
console.log('8. Click "Save"');

// Firebase Authentication configuration
console.log("\n🔥 Firebase Authentication Setup:");
console.log("1. Go to https://console.firebase.google.com/");
console.log("2. Select your project (devinquirecom)");
console.log('3. Navigate to "Authentication" > "Sign-in method"');
console.log('4. Enable "Google" sign-in provider');
console.log("5. For Google sign-in configuration:");
console.log(`   - Project ID: ${firebaseConfig.projectId || "Not configured"}`);
console.log(`   - Client ID: ${googleConfig.clientId || "Not configured"}`);
console.log('   - Whitelist your domain(s) in "Authorized domains"');
console.log(
  '6. Enable "Email/Password" sign-in provider for email authentication'
);
console.log('7. Enable "GitHub" sign-in provider if needed');

// Test the configuration
console.log("\n🧪 Testing Configuration:");
console.log("To test your configuration, run:");
console.log("npm start");
console.log(
  "Then navigate to http://localhost:3000 and try signing in with Google"
);

// Fix duplicate Google Client ID issue
console.log("\n🔧 Fixing duplicate Google Client ID issue...");
const envLocalPath = path.join(__dirname, "..", ".env.local");
let envContent = fs.readFileSync(envLocalPath, "utf8");

// Count occurrences of REACT_APP_GOOGLE_CLIENT_ID
const clientIdMatches = envContent.match(/REACT_APP_GOOGLE_CLIENT_ID/g) || [];
if (clientIdMatches.length > 1) {
  console.log(
    `Found ${clientIdMatches.length} occurrences of REACT_APP_GOOGLE_CLIENT_ID`
  );

  // Remove duplicate lines
  const lines = envContent.split("\n");
  const filteredLines = [];
  let clientIdFound = false;

  for (const line of lines) {
    if (line.includes("REACT_APP_GOOGLE_CLIENT_ID")) {
      if (!clientIdFound) {
        filteredLines.push(line);
        clientIdFound = true;
      } else {
        console.log(`Removing duplicate line: ${line}`);
      }
    } else {
      filteredLines.push(line);
    }
  }

  envContent = filteredLines.join("\n");
  fs.writeFileSync(envLocalPath, envContent);
  console.log("✅ Fixed duplicate Google Client ID issue");
}

console.log("\n✅ Configuration check complete!");
console.log(
  "Please follow the instructions above to properly configure Firebase Authentication with Google OAuth."
);
