/**
 * Environment-specific configuration management
 * Supports development, staging, and production environments
 */

export interface DatabaseConfig {
  host?: string;
  port?: number;
  name: string;
  ssl: boolean;
  connectionLimit: number;
}

export interface CacheConfig {
  provider: 'redis' | 'memory';
  host?: string;
  port?: number;
  ttl: number;
  maxSize: number;
}

export interface StorageConfig {
  provider: 'firebase' | 'gcs' | 's3';
  bucket: string;
  region: string;
  maxFileSize: number;
  allowedTypes: string[];
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  corsOrigins: string[];
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
}

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses';
  host?: string;
  port?: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  templates: {
    welcome: string;
    passwordReset: string;
    emailVerification: string;
  };
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'simple';
  destinations: ('console' | 'file' | 'cloud')[];
  maxFileSize: string;
  maxFiles: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  errorReporting: boolean;
  performanceMonitoring: boolean;
  customMetrics: boolean;
  alerting: {
    email: string[];
    slack?: string;
    errorThreshold: number;
  };
}

export interface EnvironmentConfiguration {
  name: string;
  projectId: string;
  region: string;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  database: DatabaseConfig;
  cache: CacheConfig;
  storage: StorageConfig;
  security: SecurityConfig;
  email: EmailConfig;
  logging: LoggingConfig;
  monitoring: MonitoringConfig;
  features: {
    enableAnalytics: boolean;
    enableRealTimeUpdates: boolean;
    enableOfflineSupport: boolean;
    enablePushNotifications: boolean;
    enableFileUploads: boolean;
    enableComments: boolean;
    enableVersioning: boolean;
  };
}

// Development environment configuration
export const developmentConfig: EnvironmentConfiguration = {
  name: 'development',
  projectId: process.env.FIREBASE_PROJECT_ID || 'devinquirecom-dev',
  region: 'us-central1',
  isDevelopment: true,
  isStaging: false,
  isProduction: false,
  database: {
    name: 'firestore-dev',
    ssl: false,
    connectionLimit: 10
  },
  cache: {
    provider: 'memory',
    ttl: 300, // 5 minutes
    maxSize: 100
  },
  storage: {
    provider: 'firebase',
    bucket: process.env.FIREBASE_STORAGE_BUCKET || 'devinquirecom-dev.appspot.com',
    region: 'us-central1',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production',
    jwtExpiresIn: '24h',
    bcryptRounds: 10,
    corsOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
      'http://127.0.0.1:3004'
    ],
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000, // Liberal for development
      skipSuccessfulRequests: true
    }
  },
  email: {
    provider: 'smtp',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@devinquire.com',
    templates: {
      welcome: 'welcome-template',
      passwordReset: 'password-reset-template',
      emailVerification: 'email-verification-template'
    }
  },
  logging: {
    level: 'debug',
    format: 'simple',
    destinations: ['console'],
    maxFileSize: '10m',
    maxFiles: 5
  },
  monitoring: {
    enabled: true,
    errorReporting: true,
    performanceMonitoring: true,
    customMetrics: false,
    alerting: {
      email: ['dev@devinquire.com'],
      errorThreshold: 10
    }
  },
  features: {
    enableAnalytics: false,
    enableRealTimeUpdates: true,
    enableOfflineSupport: true,
    enablePushNotifications: false,
    enableFileUploads: true,
    enableComments: true,
    enableVersioning: true
  }
};

// Staging environment configuration
export const stagingConfig: EnvironmentConfiguration = {
  name: 'staging',
  projectId: process.env.FIREBASE_PROJECT_ID || 'devinquirecom-staging',
  region: 'us-central1',
  isDevelopment: false,
  isStaging: true,
  isProduction: false,
  database: {
    name: 'firestore-staging',
    ssl: true,
    connectionLimit: 20
  },
  cache: {
    provider: 'redis',
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    ttl: 600, // 10 minutes
    maxSize: 500
  },
  storage: {
    provider: 'firebase',
    bucket: process.env.FIREBASE_STORAGE_BUCKET || 'devinquirecom-staging.appspot.com',
    region: 'us-central1',
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4']
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: '12h',
    bcryptRounds: 12,
    corsOrigins: [
      'https://staging.devinquire.com',
      'https://dashboard-staging.devinquire.com'
    ],
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 500,
      skipSuccessfulRequests: false
    }
  },
  email: {
    provider: 'smtp',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@staging.devinquire.com',
    templates: {
      welcome: 'welcome-template',
      passwordReset: 'password-reset-template',
      emailVerification: 'email-verification-template'
    }
  },
  logging: {
    level: 'info',
    format: 'json',
    destinations: ['console', 'cloud'],
    maxFileSize: '50m',
    maxFiles: 10
  },
  monitoring: {
    enabled: true,
    errorReporting: true,
    performanceMonitoring: true,
    customMetrics: true,
    alerting: {
      email: ['staging@devinquire.com'],
      errorThreshold: 5
    }
  },
  features: {
    enableAnalytics: true,
    enableRealTimeUpdates: true,
    enableOfflineSupport: true,
    enablePushNotifications: true,
    enableFileUploads: true,
    enableComments: true,
    enableVersioning: true
  }
};

