const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 8000;

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS matching allowed origins from environment variables
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl, mobile apps, or local test requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.includes(origin) || 
                      allowedOrigins.includes('*') || 
                      origin.startsWith('http://localhost:') || 
                      origin.startsWith('http://127.0.0.1:');
                      
    if (isAllowed) {
      return callback(null, true);
    }
    
    return callback(new Error(`CORS policy blocked request from origin: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Import route handlers
const contactRouter = require('./contact');
const newsletterRouter = require('./newsletter');
const blogRouter = require('./blog');
const blogAdminRouter = require('./blog-admin');
const syncPostsRouter = require('./sync-posts');

// Register API Routes with compatibility mappings for PHP extension requests

// Contact submissions
app.use('/contact.php', contactRouter);
app.use('/api/contact.php', contactRouter);

// Newsletter subscriptions
app.use('/newsletter.php', newsletterRouter);
app.use('/api/newsletter.php', newsletterRouter);

// Newsletter confirmations (URL rewrite mapping newsletter-confirm.php to /newsletter.php/confirm)
const handleNewsletterConfirm = (req, res, next) => {
  const queryIndex = req.url.indexOf('?');
  const queryString = queryIndex !== -1 ? req.url.substring(queryIndex) : '';
  req.url = '/confirm' + queryString;
  newsletterRouter(req, res, next);
};
app.get('/newsletter-confirm.php', handleNewsletterConfirm);
app.get('/api/newsletter-confirm.php', handleNewsletterConfirm);

// Public Blog endpoints
app.use('/blog.php', blogRouter);
app.use('/api/blog.php', blogRouter);

// Admin Blog endpoints
app.use('/blog-admin.php', blogAdminRouter);
app.use('/api/blog-admin.php', blogAdminRouter);

// Sync Posts webhook
app.use('/sync-posts.php', syncPostsRouter);
app.use('/api/sync-posts.php', syncPostsRouter);

// Base API route check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Production asset hosting
const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));

// Fallback all non-matching routes to frontend React app for client-side routing
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Not Found');
    }
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 DevInquire NodeJS Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
