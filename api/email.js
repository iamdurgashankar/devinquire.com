const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ENV_CANDIDATE_PATHS = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../devinquire-dashboard/server/.env'),
];

const DASHBOARD_STORE_PATH = path.join(
  __dirname,
  '../../devinquire-dashboard/server/data/local-db.json'
);

function readLiveEnvMap() {
  const merged = {};
  for (const envPath of ENV_CANDIDATE_PATHS) {
    try {
      if (fs.existsSync(envPath)) {
        const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== undefined && String(v).trim() !== '' && !merged[k]) {
            merged[k] = String(v).trim();
          }
        }
      }
    } catch {
      // ignore individual file read errors
    }
  }
  return merged;
}

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

    const liveEnv = readLiveEnvMap();
    const pick = (...vals) => {
      for (const v of vals) {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          const s = String(v).trim();
          if (s !== 'your_email_password' && !s.startsWith('REPLACE_WITH')) {
            return s;
          }
        }
      }
      return '';
    };

    const host =
      pick(dashConfig.smtpHost, process.env.SMTP_HOST, liveEnv.SMTP_HOST) ||
      'smtp.hostinger.com';
    const port = parseInt(
      pick(dashConfig.smtpPort, process.env.SMTP_PORT, liveEnv.SMTP_PORT) ||
        (host.includes('hostinger') ? '465' : '587'),
      10
    );
    const username = pick(
      dashConfig.smtpUser,
      process.env.SMTP_USERNAME,
      liveEnv.SMTP_USERNAME,
      process.env.SMTP_USER,
      liveEnv.SMTP_USER
    );
    const password = pick(
      dashConfig.smtpPass,
      process.env.SMTP_PASSWORD,
      liveEnv.SMTP_PASSWORD,
      process.env.SMTP_PASS,
      liveEnv.SMTP_PASS
    );
    const secureRaw = pick(process.env.SMTP_SECURE, liveEnv.SMTP_SECURE);
    const secure =
      port === 465 ||
      secureRaw.toLowerCase() === 'true' ||
      secureRaw === '1';

    return {
      host,
      port,
      secure,
      username,
      password,
      encryption: pick(process.env.SMTP_ENCRYPTION, liveEnv.SMTP_ENCRYPTION) || 'tls',
      fromEmail:
        pick(
          dashConfig.fromEmail,
          process.env.MAIL_FROM_ADDRESS,
          liveEnv.MAIL_FROM_ADDRESS,
          process.env.SMTP_FROM,
          liveEnv.SMTP_FROM,
          process.env.FROM_EMAIL,
          liveEnv.FROM_EMAIL,
          username
        ) || 'contact@devinquire.com',
      fromName:
        pick(
          dashConfig.fromName,
          process.env.MAIL_FROM_NAME,
          liveEnv.MAIL_FROM_NAME,
          process.env.FROM_NAME,
          liveEnv.FROM_NAME
        ) || 'DevInquire Website',
      contactEmail:
        pick(
          dashConfig.recipientEmail,
          process.env.CONTACT_EMAIL,
          liveEnv.CONTACT_EMAIL,
          process.env.ADMIN_EMAIL,
          liveEnv.ADMIN_EMAIL
        ) || 'contact@devinquire.com',
      web3FormsEnabled:
        dashConfig.web3FormsEnabled !== undefined
          ? dashConfig.web3FormsEnabled
          : true,
      web3FormsKey:
        pick(
          dashConfig.web3FormsKey,
          process.env.WEB3FORMS_ACCESS_KEY,
          liveEnv.WEB3FORMS_ACCESS_KEY
        ) || '803e30e6-5c54-4cae-9406-8d13bcf3d8e9',
      autoReplyEnabled:
        dashConfig.autoReplyEnabled !== undefined
          ? dashConfig.autoReplyEnabled
          : true,
      autoReplySubject:
        pick(dashConfig.autoReplySubject) ||
        'Thank you for contacting DevInquire',
      autoReplyTemplate:
        pick(dashConfig.autoReplyTemplate) ||
        'Hello {{name}}, thank you for reaching out to DevInquire. Our team has received your inquiry regarding "{{subject}}" and will respond within 24 hours.',
    };
  }

  createTransporter(cfg) {
    return nodemailer.createTransport({
      host: cfg.host,
      port: Number(cfg.port),
      secure: Boolean(cfg.secure || Number(cfg.port) === 465),
      auth: {
        user: cfg.username,
        pass: cfg.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async trySendSmtp(cfg, mailOptions) {
    const candidates = [cfg];
    // If domain is @devinquire.com and primary host was default smtp.gmail.com, also try Hostinger SMTP automatically
    if (
      cfg.username &&
      cfg.username.toLowerCase().endsWith('@devinquire.com') &&
      !cfg.host.includes('hostinger')
    ) {
      candidates.push({
        ...cfg,
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
      });
    }

    let lastErr = null;
    for (const candidate of candidates) {
      try {
        const transporter = this.createTransporter(candidate);
        const fromAddress = candidate.username.includes('@')
          ? candidate.username
          : candidate.fromEmail;
        const info = await transporter.sendMail({
          ...mailOptions,
          from: `"${candidate.fromName}" <${fromAddress}>`,
        });
        return { sent: true, info, usedConfig: candidate, transporter };
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('SMTP delivery failed');
  }

  /**
   * Send contact/service/product/pre-booking form notification email to mailbox
   * Returns { success, emailSent, provider, message }
   */
  async sendContactNotification(formData) {
    const cfg = this.getLiveConfig();
    const recipient = cfg.contactEmail || 'contact@devinquire.com';
    const subjectPrefix =
      formData.payment_status === 'paid'
        ? `[PAID ₹${formData.payment_amount || ''}/-] `
        : formData.payment_status === 'pending'
          ? `[Pre-Booking Started] `
          : '';
    const rawSubject = formData.subject || 'Website Form Submission';
    const subject = rawSubject.startsWith('[PAID')
      ? rawSubject
      : `${subjectPrefix}New Inquiry: ${rawSubject}`;

    // 1. Send via Nodemailer SMTP if credentials are set
    if (cfg.username && cfg.password) {
      try {
        const { info, usedConfig, transporter } = await this.trySendSmtp(cfg, {
          to: recipient,
          replyTo: formData.email || undefined,
          subject,
          html: this.getContactEmailTemplate(formData),
          text: this.getContactEmailTextTemplate(formData),
        });

        console.log(
          '✅ Mailbox notification sent via SMTP (%s) to %s: %s',
          usedConfig.host,
          recipient,
          info.messageId
        );

        if (cfg.autoReplyEnabled && formData.email && formData.payment_status !== 'pending') {
          const replyBody = cfg.autoReplyTemplate
            .replace(/\{\{name\}\}/g, formData.name || 'Client')
            .replace(/\{\{subject\}\}/g, rawSubject);
          const fromAddress = usedConfig.username.includes('@')
            ? usedConfig.username
            : usedConfig.fromEmail;
          await transporter
            .sendMail({
              from: `"${usedConfig.fromName}" <${fromAddress}>`,
              to: formData.email,
              subject: cfg.autoReplySubject,
              text: replyBody,
            })
            .catch((err) =>
              console.warn('Auto-reply SMTP warning:', err.message)
            );
        }

        return {
          success: true,
          emailSent: true,
          provider: 'smtp',
          message: 'Email delivered to mailbox via SMTP',
        };
      } catch (smtpError) {
        console.warn('SMTP sending warning:', smtpError.message);
      }
    }

    // 2. Fallback to Web3Forms API if SMTP credentials are not configured
    if (cfg.web3FormsEnabled && cfg.web3FormsKey) {
      try {
        const w3Payload = {
          access_key: cfg.web3FormsKey,
          subject,
          from_name: cfg.fromName || 'DevInquire Website',
          name: formData.name || 'Website Visitor',
          email: formData.email || '',
          replyto: formData.email || '',
          phone: formData.phone || 'Not provided',
          company: formData.company || 'Not provided',
          service: formData.service || formData.product || 'General Inquiry',
          timeline: formData.timeline || 'Not specified',
          form_source: formData.form_source || 'Website Form',
          payment_status: formData.payment_status || 'Standard Free Query',
          payment_plan: formData.payment_plan || 'None',
          page_url: formData.page_url || 'https://devinquire.com',
          message: formData.message || '',
        };

        const w3Res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Origin: 'https://devinquire.com',
            Referer: 'https://devinquire.com/contact',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          },
          body: JSON.stringify(w3Payload),
        });
        const w3Json = await w3Res.json().catch(() => null);
        if (w3Res.ok && w3Json && w3Json.success) {
          console.log(
            '✅ Mailbox notification dispatched via Web3Forms to %s',
            recipient
          );
          return {
            success: true,
            emailSent: true,
            provider: 'web3forms',
            message: 'Email dispatched to mailbox via Web3Forms',
          };
        }
      } catch (w3Err) {
        console.warn('Web3Forms dispatch warning:', w3Err.message);
      }
    }

    // 3. Not yet delivered to mailbox — signal emailSent: false so frontend browser fallback dispatches directly
    console.log('📋 Inquiry recorded locally (SMTP credentials unset for %s):', recipient, {
      name: formData.name,
      email: formData.email,
      service: formData.service,
      subject,
    });

    return {
      success: true,
      emailSent: false,
      provider: 'ledger',
      message: 'Inquiry recorded; awaiting SMTP credentials or client-side mailbox relay',
    };
  }

  /**
   * Send newsletter confirmation email
   */
  async sendNewsletterConfirmation(email, confirmationToken) {
    const cfg = this.getLiveConfig();
    const recipient = email || 'contact@devinquire.com';
    if (cfg.username && cfg.password) {
      try {
        const { info } = await this.trySendSmtp(cfg, {
          to: recipient,
          subject: 'Confirm Your Newsletter Subscription - DevInquire',
          html: this.getNewsletterConfirmationTemplate(recipient, confirmationToken),
          text: this.getNewsletterConfirmationTextTemplate(recipient, confirmationToken),
        });
        console.log('Newsletter confirmation sent to %s via SMTP: %s', recipient, info.messageId);
        return { success: true, emailSent: true, message: 'Confirmation email sent' };
      } catch (error) {
        console.warn('Newsletter confirmation SMTP send warning:', error.message);
      }
    }

    // Also notify studio mailbox of new newsletter subscriber
    await this.sendContactNotification({
      name: 'Newsletter Subscriber',
      email: recipient,
      service: 'Newsletter Subscription',
      form_source: 'Newsletter Form',
      subject: `Newsletter Subscription: ${recipient}`,
      message: `New newsletter subscription request from ${recipient}.`,
    });

    return { success: true, emailSent: false, message: 'Confirmation recorded' };
  }

  /**
   * Send payment confirmation notification for Consultation (₹399) or Service Confirmation (₹99)
   */
  async sendPaymentNotification(payment) {
    const cfg = this.getLiveConfig();
    const amountRupees = Math.round((Number(payment.amount) || 0) / 100);
    const planLabel =
      payment.plan_type === 'consultation'
        ? '1:1 Project Clarity Call (₹399/-)'
        : `Priority Kickoff Pass (₹99/-)${
            payment.service_name ? ` — ${payment.service_name}` : ''
          }`;
    const amountDisplay = `₹${amountRupees}/-`;
    const subject = `[PAID ${amountDisplay}] ${planLabel}`;

    const summaryData = {
      name: payment.customer_name || 'Client',
      email: payment.customer_email || '',
      phone: payment.customer_phone || '',
      company: payment.company || '',
      service: payment.service_name || planLabel,
      form_source: 'Stripe Pre-Booking Checkout',
      payment_status: 'paid',
      payment_plan: planLabel,
      payment_amount: amountRupees,
      payment_reference:
        payment.stripe_payment_intent_id || payment.stripe_session_id || '',
      subject,
      message: [
        `Plan: ${planLabel}`,
        `Amount Paid: ${amountDisplay} (${(payment.currency || 'inr').toUpperCase()})`,
        payment.service_name ? `Selected Service: ${payment.service_name}` : null,
        payment.stripe_payment_intent_id
          ? `Stripe Payment Intent: ${payment.stripe_payment_intent_id}`
          : null,
        payment.stripe_session_id
          ? `Stripe Session ID: ${payment.stripe_session_id}`
          : null,
        payment.notes ? `\nSubmitted Form Details:\n${payment.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    };

    const result = await this.sendContactNotification(summaryData);

    // Also send payment receipt to client if SMTP is active
    if (cfg.username && cfg.password && summaryData.email) {
      this.trySendSmtp(cfg, {
        to: summaryData.email,
        subject: `Payment Receipt (${amountDisplay}) — DevInquire`,
        text: [
          `Hello ${summaryData.name},`,
          '',
          `We have received your payment of ${amountDisplay} for ${planLabel}.`,
          summaryData.payment_reference
            ? `Reference ID: ${summaryData.payment_reference}`
            : '',
          '',
          'Our engineering team has received your inquiry details and locked your priority slot. We will reach out shortly with next steps.',
          '',
          'Best regards,',
          'DevInquire Team',
          'https://devinquire.com',
        ]
          .filter((l) => l !== null)
          .join('\n'),
      }).catch((err) =>
        console.warn('Client receipt SMTP warning:', err.message)
      );
    }

    return result;
  }

  getContactEmailTemplate(formData) {
    const rows = [
      ['Full Name', formData.name],
      ['Email Address', formData.email],
      ['Phone / WhatsApp', formData.phone],
      ['Company / Organization', formData.company],
      ['Service / Product', formData.service || formData.product],
      ['Project Timeline', formData.timeline],
      ['Form Source', formData.form_source],
      [
        'Pre-Booking / Payment',
        formData.payment_status && formData.payment_status !== 'none'
          ? `${String(formData.payment_status).toUpperCase()}${
              formData.payment_plan ? ` — ${formData.payment_plan}` : ''
            }${formData.payment_amount ? ` (₹${formData.payment_amount}/-)` : ''}`
          : null,
      ],
      ['Payment Reference', formData.payment_reference],
      ['Source Page', formData.page_url],
      ['Subject', formData.subject || 'Website Form Submission'],
      [
        'Submitted At',
        new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'medium',
        }) + ' IST',
      ],
    ].filter(([, val]) => val !== undefined && val !== null && String(val).trim() !== '');

    const fieldsHtml = rows
      .map(
        ([label, val]) => `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 36%; vertical-align: top;">${escapeHtml(
              label
            )}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #111827; vertical-align: top;">${escapeHtml(
              String(val)
            )}</td>
          </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DevInquire Form Submission</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; padding: 24px; margin: 0;">
  <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #4e45e1, #6B63F2); color: #ffffff; padding: 24px 28px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">DevInquire Mailbox Intake</div>
      <h1 style="margin: 6px 0 0; font-size: 20px; font-weight: 700;">${escapeHtml(
        formData.subject || 'New Website Form Submission'
      )}</h1>
    </div>
    <div style="padding: 24px 28px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <tbody>
          ${fieldsHtml}
        </tbody>
      </table>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4e45e1; margin-bottom: 8px;">Project Details / Message</div>
        <div style="font-size: 14px; color: #111827; white-space: pre-wrap;">${escapeHtml(
          formData.message || ''
        )}</div>
      </div>
    </div>
    <div style="padding: 16px 28px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      Sent automatically from devinquire.com · Reply directly to this email to respond to ${escapeHtml(
        formData.name || 'the client'
      )}
    </div>
  </div>
