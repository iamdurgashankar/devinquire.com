const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { defineString } = require('firebase-functions/params');

// Environment variables
const SMTP_HOST = defineString('SMTP_HOST');
const SMTP_PORT = defineString('SMTP_PORT');
const SMTP_USER = defineString('SMTP_USER');
const SMTP_PASS = defineString('SMTP_PASS');
const FROM_EMAIL = defineString('FROM_EMAIL');
const APP_NAME = defineString('APP_NAME', { default: 'DevInquire Dashboard' });
const APP_URL = defineString('APP_URL', { default: 'https://your-app.com' });

// Initialize Firestore
const db = admin.firestore();

// Create transporter
let transporter;

try {
  transporter = nodemailer.createTransporter({
    host: SMTP_HOST.value(),
    port: parseInt(SMTP_PORT.value()),
    secure: parseInt(SMTP_PORT.value()) === 465,
    auth: {
      user: SMTP_USER.value(),
      pass: SMTP_PASS.value()
    }
  });
} catch (error) {
  console.error('Error creating email transporter:', error);
}

// Email templates
const emailTemplates = {
  registration_confirmation: {
    subject: `Welcome to ${APP_NAME.value()}! Registration Confirmation`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .status-badge { background: #ffd700; color: #333; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to ${APP_NAME.value()}!</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.displayName || 'User'}!</h2>
          <p>Thank you for registering with ${APP_NAME.value()}. Your account has been successfully created!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span class="status-badge">⏳ Pending Admin Approval</span>
          </div>
          
          <h3>What happens next?</h3>
          <ol>
            <li><strong>Email Verification:</strong> Please verify your email address if you haven't already</li>
            <li><strong>Admin Review:</strong> Our administrators will review your registration</li>
            <li><strong>Approval Notification:</strong> You'll receive an email once your account is approved</li>
            <li><strong>Dashboard Access:</strong> After approval, you can access the full dashboard</li>
          </ol>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h4>📧 Account Details:</h4>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Status:</strong> Pending Approval</p>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <a href="${APP_URL.value()}" class="button">Visit Dashboard</a>
        </div>
        <div class="footer">
          <p>This is an automated message from ${APP_NAME.value()}.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      </body>
      </html>
    `
  },

  admin_new_user_notification: {
    subject: `New User Registration - ${APP_NAME.value()}`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Registration</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .approve-btn { background: #27ae60; }
          .reject-btn { background: #e74c3c; }
          .user-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff6b6b; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>👤 New User Registration</h1>
        </div>
        <div class="content">
          <h2>Admin Action Required</h2>
          <p>A new user has registered and is awaiting approval to access the dashboard.</p>
          
          <div class="user-info">
            <h3>User Information:</h3>
            <p><strong>Name:</strong> ${data.displayName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${data.userEmail}</p>
            <p><strong>Registration Method:</strong> ${data.registrationMethod}</p>
            <p><strong>Registration Date:</strong> ${new Date(data.registrationDate).toLocaleString()}</p>
            <p><strong>User ID:</strong> ${data.userId}</p>
          </div>
          
          <h3>Actions Available:</h3>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL.value()}/admin/users?action=approve&userId=${data.userId}" class="button approve-btn">✅ Approve User</a>
            <a href="${APP_URL.value()}/admin/users?action=reject&userId=${data.userId}" class="button reject-btn">❌ Reject User</a>
          </div>
          
          <p><strong>Note:</strong> Please review the user's information carefully before making a decision. You can also manage users from the admin dashboard.</p>
          
          <a href="${APP_URL.value()}/admin/users" class="button">Go to Admin Dashboard</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from ${APP_NAME.value()}.</p>
        </div>
      </body>
      </html>
    `
  },

  account_approved: {
    subject: `🎉 Account Approved - Welcome to ${APP_NAME.value()}!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #27ae60; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .status-badge { background: #27ae60; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; }
          .feature-list { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Account Approved!</h1>
        </div>
        <div class="content">
          <h2>Congratulations ${data.displayName || 'User'}!</h2>
          <p>Great news! Your ${APP_NAME.value()} account has been approved by our administrators.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span class="status-badge">✅ Account Approved</span>
          </div>
          
          <div class="feature-list">
            <h3>🚀 What you can do now:</h3>
            <ul>
              <li>Access the full dashboard and all features</li>
              <li>Create and manage your content</li>
              <li>Customize your profile settings</li>
              <li>Collaborate with other users</li>
              <li>Access premium features based on your role</li>
            </ul>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h4>📋 Account Details:</h4>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Role:</strong> ${data.role || 'User'}</p>
            <p><strong>Approved By:</strong> ${data.approvedBy || 'Administrator'}</p>
            <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${APP_URL.value()}/login" class="button">🚀 Access Dashboard Now</a>
          </div>
          
          <p>If you have any questions or need assistance getting started, our support team is here to help!</p>
        </div>
        <div class="footer">
          <p>Welcome to ${APP_NAME.value()}! We're excited to have you on board.</p>
        </div>
      </body>
      </html>
    `
  },

  account_rejected: {
    subject: `Account Registration Update - ${APP_NAME.value()}`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Registration Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .reason-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Registration Update</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.displayName || 'User'},</h2>
          <p>Thank you for your interest in ${APP_NAME.value()}. After reviewing your registration, we are unable to approve your account at this time.</p>
          
          ${data.reason ? `
          <div class="reason-box">
            <h4>📝 Reason for rejection:</h4>
            <p>${data.reason}</p>
          </div>
          ` : ''}
          
          <h3>What you can do:</h3>
          <ul>
            <li>Review our terms of service and community guidelines</li>
            <li>Contact our support team if you believe this was an error</li>
            <li>Reapply in the future if circumstances change</li>
          </ul>
          
          <p>We appreciate your understanding and encourage you to reach out if you have any questions.</p>
          
          <a href="${APP_URL.value()}/contact" class="button">Contact Support</a>
        </div>
        <div class="footer">
          <p>This decision was made by ${APP_NAME.value()} administrators.</p>
        </div>
      </body>
      </html>
    `
  },

  access_denied: {
    subject: `Access Attempt Notification - ${APP_NAME.value()}`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Attempt Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .status-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ Access Attempt</h1>
        </div>
        <div class="content">
          <h2>Hello,</h2>
          <p>We noticed you tried to access ${APP_NAME.value()}, but your account status prevents access at this time.</p>
          
          <div class="status-info">
            <h4>📊 Current Status:</h4>
            ${this.getStatusMessage(data.reason)}
          </div>
          
          <h3>Next Steps:</h3>
          ${this.getNextSteps(data.reason)}
          
          <p>If you have any questions or believe this is an error, please contact our support team.</p>
          
          <a href="${APP_URL.value()}/contact" class="button">Contact Support</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from ${APP_NAME.value()}.</p>
          <p>Access attempt time: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `
  }
};

