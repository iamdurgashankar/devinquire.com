const express = require('express');
const router = express.Router();
const db = require('./db');
const emailSender = require('./email');
const { getClientIP } = require('./auth');

// Basic spam patterns detection
function detectSpam(message) {
  const spamPatterns = [
    /\b(viagra|cialis|casino|lottery)\b/i
  ];
  
  for (const pattern of spamPatterns) {
    if (pattern.test(message || '')) {
      return { isSpam: true, reason: 'Spam pattern detected' };
    }
  }
  return { isSpam: false, reason: 'Clean' };
}

// Validate input data
function validateInput(input) {
  const errors = [];
  
  if (!input.name || input.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  if (input.name && input.name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }
  
  const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!input.email || !emailRegex.test(input.email)) {
    errors.push('Please enter a valid email address');
  }
  if (input.email && input.email.length > 255) {
    errors.push('Email must be less than 255 characters');
  }
  
  if (!input.message || input.message.trim().length < 3) {
    errors.push('Message must be at least 3 characters long');
  }
  if (input.message && input.message.length > 5000) {
    errors.push('Message must be less than 5000 characters');
  }
  
  // Services form vs contact form logic
  if (input.service && input.service.trim()) {
    if (input.service.trim().length < 2) {
      errors.push('Please select a valid service');
    }
  } else {
    if (!input.subject || input.subject.trim().length < 2) {
      errors.push('Subject must be at least 2 characters long');
    }
  }
  
  if (input.phone && input.phone.trim()) {
    const cleanPhone = input.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      errors.push('Please enter a valid phone number');
    }
  }
  
  if (input.company && input.company.length > 200) {
    errors.push('Company name must be less than 200 characters');
  }
  
  if (input.subject && input.subject.length > 255) {
    errors.push('Subject must be less than 255 characters');
  }
  
  if (input.service && input.service.length > 100) {
    errors.push('Service must be less than 100 characters');
  }
  
  if (input.message && detectSpam(input.message).isSpam) {
    errors.push('Message contains prohibited content');
  }
  
  return {
    valid: errors.length === 0,
    message: errors.join(', ')
  };
}

/**
 * Handle Contact Submission
 */
router.post('/', async (req, res) => {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  
  try {
    const input = req.body;
    if (!input) {
      return res.status(400).json({ success: false, message: 'Invalid JSON data' });
    }
    
    // Ensure subject has default if missing
    if (!input.subject && input.service) {
      input.subject = `Service Request: ${input.service}`;
    } else if (!input.subject) {
      input.subject = 'Contact Form Submission';
    }

    // Validate inputs
    const validationResult = validateInput(input);
    if (!validationResult.valid) {
      return res.status(400).json({ success: false, message: validationResult.message });
    }
    
    // Check rate limit (gracefully fallback if DB fails)
    try {
      const hourAgo = new Date(Date.now() - 3600 * 1000);
      const [rateCheck] = await db.query(
        'SELECT COUNT(*) as count FROM contact_submissions WHERE ip_address = ? AND created_at > ?',
        [ip, hourAgo]
      );
      
      if (rateCheck[0]?.count >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many submissions. Please try again in 1 hour.'
        });
      }
    } catch (rateErr) {
      console.warn('Database rate limit check warning:', rateErr.message);
    }
    
    // Sanitize input
    const sanitized = {
      inquiry_id: input.inquiry_id || input.inquiryId || null,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone ? String(input.phone).trim() : null,
      company: input.company ? String(input.company).trim() : null,
      service: input.service ? String(input.service).trim() : (input.product ? String(input.product).trim() : null),
      product: input.product ? String(input.product).trim() : null,
      subject: input.subject.trim(),
      timeline: input.timeline ? String(input.timeline).trim() : null,
      form_source: input.form_source || input.formSource || 'Contact Form',
      page_url: input.page_url || input.pageUrl || null,
      payment_status: input.payment_status || 'none',
      payment_plan: input.payment_plan || null,
      payment_amount: input.payment_amount ? Number(input.payment_amount) : null,
      payment_reference: input.payment_reference || null,
      form_payload: input.form_payload || null,
      message: input.message.trim(),
      ip_address: ip,
      user_agent: userAgent
    };
    
    let submissionId = Date.now();
    let dashEmailSent = false;

    // Save to Database (resilient - non-blocking if DB fails)
    try {
      const [result] = await db.query(
        `INSERT INTO contact_submissions 
         (name, email, phone, company, service, subject, timeline, message, ip_address, user_agent, status, priority, response_sent) 
         VALUES (:name, :email, :phone, :company, :service, :subject, :timeline, :message, :ip_address, :user_agent, 'new', 'medium', 0)`,
        sanitized
      );
      if (result && result.insertId) {
        submissionId = result.insertId;
      }

      // Also insert directly into the shared `contacts` table used by DevInquire Dashboard
      await db.query(
        `INSERT INTO contacts (name, email, subject, message, status, priority, company, phone, service, timeline)
         VALUES (:name, :email, :subject, :message, 'new', 'Medium', :company, :phone, :service, :timeline)`,
        sanitized
      ).catch(() => {});

      await db.query(
        'INSERT INTO rate_limiting (identifier, created_at) VALUES (?, NOW())',
        [ip + '_contact']
      ).catch(() => {});
    } catch (dbErr) {
      console.warn('Database save warning (proceeding to email send):', dbErr.message);
    }

    // Forward to Dashboard Client Inquiries Intake API
    try {
      const dashBase = (
        process.env.DASHBOARD_API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://dashboard.devinquire.com/api/public'
          : 'http://localhost:8001/api/public')
      ).replace(/\/$/, '');
      const intakeRes = await fetch(`${dashBase}/contact_intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized)
      });
      if (intakeRes.ok) {
        const intakeJson = await intakeRes.json().catch(() => null);
        if (intakeJson?.data?.id) {
          submissionId = intakeJson.data.id;
        }
        if (intakeJson?.data?.emailSent) {
          dashEmailSent = true;
        }
      }
    } catch (dashErr) {
      console.warn('Dashboard intake sync warning:', dashErr.message);
    }

    // Send email notification to contact@devinquire.com (unless Dashboard SMTP already dispatched it)
    let mailResult = { emailSent: dashEmailSent, provider: dashEmailSent ? 'dashboard_smtp' : 'none' };
    if (!dashEmailSent) {
      mailResult = await emailSender.sendContactNotification(sanitized);
    }

    if (mailResult?.emailSent && submissionId) {
      await db
        .query('UPDATE contact_submissions SET response_sent = 1 WHERE id = ?', [submissionId])
        .catch(() => {});
    }
    
    return res.json({
      success: true,
      emailSent: Boolean(dashEmailSent || mailResult?.emailSent),
      provider: mailResult?.provider || 'ledger',
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
      id: submissionId
    });
    
  } catch (error) {
    console.error('Contact submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
});

router.get('/mail-status', (req, res) => {
  const cfg = emailSender.getLiveConfig();
  return res.json({
    success: true,
    smtpConfigured: Boolean(cfg.username && cfg.password),
    smtpHost: cfg.host,
    smtpPort: cfg.port,
    recipientEmail: cfg.contactEmail,
    web3FormsFallbackEnabled: Boolean(cfg.web3FormsEnabled && cfg.web3FormsKey)
  });
});

module.exports = router;
