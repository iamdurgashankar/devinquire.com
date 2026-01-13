import { EnvironmentConfig } from '../types';
import { 
  EnvironmentConfiguration, 
  getCurrentEnvironmentConfig, 
  validateEnvironmentConfig
} from '../config/environments';

/**
 * Enhanced environment configuration management for Firebase Functions
 * Supports development, staging, and production environments with comprehensive validation
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: EnvironmentConfig;
  private environmentConfig: EnvironmentConfiguration;
  private validationResult: { isValid: boolean; errors: string[] };

  private constructor() {
    this.environmentConfig = getCurrentEnvironmentConfig();
    this.validationResult = validateEnvironmentConfig(this.environmentConfig);
    this.config = this.loadConfiguration();
    
    // Log validation results
    if (!this.validationResult.isValid) {
      console.error('❌ Configuration validation failed:', this.validationResult.errors);
      if (this.environmentConfig.isProduction) {
        throw new Error('Invalid production configuration: ' + this.validationResult.errors.join(', '));
      }
    } else {
      console.log('✅ Configuration validation passed');
    }
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public static resetInstance(): void {
    ConfigManager.instance = null as any;
  }

  private loadConfiguration(): EnvironmentConfig {
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



  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public get(key: keyof EnvironmentConfig): any {
    return this.config[key];
  }

  public isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  public isProduction(): boolean {
    return this.config.isProduction;
  }

  public getProjectId(): string {
    return this.config.projectId;
  }

  public getRegion(): string {
    return this.config.region;
  }

  public getCorsOrigins(): string[] {
    return this.config.corsOrigins;
  }

  public getJwtSecret(): string {
    return this.config.jwtSecret;
  }

  public getEmailConfig() {
    return this.config.emailConfig;
  }

  public getRateLimitConfig() {
    return this.config.rateLimiting;
  }

  /**
   * Get the full environment configuration
   */
  public getEnvironmentConfig(): EnvironmentConfiguration {
    return this.environmentConfig;
  }

  /**
   * Get validation results
   */
  public getValidationResult(): { isValid: boolean; errors: string[] } {
    return this.validationResult;
  }

  /**
   * Get database configuration
   */
  public getDatabaseConfig() {
    return this.environmentConfig.database;
  }

  /**
   * Get cache configuration
   */
  public getCacheConfig() {
    return this.environmentConfig.cache;
  }

  /**
   * Get storage configuration
   */
  public getStorageConfig() {
    return this.environmentConfig.storage;
  }

  /**
   * Get logging configuration
   */
  public getLoggingConfig() {
    return this.environmentConfig.logging;
  }

  /**
   * Get monitoring configuration
   */
  public getMonitoringConfig() {
    return this.environmentConfig.monitoring;
  }

  /**
   * Get feature flags
   */
  public getFeatureFlags() {
    return this.environmentConfig.features;
  }

  /**
   * Check if a feature is enabled
   */
  public isFeatureEnabled(feature: keyof typeof this.environmentConfig.features): boolean {
    return this.environmentConfig.features[feature];
  }

  /**
   * Get environment name
   */
  public getEnvironmentName(): string {
    return this.environmentConfig.name;
  }

  /**
   * Check if staging environment
   */
  public isStaging(): boolean {
    return this.environmentConfig.isStaging;
  }

  /**
   * Validates that all required environment variables are set
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    return this.validationResult;
  }

  /**
   * Logs the current configuration (without sensitive data)
   */
  public logConfig(): void {
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

// Export singleton instance
export const config = ConfigManager.getInstance();

// Export individual getters for convenience
export const isDevelopment = () => config.isDevelopment();
export const isProduction = () => config.isProduction();
export const isStaging = () => config.isStaging();
export const getProjectId = () => config.getProjectId();
export const getRegion = () => config.getRegion();
export const getCorsOrigins = () => config.getCorsOrigins();
export const getJwtSecret = () => config.getJwtSecret();
export const getEmailConfig = () => config.getEmailConfig();
export const getRateLimitConfig = () => config.getRateLimitConfig();

// Export enhanced configuration getters
export const getEnvironmentConfig = () => config.getEnvironmentConfig();
export const getEnvironmentName = () => config.getEnvironmentName();
export const getDatabaseConfig = () => config.getDatabaseConfig();
export const getCacheConfig = () => config.getCacheConfig();
export const getStorageConfig = () => config.getStorageConfig();
export const getLoggingConfig = () => config.getLoggingConfig();
export const getMonitoringConfig = () => config.getMonitoringConfig();
export const getFeatureFlags = () => config.getFeatureFlags();
export const isFeatureEnabled = (feature: keyof ReturnType<typeof config.getFeatureFlags>) => config.isFeatureEnabled(feature);
export const getValidationResult = () => config.getValidationResult();