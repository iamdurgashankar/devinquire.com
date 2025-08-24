import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, functions } from '../config/firebase';

class EmailService {
  constructor() {
    // Initialize Firebase Functions
    this.sendContactEmail = httpsCallable(functions, 'sendContactEmail');
    this.sendNewsletterEmail = httpsCallable(functions, 'sendNewsletterEmail');
  }

  // Contact Form Submission
  async submitContactForm(formData) {
    try {
      // Validate form data
      const validation = this.validateContactForm(formData);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Save to Firestore
      const submissionData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        subject: formData.subject?.trim() || 'Contact Form Submission',
        message: formData.message.trim(),
        timestamp: serverTimestamp(),
        status: 'new',
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };

      const docRef = await addDoc(collection(db, 'contact_submissions'), submissionData);

      // Send email notification
      const emailResult = await this.sendContactEmail({
        ...submissionData,
        submissionId: docRef.id
      });

      if (emailResult.data.success) {
        return {
          success: true,
          message: 'Thank you for your message! We\'ll get back to you soon.',
          submissionId: docRef.id
        };
      } else {
        return {
          success: false,
          error: 'Message saved but email notification failed. We\'ll still review your submission.'
        };
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      return {
        success: false,
        error: 'Failed to submit your message. Please try again or contact us directly.'
      };
    }
  }

  // Newsletter Subscription
  async subscribeToNewsletter(email, categories = ['general']) {
    try {
      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      const subscriptionData = {
        email: email.trim().toLowerCase(),
        categories,
        subscribedAt: serverTimestamp(),
        status: 'active',
        source: 'website'
      };

      // Use email as document ID to prevent duplicates
      await addDoc(collection(db, 'subscriptions'), subscriptionData);

      // Send welcome email
      await this.sendNewsletterEmail({
        type: 'welcome',
        email: subscriptionData.email,
        categories
      });

      return {
        success: true,
        message: 'Successfully subscribed to our newsletter!'
      };
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      return {
        success: false,
        error: 'Failed to subscribe. Please try again.'
      };
    }
  }

  // Unsubscribe from Newsletter
  async unsubscribeFromNewsletter(email, token) {
    try {
      const result = await httpsCallable(functions, 'unsubscribeNewsletter')({
        email,
        token
      });

      return result.data;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return {
        success: false,
        error: 'Failed to unsubscribe. Please try again.'
      };
    }
  }

  // Send Custom Email (Admin only)
  async sendCustomEmail(emailData) {
    try {
      const result = await httpsCallable(functions, 'sendCustomEmail')(emailData);
      return result.data;
    } catch (error) {
      console.error('Custom email error:', error);
      return {
        success: false,
        error: 'Failed to send email.'
      };
    }
  }

  // Validation Methods
  validateContactForm(formData) {
    const { name, email, message } = formData;

    if (!name || name.trim().length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters long.' };
    }

    if (!this.isValidEmail(email)) {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }

    if (!message || message.trim().length < 10) {
      return { isValid: false, error: 'Message must be at least 10 characters long.' };
    }

    if (message.trim().length > 5000) {
      return { isValid: false, error: 'Message must be less than 5000 characters.' };
    }

    // Check for spam patterns
    if (this.containsSpam(message)) {
      return { isValid: false, error: 'Message contains prohibited content.' };
    }

    return { isValid: true };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  containsSpam(text) {
    const spamPatterns = [
      /\b(viagra|cialis|casino|lottery|winner|congratulations)\b/i,
      /\b(click here|act now|limited time|urgent)\b/i,
      /(http:\/\/|https:\/\/)[^\s]{10,}/g // Long URLs
    ];

    return spamPatterns.some(pattern => pattern.test(text));
  }

  // Rate Limiting (Client-side)
  checkRateLimit(key, maxAttempts = 3, windowMs = 300000) { // 5 minutes
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');
    
    // Remove old attempts
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return {
        allowed: false,
        resetTime: new Date(recentAttempts[0] + windowMs)
      };
    }
    
    // Add current attempt
    recentAttempts.push(now);
    localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentAttempts));
    
    return { allowed: true };
  }

  // Email Templates (for preview)
  getEmailTemplates() {
    return {
      contact: {
        subject: 'New Contact Form Submission',
        template: 'contact-notification'
      },
      welcome: {
        subject: 'Welcome to Our Newsletter!',
        template: 'newsletter-welcome'
      },
      newsletter: {
        subject: 'Weekly Newsletter',
        template: 'newsletter-weekly'
      }
    };
  }
}

const emailService = new EmailService();

// Named exports for convenience
export const submitContactForm = (formData) => emailService.submitContactForm(formData);
export const subscribeToNewsletter = (email, categories) => emailService.subscribeToNewsletter(email, categories);
export const unsubscribeFromNewsletter = (email, token) => emailService.unsubscribeFromNewsletter(email, token);
export const sendCustomEmail = (emailData) => emailService.sendCustomEmail(emailData);

export default emailService;