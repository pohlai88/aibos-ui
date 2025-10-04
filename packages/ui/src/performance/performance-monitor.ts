/**
 * Performance monitor for UI components
 */

export interface PerformanceMetrics {
  renderTime: number;
  mountTime: number;
  updateTime: number;
  unmountTime: number;
}

export interface PerformanceThresholds {
  render: number;
  mount: number;
  update: number;
  unmount: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    mountTime: 0,
    updateTime: 0,
    unmountTime: 0,
  };

  startRender(): void {
    this.metrics.renderTime = performance.now();
  }

  endRender(): number {
    const duration = performance.now() - this.metrics.renderTime;
    this.metrics.renderTime = duration;
    return duration;
  }

  startMount(): void {
    this.metrics.mountTime = performance.now();
  }

  endMount(): number {
    const duration = performance.now() - this.metrics.mountTime;
    this.metrics.mountTime = duration;
    return duration;
  }

  startUpdate(): void {
    this.metrics.updateTime = performance.now();
  }

  endUpdate(): number {
    const duration = performance.now() - this.metrics.updateTime;
    this.metrics.updateTime = duration;
    return duration;
  }

  startUnmount(): void {
    this.metrics.unmountTime = performance.now();
  }

  endUnmount(): number {
    const duration = performance.now() - this.metrics.unmountTime;
    this.metrics.unmountTime = duration;
    return duration;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      renderTime: 0,
      mountTime: 0,
      updateTime: 0,
      unmountTime: 0,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook for React components
export function usePerformanceMonitor(): PerformanceMonitor {
  return performanceMonitor;
}

// HOC for performance monitoring
export function performanceMonitored<T extends React.ComponentType<unknown>>(Component: T): T {
  return Component;
}
