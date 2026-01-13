/**
 * Firebase Performance Monitoring and Analytics Service
 * Comprehensive performance tracking, error monitoring, and user analytics
 */

import {
  getPerformance,
  trace,
  connectPerformanceEmulator,
} from "firebase/performance";
import { logEvent, setUserProperties, setUserId } from "firebase/analytics";
import { analytics, app, isFirebaseConfigured } from "../config/firebase";

class FirebasePerformanceService {
  constructor() {
    this.performance = null;
    this.analytics = analytics;
    this.isInitialized = false;
    this.traces = new Map();
    this.customMetrics = new Map();
    this.enabledFeatures = {
      performance: true,
      analytics: true,
      userTracking: true,
      errorTracking: true,
      customEvents: true,
    };

    // Initialize service if Firebase is configured
    if (isFirebaseConfigured() && app) {
      this.initialize();
    }
  }

  /**
   * Initialize Performance Monitoring
   */
  async initialize() {
    try {
      // Initialize Performance Monitoring
      if (this.enabledFeatures.performance) {
        this.performance = getPerformance(app);

        // Connect to emulator in development
        if (
          process.env.NODE_ENV === "development" &&
          process.env.REACT_APP_USE_FIREBASE_EMULATOR === "true"
        ) {
          const host =
            process.env.REACT_APP_FIREBASE_EMULATOR_HOST || "localhost";
          const port =
            process.env.REACT_APP_FIREBASE_PERFORMANCE_EMULATOR_PORT || "9001";
          connectPerformanceEmulator(this.performance, host, parseInt(port));
        }
      }

      this.isInitialized = true;
      console.log("Firebase Performance Service initialized");

      // Set up automatic tracking
      this.setupAutomaticTracking();
    } catch (error) {
      console.warn(
        "Failed to initialize Firebase Performance Service:",
        error.message
      );
    }
  }

  /**
   * Set up automatic performance tracking
   */
  setupAutomaticTracking() {
    if (typeof window === "undefined") return;

    // Track page load performance
    this.trackPageLoad();

    // Track navigation performance
    this.trackNavigation();

    // Track resource loading
    this.trackResourceLoading();

    // Track user interactions
    this.trackUserInteractions();

    // Track errors
    this.trackErrors();
  }

  /**
   * Track page load performance
   */
  trackPageLoad() {
    if (!this.performance) return;

    const pageLoadTrace = trace(this.performance, "page_load");
    pageLoadTrace.start();

    // Track when page is fully loaded
    window.addEventListener("load", () => {
      pageLoadTrace.stop();

      // Add custom metrics
      const navigation = performance.getEntriesByType("navigation")[0];
      if (navigation) {
        pageLoadTrace.putMetric(
          "dom_content_loaded",
          navigation.domContentLoadedEventEnd - navigation.navigationStart
        );
        pageLoadTrace.putMetric(
          "first_paint",
          navigation.loadEventEnd - navigation.navigationStart
        );

        // Log to analytics
        this.logAnalyticsEvent("page_load_performance", {
          load_time: navigation.loadEventEnd - navigation.navigationStart,
          page_url: window.location.pathname,
        });
      }
    });
  }

  /**
   * Track navigation performance between routes
   */
  trackNavigation() {
    if (!this.performance) return;

    let currentTrace = null;

    // Listen for route changes (React Router)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const trackRouteChange = (url) => {
      // Stop previous trace
      if (currentTrace) {
        currentTrace.stop();
      }

      // Start new trace
      const routeName = url.split("?")[0].replace(/\//g, "_") || "home";
      currentTrace = trace(this.performance, `route_${routeName}`);
      currentTrace.start();

      // Log navigation event
      this.logAnalyticsEvent("page_view", {
        page_path: url,
        page_title: document.title,
      });
    };

    history.pushState = function (state, title, url) {
      originalPushState.apply(history, arguments);
      trackRouteChange(url);
    };

    history.replaceState = function (state, title, url) {
      originalReplaceState.apply(history, arguments);
      trackRouteChange(url);
    };

    // Also listen for popstate (back/forward buttons)
    window.addEventListener("popstate", () => {
      trackRouteChange(window.location.pathname);
    });
  }

