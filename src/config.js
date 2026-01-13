// Main Website Configuration - devinquire.com
// Pre-configured for production deployment

// Environment detection
const IS_DASHBOARD_SUBDOMAIN = window.location.hostname === 'dashboard.devinquire.com';
const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// API configuration - pre-configured for devinquire.com
const API_BASE = IS_LOCALHOST ? 'http://localhost:8000/api' : 'https://devinquire.com/api';

// Blog API configuration for Dashboard integration
// The sync script keeps MySQL in sync with Firebase
const BLOG_API_CONFIG = {
  baseUrl: API_BASE, // Uses local PHP API: /api/blog.php
  apiKey: '2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271',
  // Dashboard URL for cross-domain sync
  dashboardUrl: IS_LOCALHOST 
    ? 'http://localhost:3000' 
    : 'https://dashboard.devinquire.com',
};

// Firebase configuration (for future use if needed)
const FIREBASE_CONFIG = {
  projectId: 'devinquirecom',
  // Note: Firebase is used by Dashboard, main site uses MySQL via sync script
};

// App type detection
const APP_TYPE = IS_DASHBOARD_SUBDOMAIN ? 'dashboard' : 'main';

// Website URLs
const WEBSITE_URL = IS_LOCALHOST 
  ? 'http://localhost:3000' 
  : 'https://devinquire.com';

const DASHBOARD_URL = IS_LOCALHOST
  ? 'http://localhost:3000'
  : 'https://dashboard.devinquire.com';

export { 
  API_BASE, 
  BLOG_API_CONFIG,
  FIREBASE_CONFIG,
  IS_DASHBOARD_SUBDOMAIN, 
  APP_TYPE, 
  IS_LOCALHOST,
  WEBSITE_URL,
  DASHBOARD_URL,
};

