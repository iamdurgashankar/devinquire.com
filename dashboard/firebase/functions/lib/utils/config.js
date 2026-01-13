"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidationResult = exports.isFeatureEnabled = exports.getFeatureFlags = exports.getMonitoringConfig = exports.getLoggingConfig = exports.getStorageConfig = exports.getCacheConfig = exports.getDatabaseConfig = exports.getEnvironmentName = exports.getEnvironmentConfig = exports.getRateLimitConfig = exports.getEmailConfig = exports.getJwtSecret = exports.getCorsOrigins = exports.getRegion = exports.getProjectId = exports.isStaging = exports.isProduction = exports.isDevelopment = exports.config = exports.ConfigManager = void 0;
const environments_1 = require("../config/environments");
/**
 * Enhanced environment configuration management for Firebase Functions
 * Supports development, staging, and production environments with comprehensive validation
 */
class ConfigManager {
    constructor() {
        this.environmentConfig = (0, environments_1.getCurrentEnvironmentConfig)();
        this.validationResult = (0, environments_1.validateEnvironmentConfig)(this.environmentConfig);
        this.config = this.loadConfiguration();
        // Log validation results
        if (!this.validationResult.isValid) {
            console.error('❌ Configuration validation failed:', this.validationResult.errors);
            if (this.environmentConfig.isProduction) {
                throw new Error('Invalid production configuration: ' + this.validationResult.errors.join(', '));
            }
        }
        else {
            console.log('✅ Configuration validation passed');
        }
    }
    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    static resetInstance() {
        ConfigManager.instance = null;
    }
    loadConfiguration() {
        // Use the enhanced environment configuration as base
        const envConfig = this.environmentConfig;
        return {
            projectId: envConfig.projectId,
            region: envConfig.region,
            isDevelopment: envConfig.isDevelopment,
            isProduction: envConfig.isProduction,
            corsOrigins: envConfig.security.corsOrigins,
            jwtSecret: envConfig.security.jwtSecret,
            emailConfig: {
                host: envConfig.email.host || 'smtp.gmail.com',
                port: envConfig.email.port || 587,
                secure: envConfig.email.secure,
                user: envConfig.email.user,
                pass: envConfig.email.pass
            },
            rateLimiting: {
                windowMs: envConfig.security.rateLimiting.windowMs,
                maxRequests: envConfig.security.rateLimiting.maxRequests
            }
        };
    }
    getConfig() {
        return this.config;
    }
    get(key) {
        return this.config[key];
    }
    isDevelopment() {
        return this.config.isDevelopment;
    }
    isProduction() {
        return this.config.isProduction;
    }
    getProjectId() {
        return this.config.projectId;
    }
    getRegion() {
        return this.config.region;
    }
    getCorsOrigins() {
        return this.config.corsOrigins;
    }
    getJwtSecret() {
        return this.config.jwtSecret;
    }
    getEmailConfig() {
        return this.config.emailConfig;
    }
    getRateLimitConfig() {
        return this.config.rateLimiting;
    }
    /**
     * Get the full environment configuration
     */
    getEnvironmentConfig() {
        return this.environmentConfig;
    }
    /**
     * Get validation results
     */
    getValidationResult() {
        return this.validationResult;
    }
    /**
     * Get database configuration
     */
    getDatabaseConfig() {
        return this.environmentConfig.database;
    }
    /**
     * Get cache configuration
     */
    getCacheConfig() {
        return this.environmentConfig.cache;
    }
    /**
     * Get storage configuration
     */
    getStorageConfig() {
        return this.environmentConfig.storage;
    }
    /**
     * Get logging configuration
     */
    getLoggingConfig() {
        return this.environmentConfig.logging;
    }
    /**
     * Get monitoring configuration
     */
    getMonitoringConfig() {
        return this.environmentConfig.monitoring;
    }
    /**
     * Get feature flags
     */
    getFeatureFlags() {
        return this.environmentConfig.features;
    }
    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.environmentConfig.features[feature];
    }
    /**
     * Get environment name
     */
    getEnvironmentName() {
        return this.environmentConfig.name;
    }
    /**
     * Check if staging environment
     */
    isStaging() {
        return this.environmentConfig.isStaging;
    }
    /**
     * Validates that all required environment variables are set
     */
    validateConfig() {
        return this.validationResult;
    }
    /**
     * Logs the current configuration (without sensitive data)
     */
    logConfig() {
        const safeConfig = {
            projectId: this.config.projectId,
            region: this.config.region,
            isDevelopment: this.config.isDevelopment,
            isProduction: this.config.isProduction,
            corsOrigins: this.config.corsOrigins,
            emailConfig: {
                host: this.config.emailConfig.host,
                port: this.config.emailConfig.port,
                secure: this.config.emailConfig.secure,
                user: this.config.emailConfig.user ? '***configured***' : 'not set'
            },
            rateLimiting: this.config.rateLimiting
        };
        console.log('🔧 Firebase Functions Configuration:', JSON.stringify(safeConfig, null, 2));
    }
}
exports.ConfigManager = ConfigManager;
// Export singleton instance
exports.config = ConfigManager.getInstance();
// Export individual getters for convenience
const isDevelopment = () => exports.config.isDevelopment();
exports.isDevelopment = isDevelopment;
const isProduction = () => exports.config.isProduction();
exports.isProduction = isProduction;
const isStaging = () => exports.config.isStaging();
exports.isStaging = isStaging;
const getProjectId = () => exports.config.getProjectId();
exports.getProjectId = getProjectId;
const getRegion = () => exports.config.getRegion();
exports.getRegion = getRegion;
const getCorsOrigins = () => exports.config.getCorsOrigins();
exports.getCorsOrigins = getCorsOrigins;
const getJwtSecret = () => exports.config.getJwtSecret();
exports.getJwtSecret = getJwtSecret;
const getEmailConfig = () => exports.config.getEmailConfig();
exports.getEmailConfig = getEmailConfig;
const getRateLimitConfig = () => exports.config.getRateLimitConfig();
exports.getRateLimitConfig = getRateLimitConfig;
// Export enhanced configuration getters
const getEnvironmentConfig = () => exports.config.getEnvironmentConfig();
exports.getEnvironmentConfig = getEnvironmentConfig;
const getEnvironmentName = () => exports.config.getEnvironmentName();
exports.getEnvironmentName = getEnvironmentName;
const getDatabaseConfig = () => exports.config.getDatabaseConfig();
exports.getDatabaseConfig = getDatabaseConfig;
const getCacheConfig = () => exports.config.getCacheConfig();
exports.getCacheConfig = getCacheConfig;
const getStorageConfig = () => exports.config.getStorageConfig();
exports.getStorageConfig = getStorageConfig;
const getLoggingConfig = () => exports.config.getLoggingConfig();
exports.getLoggingConfig = getLoggingConfig;
const getMonitoringConfig = () => exports.config.getMonitoringConfig();
exports.getMonitoringConfig = getMonitoringConfig;
const getFeatureFlags = () => exports.config.getFeatureFlags();
exports.getFeatureFlags = getFeatureFlags;
const isFeatureEnabled = (feature) => exports.config.isFeatureEnabled(feature);
exports.isFeatureEnabled = isFeatureEnabled;
const getValidationResult = () => exports.config.getValidationResult();
exports.getValidationResult = getValidationResult;
//# sourceMappingURL=config.js.map