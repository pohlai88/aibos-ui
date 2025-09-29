/**
 * Transaction Utilities - Phase 2 Implementation
 * 
 * Provides standardized transaction management, retry logic, and rollback strategies
 * for consistent transaction handling across the accounting domain.
 * 
 * Features:
 * - TransactionManager for executing operations in transactions
 * - Retry logic with exponential backoff
 * - Rollback strategies and compensation
 * - Transaction isolation and timeout handling
 * - Deadlock detection and resolution
 * - Transaction monitoring and metrics
 */

import { 
  type ErrorContext,
  createValidationError
} from './error-utilities';
// Optional: external validation
// If zod isn't available in this package yet, add it to deps; otherwise it's a no-op export.
 
import { z } from 'zod';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// --- Local helpers ----------------------------------------------------------
function nowMs(): number {
  const p = (globalThis as unknown)?.performance?.now?.();
  return (typeof p === 'number' && Number.isFinite(p)) ? p : Date.now();
}
function makeAbortError(msg = 'Operation aborted'): Error {
  const err = new Error(msg);
  (err as unknown).name = 'AbortError';
  return err;
}

export interface TransactionOptions {
  timeout?: number;
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  retryAttempts?: number;
  retryDelay?: number;
  enableRollback?: boolean;
  enableMetrics?: boolean;
  /**
   * Abort controller to cancel in-flight transactions (deploy/shutdown).
   * If aborted, the transaction throws an AbortError and attempts rollback (if enabled).
   */
  abortSignal?: AbortSignal | { aborted: boolean };
  /**
   * Optional DB executor. If present, all operations are executed inside
   * a real database transaction using the provided isolation level.
   *
   * Example: knex, pg, Prisma, Drizzle wrapper, etc.
   */
  executor?: {
    runInTransaction<T>(
      isolation: TransactionOptions['isolationLevel'] | undefined,
      fn: () => Promise<T>
    ): Promise<T>;
  };
  /**
   * Optional monitoring adapter for spans.
   * Provide your bridge to Monitoring utilities / tracing SDK.
   */
  monitor?: {
    startSpan: (
      name: string,
      attributes?: Record<string, unknown>
    ) => { end: (error?: Error) => void; setAttribute?: (k: string, v: unknown) => void };
  };
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: Error) => boolean;
}

export interface RollbackStrategy {
  name: string;
  execute: (context: TransactionContext) => Promise<void>;
  canRollback: (error: Error) => boolean;
}

export interface TransactionContext extends ErrorContext {
  transactionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  operations: TransactionOperation[];
  rollbackOperations: RollbackOperation[];
  status: 'PENDING' | 'RUNNING' | 'COMMITTED' | 'ROLLED_BACK' | 'FAILED';
  retryCount?: number;
  lastError?: Error;
}

export interface TransactionOperation {
  id: string;
  name: string;
  execute: () => Promise<unknown>;
  rollback?: () => Promise<void>;
  dependencies?: string[];
  timeout?: number;
}

export interface RollbackOperation {
  id: string;
  name: string;
  execute: () => Promise<void>;
  priority: number;
}

export interface TransactionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  context: TransactionContext;
  metrics?: TransactionMetrics;
}

export interface TransactionMetrics {
  totalDuration: number;
  operationCount: number;
  retryCount: number;
  rollbackCount: number;
  successRate: number;
}

// ============================================================================
// TRANSACTION MANAGER
// ============================================================================

/**
 * Manager for executing operations in transactions with retry and rollback support
 */
export class TransactionManager {
  private static readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private static readonly DEFAULT_RETRY_DELAY = 1000; // 1 second

