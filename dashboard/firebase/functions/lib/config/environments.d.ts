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
export declare const developmentConfig: EnvironmentConfiguration;
export declare const stagingConfig: EnvironmentConfiguration;
export declare const productionConfig: EnvironmentConfiguration;
export declare const environmentConfigs: {
    development: EnvironmentConfiguration;
    staging: EnvironmentConfiguration;
    production: EnvironmentConfiguration;
};
export declare function getCurrentEnvironmentConfig(): EnvironmentConfiguration;
export declare function validateEnvironmentConfig(config: EnvironmentConfiguration): {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=environments.d.ts.map