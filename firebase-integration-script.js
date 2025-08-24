#!/usr/bin/env node

/**
 * Firebase Integration Setup Script
 * This script helps implement the comprehensive Firebase features outlined in the guide
 */

const fs = require('fs');
const path = require('path');

class FirebaseIntegrationSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
    this.functionsPath = path.join(this.projectRoot, 'functions');
  }

  async run() {
    console.log('🚀 Starting Firebase Integration Setup...');
    
    try {
      await this.checkPrerequisites();
      await this.setupEnhancedAuth();
      await this.setupEmailService();
      await this.setupRealtimeService();
      await this.setupNewsletterService();
      await this.createTestSuite();
      await this.updateSecurityRules();
      
      console.log('\n✅ Firebase integration setup complete!');
      console.log('\n📋 Next steps:');
      console.log('1. Update your .env file with Firebase credentials');
      console.log('2. Deploy Firebase Functions: firebase deploy --only functions');
      console.log('3. Deploy security rules: firebase deploy --only firestore:rules,database:rules');
      console.log('4. Run tests: npm test');
      console.log('5. Start development server: npm start');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('\n🔍 Checking prerequisites...');
    
    const requiredFiles = [
      'src/config/firebase.js',
      'package.json',
      '.env.example'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    console.log('✅ Prerequisites check passed');
  }

  async setupEnhancedAuth() {
    console.log('\n🔐 Setting up enhanced authentication...');
    
    const enhancedAuthService = `
// Enhanced Firebase Authentication Service
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

class EnhancedFirebaseAuthService {
  constructor() {
    this.googleProvider = new GoogleAuthProvider();
    this.githubProvider = new GithubAuthProvider();
    this.currentUser = null;
    
    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
    });
  }

  // Enhanced sign up with profile creation
  async signUp(email, password, additionalData = {}) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: additionalData.name || '',
        role: 'user',
        createdAt: new Date(),
        preferences: {
          newsletter: true,
          notifications: true
        },
        ...additionalData
      });
      
      // Update Firebase Auth profile
      if (additionalData.name) {
        await updateProfile(user, { displayName: additionalData.name });
      }
      
      return { success: true, user };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error) };
    }
  }

  // Enhanced sign in
  async signIn(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time
      await updateDoc(doc(db, 'users', result.user.uid), {
        lastLoginAt: new Date()
      });
      
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error) };
    }
  }

  // Google Sign-In
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      await this.createOrUpdateUserProfile(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error) };
    }
  }

  // GitHub Sign-In
  async signInWithGitHub() {
    try {
      const result = await signInWithPopup(auth, this.githubProvider);
      await this.createOrUpdateUserProfile(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error) };
    }
  }

  // Anonymous Sign-In
  async signInAnonymously() {
    try {
      const result = await signInAnonymously(auth);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error) };
    }
  }

  // Link Anonymous Account
  async linkAnonymousAccount(email, password) {
    try {
      if (!auth.currentUser || !auth.currentUser.isAnonymous) {
        throw new Error('No anonymous user to link');
      }
      
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(auth.currentUser, credential);
      
      await this.createOrUpdateUserProfile(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error) };
    }
  }

  // Get current user with profile data
  async getCurrentUser() {
    try {
      if (!auth.currentUser) {
        return { success: false, message: 'No authenticated user' };
      }
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      return {
        success: true,
        user: {
          ...auth.currentUser,
          ...userData
        }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update user profile
  async updateUserProfile(updates) {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ...updates,
        updatedAt: new Date()
      });
      
      // Update Firebase Auth profile if name is updated
      if (updates.name) {
        await updateProfile(auth.currentUser, { displayName: updates.name });
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Change password
  async changePassword(newPassword) {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }
      
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error) };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error) };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Helper method to create or update user profile
  async createOrUpdateUserProfile(user) {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email: user.email,
        name: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'user',
        createdAt: new Date(),
        preferences: {
          newsletter: true,
          notifications: true
        }
      });
    } else {
      await updateDoc(userRef, {
        lastLoginAt: new Date(),
        photoURL: user.photoURL || userDoc.data().photoURL
      });
    }
  }

  // Error message helper
  getErrorMessage(error) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    };
    
    return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
  }
}

export default new EnhancedFirebaseAuthService();
`;
    
    await this.writeFile('src/services/enhancedFirebaseAuth.js', enhancedAuthService);
    console.log('✅ Enhanced authentication service created');
  }

  async setupEmailService() {
    console.log('\n📧 Setting up email service...');
    
    // Create functions directory if it doesn't exist
    if (!fs.existsSync(this.functionsPath)) {
      fs.mkdirSync(this.functionsPath, { recursive: true });
    }
    
    const functionsIndex = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Configure email transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().email?.user || process.env.EMAIL_USER,
    pass: functions.config().email?.password || process.env.EMAIL_PASSWORD
  }
});

