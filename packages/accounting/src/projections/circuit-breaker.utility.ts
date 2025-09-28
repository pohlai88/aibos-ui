import { ResilienceManager } from '../infrastructure/resilience-manager.infrastructure';
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { omitUndefined } from '../utils';

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  successCount: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  successThreshold: number;
  monitoringPeriod: number;
}

export interface ProjectionHealthMetrics {
  projectionName: string;
  lastProcessedEventId: string;
  lastProcessedAt: Date;
  lagSeconds: number;
  errorRate: number;
  throughput: number;
  circuitBreakerState: CircuitBreakerState;
}

export class CircuitBreakerOpenError extends Error {
  constructor(
    public projectionName: string,
    public nextAttemptTime: Date,
  ) {
    super(
      `Circuit breaker is OPEN for projection ${projectionName}. Next attempt at ${nextAttemptTime.toISOString()}`,
    );
    this.name = 'CircuitBreakerOpenError';
  }
}

export class ProjectionCircuitBreakerError extends Error {
  constructor(
    message: string,
    public projectionName: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'ProjectionCircuitBreakerError';
  }
}

/**
 * Circuit Breaker for Projection Resilience
 *
 * Provides fault tolerance for projection processing by implementing circuit breaker pattern.
 * Prevents cascading failures and provides automatic recovery mechanisms.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is open, requests are rejected
 * - HALF_OPEN: Testing if service has recovered
 *
 * Features:
 * - Automatic failure detection
 * - Configurable thresholds
 * - Health monitoring
 * - Recovery testing
 * - Metrics collection
 */
@Injectable()
export class ProjectionCircuitBreaker {
  private readonly logger = new Logger(ProjectionCircuitBreaker.name);
  private readonly circuitStates = new Map<string, CircuitBreakerState>();
  private readonly config: CircuitBreakerConfig;
  private readonly resilienceManager: ResilienceManager;

  constructor(resilienceManager: ResilienceManager) {
    this.resilienceManager = resilienceManager;
    this.config = {
      failureThreshold: 5, // Open circuit after 5 failures
      recoveryTimeout: 30000, // 30 seconds
      successThreshold: 3, // Close circuit after 3 successes
      monitoringPeriod: 60000, // 1 minute
    };
  }

