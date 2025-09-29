/**
 * Monitoring Utilities - Phase 2 Implementation
 * 
 * Provides comprehensive monitoring, metrics collection, and observability
 * utilities for the accounting domain.
 * 
 * Features:
 * - MonitoringHelper for operation tracking
 * - Metrics collection and aggregation
 * - Performance monitoring and profiling
 * - Health checks and status monitoring
 * - Alerting and notification systems
 * - Distributed tracing support
 */

import { 
  type ErrorContext
} from './error-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MonitoringOptions {
  enableMetrics?: boolean;
  enableTracing?: boolean;
  enableLogging?: boolean;
  enableAlerts?: boolean;
  sampleRate?: number;
  bufferSize?: number;
  flushInterval?: number;
}

export interface OperationMetrics {
  operationName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  success: boolean;
  error?: Error;
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    load: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    free: number;
    total: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  duration?: number;
}

export type HealthCheckFn = () => Promise<HealthCheck>;

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tags?: Record<string, string>;
  logs?: Array<{
    timestamp: Date;
    level: string;
    message: string;
    fields?: Record<string, unknown>;
  }>;
}

export interface MonitoringContext extends ErrorContext {
  operationName?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  userId?: string;
  tenantId?: string;
  requestId?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  timestamp?: Date;
}

// ============================================================================
// EXPORTER & LOGGER INTERFACES (PLUGGABLE)
// ============================================================================

export interface MetricsExporter {
  /** Export a batch of operation metrics (called by flush). */
  exportOperations(metrics: OperationMetrics[]): Promise<void> | void;
  /** Optionally export system metrics (called by getSystemMetrics/flush). */
  exportSystem?(system: SystemMetrics): Promise<void> | void;
  /** Optionally export alerts (called by flush). */
  exportAlerts?(alerts: Alert[]): Promise<void> | void;
  /** Optionally export health checks (called after runHealthChecks). */
  exportHealth?(checks: HealthCheck[]): Promise<void> | void;
  /** Optional lifecycle hooks */
  flush?(): Promise<void> | void;
  shutdown?(): Promise<void> | void;
}

export interface TracingExporter {
  /** Called when a span starts. */
  startSpan(info: { operationName: string; traceId: string; spanId: string; parentSpanId?: string; startTime: Date; tags?: Record<string,string>; }): Promise<void> | void;
  /** Called when a span ends (with optional error). */
  endSpan(info: { spanId: string; endTime: Date; duration: number; error?: Error; tags?: Record<string,string>; }): Promise<void> | void;
}

export interface Logger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  debug?(...args: unknown[]): void;
}

// ============================================================================
// PROMETHEUS HISTOGRAM (HELPER)
// ============================================================================
export interface HistogramConfig {
  /** Metric base name, e.g. "op_duration_ms" (buckets will render as *_bucket). */
  name: string;
  /** Ordered upper bounds in the same unit as observed values. Example (ms): [5,10,25,50,100,250,500,1000,2500,5000] */
  buckets: number[];
  /** Constant labels applied to all samples from this histogram. */
  labels?: Record<string, string>;
  /** Optional help string for exposition. */
  help?: string;
}