</body>
</html>`;
  }

  getContactEmailTextTemplate(formData) {
    const lines = [
      '=== DevInquire Website Form Submission ===',
      '',
      `Full Name: ${formData.name || ''}`,
      `Email: ${formData.email || ''}`,
      formData.phone ? `Phone / WhatsApp: ${formData.phone}` : null,
      formData.company ? `Company: ${formData.company}` : null,
      formData.service || formData.product
        ? `Service / Product: ${formData.service || formData.product}`
        : null,
      formData.timeline ? `Timeline: ${formData.timeline}` : null,
      formData.form_source ? `Form Source: ${formData.form_source}` : null,
      formData.payment_status && formData.payment_status !== 'none'
        ? `Pre-Booking / Payment: ${String(formData.payment_status).toUpperCase()}${
            formData.payment_plan ? ` (${formData.payment_plan})` : ''
          }${formData.payment_amount ? ` — ₹${formData.payment_amount}/-` : ''}`
        : null,
      formData.payment_reference
        ? `Payment Reference: ${formData.payment_reference}`
        : null,
      formData.page_url ? `Page URL: ${formData.page_url}` : null,
      `Subject: ${formData.subject || 'Website Form Submission'}`,
      `Submitted: ${new Date().toISOString()}`,
      '',
      '--- Message / Details ---',
      formData.message || '',
    ].filter((l) => l !== null);

    return lines.join('\n');
  }

  getNewsletterConfirmationTemplate(email, confirmationToken) {
    const confirmationUrl = `https://devinquire.com/api/newsletter-confirm.php?token=${confirmationToken}`;

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Confirm Your Newsletter Subscription</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #4e45e1; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0;">Welcome to DevInquire!</h1>
    </div>
    <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 10px 10px;">
      <p>Thank you for subscribing to our newsletter!</p>
      <p>Please click the button below to confirm your email address:</p>
      <p style="text-align: center;">
        <a href="${confirmationUrl}" style="display: inline-block; background: #4e45e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Confirm Subscription</a>
      </p>
      <p style="font-size: 12px; color: #666;">Or copy this link: <a href="${confirmationUrl}">${confirmationUrl}</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  getNewsletterConfirmationTextTemplate(email, confirmationToken) {
    const confirmationUrl = `https://devinquire.com/api/newsletter-confirm.php?token=${confirmationToken}`;
    return [
      'Welcome to DevInquire!',
      '',
      'Thank you for subscribing to our newsletter!',
      'Confirm your email address by visiting:',
      confirmationUrl,
      '',
      '© DevInquire. All rights reserved.',
    ].join('\n');
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
