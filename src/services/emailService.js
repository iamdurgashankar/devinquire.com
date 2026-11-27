// Resilient EmailService for devinquire.com forms — ensures all formData reaches BOTH Dashboard Ledger AND contact@devinquire.com mailbox
import { API_BASE } from '../config';

class EmailService {
  constructor() {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');
    const dashBase = isLocal
      ? 'http://localhost:8001/api/public'
      : 'https://dashboard.devinquire.com/api/public';

    this.dashboardIntakeUrl = `${dashBase}/contact_intake`;
    this.dashboardPaymentConfirmUrl = `${dashBase}/payment_confirm`;
    this.contactEndpoints = Array.from(
      new Set(['/api/contact', `${API_BASE}/contact`].filter(Boolean))
    );
    this.newsletterEndpoints = Array.from(
      new Set(['/api/newsletter', `${API_BASE}/newsletter`].filter(Boolean))
    );
    this.web3FormsKey = '803e30e6-5c54-4cae-9406-8d13bcf3d8e9';
  }

  async fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
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
          body: JSON.stringify(payload),
        },
        6000
      );
      if (dashRes.ok) {
        const dashJson = await dashRes.json().catch(() => null);
        if (dashJson && (dashJson.status === 'success' || dashJson.success)) {
          return {
            recorded: true,
            inquiryId: dashJson.data?.id || null,
            emailSent: Boolean(dashJson.data?.emailSent),
          };
        }
      }
    } catch (dashErr) {
      console.warn('Direct dashboard intake warning:', dashErr.message);
    }
    return { recorded: false, inquiryId: null, emailSent: false };
  }

  async sendViaWeb3Forms(payload) {
    try {
      const cleanFields = {
        access_key: this.web3FormsKey,
        from_name: payload.from_name || 'DevInquire Website',
        subject: payload.subject || 'New DevInquire Form Submission',
        name: payload.name || 'Website Visitor',
        email: payload.email || '',
        replyto: payload.email || '',
      };

      if (payload.phone) cleanFields.phone = payload.phone;
      if (payload.company) cleanFields.company = payload.company;
      if (payload.service) cleanFields.service = payload.service;
      if (payload.product) cleanFields.product = payload.product;
      if (payload.timeline) cleanFields.timeline = payload.timeline;
      if (payload.form_source) cleanFields.form_source = payload.form_source;
      if (payload.payment_status && payload.payment_status !== 'none') {
        cleanFields.pre_booking_status = `${String(
          payload.payment_status
        ).toUpperCase()}${
          payload.payment_plan ? ` — ${payload.payment_plan}` : ''
        }${payload.payment_amount ? ` (₹${payload.payment_amount}/-)` : ''}`;
      }
      if (payload.payment_reference) {
        cleanFields.payment_reference = payload.payment_reference;
      }
      if (payload.page_url) cleanFields.page_url = payload.page_url;
      cleanFields.message = payload.message || '';

      const res = await this.fetchWithTimeout(
        'https://api.web3forms.com/submit',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(cleanFields),
        },
        7000
      );
      const data = await res.json().catch(() => null);
      return Boolean(res.ok && data && data.success);
    } catch (err) {
      console.error('Web3Forms dispatch error:', err);
      return false;
    }
  }

  normalizeFormPayload(formData = {}) {
    const pageUrl =
      formData.page_url ||
      formData.pageUrl ||
      (typeof window !== 'undefined' ? window.location.href : '');
    const serviceVal = (formData.service || formData.product || '').trim();
    const subjectVal =
      (formData.subject || '').trim() ||
      (serviceVal
        ? `Service Inquiry: ${serviceVal}`
        : 'DevInquire Contact Form Submission');

    return {
      ...formData,
      name: (formData.name || 'Website Inquiry').trim(),
      email: (formData.email || '').trim().toLowerCase(),
      phone: (formData.phone || '').trim(),
      company: (formData.company || '').trim(),
      service: serviceVal,
      product: (formData.product || '').trim(),
      timeline: (formData.timeline || '').trim(),
      subject: subjectVal,
      message: (formData.message || '').trim(),
      form_source:
        formData.form_source ||
        formData.formSource ||
        (formData.product
          ? 'Product Demo'
          : serviceVal
            ? 'Services Inquiry'
            : 'Contact Form'),
      page_url: pageUrl,
    };
  }

  /**
   * Contact / Service / Product Form Submission:
   * 1) Logs to Dashboard Client Inquiries
   * 2) Logs to Main Site Backend (/api/contact) + attempts backend SMTP delivery
   * 3) If neither Dashboard SMTP nor Backend SMTP actually dispatched an email (`emailSent === false`),
   *    ALWAYS dispatches the complete structured formData directly to the mailbox via browser Web3Forms!
   */
  async submitContactForm(formData) {
    if (!formData || !formData.email || !formData.message) {
      return {
        success: false,
        error: 'Please fill in all required fields (email and message).',
      };
    }

    const normalizedPayload = this.normalizeFormPayload(formData);

    // 1. Log to Dashboard Client Inquiries Intake API
    const dashResult = await this.logToDashboard(normalizedPayload);
    let recorded = dashResult.recorded;
    let inquiryId = dashResult.inquiryId;
    let emailDispatched = dashResult.emailSent;
    let backendMessage = '';

    // 2. Also send to main site backend (/api/contact) for MySQL persistence + backend SMTP delivery
    for (const endpoint of this.contactEndpoints) {
      try {
        const response = await this.fetchWithTimeout(
          endpoint,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...normalizedPayload,
              inquiry_id: inquiryId || normalizedPayload.inquiry_id || undefined,
            }),
          },
          5000
        );

        if (response.ok) {
          const result = await response.json().catch(() => null);
          if (result && (result.success || result.status === 'success')) {
            recorded = true;
            if (!inquiryId && result.id) inquiryId = result.id;
            if (result.emailSent) {
              emailDispatched = true;
            }
            backendMessage = result.message || '';
            break;
          }
        }
      } catch (err) {
        console.warn(`Contact endpoint ${endpoint} unreachable:`, err.message);
      }
    }

    // 3. Guarantee mailbox delivery whenever backend/dashboard SMTP has not yet dispatched an email
    if (!emailDispatched) {
      emailDispatched = await this.sendViaWeb3Forms({
        ...normalizedPayload,
        from_name: `DevInquire (${normalizedPayload.form_source})`,
      });
    }

    if (recorded || emailDispatched) {
      return {
        success: true,
        inquiryId,
        emailSent: emailDispatched,
        message:
          backendMessage ||
          "Thank you for your message! We'll get back to you within 24 hours.",
      };
    }

    return {
      success: false,
      error:
        'Submission failed. Please try again or email us directly at contact@devinquire.com',
    };
  }

  /**
   * Logs pre-booking checkout AND dispatches full formData to the mailbox immediately
   * when customer clicks Pre-Book via Stripe, so no form details are ever missed.
   */
  async logPreBookingCheckout(formData, activePlan) {
    const base = this.normalizeFormPayload(formData);
    const planLabel = activePlan?.label || 'Priority Pre-Booking';
    const amountRupees = activePlan?.amountRupees || 399;
    const preBookingPayload = {
      ...base,
      payment_status: 'pending',
      payment_plan: activePlan?.id || 'consultation',
      payment_amount: amountRupees,
      payment_currency: 'INR',
      subject: base.subject.startsWith('[Pre-Booking')
        ? base.subject
        : `[Pre-Booking Started — ₹${amountRupees}/-] ${base.subject} (${planLabel})`,
    };

    return this.submitContactForm(preBookingPayload);
  }

  /**
   * Reconciles payment status (paid / cancelled) with Dashboard Client Inquiries
   * AND dispatches [PAID] confirmation email to mailbox when payment succeeds.
   */
  async confirmInquiryPayment(payload = {}) {
    let dashEmailSent = false;
    let dashRecorded = false;
    try {
      const res = await this.fetchWithTimeout(
        this.dashboardPaymentConfirmUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        6000
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && (json.status === 'success' || json.success)) {
          dashRecorded = true;
          dashEmailSent = Boolean(json.data?.emailSent);
        }
      }
    } catch (err) {
      console.warn('Dashboard payment_confirm warning:', err.message);
    }

    if (payload.payment_status === 'paid' && !dashEmailSent && payload.email) {
      await this.sendViaWeb3Forms({
        ...this.normalizeFormPayload(payload),
        payment_status: 'paid',
        payment_plan: payload.payment_plan,
        payment_amount: payload.payment_amount,
        payment_reference: payload.payment_reference,
        subject: `[PAID ₹${payload.payment_amount || ''}/-] ${
          payload.subject || payload.service || 'Stripe Pre-Booking Confirmed'
        }`,
        message:
          payload.message ||
          `Stripe pre-booking payment of ₹${payload.payment_amount || ''}/- confirmed (Ref: ${
            payload.payment_reference || 'Confirmed'
          }).`,
        from_name: 'DevInquire Stripe Checkout',
      });
    }

    return { success: dashRecorded };
  }

  /**
   * Newsletter Subscription: logs to Dashboard Client Inquiries AND emails contact@devinquire.com
   */
  async subscribeToNewsletter(emailParam, categoriesParam = ['general']) {
    let cleanEmail = '';
    let categories = categoriesParam;

    if (typeof emailParam === 'object' && emailParam !== null) {
      cleanEmail = (emailParam.email || '').trim().toLowerCase();
      if (emailParam.categories) categories = emailParam.categories;
    } else if (typeof emailParam === 'string') {
      cleanEmail = emailParam.trim().toLowerCase();
    }

    if (!cleanEmail || !this.isValidEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      };
    }

    const categoryList = Array.isArray(categories) ? categories : [categories];

    const dashResult = await this.logToDashboard({
      name: 'Newsletter Subscriber',
      email: cleanEmail,
      subject: 'Newsletter Subscription',
      service: 'Newsletter',
      form_source: 'Newsletter Form',
      message: `Newsletter subscription request (${categoryList.join(', ')})`,
    });

    let recorded = dashResult.recorded;
    let emailDispatched = dashResult.emailSent;
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
              categories: categoryList,
            }),
          },
          4000
        );

        if (response.ok) {
          const result = await response.json().catch(() => null);
          if (result && (result.success || result.status === 'success')) {
            recorded = true;
            if (result.emailSent) emailDispatched = true;
            backendMessage = result.message || '';
            break;
          }
        }
      } catch (err) {
        console.warn(`Newsletter endpoint ${endpoint} unreachable:`, err.message);
      }
    }

    if (!emailDispatched) {
      emailDispatched = await this.sendViaWeb3Forms({
        name: 'Newsletter Subscriber',
        email: cleanEmail,
        form_source: 'Newsletter Form',
        subject: 'New Newsletter Subscription — DevInquire',
        message: `New subscriber registered with categories: ${categoryList.join(', ')}`,
        from_name: 'DevInquire Newsletter',
      });
    }

    if (recorded || emailDispatched) {
      return {
        success: true,
        emailSent: emailDispatched,
        message: backendMessage || 'Thank you for subscribing to our newsletter!',
      };
    }

    return {
      success: false,
      error:
        'Failed to subscribe. Please try again or contact us directly at contact@devinquire.com',
    };
  }

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

export const submitContactForm = (formData) =>
  emailService.submitContactForm(formData);
export const logPreBookingCheckout = (formData, activePlan) =>
  emailService.logPreBookingCheckout(formData, activePlan);
export const submitPreBookingFormData = (formData, activePlan) =>
  emailService.logPreBookingCheckout(formData, activePlan);
export const confirmInquiryPayment = (payload) =>
  emailService.confirmInquiryPayment(payload);
export const subscribeToNewsletter = (email, categories) =>
  emailService.subscribeToNewsletter(email, categories);

export default emailService;
