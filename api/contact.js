const express = require('express');
const router = express.Router();
const db = require('./db');
const emailSender = require('./email');
const { getClientIP } = require('./auth');

// Basic spam patterns detection
function detectSpam(message) {
  const spamPatterns = [
    /\b(viagra|cialis|casino|lottery|winner|congratulations)\b/i,
    /\b(click here|act now|limited time|urgent)\b/i,
    /(http:\/\/|https:\/\/)[^\s]{10,}/i
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
  
  if (!input.message || input.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters long');
  }
  if (input.message && input.message.length > 5000) {
    errors.push('Message must be less than 5000 characters');
  }
  
  // Services form vs contact form logic
  if (input.service && input.service.trim()) {
    if (input.service.trim().length < 2) {
      errors.push('Please select a valid service');
    }
    if (input.subject && input.subject.trim().length < 5) {
      errors.push('Subject must be at least 5 characters long');
    }
  } else {
    if (!input.subject || input.subject.trim().length < 5) {
      errors.push('Subject must be at least 5 characters long');
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
    
    // Validate inputs
    const validationResult = validateInput(input);
    if (!validationResult.valid) {
      return res.status(400).json({ success: false, message: validationResult.message });
    }
    
    // Check rate limit: max 5 submissions in the last hour
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
    
    // Sanitize input
    const sanitized = {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone ? input.phone.trim() : null,
      company: input.company ? input.company.trim() : null,
      service: input.service ? input.service.trim() : null,
      subject: input.subject ? input.subject.trim() : (input.service ? `Service Request: ${input.service}` : 'Contact Form Submission'),
      timeline: input.timeline ? input.timeline.trim() : null,
      message: input.message.trim(),
      ip_address: ip,
      user_agent: userAgent
    };
    
    // Save to Database
    const [result] = await db.query(
      `INSERT INTO contact_submissions 
       (name, email, phone, company, service, subject, timeline, message, ip_address, user_agent, status, priority, response_sent) 
       VALUES (:name, :email, :phone, :company, :service, :subject, :timeline, :message, :ip_address, :user_agent, 'new', 'medium', 0)`,
      sanitized
    );
    
    const submissionId = result.insertId;
    
    // Add record to rate limiting table as well to log it
    await db.query(
      'INSERT INTO rate_limiting (identifier, created_at) VALUES (?, NOW())',
      [ip + '_contact']
    );
    
    // Send email notification to Admin
    // Wait for it asynchronously, don't block the HTTP response if email is slow
    emailSender.sendContactNotification(sanitized).catch(err => {
      console.error('Asynchronous email notify error:', err);
    });
    
    return res.json({
      success: true,
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

module.exports = router;
