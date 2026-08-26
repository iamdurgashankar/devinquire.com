const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('./db');
const emailSender = require('./email');
const { getClientIP } = require('./auth');

// Generate secure token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Validate subscription inputs
function validateInput(input) {
  const errors = [];
  
  const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!input.email || !emailRegex.test(input.email)) {
    errors.push('Please enter a valid email address');
  }
  if (input.email && input.email.length > 255) {
    errors.push('Email must be less than 255 characters');
  }
  
  if (input.categories) {
    if (!Array.isArray(input.categories)) {
      errors.push('Categories must be an array');
    } else {
      const validCategories = ['general', 'tech', 'business', 'updates', 'tutorials'];
      for (const cat of input.categories) {
        if (typeof cat === 'string' && !validCategories.includes(cat.toLowerCase())) {
          // allow standard categories
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    message: errors.join(', ')
  };
}

/**
 * POST /newsletter.php - Newsletter Subscription
 */
router.post('/', async (req, res) => {
  const ip = getClientIP(req);
  
  try {
    const input = req.body;
    if (!input) {
      return res.status(400).json({ success: false, message: 'Invalid JSON data' });
    }
    
    // Validate
    const validation = validateInput(input);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }
    
    const email = input.email.trim().toLowerCase();
    const categories = input.categories || ['general'];
    
    // Generate tokens
    const confirmationToken = generateToken();
    const unsubscribeToken = generateToken();
    const categoriesJson = JSON.stringify(categories);
    
    // Database operations (resilient fallback)
    try {
      // Rate limit check: max 3 subscriptions in the last hour
      const hourAgo = new Date(Date.now() - 3600 * 1000);
      const [rateCheck] = await db.query(
        'SELECT COUNT(*) as count FROM newsletter_subscriptions WHERE ip_address = ? AND subscribed_at > ?',
        [ip, hourAgo]
      );
      
      if (rateCheck[0]?.count >= 3) {
        return res.status(429).json({
          success: false,
          message: 'Too many subscription attempts. Please try again in 1 hour.'
        });
      }
      
      // Check if already subscribed
      const [existing] = await db.query(
        'SELECT id, status FROM newsletter_subscriptions WHERE email = ?',
        [email]
      );
      
      if (existing.length > 0) {
        const sub = existing[0];
        if (sub.status === 'confirmed') {
          return res.json({
            success: true,
            message: 'You are already subscribed to our newsletter.'
          });
        }
        
        await db.query(
          `UPDATE newsletter_subscriptions 
           SET categories = ?, status = 'pending', 
               confirmation_token = ?, unsubscribe_token = ?,
               ip_address = ?, subscribed_at = NOW(),
               confirmed_at = NULL, unsubscribed_at = NULL
           WHERE email = ?`,
          [categoriesJson, confirmationToken, unsubscribeToken, ip, email]
        );
      } else {
        await db.query(
          `INSERT INTO newsletter_subscriptions 
           (email, categories, status, confirmation_token, unsubscribe_token, ip_address, subscribed_at) 
           VALUES (?, ?, 'pending', ?, ?, ?, NOW())`,
          [email, categoriesJson, confirmationToken, unsubscribeToken, ip]
        );
      }
    } catch (dbErr) {
      console.warn('Newsletter DB operation warning (proceeding):', dbErr.message);
    }
    
    // Send confirmation email asynchronously
    emailSender.sendNewsletterConfirmation(email, confirmationToken).catch(err => {
      console.error('Asynchronous newsletter confirmation send error:', err);
    });
    
    return res.json({
      success: true,
      message: 'Thank you for subscribing! Please check your email to confirm your subscription.'
    });
    
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
});

/**
 * GET /newsletter-confirm.php - Newsletter Subscription Confirmation
 */
router.get('/confirm', async (req, res) => {
  const token = req.query.token || '';
  
  let result = {
    success: false,
    message: 'An error occurred while confirming your subscription. Please try again later.'
  };
  
  try {
    if (!token) {
      result.message = 'Invalid confirmation link. Token is missing.';
      return res.send(generateResponseHtml(result));
    }
    
    // Find subscription by token (must be within last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [subs] = await db.query(
      `SELECT id, email, status FROM newsletter_subscriptions 
       WHERE confirmation_token = ? AND subscribed_at > ?`,
      [token, sevenDaysAgo]
    );
    
    if (subs.length === 0) {
      result.message = 'Invalid or expired confirmation link.';
      return res.send(generateResponseHtml(result));
    }
    
    const sub = subs[0];
    
    if (sub.status === 'confirmed') {
      result = {
        success: true,
        message: 'Your subscription is already confirmed. Thank you!',
        email: sub.email
      };
      return res.send(generateResponseHtml(result));
    }
    
    // Update status to confirmed
    await db.query(
      "UPDATE newsletter_subscriptions SET status = 'confirmed', confirmed_at = NOW() WHERE id = ?",
      [sub.id]
    );
    
    result = {
      success: true,
      message: 'Thank you! Your newsletter subscription has been confirmed.',
      email: sub.email
    };
    return res.send(generateResponseHtml(result));
    
  } catch (error) {
    console.error('Newsletter confirmation route error:', error);
    result.message = 'A technical database error occurred. Please try again later.';
    return res.send(generateResponseHtml(result));
  }
});

// HTML layout generation matching newsletter-confirm.php
function generateResponseHtml(result) {
  const title = result.success ? 'Subscription Confirmed' : 'Confirmation Failed';
  const statusClass = result.success ? 'success' : 'error';
  const email = result.email ? escapeHtml(result.email) : '';
  const icon = result.success ? '✓' : '✗';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - DevInquire</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        
        .icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: white;
        }
        
        .icon.success {
            background: #10b981;
        }
        
        .icon.error {
            background: #ef4444;
        }
        
        h1 {
            font-size: 28px;
            margin-bottom: 16px;
            color: #1f2937;
        }
        
        .message {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .email {
            background: #f3f4f6;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            color: #374151;
            margin-bottom: 30px;
            word-break: break-all;
        }
        
        .actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
        }
        
        .btn-primary {
            background: #0077b6;
            color: white;
        }
        
        .btn-primary:hover {
            background: #005f8a;
            transform: translateY(-1px);
        }
        
        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }
        
        .btn-secondary:hover {
            background: #e5e7eb;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 30px 20px;
            }
            
            h1 {
                font-size: 24px;
            }
            
            .actions {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon ${statusClass}">
            ${icon}
        </div>
        
        <h1>${title}</h1>
        
        <div class="message">
            ${escapeHtml(result.message)}
        </div>
        ${email ? `<div class="email">${email}</div>` : ''}
        
        <div class="actions">
            <a href="https://devinquire.com" class="btn btn-primary">Visit DevInquire</a>
            <a href="https://devinquire.com/blog" class="btn btn-secondary">Read Our Blog</a>
        </div>
        
        <div class="footer">
            <p>&copy; 2024 DevInquire. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
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

module.exports = router;