// Production environment configuration
export const productionConfig: EnvironmentConfiguration = {
  name: 'production',
  projectId: process.env.FIREBASE_PROJECT_ID || 'devinquirecom',
  region: 'us-central1',
  isDevelopment: false,
  isStaging: false,
  isProduction: true,
  database: {
    name: 'firestore-prod',
    ssl: true,
    connectionLimit: 50
  },
  cache: {
    provider: 'redis',
    host: process.env.REDIS_HOST || '',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    ttl: 3600, // 1 hour
    maxSize: 1000
  },
  storage: {
    provider: 'firebase',
    bucket: process.env.FIREBASE_STORAGE_BUCKET || 'devinquirecom.appspot.com',
    region: 'us-central1',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm']
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: '8h',
    bcryptRounds: 14,
    corsOrigins: [
      'https://devinquire.com',
      'https://www.devinquire.com',
      'https://dashboard.devinquire.com'
    ],
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: false
    }
  },
  email: {
    provider: 'smtp',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@devinquire.com',
    templates: {
      welcome: 'welcome-template',
      passwordReset: 'password-reset-template',
      emailVerification: 'email-verification-template'
    }
  },
  logging: {
    level: 'warn',
    format: 'json',
    destinations: ['cloud'],
    maxFileSize: '100m',
    maxFiles: 20
  },
  monitoring: {
    enabled: true,
    errorReporting: true,
    performanceMonitoring: true,
    customMetrics: true,
    alerting: {
      email: ['alerts@devinquire.com', 'admin@devinquire.com'],
      slack: process.env.SLACK_WEBHOOK_URL,
      errorThreshold: 3
    }
  },
  features: {
    enableAnalytics: true,
    enableRealTimeUpdates: true,
    enableOfflineSupport: true,
    enablePushNotifications: true,
    enableFileUploads: true,
    enableComments: true,
    enableVersioning: true
  }
};

// Environment configuration map
export const environmentConfigs = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig
};

// Get current environment configuration
export function getCurrentEnvironmentConfig(): EnvironmentConfiguration {
  const env = process.env.NODE_ENV || 'development';
  const config = environmentConfigs[env as keyof typeof environmentConfigs];
  
  if (!config) {
    console.warn(`Unknown environment: ${env}, falling back to development`);
    return developmentConfig;
  }
  
  return config;
}

// Validate environment configuration
export function validateEnvironmentConfig(config: EnvironmentConfiguration): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields validation
  if (!config.projectId) {
    errors.push('Project ID is required');
  }
  
  if (!config.region) {
    errors.push('Region is required');
  }
  
  // Production-specific validations
  if (config.isProduction) {
    if (!config.security.jwtSecret || config.security.jwtSecret.includes('dev-')) {
      errors.push('Production JWT secret is required and must not contain dev defaults');
    }
    
    if (!config.email.user || !config.email.pass) {
      errors.push('Email configuration is required in production');
    }
    
    if (config.logging.level === 'debug') {
      errors.push('Debug logging should not be enabled in production');
    }
    
    if (config.cache.provider === 'memory') {
      errors.push('Memory cache is not recommended for production');
    }
  }
  
  // Security validations
  if (config.security.bcryptRounds < 10) {
    errors.push('BCrypt rounds should be at least 10');
  }
  
  if (config.security.corsOrigins.length === 0) {
    errors.push('CORS origins must be configured');
  }
  
  // Storage validations
  if (config.storage.maxFileSize > 100 * 1024 * 1024) { // 100MB
    errors.push('Maximum file size should not exceed 100MB');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}