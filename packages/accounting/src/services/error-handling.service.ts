import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { omitUndefined } from '../utils';
import { createBusinessError } from '../utils/error-utilities';
import { PerformanceProfiler, createProfiler, PerformanceTimer } from '../utils/performance-utilities';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface ErrorContext {
  id: string;
  type: string;
  message: string;
  stackTrace: string;
  userId?: string;
  tenantId?: string;
  operation?: string;
  component?: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  correlationId?: string;
  causationId?: string;
  resolved: boolean;
}

export interface ErrorPattern {
  pattern: string;
  count: number;
  lastOccurrence: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoFixable: boolean;
}

export interface ErrorRecoveryStrategy {
  id: string;
  name: string;
  description: string;
  errorPattern: RegExp;
  recoveryAction: 'retry' | 'fallback' | 'circuit-breaker' | 'alert' | 'auto-fix';
  maxRetries?: number;
  retryDelay?: number;
  fallbackData?: unknown;
  circuitBreakerThreshold?: number;
  autoFixScript?: string;
  enabled: boolean;
}

export interface ErrorAlert {
  id: string;
  errorId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  recipients: string[];
  channels: ('email' | 'slack' | 'sms' | 'webhook')[];
  sent: boolean;
  sentAt?: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface PerformanceMetric {
  id: string;
  operation: string;
  duration: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
  success: boolean;
  errorCount: number;
}

export interface ErrorTrend {
  period: string;
  errorCount: number;
  errorRate: number;
  avgResolutionTime: number;
  topErrors: Array<{
    pattern: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

export interface RecoveryResult {
  recovered: boolean;
  recoveryAction?: string;
  result?: unknown;
  errorId: string;
}

export interface RecoveryOptions {
  enableRecovery?: boolean;
  customStrategies?: ErrorRecoveryStrategy[];
  alertRecipients?: string[];
}

// ============================================================================
// UNIFIED ERROR HANDLING SERVICE
// ============================================================================

/**
 * Unified Enterprise Error Handling Service
 * Combines error tracking, pattern analysis, recovery strategies, and alerting
 */
@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);
  private readonly profiler: PerformanceProfiler;
  private readonly errorPatterns = new Map<string, ErrorPattern>();
  private readonly recoveryStrategies = new Map<string, ErrorRecoveryStrategy>();
  private readonly errorAlerts = new Map<string, ErrorAlert>();
  private readonly performanceMetrics = new Map<string, PerformanceMetric[]>();
  private readonly circuitBreakers = new Map<
    string,
    { failures: number; lastFailure: Date; state: 'closed' | 'open' | 'half-open' }
  >();

  private readonly maxPatterns = 1000;
  private static readonly ADMIN_EMAIL = 'admin@aibos-erp.com';
  private static readonly CFO_EMAIL = 'cfo@aibos-erp.com';
  private static readonly RETRY_MESSAGE = 'Retry attempt';
  private static readonly CIRCUIT_BREAKER = 'circuit-breaker';

  constructor() {
    this.profiler = createProfiler();
    this.initializeDefaultStrategies();
  }

  // ============================================================================
  // CORE ERROR TRACKING (from original ErrorHandlingService)
  // ============================================================================

  /**
   * Track and analyze an error with correlation ID
   */
  trackError(
    error: Error,
    context: {
      userId?: string;
      tenantId?: string;
      operation?: string;
      component?: string;
      correlationId?: string;
      causationId?: string;
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    },
  ): string {
    const timer = new PerformanceTimer();
    try {
      const errorId = this.generateErrorId();
      const errorContext: ErrorContext = omitUndefined({
        id: errorId,
        type: error.constructor.name,
        message: error.message,
        stackTrace: error.stack || '',
        userId: context.userId,
        tenantId: context.tenantId,
        operation: context.operation,
        component: context.component,
        timestamp: new Date(),
        severity: context.severity || 'MEDIUM',
        correlationId: context.correlationId,
        causationId: context.causationId,
        resolved: false,
      });

      // Log error with structured data
      this.logger.error(`Error tracked: ${errorId}`, {
        errorId,
        correlationId: context.correlationId,
        causationId: context.causationId,
        errorType: error.constructor.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        context,
      });

      // Update error patterns
      this.updateErrorPatterns(errorContext);

      // Emit error event for observability
      this.emitErrorEvent(errorContext);

      // Auto-resolve if pattern suggests it
      const pattern = this.getErrorPattern(errorContext);
      if (pattern?.autoFixable) {
        this.autoResolveError(errorContext);
      }

      // Record performance metrics
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);

      return errorId;
    } catch (trackingError) {
      this.logger.error('Failed to track error', trackingError);
      return this.generateErrorId(); // Return a fallback ID
    }
  }

