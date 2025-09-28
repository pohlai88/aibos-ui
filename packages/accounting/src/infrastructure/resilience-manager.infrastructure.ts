import { Injectable, Logger } from '@nestjs/common';
import { omitUndefined } from '../utils';

// ============================================================================
// RESILIENCE INTERFACES
// ============================================================================

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  name?: string;
}

export interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier?: number;
  maxRetryDelay?: number;
}

export interface TimeoutOptions {
  timeoutMs: number;
  name?: string;
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface ResilienceMetrics {
  circuitBreakerState: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

// ============================================================================
// ENHANCED CIRCUIT BREAKER
// ============================================================================

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;
  private readonly name: string;

  constructor(
    private readonly options: CircuitBreakerOptions,
    private readonly logger?: Logger,
  ) {
    this.name = options.name || 'default';
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        const error = new Error(`Circuit breaker '${this.name}' is OPEN - operation rejected`);
        this.logger?.warn(`Circuit breaker '${this.name}' rejected operation`, {
          state: this.state,
          failureCount: this.failureCount,
          nextAttemptTime: new Date(this.nextAttemptTime),
        });
        throw error;
      }
      this.state = CircuitBreakerState.HALF_OPEN;
      this.logger?.log(`Circuit breaker '${this.name}' moved to HALF_OPEN state`);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.CLOSED;
      this.failureCount = 0;
      this.logger?.log(
        `Circuit breaker '${this.name}' moved to CLOSED state after successful operation`,
      );
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = Date.now() + this.options.recoveryTimeout;
      this.logger?.warn(`Circuit breaker '${this.name}' moved to OPEN state`, {
        failureCount: this.failureCount,
        threshold: this.options.failureThreshold,
        nextAttemptTime: new Date(this.nextAttemptTime),
      });
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  getSuccessCount(): number {
    return this.successCount;
  }

  getMetrics(): ResilienceMetrics {
    return omitUndefined({
      circuitBreakerState: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime) : undefined,
      nextAttemptTime: this.nextAttemptTime ? new Date(this.nextAttemptTime) : undefined,
    });
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
    this.logger?.log(`Circuit breaker '${this.name}' has been reset`);
  }
}

// ============================================================================
// RETRY STRATEGY
// ============================================================================

