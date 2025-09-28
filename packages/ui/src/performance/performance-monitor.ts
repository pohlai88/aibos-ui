/**
 * Performance Monitoring Utility - Enterprise Production Ready
 *
 * Utilities for monitoring and measuring component performance
 * in production and development environments.
 */

import { createDict, safeSet } from '@aibos/utils';
import * as React from 'react';

export interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  memoryUsage?: number;
  timestamp: number;
  environment: 'development' | 'production';
}

export interface PerformanceThresholds {
  renderTime: number;
  memoryUsage?: number;
  warningThreshold?: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: Map<string, PerformanceThresholds> = new Map();
  private isEnabled: boolean;

  constructor(enabled: boolean = process.env.NODE_ENV === 'development') {
    this.isEnabled = enabled;
    this.setDefaultThresholds();
  }

  private setDefaultThresholds(): void {
    this.thresholds.set('Button', { renderTime: 5, warningThreshold: 3 });
    this.thresholds.set('Input', { renderTime: 8, warningThreshold: 5 });
    this.thresholds.set('Card', { renderTime: 10, warningThreshold: 7 });
    this.thresholds.set('Modal', { renderTime: 50, warningThreshold: 30 });
    this.thresholds.set('Table', { renderTime: 100, warningThreshold: 70 });
    this.thresholds.set('Form', { renderTime: 30, warningThreshold: 20 });
  }

  /**
   * Measure component render performance
   */
  measureRender<T>(
    componentName: string,
    renderFunction: () => T,
    options?: { logToConsole?: boolean },
  ): { result: T; metrics: PerformanceMetrics } {
    if (!this.isEnabled) {
      return { result: renderFunction(), metrics: this.createEmptyMetrics(componentName) };
    }

    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    const result = renderFunction();

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    const metrics: PerformanceMetrics = {
      componentName,
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV as 'development' | 'production',
    };

    this.metrics.push(metrics);
    this.checkThresholds(metrics, options?.logToConsole);

    return { result, metrics };
  }

  /**
   * Measure async operation performance
   */
  async measureAsync<T>(
    operationName: string,
    asyncFunction: () => Promise<T>,
    options?: { logToConsole?: boolean },
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    if (!this.isEnabled) {
      return { result: await asyncFunction(), metrics: this.createEmptyMetrics(operationName) };
    }

    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    const result = await asyncFunction();

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    const metrics: PerformanceMetrics = {
      componentName: operationName,
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV as 'development' | 'production',
    };

    this.metrics.push(metrics);
    this.checkThresholds(metrics, options?.logToConsole);

    return { result, metrics };
  }

  /**
   * Set custom thresholds for a component
   */
  setThresholds(componentName: string, thresholds: PerformanceThresholds): void {
    this.thresholds.set(componentName, thresholds);
  }

  /**
   * Get performance metrics for a component
   */
  getMetrics(componentName?: string): PerformanceMetrics[] {
    if (componentName) {
      return this.metrics.filter((m) => m.componentName === componentName);
    }
    return [...this.metrics];
  }

  /**
   * Get average performance metrics
   */
  getAverageMetrics(componentName?: string): Partial<PerformanceMetrics> {
    const relevantMetrics = componentName
      ? this.metrics.filter((m) => m.componentName === componentName)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {};
    }

    const totalRenderTime = relevantMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    const totalMemoryUsage = relevantMetrics
      .filter((m) => m.memoryUsage !== undefined)
      .reduce((sum, m) => sum + (m.memoryUsage || 0), 0);