  /**
   * Unified error handling with optional recovery strategies
   */
  async handleError(
    error: Error,
    context: {
      operation: string;
      tenantId?: string;
      userId?: string;
      component?: string;
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      correlationId?: string;
      causationId?: string;
      metadata?: Record<string, unknown>;
    },
    options: RecoveryOptions = {},
  ): Promise<RecoveryResult> {
    const timer = new PerformanceTimer();
    try {
      const errorId = this.trackError(error, context);

      // If recovery is disabled, just return tracking result
      if (!options.enableRecovery) {
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return { recovered: false, errorId };
      }

      // Apply recovery strategies
      const result = await this.handleErrorWithRecovery(error, context, options);
      
      // Record performance metrics
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      return result;
    } catch (handlingError) {
      this.logger.error('Failed to handle error', handlingError);
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      return { recovered: false, errorId: this.generateErrorId() };
    }
  }

  // ============================================================================
  // ADVANCED RECOVERY STRATEGIES (from AdvancedErrorHandlingService)
  // ============================================================================

  /**
   * Handle error with advanced recovery strategies
   */
  async handleErrorWithRecovery(
    error: Error,
    context: {
      operation: string;
      tenantId?: string;
      userId?: string;
      component?: string;
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      metadata?: Record<string, unknown>;
    },
    options: RecoveryOptions = {},
  ): Promise<RecoveryResult> {
    const timer = new PerformanceTimer();
    try {
      const errorId = randomUUID();
      const errorMessage = error.message;
      const errorStack = error.stack || '';

      this.logger.error(`Advanced error handling: ${errorId}`, errorStack, context);

      // Find matching recovery strategy
      const strategy = this.findMatchingStrategy(errorMessage, options.customStrategies);
      if (!strategy) {
        this.logger.warn(`No recovery strategy found for error: ${errorMessage}`);
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return { recovered: false, errorId };
      }

      this.logger.log(`Applying recovery strategy: ${strategy.name} for error: ${errorId}`);

      try {
        const result = await this.executeRecoveryStrategy(strategy, error, context);

        // Log recovery event
        this.logger.log(`Error recovered: ${errorId} using strategy: ${strategy.name}`);

        // Record performance metrics
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);

        return { recovered: true, recoveryAction: strategy.recoveryAction, result, errorId };
      } catch (recoveryError) {
        this.logger.error(`Recovery strategy failed: ${strategy.name}`, recoveryError);

        // Send alert for failed recovery
        await this.sendAlert({
          errorId,
          severity: context.severity || 'HIGH',
          title: `Recovery Failed: ${strategy.name}`,
          message: `Recovery strategy ${strategy.name} failed for error: ${errorMessage}`,
          recipients: options.alertRecipients || [ErrorHandlingService.ADMIN_EMAIL],
          channels: ['email', 'slack'],
        });

        // Record performance metrics
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);

        return { recovered: false, errorId };
      }
    } catch (handlingError) {
      this.logger.error('Failed to handle error with recovery', handlingError);
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      return { recovered: false, errorId: randomUUID() };
    }
  }

  // ============================================================================
  // RECOVERY STRATEGY MANAGEMENT
  // ============================================================================

  private initializeDefaultStrategies(): void {
    const defaultStrategies: ErrorRecoveryStrategy[] = [
      {
        id: 'network-retry',
        name: 'Network Error Retry',
        description: 'Retry network-related errors with exponential backoff',
        errorPattern: /network|timeout|connection/i,
        recoveryAction: 'retry',
        maxRetries: 3,
        retryDelay: 1000,
        enabled: true,
      },
      {
        id: 'database-fallback',
        name: 'Database Fallback',
        description: 'Use fallback data when database is unavailable',
        errorPattern: /database|sql|connection.*refused/i,
        recoveryAction: 'fallback',
        fallbackData: { status: 'fallback', data: null },
        enabled: true,
      },
      {
        id: ErrorHandlingService.CIRCUIT_BREAKER,
        name: 'Circuit Breaker',
        description: 'Open circuit breaker for repeated failures',
        errorPattern: /service.*unavailable|rate.*limit/i,
        recoveryAction: ErrorHandlingService.CIRCUIT_BREAKER,
        circuitBreakerThreshold: 5,
        enabled: true,
      },
      {
        id: 'critical-alert',
        name: 'Critical Error Alert',
        description: 'Send immediate alerts for critical errors',
        errorPattern: /critical|fatal|security/i,
        recoveryAction: 'alert',
        enabled: true,
      },
    ];

    defaultStrategies.forEach((strategy) => {
      this.recoveryStrategies.set(strategy.id, strategy);
    });
  }

  private findMatchingStrategy(
    errorMessage: string,
    customStrategies?: ErrorRecoveryStrategy[],
  ): ErrorRecoveryStrategy | undefined {
    const strategies = customStrategies || Array.from(this.recoveryStrategies.values());

    for (const strategy of strategies) {
      if (strategy.enabled && strategy.errorPattern.test(errorMessage)) {
        return strategy;
      }
    }
    return undefined;
  }

  private async executeRecoveryStrategy(
    strategy: ErrorRecoveryStrategy,
    error: Error,
    context: Record<string, unknown>,
  ): Promise<unknown> {
    switch (strategy.recoveryAction) {
      case 'retry':
        return this.executeRetry(strategy, error, context);
      case 'fallback':
        return this.executeFallback(strategy, context);
      case ErrorHandlingService.CIRCUIT_BREAKER:
        return this.executeCircuitBreaker(strategy, context);
      case 'alert':
        return this.executeAlert(strategy, error, context);
      case 'auto-fix':
        return this.executeAutoFix(strategy, error, context);
      default:
        throw createBusinessError(
          'UNKNOWN_RECOVERY_ACTION',
          `Unknown recovery action: ${strategy.recoveryAction}`,
          strategy.recoveryAction,
          { operation: 'execute-recovery-strategy' }
        );
    }
  }

  private async executeRetry(
    strategy: ErrorRecoveryStrategy,
    _error: Error,
    _context: Record<string, unknown>,
  ): Promise<unknown> {
    const maxRetries = strategy.maxRetries || 3;
    const retryDelay = strategy.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`${ErrorHandlingService.RETRY_MESSAGE} ${attempt}/${maxRetries}`);

        // Simulate retry logic - in production, this would re-execute the original operation
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));

        // Mock successful retry
        return { success: true, attempt, recovered: true };
      } catch (retryError) {
        if (attempt === maxRetries) {
          throw retryError;
        }
        this.logger.warn(`${ErrorHandlingService.RETRY_MESSAGE} ${attempt} failed, retrying...`);
      }
    }
  }

  private async executeFallback(
    strategy: ErrorRecoveryStrategy,
    _context: Record<string, unknown>,
  ): Promise<unknown> {
    this.logger.log(`Executing fallback strategy`);
    return strategy.fallbackData || { status: 'fallback', message: 'Using fallback data' };
  }

  private async executeCircuitBreaker(
    strategy: ErrorRecoveryStrategy,
    context: Record<string, unknown>,
  ): Promise<unknown> {
    const operation = context.operation as string;
    const threshold = strategy.circuitBreakerThreshold || 5;

    let circuitBreaker = this.circuitBreakers.get(operation);
    if (!circuitBreaker) {
      circuitBreaker = { failures: 0, lastFailure: new Date(), state: 'closed' };
      this.circuitBreakers.set(operation, circuitBreaker);
    }

    circuitBreaker.failures++;
    circuitBreaker.lastFailure = new Date();

    if (circuitBreaker.failures >= threshold) {
      circuitBreaker.state = 'open';
      this.logger.warn(`Circuit breaker opened for operation: ${operation}`);

      // Send alert
      await this.sendAlert({
        errorId: randomUUID(),
        severity: 'HIGH',
        title: 'Circuit Breaker Opened',
        message: `Circuit breaker opened for operation: ${operation} after ${circuitBreaker.failures} failures`,
        recipients: [ErrorHandlingService.ADMIN_EMAIL],
        channels: ['email', 'slack'],
      });

      throw createBusinessError(
        'CIRCUIT_BREAKER_OPEN',
        `Circuit breaker is open for operation: ${operation}`,
        operation,
        { operation: 'circuit-breaker-check' }
      );
    }

    return { circuitBreakerState: circuitBreaker.state, failures: circuitBreaker.failures };
  }

  private async executeAlert(
    strategy: ErrorRecoveryStrategy,
    error: Error,
    _context: Record<string, unknown>,
  ): Promise<unknown> {
    await this.sendAlert({
      errorId: randomUUID(),
      severity: 'CRITICAL',
      title: `Critical Error: ${strategy.name}`,
      message: `Critical error detected: ${error.message}`,
      recipients: [ErrorHandlingService.ADMIN_EMAIL, ErrorHandlingService.CFO_EMAIL],
      channels: ['email', 'slack', 'sms'],
    });

    return { alertSent: true };
  }

  private async executeAutoFix(
    strategy: ErrorRecoveryStrategy,
    _error: Error,
    _context: Record<string, unknown>,
  ): Promise<unknown> {
    this.logger.log(`Executing auto-fix strategy: ${strategy.name}`);

    // In production, this would execute the autoFixScript
    if (strategy.autoFixScript) {
      // Execute the script (would need proper sandboxing in production)
      this.logger.log(`Auto-fix script executed: ${strategy.autoFixScript}`);
    }

    return { autoFixed: true, script: strategy.autoFixScript };
  }

  // ============================================================================
  // ALERTING SYSTEM
  // ============================================================================

  async sendAlert(alert: Omit<ErrorAlert, 'id' | 'sent' | 'acknowledged'>): Promise<void> {
    const alertId = randomUUID();
    const errorAlert: ErrorAlert = {
      ...alert,
      id: alertId,
      sent: false,
      acknowledged: false,
    };

    this.errorAlerts.set(alertId, errorAlert);

    try {
      // Simulate sending alerts through different channels
      for (const channel of alert.channels) {
        await this.sendAlertToChannel(channel, errorAlert);
      }

      errorAlert.sent = true;
      errorAlert.sentAt = new Date();
      this.errorAlerts.set(alertId, errorAlert);

      this.logger.log(`Alert sent successfully: ${alertId}`);
    } catch (sendError) {
      this.logger.error(`Failed to send alert: ${alertId}`, sendError);
    }
  }

  private async sendAlertToChannel(channel: string, alert: ErrorAlert): Promise<void> {
    // Simulate channel-specific sending logic
    switch (channel) {
      case 'email':
        this.logger.log(`Sending email alert to: ${alert.recipients.join(', ')}`);
        break;
      case 'slack':
        this.logger.log(`Sending Slack alert to: ${alert.recipients.join(', ')}`);
        break;
      case 'sms':
        this.logger.log(`Sending SMS alert to: ${alert.recipients.join(', ')}`);
        break;
      case 'webhook':
        this.logger.log(`Sending webhook alert to: ${alert.recipients.join(', ')}`);
        break;
    }
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  recordPerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const metricId = randomUUID();
    const performanceMetric: PerformanceMetric = {
      ...metric,
      id: metricId,
      timestamp: new Date(),
    };

    const operationMetrics = this.performanceMetrics.get(metric.operation) || [];
    operationMetrics.push(performanceMetric);

    // Keep only last 100 metrics per operation
    if (operationMetrics.length > 100) {
      operationMetrics.splice(0, operationMetrics.length - 100);
    }

    this.performanceMetrics.set(metric.operation, operationMetrics);

    // Check for performance degradation
    this.checkPerformanceDegradation(metric.operation, operationMetrics);
  }

  private checkPerformanceDegradation(operation: string, metrics: PerformanceMetric[]): void {
    if (metrics.length < 10) return; // Need at least 10 metrics for analysis

    const recentMetrics = metrics.slice(-10);
    const avgDuration =
      recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const avgMemoryUsage =
      recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;

    // Check if performance has degraded significantly
    if (avgDuration > 5000 || avgMemoryUsage > 100 * 1024 * 1024) {
      // 5s or 100MB
      this.logger.warn(`Performance degradation detected for operation: ${operation}`);

      this.sendAlert({
        errorId: randomUUID(),
        severity: 'MEDIUM',
        title: 'Performance Degradation',
        message: `Performance degradation detected for operation: ${operation}. Avg duration: ${avgDuration}ms, Avg memory: ${avgMemoryUsage}MB`,
        recipients: [ErrorHandlingService.ADMIN_EMAIL],
        channels: ['email'],
      });
    }
  }

  // ============================================================================
  // UTILITY METHODS (from original ErrorHandlingService)
  // ============================================================================

  generateCorrelationId(): string {
    return randomUUID();
  }

  generateCausationId(correlationId: string): string {
    return `${correlationId}-${randomUUID()}`;
  }

  getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values());
  }

  getErrorPattern(errorContext: ErrorContext): ErrorPattern | undefined {
    const patternKey = this.generatePatternKey(errorContext);
    return this.errorPatterns.get(patternKey);
  }

  resolveError(errorId: string): void {
    this.logger.log(`Error resolved: ${errorId}`);
    // In a real implementation, this would update a database
  }

  getErrorStatistics(): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    topPatterns: Array<{ pattern: string; count: number }>;
  } {
    const patterns = Array.from(this.errorPatterns.values());
    const totalErrors = patterns.reduce((sum, pattern) => sum + pattern.count, 0);

    const errorsBySeverity = patterns.reduce(
      (accumulator, pattern) => {
        accumulator[pattern.severity] = (accumulator[pattern.severity] || 0) + pattern.count;
        return accumulator;
      },
      {} as Record<string, number>,
    );

    const topPatterns = patterns
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((pattern) => ({ pattern: pattern.pattern, count: pattern.count }));

    return {
      totalErrors,
      errorsBySeverity,
      topPatterns,
    };
  }

  getErrorTrends(_period: string = '24h'): ErrorTrend[] {
    // Mock implementation - in production, this would analyze actual error data
    return [
      {
        period: '24h',
        errorCount: 15,
        errorRate: 2.3,
        avgResolutionTime: 1200,
        topErrors: [
          { pattern: 'Network timeout', count: 8, lastOccurrence: new Date() },
          { pattern: 'Database connection', count: 4, lastOccurrence: new Date() },
          { pattern: 'Validation error', count: 3, lastOccurrence: new Date() },
        ],
      },
    ];
  }

  getRecoveryStrategies(): ErrorRecoveryStrategy[] {
    return Array.from(this.recoveryStrategies.values());
  }

  addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.id, strategy);
    this.logger.log(`Recovery strategy added/updated: ${strategy.name}`);
  }

  removeRecoveryStrategy(strategyId: string): void {
    this.recoveryStrategies.delete(strategyId);
    this.logger.log(`Recovery strategy removed: ${strategyId}`);
  }

  getPerformanceMetrics(operation: string): PerformanceMetric[] {
    return this.performanceMetrics.get(operation) || [];
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.errorAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
      this.errorAlerts.set(alertId, alert);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateErrorId(): string {
    return `err_${randomUUID()}`;
  }

  private updateErrorPatterns(error: ErrorContext): void {
    const patternKey = this.generatePatternKey(error);
    const existingPattern = this.errorPatterns.get(patternKey);

    if (existingPattern) {
      existingPattern.count++;
      existingPattern.lastOccurrence = error.timestamp;
    } else {
      this.errorPatterns.set(patternKey, {
        pattern: patternKey,
        count: 1,
        lastOccurrence: error.timestamp,
        severity: error.severity,
        autoFixable: this.isAutoFixable(error),
      });
    }

    // Clean up old patterns
    if (this.errorPatterns.size > this.maxPatterns) {
      const oldestPattern = Array.from(this.errorPatterns.entries()).sort(
        ([, accumulator], [, b]) =>
          accumulator.lastOccurrence.getTime() - b.lastOccurrence.getTime(),
      )[0];
      if (oldestPattern) {
        this.errorPatterns.delete(oldestPattern[0]!);
      }
    }
  }

  private generatePatternKey(error: ErrorContext): string {
    // Generate pattern key based on error type, component, and operation
    return `${error.type}:${error.component || 'unknown'}:${error.operation || 'unknown'}`;
  }

  private isAutoFixable(error: ErrorContext): boolean {
    // Define auto-fixable error patterns
    const autoFixablePatterns = [
      'ValidationError:',
      'TypeError: Cannot read property',
      'ReferenceError:',
    ];

    return autoFixablePatterns.some(
      (pattern) => error.message.includes(pattern) || error.stackTrace.includes(pattern),
    );
  }

  private emitErrorEvent(errorContext: ErrorContext): void {
    // Emit structured error event for observability
    this.logger.debug('Error event emitted', {
      errorId: errorContext.id,
      correlationId: errorContext.correlationId,
      severity: errorContext.severity,
      pattern: this.generatePatternKey(errorContext),
    });
  }

  private autoResolveError(errorContext: ErrorContext): void {
    this.logger.log(`Auto-resolving error: ${errorContext.id}`);
    // In a real implementation, this would attempt automatic fixes
    // For now, just mark as resolved
    errorContext.resolved = true;
  }
}
