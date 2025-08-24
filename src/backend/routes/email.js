/**
 * Email Routes
 * Handles contact forms and email services
 */

const express = require('express');
const { firebaseAdmin } = require('../firebaseAdmin');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiting for email endpoints
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 email requests per windowMs
  message: {
    error: 'Too many email requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

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
    // Default SMTP configuration
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

// Email validation function
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Spam detection (basic)
const detectSpam = (content) => {
  const spamKeywords = [
    'viagra', 'casino', 'lottery', 'winner', 'congratulations',
    'click here', 'free money', 'make money fast', 'work from home'
  ];
  
  const lowerContent = content.toLowerCase();
  return spamKeywords.some(keyword => lowerContent.includes(keyword));
};

/**
 * Send Contact Form Email
 * POST /api/email/contact
 */
router.post('/contact', emailLimiter, async (req, res) => {
  try {
    const { name, email, subject, message, phone, company } = req.body;
    
    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'Name, email, subject, and message are required',
        code: 'REQUIRED_FIELDS_MISSING'
      });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email address',
        code: 'INVALID_EMAIL'
      });
    }
    
    // Basic spam detection
    if (detectSpam(message) || detectSpam(subject)) {
      return res.status(400).json({
        error: 'Message flagged as potential spam',
        code: 'SPAM_DETECTED'
      });
    }
    
    const db = firebaseAdmin.getFirestore();
    
    // Store contact submission in Firestore
    const contactData = {
      name,
      email,
      subject,
      message,
      phone: phone || null,
      company: company || null,
      status: 'new',
      createdAt: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    const docRef = await db.collection('contact_submissions').add(contactData);
    
    // Send email notification
    try {
      const transporter = createTransporter();
      
      // Email to admin
      const adminMailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #007bff; margin-top: 0;">Contact Details</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
              ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            
            <div style="background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
              <h3 style="color: #333; margin-top: 0;">Message</h3>
              <p style="line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px; font-size: 12px; color: #6c757d;">
              <p><strong>Submission ID:</strong> ${docRef.id}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>IP Address:</strong> ${req.ip}</p>
            </div>
          </div>
        `
      };
      
      await transporter.sendMail(adminMailOptions);
      
      // Auto-reply to user
      const userMailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `Thank you for contacting us - ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">Thank You for Contacting Us!</h2>
            
            <p>Dear ${name},</p>
            
            <p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Your Message Summary</h3>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Reference ID:</strong> ${docRef.id}</p>
            </div>
            
            <p>If you have any urgent questions, please don't hesitate to contact us directly.</p>
            
            <p>Best regards,<br>
            The DevInquire Team</p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="font-size: 12px; color: #6c757d;">
              This is an automated response. Please do not reply to this email.
            </p>
          </div>
        `
      };
      
      await transporter.sendMail(userMailOptions);
      
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      // Don't fail the request if email fails, but log it
      await db.collection('contact_submissions').doc(docRef.id).update({
        emailStatus: 'failed',
        emailError: emailError.message
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      submissionId: docRef.id
    });
    
  } catch (error) {
    console.error('Contact form error:', error.message);
    res.status(500).json({
      error: 'Failed to submit contact form',
      code: 'CONTACT_FORM_FAILED'
    });
  }
});

/**
 * Get Contact Submissions (Admin only)
 * GET /api/email/contact
 */
router.get('/contact', async (req, res) => {
  try {
    // This would need authentication middleware in a real app
    const { limit = 50, offset = 0, status } = req.query;
    
    const db = firebaseAdmin.getFirestore();
    
    let query = db.collection('contact_submissions')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const submissionsSnapshot = await query.get();
    
    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      submissions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Get contact submissions error:', error.message);
    res.status(500).json({
      error: 'Failed to get contact submissions',
      code: 'SUBMISSIONS_FETCH_FAILED'
    });
  }
});

/**
 * Update Contact Submission Status (Admin only)
 * PUT /api/email/contact/:submissionId
 */
router.put('/contact/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, notes } = req.body;
    
    const allowedStatuses = ['new', 'in_progress', 'resolved', 'spam'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        code: 'INVALID_STATUS'
      });
    }
    
    const db = firebaseAdmin.getFirestore();
    
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    
    await db.collection('contact_submissions').doc(submissionId).update(updateData);
    
    res.json({
      success: true,
      message: 'Contact submission updated successfully'
    });
    
  } catch (error) {
    console.error('Update contact submission error:', error.message);
    res.status(500).json({
      error: 'Failed to update contact submission',
      code: 'SUBMISSION_UPDATE_FAILED'
    });
  }
});

/**
 * Send Custom Email (Admin only)
 * POST /api/email/send
 */
router.post('/send', async (req, res) => {
  try {
    const { to, subject, message, isHtml = false } = req.body;
    
    // Validation
    if (!to || !subject || !message) {
      return res.status(400).json({
        error: 'To, subject, and message are required',
        code: 'REQUIRED_FIELDS_MISSING'
      });
    }
    
    // Validate email addresses
    const recipients = Array.isArray(to) ? to : [to];
    for (const email of recipients) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          error: `Invalid email address: ${email}`,
          code: 'INVALID_EMAIL'
        });
      }
    }
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipients.join(', '),
      subject,
      [isHtml ? 'html' : 'text']: message
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    // Log email sending
    const db = firebaseAdmin.getFirestore();
    await db.collection('email_logs').add({
      to: recipients,
      subject,
      messageId: result.messageId,
      status: 'sent',
      sentAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    });
    
  } catch (error) {
    console.error('Send email error:', error.message);
    
    // Log failed email
    try {
      const db = firebaseAdmin.getFirestore();
      await db.collection('email_logs').add({
        to: req.body.to,
        subject: req.body.subject,
        status: 'failed',
        error: error.message,
        attemptedAt: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log email error:', logError.message);
    }
    
    res.status(500).json({
      error: 'Failed to send email',
      code: 'EMAIL_SEND_FAILED'
    });
  }
});

/**
 * Test Email Configuration
 * POST /api/email/test
 */
router.post('/test', async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail || !validateEmail(testEmail)) {
      return res.status(400).json({
        error: 'Valid test email address is required',
        code: 'INVALID_TEST_EMAIL'
      });
    }
    
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    
    // Send test email
    const testMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: testEmail,
      subject: 'Email Configuration Test - DevInquire',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Email Configuration Test</h2>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Sent at: ${new Date().toLocaleString()}</li>
            <li>Service: ${process.env.EMAIL_SERVICE || 'SMTP'}</li>
            <li>From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}</li>
          </ul>
          <p>If you received this email, your configuration is working properly!</p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(testMailOptions);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      testEmail
    });
    
  } catch (error) {
    console.error('Email test error:', error.message);
    res.status(500).json({
      error: 'Email configuration test failed',
      code: 'EMAIL_TEST_FAILED',
      details: error.message
    });
  }
});

/**
 * Get Email Statistics (Admin only)
 * GET /api/email/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const db = firebaseAdmin.getFirestore();
    
    // Get contact form stats
    const contactStats = await db.collection('contact_submissions').get();
    const contactByStatus = {};
    contactStats.forEach(doc => {
      const status = doc.data().status || 'new';
      contactByStatus[status] = (contactByStatus[status] || 0) + 1;
    });
    
    // Get email log stats
    const emailStats = await db.collection('email_logs').get();
    const emailByStatus = {};
    emailStats.forEach(doc => {
      const status = doc.data().status || 'unknown';
      emailByStatus[status] = (emailByStatus[status] || 0) + 1;
    });
    
    res.json({
      success: true,
      stats: {
        contactForms: {
          total: contactStats.size,
          byStatus: contactByStatus
        },
        emails: {
          total: emailStats.size,
          byStatus: emailByStatus
        }
      }
    });
    
  } catch (error) {
    console.error('Get email stats error:', error.message);
    res.status(500).json({
      error: 'Failed to get email statistics',
      code: 'EMAIL_STATS_FAILED'
    });
  }
});

module.exports = router;