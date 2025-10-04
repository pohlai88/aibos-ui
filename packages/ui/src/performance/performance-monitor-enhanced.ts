/**
 * Performance Monitoring - Milestone 8 Performance Optimization
 * 
 * Provides performance monitoring and Web Vitals tracking.
 * Enabled by default in development, opt-in for production.
 */

import React from 'react';
import { performanceConfig } from '../dev.config';

// Web Vitals types
interface WebVitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

interface PerformanceObserver {
  observe: (options: { entryTypes: string[] }) => void;
  disconnect: () => void;
}

// Performance monitoring class
class EnhancedPerformanceMonitor {
  private isEnabled: boolean;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.isEnabled = performanceConfig.enabled;
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (!this.isEnabled) return;

    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor component render times
    this.observeComponentPerformance();
    
    // Monitor bundle loading
    this.observeBundlePerformance();
  }

  private observeWebVitals() {
    // LCP - Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entry: any) => {
      this.recordMetric('LCP', entry.startTime);
    });

    // FID - First Input Delay
    this.observeMetric('first-input', (entry: any) => {
      this.recordMetric('FID', entry.processingStart - entry.startTime);
    });

    // CLS - Cumulative Layout Shift
    this.observeMetric('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        this.recordMetric('CLS', entry.value);
      }
    });
  }

  private observeComponentPerformance() {
    // Monitor React component render times
    const originalCreateElement = React.createElement;
    
    (React as any).createElement = (...args: any[]) => {
      const start = performance.now();
      const result = originalCreateElement.apply(React, args as any);
      const end = performance.now();
      
      const renderTime = end - start;
      if (renderTime > performanceConfig.thresholds.render) {
        console.warn(`⚠️ Slow component render: ${renderTime.toFixed(2)}ms`);
      }
      
      return result;
    };
  }

  private observeBundlePerformance() {
    // Monitor script loading times
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      script.addEventListener('load', () => {
        const loadTime = performance.now();
        this.recordMetric('ScriptLoad', loadTime);
      });
    });
  }

  private observeMetric(entryType: string, callback: (entry: any) => void) {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });

      observer.observe({ entryTypes: [entryType] });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${entryType}:`, error);
    }
  }

  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }

    // Log significant metrics
    if (this.isSignificantMetric(name, value)) {
      this.logMetric(name, value);
    }
  }

  private isSignificantMetric(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      LCP: 2500,    // 2.5s
      FID: 100,     // 100ms
      CLS: 0.1,     // 0.1
      ScriptLoad: 1000, // 1s
    };

    return value > (thresholds[name] || 0);
  }

  private logMetric(name: string, value: number) {
    const status = this.isSignificantMetric(name, value) ? '⚠️' : '✅';
    console.log(`${status} ${name}: ${value.toFixed(2)}${this.getMetricUnit(name)}`);
  }

  private getMetricUnit(name: string): string {
    const units: Record<string, string> = {
      LCP: 'ms',
      FID: 'ms', 
      CLS: '',
      ScriptLoad: 'ms',
    };
    return units[name] || '';
  }

  // Public API
  public getMetrics(): Record<string, number[]> {
    const result: Record<string, number[]> = {};
    this.metrics.forEach((values, name) => {
      result[name] = [...values];
    });
    return result;
  }

  public getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  public getPerformanceReport(): string {
    const metrics = this.getMetrics();
    const report = ['📊 Performance Report', '─'.repeat(50)];
    
    Object.entries(metrics).forEach(([name, values]) => {
      const avg = this.getAverageMetric(name);
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      report.push(`${name}: avg=${avg.toFixed(2)}, max=${max.toFixed(2)}, min=${min.toFixed(2)}`);
    });
    
    return report.join('\n');
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
let enhancedPerformanceMonitor: EnhancedPerformanceMonitor | null = null;

// Initialize performance monitoring
export const initializeEnhancedPerformanceMonitoring = () => {
  if (enhancedPerformanceMonitor) return enhancedPerformanceMonitor;
  
  enhancedPerformanceMonitor = new EnhancedPerformanceMonitor();
  return enhancedPerformanceMonitor;
};

// Get performance metrics
export const getEnhancedPerformanceMetrics = () => {
  return enhancedPerformanceMonitor?.getMetrics() || {};
};

// Get performance report
export const getEnhancedPerformanceReport = () => {
  return enhancedPerformanceMonitor?.getPerformanceReport() || 'Performance monitoring not initialized';
};

// Cleanup performance monitoring
export const cleanupEnhancedPerformanceMonitoring = () => {
  enhancedPerformanceMonitor?.cleanup();
  enhancedPerformanceMonitor = null;
};

// React component for performance monitoring
export const EnhancedPerformanceMonitorComponent = () => {
  React.useEffect(() => {
    const monitor = initializeEnhancedPerformanceMonitoring();
    
    return () => {
      monitor.cleanup();
    };
  }, []);

  return null;
};

// Export the monitor instance
export { EnhancedPerformanceMonitor };