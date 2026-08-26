const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (!isProd ? 'dev-fallback-jwt-secret-min-32-chars-long' : null);
const BLOG_API_KEY = process.env.BLOG_API_KEY;

if (!JWT_SECRET && isProd) {
  console.error('[FATAL] JWT_SECRET env var missing. Set in .env. Generate:\n  node -e "console.log(crypto.randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}
if (isProd && JWT_SECRET && JWT_SECRET.length < 24) {
  console.error('[FATAL] JWT_SECRET must be >= 24 chars in production.');
  process.exit(1);
}
if (JWT_SECRET === 'jwt-secret-token-xyz' && isProd) {
  console.error('[FATAL] JWT_SECRET is using the hardcoded weak placeholder. ROTATE immediately.');
  process.exit(1);
}
if (BLOG_API_KEY && BLOG_API_KEY.length < 24 && isProd) {
  console.warn('[WARN] BLOG_API_KEY appears too short for production. Recommend >= 24 bytes hex.');
}

/**
 * Get client IP address matching PHP logic
 */
function getClientIP(req) {
  const headers = [
    'cf-connecting-ip',
    'x-forwarded-for',
    'x-forwarded',
    'x-cluster-client-ip',
    'forwarded-for',
    'forwarded'
  ];
  for (const header of headers) {
    const val = req.headers[header];
    if (val) {
      const parts = val.split(',');
      return parts[0].trim();
    }
  }
  return req.ip || req.socket.remoteAddress || '0.0.0.0';
}

/**
 * Log authentication attempts in auth_logs table
 */
async function logAuthAttempt(ip, apiKey, success) {
  try {
    const hash = crypto.createHash('sha256').update(apiKey || '').digest('hex');
    await db.query(
      'INSERT INTO auth_logs (ip_address, api_key_hash, success, created_at) VALUES (?, ?, ?, NOW())',
      [ip, hash, success ? 1 : 0]
    );
  } catch (error) {
    console.error('Failed to log auth attempt:', error);
  }
}

/**
 * API Key Validation Middleware
 */
async function validateAPIKey(req, res, next) {
  const ip = getClientIP(req);
  let apiKey = req.headers['x-api-key'] || req.headers['authorization'] || '';
  
  if (apiKey.startsWith('Bearer ')) {
    apiKey = apiKey.substring(7);
  }

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required',
      code: 401,
      timestamp: new Date().toISOString()
    });
  }

  if (apiKey === BLOG_API_KEY && BLOG_API_KEY) {
    return next();
  }

  await logAuthAttempt(ip, apiKey, false);

  return res.status(403).json({
    success: false,
    error: 'Invalid API key',
    code: 403,
    timestamp: new Date().toISOString()
  });
}

/**
 * Rate Limiting Middleware
 */
async function checkRateLimit(req, res, next) {
  const ip = getClientIP(req);
  const window = parseInt(process.env.RATE_LIMIT_WINDOW || '3600', 10);
  const maxRequests = parseInt(process.env.RATE_LIMIT_REQUESTS || '1000', 10);

  try {
    // Format timestamp for query (current time - window seconds)
    const windowAgo = new Date(Date.now() - window * 1000);

    // Clean old entries
    await db.query('DELETE FROM rate_limiting WHERE created_at < ?', [windowAgo]);

    // Count current requests
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM rate_limiting WHERE identifier = ? AND created_at > ?',
      [ip, windowAgo]
    );
    const count = rows[0]?.count || 0;

    if (count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 429,
        timestamp: new Date().toISOString()
      });
    }

    // Log this request
    await db.query('INSERT INTO rate_limiting (identifier, created_at) VALUES (?, NOW())', [ip]);
    
    return next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow request if rate limiting table check fails to ensure service availability
    return next();
  }
}

/**
 * JWT Token Generation
 */
function generateJWT(payload, expiry = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiry });
}

/**
 * JWT Token Validation
 */
function validateJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  getClientIP,
  validateAPIKey,
  checkRateLimit,
  generateJWT,
  validateJWT
};
