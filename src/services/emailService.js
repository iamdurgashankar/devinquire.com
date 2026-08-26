// Resilient EmailService for devinquire.com forms
import { API_BASE } from '../config';

class EmailService {
  constructor() {
    this.contactEndpoints = [
      '/api/contact',
      '/api/contact.php',
      '/contact.php',
      `${API_BASE}/contact`
    ];
    this.newsletterEndpoints = [
      '/api/newsletter',
      '/api/newsletter.php',
      '/newsletter.php',
      `${API_BASE}/newsletter`
    ];
  }

  /**
   * Contact Form Submission with API & Web3Forms fallback
   */
  async submitContactForm(formData) {
    if (!formData || !formData.email || !formData.message) {
      return {
        success: false,
        error: 'Please fill in all required fields (email and message).'
      };
    }

    // Try primary API endpoints
    for (const endpoint of this.contactEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            return {
              success: true,
              message: result.message || 'Thank you for your message! We\'ll get back to you within 24 hours.'
            };
          }
        }
      } catch (err) {
        console.warn(`Contact endpoint ${endpoint} unreachable:`, err.message);
      }
    }

    // Direct Fallback: Dispatch to contact@devinquire.com via Web3Forms API
    try {
      const fallbackResponse = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '803e30e6-5c54-4cae-9406-8d13bcf3d8e9',
          name: formData.name || 'Website Inquiry',
          email: formData.email,
          phone: formData.phone || '',
          company: formData.company || '',
          subject: formData.subject || (formData.service ? `Service Inquiry: ${formData.service}` : 'DevInquire Contact Form Submission'),
          timeline: formData.timeline || '',
          message: formData.message,
          to_email: 'contact@devinquire.com',
          from_name: 'DevInquire Contact Form'
        })
      });

      const fallbackResult = await fallbackResponse.json();
      if (fallbackResponse.ok && fallbackResult.success) {
        return {
          success: true,
          message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
        };
      }
    } catch (fallbackError) {
      console.error('Client-side fallback submission error:', fallbackError);
    }

    return {
      success: false,
      error: 'Submission failed. Please try again or email us directly at contact@devinquire.com'
    };
  }

  /**
   * Newsletter Subscription with API & Fallback
   */
  async subscribeToNewsletter(emailParam, categoriesParam = ['general']) {
    let cleanEmail = '';
    let categories = categoriesParam;

    // Handle object vs string argument overload
    if (typeof emailParam === 'object' && emailParam !== null) {
      cleanEmail = (emailParam.email || '').trim().toLowerCase();
      if (emailParam.categories) categories = emailParam.categories;
    } else if (typeof emailParam === 'string') {
      cleanEmail = emailParam.trim().toLowerCase();
    }

    if (!cleanEmail || !this.isValidEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Please enter a valid email address.'
      };
    }

    // Try primary newsletter endpoints
    for (const endpoint of this.newsletterEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: cleanEmail,
            categories: Array.isArray(categories) ? categories : [categories]
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            return {
              success: true,
              message: result.message || 'Thank you for subscribing to our newsletter!'
            };
          }
        }
      } catch (err) {
        console.warn(`Newsletter endpoint ${endpoint} unreachable:`, err.message);
      }
    }

    // Direct Fallback: Web3Forms subscription dispatch to contact@devinquire.com
    try {
      const fallbackResponse = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '803e30e6-5c54-4cae-9406-8d13bcf3d8e9',
          name: 'Newsletter Subscriber',
          email: cleanEmail,
          subject: 'New Newsletter Subscription - DevInquire',
          message: `New subscriber registered with categories: ${JSON.stringify(categories)}`,
          to_email: 'contact@devinquire.com',
          from_name: 'DevInquire Newsletter'
        })
      });

      const fallbackResult = await fallbackResponse.json();
      if (fallbackResponse.ok && fallbackResult.success) {
        return {
          success: true,
          message: 'Thank you for subscribing! We\'ve received your subscription request.'
        };
      }
    } catch (fallbackErr) {
      console.error('Newsletter fallback error:', fallbackErr);
    }

    return {
      success: false,
      error: 'Failed to subscribe. Please try again or contact us directly at contact@devinquire.com'
    };
  }

  // Alias methods for compatibility
  async submitContactFormPHP(formData) {
    return this.submitContactForm(formData);
  }

  async subscribeToNewsletterPHP(email, categories) {
    return this.subscribeToNewsletter(email, categories);
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

const emailService = new EmailService();

export const submitContactForm = (formData) => emailService.submitContactForm(formData);
export const subscribeToNewsletter = (email, categories) => emailService.subscribeToNewsletter(email, categories);

export default emailService;