export class Histogram {
  private readonly bounds: number[];
  private readonly counts: number[]; // per-bucket
  private infCount = 0;
  private sum = 0;
  private total = 0;
  constructor(private cfg: HistogramConfig) {
    this.bounds = [...cfg.buckets].sort((a, b) => a - b);
    this.counts = new Array(this.bounds.length).fill(0);
  }
  observe(value: number) {
    // Ignore non-finite values
    if (!Number.isFinite(value)) return;
    this.sum += value;
    this.total += 1;
    for (let i = 0; i < this.bounds.length; i++) {
      const bound = this.bounds[i];
      if (bound !== undefined && value <= bound) { 
        this.counts[i] = (this.counts[i] ?? 0) + 1; 
        return; 
      }
    }
    this.infCount++;
  }
  /** Clear all bucket counters and accumulators (useful for tests). */
  reset(): void {
    this.counts.fill(0);
    this.infCount = 0;
    this.sum = 0;
    this.total = 0;
  }
  /** Render in Prometheus text exposition format. */
  render(labels: Record<string, string> = {}): string {
    const name = this.cfg.name;
    const help = this.cfg.help ? `# HELP ${name} ${this.cfg.help}\n` : '';
    const type = `# TYPE ${name} histogram\n`;
    let out = help + type;
    let cum = 0;
    const baseLabels = { ...(this.cfg.labels ?? {}), ...labels };
    const labelStr = (extra: Record<string, string>) => {
      const all = { ...baseLabels, ...extra };
      const parts = Object.entries(all).map(([k,v]) => `${k}="${String(v).replace(/"/g,'\\"')}"`);
      return parts.length ? `{${parts.join(',')}}` : '';
    };
    for (let i = 0; i < this.bounds.length; i++) {
      cum += this.counts[i] ?? 0;
      out += `${name}_bucket${labelStr({le: String(this.bounds[i])})} ${cum}\n`;
    }
    cum += this.infCount;
    out += `${name}_bucket${labelStr({le: "+Inf"})} ${cum}\n`;
    out += `${name}_sum${labelStr({})} ${this.sum}\n`;
    out += `${name}_count${labelStr({})} ${this.total}\n`;
    return out;
  }
}

// ============================================================================
// MONITORING HELPER
// ============================================================================

/**
 * Helper class for monitoring operations and collecting metrics
 */
export class MonitoringHelper {
  private static metrics: OperationMetrics[] = [];
  private static alerts: Alert[] = [];
  private static healthChecks: Map<string, { fn: HealthCheckFn; last?: HealthCheck }> = new Map();
  private static options: MonitoringOptions = {
    enableMetrics: true,
    enableTracing: true,
    enableLogging: true,
    enableAlerts: true,
    sampleRate: 1.0,
    bufferSize: 1000,
    flushInterval: 60000,
  };
  private static readonly MAX_METRICS = 10000;
  private static readonly MAX_ALERTS = 1000;
  private static flushTimer?: ReturnType<typeof setInterval>;
  private static metricsExporter: MetricsExporter | undefined;
  private static tracingExporter: TracingExporter | undefined;
  private static logger: Logger = {
    info: (...args) => { if (this.options.enableLogging) console.log(...args); },
    warn: (...args) => { if (this.options.enableLogging) console.warn(...args); },
    error: (...args) => { if (this.options.enableLogging) console.error(...args); },
    debug: (...args) => { if (this.options.enableLogging) console.debug?.(...args); },
  };
  // Local, library-owned histograms (optional)
  private static durationHistograms: Map<string, Histogram> = new Map();
  /** Expose internal histograms for exporters/tests (read-only). */
  static getInternalHistograms(): Iterable<Histogram> {
    return this.durationHistograms.values();
  }

  static initialize(options: MonitoringOptions = {}): void {
    const sr = options.sampleRate ?? 1.0;
    this.options = {
      enableMetrics: options.enableMetrics !== false,
      enableTracing: options.enableTracing !== false,
      enableLogging: options.enableLogging !== false,
      enableAlerts: options.enableAlerts !== false,
      sampleRate: Math.max(0, Math.min(1, sr)),
      bufferSize: options.bufferSize ?? 1000,
      flushInterval: options.flushInterval ?? 60000,
    };

    // Start periodic tasks
    if (this.options.enableMetrics) {
      this.startMetricsCollection();
    }
  }