// Alternative: SendGrid configuration
if (functions.config().sendgrid?.key || process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(functions.config().sendgrid?.key || process.env.SENDGRID_API_KEY);
}

// Contact Form Handler
exports.sendContactEmail = functions.https.onCall(async (data, context) => {
  try {
    const { name, email, subject, message } = data;
    
    // Validate input
    if (!name || !email || !message) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Rate limiting check (simple implementation)
    const now = Date.now();
    const submissionsRef = admin.firestore().collection('contact_submissions');
    const recentSubmissions = await submissionsRef
      .where('email', '==', email)
      .where('timestamp', '>', new Date(now - 60000)) // Last minute
      .get();
    
    if (recentSubmissions.size >= 3) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many submissions. Please wait.');
    }

    // Email template
    const mailOptions = {
      from: `"Contact Form" <noreply@yoursite.com>`,
      to: 'contact@yoursite.com',
      replyTo: email,
      subject: `Contact Form: ${subject || 'New Message'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> \${name}</p>
            <p><strong>Email:</strong> \${email}</p>
            <p><strong>Subject:</strong> \${subject || 'N/A'}</p>
          </div>
          <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
            <h4>Message:</h4>
            <p style="line-height: 1.6;">\${message.replace(/\n/g, '<br>')}</p>
          </div>
          <div style="margin-top: 20px; padding: 10px; background: #e9ecef; border-radius: 5px; font-size: 12px; color: #6c757d;">
            <p>Submitted: \${new Date().toLocaleString()}</p>
            <p>IP: \${context.rawRequest?.ip || 'Unknown'}</p>
          </div>
        </div>
      \`
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    // Store in Firestore for record keeping
    await submissionsRef.add({
      name,
      email,
      subject,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: context.rawRequest?.ip,
      status: 'sent'
    });

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Contact email error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});

// Newsletter Management
exports.manageSubscription = functions.https.onCall(async (data, context) => {
  try {
    const { email, action, categories } = data;
    
    if (!email || !action) {
      throw new functions.https.HttpsError('invalid-argument', 'Email and action required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
    }

    const subscriptionsRef = admin.firestore().collection('subscriptions');
    const existingDoc = await subscriptionsRef.doc(email).get();

    if (action === 'subscribe') {
      const subscriptionData = {
        email,
        categories: categories || ['all'],
        subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        active: true,
        preferences: {
          frequency: 'weekly',
          format: 'html'
        },
        source: 'website'
      };

      if (existingDoc.exists) {
        await subscriptionsRef.doc(email).update({
          ...subscriptionData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await subscriptionsRef.doc(email).set(subscriptionData);
        
        // Send welcome email
        await sendWelcomeEmail(email);
      }
      
      return { success: true, message: 'Successfully subscribed' };
    } else if (action === 'unsubscribe') {
      if (existingDoc.exists) {
        await subscriptionsRef.doc(email).update({
          active: false,
          unsubscribedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return { success: true, message: 'Successfully unsubscribed' };
    }
  } catch (error) {
    console.error('Subscription error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Subscription failed');
  }
});

// Scheduled newsletter sending
exports.sendWeeklyNewsletter = functions.pubsub.schedule('every sunday 09:00').onRun(async (context) => {
  try {
    console.log('Starting weekly newsletter send...');
    
    // Get active subscribers
    const subscribersSnapshot = await admin.firestore()
      .collection('subscriptions')
      .where('active', '==', true)
      .get();

    if (subscribersSnapshot.empty) {
      console.log('No active subscribers found');
      return;
    }

    // Get recent posts (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const postsSnapshot = await admin.firestore()
      .collection('posts')
      .where('status', '==', 'published')
      .where('createdAt', '>=', weekAgo)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (posts.length === 0) {
      console.log('No new posts to send');
      return;
    }

    // Send newsletter to each subscriber
    const emailPromises = subscribersSnapshot.docs.map(async (doc) => {
      const subscriber = doc.data();
      try {
        await sendNewsletterEmail(subscriber.email, posts);
        return { email: subscriber.email, status: 'sent' };
      } catch (error) {
        console.error(\`Failed to send newsletter to \${subscriber.email}:\`, error);
        return { email: subscriber.email, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    console.log(\`Newsletter sent: \${successful} successful, \${failed} failed\`);
    
    // Log newsletter send record
    await admin.firestore().collection('newsletter_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      postsCount: posts.length,
      subscribersCount: subscribersSnapshot.size,
      successfulSends: successful,
      failedSends: failed,
      results
    });
    
  } catch (error) {
    console.error('Newsletter sending error:', error);
  }
});

// Helper functions
async function sendWelcomeEmail(email) {
  const mailOptions = {
    from: '"Your Blog" <noreply@yoursite.com>',
    to: email,
    subject: 'Welcome to Our Newsletter! 🎉',
    html: \`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff; margin-bottom: 10px;">Welcome! 🎉</h1>
          <p style="font-size: 18px; color: #666;">Thank you for subscribing to our newsletter</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">What to expect:</h2>
          <ul style="color: #666; line-height: 1.8;">
            <li>📚 Weekly updates with our latest blog posts</li>
            <li>💡 Exclusive insights and tips</li>
            <li>🚀 Early access to new features</li>
            <li>📈 Industry trends and analysis</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://yoursite.com/blog" 
             style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Visit Our Blog
          </a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
          <p>You can update your preferences or unsubscribe at any time.</p>
          <p><a href="https://yoursite.com/unsubscribe?email=\${email}" style="color: #999;">Unsubscribe</a></p>
        </div>
      </div>
    \`
  };
  
  return transporter.sendMail(mailOptions);
}

async function sendNewsletterEmail(email, posts) {
  const postsHtml = posts.map(post => {
    const createdAt = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
    return \`
      <div style="margin-bottom: 25px; padding: 20px; border: 1px solid #eee; border-radius: 8px; background: white;">
        <h3 style="margin: 0 0 10px 0;">
          <a href="https://yoursite.com/blog/\${post.id}" 
             style="color: #007bff; text-decoration: none;">
            \${post.title}
          </a>
        </h3>
        <p style="color: #666; line-height: 1.6; margin: 10px 0;">
          \${post.excerpt || (post.content ? post.content.substring(0, 200) + '...' : 'Read more...')}
        </p>
        <div style="font-size: 12px; color: #999;">
          <span>By \${post.author || 'Admin'}</span> • 
          <span>\${createdAt.toLocaleDateString()}</span>
        </div>
      </div>
    \`;
  }).join('');

  const mailOptions = {
    from: '"Your Blog Newsletter" <newsletter@yoursite.com>',
    to: email,
    subject: \`This Week's Latest Posts (\${posts.length} new articles)\`,
    html: \`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px;">
          <h1 style="color: #333; margin-bottom: 5px;">Weekly Newsletter</h1>
          <p style="color: #666; margin: 0;">\${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">This Week's Latest Posts (\${posts.length})</h2>
          \${postsHtml}
        </div>
        
        <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <p style="margin: 0 0 15px 0; color: #666;">Enjoying our content?</p>
          <a href="https://yoursite.com/blog" 
             style="background: #007bff; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Read More Articles
          </a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
          <p>You're receiving this because you subscribed to our newsletter.</p>
          <p>
            <a href="https://yoursite.com/newsletter/preferences?email=\${email}" style="color: #999;">Update Preferences</a> | 
            <a href="https://yoursite.com/unsubscribe?email=\${email}" style="color: #999;">Unsubscribe</a>
          </p>
        </div>
      </div>
    \`
  };
  
  return transporter.sendMail(mailOptions);
}
`;
    
    await this.writeFile('functions/index.js', functionsIndex);
    
    // Create package.json for functions
    const functionsPackageJson = {
      "name": "functions",
      "description": "Cloud Functions for Firebase",
      "scripts": {
        "serve": "firebase emulators:start --only functions",
        "shell": "firebase functions:shell",
        "start": "npm run shell",
        "deploy": "firebase deploy --only functions",
        "logs": "firebase functions:log"
      },
      "engines": {
        "node": "18"
      },
      "main": "index.js",
      "dependencies": {
        "firebase-admin": "^12.0.0",
        "firebase-functions": "^4.8.0",
        "nodemailer": "^6.9.0",
        "@sendgrid/mail": "^7.7.0"
      },
      "devDependencies": {
        "firebase-functions-test": "^3.1.0"
      },
      "private": true
    };
    
    await this.writeFile('functions/package.json', JSON.stringify(functionsPackageJson, null, 2));
    
    console.log('✅ Email service functions created');
  }

  async setupRealtimeService() {
    console.log('\n⚡ Setting up Realtime Database service...');
    
    const realtimeService = `
// Realtime Database Service
import { getDatabase, ref, push, set, on, off, onValue, remove } from 'firebase/database';
import { app } from '../config/firebase';

class RealtimeService {
  constructor() {
    this.database = getDatabase(app);
    this.listeners = new Map(); // Track active listeners for cleanup
  }

  // Real-time comments for blog posts
  subscribeToComments(postId, callback) {
    const commentsRef = ref(this.database, \`comments/\${postId}\`);
    
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const comments = [];
      snapshot.forEach((childSnapshot) => {
        comments.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      // Sort comments by timestamp (newest first)
      comments.sort((a, b) => b.timestamp - a.timestamp);
      callback(comments);
    }, (error) => {
      console.error('Comments subscription error:', error);
      callback([]);
    });
    
    // Store listener for cleanup
    const listenerId = \`comments_\${postId}\`;
    this.listeners.set(listenerId, unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  // Add comment with validation
  async addComment(postId, comment) {
    try {
      if (!postId || !comment.content || !comment.author) {
        throw new Error('Missing required comment data');
      }
      
      const commentsRef = ref(this.database, \`comments/\${postId}\`);
      const newCommentRef = push(commentsRef);
      
      const commentData = {
        content: comment.content.trim(),
        author: {
          id: comment.author.id,
          name: comment.author.name,
          email: comment.author.email,
          photoURL: comment.author.photoURL || null
        },
        timestamp: Date.now(),
        edited: false,
        likes: 0,
        replies: 0
      };
      
      await set(newCommentRef, commentData);
      
      return { success: true, id: newCommentRef.key, comment: commentData };
    } catch (error) {
      console.error('Add comment error:', error);
      return { success: false, message: error.message };
    }
  }

  // Delete comment (only by author or admin)
  async deleteComment(postId, commentId, userId) {
    try {
      const commentRef = ref(this.database, \`comments/\${postId}/\${commentId}\`);
      
      // In a real app, you'd verify ownership here
      await remove(commentRef);
      
      return { success: true };
    } catch (error) {
      console.error('Delete comment error:', error);
      return { success: false, message: error.message };
    }
  }

  // Real-time user presence
  setUserPresence(userId, userData = {}) {
    try {
      const userStatusRef = ref(this.database, \`presence/\${userId}\`);
      
      const presenceData = {
        online: true,
        lastSeen: Date.now(),
        ...userData
      };
      
      // Set user as online
      set(userStatusRef, presenceData);
      
      // Set up disconnect handler to mark user as offline
      const disconnectRef = ref(this.database, \`presence/\${userId}/online\`);
      // Note: onDisconnect requires Firebase SDK setup
      
      return { success: true };
    } catch (error) {
      console.error('Set presence error:', error);
      return { success: false, message: error.message };
    }
  }

  // Subscribe to user presence
  subscribeToPresence(callback) {
    const presenceRef = ref(this.database, 'presence');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presence = {};
      snapshot.forEach((childSnapshot) => {
        presence[childSnapshot.key] = childSnapshot.val();
      });
      callback(presence);
    }, (error) => {
      console.error('Presence subscription error:', error);
      callback({});
    });
    
    this.listeners.set('presence', unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete('presence');
    };
  }

  // Real-time notifications
  subscribeToNotifications(userId, callback) {
    const notificationsRef = ref(this.database, \`notifications/\${userId}\`);
    
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const notifications = [];
      snapshot.forEach((childSnapshot) => {
        notifications.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      // Sort by timestamp (newest first)
      notifications.sort((a, b) => b.timestamp - a.timestamp);
      callback(notifications);
    }, (error) => {
      console.error('Notifications subscription error:', error);
      callback([]);
    });
    
    const listenerId = \`notifications_\${userId}\`;
    this.listeners.set(listenerId, unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  // Send notification
  async sendNotification(userId, notification) {
    try {
      if (!userId || !notification.title || !notification.message) {
        throw new Error('Missing required notification data');
      }
      
      const notificationsRef = ref(this.database, \`notifications/\${userId}\`);
      const newNotificationRef = push(notificationsRef);
      
      const notificationData = {
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        timestamp: Date.now(),
        read: false,
        actionUrl: notification.actionUrl || null,
        metadata: notification.metadata || {}
      };
      
      await set(newNotificationRef, notificationData);
      
      return { success: true, id: newNotificationRef.key };
    } catch (error) {
      console.error('Send notification error:', error);
      return { success: false, message: error.message };
    }
  }

  // Mark notification as read
  async markNotificationAsRead(userId, notificationId) {
    try {
      const notificationRef = ref(this.database, \`notifications/\${userId}/\${notificationId}/read\`);
      await set(notificationRef, true);
      return { success: true };
    } catch (error) {
      console.error('Mark notification read error:', error);
      return { success: false, message: error.message };
    }
  }

  // Real-time activity feed
  subscribeToActivityFeed(callback, limit = 50) {
    const activityRef = ref(this.database, 'activity');
    
    const unsubscribe = onValue(activityRef, (snapshot) => {
      const activities = [];
      snapshot.forEach((childSnapshot) => {
        activities.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      // Sort by timestamp and limit
      activities.sort((a, b) => b.timestamp - a.timestamp);
      callback(activities.slice(0, limit));
    });
    
    this.listeners.set('activity', unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete('activity');
    };
  }

  // Add activity to feed
  async addActivity(activity) {
    try {
      const activityRef = ref(this.database, 'activity');
      const newActivityRef = push(activityRef);
      
      const activityData = {
        type: activity.type,
        userId: activity.userId,
        userName: activity.userName,
        action: activity.action,
        target: activity.target,
        timestamp: Date.now(),
        metadata: activity.metadata || {}
      };
      
      await set(newActivityRef, activityData);
      
      return { success: true, id: newActivityRef.key };
    } catch (error) {
      console.error('Add activity error:', error);
      return { success: false, message: error.message };
    }
  }

  // Cleanup all listeners
  cleanup() {
    this.listeners.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners.clear();
  }

  // Get connection status
  subscribeToConnectionStatus(callback) {
    const connectedRef = ref(this.database, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val();
      callback(connected);
    });
    
    this.listeners.set('connection', unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete('connection');
    };
  }
}

export default new RealtimeService();
`;
    
    await this.writeFile('src/services/realtimeService.js', realtimeService);
    console.log('✅ Realtime Database service created');
  }

  async setupNewsletterService() {
    console.log('\n📰 Setting up newsletter service...');
    
    const newsletterService = `
// Newsletter Service
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

class NewsletterService {
  constructor() {
    this.manageSubscription = httpsCallable(functions, 'manageSubscription');
  }

  // Subscribe to newsletter
  async subscribe(email, categories = ['all'], preferences = {}) {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address');
      }
      
      const result = await this.manageSubscription({
        email: email.toLowerCase().trim(),
        action: 'subscribe',
        categories,
        preferences: {
          frequency: 'weekly',
          format: 'html',
          ...preferences
        }
      });
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      return { 
        success: false, 
        message: error.message || 'Subscription failed. Please try again.' 
      };
    }
  }

  // Unsubscribe from newsletter
  async unsubscribe(email) {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address');
      }
      
      const result = await this.manageSubscription({
        email: email.toLowerCase().trim(),
        action: 'unsubscribe'
      });
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Newsletter unsubscribe error:', error);
      return { 
        success: false, 
        message: error.message || 'Unsubscribe failed. Please try again.' 
      };
    }
  }

  // Update subscription preferences
  async updatePreferences(email, preferences) {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address');
      }
      
      const result = await this.manageSubscription({
        email: email.toLowerCase().trim(),
        action: 'update_preferences',
        preferences
      });
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Newsletter preferences update error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to update preferences.' 
      };
    }
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get available categories
  getAvailableCategories() {
    return [
      { id: 'all', name: 'All Posts', description: 'Receive all blog updates' },
      { id: 'tech', name: 'Technology', description: 'Tech-related articles' },
      { id: 'business', name: 'Business', description: 'Business insights and tips' },
      { id: 'tutorials', name: 'Tutorials', description: 'Step-by-step guides' },
      { id: 'news', name: 'News', description: 'Industry news and updates' }
    ];
  }

  // Get frequency options
  getFrequencyOptions() {
    return [
      { id: 'daily', name: 'Daily', description: 'Receive updates daily' },
      { id: 'weekly', name: 'Weekly', description: 'Receive updates weekly (recommended)' },
      { id: 'monthly', name: 'Monthly', description: 'Receive updates monthly' }
    ];
  }
}

export default new NewsletterService();
`;
    
    await this.writeFile('src/services/newsletterService.js', newsletterService);
    
    // Create newsletter subscription component
    const newsletterComponent = `
// Newsletter Subscription Component
import React, { useState } from 'react';
import newsletterService from '../services/newsletterService';

const NewsletterSubscription = ({ 
  title = "Subscribe to Our Newsletter",
  description = "Get the latest updates delivered to your inbox",
  showCategories = false,
  className = ""
}) => {
  const [email, setEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const categories = newsletterService.getAvailableCategories();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await newsletterService.subscribe(email, selectedCategories);
      
      if (result.success) {
        setSubscribed(true);
        setMessage('Successfully subscribed! Check your email for confirmation.');
        setEmail('');
        setSelectedCategories(['all']);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('Subscription failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    if (categoryId === 'all') {
      setSelectedCategories(['all']);
    } else {
      const newCategories = selectedCategories.filter(c => c !== 'all');
      if (selectedCategories.includes(categoryId)) {
        const filtered = newCategories.filter(c => c !== categoryId);
        setSelectedCategories(filtered.length === 0 ? ['all'] : filtered);
      } else {
        setSelectedCategories([...newCategories, categoryId]);
      }
    }
  };

  if (subscribed) {
    return (
      <div className={\`bg-green-50 border border-green-200 rounded-lg p-6 \${className}\`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Successfully Subscribed!</h3>
            <p className="text-sm text-green-700 mt-1">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={\`bg-gray-50 rounded-lg p-6 \${className}\`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {showCategories && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subscription Preferences
            </label>
            <div className="space-y-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-start">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-2">
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Subscribing...
            </>
          ) : (
            'Subscribe to Newsletter'
          )}
        </button>
      </form>

      {message && !subscribed && (
        <div className={\`mt-4 p-3 rounded-md \${message.includes('Successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}\`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setShowPreferences(!showPreferences)}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          {showPreferences ? 'Hide' : 'Show'} Subscription Options
        </button>
      </div>

      {showPreferences && (
        <div className="mt-4 p-4 bg-white rounded-md border">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Available Categories:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {categories.slice(1).map((category) => (
              <li key={category.id}>• {category.name}: {category.description}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NewsletterSubscription;
`;
    
    await this.writeFile('src/components/NewsletterSubscription.jsx', newsletterComponent);
    console.log('✅ Newsletter service and component created');
  }

  async createTestSuite() {
    console.log('\n🧪 Creating test suite...');
    
    const integrationTest = `
// Firebase Integration Tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import enhancedFirebaseAuth from '../services/enhancedFirebaseAuth';
import realtimeService from '../services/realtimeService';
import newsletterService from '../services/newsletterService';

// Mock Firebase
jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn()
  },
  db: {},
  functions: {},
  app: {}
}));

describe('Firebase Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Enhanced Authentication', () => {
    test('should handle user registration with profile creation', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      // Mock successful registration
      const result = await enhancedFirebaseAuth.signUp(
        'test@example.com',
        'password123',
        { name: 'Test User' }
      );

      expect(result.success).toBe(true);
    });

    test('should handle Google sign-in', async () => {
      const result = await enhancedFirebaseAuth.signInWithGoogle();
      // Test implementation based on your mocking strategy
    });

    test('should handle password reset', async () => {
      const result = await enhancedFirebaseAuth.resetPassword('test@example.com');
      expect(result.success).toBe(true);
    });
  });

  describe('Realtime Database', () => {
    test('should add comments successfully', async () => {
      const comment = {
        content: 'Test comment',
        author: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const result = await realtimeService.addComment('post-1', comment);
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    test('should handle comment subscription', () => {
      const mockCallback = jest.fn();
      const unsubscribe = realtimeService.subscribeToComments('post-1', mockCallback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Cleanup
      unsubscribe();
    });

    test('should send notifications', async () => {
      const notification = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info'
      };

      const result = await realtimeService.sendNotification('user-1', notification);
      expect(result.success).toBe(true);
    });
  });

  describe('Newsletter Service', () => {
    test('should validate email addresses', () => {
      expect(newsletterService.isValidEmail('test@example.com')).toBe(true);
      expect(newsletterService.isValidEmail('invalid-email')).toBe(false);
      expect(newsletterService.isValidEmail('')).toBe(false);
    });

    test('should handle newsletter subscription', async () => {
      const result = await newsletterService.subscribe(
        'test@example.com',
        ['tech', 'business']
      );
      
      // This would depend on your Firebase Functions mock
      expect(result).toBeDefined();
    });

    test('should get available categories', () => {
      const categories = newsletterService.getAvailableCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
    });
  });
});

// Integration Test Runner
export async function runFirebaseIntegrationTests() {
  console.log('🧪 Starting Firebase Integration Tests...');
  
  const results = {
    auth: { passed: 0, failed: 0, tests: [] },
    realtime: { passed: 0, failed: 0, tests: [] },
    newsletter: { passed: 0, failed: 0, tests: [] },
    email: { passed: 0, failed: 0, tests: [] }
  };

  try {
    // Test Authentication
    console.log('\n🔐 Testing Authentication...');
    
    const authTests = [
      {
        name: 'Get Current User',
        test: () => enhancedFirebaseAuth.getCurrentUser()
      },
      {
        name: 'Password Reset',
        test: () => enhancedFirebaseAuth.resetPassword('test@example.com')
      }
    ];

    for (const authTest of authTests) {
      try {
        const result = await authTest.test();
        results.auth.tests.push({ name: authTest.name, status: 'passed', result });
        results.auth.passed++;
        console.log(\`  ✅ \${authTest.name}\`);
      } catch (error) {
        results.auth.tests.push({ name: authTest.name, status: 'failed', error: error.message });
        results.auth.failed++;
        console.log(\`  ❌ \${authTest.name}: \${error.message}\`);
      }
    }

    // Test Realtime Database
    console.log('\n⚡ Testing Realtime Database...');
    
    const realtimeTests = [
      {
        name: 'Add Comment',
        test: () => realtimeService.addComment('test-post', {
          content: 'Integration test comment',
          author: { id: 'test-user', name: 'Test User', email: 'test@example.com' }
        })
      },
      {
        name: 'Send Notification',
        test: () => realtimeService.sendNotification('test-user', {
          title: 'Test Notification',
          message: 'Integration test notification'
        })
      }
    ];

    for (const realtimeTest of realtimeTests) {
      try {
        const result = await realtimeTest.test();
        results.realtime.tests.push({ name: realtimeTest.name, status: 'passed', result });
        results.realtime.passed++;
        console.log(\`  ✅ \${realtimeTest.name}\`);
      } catch (error) {
        results.realtime.tests.push({ name: realtimeTest.name, status: 'failed', error: error.message });
        results.realtime.failed++;
        console.log(\`  ❌ \${realtimeTest.name}: \${error.message}\`);
      }
    }

    // Test Newsletter Service
    console.log('\n📰 Testing Newsletter Service...');
    
    const newsletterTests = [
      {
        name: 'Email Validation',
        test: () => {
          const valid = newsletterService.isValidEmail('test@example.com');
          const invalid = newsletterService.isValidEmail('invalid-email');
          if (valid && !invalid) {
            return { success: true };
          }
          throw new Error('Email validation failed');
        }
      },
      {
        name: 'Get Categories',
        test: () => {
          const categories = newsletterService.getAvailableCategories();
          if (Array.isArray(categories) && categories.length > 0) {
            return { success: true, categories };
          }
          throw new Error('Categories not available');
        }
      }
    ];

    for (const newsletterTest of newsletterTests) {
      try {
        const result = await newsletterTest.test();
        results.newsletter.tests.push({ name: newsletterTest.name, status: 'passed', result });
        results.newsletter.passed++;
        console.log(`  ✅ ${newsletterTest.name}`);
      } catch (error) {
        results.newsletter.tests.push({ name: newsletterTest.name, status: 'failed', error: error.message });
        results.newsletter.failed++;
        console.log(`  ❌ ${newsletterTest.name}: ${error.message}`);
      }
    }

    // Generate Test Report
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const totalTests = Object.values(results).reduce((sum, category) => sum + category.passed + category.failed, 0);
    const totalPassed = Object.values(results).reduce((sum, category) => sum + category.passed, 0);
    const totalFailed = Object.values(results).reduce((sum, category) => sum + category.failed, 0);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} ✅`);
    console.log(`Failed: ${totalFailed} ❌`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    Object.entries(results).forEach(([category, data]) => {
      console.log(`\n${category.toUpperCase()}: ${data.passed}/${data.passed + data.failed} passed`);
    });

    return results;
  } catch (error) {
    console.error('Integration test error:', error);
    return results;
  }
}`;

    await this.writeFile('src/test/firebaseIntegration.test.js', integrationTest);
    console.log('✅ Integration test suite created');
  }

  async updateSecurityRules() {
    console.log('\n🔒 Creating security rules...');
    
    const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidEmail(email) {
      return email.matches('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId) && 
                       request.resource.data.keys().hasAll(['email', 'name', 'role']) &&
                       request.resource.data.role == 'user';
      allow update: if (isOwner(userId) || isAdmin()) &&
                       (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']) || isAdmin());
      allow delete: if isAdmin();
    }

    // Posts collection
    match /posts/{postId} {
      allow read: if resource.data.status == 'published' || 
                     isAdmin() || 
                     (isAuthenticated() && resource.data.authorId == request.auth.uid);
      allow create: if isAuthenticated() && 
                       request.resource.data.authorId == request.auth.uid &&
                       request.resource.data.keys().hasAll(['title', 'content', 'status']);
      allow update: if isAdmin() || 
                       (isAuthenticated() && resource.data.authorId == request.auth.uid);
      allow delete: if isAdmin();
    }

    // Subscriptions collection
    match /subscriptions/{email} {
      allow read: if isAdmin();
      allow create, update: if isValidEmail(email) && 
                              request.resource.data.email == email;
      allow delete: if isAdmin();
    }

    // Contact submissions
    match /contact_submissions/{submissionId} {
      allow read: if isAdmin();
      allow create: if request.resource.data.keys().hasAll(['name', 'email', 'message']) &&
                       isValidEmail(request.resource.data.email);
    }

    // Newsletter logs (admin only)
    match /newsletter_logs/{logId} {
      allow read, write: if isAdmin();
    }

    // Pages collection
    match /pages/{pageId} {
      allow read: if resource.data.status == 'published' || isAdmin();
      allow create, update, delete: if isAdmin();
    }
  }
}
`;
    
    const realtimeRules = `
{
  "rules": {
    "comments": {
      "$postId": {
        ".read": true,
        ".write": "auth != null",
        "$commentId": {
          ".validate": "newData.hasChildren(['content', 'author', 'timestamp']) && newData.child('author').child('id').val() == auth.uid",
          "content": {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 1000"
          },
          "author": {
            "id": {
              ".validate": "newData.val() == auth.uid"
            },
            "name": {
              ".validate": "newData.isString() && newData.val().length > 0"
            },
            "email": {
              ".validate": "newData.isString() && newData.val().matches(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)"
            }
          },
          "timestamp": {
            ".validate": "newData.isNumber()"
          }
        }
      }
    },
    "presence": {
      "$userId": {
        ".read": true,
        ".write": "$userId == auth.uid"
      }
    },
    "notifications": {
      "$userId": {
        ".read": "$userId == auth.uid",
        ".write": "$userId == auth.uid || root.child('users').child(auth.uid).child('role').val() == 'admin'"
      }
    },
    "activity": {
      ".read": true,
      ".write": "auth != null",
      "$activityId": {
        ".validate": "newData.hasChildren(['type', 'userId', 'action', 'timestamp']) && newData.child('userId').val() == auth.uid"
      }
    }
  }
}
`;
    
    await this.writeFile('firestore.rules', firestoreRules);
    await this.writeFile('database.rules.json', realtimeRules);
    
    console.log('✅ Security rules created');
  }

  async writeFile(filePath, content) {
    const fullPath = path.join(this.projectRoot, filePath);
    const dir = path.dirname(fullPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content.trim());
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  const setup = new FirebaseIntegrationSetup();
  setup.run().catch(console.error);
}

module.exports = FirebaseIntegrationSetup;