// Helper functions for access denied email
function getStatusMessage(reason) {
  switch (reason) {
    case 'pending_approval':
      return '<p><strong>Status:</strong> Pending Admin Approval</p><p>Your account is waiting for administrator review and approval.</p>';
    case 'rejected':
      return '<p><strong>Status:</strong> Registration Rejected</p><p>Your account registration was not approved.</p>';
    case 'suspended':
      return '<p><strong>Status:</strong> Account Suspended</p><p>Your account has been temporarily suspended.</p>';
    case 'banned':
      return '<p><strong>Status:</strong> Account Banned</p><p>Your account has been permanently banned.</p>';
    case 'unregistered':
      return '<p><strong>Status:</strong> Not Registered</p><p>No account found with your credentials.</p>';
    default:
      return '<p><strong>Status:</strong> Access Restricted</p><p>Your account access is currently restricted.</p>';
  }
}

function getNextSteps(reason) {
  switch (reason) {
    case 'pending_approval':
      return `
        <ul>
          <li>Wait for admin approval (you'll receive an email notification)</li>
          <li>Ensure your email is verified</li>
          <li>Check your spam folder for approval emails</li>
        </ul>
      `;
    case 'rejected':
      return `
        <ul>
          <li>Review the rejection reason in your previous email</li>
          <li>Contact support if you believe this was an error</li>
          <li>Consider reapplying in the future</li>
        </ul>
      `;
    case 'suspended':
      return `
        <ul>
          <li>Contact support to understand the suspension reason</li>
          <li>Review our terms of service</li>
          <li>Wait for the suspension period to end (if temporary)</li>
        </ul>
      `;
    case 'banned':
      return `
        <ul>
          <li>Contact support if you believe this was an error</li>
          <li>Review our terms of service and community guidelines</li>
        </ul>
      `;
    case 'unregistered':
      return `
        <ul>
          <li>Register for a new account</li>
          <li>Verify you're using the correct email address</li>
          <li>Contact support if you had an account previously</li>
        </ul>
      `;
    default:
      return `
        <ul>
          <li>Contact our support team for assistance</li>
          <li>Verify your account status</li>
        </ul>
      `;
  }
}

// Main email sending function
const sendEmail = functions.https.onCall(async (data, context) => {
  try {
    // Verify the request is authenticated (optional, depending on use case)
    if (!context.auth && data.requireAuth !== false) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { type, to, data: emailData, cc, bcc } = data;

    if (!type || !to) {
      throw new functions.https.HttpsError('invalid-argument', 'Email type and recipient are required');
    }

    const template = emailTemplates[type];
    if (!template) {
      throw new functions.https.HttpsError('invalid-argument', `Unknown email template: ${type}`);
    }

    // Generate email content
    const subject = template.subject;
    const html = template.html(emailData || {});

    // Email options
    const mailOptions = {
      from: `${APP_NAME.value()} <${FROM_EMAIL.value()}>`,
      to: to,
      subject: subject,
      html: html
    };

    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;

    // Send email
    if (!transporter) {
      throw new functions.https.HttpsError('internal', 'Email service not configured');
    }

    const result = await transporter.sendMail(mailOptions);

    // Log email sent
    await db.collection('emailLogs').add({
      type: type,
      to: to,
      subject: subject,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      messageId: result.messageId,
      status: 'sent',
      userId: context.auth?.uid || null
    });

    return {
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    };

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log email error
    try {
      await db.collection('emailLogs').add({
        type: data.type || 'unknown',
        to: data.to || 'unknown',
        error: error.message,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'failed',
        userId: context.auth?.uid || null
      });
    } catch (logError) {
      console.error('Error logging email failure:', logError);
    }

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});

// Batch email sending function
const sendBatchEmails = functions.https.onCall(async (data, context) => {
  try {
    // Verify admin access
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData || !['ADMIN', 'SUPER_ADMIN'].includes(userData.role)) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { emails } = data;
    
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Emails array is required');
    }

    const results = [];
    const batchSize = 10; // Process in batches to avoid timeouts
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (emailData) => {
        try {
          const result = await sendEmail.run(emailData, context);
          return { success: true, email: emailData.to, result };
        } catch (error) {
          return { success: false, email: emailData.to, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: true,
      totalEmails: emails.length,
      successCount,
      failureCount,
      results
    };

  } catch (error) {
    console.error('Error sending batch emails:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to send batch emails');
  }
});

module.exports = {
  sendEmail,
  sendBatchEmails
};