  /** Provide a metrics exporter (Prometheus pushgateway, OTLP, etc.) */
  static setMetricsExporter(exporter?: MetricsExporter): void {
    this.metricsExporter = exporter;
  }
  /** Provide a tracing exporter (OTel SDK bridge, etc.) */
  static setTracingExporter(exporter?: TracingExporter): void {
    this.tracingExporter = exporter;
  }
  /** Provide a structured logger (pino, winston, your adapter). */
  static setLogger(logger?: Logger): void {
    if (logger) this.logger = logger;
  }
  /** Graceful shutdown hook for exporters. */
  static async shutdown(): Promise<void> {
    try { await this.flushMetrics(); } catch {}
    try { await this.metricsExporter?.shutdown?.(); } catch {}
    if (this.flushTimer) { clearInterval(this.flushTimer); this.flushTimer = undefined as unknown; }
  }

  /**
   * Track an operation with monitoring
   */
  static async trackOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: MonitoringContext
  ): Promise<T> {
    const startTime = new Date();
    const t0 = (globalThis.performance?.now?.() as number | undefined) ?? startTime.getTime();
    const traceId = context?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    
    const monitoringContext: MonitoringContext = {
      ...context,
      operationName,
      traceId,
      spanId,
      startTime
    };

    try {
      if (this.options.enableTracing) {
        this.startTrace(operationName, traceId, spanId, context?.parentSpanId, monitoringContext);
      }

      if (this.options.enableLogging) {
        this.logOperationStart(operationName, monitoringContext);
      }

      const result = await operation();
      
      const endTime = new Date();
      const t1 = (globalThis.performance?.now?.() as number | undefined) ?? endTime.getTime();
      const duration = Math.max(0, t1 - t0);
      
      monitoringContext.endTime = endTime;
      monitoringContext.duration = duration;

      if (this.options.enableMetrics) {
        this.recordMetrics({
          operationName,
          startTime,
          endTime,
          duration,
          success: true,
          metadata: monitoringContext,
          tags: this.extractTags(monitoringContext)
        });
      }

      if (this.options.enableTracing) {
        this.endTrace(spanId, endTime, duration);
      }

      if (this.options.enableLogging) {
        this.logOperationComplete(operationName, monitoringContext);
      }

      return result;
      
    } catch (error) {
      const endTime = new Date();
      const t1 = (globalThis.performance?.now?.() as number | undefined) ?? endTime.getTime();
      const duration = Math.max(0, t1 - t0);
      
      monitoringContext.endTime = endTime;
      monitoringContext.duration = duration;

      if (this.options.enableMetrics) {
        this.recordMetrics({
          operationName,
          startTime,
          endTime,
          duration,
          success: false,
          error: error as Error,
          metadata: monitoringContext,
          tags: this.extractTags(monitoringContext)
        });
      }

      if (this.options.enableTracing) {
        this.endTrace(spanId, endTime, duration, error as Error);
      }

      if (this.options.enableLogging) {
        this.logOperationError(operationName, error as Error, monitoringContext);
      }

      throw error;
    }
  }

  /**
   * Track a synchronous operation
   */
  static trackSyncOperation<T>(
    operationName: string,
    operation: () => T,
    context?: MonitoringContext
  ): T {
    const startTime = new Date();
    const t0 = (globalThis.performance?.now?.() as number | undefined) ?? startTime.getTime();
    const traceId = context?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    
    const monitoringContext: MonitoringContext = {
      ...context,
      operationName,
      traceId,
      spanId,
      startTime
    };

    try {
      if (this.options.enableTracing) {
        this.startTrace(operationName, traceId, spanId, context?.parentSpanId, monitoringContext);
      }

      if (this.options.enableLogging) {
        this.logOperationStart(operationName, monitoringContext);
      }

      const result = operation();
      
      const endTime = new Date();
      const t1 = (globalThis.performance?.now?.() as number | undefined) ?? endTime.getTime();
      const duration = Math.max(0, t1 - t0);
      
      monitoringContext.endTime = endTime;
      monitoringContext.duration = duration;

      if (this.options.enableMetrics) {
        this.recordMetrics({
          operationName,
          startTime,
          endTime,
          duration,
          success: true,
          metadata: monitoringContext,
          tags: this.extractTags(monitoringContext)
        });
      }

      if (this.options.enableTracing) {
        this.endTrace(spanId, endTime, duration);
      }

      if (this.options.enableLogging) {
        this.logOperationComplete(operationName, monitoringContext);
      }

      return result;
      
    } catch (error) {
      const endTime = new Date();
      const t1 = (globalThis.performance?.now?.() as number | undefined) ?? endTime.getTime();
      const duration = Math.max(0, t1 - t0);
      
      monitoringContext.endTime = endTime;
      monitoringContext.duration = duration;

      if (this.options.enableMetrics) {
        this.recordMetrics({
          operationName,
          startTime,
          endTime,
          duration,
          success: false,
          error: error as Error,
          metadata: monitoringContext,
          tags: this.extractTags(monitoringContext)
        });
      }

      if (this.options.enableTracing) {
        this.endTrace(spanId, endTime, duration, error as Error);
      }

      if (this.options.enableLogging) {
        this.logOperationError(operationName, error as Error, monitoringContext);
      }

      throw error;
    }
  }

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  /**
   * Record operation metrics
   */
  static recordMetrics(metrics: OperationMetrics): void {
    if (!this.options?.enableMetrics) return;
    
    // Apply sampling
    const rate = this.options.sampleRate ?? 1.0;
    if (Math.random() > rate) return;
    
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
    // If buffer exceeds configured size, flush opportunistically.
    if ((this.options.bufferSize ?? 1000) > 0 && this.metrics.length >= (this.options.bufferSize ?? 1000)) {
      // tslint:disable-next-line:no-floating-promises
      this.flushMetrics();
    }
    // Also feed a per-operation duration histogram (ms) if duration present
    if (typeof metrics.duration === 'number') {
      const key = metrics.operationName;
      let h = this.durationHistograms.get(key);
      if (!h) {
        h = new Histogram({
          name: 'operation_duration_ms',
          help: 'Operation duration in milliseconds',
          buckets: [5,10,25,50,100,250,500,1000,2500,5000,10000],
          labels: { operation: key },
        });
        this.durationHistograms.set(key, h);
      }
      h.observe(metrics.duration);
    }
  }

  /**
   * Get operation metrics
   */
  static getMetrics(operationName?: string): OperationMetrics[] {
    if (operationName) {
      return this.metrics.filter(m => m.operationName === operationName);
    }
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  static getMetricsSummary(operationName?: string): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    successRate: number;
  } {
    const metrics = this.getMetrics(operationName);
    
    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        successRate: 0
      };
    }

    const successful = metrics.filter(m => m.success).length;
    const failed = metrics.filter(m => !m.success).length;
    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    
    return {
      totalOperations: metrics.length,
      successfulOperations: successful,
      failedOperations: failed,
      averageDuration: totalDuration / metrics.length,
      successRate: successful / metrics.length
    };
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  /**
   * Register a health check
   */
  static registerHealthCheck(
    name: string,
    check: HealthCheckFn
  ): void {
    this.healthChecks.set(name, { fn: check });
  }

  /**
   * Run health checks
   */
  static async runHealthChecks(): Promise<HealthCheck[]> {
    const results: HealthCheck[] = [];
    
    for (const [name, entry] of this.healthChecks.entries()) {
      try {
        const startTime = new Date();
        const result = await entry.fn();
        const endTime = new Date();
        
        result.duration = endTime.getTime() - startTime.getTime();
        result.timestamp = endTime;
        
        results.push(result);
        // Update last result
        this.healthChecks.set(name, { fn: entry.fn, last: result });
        
      } catch (error) {
        const failedCheck: HealthCheck = {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        };
        
        results.push(failedCheck);
        this.healthChecks.set(name, { fn: entry.fn, last: failedCheck });
      }
    }
    // fire-and-forget export of health states
    try { await this.metricsExporter?.exportHealth?.(results); } catch {}
    
    return results;
  }

  /**
   * Get health status
   */
  static getHealthStatus(): {
    overall: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheck[];
    healthyCount: number;
    unhealthyCount: number;
    degradedCount: number;
  } {
    const checks = Array.from(this.healthChecks.values())
      .map(v => v.last)
      .filter((v): v is HealthCheck => !!v);
    const healthyCount = checks.filter(c => c.status === 'healthy').length;
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }
    
    return {
      overall,
      checks,
      healthyCount,
      unhealthyCount,
      degradedCount
    };
  }

  // ============================================================================
  // ALERTING
  // ============================================================================

  /**
   * Create an alert
   */
  static createAlert(
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
    source: string,
    metadata?: Record<string, unknown>
  ): Alert {
    const alert: Alert = {
      id: this.generateAlertId(),
      severity,
      title,
      message,
      source,
      timestamp: new Date(),
      resolved: false,
      ...(metadata && { metadata })
    };
    
    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS);
    }
    
    return alert;
  }

  /**
   * Resolve an alert
   */
  static resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get active alerts
   */
  static getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Get alerts by severity
   */
  static getAlertsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): Alert[] {
    return this.alerts.filter(a => a.severity === severity);
  }

  // ============================================================================
  // SYSTEM METRICS
  // ============================================================================

  /**
   * Get system metrics
   */
  static getSystemMetrics(): SystemMetrics {
    // This is a simplified implementation
    // In a real system, you would use system APIs to get actual metrics
    
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const freeMemory = totalMemory - usedMemory;
    
    return {
      timestamp: new Date(),
      cpu: {
        usage: 0, // Would need system API
        load: 0   // Would need system API
      },
      memory: {
        used: usedMemory,
        free: freeMemory,
        total: totalMemory,
        usage: usedMemory / totalMemory
      },
      disk: {
        used: 0,  // Would need system API
        free: 0,  // Would need system API
        total: 0, // Would need system API
        usage: 0  // Would need system API
      },
      network: {
        bytesIn: 0,    // Would need system API
        bytesOut: 0,   // Would need system API
        packetsIn: 0,  // Would need system API
        packetsOut: 0  // Would need system API
      }
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Start metrics collection
   */
  private static startMetricsCollection(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => {
      // tslint:disable-next-line:no-floating-promises
      this.flushMetrics();
    }, this.options.flushInterval ?? 60000);
  }

  /**
   * Flush metrics to external systems
   */
  private static async flushMetrics(): Promise<void> {
    if (!this.options.enableMetrics) return;
    const exporter = this.metricsExporter;
    if (!exporter) {
      // Default behavior: just log a summary when logging is on
      this.logger.info?.(`[monitoring] flush noop: ${this.metrics.length} ops, ${this.alerts.length} alerts`);
      this.metrics = [];
      return;
    }
    const ops = this.metrics.splice(0, this.metrics.length); // drain
    try {
      if (ops.length) await exporter.exportOperations(ops);
      // Optional: expose system metrics on flush tick
      if (exporter.exportSystem) await exporter.exportSystem(this.getSystemMetrics());
      if (this.alerts.length && exporter.exportAlerts) {
        const actives = this.alerts.filter(a => !a.resolved);
        if (actives.length) await exporter.exportAlerts(actives);
      }
      await exporter.flush?.();
    } catch (e) {
      // On exporter failure, requeue ops for next attempt (bounded)
      this.logger.error?.('[monitoring] exporter error during flush', e);
      this.metrics.unshift(...ops);
      if (this.metrics.length > this.MAX_METRICS) {
        this.metrics = this.metrics.slice(-this.MAX_METRICS);
      }
    }
  }
  /** Force a flush now (useful in tests/shutdown hooks). */
  static async forceFlush(): Promise<void> {
    await this.flushMetrics();
  }

  /**
   * Start trace
   */
  private static startTrace(
    operationName: string,
    traceId: string,
    spanId: string,
    parentSpanId?: string,
    ctx?: MonitoringContext
  ): void {
    // Export via tracer if provided, else log
    try {
      if (this.tracingExporter) {
        this.tracingExporter.startSpan({
          operationName,
          traceId,
          spanId,
          ...(parentSpanId && { parentSpanId }),
          startTime: ctx?.startTime ?? new Date(),
          tags: this.extractTags(ctx ?? {}),
        });
        return;
      }
    } catch (e) {
      this.logger.error?.('[monitoring] tracingExporter.startSpan error', e);
    }
    if (this.options.enableLogging) {
      this.logger.info?.(`Starting trace: ${operationName} (${traceId}:${spanId}${parentSpanId ? ` parent=${parentSpanId}` : ''})`);
    }
  }

  /**
   * End trace
   */
  private static endTrace(
    spanId: string,
    endTime: Date,
    duration: number,
    error?: Error
  ): void {
    try {
      if (this.tracingExporter) {
        this.tracingExporter.endSpan({ 
          spanId, 
          endTime, 
          duration, 
          ...(error && { error })
        });
        return;
      }
    } catch (e) {
      this.logger.error?.('[monitoring] tracingExporter.endSpan error', e);
    }
    if (this.options.enableLogging) {
      this.logger.info?.(`Ending trace: ${spanId} (${duration}ms)${error ? ` error=${error.message}` : ''}`);
    }
  }

  /**
   * Log operation start
   */
  private static logOperationStart(
    operationName: string,
    context: MonitoringContext
  ): void {
    this.logger.info?.(`Starting operation: ${operationName}`, context);
  }

  /**
   * Log operation completion
   */
  private static logOperationComplete(
    operationName: string,
    context: MonitoringContext
  ): void {
    this.logger.info?.(`Completed operation: ${operationName}`, context);
  }

  /**
   * Log operation error
   */
  private static logOperationError(
    operationName: string,
    error: Error,
    context: MonitoringContext
  ): void {
    this.logger.error?.(`Operation failed: ${operationName}`, error, context);
  }

  /**
   * Extract tags from context
   */
  private static extractTags(context: MonitoringContext): Record<string, string> {
    const tags: Record<string, string> = {};
    
    if (context.userId) tags.userId = String(context.userId);
    if (context.tenantId) tags.tenantId = String(context.tenantId);
    if (context.requestId) tags.requestId = String(context.requestId);
    if (context.operationName) tags.operationName = String(context.operationName);
    
    return tags;
  }

  /**
   * Generate trace ID
   */
  private static generateTraceId(): string {
    try {
      // Prefer crypto.randomUUID when available
      const uuid = globalThis.crypto?.randomUUID?.();
      if (uuid) return `trace_${uuid}`;
    } catch {
      // Fallback to timestamp + random
    }
    return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Generate span ID
   */
  private static generateSpanId(): string {
    try {
      // Prefer crypto.randomUUID when available
      const uuid = globalThis.crypto?.randomUUID?.();
      if (uuid) return `span_${uuid}`;
    } catch {
      // Fallback to timestamp + random
    }
    return `span_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Generate alert ID
   */
  private static generateAlertId(): string {
    try {
      // Prefer crypto.randomUUID when available
      const uuid = globalThis.crypto?.randomUUID?.();
      if (uuid) return `alert_${uuid}`;
    } catch {
      // Fallback to timestamp + random
    }
    return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

// ============================================================================
// MONITORING UTILITIES
// ============================================================================

/**
 * Utility functions for monitoring operations
 */
export class MonitoringUtilities {
  /**
   * Create monitoring context
   */
  static createContext(
    operationName: string,
    additionalContext?: Partial<MonitoringContext>
  ): MonitoringContext {
    return {
      operationName,
      startTime: new Date(),
      ...additionalContext,
    };
  }

  /**
   * Format duration in human readable format
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
  }

  /**
   * Format memory usage in human readable format
   */
  static formatMemory(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Calculate success rate
   */
  static calculateSuccessRate(successful: number, total: number): number {
    return total > 0 ? successful / total : 0;
  }

  /**
   * Calculate average
   */
  static calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  /**
   * Calculate percentile
   */
  static calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const p = Math.max(0, Math.min(100, percentile));
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] ?? 0;
  }
}

// ============================================================================
// EXPORTER IMPLEMENTATIONS (OPTIONAL)
// ============================================================================

/** Minimal Prometheus exporter that renders a text exposition snapshot. */
export class PrometheusTextExporter implements MetricsExporter {
  /** User can add custom histograms; we also read internal duration histograms. */
  private customHists: Histogram[] = [];
  constructor(private getInternalHists: () => Iterable<Histogram> = () => []) {}
  addHistogram(h: Histogram) { this.customHists.push(h); }
  private opsBuffer: OperationMetrics[] = [];
  exportOperations(metrics: OperationMetrics[]) { this.opsBuffer.push(...metrics); }
  exportSystem?(_system: SystemMetrics): void {
    // no-op; you can model cpu/mem as gauges if needed
  }
  exportAlerts?(_alerts: Alert[]): void {
    // you can render alerts as counters/gauges; omitted for brevity
  }
  flush?(): void { /* no-op */ }
  shutdown?(): void { /* no-op */ }
  /** Render a snapshot; does not clear histograms (they're cumulative). */
  render(): string {
    // Render duration histograms (internal + custom)
    const pieces: string[] = [];
    for (const h of this.getInternalHists()) pieces.push(h.render());
    for (const h of this.customHists) pieces.push(h.render());
    // Optional: simple counters for successes/failures per operation
    const successCount = new Map<string, number>();
    const failureCount = new Map<string, number>();
    for (const m of this.opsBuffer) {
      const map = m.success ? successCount : failureCount;
      map.set(m.operationName, (map.get(m.operationName) ?? 0) + 1);
    }
    pieces.push('# TYPE operation_success_total counter');
    for (const [op, c] of successCount.entries()) {
      pieces.push(`operation_success_total{operation="${op}"} ${c}`);
    }
    pieces.push('# TYPE operation_failure_total counter');
    for (const [op, c] of failureCount.entries()) {
      pieces.push(`operation_failure_total{operation="${op}"} ${c}`);
    }
    this.opsBuffer = []; // drain after rendering
    return pieces.join('\n') + '\n';
  }
}

/**
 * Minimal OTLP exporter skeleton (HTTP/JSON or gRPC would go here).
 * This demonstrates the shape; wire your transport in the TODOs.
 */
export class OTLPExporter implements MetricsExporter, TracingExporter {
  constructor(private _opts: { endpoint?: string; headers?: Record<string,string> } = {}) {
    // Store opts for future use
    void this._opts;
  }
  exportOperations(_metrics: OperationMetrics[]): void | Promise<void> {
    // TODO: Map OperationMetrics → OTLP Sum/Histogram/Exemplar as desired
    // Example (pseudo):
    // await fetch(`${this._opts.endpoint}/v1/metrics`, { method: 'POST', headers, body })
  }
  exportSystem?(_system: SystemMetrics): void | Promise<void> {
    // TODO: Map system gauges to OTLP
  }
  exportAlerts?(_alerts: Alert[]): void | Promise<void> {
    // TODO: Map alerts to OTLP logs or metrics
  }
  startSpan(_info: { operationName: string; traceId: string; spanId: string; parentSpanId?: string; startTime: Date; tags?: Record<string,string>; }): void | Promise<void> {
    // TODO: send span start to /v1/traces
  }
  endSpan(_info: { spanId: string; endTime: Date; duration: number; error?: Error; tags?: Record<string,string>; }): void | Promise<void> {
    // TODO: send span end/update to /v1/traces
  }
  flush?(): void | Promise<void> { /* no-op */ }
  shutdown?(): void | Promise<void> { /* no-op */ }
}
