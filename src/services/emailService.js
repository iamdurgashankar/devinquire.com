// Resilient EmailService for devinquire.com forms
import { API_BASE } from '../config';

class EmailService {
  constructor() {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const dashPublicBase = isLocal
      ? 'http://localhost:8001/api/public'
      : 'https://dashboard.devinquire.com/api/public';

    this.dashboardPublicBase = dashPublicBase;
    this.dashboardIntakeUrl = `${dashPublicBase}/contact_intake`;
    this.dashboardPaymentConfirmUrl = `${dashPublicBase}/payment_confirm`;
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
        if (dashJson && (dashJson.status === 'success' || dashJson.success)) {
          return {
            recorded: true,
            id: dashJson.data?.id ? String(dashJson.data.id) : null,
            emailSent: Boolean(dashJson.data?.emailSent)
          };
        }
      }
    } catch (dashErr) {
      console.warn('Direct dashboard intake warning:', dashErr.message);
    }
    return { recorded: false, id: null, emailSent: false };
  }

  /**
   * Immediately records all submitted form data in Dashboard Client Inquiries as 'pending'
   * right before redirecting the client to Stripe Pre-Booking Checkout, ensuring zero lead loss.
   */
  async logPreBookingCheckout(formData = {}, plan = {}) {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const resolvedService =
      (formData.service || '').trim() ||
      (formData.subject || '').trim() ||
      plan.label ||
      'Priority Pre-Booking';
    const resolvedSubject =
      (formData.subject || '').trim() ||
      `Pre-Booking (${plan.displayPrice || `₹${plan.amountRupees || 399}/-`}): ${resolvedService}`;

    const payload = {
      inquiry_id: formData.inquiry_id || formData.inquiryId || undefined,
      name: (formData.name || 'Website Client').trim(),
      email: (formData.email || '').trim().toLowerCase(),
      phone: (formData.phone || '').trim(),
      company: (formData.company || '').trim(),
      service: resolvedService,
      product: formData.product || '',
      timeline: formData.timeline || '',
      subject: resolvedSubject,
      message: (formData.message || '').trim() || `Pre-booking initiated for ${resolvedService}.`,
      form_source: formData.form_source || formData.formSource || 'Contact Form',
      pageUrl,
      payment_status: 'pending',
      payment_plan: plan.id || 'consultation',
      payment_amount: Number(plan.amountRupees) || 399,
      payment_currency: 'INR',
      form_payload: {
        ...formData,
        service: resolvedService,
        subject: resolvedSubject,
        form_source: formData.form_source || formData.formSource || 'Contact Form',
        page_url: pageUrl,
        prebooking_plan: plan.id || 'consultation',
        prebooking_label: plan.label || 'Priority Pre-Booking',
        prebooking_price: plan.displayPrice || `₹${plan.amountRupees || 399}/-`,
        submitted_at: new Date().toISOString()
      }
    };

    const res = await this.logToDashboard(payload);
    return {
      recorded: res.recorded,
      inquiryId: res.id
    };
  }

  /**
   * Reconciles payment confirmation ('paid', 'cancelled', or 'opt_out') on the inquiry in Dashboard.
   */
  async confirmInquiryPayment(paymentData = {}) {
    try {
      const res = await this.fetchWithTimeout(
        this.dashboardPaymentConfirmUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData)
        },
        6000
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        return {
          confirmed: Boolean(json && (json.status === 'success' || json.success)),
          id: json?.data?.id || null
        };
      }
    } catch (err) {
      console.warn('Dashboard payment confirmation sync warning:', err.message);
    }
    return { confirmed: false, id: null };
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
            ...payload
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

    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const resolvedSource =
      formData.form_source ||
      formData.formSource ||
      (formData.product
        ? 'Product Demo'
        : formData.service
        ? 'Services Inquiry'
        : 'Contact Form');

    const normalizedPayload = {
      ...formData,
      inquiry_id: formData.inquiry_id || formData.inquiryId || undefined,
      name: (formData.name || 'Website Inquiry').trim(),
      email: formData.email.trim().toLowerCase(),
      phone: (formData.phone || '').trim(),
      company: (formData.company || '').trim(),
      service: (formData.service || formData.product || '').trim(),
      timeline: (formData.timeline || '').trim(),
      form_source: resolvedSource,
      payment_status: formData.payment_status || 'none',
      pageUrl,
      subject:
        (formData.subject || '').trim() ||
        (formData.service ? `Service Inquiry: ${formData.service}` : 'DevInquire Contact Form Submission'),
      message: formData.message.trim(),
      form_payload: {
        ...(formData.form_payload && typeof formData.form_payload === 'object'
          ? formData.form_payload
          : {}),
        name: (formData.name || 'Website Inquiry').trim(),
        email: formData.email.trim().toLowerCase(),
        phone: (formData.phone || '').trim(),
        company: (formData.company || '').trim(),
        service: (formData.service || '').trim(),
        product: (formData.product || '').trim(),
        timeline: (formData.timeline || '').trim(),
        subject:
          (formData.subject || '').trim() ||
          (formData.service ? `Service Inquiry: ${formData.service}` : 'DevInquire Contact Form Submission'),
        message: formData.message.trim(),
        form_source: resolvedSource,
        page_url: pageUrl,
        submitted_at: new Date().toISOString()
      }
    };

    // 1. Log to Dashboard Client Inquiries Intake API (which also dispatches SMTP email to contact@devinquire.com)
    const dashResult = await this.logToDashboard(normalizedPayload);
    if (dashResult.recorded && dashResult.emailSent) {
      return {
        success: true,
        message: "Thank you for your message! We'll get back to you within 24 hours."
      };
    }

    // 2. Try site backend API if available (local Express server or backend deployment)
    let emailDispatched = dashResult.emailSent;
    let backendMessage = '';
    if (!emailDispatched) {
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
    }

    // 3. Last-resort fallback: Web3Forms (only if neither dashboard SMTP nor site backend sent the email)
    if (!emailDispatched && !dashResult.recorded) {
      emailDispatched = await this.sendViaWeb3Forms({
        name: normalizedPayload.name,
        email: normalizedPayload.email,
        phone: normalizedPayload.phone || '',
        company: normalizedPayload.company || '',
        service: normalizedPayload.service || '',
        timeline: normalizedPayload.timeline || '',
        subject: normalizedPayload.subject,
        message: normalizedPayload.message,
        from_name: 'DevInquire Contact Form'
      });
    }

    if (dashResult.recorded || emailDispatched) {
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
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

    // 1. Log newsletter subscription to Dashboard Client Inquiries (which also dispatches SMTP email)
    const dashResult = await this.logToDashboard({
      name: 'Newsletter Subscriber',
      email: cleanEmail,
      subject: 'Newsletter Subscription',
      service: 'Newsletter',
      form_source: 'Newsletter',
      categories: categoryList,
      pageUrl,
      message: `Newsletter subscription request (Topics: ${categoryList.join(', ')})`,
      form_payload: {
        email: cleanEmail,
        categories: categoryList,
        form_source: 'Newsletter',
        page_url: pageUrl,
        submitted_at: new Date().toISOString()
      }
    });

    if (dashResult.recorded && dashResult.emailSent) {
      return {
        success: true,
        message: 'Thank you for subscribing to our newsletter!'
      };
    }

    // 2. Try primary newsletter backend endpoints
    let emailDispatched = dashResult.emailSent;
    let backendMessage = '';
    if (!emailDispatched) {
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
    }

    // 3. Last-resort fallback: Web3Forms
    if (!emailDispatched && !dashResult.recorded) {
      emailDispatched = await this.sendViaWeb3Forms({
        name: 'Newsletter Subscriber',
        email: cleanEmail,
        subject: 'New Newsletter Subscription - DevInquire',
        message: `New subscriber registered with categories: ${JSON.stringify(categoryList)}`,
        from_name: 'DevInquire Newsletter'
      });
    }

    if (dashResult.recorded || emailDispatched) {
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
export const logPreBookingCheckout = (formData, plan) => emailService.logPreBookingCheckout(formData, plan);
export const confirmInquiryPayment = (paymentData) => emailService.confirmInquiryPayment(paymentData);

export default emailService;