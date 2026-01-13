// Dashboard configuration - Firebase-only backend
const IS_LOCALHOST =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Firebase-only configuration - no PHP backend needed
const USE_FIREBASE_ONLY = true;

// Dashboard-specific settings
const APP_TYPE = "dashboard";
const APP_NAME = "DevInquire Dashboard";

// Production URLs - configured for devinquire.com
const MAIN_WEBSITE_URL = IS_LOCALHOST 
  ? "http://localhost:3000" 
  : "https://devinquire.com";

const DASHBOARD_URL = IS_LOCALHOST
  ? "http://localhost:3000"
  : "https://dashboard.devinquire.com";

// API endpoints
const API_BASE = IS_LOCALHOST 
  ? "http://localhost:8000/api" 
  : "https://devinquire.com/api";

// Blog API configuration for main website integration
const BLOG_API_CONFIG = {
  baseUrl: API_BASE,
  apiKey: "2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271",
  mainWebsiteUrl: MAIN_WEBSITE_URL,
};

export { 
  USE_FIREBASE_ONLY, 
  APP_TYPE, 
  APP_NAME, 
  IS_LOCALHOST,
  MAIN_WEBSITE_URL,
  DASHBOARD_URL,
  API_BASE,
  BLOG_API_CONFIG,
};