  /**
   * Track resource loading performance
   */
  trackResourceLoading() {
    if (!this.performance) return;

    // Track image loading
    const images = document.querySelectorAll("img");
    images.forEach((img, index) => {
      const imageTrace = trace(this.performance, `image_load_${index}`);
      imageTrace.start();

      img.addEventListener("load", () => {
        imageTrace.stop();
        imageTrace.putMetric(
          "image_size",
          img.naturalWidth * img.naturalHeight
        );
      });

      img.addEventListener("error", () => {
        imageTrace.stop();
        this.trackError("image_load_error", { src: img.src });
      });
    });

    // Track API calls
    this.trackAPIPerformance();
  }

  /**
   * Track API call performance
   */
  trackAPIPerformance() {
    if (!this.performance) return;

    // Intercept fetch calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      const apiTrace = trace(this.performance, "api_call");
      apiTrace.putAttribute("endpoint", url.toString());
      apiTrace.start();

      try {
        const response = await originalFetch(...args);

        apiTrace.putMetric("response_status", response.status);
        apiTrace.putMetric(
          "response_size",
          parseInt(response.headers.get("content-length") || "0")
        );
        apiTrace.stop();

        // Log API performance
        this.logAnalyticsEvent("api_call", {
          endpoint: url.toString(),
          status: response.status,
          success: response.ok,
        });

        return response;
      } catch (error) {
        apiTrace.stop();
        this.trackError("api_error", {
          endpoint: url.toString(),
          error: error.message,
        });
        throw error;
      }
    };
  }

  /**
   * Track user interactions
   */
  trackUserInteractions() {
    if (!this.performance || !this.enabledFeatures.userTracking) return;

    // Track button clicks
    document.addEventListener("click", (event) => {
      const target = event.target.closest('button, a, [role="button"]');
      if (target) {
        this.logAnalyticsEvent("user_interaction", {
          interaction_type: "click",
          element_type: target.tagName.toLowerCase(),
          element_text: target.textContent?.substring(0, 50) || "",
          element_id: target.id || "",
          element_class: target.className || "",
        });
      }
    });

    // Track form submissions
    document.addEventListener("submit", (event) => {
      const form = event.target;
      this.logAnalyticsEvent("form_submission", {
        form_id: form.id || "",
        form_action: form.action || "",
        form_method: form.method || "get",
      });
    });

    // Track scroll depth
    this.trackScrollDepth();
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth() {
    let maxScroll = 0;
    const thresholds = [25, 50, 75, 90, 100];
    const triggered = new Set();

    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
          100
      );

      maxScroll = Math.max(maxScroll, scrollPercent);

      thresholds.forEach((threshold) => {
        if (scrollPercent >= threshold && !triggered.has(threshold)) {
          triggered.add(threshold);
          this.logAnalyticsEvent("scroll_depth", {
            scroll_depth: threshold,
            page_path: window.location.pathname,
          });
        }
      });
    };

    window.addEventListener("scroll", trackScroll, { passive: true });
  }

  /**
   * Track errors
   */
  trackErrors() {
    if (!this.enabledFeatures.errorTracking) return;

    // Track JavaScript errors
    window.addEventListener("error", (event) => {
      this.trackError("javascript_error", {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
      });
    });

    // Track unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.trackError("unhandled_promise_rejection", {
        reason: event.reason?.toString() || "Unknown reason",
        stack: event.reason?.stack,
      });
    });

    // Track React error boundaries (if using)
    window.addEventListener("react-error", (event) => {
      this.trackError("react_error", {
        component: event.detail?.componentStack || "",
        error: event.detail?.error?.toString() || "",
        stack: event.detail?.error?.stack,
      });
    });
  }

  /**
   * Start a custom trace
   */
  startTrace(traceName, attributes = {}) {
    if (!this.performance) {
      console.warn("Performance monitoring not available");
      return null;
    }

    const customTrace = trace(this.performance, traceName);

    // Add attributes
    Object.entries(attributes).forEach(([key, value]) => {
      customTrace.putAttribute(key, value.toString());
    });

    customTrace.start();
    this.traces.set(traceName, customTrace);

    return customTrace;
  }

  /**
   * Stop a custom trace
   */
  stopTrace(traceName, metrics = {}) {
    const customTrace = this.traces.get(traceName);
    if (!customTrace) {
      console.warn(`Trace ${traceName} not found`);
      return;
    }

    // Add metrics
    Object.entries(metrics).forEach(([key, value]) => {
      customTrace.putMetric(key, value);
    });

    customTrace.stop();
    this.traces.delete(traceName);
  }

  /**
   * Record custom metric
   */
  recordCustomMetric(name, value, attributes = {}) {
    this.customMetrics.set(name, { value, attributes, timestamp: Date.now() });

    // Also log to analytics
    this.logAnalyticsEvent("custom_metric", {
      metric_name: name,
      metric_value: value,
      ...attributes,
    });
  }

  /**
   * Log analytics event
   */
  logAnalyticsEvent(eventName, parameters = {}) {
    if (!this.analytics || !this.enabledFeatures.analytics) return;

    try {
      // Add default parameters
      const eventParams = {
        timestamp: Date.now(),
        page_path: window.location.pathname,
        page_title: document.title,
        user_agent: navigator.userAgent,
        ...parameters,
      };

      logEvent(this.analytics, eventName, eventParams);
    } catch (error) {
      console.warn("Failed to log analytics event:", error.message);
    }
  }

  /**
   * Track authentication events
   */
  trackAuthEvent(eventType, userInfo = {}) {
    this.logAnalyticsEvent(`auth_${eventType}`, {
      auth_method: userInfo.provider || "unknown",
      user_id: userInfo.uid || userInfo.id,
      email_verified: userInfo.emailVerified || false,
    });

    // Set user properties for analytics
    if (userInfo.uid && this.analytics) {
      setUserId(this.analytics, userInfo.uid);
      setUserProperties(this.analytics, {
        user_role: userInfo.role || "user",
        auth_provider: userInfo.provider || "unknown",
        email_verified: userInfo.emailVerified ? "true" : "false",
      });
    }
  }

  /**
   * Track error with context
   */
  trackError(errorType, context = {}) {
    this.logAnalyticsEvent("error_occurred", {
      error_type: errorType,
      ...context,
      page_path: window.location.pathname,
      timestamp: Date.now(),
    });

    // Also log to console for debugging
    console.error(`Firebase Performance - ${errorType}:`, context);
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName, parameters = {}) {
    this.logAnalyticsEvent("feature_usage", {
      feature_name: featureName,
      ...parameters,
    });
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(metricName, value, context = {}) {
    this.logAnalyticsEvent("business_metric", {
      metric_name: metricName,
      metric_value: value,
      ...context,
    });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      isInitialized: this.isInitialized,
      activeTraces: this.traces.size,
      customMetrics: Array.from(this.customMetrics.entries()),
      enabledFeatures: this.enabledFeatures,
    };

    // Add browser performance metrics if available
    if (typeof window !== "undefined" && window.performance) {
      const navigation = performance.getEntriesByType("navigation")[0];
      if (navigation) {
        summary.pageLoadMetrics = {
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          firstPaint: navigation.responseEnd - navigation.requestStart,
        };
      }
    }

    return summary;
  }

  /**
   * Configure service features
   */
  configure(features = {}) {
    this.enabledFeatures = {
      ...this.enabledFeatures,
      ...features,
    };

    console.log(
      "Firebase Performance Service configured:",
      this.enabledFeatures
    );
  }

  /**
   * Reset service state
   */
  reset() {
    // Stop all active traces
    this.traces.forEach((trace, name) => {
      try {
        trace.stop();
      } catch (error) {
        console.warn(`Failed to stop trace ${name}:`, error.message);
      }
    });

    this.traces.clear();
    this.customMetrics.clear();

    console.log("Firebase Performance Service reset");
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.isInitialized && (this.performance || this.analytics);
  }
}

// Create and export singleton instance
const firebasePerformanceService = new FirebasePerformanceService();

// Auto-configure based on environment
if (process.env.NODE_ENV === "development") {
  firebasePerformanceService.configure({
    performance:
      process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING !== "false",
    analytics: process.env.REACT_APP_ENABLE_ANALYTICS !== "false",
    userTracking: process.env.REACT_APP_TRACK_USER_BEHAVIOR !== "false",
    errorTracking: true,
    customEvents: true,
  });
}

// Export convenience functions
export const trackPageView = (page) => {
  firebasePerformanceService.logAnalyticsEvent("page_view", {
    page_path: page,
  });
};

export const trackUserAction = (action, parameters = {}) => {
  firebasePerformanceService.logAnalyticsEvent("user_action", {
    action,
    ...parameters,
  });
};

export const trackFeature = (feature, parameters = {}) => {
  firebasePerformanceService.trackFeatureUsage(feature, parameters);
};

export const startCustomTrace = (name, attributes = {}) => {
  return firebasePerformanceService.startTrace(name, attributes);
};

export const stopCustomTrace = (name, metrics = {}) => {
  firebasePerformanceService.stopTrace(name, metrics);
};

export default firebasePerformanceService;
