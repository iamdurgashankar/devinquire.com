
// Environment detection
const IS_DASHBOARD_SUBDOMAIN = window.location.hostname === 'dashboard.devinquire.com';
const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// API configuration
const API_BASE = IS_LOCALHOST ? 'http://localhost:8000' : 'https://devinquire.com/api';

// Firebase configuration
const USE_FIREBASE = process.env.REACT_APP_USE_FIREBASE === 'true' || IS_LOCALHOST;
const FIREBASE_EMULATOR_HOST = process.env.REACT_APP_FIREBASE_EMULATOR_HOST || 'localhost';
const FIREBASE_AUTH_EMULATOR_PORT = process.env.REACT_APP_FIREBASE_AUTH_EMULATOR_PORT || '9099';
const FIREBASE_FIRESTORE_EMULATOR_PORT = process.env.REACT_APP_FIREBASE_FIRESTORE_EMULATOR_PORT || '8080';
const FIREBASE_FUNCTIONS_EMULATOR_PORT = process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_PORT || '5001';
const FIREBASE_STORAGE_EMULATOR_PORT = process.env.REACT_APP_FIREBASE_STORAGE_EMULATOR_PORT || '9199';

// App type detection
const APP_TYPE = IS_DASHBOARD_SUBDOMAIN ? 'dashboard' : 'main';

export { 
  API_BASE, 
  IS_DASHBOARD_SUBDOMAIN, 
  APP_TYPE, 
  IS_LOCALHOST,
  USE_FIREBASE,
  FIREBASE_EMULATOR_HOST,
  FIREBASE_AUTH_EMULATOR_PORT,
  FIREBASE_FIRESTORE_EMULATOR_PORT,
  FIREBASE_FUNCTIONS_EMULATOR_PORT,
  FIREBASE_STORAGE_EMULATOR_PORT
};
