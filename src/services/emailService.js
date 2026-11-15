// Resilient EmailService for devinquire.com forms
import { API_BASE } from '../config';

class EmailService {
  constructor() {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const dashIntake = isLocal
      ? 'http://localhost:8001/api/public/contact_intake'
      : 'https://dashboard.devinquire.com/api/public/contact_intake';

    this.dashboardIntakeUrl = dashIntake;
    this.contactEndpoints = Array.from(
      new Set(['/api/contact', `${API_BASE}/contact`].filter(Boolean))
    );
    this.newsletterEndpoints = Array.from(
      new Set(['/api/newsletter', `${API_BASE}/newsletter`].filter(Boolean))
    );
    this.web3FormsKey = '803e30e6-5c54-4cae-9406-8d13bcf3d8e9';
  }

  async fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async logToDashboard(payload) {
    try {
      const dashRes = await this.fetchWithTimeout(
        this.dashboardIntakeUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        },
        6000
      );
      if (dashRes.ok) {
        const dashJson = await dashRes.json().catch(() => null);
        return Boolean(dashJson && (dashJson.status === 'success' || dashJson.success));
      }
    } catch (dashErr) {
      console.warn('Direct dashboard intake warning:', dashErr.message);
    }
    return false;
  }

  async sendViaWeb3Forms(payload) {
    try {
      const res = await this.fetchWithTimeout(
        'https://api.web3forms.com/submit',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: this.web3FormsKey,
            ...payload,
            to_email: 'contact@devinquire.com'
          })
        },
        6000
      );
      const data = await res.json().catch(() => null);
      return Boolean(res.ok && data && data.success);
    } catch (err) {
      console.error('Web3Forms dispatch error:', err);
      return false;
    }
  }

  /**
   * Contact Form Submission: logs to Dashboard Client Inquiries AND emails contact@devinquire.com
   */
  async submitContactForm(formData) {
    if (!formData || !formData.email || !formData.message) {
      return {
        success: false,
        error: 'Please fill in all required fields (email and message).'
      };
    }

    const normalizedPayload = {
      ...formData,
      name: (formData.name || 'Website Inquiry').trim(),
      email: formData.email.trim().toLowerCase(),
      subject:
        (formData.subject || '').trim() ||
        (formData.service ? `Service Inquiry: ${formData.service}` : 'DevInquire Contact Form Submission'),
      message: formData.message.trim()
    };

    // 1. Always log to Dashboard Client Inquiries Intake API
    const recordedInDashboard = await this.logToDashboard(normalizedPayload);

    // 2. Try site backend API (which handles email dispatch + DB storage)
    let emailDispatched = false;
    let backendMessage = '';
    for (const endpoint of this.contactEndpoints) {
      try {
        const response = await this.fetchWithTimeout(
          endpoint,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalizedPayload)
          },
          4000
        );

        if (response.ok) {
          const result = await response.json().catch(() => null);
          if (result && (result.success || result.status === 'success')) {
            emailDispatched = true;
            backendMessage = result.message || '';
            break;
          }
        }
      } catch (err) {
        console.warn(`Contact endpoint ${endpoint} unreachable:`, err.message);
      }
    }

    // 3. If no backend endpoint handled email delivery (e.g. static SPA hosting), send via Web3Forms to contact@devinquire.com
    if (!emailDispatched) {
      emailDispatched = await this.sendViaWeb3Forms({
        name: normalizedPayload.name,
        email: normalizedPayload.email,
        replyto: normalizedPayload.email,
        phone: normalizedPayload.phone || '',
        company: normalizedPayload.company || '',
        service: normalizedPayload.service || '',
        timeline: normalizedPayload.timeline || '',
        subject: normalizedPayload.subject,
        message: normalizedPayload.message,
        from_name: 'DevInquire Contact Form'
      });
    }

    if (recordedInDashboard || emailDispatched) {
      return {
        success: true,
        message: backendMessage || "Thank you for your message! We'll get back to you within 24 hours."
      };
    }

    return {
      success: false,
      error: 'Submission failed. Please try again or email us directly at contact@devinquire.com'
    };
  }

  /**
   * Newsletter Subscription: logs to Dashboard Client Inquiries AND emails contact@devinquire.com
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

    const categoryList = Array.isArray(categories) ? categories : [categories];

    // 1. Log newsletter subscription to Dashboard Client Inquiries
    const recordedInDashboard = await this.logToDashboard({
      name: 'Newsletter Subscriber',
      email: cleanEmail,
      subject: 'Newsletter Subscription',
      service: 'Newsletter',
      message: `Newsletter subscription request (${categoryList.join(', ')})`
    });

    // 2. Try primary newsletter backend endpoints
    let emailDispatched = false;
    let backendMessage = '';
    for (const endpoint of this.newsletterEndpoints) {
      try {
        const response = await this.fetchWithTimeout(
          endpoint,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              categories: categoryList
            })
          },
          4000
        );

        if (response.ok) {
          const result = await response.json().catch(() => null);
          if (result && (result.success || result.status === 'success')) {
            emailDispatched = true;
            backendMessage = result.message || '';
            break;
          }
        }
      } catch (err) {
        console.warn(`Newsletter endpoint ${endpoint} unreachable:`, err.message);
      }
    }

    // 3. Fallback: Dispatch to contact@devinquire.com via Web3Forms API
    if (!emailDispatched) {
      emailDispatched = await this.sendViaWeb3Forms({
        name: 'Newsletter Subscriber',
        email: cleanEmail,
        replyto: cleanEmail,
        subject: 'New Newsletter Subscription - DevInquire',
        message: `New subscriber registered with categories: ${JSON.stringify(categoryList)}`,
        from_name: 'DevInquire Newsletter'
      });
    }

    if (recordedInDashboard || emailDispatched) {
      return {
        success: true,
        message: backendMessage || 'Thank you for subscribing to our newsletter!'
      };
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