export class RetryStrategy {
  constructor(
    private readonly options: RetryOptions,
    private readonly logger?: Logger,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    let delay = this.options.retryDelay;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        this.logger?.debug(`Retry attempt ${attempt}/${this.options.maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.options.maxRetries) {
          this.logger?.error(`All retry attempts failed for operation`, {
            attempts: this.options.maxRetries,
            lastError: lastError.message,
          });
          throw lastError;
        }

        this.logger?.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: lastError.message,
          nextAttempt: attempt + 1,
        });

        await this.delay(delay);

        // Calculate next delay with backoff
        if (this.options.backoffMultiplier) {
          delay = Math.min(
            delay * this.options.backoffMultiplier,
            this.options.maxRetryDelay || delay * 10,
          );
        }
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// TIMEOUT STRATEGY
// ============================================================================

export class TimeoutStrategy {
  constructor(
    private readonly options: TimeoutOptions,
    private readonly logger?: Logger,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const error = new Error(
          `Operation '${this.options.name || 'unnamed'}' timed out after ${this.options.timeoutMs}ms`,
        );
        this.logger?.warn(`Operation timed out`, {
          name: this.options.name,
          timeoutMs: this.options.timeoutMs,
        });
        reject(error);
      }, this.options.timeoutMs);
    });

    return Promise.race([operation(), timeoutPromise]);
  }
}

// ============================================================================
// RESILIENCE MANAGER
// ============================================================================

/**
 * Centralized resilience management for all accounting operations
 * Provides circuit breakers, retry strategies, and timeout management
 */
@Injectable()
export class ResilienceManager {
  private readonly logger = new Logger(ResilienceManager.name);
  private readonly circuitBreakers = new Map<string, CircuitBreaker>();
  private readonly retryStrategies = new Map<string, RetryStrategy>();
  private readonly timeoutStrategies = new Map<string, TimeoutStrategy>();

  // ============================================================================
  // CIRCUIT BREAKER MANAGEMENT
  // ============================================================================

  /**
   * Get or create a circuit breaker for the specified operation
   */
  getCircuitBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    let circuitBreaker = this.circuitBreakers.get(name);

    if (!circuitBreaker) {
      const defaultOptions: CircuitBreakerOptions = {
        failureThreshold: 5,
        recoveryTimeout: 30000,
        monitoringPeriod: 60000,
        name,
        ...options,
      };

      circuitBreaker = new CircuitBreaker(defaultOptions, this.logger);
      this.circuitBreakers.set(name, circuitBreaker);

      this.logger.log(`Created circuit breaker '${name}'`, defaultOptions);
    }

    return circuitBreaker;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    name: string,
    operation: () => Promise<T>,
    options?: CircuitBreakerOptions,
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(name, options);
    return circuitBreaker.execute(operation);
  }

  /**
   * Get circuit breaker metrics
   */
  getCircuitBreakerMetrics(name: string): ResilienceMetrics | undefined {
    const circuitBreaker = this.circuitBreakers.get(name);
    return circuitBreaker?.getMetrics();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(name: string): void {
    const circuitBreaker = this.circuitBreakers.get(name);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  /**
   * Get all circuit breaker names
   */
  getCircuitBreakerNames(): string[] {
    return Array.from(this.circuitBreakers.keys());
  }

  // ============================================================================
  // RETRY STRATEGY MANAGEMENT
  // ============================================================================

  /**
   * Get or create a retry strategy for the specified operation
   */
  getRetryStrategy(name: string, options?: RetryOptions): RetryStrategy {
    let retryStrategy = this.retryStrategies.get(name);

    if (!retryStrategy) {
      const defaultOptions: RetryOptions = {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        maxRetryDelay: 10000,
        ...options,
      };

      retryStrategy = new RetryStrategy(defaultOptions, this.logger);
      this.retryStrategies.set(name, retryStrategy);

      this.logger.log(`Created retry strategy '${name}'`, defaultOptions);
    }

    return retryStrategy;
  }

  /**
   * Execute operation with retry strategy
   */
  async executeWithRetry<T>(
    name: string,
    operation: () => Promise<T>,
    options?: RetryOptions,
  ): Promise<T> {
    const retryStrategy = this.getRetryStrategy(name, options);
    return retryStrategy.execute(operation);
  }

  // ============================================================================
  // TIMEOUT STRATEGY MANAGEMENT
  // ============================================================================

  /**
   * Get or create a timeout strategy for the specified operation
   */
  getTimeoutStrategy(name: string, options?: TimeoutOptions): TimeoutStrategy {
    let timeoutStrategy = this.timeoutStrategies.get(name);

    if (!timeoutStrategy) {
      const defaultOptions: TimeoutOptions = {
        timeoutMs: 30000, // 30 seconds default
        name,
        ...options,
      };

      timeoutStrategy = new TimeoutStrategy(defaultOptions, this.logger);
      this.timeoutStrategies.set(name, timeoutStrategy);

      this.logger.log(`Created timeout strategy '${name}'`, defaultOptions);
    }

    return timeoutStrategy;
  }

  /**
   * Execute operation with timeout protection
   */
  async executeWithTimeout<T>(
    name: string,
    operation: () => Promise<T>,
    options?: TimeoutOptions,
  ): Promise<T> {
    const timeoutStrategy = this.getTimeoutStrategy(name, options);
    return timeoutStrategy.execute(operation);
  }

  // ============================================================================
  // COMBINED RESILIENCE STRATEGIES
  // ============================================================================

  /**
   * Execute operation with circuit breaker, retry, and timeout protection
   */
  async executeWithFullResilience<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: {
      circuitBreaker?: CircuitBreakerOptions;
      retry?: RetryOptions;
      timeout?: TimeoutOptions;
    } = {},
  ): Promise<T> {
    const { circuitBreaker, retry, timeout } = options;

    // First apply timeout
    const timeoutOperation = timeout
      ? () => this.executeWithTimeout(`${operationName}-timeout`, operation, timeout)
      : operation;

    // Then apply retry
    const retryOperation = retry
      ? () => this.executeWithRetry(`${operationName}-retry`, timeoutOperation, retry)
      : timeoutOperation;

    // Finally apply circuit breaker
    return this.executeWithCircuitBreaker(`${operationName}-cb`, retryOperation, circuitBreaker);
  }

  // ============================================================================
  // MONITORING AND METRICS
  // ============================================================================

  /**
   * Get comprehensive resilience metrics
   */
  getAllMetrics(): {
    circuitBreakers: Record<string, ResilienceMetrics>;
    totalOperations: number;
    activeCircuitBreakers: number;
  } {
    const circuitBreakers: Record<string, ResilienceMetrics> = {};
    let totalOperations = 0;
    let activeCircuitBreakers = 0;

    for (const [name, circuitBreaker] of this.circuitBreakers) {
      const metrics = circuitBreaker.getMetrics();
      circuitBreakers[String(name)] = metrics;
      totalOperations += metrics.failureCount + metrics.successCount;

      if (metrics.circuitBreakerState !== CircuitBreakerState.CLOSED) {
        activeCircuitBreakers++;
      }
    }

    return {
      circuitBreakers,
      totalOperations,
      activeCircuitBreakers,
    };
  }

  /**
   * Health check for resilience infrastructure
   */
  getHealthStatus(): {
    healthy: boolean;
    issues: string[];
    metrics: ReturnType<ResilienceManager['getAllMetrics']>;
  } {
    const metrics = this.getAllMetrics();
    const issues: string[] = [];

    // Check for open circuit breakers
    for (const [name, circuitBreakerMetrics] of Object.entries(metrics.circuitBreakers)) {
      if (circuitBreakerMetrics.circuitBreakerState === CircuitBreakerState.OPEN) {
        issues.push(`Circuit breaker '${name}' is OPEN`);
      }
    }

    // Check for high failure rates
    const totalFailures = Object.values(metrics.circuitBreakers).reduce(
      (sum, m) => sum + m.failureCount,
      0,
    );
    const totalSuccesses = Object.values(metrics.circuitBreakers).reduce(
      (sum, m) => sum + m.successCount,
      0,
    );

    if (totalFailures > 0 && totalSuccesses > 0) {
      const failureRate = totalFailures / (totalFailures + totalSuccesses);
      if (failureRate > 0.5) {
        issues.push(`High failure rate detected: ${(failureRate * 100).toFixed(1)}%`);
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
      metrics,
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    for (const [name, circuitBreaker] of this.circuitBreakers) {
      circuitBreaker.reset();
      this.logger.log(`Reset circuit breaker '${name}'`);
    }
  }
}