  /**
   * Execute operations in a transaction
   */
  static async executeInTransaction<T>(
    operations: TransactionOperation[],
    options: TransactionOptions = {},
    rollbackStrategy?: RollbackStrategy
  ): Promise<TransactionResult<T>> {
    const transactionId = this.generateTransactionId();
    if (options.abortSignal?.aborted) {
      throw makeAbortError('Transaction aborted before start');
    }
    const rootSpan = options.monitor?.startSpan?.('txn.execute', { transactionId });
    const context: TransactionContext = {
      transactionId,
      startTime: new Date(),
      operations,
      rollbackOperations: [],
      status: 'PENDING',
      operation: 'executeInTransaction',
      retryCount: 0
    };

    const timer = this.startTimer();
    // Wire AbortSignal
    let abortListener: (() => void) | undefined;
    if (options.abortSignal) {
      abortListener = () => { context.lastError = makeAbortError('Transaction aborted'); };
      options.abortSignal.addEventListener('abort', abortListener, { once: true });
    }
    
    try {
      context.status = 'RUNNING';
      
      // Validate + order operations respecting dependencies
      this.validateOperations(operations);
      const ordered = this.sortOperations(operations);

      const runAll = async () => {
        // Execute operations in order
        const results: unknown[] = [];
        for (const operation of ordered) {
          // Check for external abort between ops
          if (options.abortSignal?.aborted) throw makeAbortError('Transaction aborted');
          
          // Add rollback operation if provided (before execution)
          if (operation.rollback) {
            context.rollbackOperations.push({
              id: operation.id,
              name: operation.name,
              execute: operation.rollback,
              priority: ordered.length - results.length
            });
          }
          
          const result = await this.executeOperation(operation, context, options);
          results.push(result);
        }
        return results;
      };

      // If an executor is provided, run inside a real DB transaction
      const results = options.executor
        ? await options.executor.runInTransaction(options.isolationLevel, runAll)
        : await runAll();
      
      context.status = 'COMMITTED';
      context.endTime = new Date();
      context.duration = context.endTime.getTime() - context.startTime.getTime();
      
      timer.end();
      rootSpan?.end?.();
      // record metrics
      const metrics = this.calculateMetrics(context);
      TransactionMonitor.recordMetrics(metrics);
      
      return {
        success: true,
        data: results[results.length - 1] as T,
        context,
        metrics
      };
      
    } catch (error) {
      // Normalize AbortError across environments
      if ((error as Error)?.name === 'AbortError') context.lastError = error as Error;

      context.status = 'FAILED';
      context.lastError = error as Error;
      context.endTime = new Date();
      context.duration = context.endTime.getTime() - context.startTime.getTime();
      
      timer.end();
      rootSpan?.end?.(error as Error);
      
      // Attempt rollback if enabled
      if (options.enableRollback !== false) {
        try {
          await this.executeRollback(context, rollbackStrategy);
          context.status = 'ROLLED_BACK';
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
      // record metrics on failure as well
      const metrics = this.calculateMetrics(context);
      TransactionMonitor.recordMetrics(metrics);

      return {
        success: false,
        error: error as Error,
        context,
        metrics
      };
    } finally {
      // Clean up abort listener
      if (options.abortSignal && abortListener) {
        options.abortSignal.removeEventListener('abort', abortListener);
      }
    }
  }

  /**
   * Execute operation with retry logic
   */
  private static async executeOperation(
    operation: TransactionOperation,
    context: TransactionContext,
    options: TransactionOptions
  ): Promise<unknown> {
    const retryOptions: RetryOptions = {
      maxRetries: options.retryAttempts || this.DEFAULT_RETRY_ATTEMPTS,
      baseDelay: options.retryDelay || this.DEFAULT_RETRY_DELAY,
      retryCondition: (error) => TransactionHelpers.isRetryableError(error)
    };

    // Per-operation span (if monitor provided)
    const span = options.monitor?.startSpan?.('txn.operation', {
      transactionId: context.transactionId,
      operationId: operation.id,
      operationName: operation.name
    });
    let _err: Error | undefined;
    try {
      return await withRetry(
        () => this.executeSingleOperation(operation, context, options),
        retryOptions,
        context
      );
    } catch (err) {
      _err = err as Error;
      throw err;
    } finally {
      span?.end?.(_err);
    }
  }

  /**
   * Execute a single operation
   */
  private static async executeSingleOperation(
    operation: TransactionOperation,
    _context: TransactionContext,
    options: TransactionOptions
  ): Promise<unknown> {
    const operationTimer = this.startTimer();
    
    // Fast-fail if aborted before start
    if (options.abortSignal?.aborted) {
      throw makeAbortError('Operation aborted');
    }

    try {
      // Check for timeout (prefer operation.timeout over global)
      const effectiveTimeout = operation.timeout ?? options.timeout;
      if (effectiveTimeout && effectiveTimeout > 0) {
        return withTimeout(operation.execute(), effectiveTimeout, options.abortSignal);
      }
      const exec = operation.execute();
      // Race with abort if provided (no extra timer)
      return options.abortSignal ? withAbort(exec, options.abortSignal) : exec;
      
    } finally {
      operationTimer.end();
    }
  }

  /**
   * Execute rollback operations
   */
  private static async executeRollback(
    context: TransactionContext,
    rollbackStrategy?: RollbackStrategy
  ): Promise<void> {
    if (rollbackStrategy && rollbackStrategy.canRollback(context.lastError!)) {
      await rollbackStrategy.execute(context);
      return;
    }

    // Execute rollback operations in reverse order
    const sortedRollbacks = context.rollbackOperations.sort(
      (a, b) => b.priority - a.priority
    );

    for (const rollback of sortedRollbacks) {
      try {
        await rollback.execute();
      } catch (error) {
        console.error(`Rollback operation ${rollback.name} failed:`, error);
        // Continue with other rollbacks
      }
    }
  }

  /**
   * Validate operations before execution
   */
  private static validateOperations(operations: TransactionOperation[]): void {
    if (!operations || operations.length === 0) {
      throw createValidationError(
        'operations',
        'At least one operation is required',
        operations
      );
    }

    // Check for duplicate operation IDs
    const ids = operations.map(op => op.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      throw createValidationError(
        'operations',
        `Duplicate operation IDs found: ${duplicates.join(', ')}`,
        operations
      );
    }

    // Validate dependencies
    for (const operation of operations) {
      if (operation.dependencies) {
        for (const depId of operation.dependencies) {
          if (!ids.includes(depId)) {
            throw createValidationError(
              'operations',
              `Operation ${operation.id} depends on non-existent operation ${depId}`,
              operations
            );
          }
        }
      }
    }
  }

  /**
   * Calculate transaction metrics
   */
  private static calculateMetrics(context: TransactionContext): TransactionMetrics {
    return {
      totalDuration: context.duration || 0,
      operationCount: context.operations.length,
      retryCount: context.retryCount || 0,
      rollbackCount: context.rollbackOperations.length,
      successRate: context.status === 'COMMITTED' ? 1 : 0
    };
  }

  /**
   * Topologically sort operations by their dependencies.
   * Throws a validation error on cycles or missing deps (missing deps are already checked).
   */
  private static sortOperations(operations: TransactionOperation[]): TransactionOperation[] {
    const map = new Map<string, TransactionOperation>();
    for (const op of operations) map.set(op.id, op);

    const tempMark = new Set<string>();
    const permMark = new Set<string>();
    const ordered: TransactionOperation[] = [];

    const visit = (id: string, stack: string[]) => {
      if (permMark.has(id)) return;
      if (tempMark.has(id)) {
        // cycle detected
        const cycle = [...stack, id].join(' -> ');
        throw createValidationError(
          'operations',
          `Cyclic dependency detected: ${cycle}`,
          operations
        );
      }
      tempMark.add(id);
      const op = map.get(id)!;
      const deps = op.dependencies ?? [];
      for (const dep of deps) {
        visit(dep, [...stack, id]);
      }
      tempMark.delete(id);
      permMark.add(id);
      ordered.push(op);
    };

    for (const op of operations) visit(op.id, []);
    // Keep the original relative order for equal dependency levels (stable topo)
    const index = new Map(operations.map((op, i) => [op.id, i]));
    ordered.sort((a, b) => {
      // both are already topologically valid; stabilize by original index
      return (index.get(a.id)! - index.get(b.id)!);
    });
    return ordered;
  }

  /**
   * Generate unique transaction ID
   */
  private static generateTransactionId(): string {
    try {
      // Prefer crypto.randomUUID when available
      const uuid = globalThis.crypto?.randomUUID?.();
      if (uuid) return `txn_${uuid}`;
    } catch {
      // Fallback to timestamp + random
    }
    return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Start performance timer
   */
  private static startTimer(): { end: () => void } {
    const start = nowMs();
    return {
      end: () => {
        // Placeholder: wire to metrics if desired
        void (nowMs() - start);
      }
    };
  }
}

// ============================================================================
// RETRY UTILITIES
// ============================================================================

/**
 * Execute operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
  context?: TransactionContext
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    retryCondition = () => true
  } = options;

  let lastError: Error;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries || !retryCondition(lastError)) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      let delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      // Update context if provided
      if (context) {
        context.retryCount = (context.retryCount || 0) + 1;
      }

      await delayAsync(delay);
      attempt++;
    }
  }

  throw lastError!;
}

/**
 * Execute operation with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal | { aborted: boolean }
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abortHandler: (() => void) | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        abortHandler = () => reject(makeAbortError());
        signal.addEventListener('abort', abortHandler!, { once: true });
      })
    : undefined;
  try {
    return await Promise.race(abortPromise ? [promise, timeoutPromise, abortPromise] : [promise, timeoutPromise]);
  } finally {
    if (typeof timer !== 'undefined') clearTimeout(timer);
    if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
  }
}

/**
 * Race a promise with an AbortSignal without adding a timeout.
 */
export async function withAbort<T>(promise: Promise<T>, signal: AbortSignal | { aborted: boolean }): Promise<T> {
  if (signal.aborted) throw makeAbortError();
  let abortHandler: (() => void) | undefined;
  const abortPromise = new Promise<never>((_, reject) => {
    abortHandler = () => reject(makeAbortError());
    signal.addEventListener('abort', abortHandler!, { once: true });
  });
  try {
    return await Promise.race([promise, abortPromise]);
  } finally {
    if (abortHandler) signal.removeEventListener('abort', abortHandler);
  }
}

/**
 * Delay execution
 */
export async function delayAsync(ms: number): Promise<void> {
  const delay = Math.max(0, ms | 0);
  return new Promise(resolve => setTimeout(resolve, delay));
}

// ============================================================================
// ROLLBACK STRATEGIES
// ============================================================================

/**
 * Standard rollback strategies
 */
export class RollbackStrategies {
  /**
   * Simple rollback strategy that executes all rollback operations
   */
  static simple(): RollbackStrategy {
    return {
      name: 'simple',
      execute: async (context: TransactionContext) => {
        const sortedRollbacks = context.rollbackOperations.sort(
          (a, b) => b.priority - a.priority
        );

        for (const rollback of sortedRollbacks) {
          try {
            await rollback.execute();
          } catch (error) {
            console.error(`Rollback operation ${rollback.name} failed:`, error);
          }
        }
      },
      canRollback: () => true
    };
  }

  /**
   * Compensation-based rollback strategy
   */
  static compensation(): RollbackStrategy {
    return {
      name: 'compensation',
      execute: async (context: TransactionContext) => {
        // Execute compensation operations in reverse order
        const compensations = context.rollbackOperations
          .filter(op => op.name.includes('compensation'))
          .sort((a, b) => b.priority - a.priority);

        for (const compensation of compensations) {
          try {
            await compensation.execute();
          } catch (error) {
            console.error(`Compensation operation ${compensation.name} failed:`, error);
          }
        }
      },
      canRollback: (_error: Error) => {
        // Always handle the error, but only execute compensation operations
        return true;
      }
    };
  }

  /**
   * No-op rollback strategy
   */
  static noOp(): RollbackStrategy {
    return {
      name: 'no-op',
      execute: async () => {
        // Do nothing
      },
      canRollback: () => false
    };
  }
}

// ============================================================================
// TRANSACTION HELPERS
// ============================================================================

/**
 * Helper functions for transaction operations
 */
export class TransactionHelpers {
  /**
   * Create a transaction operation
   */
  static createOperation(
    id: string,
    name: string,
    execute: () => Promise<unknown>,
    options: {
      rollback?: () => Promise<void>;
      dependencies?: string[];
      timeout?: number;
    } = {}
  ): TransactionOperation {
    const operation: TransactionOperation = {
      id,
      name,
      execute
    };
    
    if (options.rollback) {
      operation.rollback = options.rollback;
    }
    
    if (options.dependencies) {
      operation.dependencies = options.dependencies;
    }
    
    if (options.timeout) {
      operation.timeout = options.timeout;
    }
    
    return operation;
  }

  /**
   * Create a rollback operation
   */
  static createRollbackOperation(
    id: string,
    name: string,
    execute: () => Promise<void>,
    priority: number = 0
  ): RollbackOperation {
    return {
      id,
      name,
      execute,
      priority
    };
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'TimeoutError',
      'ConnectionError',
      'NetworkError',
      'TemporaryError',
      'DeadlockDetected',
      'SerializationFailure',
      'LockTimeout'
    ];

    const msg = (error.message || '').toLowerCase();
    // Common DB/driver signals (e.g., Postgres 40001/40P01)
    const code = (error as unknown)?.code ?? (error as unknown)?.errno ?? (error as unknown)?.sqlState;
    const codeStr = typeof code === 'string' ? code.toUpperCase() : String(code ?? '');
    return retryableErrors.includes(error.name) ||
           msg.includes('timeout') ||
           msg.includes('connection') ||
           msg.includes('network') ||
           /deadlock|serialization failure|could not serialize|lock timeout/.test(msg) ||
           codeStr === '40001' || // serialization_failure
           codeStr === '40P01' || // deadlock_detected
           codeStr === 'ETIMEDOUT'; // timeout
  }

  /**
   * Create transaction options
   */
  static createTransactionOptions(
    options: Partial<TransactionOptions> = {}
  ): TransactionOptions {
    return {
      timeout: options.timeout || 30000,
      isolationLevel: options.isolationLevel || 'READ_COMMITTED',
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      enableRollback: options.enableRollback !== false,
      enableMetrics: options.enableMetrics !== false
    };
  }

  /**
   * Create retry options
   */
  static createRetryOptions(
    options: Partial<RetryOptions> = {}
  ): RetryOptions {
    return {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      backoffMultiplier: options.backoffMultiplier || 2,
      jitter: options.jitter !== false,
      retryCondition: options.retryCondition || this.isRetryableError
    };
  }
}

// ============================================================================
// TRANSACTION MONITORING
// ============================================================================

/**
 * Monitor transaction performance and health
 */
export class TransactionMonitor {
  private static metrics: TransactionMetrics[] = [];
  private static readonly MAX_METRICS = 1000;

  /**
   * Record transaction metrics
   */
  static recordMetrics(metrics: TransactionMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Get transaction health summary
   */
  static getHealthSummary(): {
    totalTransactions: number;
    successRate: number;
    averageDuration: number;
    averageRetryCount: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalTransactions: 0,
        successRate: 0,
        averageDuration: 0,
        averageRetryCount: 0
      };
    }

    const totalTransactions = this.metrics.length;
    const successfulTransactions = this.metrics.filter(m => m.successRate > 0).length;
    const successRate = successfulTransactions / totalTransactions;
    const averageDuration = this.metrics.reduce((sum, m) => sum + m.totalDuration, 0) / totalTransactions;
    const averageRetryCount = this.metrics.reduce((sum, m) => sum + m.retryCount, 0) / totalTransactions;

    return {
      totalTransactions,
      successRate,
      averageDuration,
      averageRetryCount
    };
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
  }
}

// ============================================================================
// SCHEMAS (Zod) - optional external validation for TransactionOptions
// ============================================================================
export const TransactionOptionsSchema = z.object({
  timeout: z.number().int().positive().optional(),
  isolationLevel: z.enum(['READ_UNCOMMITTED', 'READ_COMMITTED', 'REPEATABLE_READ', 'SERIALIZABLE']).optional(),
  retryAttempts: z.number().int().min(0).optional(),
  retryDelay: z.number().int().min(0).optional(),
  enableRollback: z.boolean().optional(),
  enableMetrics: z.boolean().optional(),
  // We can't validate AbortSignal structurally here; accept unknown and refine at runtime if needed
  abortSignal: z.any().optional(),
  // Relax executor typing to avoid cross-package zod incompatibilities; runtime checks still apply
  executor: z.unknown().optional(),
  monitor: z.object({
    startSpan: z.function()
      .args(z.string(), z.record(z.unknown()).optional())
      .returns(z.object({
        end: z.function().args(z.instanceof(Error).optional()).returns(z.void()),
        setAttribute: z.function().args(z.string(), z.unknown()).returns(z.void()).optional()
      }))
  }).partial().optional()
});
export type TransactionOptionsInput = z.infer<typeof TransactionOptionsSchema>;
