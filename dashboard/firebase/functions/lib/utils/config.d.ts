import { EnvironmentConfig } from '../types';
import { EnvironmentConfiguration } from '../config/environments';
/**
 * Enhanced environment configuration management for Firebase Functions
 * Supports development, staging, and production environments with comprehensive validation
 */
export declare class ConfigManager {
    private static instance;
    private config;
    private environmentConfig;
    private validationResult;
    private constructor();
    static getInstance(): ConfigManager;
    static resetInstance(): void;
    private loadConfiguration;
    getConfig(): EnvironmentConfig;
    get(key: keyof EnvironmentConfig): any;
    isDevelopment(): boolean;
    isProduction(): boolean;
    getProjectId(): string;
    getRegion(): string;
    getCorsOrigins(): string[];
    getJwtSecret(): string;
    getEmailConfig(): {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
    };
    getRateLimitConfig(): {
        windowMs: number;
        maxRequests: number;
    };
    /**
     * Get the full environment configuration
     */
    getEnvironmentConfig(): EnvironmentConfiguration;
    /**
     * Get validation results
     */
    getValidationResult(): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Get database configuration
     */
    getDatabaseConfig(): import("../config/environments").DatabaseConfig;
    /**
     * Get cache configuration
     */
    getCacheConfig(): import("../config/environments").CacheConfig;
    /**
     * Get storage configuration
     */
    getStorageConfig(): import("../config/environments").StorageConfig;
    /**
     * Get logging configuration
     */
    getLoggingConfig(): import("../config/environments").LoggingConfig;
    /**
     * Get monitoring configuration
     */
    getMonitoringConfig(): import("../config/environments").MonitoringConfig;
    /**
     * Get feature flags
     */
    getFeatureFlags(): {
        enableAnalytics: boolean;
        enableRealTimeUpdates: boolean;
        enableOfflineSupport: boolean;
        enablePushNotifications: boolean;
        enableFileUploads: boolean;
        enableComments: boolean;
        enableVersioning: boolean;
    };
    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(feature: keyof typeof this.environmentConfig.features): boolean;
    /**
     * Get environment name
     */
    getEnvironmentName(): string;
    /**
     * Check if staging environment
     */
    isStaging(): boolean;
    /**
     * Validates that all required environment variables are set
     */
    validateConfig(): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Logs the current configuration (without sensitive data)
     */
    logConfig(): void;
}
export declare const config: ConfigManager;
export declare const isDevelopment: () => boolean;
export declare const isProduction: () => boolean;
export declare const isStaging: () => boolean;
export declare const getProjectId: () => string;
export declare const getRegion: () => string;
export declare const getCorsOrigins: () => string[];
export declare const getJwtSecret: () => string;
export declare const getEmailConfig: () => {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
};
export declare const getRateLimitConfig: () => {
    windowMs: number;
    maxRequests: number;
};
export declare const getEnvironmentConfig: () => EnvironmentConfiguration;
export declare const getEnvironmentName: () => string;
export declare const getDatabaseConfig: () => import("../config/environments").DatabaseConfig;
export declare const getCacheConfig: () => import("../config/environments").CacheConfig;
export declare const getStorageConfig: () => import("../config/environments").StorageConfig;
export declare const getLoggingConfig: () => import("../config/environments").LoggingConfig;
export declare const getMonitoringConfig: () => import("../config/environments").MonitoringConfig;
export declare const getFeatureFlags: () => {
    enableAnalytics: boolean;
    enableRealTimeUpdates: boolean;
    enableOfflineSupport: boolean;
    enablePushNotifications: boolean;
    enableFileUploads: boolean;
    enableComments: boolean;
    enableVersioning: boolean;
};
export declare const isFeatureEnabled: (feature: keyof ReturnType<typeof config.getFeatureFlags>) => boolean;
export declare const getValidationResult: () => {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=config.d.ts.map