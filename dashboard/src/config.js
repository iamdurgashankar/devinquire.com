// Dashboard configuration
const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// API configuration - points to main domain API
const API_BASE = IS_LOCALHOST
  ? 'http://localhost:8001'
  : 'https://devinquire.com/api';

// Dashboard-specific settings
const APP_TYPE = 'dashboard';
const APP_NAME = 'DevInquire Dashboard';

export { API_BASE, APP_TYPE, APP_NAME, IS_LOCALHOST };