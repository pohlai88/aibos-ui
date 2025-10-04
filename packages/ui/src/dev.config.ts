/**
 * Development Environment Configuration
 * 
 * This file contains development-specific configurations and utilities
 * for the AIBOS UI package development environment.
 */

// Development environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Performance monitoring configuration
export const performanceConfig = {
  enabled: isDevelopment || process.env.PERF_MONITORING === 'true',
  thresholds: {
    render: 16, // 60fps
    mount: 100,
    update: 50,
    unmount: 30,
  },
  sampling: isDevelopment ? 1.0 : 0.1, // 100% in dev, 10% in prod
};

// Development utilities
export const devUtils = {
  logPerformance: (label: string, duration: number): void => {
    if (isDevelopment && performanceConfig.enabled) {
      const threshold = performanceConfig.thresholds[label as keyof typeof performanceConfig.thresholds];
      const status = threshold && duration > threshold ? '⚠️' : '✅';
      console.log(`${status} ${label}: ${duration.toFixed(2)}ms`);
    }
  },
  
  logComponentRender: (componentName: string, props?: Record<string, unknown>): void => {
    if (isDevelopment) {
      console.log(`🎨 Rendering ${componentName}`, props);
    }
  },
  
  logAccessibility: (componentName: string, issues: string[]): void => {
    if (isDevelopment && issues.length > 0) {
      console.warn(`♿ A11y issues in ${componentName}:`, issues);
    }
  },
};

// Development-only features
export const devFeatures = {
  showPerformanceMetrics: isDevelopment,
  enableDebugMode: isDevelopment,
  logComponentLifecycle: isDevelopment,
  enableAccessibilityWarnings: isDevelopment,
};

// Export development configuration
export default {
  isDevelopment,
  isProduction,
  isTest,
  performanceConfig,
  devUtils,
  devFeatures,
};
