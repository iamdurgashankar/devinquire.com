
// Environment detection
const IS_DASHBOARD_SUBDOMAIN = window.location.hostname === 'dashboard.devinquire.com';
const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// API configuration
const API_BASE = IS_LOCALHOST ? 'http://localhost:8000' : 'https://devinquire.com/api';

// Blog API configuration for external dashboard
const BLOG_API_CONFIG = {
  baseUrl: 'https://dashboard.devinquire.com/blogmanager',
  apiKey: '2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271'
};

// Firebase configuration removed - using PHP backend instead

// App type detection
const APP_TYPE = IS_DASHBOARD_SUBDOMAIN ? 'dashboard' : 'main';

export { 
  API_BASE, 
  BLOG_API_CONFIG,
  IS_DASHBOARD_SUBDOMAIN, 
  APP_TYPE, 
  IS_LOCALHOST,
  // Firebase exports removed
};
