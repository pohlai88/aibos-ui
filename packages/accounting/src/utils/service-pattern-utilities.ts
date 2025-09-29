/**
 * Service Pattern Utilities - Phase 2 Implementation
 * 
 * Provides standardized service base classes and patterns for consistent
 * error handling, logging, performance monitoring, and business rule validation.
 * 
 * Features:
 * - Abstract ServiceBase class with common patterns
 * - Standardized error handling and logging
 * - Performance monitoring integration
 * - Circuit breaker pattern
 * - Business rule validation helpers
 * - Required field validation
 */

import { Logger } from '@nestjs/common';
import { 
  createBusinessError, 
  createValidationError,
  type ErrorContext,
  BusinessRuleError,
  ValidationError
} from './error-utilities';
import { 
  createProfiler,
  PerformanceProfiler,
  PerformanceTimer
} from './performance-utilities';
import { CircuitBreaker, CircuitBreakerState } from '../infrastructure/circuit-breaker.infrastructure';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ServiceOptions {
  enableCircuitBreaker?: boolean;
  enablePerformanceMonitoring?: boolean;
  circuitBreakerOptions?: {
    failureThreshold?: number;
    recoveryTimeout?: number;
    monitoringPeriod?: number;
  };
  performanceOptions?: {
    sampleRate?: number;
    maxSamples?: number;
    includeMemory?: boolean;
  };
}

export interface OperationContext extends ErrorContext {
  operation?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

// ============================================================================
// INTERNAL NO-OPS (respect feature flags cleanly)
// ============================================================================
class NoopTimer extends PerformanceTimer {
  constructor(operation: string = 'noop') {
    super(operation);
  }
  
  override end(): void {/* no-op */}
}

class NoopProfiler extends PerformanceProfiler {
  constructor() {
    super({});
  }
  
  override startTimer(op: string): PerformanceTimer { return new NoopTimer(op); }
  override getMetrics() { return { totalSamples: 0, averageDuration: 0, minDuration: 0, maxDuration: 0, p95Duration: 0, p99Duration: 0, operations: {} }; }
}

class PassThroughCircuitBreaker {
  async execute<T>(fn: () => Promise<T>): Promise<T> { return fn(); }
  getState(): 'closed' | 'open' | 'half-open' { return 'closed'; }
  reset(): void {/* no-op */}
}

function toLogCtx(ctx?: ErrorContext | Record<string, unknown>): string | undefined {
  if (!ctx) return undefined;
  try { return JSON.stringify(ctx); } catch { return String(ctx); }
}

function nowMsMonotonic(): number {
  // Prefer monotonic, high-resolution clock to avoid wallclock skew
  const p = (globalThis as unknown)?.performance?.now?.();
  if (typeof p === 'number' && Number.isFinite(p)) return p;
  return Date.now();
}

// ============================================================================
// ABSTRACT SERVICE BASE CLASS
// ============================================================================

/**
 * Abstract base class for all accounting services
 * Provides standardized patterns for error handling, logging, and monitoring
 */
export abstract class ServiceBase {
  protected readonly logger: Logger;
  protected readonly profiler: PerformanceProfiler;
  protected readonly circuitBreaker: CircuitBreaker | PassThroughCircuitBreaker;
  protected readonly serviceName: string;
  private readonly perfEnabled: boolean;
  private readonly cbEnabled: boolean;

  constructor(serviceName: string, options: ServiceOptions = {}) {
    this.serviceName = serviceName;
    this.logger = new Logger(serviceName);
    this.perfEnabled = options.enablePerformanceMonitoring ?? true;
    this.cbEnabled = options.enableCircuitBreaker ?? true;

    // Initialize performance profiler (or noop)
    this.profiler = this.perfEnabled
      ? createProfiler({
          sampleRate: options.performanceOptions?.sampleRate ?? 0.1,
          maxSamples: options.performanceOptions?.maxSamples ?? 1000,
          includeMemory: options.performanceOptions?.includeMemory ?? true
        })
      : new NoopProfiler();

    // Initialize circuit breaker (or pass-through)
    this.circuitBreaker = this.cbEnabled
      ? new CircuitBreaker({
          failureThreshold: options.circuitBreakerOptions?.failureThreshold ?? 5,
          recoveryTimeout: options.circuitBreakerOptions?.recoveryTimeout ?? 30000,
          monitoringPeriod: options.circuitBreakerOptions?.monitoringPeriod ?? 60000,
        })
      : new PassThroughCircuitBreaker();
  }

  // ============================================================================
  // EXECUTION WITH ERROR HANDLING
  // ============================================================================

