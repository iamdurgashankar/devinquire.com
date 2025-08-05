
// Environment detection
const IS_DASHBOARD_SUBDOMAIN = window.location.hostname === 'dashboard.devinquire.com';
const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// API configuration
const API_BASE = IS_LOCALHOST
  ? 'http://localhost:8000'
  : 'https://devinquire.com/api';

// App type detection
const APP_TYPE = IS_DASHBOARD_SUBDOMAIN ? 'dashboard' : 'main';

export { API_BASE, IS_DASHBOARD_SUBDOMAIN, APP_TYPE, IS_LOCALHOST };