  /**
   * Execute operation with circuit breaker protection using shared resilience manager
   */
  async execute<T>(
    projectionName: string,
    operation: () => Promise<T>,
    correlationId?: string,
  ): Promise<T> {
    const opCorrelationId = correlationId || randomUUID();

    this.logger.debug(`Executing operation for projection ${projectionName}`, {
      correlationId: opCorrelationId,
    });

    try {
      // Use shared resilience manager for circuit breaker protection
      const result = await this.resilienceManager.executeWithCircuitBreaker(
        `projection-${projectionName}`,
        operation,
        {
          failureThreshold: this.config.failureThreshold,
          recoveryTimeout: this.config.recoveryTimeout,
          monitoringPeriod: this.config.monitoringPeriod,
          name: projectionName,
        },
      );

      this.logger.debug(`Operation successful for projection ${projectionName}`, {
        correlationId: opCorrelationId,
      });

      return result;
    } catch (error) {
      this.logger.warn(`Operation failed for projection ${projectionName}`, {
        error: error instanceof Error ? error.message : String(error),
        correlationId: opCorrelationId,
      });

      throw new ProjectionCircuitBreakerError(
        `Projection ${projectionName} operation failed`,
        projectionName,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Get current circuit breaker state for a projection
   */
  getCircuitState(projectionName: string): CircuitBreakerState {
    if (!this.circuitStates.has(projectionName)) {
      this.circuitStates.set(projectionName, {
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
      });
    }
    return this.circuitStates.get(projectionName)!;
  }

  /**
   * Get health metrics for all projections
   */
  getHealthMetrics(): ProjectionHealthMetrics[] {
    const metrics: ProjectionHealthMetrics[] = [];

    for (const [projectionName, state] of this.circuitStates) {
      metrics.push({
        projectionName,
        lastProcessedEventId: 'unknown', // Would be tracked in real implementation
        lastProcessedAt: new Date(),
        lagSeconds: 0, // Would be calculated in real implementation
        errorRate: this.calculateErrorRate(projectionName),
        throughput: 0, // Would be calculated in real implementation
        circuitBreakerState: { ...state },
      });
    }

    return metrics;
  }

  /**
   * Reset circuit breaker for a projection
   */
  resetCircuitBreaker(projectionName: string): void {
    this.logger.log(`Resetting circuit breaker for projection ${projectionName}`);
    this.circuitStates.set(projectionName, {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
    });
  }

  /**
   * Update circuit breaker configuration
   */
  updateConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.log('Circuit breaker configuration updated', { config: this.config });
  }

  private onSuccess(projectionName: string, correlationId: string): void {
    const state = this.getCircuitState(projectionName);

    if (state.state === 'HALF_OPEN') {
      state.successCount++;
      this.logger.debug(`Success in HALF_OPEN state for projection ${projectionName}`, {
        successCount: state.successCount,
        correlationId,
      });

      if (state.successCount >= this.config.successThreshold) {
        this.transitionToClosed(projectionName);
      }
    } else if (state.state === 'CLOSED') {
      // Reset failure count on success
      state.failureCount = 0;
    }

    this.logger.debug(`Operation successful for projection ${projectionName}`, {
      state: state.state,
      correlationId,
    });
  }

  private onFailure(projectionName: string, error: unknown, correlationId: string): void {
    const state = this.getCircuitState(projectionName);

    state.failureCount++;
    state.lastFailureTime = new Date();

    this.logger.warn(`Operation failed for projection ${projectionName}`, {
      failureCount: state.failureCount,
      error: error instanceof Error ? error.message : String(error),
      correlationId,
    });

    if (state.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN state opens the circuit
      this.transitionToOpen(projectionName);
    } else if (state.state === 'CLOSED' && state.failureCount >= this.config.failureThreshold) {
      this.transitionToOpen(projectionName);
    }
  }

  private transitionToOpen(projectionName: string): void {
    const state = this.getCircuitState(projectionName);
    state.state = 'OPEN';
    state.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);

    this.logger.warn(`Circuit breaker opened for projection ${projectionName}`, {
      failureCount: state.failureCount,
      nextAttemptTime: state.nextAttemptTime,
    });

    // Emit circuit breaker opened event
    this.emitCircuitBreakerEvent('circuit_opened', projectionName, state);
  }

  private transitionToHalfOpen(projectionName: string): void {
    const state = this.getCircuitState(projectionName);
    state.state = 'HALF_OPEN';
    state.successCount = 0;

    this.logger.log(`Circuit breaker transitioned to HALF_OPEN for projection ${projectionName}`);

    // Emit circuit breaker half-open event
    this.emitCircuitBreakerEvent('circuit_half_open', projectionName, state);
  }

  private transitionToClosed(projectionName: string): void {
    const state = this.getCircuitState(projectionName);
    state.state = 'CLOSED';
    state.failureCount = 0;
    state.successCount = 0;

    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanState = omitUndefined({
      lastFailureTime: undefined,
      nextAttemptTime: undefined,
    });

    state.lastFailureTime = cleanState.lastFailureTime;
    state.nextAttemptTime = cleanState.nextAttemptTime;

    this.logger.log(`Circuit breaker closed for projection ${projectionName}`);

    // Emit circuit breaker closed event
    this.emitCircuitBreakerEvent('circuit_closed', projectionName, state);
  }

  private shouldAttemptRecovery(state: CircuitBreakerState): boolean {
    if (!state.nextAttemptTime) return false;
    return Date.now() >= state.nextAttemptTime.getTime();
  }

  private calculateErrorRate(projectionName: string): number {
    const state = this.getCircuitState(projectionName);
    // In a real implementation, this would calculate error rate over time
    return state.failureCount / Math.max(state.failureCount + state.successCount, 1);
  }

  private emitCircuitBreakerEvent(
    eventType: string,
    projectionName: string,
    state: CircuitBreakerState,
  ): void {
    // In a real implementation, this would emit events to an event bus
    this.logger.debug(`Circuit breaker event: ${eventType}`, {
      projectionName,
      state: state.state,
      failureCount: state.failureCount,
      successCount: state.successCount,
    });
  }
}

/**
 * Decorator for automatic circuit breaker protection
 * Note: This decorator creates a new instance for each method.
 * For better performance, inject ResilienceManager into your service instead.
 */
export function WithCircuitBreaker(projectionName: string) {
  return function (
    target: unknown,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const method = descriptor.value;
    const resilienceManager = new ResilienceManager();
    const circuitBreaker = new ProjectionCircuitBreaker(resilienceManager);

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      return circuitBreaker.execute(projectionName, () => method.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Health check service for projections
 */
@Injectable()
export class ProjectionHealthService {
  private readonly logger = new Logger(ProjectionHealthService.name);
  private readonly circuitBreaker: ProjectionCircuitBreaker;
  private readonly resilienceManager: ResilienceManager;

  constructor(resilienceManager: ResilienceManager) {
    this.resilienceManager = resilienceManager;
    this.circuitBreaker = new ProjectionCircuitBreaker(resilienceManager);
  }

  /**
   * Check health of all projections
   */
  async checkProjectionHealth(): Promise<{
    healthy: ProjectionHealthMetrics[];
    unhealthy: ProjectionHealthMetrics[];
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const metrics = this.circuitBreaker.getHealthMetrics();
    const healthy: ProjectionHealthMetrics[] = [];
    const unhealthy: ProjectionHealthMetrics[] = [];

    for (const metric of metrics) {
      if (this.isProjectionHealthy(metric)) {
        healthy.push(metric);
      } else {
        unhealthy.push(metric);
      }
    }

    const overallHealth = this.determineOverallHealth(healthy, unhealthy);

    this.logger.log('Projection health check completed', {
      total: metrics.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      overallHealth,
    });

    return { healthy, unhealthy, overallHealth };
  }

  private isProjectionHealthy(metric: ProjectionHealthMetrics): boolean {
    return (
      metric.circuitBreakerState.state === 'CLOSED' &&
      metric.errorRate < 0.1 && // Less than 10% error rate
      metric.lagSeconds < 60 // Less than 1 minute lag
    );
  }

  private determineOverallHealth(
    healthy: ProjectionHealthMetrics[],
    unhealthy: ProjectionHealthMetrics[],
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const total = healthy.length + unhealthy.length;
    const healthyRatio = healthy.length / total;

    if (healthyRatio >= 0.9) return 'healthy';
    if (healthyRatio >= 0.7) return 'degraded';
    return 'unhealthy';
  }
}
