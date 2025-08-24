import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import emailService from './emailService';

class NewsletterService {
  constructor() {
    this.categories = [
      { id: 'general', name: 'General Updates', description: 'General news and updates' },
      { id: 'tech', name: 'Technology', description: 'Tech articles and tutorials' },
      { id: 'business', name: 'Business', description: 'Business insights and tips' },
      { id: 'lifestyle', name: 'Lifestyle', description: 'Lifestyle and personal development' },
      { id: 'announcements', name: 'Announcements', description: 'Important announcements' }
    ];
    
    // Initialize Firebase Functions
    this.sendBulkEmail = httpsCallable(functions, 'sendBulkEmail');
    this.generateUnsubscribeToken = httpsCallable(functions, 'generateUnsubscribeToken');
  }

  // Subscription Management
  async subscribe(email, categories = ['general'], source = 'website') {
    try {
      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Invalid email address' };
      }

      const normalizedEmail = email.trim().toLowerCase();
      
      // Check if already subscribed
      const existingSubscription = await this.getSubscription(normalizedEmail);
      if (existingSubscription) {
        // Update existing subscription
        await this.updateSubscription(normalizedEmail, { 
          categories: [...new Set([...existingSubscription.categories, ...categories])],
          status: 'active',
          updatedAt: serverTimestamp()
        });
        
        return {
          success: true,
          message: 'Subscription updated successfully!',
          isUpdate: true
        };
      }

      // Create new subscription
      const subscriptionData = {
        email: normalizedEmail,
        categories,
        status: 'active',
        source,
        subscribedAt: serverTimestamp(),
        preferences: {
          frequency: 'weekly',
          format: 'html',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        metadata: {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          ip: null // Will be set by server
        }
      };

      const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);
      
      // Generate unsubscribe token
      const tokenResult = await this.generateUnsubscribeToken({ 
        email: normalizedEmail,
        subscriptionId: docRef.id 
      });
      
      if (tokenResult.data.success) {
        await updateDoc(docRef, {
          unsubscribeToken: tokenResult.data.token
        });
      }

      // Send welcome email
      await emailService.subscribeToNewsletter(normalizedEmail, categories);
      
      // Log subscription activity
      await this.logSubscriptionActivity({
        email: normalizedEmail,
        action: 'subscribed',
        categories,
        source
      });

      return {
        success: true,
        message: 'Successfully subscribed to newsletter!',
        subscriptionId: docRef.id
      };
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      return {
        success: false,
        error: 'Failed to subscribe. Please try again.'
      };
    }
  }

  async unsubscribe(email, token = null) {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const subscription = await this.getSubscription(normalizedEmail);
      
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      // Verify token if provided
      if (token && subscription.unsubscribeToken !== token) {
        return { success: false, error: 'Invalid unsubscribe token' };
      }

      // Update subscription status
      await updateDoc(doc(db, 'subscriptions', subscription.id), {
        status: 'unsubscribed',
        unsubscribedAt: serverTimestamp(),
        unsubscribeReason: 'user_request'
      });

      // Log unsubscribe activity
      await this.logSubscriptionActivity({
        email: normalizedEmail,
        action: 'unsubscribed',
        reason: 'user_request'
      });

      return {
        success: true,
        message: 'Successfully unsubscribed from newsletter'
      };
    } catch (error) {
      console.error('Newsletter unsubscribe error:', error);
      return {
        success: false,
        error: 'Failed to unsubscribe. Please try again.'
      };
    }
  }

  async updateSubscription(email, updates) {
    try {
      const subscription = await this.getSubscription(email);
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      await updateDoc(doc(db, 'subscriptions', subscription.id), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return { success: true, message: 'Subscription updated successfully' };
    } catch (error) {
      console.error('Update subscription error:', error);
      return { success: false, error: 'Failed to update subscription' };
    }
  }

  // Newsletter Campaign Management
  async createCampaign(campaignData) {
    try {
      const campaign = {
        ...campaignData,
        status: 'draft',
        createdAt: serverTimestamp(),
        stats: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          unsubscribed: 0
        }
      };

      const docRef = await addDoc(collection(db, 'newsletter_campaigns'), campaign);
      
      return {
        success: true,
        campaignId: docRef.id,
        message: 'Campaign created successfully'
      };
    } catch (error) {
      console.error('Create campaign error:', error);
      return {
        success: false,
        error: 'Failed to create campaign'
      };
    }
  }

  async sendCampaign(campaignId, testEmail = null) {
    try {
      const campaignDoc = await getDoc(doc(db, 'newsletter_campaigns', campaignId));
      if (!campaignDoc.exists()) {
        return { success: false, error: 'Campaign not found' };
      }

      const campaign = { id: campaignDoc.id, ...campaignDoc.data() };
      
      if (testEmail) {
        // Send test email
        const result = await this.sendBulkEmail({
          campaignId,
          recipients: [testEmail],
          isTest: true
        });
        
        return result.data;
      } else {
        // Send to all subscribers
        const subscribers = await this.getActiveSubscribers(campaign.categories);
        
        if (subscribers.length === 0) {
          return { success: false, error: 'No active subscribers found' };
        }

        // Update campaign status
        await updateDoc(doc(db, 'newsletter_campaigns', campaignId), {
          status: 'sending',
          sentAt: serverTimestamp()
        });

        // Send emails in batches
        const batchSize = 100;
        const batches = [];
        
        for (let i = 0; i < subscribers.length; i += batchSize) {
          batches.push(subscribers.slice(i, i + batchSize));
        }

        let totalSent = 0;
        for (const batch of batches) {
          const result = await this.sendBulkEmail({
            campaignId,
            recipients: batch.map(sub => sub.email),
            isTest: false
          });
          
          if (result.data.success) {
            totalSent += result.data.sent || 0;
          }
        }

        // Update campaign stats
        await updateDoc(doc(db, 'newsletter_campaigns', campaignId), {
          status: 'sent',
          'stats.sent': totalSent,
          completedAt: serverTimestamp()
        });

        return {
          success: true,
          message: `Campaign sent to ${totalSent} subscribers`,
          sent: totalSent
        };
      }
    } catch (error) {
      console.error('Send campaign error:', error);
      return {
        success: false,
        error: 'Failed to send campaign'
      };
    }
  }

  // Subscriber Management
  async getActiveSubscribers(categories = null) {
    try {
      let q = query(
        collection(db, 'subscriptions'),
        where('status', '==', 'active')
      );

      if (categories && categories.length > 0) {
        q = query(q, where('categories', 'array-contains-any', categories));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get subscribers error:', error);
      return [];
    }
  }

  async getSubscription(email) {
    try {
      const q = query(
        collection(db, 'subscriptions'),
        where('email', '==', email.trim().toLowerCase()),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Get subscription error:', error);
      return null;
    }
  }

  async getSubscriptionStats() {
    try {
      const subscriptions = await getDocs(collection(db, 'subscriptions'));
      const stats = {
        total: 0,
        active: 0,
        unsubscribed: 0,
        bounced: 0,
        byCategory: {},
        bySource: {},
        recentGrowth: []
      };

      subscriptions.forEach(doc => {
        const data = doc.data();
        stats.total++;
        
        // Status counts
        if (data.status === 'active') stats.active++;
        else if (data.status === 'unsubscribed') stats.unsubscribed++;
        else if (data.status === 'bounced') stats.bounced++;
        
        // Category counts
        data.categories?.forEach(category => {
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        });
        
        // Source counts
        stats.bySource[data.source] = (stats.bySource[data.source] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Get subscription stats error:', error);
      return null;
    }
  }

  // Activity Logging
  async logSubscriptionActivity(activityData) {
    try {
      await addDoc(collection(db, 'newsletter_logs'), {
        ...activityData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Log subscription activity error:', error);
    }
  }

  // Utility Methods
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getAvailableCategories() {
    return this.categories;
  }

  getCategoryById(id) {
    return this.categories.find(cat => cat.id === id);
  }

  // Template Management
  getEmailTemplates() {
    return {
      welcome: {
        subject: 'Welcome to Our Newsletter!',
        preheader: 'Thank you for subscribing to our updates',
        template: 'newsletter-welcome'
      },
      weekly: {
        subject: 'Weekly Newsletter - {{date}}',
        preheader: 'Your weekly dose of insights and updates',
        template: 'newsletter-weekly'
      },
      announcement: {
        subject: 'Important Announcement',
        preheader: 'We have something important to share',
        template: 'newsletter-announcement'
      }
    };
  }

  // A/B Testing Support
  async createABTest(campaignId, variants) {
    try {
      const testData = {
        campaignId,
        variants,
        status: 'active',
        createdAt: serverTimestamp(),
        results: {}
      };

      const docRef = await addDoc(collection(db, 'newsletter_ab_tests'), testData);
      
      return {
        success: true,
        testId: docRef.id
      };
    } catch (error) {
      console.error('Create A/B test error:', error);
      return {
        success: false,
        error: 'Failed to create A/B test'
      };
    }
  }
}

export default new NewsletterService();