  /**
   * Execute an operation with standardized error handling, logging, and monitoring
   */
  protected async executeWithErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T> {
    const timer = this.profiler.startTimer(operation);
    const operationContext: OperationContext = {
      ...context,
      operation,
      startTime: new Date()
    };

    try {
      // Optional cooperative cancellation if caller passed a signal in context
      const signal = (context as unknown)?.signal as AbortSignal | { aborted: boolean } | undefined;
      if (signal?.aborted) {
        throw createBusinessError(
          'OPERATION_ABORTED',
          `${operation} aborted${(signal as unknown)?.reason ? `: ${(signal as unknown).reason}` : ''}`,
          this.serviceName,
          operationContext
        );
      }

      this.logger.debug(`Starting ${operation}`, toLogCtx(operationContext));
      const t0 = nowMsMonotonic();
      const result = await this.circuitBreaker.execute(fn);
      timer.end();
      operationContext.endTime = new Date();
      operationContext.duration = Math.max(0, nowMsMonotonic() - t0);
      this.logger.debug(`Completed ${operation}`, toLogCtx(operationContext));
      return result;
    } catch (error) {
      timer.end();
      operationContext.endTime = new Date();
      if (!operationContext.startTime) operationContext.startTime = new Date(operationContext.endTime.getTime());
      operationContext.duration = Math.max(
        0,
        operationContext.duration ??
          (operationContext.endTime.getTime() - operationContext.startTime!.getTime())
      );
      this.logger.error(`${operation} failed (cb=${this.getCircuitBreakerStatus()})`, (error as Error)?.stack, this.serviceName);
      this.logger.debug(`Context for ${operation} failure`, toLogCtx(operationContext));
      throw this.enhanceError(error as Error, operation, operationContext);
    }
  }

  /**
   * Execute a synchronous operation with error handling
   */
  protected executeSyncWithErrorHandling<T>(
    operation: string,
    fn: () => T,
    context?: ErrorContext
  ): T {
    const timer = this.profiler.startTimer(operation);
    const operationContext: OperationContext = {
      ...context,
      operation,
      startTime: new Date()
    };

    try {
      this.logger.debug(`Starting ${operation}`, toLogCtx(operationContext));
      const t0 = nowMsMonotonic();
      const result = fn();
      timer.end();
      operationContext.endTime = new Date();
      operationContext.duration = Math.max(0, nowMsMonotonic() - t0);
      this.logger.debug(`Completed ${operation}`, toLogCtx(operationContext));
      return result;
    } catch (error) {
      timer.end();
      operationContext.endTime = new Date();
      if (!operationContext.startTime) operationContext.startTime = new Date(operationContext.endTime.getTime());
      operationContext.duration = Math.max(
        0,
        operationContext.endTime.getTime() - operationContext.startTime!.getTime()
      );
      this.logger.error(`${operation} failed (cb=${this.getCircuitBreakerStatus()})`, (error as Error)?.stack, this.serviceName);
      this.logger.debug(`Context for ${operation} failure`, toLogCtx(operationContext));
      throw this.enhanceError(error as Error, operation, operationContext);
    }
  }

  // ============================================================================
  // BUSINESS RULE VALIDATION
  // ============================================================================

  /**
   * Validate a business rule and throw a standardized business error if it fails
   */
  protected validateBusinessRule(
    condition: boolean,
    errorCode: string,
    message: string,
    context?: ErrorContext
  ): void {
    if (!condition) {
      throw createBusinessError(
        errorCode,
        message,
        this.serviceName,
        context
      );
    }
  }

  /**
   * Validate that a required field is not null or undefined
   */
  protected validateRequired<T>(
    value: T | null | undefined,
    fieldName: string,
    context?: ErrorContext
  ): T {
    if (value === null || value === undefined) {
      throw createValidationError(
        fieldName,
        `${fieldName} is required`,
        value,
        context
      );
    }
    return value;
  }

  /**
   * Validate that a string field is not empty
   */
  protected validateNonEmptyString(
    value: string | null | undefined,
    fieldName: string,
    context?: ErrorContext
  ): string {
    const validated = this.validateRequired(value, fieldName, context);
    if (validated.trim().length === 0) {
      throw createValidationError(
        fieldName,
        `${fieldName} cannot be empty`,
        value,
        context
      );
    }
    return validated;
  }

