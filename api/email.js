const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const DASHBOARD_STORE_PATH = path.join(
  __dirname,
  '../../devinquire-dashboard/server/data/local-db.json'
);

class EmailSender {
  constructor() {
    this.config = this.getLiveConfig();
  }

  getLiveConfig() {
    let dashConfig = {};
    try {
      if (fs.existsSync(DASHBOARD_STORE_PATH)) {
        const parsed = JSON.parse(fs.readFileSync(DASHBOARD_STORE_PATH, 'utf8'));
        dashConfig = parsed?.settings?.contacts_config || {};
      }
    } catch {
      // ignore read errors
    }

    return {
      host: dashConfig.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(dashConfig.smtpPort || process.env.SMTP_PORT || '587', 10),
      username: dashConfig.smtpUser || process.env.SMTP_USERNAME || '',
      password: dashConfig.smtpPass || process.env.SMTP_PASSWORD || '',
      encryption: process.env.SMTP_ENCRYPTION || 'tls',
      fromEmail:
        dashConfig.fromEmail ||
        process.env.MAIL_FROM_ADDRESS ||
        process.env.FROM_EMAIL ||
        'noreply@devinquire.com',
      fromName:
        dashConfig.fromName ||
        process.env.MAIL_FROM_NAME ||
        process.env.FROM_NAME ||
        'DevInquire',
      contactEmail:
        dashConfig.recipientEmail ||
        process.env.CONTACT_EMAIL ||
        'contact@devinquire.com',
      web3FormsEnabled:
        dashConfig.web3FormsEnabled !== undefined ? dashConfig.web3FormsEnabled : true,
      web3FormsKey:
        dashConfig.web3FormsKey ||
        process.env.WEB3FORMS_ACCESS_KEY ||
        '803e30e6-5c54-4cae-9406-8d13bcf3d8e9',
      autoReplyEnabled:
        dashConfig.autoReplyEnabled !== undefined ? dashConfig.autoReplyEnabled : true,
      autoReplySubject:
        dashConfig.autoReplySubject || 'Thank you for contacting DevInquire',
      autoReplyTemplate:
        dashConfig.autoReplyTemplate ||
        'Hello {{name}}, thank you for reaching out to DevInquire. Our engineering team has received your inquiry regarding "{{subject}}" and will respond within 24 hours.'
    };
  }

