/**
 * Comprehensive Error Handling Service
 * Provides centralized error handling, logging, and offline capability management
 */

import realTimeService from "./realTimeService";
import persistentDataService from "./persistentDataService";

class ErrorHandlingService {
  constructor() {
    this.errorLog = [];
    this.errorListeners = new Set();
    this.isOnline = navigator.onLine;
    this.retryQueue = new Map();
    this.globalErrorHandler = null;

    this.initialize();
  }

  /**
   * Initialize error handling service
   */
  initialize() {
    this.setupGlobalErrorHandlers();
    this.setupNetworkHandlers();
    this.loadStoredErrors();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.handleError({
        type: "unhandled_rejection",
        error: event.reason,
        timestamp: Date.now(),
        context: "global",
      });
    });

    // Handle JavaScript errors
    window.addEventListener("error", (event) => {
      this.handleError({
        type: "javascript_error",
        error: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        },
        timestamp: Date.now(),
        context: "global",
      });
    });

    // Handle React error boundary errors
    this.setupReactErrorBoundary();
  }

  /**
   * Setup React error boundary integration
   */
  setupReactErrorBoundary() {
    // This would be used by React Error Boundaries
    this.globalErrorHandler = (error, errorInfo) => {
      this.handleError({
        type: "react_error",
        error: {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        },
        timestamp: Date.now(),
        context: "react",
      });
    };
  }

  /**
   * Setup network status handlers
   */
  setupNetworkHandlers() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners({
        type: "network_status",
        status: "online",
        message: "Connection restored",
      });
      this.processRetryQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners({
        type: "network_status",
        status: "offline",
        message: "Connection lost - working offline",
      });
    });
  }

  /**
   * Load stored errors from localStorage
   */
  loadStoredErrors() {
    try {
      const stored = localStorage.getItem("error_log");
      if (stored) {
        this.errorLog = JSON.parse(stored);
        // Keep only recent errors (last 24 hours)
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.errorLog = this.errorLog.filter(
          (error) => error.timestamp > dayAgo
        );
      }
    } catch (error) {
      console.error("Failed to load stored errors:", error);
    }
  }

  /**
   * Save errors to localStorage
   */
  saveErrors() {
    try {
      localStorage.setItem("error_log", JSON.stringify(this.errorLog));
    } catch (error) {
      console.error("Failed to save errors:", error);
    }
  }

  /**
   * Main error handling method
   */
  handleError(errorData) {
    const processedError = this.processError(errorData);
    this.logError(processedError);
    this.notifyListeners(processedError);

    // Handle specific error types
    this.handleSpecificError(processedError);

    return processedError;
  }

  /**
   * Process and enrich error data
   */
  processError(errorData) {
    const processed = {
      id: this.generateErrorId(),
      timestamp: errorData.timestamp || Date.now(),
      type: errorData.type || "unknown",
      severity: this.determineSeverity(errorData),
      context: errorData.context || "unknown",
      message: this.extractMessage(errorData.error),
      stack: this.extractStack(errorData.error),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      isOnline: this.isOnline,
      retryable: this.isRetryable(errorData),
      ...errorData,
    };

    return processed;
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine error severity
   */
  determineSeverity(errorData) {
    if (errorData.type === "network_error" && !this.isOnline) {
      return "warning"; // Expected when offline
    }

    if (errorData.type === "validation_error") {
      return "info";
    }

    if (errorData.type === "authentication_error") {
      return "warning";
    }

    if (errorData.type === "authorization_error") {
      return "warning";
    }

    if (errorData.type === "api_error") {
      return "error";
    }

    if (
      errorData.type === "javascript_error" ||
      errorData.type === "react_error"
    ) {
      return "critical";
    }

    return "error";
  }

  /**
   * Extract error message
   */
  extractMessage(error) {
    if (typeof error === "string") {
      return error;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    return "Unknown error occurred";
  }

  /**
   * Extract error stack trace
   */
  extractStack(error) {
    if (error?.stack) {
      return error.stack;
    }

    if (error?.error?.stack) {
      return error.error.stack;
    }

    return null;
  }

  /**
   * Get current user ID for context
   */
  getCurrentUserId() {
    try {
      const userData = localStorage.getItem("userData");
      if (userData) {
        return JSON.parse(userData).id;
      }
    } catch (error) {
      // Ignore
    }
    return null;
  }

  /**
   * Determine if error is retryable
   */
  isRetryable(errorData) {
    const retryableTypes = [
      "network_error",
      "timeout_error",
      "server_error",
      "api_error",
    ];

    return retryableTypes.includes(errorData.type);
  }

  /**
   * Log error to memory and localStorage
   */
  logError(processedError) {
    this.errorLog.unshift(processedError);

    // Keep only last 100 errors in memory
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(0, 100);
    }

    this.saveErrors();

    // Console log based on severity
    const logMethod = this.getLogMethod(processedError.severity);
    logMethod(
      `[${processedError.type}]`,
      processedError.message,
      processedError
    );
  }

  /**
   * Get appropriate console log method
   */
  getLogMethod(severity) {
    switch (severity) {
      case "info":
        return console.info;
      case "warning":
        return console.warn;
      case "error":
        return console.error;
      case "critical":
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Handle specific error types
   */
  handleSpecificError(errorData) {
    switch (errorData.type) {
      case "network_error":
        this.handleNetworkError(errorData);
        break;
      case "authentication_error":
        this.handleAuthError(errorData);
        break;
      case "api_error":
        this.handleApiError(errorData);
        break;
      case "validation_error":
        this.handleValidationError(errorData);
        break;
      case "offline_operation":
        this.handleOfflineOperation(errorData);
        break;
    }
  }

  /**
   * Handle network errors
   */
  handleNetworkError(errorData) {
    if (errorData.retryable && errorData.context?.operation) {
      this.addToRetryQueue(errorData);
    }
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(errorData) {
    // Notify auth system
    this.notifyListeners({
      type: "auth_error",
      message: "Authentication required",
      action: "redirect_to_login",
    });
  }

  /**
   * Handle API errors
   */
  handleApiError(errorData) {
    if (errorData.retryable) {
      this.addToRetryQueue(errorData);
    }
  }

  /**
   * Handle validation errors
   */
  handleValidationError(errorData) {
    // These are typically user errors, just notify
    this.notifyListeners({
      type: "validation_error",
      message: errorData.message,
      field: errorData.field,
    });
  }

  /**
   * Handle offline operations
   */
  handleOfflineOperation(errorData) {
    // Store operation for when online
    this.addToRetryQueue(errorData);

    this.notifyListeners({
      type: "offline_operation",
      message: "Operation saved for when connection is restored",
    });
  }

  /**
   * Add error to retry queue
   */
  addToRetryQueue(errorData) {
    if (!errorData.context?.operation) {
      return;
    }

    const retryId = this.generateErrorId();
    this.retryQueue.set(retryId, {
      ...errorData,
      retryId,
      retryCount: 0,
      maxRetries: 3,
      nextRetry: Date.now() + 1000 * Math.pow(2, 0), // Exponential backoff
    });
  }

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    if (!this.isOnline) {
      return;
    }

    const now = Date.now();
    const retryableItems = Array.from(this.retryQueue.values()).filter(
      (item) => item.nextRetry <= now
    );

    for (const item of retryableItems) {
      try {
        await this.retryOperation(item);
        this.retryQueue.delete(item.retryId);
      } catch (error) {
        item.retryCount++;

        if (item.retryCount >= item.maxRetries) {
          this.retryQueue.delete(item.retryId);
          this.handleError({
            type: "retry_failed",
            error: error,
            originalError: item,
            context: "retry_queue",
          });
        } else {
          // Schedule next retry with exponential backoff
          item.nextRetry = now + 1000 * Math.pow(2, item.retryCount);
          this.retryQueue.set(item.retryId, item);
        }
      }
    }
  }

  /**
   * Retry failed operation
   */
  async retryOperation(item) {
    const { operation } = item.context;

    switch (operation.type) {
      case "api_call":
        return await this.retryApiCall(operation);
      case "blog_create":
        return await persistentDataService.createPost(operation.data);
      case "blog_update":
        return await persistentDataService.updatePost(
          operation.id,
          operation.data
        );
      case "blog_delete":
        return await persistentDataService.deletePost(operation.id);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Retry API call
   */
  async retryApiCall(operation) {
    const response = await fetch(operation.url, operation.options);

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Add error listener
   */
  addErrorListener(callback) {
    this.errorListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  /**
   * Notify error listeners
   */
  notifyListeners(errorData) {
    this.errorListeners.forEach((callback) => {
      try {
        callback(errorData);
      } catch (error) {
        console.error("Error in error listener:", error);
      }
    });
  }

  /**
   * Create error wrapper for async functions
   */
  wrapAsync(asyncFn, context = {}) {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        this.handleError({
          type: "async_error",
          error,
          context: {
            ...context,
            function: asyncFn.name,
            arguments: args,
          },
        });
        throw error;
      }
    };
  }

  /**
   * Create error wrapper for sync functions
   */
  wrapSync(syncFn, context = {}) {
    return (...args) => {
      try {
        return syncFn(...args);
      } catch (error) {
        this.handleError({
          type: "sync_error",
          error,
          context: {
            ...context,
            function: syncFn.name,
            arguments: args,
          },
        });
        throw error;
      }
    };
  }

  /**
   * Handle offline operation attempt
   */
  handleOfflineOperationAttempt(operation) {
    this.handleError({
      type: "offline_operation",
      message: "Operation attempted while offline",
      context: { operation },
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const recentErrors = this.errorLog.filter((err) => err.timestamp > hourAgo);
    const dailyErrors = this.errorLog.filter((err) => err.timestamp > dayAgo);

    const errorsByType = {};
    dailyErrors.forEach((err) => {
      errorsByType[err.type] = (errorsByType[err.type] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      recentHour: recentErrors.length,
      last24Hours: dailyErrors.length,
      byType: errorsByType,
      pendingRetries: this.retryQueue.size,
      isOnline: this.isOnline,
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
    this.saveErrors();
  }

  /**
   * Export error log
   */
  exportErrorLog() {
    return {
      errors: this.errorLog,
      stats: this.getErrorStats(),
      timestamp: Date.now(),
    };
  }

  /**
   * Get React error boundary handler
   */
  getReactErrorHandler() {
    return this.globalErrorHandler;
  }

  /**
   * Test error handling
   */
  testError(type = "test_error") {
    this.handleError({
      type,
      error: new Error("Test error for debugging"),
      context: { test: true },
    });
  }
}

// Create singleton instance
const errorHandlingService = new ErrorHandlingService();

export default errorHandlingService;