    return {
      componentName,
      renderTime: totalRenderTime / relevantMetrics.length,
      memoryUsage: totalMemoryUsage / relevantMetrics.length,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV as 'development' | 'production',
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        thresholds: this.getThresholdsAsObject(),
        summary: this.getSummary(),
      },
      undefined,
      2,
    );
  }

  /**
   * Safely convert thresholds Map to object for JSON serialization
   */
  private getThresholdsAsObject(): Record<string, PerformanceThresholds> {
    const thresholdsObject = createDict<PerformanceThresholds>();
    for (const [key, value] of this.thresholds) {
      safeSet(thresholdsObject, key, value);
    }
    return thresholdsObject;
  }

  /**
   * Get performance summary
   */
  private getSummary(): Record<string, unknown> {
    const componentNames = [...new Set(this.metrics.map((m) => m.componentName))];
    const summary = createDict<unknown>();

    componentNames.forEach((name) => {
      const componentMetrics = this.metrics.filter((m) => m.componentName === name);
      const avgRenderTime =
        componentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / componentMetrics.length;
      const maxRenderTime = Math.max(...componentMetrics.map((m) => m.renderTime));
      const minRenderTime = Math.min(...componentMetrics.map((m) => m.renderTime));

      safeSet(summary, name, {
        count: componentMetrics.length,
        averageRenderTime: avgRenderTime,
        maxRenderTime,
        minRenderTime,
        threshold: this.thresholds.get(name),
      });
    });

    return summary;
  }

  private checkThresholds(metrics: PerformanceMetrics, logToConsole?: boolean): void {
    const threshold = this.thresholds.get(metrics.componentName);
    if (!threshold) return;

    const shouldLog = logToConsole ?? process.env.NODE_ENV === 'development';

    if (metrics.renderTime > threshold.renderTime) {
      const message = `⚠️ Performance Warning: ${metrics.componentName} render time (${metrics.renderTime.toFixed(2)}ms) exceeds threshold (${threshold.renderTime}ms)`;
      if (shouldLog) {
        console.warn(message);
      }
    }

    if (threshold.warningThreshold && metrics.renderTime > threshold.warningThreshold) {
      const message = `🔍 Performance Info: ${metrics.componentName} render time (${metrics.renderTime.toFixed(2)}ms) exceeds warning threshold (${threshold.warningThreshold}ms)`;
      if (shouldLog) {
        console.info(message);
      }
    }
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const perfMemory = (performance as Performance & { memory?: { usedJSHeapSize: number } })
        .memory;
      return perfMemory?.usedJSHeapSize ?? 0;
    }
    return 0;
  }

  private createEmptyMetrics(componentName: string): PerformanceMetrics {
    return {
      componentName,
      renderTime: 0,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV as 'development' | 'production',
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string): {
  measureRender: <T>(
    renderFunction: () => T,
    options?: { logToConsole?: boolean },
  ) => { result: T; metrics: PerformanceMetrics };
  measureAsync: <T>(
    operationName: string,
    asyncFunction: () => Promise<T>,
    options?: { logToConsole?: boolean },
  ) => Promise<{ result: T; metrics: PerformanceMetrics }>;
  getMetrics: () => PerformanceMetrics[];
  getAverageMetrics: () => Partial<PerformanceMetrics>;
  clearMetrics: () => void;
} {
  const measureRender = <T>(renderFunction: () => T, options?: { logToConsole?: boolean }) => {
    return performanceMonitor.measureRender(componentName, renderFunction, options);
  };

  const measureAsync = <T>(
    operationName: string,
    asyncFunction: () => Promise<T>,
    options?: { logToConsole?: boolean },
  ) => {
    return performanceMonitor.measureAsync(operationName, asyncFunction, options);
  };

  const getMetrics = () => performanceMonitor.getMetrics(componentName);
  const getAverageMetrics = () => performanceMonitor.getAverageMetrics(componentName);
  const clearMetrics = () => performanceMonitor.clearMetrics();

  return {
    measureRender,
    measureAsync,
    getMetrics,
    getAverageMetrics,
    clearMetrics,
  };
}

// Higher-order component for automatic performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<HTMLDivElement>> {
  const name = componentName || Component.displayName || Component.name || 'Unknown';

  return React.forwardRef<HTMLDivElement, P>((props, reference) => {
    const { measureRender } = usePerformanceMonitor(name);

    const { result } = measureRender(() => {
      return React.createElement(Component, props as P);
    });

    // Wrap the result in a div to attach the ref, avoiding ref injection issues
    return React.createElement('div', { ref: reference }, result);
  });
}

// Performance decorator for class components
export function performanceMonitored(componentName?: string) {
  return function <T extends React.ComponentType<unknown>>(
    Component: T,
  ): React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.ComponentProps<T>> & React.RefAttributes<HTMLDivElement>
  > {
    const name = componentName || Component.displayName || Component.name || 'Unknown';

    return React.forwardRef<HTMLDivElement, React.ComponentProps<T>>((props, reference) => {
      const { measureRender } = usePerformanceMonitor(name);

      const { result } = measureRender(() => {
        return React.createElement(Component, props as unknown);
      });

      // Wrap the result in a div to attach the ref, avoiding ref injection issues
      return React.createElement('div', { ref: reference }, result);
    });
  };
}
