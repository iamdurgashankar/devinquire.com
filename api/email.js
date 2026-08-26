const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

class EmailSender {
  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      username: process.env.SMTP_USERNAME || '',
      password: process.env.SMTP_PASSWORD || '',
      encryption: process.env.SMTP_ENCRYPTION || 'tls',
      fromEmail: process.env.FROM_EMAIL || 'noreply@devinquire.com',
      fromName: process.env.FROM_NAME || 'DevInquire',
      contactEmail: process.env.CONTACT_EMAIL || 'contact@devinquire.com'
    };

    // Create SMTP transporter
    const secure = this.config.port === 465;
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: secure,
      auth: {
        user: this.config.username,
        pass: this.config.password
      },
      tls: {
        rejectUnauthorized: false // bypass SSL verification issues similar to PHPMailer default settings if needed
      }
    });
  }

  /**
   * Send contact form notification email
   */
  /**
   * Send contact form notification email
   */
  async sendContactNotification(formData) {
    const recipient = this.config.contactEmail || 'contact@devinquire.com';
    const subject = `New Contact Form Submission: ${formData.subject || 'No Subject'}`;
    
    // Send via Nodemailer SMTP if credentials are set
    if (this.config.username && this.config.password) {
      try {
        const mailOptions = {
          from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
          to: recipient,
          subject: subject,
          html: this.getContactEmailTemplate(formData),
          text: this.getContactEmailTextTemplate(formData)
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('Contact notification sent via SMTP to %s: %s', recipient, info.messageId);
        return { success: true, message: 'Email sent successfully via SMTP' };
      } catch (smtpError) {
        console.warn('SMTP sending warning:', smtpError.message);
      }
    }

    // Log notification details for contact@devinquire.com
    console.log('📧 Notification recorded for %s:', recipient, {
      name: formData.name,
      email: formData.email,
      subject: subject,
      message: formData.message
    });
    
    return { success: true, message: 'Notification processed successfully' };
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
