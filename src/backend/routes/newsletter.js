/**
 * Newsletter Routes
 * Handles blog subscriptions and email campaigns
 */

const express = require('express');
const { firebaseAdmin } = require('../firebaseAdmin');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiting for newsletter endpoints
const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 newsletter requests per windowMs
  message: {
    error: 'Too many newsletter requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Email validation function
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Configure nodemailer transporter
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
};

/**
 * Subscribe to Newsletter
 * POST /api/newsletter/subscribe
 */
router.post('/subscribe', newsletterLimiter, async (req, res) => {
  try {
    const { email, name, categories = ['general'], source = 'website' } = req.body;
    
    // Validation
    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email address',
        code: 'INVALID_EMAIL'
      });
    }
    
    const db = firebaseAdmin.getFirestore();
    
    // Check if email already exists
    const existingSubscription = await db.collection('subscriptions')
      .where('email', '==', email.toLowerCase())
      .get();
    
    if (!existingSubscription.empty) {
      const existingDoc = existingSubscription.docs[0];
      const existingData = existingDoc.data();
      
      if (existingData.status === 'active') {
        return res.status(409).json({
          error: 'Email already subscribed',
          code: 'ALREADY_SUBSCRIBED'
        });
      } else {
        // Reactivate subscription
        await db.collection('subscriptions').doc(existingDoc.id).update({
          status: 'active',
          name: name || existingData.name,
          categories: Array.isArray(categories) ? categories : ['general'],
          resubscribedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        return res.json({
          success: true,
          message: 'Subscription reactivated successfully',
          subscriptionId: existingDoc.id
        });
      }
    }
    
    // Create new subscription
    const subscriptionData = {
      email: email.toLowerCase(),
      name: name || null,
      categories: Array.isArray(categories) ? categories : ['general'],
      status: 'active',
      source,
      subscribedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      confirmationToken: null, // For double opt-in if needed
      confirmed: true // Set to false if using double opt-in
    };
    
    const docRef = await db.collection('subscriptions').add(subscriptionData);
    
    // Send welcome email
    try {
      const transporter = createTransporter();
      
      const welcomeMailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to DevInquire Newsletter!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0;">Welcome to DevInquire!</h1>
              <p style="color: #6c757d; margin: 10px 0 0 0;">Thank you for subscribing to our newsletter</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin-top: 0;">What to Expect</h2>
              <ul style="color: #555; line-height: 1.6;">
                <li>🚀 Latest development tutorials and guides</li>
                <li>💡 Programming tips and best practices</li>
                <li>📰 Industry news and trends</li>
                <li>🛠️ Tool recommendations and reviews</li>
              </ul>
            </div>
            
            <div style="background: #fff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #007bff; margin-top: 0;">Your Subscription Details</h3>
              <p><strong>Email:</strong> ${email}</p>
              ${name ? `<p><strong>Name:</strong> ${name}</p>` : ''}
              <p><strong>Categories:</strong> ${categories.join(', ')}</p>
              <p><strong>Subscribed:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://devinquire.com'}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Visit DevInquire
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <div style="text-align: center; color: #6c757d; font-size: 12px;">
              <p>You can update your preferences or unsubscribe at any time.</p>
              <p>
                <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe?token=${docRef.id}" 
                   style="color: #6c757d;">Unsubscribe</a> | 
                <a href="${process.env.FRONTEND_URL}/newsletter/preferences?token=${docRef.id}" 
                   style="color: #6c757d;">Update Preferences</a>
              </p>
            </div>
          </div>
        `
      };
      
      await transporter.sendMail(welcomeMailOptions);
      
    } catch (emailError) {
      console.error('Welcome email failed:', emailError.message);
      // Don't fail the subscription if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      subscriptionId: docRef.id
    });
    
  } catch (error) {
    console.error('Newsletter subscription error:', error.message);
    res.status(500).json({
      error: 'Failed to subscribe to newsletter',
      code: 'SUBSCRIPTION_FAILED'
    });
  }
});

/**
 * Unsubscribe from Newsletter
 * POST /api/newsletter/unsubscribe
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email, token } = req.body;
    
    if (!email && !token) {
      return res.status(400).json({
        error: 'Email or unsubscribe token is required',
        code: 'EMAIL_OR_TOKEN_REQUIRED'
      });
    }
    
    const db = firebaseAdmin.getFirestore();
    let subscriptionDoc;
    
    if (token) {
      // Unsubscribe by token
      subscriptionDoc = await db.collection('subscriptions').doc(token).get();
    } else {
      // Unsubscribe by email
      const subscriptions = await db.collection('subscriptions')
        .where('email', '==', email.toLowerCase())
        .where('status', '==', 'active')
        .get();
      
      if (subscriptions.empty) {
        return res.status(404).json({
          error: 'Active subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        });
      }
      
      subscriptionDoc = subscriptions.docs[0];
    }
    
    if (!subscriptionDoc.exists) {
      return res.status(404).json({
        error: 'Subscription not found',
        code: 'SUBSCRIPTION_NOT_FOUND'
      });
    }
    
    // Update subscription status
    await db.collection('subscriptions').doc(subscriptionDoc.id).update({
      status: 'unsubscribed',
      unsubscribedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
    
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error.message);
    res.status(500).json({
      error: 'Failed to unsubscribe from newsletter',
      code: 'UNSUBSCRIBE_FAILED'
    });
  }
});

/**
 * Update Newsletter Preferences
 * PUT /api/newsletter/preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const { email, token, name, categories } = req.body;
    
    if (!email && !token) {
      return res.status(400).json({
        error: 'Email or token is required',
        code: 'EMAIL_OR_TOKEN_REQUIRED'
      });
    }
    
    const db = firebaseAdmin.getFirestore();
    let subscriptionDoc;
    
    if (token) {
      subscriptionDoc = await db.collection('subscriptions').doc(token).get();
    } else {
      const subscriptions = await db.collection('subscriptions')
        .where('email', '==', email.toLowerCase())
        .where('status', '==', 'active')
        .get();
      
      if (subscriptions.empty) {
        return res.status(404).json({
          error: 'Active subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        });
      }
      
      subscriptionDoc = subscriptions.docs[0];
    }
    
    if (!subscriptionDoc.exists) {
      return res.status(404).json({
        error: 'Subscription not found',
        code: 'SUBSCRIPTION_NOT_FOUND'
      });
    }
    
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    if (name !== undefined) updateData.name = name;
    if (categories !== undefined) {
      updateData.categories = Array.isArray(categories) ? categories : ['general'];
    }
    
    await db.collection('subscriptions').doc(subscriptionDoc.id).update(updateData);
    
    res.json({
      success: true,
      message: 'Newsletter preferences updated successfully'
    });
    
  } catch (error) {
    console.error('Update newsletter preferences error:', error.message);
    res.status(500).json({
      error: 'Failed to update newsletter preferences',
      code: 'PREFERENCES_UPDATE_FAILED'
    });
  }
});

/**
 * Get Subscription Details
 * GET /api/newsletter/subscription
 */
router.get('/subscription', async (req, res) => {
  try {
    const { email, token } = req.query;
    
    if (!email && !token) {
      return res.status(400).json({
        error: 'Email or token is required',
        code: 'EMAIL_OR_TOKEN_REQUIRED'
      });
    }
    
    const db = firebaseAdmin.getFirestore();
    let subscriptionDoc;
    
    if (token) {
      subscriptionDoc = await db.collection('subscriptions').doc(token).get();
    } else {
      const subscriptions = await db.collection('subscriptions')
        .where('email', '==', email.toLowerCase())
        .get();
      
      if (subscriptions.empty) {
        return res.status(404).json({
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        });
      }
      
      subscriptionDoc = subscriptions.docs[0];
    }
    
    if (!subscriptionDoc.exists) {
      return res.status(404).json({
        error: 'Subscription not found',
        code: 'SUBSCRIPTION_NOT_FOUND'
      });
    }
    
    const subscriptionData = subscriptionDoc.data();
    
    // Return public subscription info only
    res.json({
      success: true,
      subscription: {
        id: subscriptionDoc.id,
        email: subscriptionData.email,
        name: subscriptionData.name,
        categories: subscriptionData.categories,
        status: subscriptionData.status,
        subscribedAt: subscriptionData.subscribedAt,
        updatedAt: subscriptionData.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Get subscription error:', error.message);
    res.status(500).json({
      error: 'Failed to get subscription details',
      code: 'SUBSCRIPTION_FETCH_FAILED'
    });
  }
});

/**
 * Send Newsletter Campaign (Admin only)
 * POST /api/newsletter/send
 */
router.post('/send', async (req, res) => {
  try {
    const {
      subject,
      content,
      categories = ['general'],
      testMode = false,
      testEmail
    } = req.body;
    
    // Validation
    if (!subject || !content) {
      return res.status(400).json({
        error: 'Subject and content are required',
        code: 'REQUIRED_FIELDS_MISSING'
      });
    }
    
    const db = firebaseAdmin.getFirestore();
    
    // Get subscribers
    let query = db.collection('subscriptions')
      .where('status', '==', 'active');
    
    if (categories.length > 0 && !categories.includes('all')) {
      query = query.where('categories', 'array-contains-any', categories);
    }
    
    const subscribersSnapshot = await query.get();
    const subscribers = subscribersSnapshot.docs.map(doc => doc.data());
    
    if (testMode) {
      // Send test email
      if (!testEmail || !validateEmail(testEmail)) {
        return res.status(400).json({
          error: 'Valid test email is required for test mode',
          code: 'INVALID_TEST_EMAIL'
        });
      }
      
      const transporter = createTransporter();
      
      const testMailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: testEmail,
        subject: `[TEST] ${subject}`,
        html: `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin-bottom: 20px; border-radius: 5px;">
            <strong>⚠️ This is a test email</strong><br>
            Recipients: ${subscribers.length} subscribers<br>
            Categories: ${categories.join(', ')}
          </div>
          ${content}
        `
      };
      
      await transporter.sendMail(testMailOptions);
      
      return res.json({
        success: true,
        message: 'Test email sent successfully',
        testEmail,
        subscriberCount: subscribers.length
      });
    }
    
    // Send to all subscribers
    const transporter = createTransporter();
    const campaignId = `campaign_${Date.now()}`;
    let sentCount = 0;
    let failedCount = 0;
    
    // Create campaign record
    const campaignData = {
      id: campaignId,
      subject,
      content,
      categories,
      totalRecipients: subscribers.length,
      sentCount: 0,
      failedCount: 0,
      status: 'sending',
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString()
    };
    
    await db.collection('newsletter_campaigns').doc(campaignId).set(campaignData);
    
    // Send emails in batches to avoid overwhelming the server
    const batchSize = 50;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (subscriber) => {
        try {
          const unsubscribeUrl = `${process.env.FRONTEND_URL}/newsletter/unsubscribe?token=${subscriber.id || subscriber.email}`;
          
          const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: subscriber.email,
            subject,
            html: `
              ${content}
              
              <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
              
              <div style="text-align: center; color: #6c757d; font-size: 12px;">
                <p>You received this email because you subscribed to DevInquire newsletter.</p>
                <p>
                  <a href="${unsubscribeUrl}" style="color: #6c757d;">Unsubscribe</a> | 
                  <a href="${process.env.FRONTEND_URL}/newsletter/preferences?token=${subscriber.id || subscriber.email}" style="color: #6c757d;">Update Preferences</a>
                </p>
              </div>
            `
          };
          
          await transporter.sendMail(mailOptions);
          sentCount++;
          
          // Log successful send
          await db.collection('newsletter_logs').add({
            campaignId,
            email: subscriber.email,
            status: 'sent',
            sentAt: new Date().toISOString()
          });
          
        } catch (error) {
          failedCount++;
          console.error(`Failed to send to ${subscriber.email}:`, error.message);
          
          // Log failed send
          await db.collection('newsletter_logs').add({
            campaignId,
            email: subscriber.email,
            status: 'failed',
            error: error.message,
            attemptedAt: new Date().toISOString()
          });
        }
      });
      
      await Promise.all(emailPromises);
      
      // Update campaign progress
      await db.collection('newsletter_campaigns').doc(campaignId).update({
        sentCount,
        failedCount,
        updatedAt: new Date().toISOString()
      });
      
      // Small delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Mark campaign as completed
    await db.collection('newsletter_campaigns').doc(campaignId).update({
      status: 'completed',
      completedAt: new Date().toISOString(),
      sentCount,
      failedCount
    });
    
    res.json({
      success: true,
      message: 'Newsletter campaign completed',
      campaignId,
      stats: {
        totalRecipients: subscribers.length,
        sentCount,
        failedCount,
        successRate: subscribers.length > 0 ? (sentCount / subscribers.length * 100).toFixed(2) + '%' : '0%'
      }
    });
    
  } catch (error) {
    console.error('Send newsletter error:', error.message);
    res.status(500).json({
      error: 'Failed to send newsletter',
      code: 'NEWSLETTER_SEND_FAILED'
    });
  }
});

/**
 * Get Newsletter Statistics (Admin only)
 * GET /api/newsletter/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const db = firebaseAdmin.getFirestore();
    
    // Get subscription stats
    const subscriptionsSnapshot = await db.collection('subscriptions').get();
    const subscriptionsByStatus = {};
    const subscriptionsByCategory = {};
    
    subscriptionsSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Count by status
      const status = data.status || 'unknown';
      subscriptionsByStatus[status] = (subscriptionsByStatus[status] || 0) + 1;
      
      // Count by categories
      if (data.categories && Array.isArray(data.categories)) {
        data.categories.forEach(category => {
          subscriptionsByCategory[category] = (subscriptionsByCategory[category] || 0) + 1;
        });
      }
    });
    
    // Get campaign stats
    const campaignsSnapshot = await db.collection('newsletter_campaigns').get();
    const campaignStats = {
      total: campaignsSnapshot.size,
      byStatus: {}
    };
    
    let totalSent = 0;
    let totalFailed = 0;
    
    campaignsSnapshot.forEach(doc => {
      const data = doc.data();
      const status = data.status || 'unknown';
      campaignStats.byStatus[status] = (campaignStats.byStatus[status] || 0) + 1;
      
      totalSent += data.sentCount || 0;
      totalFailed += data.failedCount || 0;
    });
    
    res.json({
      success: true,
      stats: {
        subscriptions: {
          total: subscriptionsSnapshot.size,
          byStatus: subscriptionsByStatus,
          byCategory: subscriptionsByCategory
        },
        campaigns: {
          ...campaignStats,
          totalEmailsSent: totalSent,
          totalEmailsFailed: totalFailed
        }
      }
    });
    
  } catch (error) {
    console.error('Get newsletter stats error:', error.message);
    res.status(500).json({
      error: 'Failed to get newsletter statistics',
      code: 'NEWSLETTER_STATS_FAILED'
    });
  }
});

/**
 * Get Available Categories
 * GET /api/newsletter/categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'general', name: 'General', description: 'General development news and updates' },
      { id: 'tutorials', name: 'Tutorials', description: 'Step-by-step programming tutorials' },
      { id: 'news', name: 'Tech News', description: 'Latest technology and industry news' },
      { id: 'tools', name: 'Tools & Resources', description: 'Development tools and resource recommendations' },
      { id: 'tips', name: 'Tips & Tricks', description: 'Programming tips and best practices' }
    ];
    
    res.json({
      success: true,
      categories
    });
    
  } catch (error) {
    console.error('Get newsletter categories error:', error.message);
    res.status(500).json({
      error: 'Failed to get newsletter categories',
      code: 'CATEGORIES_FETCH_FAILED'
    });
  }
});

module.exports = router;