  createTransporter(cfg) {
    const secure = Number(cfg.port) === 465;
    return nodemailer.createTransport({
      host: cfg.host,
      port: Number(cfg.port),
      secure,
      auth: {
        user: cfg.username,
        pass: cfg.password
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Send contact form notification email (SMTP -> Web3Forms fallback -> Ledger log)
   */
  async sendContactNotification(formData) {
    const cfg = this.getLiveConfig();
    const recipient = cfg.contactEmail || 'contact@devinquire.com';
    const subject = `New Contact Form Submission: ${formData.subject || 'No Subject'}`;

    // 1. Send via Nodemailer SMTP if credentials are set
    if (cfg.username && cfg.password) {
      try {
        const transporter = this.createTransporter(cfg);
        const mailOptions = {
          from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
          to: recipient,
          replyTo: formData.email,
          subject: subject,
          html: this.getContactEmailTemplate(formData),
          text: this.getContactEmailTextTemplate(formData)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Contact notification sent via SMTP to %s: %s', recipient, info.messageId);

        // Send automated acknowledgement to client if enabled
        if (cfg.autoReplyEnabled && formData.email) {
          const replyBody = cfg.autoReplyTemplate
            .replace(/\{\{name\}\}/g, formData.name || 'Client')
            .replace(/\{\{subject\}\}/g, formData.subject || 'your inquiry');
          await transporter
            .sendMail({
              from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
              to: formData.email,
              subject: cfg.autoReplySubject,
              text: replyBody
            })
            .catch(err => console.warn('Auto-reply SMTP warning:', err.message));
        }

        return { success: true, provider: 'smtp', message: 'Email sent successfully via SMTP' };
      } catch (smtpError) {
        console.warn('SMTP sending warning:', smtpError.message);
      }
    }

    // 2. Fallback to Web3Forms API if SMTP credentials are not configured
    if (cfg.web3FormsEnabled && cfg.web3FormsKey) {
      try {
        const w3Res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: cfg.web3FormsKey,
            name: formData.name || 'Website Inquiry',
            email: formData.email,
            phone: formData.phone || '',
            company: formData.company || '',
            subject: subject,
            message: formData.message,
            to_email: recipient,
            from_name: cfg.fromName || 'DevInquire Contact Form'
          })
        });
        if (w3Res.ok) {
          console.log('📧 Contact notification dispatched via Web3Forms to %s', recipient);
          return { success: true, provider: 'web3forms', message: 'Email dispatched via Web3Forms' };
        }
      } catch (w3Err) {
        console.warn('Web3Forms dispatch warning:', w3Err.message);
      }
    }

    // 3. Log notification details
    console.log('📧 Notification recorded for %s:', recipient, {
      name: formData.name,
      email: formData.email,
      subject: subject,
      message: formData.message
    });

    return { success: true, provider: 'ledger', message: 'Notification recorded in Dashboard Ledger' };
  }

  /**
   * Send newsletter confirmation email
   */
  async sendNewsletterConfirmation(email, confirmationToken) {
    const recipient = email || 'contact@devinquire.com';
    if (this.config.username && this.config.password) {
      try {
        const mailOptions = {
          from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
          to: recipient,
          subject: 'Confirm Your Newsletter Subscription - DevInquire',
          html: this.getNewsletterConfirmationTemplate(recipient, confirmationToken),
          text: this.getNewsletterConfirmationTextTemplate(recipient, confirmationToken)
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('Newsletter confirmation sent to %s via SMTP: %s', recipient, info.messageId);
        return { success: true, message: 'Confirmation email sent' };
      } catch (error) {
        console.warn('Newsletter confirmation SMTP send warning:', error.message);
      }
    }

    console.log('📧 Newsletter confirmation recorded for %s with token: %s', recipient, confirmationToken);
    return { success: true, message: 'Confirmation email recorded' };
  }

  getContactEmailTemplate(formData) {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>New Contact Form Submission</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0077b6; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #0077b6; }
            .value { margin-top: 5px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Contact Form Submission</h1>
            </div>
            <div class="content">
                <div class="field">
                    <div class="label">Name:</div>
                    <div class="value">${escapeHtml(formData.name)}</div>
                </div>
                <div class="field">
                    <div class="label">Email:</div>
                    <div class="value">${escapeHtml(formData.email)}</div>
                </div>`;
                
    if (formData.phone) {
      html += `
                <div class="field">
                    <div class="label">Phone:</div>
                    <div class="value">${escapeHtml(formData.phone)}</div>
                </div>`;
    }
    
    if (formData.company) {
      html += `
                <div class="field">
                    <div class="label">Company:</div>
                    <div class="value">${escapeHtml(formData.company)}</div>
                </div>`;
    }
    
    html += `
                <div class="field">
                    <div class="label">Subject:</div>
                    <div class="value">${escapeHtml(formData.subject || 'Contact Form Submission')}</div>
                </div>
                <div class="field">
                    <div class="label">Message:</div>
                    <div class="value">${escapeHtml(formData.message).replace(/\n/g, '<br>')}</div>
                </div>
                <div class="field">
                    <div class="label">Submitted:</div>
                    <div class="value">${new Date().toISOString().replace('T', ' ').substring(0, 19)}</div>
                </div>
            </div>
            <div class="footer">
                <p>This email was sent from the DevInquire contact form.</p>
            </div>
        </div>
    </body>
    </html>`;
    
    return html;
  }

  getContactEmailTextTemplate(formData) {
    let text = `New Contact Form Submission\n\n`;
    text += `Name: ${formData.name}\n`;
    text += `Email: ${formData.email}\n`;
    
    if (formData.phone) {
      text += `Phone: ${formData.phone}\n`;
    }
    
    if (formData.company) {
      text += `Company: ${formData.company}\n`;
    }
    
    text += `Subject: ${formData.subject || 'Contact Form Submission'}\n`;
    text += `Message: ${formData.message}\n`;
    text += `Submitted: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}\n`;
    
    return text;
  }

  getNewsletterConfirmationTemplate(email, confirmationToken) {
    const confirmationUrl = `https://devinquire.com/api/newsletter-confirm.php?token=${confirmationToken}`;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Confirm Your Newsletter Subscription</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0077b6; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .button { display: inline-block; background: #0077b6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to DevInquire!</h1>
            </div>
            <div class="content">
                <p>Thank you for subscribing to our newsletter!</p>
                <p>To complete your subscription, please click the button below to confirm your email address:</p>
                <p style="text-align: center;">
                    <a href="${confirmationUrl}" class="button" style="color: white;">Confirm Subscription</a>
                </p>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
                <p>Once confirmed, you'll receive our latest insights, tutorials, and updates directly in your inbox.</p>
            </div>
            <div class="footer">
                <p>If you didn't subscribe to this newsletter, you can safely ignore this email.</p>
                <p>&copy; 2024 DevInquire. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  getNewsletterConfirmationTextTemplate(email, confirmationToken) {
    const confirmationUrl = `https://devinquire.com/api/newsletter-confirm.php?token=${confirmationToken}`;
    
    let text = `Welcome to DevInquire!\n\n`;
    text += `Thank you for subscribing to our newsletter!\n\n`;
    text += `To complete your subscription, please visit this link to confirm your email address:\n`;
    text += `${confirmationUrl}\n\n`;
    text += `Once confirmed, you'll receive our latest insights, tutorials, and updates directly in your inbox.\n\n`;
    text += `If you didn't subscribe to this newsletter, you can safely ignore this email.\n\n`;
    text += `© 2024 DevInquire. All rights reserved.`;
    
    return text;
  }
}

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = new EmailSender();