  /**
   * Validate that a number is within a specified range
   */
  protected validateNumberRange(
    value: number,
    fieldName: string,
    min: number,
    max: number,
    context?: ErrorContext
  ): number {
    if (value < min || value > max) {
      throw createValidationError(
        fieldName,
        `${fieldName} must be between ${min} and ${max}`,
        value,
        context
      );
    }
    return value;
  }

  /**
   * Validate that an array is not empty
   */
  protected validateNonEmptyArray<T>(
    value: T[] | null | undefined,
    fieldName: string,
    context?: ErrorContext
  ): T[] {
    const validated = this.validateRequired(value, fieldName, context);
    if (validated.length === 0) {
      throw createValidationError(
        fieldName,
        `${fieldName} cannot be empty`,
        value,
        context
      );
    }
    return validated;
  }

  // ============================================================================
  // ERROR ENHANCEMENT
  // ============================================================================

  /**
   * Enhance an error with additional context and service information
   */
  protected enhanceError(
    error: Error,
    operation: string,
    context?: ErrorContext
  ): Error {
    // If it's already a business or validation error, just add context (duck-typed)
    const e: unknown = error;
    const isKnown =
      error instanceof BusinessRuleError ||
      error instanceof ValidationError ||
      (e && typeof e === 'object' && typeof e.name === 'string' &&
        (e.name === 'BusinessRuleError' || e.name === 'ValidationError' || typeof e.code === 'string'));
    if (isKnown) {
      if (context) (error as unknown).context = { ...(error as unknown).context, ...context };
      return error;
    }

    // For other errors, wrap them in a business error
    return createBusinessError(
      'OPERATION_FAILED',
      `${operation} failed: ${error.message}`,
      this.serviceName,
      context
    );
  }

  // ============================================================================
  // LOGGING HELPERS
  // ============================================================================

  /**
   * Log an operation start
   */
  protected logOperationStart(operation: string, context?: ErrorContext): void {
    this.logger.debug(`Starting ${operation}`, toLogCtx(context));
  }

  /**
   * Log an operation completion
   */
  protected logOperationComplete(operation: string, context?: ErrorContext): void {
    this.logger.debug(`Completed ${operation}`, toLogCtx(context));
  }

  /**
   * Log a warning with context
   */
  protected logWarning(message: string, context?: ErrorContext): void {
    this.logger.warn(`${message} ${toLogCtx(context) ?? ''}`.trim());
  }

  /**
   * Log an error with context
   */
  protected logError(message: string, error: Error, context?: ErrorContext): void {
    this.logger.error(message, error?.stack, this.serviceName);
    if (context) this.logger.debug(`Error context`, toLogCtx(context));
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  /**
   * Start a performance timer for an operation
   */
  protected startTimer(operation: string): PerformanceTimer {
    return this.profiler.startTimer(operation);
  }

  /**
   * Get performance metrics for the service
   */
  protected getPerformanceMetrics(): unknown {
    return this.profiler.getMetrics();
  }

  // ============================================================================
  // CIRCUIT BREAKER
  // ============================================================================

  /**
   * Get circuit breaker status
   */
  protected getCircuitBreakerStatus(): 'closed' | 'open' | 'half-open' {
    const state = this.circuitBreaker.getState();
    if (typeof state === 'string') return state as 'closed' | 'open' | 'half-open';
    // Convert enum to string
    switch (state) {
      case CircuitBreakerState.CLOSED: return 'closed';
      case CircuitBreakerState.OPEN: return 'open';
      case CircuitBreakerState.HALF_OPEN: return 'half-open';
      default: return 'closed';
    }
  }

  /**
   * Reset circuit breaker
   */
  protected resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
}

// ============================================================================
// CONCRETE SERVICE IMPLEMENTATIONS
// ============================================================================

/**
 * Base class for domain services
 */
export abstract class DomainServiceBase extends ServiceBase {
  constructor(serviceName: string, options: ServiceOptions = {}) {
    super(serviceName, {
      ...options,
      enableCircuitBreaker: options.enableCircuitBreaker ?? true,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true
    });
  }
}

/**
 * Base class for application services
 */
export abstract class ApplicationServiceBase extends ServiceBase {
  constructor(serviceName: string, options: ServiceOptions = {}) {
    super(serviceName, {
      ...options,
      enableCircuitBreaker: options.enableCircuitBreaker ?? true,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true
    });
  }
}

/**
 * Base class for infrastructure services
 */
export abstract class InfrastructureServiceBase extends ServiceBase {
  constructor(serviceName: string, options: ServiceOptions = {}) {
    super(serviceName, {
      ...options,
      enableCircuitBreaker: options.enableCircuitBreaker ?? false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true
    });
  }
}
