// EmailService now uses PHP backend instead of Firebase
// All Firebase imports and initialization removed

class EmailService {
  constructor() {
    // PHP backend endpoints
    this.contactEndpoint = '/api/contact.php';
    this.newsletterEndpoint = '/api/newsletter.php';
  }

  // Contact Form Submission with PHP backend
  async submitContactForm(formData) {
    try {
      // Use PHP implementation directly
      return await this.submitContactFormPHP(formData);
    } catch (error) {
      console.error('Contact form submission error:', error);
      return {
        success: false,
        error: 'Failed to submit your message. Please try again or contact us directly.'
      };
    }
  }

  // PHP Contact Form Submission (now the primary method)
  async submitContactFormPHP(formData) {
    try {
      const response = await fetch(this.contactEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message || 'Thank you for your message! We\'ll get back to you soon.'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to submit your message. Please try again.'
        };
      }
    } catch (error) {
      console.error('PHP contact form submission error:', error);
      return {
        success: false,
        error: 'Failed to submit your message. Please try again or contact us directly.'
      };
    }
  }

  // Legacy method - keeping for reference but not used
  async submitContactFormFirebase(formData) {
    try {
      // Validate form data
      const validation = this.validateContactForm(formData);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: validation.error,
          code: 'VALIDATION_ERROR'
        };
      }

      // Prepare submission data
      const submissionData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || '',
        company: formData.company?.trim() || '',
        subject: formData.subject?.trim() || 'Contact Form Submission',
        timeline: formData.timeline?.trim() || '',
        message: formData.message.trim()
      };

      // This would call Firebase Function (deprecated)
      try {
        // const emailResult = await this.sendContactEmail(submissionData);

        if (emailResult.data.success) {
          // Record successful submission for rate limiting
          await this.recordSubmission(formData.email);
          
          return {
            success: true,
            message: 'Thank you for your message! We\'ll get back to you soon.',
            submissionId: emailResult.data.submissionId
          };
        } else {
          return {
            success: false,
            error: emailResult.data.error || 'Failed to send email',
            code: 'EMAIL_SEND_FAILED'
          };
        }
      } catch (firebaseError) {
        console.warn('Firebase Functions unavailable, using PHP fallback:', firebaseError);
        
        // Fallback to PHP endpoint
        const phpResponse = await this.submitContactFormPHP(submissionData);
        if (phpResponse.success) {
          // Still try to save to Firestore if possible
          try {
            const docRef = await addDoc(collection(db, 'contact_submissions'), submissionData);
            return {
              success: true,
              message: phpResponse.message,
              submissionId: docRef.id
            };
          } catch (firestoreError) {
            console.warn('Firestore save failed, but email sent:', firestoreError);
            return {
              success: true,
              message: phpResponse.message
            };
          }
        }
        return phpResponse;
      }

      return {
        success: false,
        error: 'Message saved but email notification failed. We\'ll still review your submission.'
      };
    } catch (error) {
      console.error('Contact form submission error:', error);
      return {
        success: false,
        error: 'Failed to submit your message. Please try again or contact us directly.'
      };
    }
  }

  // PHP fallback for contact form submission
  async submitContactFormPHP(formData) {
    try {
      const response = await fetch('/contact.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message || 'Thank you for your message! We\'ll get back to you soon.'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to submit your message. Please try again.'
        };
      }
    } catch (error) {
      console.error('PHP contact form submission error:', error);
      return {
        success: false,
        error: 'Failed to submit your message. Please try again or contact us directly.'
      };
    }
  }

  // Newsletter Subscription with PHP backend
  async subscribeToNewsletter(email, categories = ['general']) {
    try {
      // Enhanced email validation
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        return { success: false, error: 'Email address is required.' };
      }
      
      if (!this.isValidEmail(cleanEmail)) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      
      // Use PHP implementation
      return await this.subscribeToNewsletterPHP(cleanEmail, categories);
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      return {
        success: false,
        error: 'Failed to subscribe. Please try again.'
      };
    }
  }

  // PHP Newsletter Subscription (primary method)
  async subscribeToNewsletterPHP(email, categories) {
    try {
      const response = await fetch(this.newsletterEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          categories
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message || 'Please check your email to confirm your subscription.'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to subscribe. Please try again.'
        };
      }
    } catch (error) {
      console.error('PHP newsletter subscription error:', error);
      return {
        success: false,
        error: 'Failed to subscribe. Please try again.'
      };
    }
  }

  // Legacy Firebase Newsletter Subscription (deprecated)
  async subscribeToNewsletterFirebase(email, categories = ['general']) {
    try {
      // Enhanced email validation
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        return { success: false, error: 'Email address is required.' };
      }
      
      if (!this.isValidEmail(cleanEmail)) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      
      if (cleanEmail.length > 254) {
        return { success: false, error: 'Email address is too long.' };
      }
      
      // Check for disposable email domains
      const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com'];
      const emailDomain = cleanEmail.split('@')[1];
      if (disposableDomains.includes(emailDomain)) {
        return { success: false, error: 'Please use a permanent email address.' };
      }
      
      // Rate limiting check
      const rateLimitResult = this.checkRateLimit(`newsletter_${cleanEmail}`, 2, 300000); // 2 attempts per 5 minutes
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: `Too many subscription attempts. Please try again after ${rateLimitResult.resetTime.toLocaleTimeString()}.`
        };
      }

      const subscriptionData = {
        email: cleanEmail,
        categories: Array.isArray(categories) ? categories : ['general'],
        subscribedAt: serverTimestamp(),
        status: 'pending', // Start with pending status for email verification
        source: 'website',
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };

      // Check for existing subscription
      const existingSubscription = await this.checkExistingSubscription(cleanEmail);
      if (existingSubscription) {
        if (existingSubscription.status === 'active') {
          return {
            success: false,
            error: 'This email is already subscribed to our newsletter.'
          };
        } else if (existingSubscription.status === 'pending') {
          return {
            success: false,
            error: 'A confirmation email has already been sent. Please check your inbox.'
          };
        }
      }

      // Try Firebase Functions first, then fallback to PHP
      try {
        // Save subscription to Firestore
        const docRef = await addDoc(collection(db, 'newsletter_subscriptions'), subscriptionData);

        // Send confirmation email
        await this.sendNewsletterEmail({
          type: 'confirmation',
          email: cleanEmail,
          categories: subscriptionData.categories,
          confirmationToken: docRef.id
        });

        return {
          success: true,
          message: 'Please check your email to confirm your subscription.'
        };
      } catch (firebaseError) {
        console.warn('Firebase Functions failed, using PHP fallback:', firebaseError);
        
        // Fallback to PHP endpoint
        const result = await this.subscribeToNewsletterPHP(cleanEmail, categories);
        
        // Still try to save to Firestore if possible
        try {
          const fallbackData = {
            ...subscriptionData,
            source: 'website_php_fallback'
          };
          await addDoc(collection(db, 'newsletter_subscriptions'), fallbackData);
        } catch (firestoreError) {
          console.warn('Firestore save failed:', firestoreError);
        }
        
        return result;
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      if (error.code === 'permission-denied') {
        return {
          success: false,
          error: 'Permission denied. Please try again later.'
        };
      } else if (error.code === 'unavailable') {
        return {
          success: false,
          error: 'Service temporarily unavailable. Please try again later.'
        };
      }
      
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

  // Rate limiting helper
  checkRateLimit(key = 'default', maxAttempts = 3, windowMs = 900000) { // 15 minutes default
    const now = Date.now();
    const storageKey = `rateLimit_${key}`;
    
    try {
      const stored = localStorage.getItem(storageKey);
      const data = stored ? JSON.parse(stored) : { attempts: 0, resetTime: now + windowMs };
      
      // Reset if window has passed
      if (now > data.resetTime) {
        data.attempts = 0;
        data.resetTime = now + windowMs;
      }
      
      if (data.attempts >= maxAttempts) {
        return {
          allowed: false,
          resetTime: new Date(data.resetTime),
          attemptsRemaining: 0
        };
      }
      
      // Increment attempts
      data.attempts++;
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      return {
        allowed: true,
        resetTime: new Date(data.resetTime),
        attemptsRemaining: maxAttempts - data.attempts
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, resetTime: new Date(now + windowMs), attemptsRemaining: maxAttempts - 1 };
    }
  }

  // Check for existing newsletter subscription (now handled by PHP backend)
  async checkExistingSubscription(email) {
    // This functionality is now handled by the PHP backend
    // The PHP script checks for existing subscriptions in the database
    return null;
  }

  // Get client IP address (simplified for client-side)
  async getClientIP() {
    try {
      // In a real implementation, you might use a service like ipapi.co
      // For now, return a placeholder
      return 'client-ip';
    } catch (error) {
      return 'unknown';
    }
  }

  // Email Templates (for preview)
  async recordSubmission(email) {
    try {
      const storageKey = `submission_${email}`;
      const now = Date.now();
      const submissions = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Add current submission
      submissions.push(now);
      
      // Keep only submissions from last 24 hours
      const dayAgo = now - (24 * 60 * 60 * 1000);
      const recentSubmissions = submissions.filter(time => time > dayAgo);
      
      localStorage.setItem(storageKey, JSON.stringify(recentSubmissions));
    } catch (error) {
      console.error('Error recording submission:', error);
    }
  }

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