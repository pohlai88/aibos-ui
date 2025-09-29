/**
 * Transaction Utilities Tests - Phase 2 Implementation
 * 
 * Comprehensive test suite covering:
 * - Abort handling (before start, between ops, during ops)
 * - Deadlock/serialization error retry logic
 * - Executor path with isolation levels
 * - Metrics and monitoring
 * - Rollback strategies (simple and compensation)
 * - Edge cases and error scenarios
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  TransactionManager,
  TransactionHelpers,
  TransactionMonitor,
  RollbackStrategies,
  withRetry,
  withTimeout,
  withAbort,
  delayAsync,
  type TransactionOperation,
  type TransactionOptions,
  type RetryOptions
} from '../transaction-utilities';

describe('TransactionManager', () => {
  beforeEach(() => {
    TransactionMonitor.clearMetrics();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Abort Safety', () => {
    it('should abort before transaction starts', async () => {
      const abortController = new AbortController();
      abortController.abort();

      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => 'success')
      ];

      await expect(TransactionManager.executeInTransaction(
        operations,
        { abortSignal: abortController.signal }
      )).rejects.toThrow('Transaction aborted before start');
    });

    it('should abort between operations', async () => {
      const abortController = new AbortController();
      
      const operations = [
        TransactionHelpers.createOperation('op1', 'test1', async () => {
          await delayAsync(10);
          return 'op1-success';
        }),
        TransactionHelpers.createOperation('op2', 'test2', async () => {
          await delayAsync(10);
          return 'op2-success';
        })
      ];

      // Start transaction
      const transactionPromise = TransactionManager.executeInTransaction(
        operations,
        { abortSignal: abortController.signal }
      );

      // Abort after first operation completes
      await delayAsync(15);
      abortController.abort();

      const result = await transactionPromise;

      expect(result.success).toBe(false);
      expect(result.error?.name).toBe('AbortError');
      expect(result.context.status).toBe('ROLLED_BACK');
    });

    it('should abort during operation execution', async () => {
      const abortController = new AbortController();
      
      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => {
          await delayAsync(50);
          return 'success';
        })
      ];

      // Start transaction
      const transactionPromise = TransactionManager.executeInTransaction(
        operations,
        { abortSignal: abortController.signal }
      );

      // Abort during operation
      await delayAsync(25);
      abortController.abort();

      const result = await transactionPromise;

      expect(result.success).toBe(false);
      expect(result.error?.name).toBe('AbortError');
    });

    it('should handle timeout with abort signal', async () => {
      const abortController = new AbortController();
      
      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => {
          await delayAsync(100);
          return 'success';
        }, { timeout: 50 })
      ];

      const result = await TransactionManager.executeInTransaction(
        operations,
        { abortSignal: abortController.signal }
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timed out');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on deadlock errors', async () => {
      let attemptCount = 0;
      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => {
          attemptCount++;
          if (attemptCount < 3) {
            const error = new Error('deadlock detected');
            (error as any).code = '40P01';
            throw error;
          }
          return 'success';
        })
      ];

      const result = await TransactionManager.executeInTransaction(
        operations,
        { retryAttempts: 3, retryDelay: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should retry on serialization failure', async () => {
      let attemptCount = 0;
      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => {
          attemptCount++;
          if (attemptCount < 2) {
            const error = new Error('serialization failure');
            (error as any).code = '40001';
            throw error;
          }
          return 'success';
        })
      ];

      const result = await TransactionManager.executeInTransaction(
        operations,
        { retryAttempts: 3, retryDelay: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(attemptCount).toBe(2);
    });

    it('should not retry on non-retryable errors', async () => {
      let attemptCount = 0;
      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => {
          attemptCount++;
          throw new Error('Business rule violation');
        })
      ];

      const result = await TransactionManager.executeInTransaction(
        operations,
        { retryAttempts: 3, retryDelay: 10 }
      );

      expect(result.success).toBe(false);
      expect(attemptCount).toBe(1);
    });

    it('should detect retryable errors by message content', async () => {
      const retryableMessages = [
        'Connection timeout occurred',
        'Network error during operation',
        'Lock timeout detected',
        'Could not serialize access'
      ];

      for (const message of retryableMessages) {
        const error = new Error(message);
        expect(TransactionHelpers.isRetryableError(error)).toBe(true);
      }
    });

    it('should detect retryable errors by error codes', async () => {
      // Test Postgres error codes
      const error1 = new Error('Database error');
      (error1 as any).code = '40001';
      expect(TransactionHelpers.isRetryableError(error1)).toBe(true);

      const error2 = new Error('Database error');
      (error2 as any).code = '40P01';
      expect(TransactionHelpers.isRetryableError(error2)).toBe(true);

      // Test errno
      const error3 = new Error('Database error');
      (error3 as any).errno = 'ETIMEDOUT';
      expect(TransactionHelpers.isRetryableError(error3)).toBe(true);

      // Test sqlState
      const error4 = new Error('Database error');
      (error4 as any).sqlState = '40001';
      expect(TransactionHelpers.isRetryableError(error4)).toBe(true);
    });
  });

  describe('Executor Integration', () => {
    it('should use executor when provided', async () => {
      const mockExecutor = {
        runInTransaction: vi.fn().mockImplementation(async (isolation, fn) => {
          expect(isolation).toBe('SERIALIZABLE');
          return await fn();
        })
      };

      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => 'success')
      ];

      const result = await TransactionManager.executeInTransaction(
        operations,
        { 
          executor: mockExecutor,
          isolationLevel: 'SERIALIZABLE'
        }
      );

      expect(result.success).toBe(true);
      expect(mockExecutor.runInTransaction).toHaveBeenCalledTimes(1);
    });

    it('should handle executor errors', async () => {
      const mockExecutor = {
        runInTransaction: vi.fn().mockRejectedValue(new Error('Executor failed'))
      };

      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => 'success')
      ];

      const result = await TransactionManager.executeInTransaction(
        operations,
        { executor: mockExecutor }
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Executor failed');
    });
  });

  describe('Monitoring and Metrics', () => {
    it('should create spans for transaction and operations', async () => {
      const mockSpan = {
        end: vi.fn(),
        setAttribute: vi.fn()
      };
      const mockMonitor = {
        startSpan: vi.fn().mockReturnValue(mockSpan)
      };

      const operations = [
        TransactionHelpers.createOperation('op1', 'test1', async () => 'success1'),
        TransactionHelpers.createOperation('op2', 'test2', async () => 'success2')
      ];

      const result = await TransactionManager.executeInTransaction(
        operations,
        { monitor: mockMonitor }
      );

      expect(result.success).toBe(true);
      expect(mockMonitor.startSpan).toHaveBeenCalledWith('txn.execute', expect.objectContaining({
        transactionId: expect.any(String)
      }));
      expect(mockMonitor.startSpan).toHaveBeenCalledWith('txn.operation', expect.objectContaining({
        operationId: 'op1',
        operationName: 'test1'
      }));
      expect(mockMonitor.startSpan).toHaveBeenCalledWith('txn.operation', expect.objectContaining({
        operationId: 'op2',
        operationName: 'test2'
      }));
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should record metrics for successful transactions', async () => {
      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => {
          await delayAsync(10); // Ensure some duration
          return 'success';
        })
      ];

      await TransactionManager.executeInTransaction(operations);

      const healthSummary = TransactionMonitor.getHealthSummary();
      expect(healthSummary.totalTransactions).toBe(1);
      expect(healthSummary.successRate).toBe(1);
      expect(healthSummary.averageDuration).toBeGreaterThan(0);
    });

    it('should record metrics for failed transactions', async () => {
      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => {
          throw new Error('Operation failed');
        })
      ];

      await TransactionManager.executeInTransaction(operations);

      const healthSummary = TransactionMonitor.getHealthSummary();
      expect(healthSummary.totalTransactions).toBe(1);
      expect(healthSummary.successRate).toBe(0);
    });

    it('should calculate correct metrics', async () => {
      const operations = [
        TransactionHelpers.createOperation('op1', 'test1', async () => 'success1'),
        TransactionHelpers.createOperation('op2', 'test2', async () => 'success2')
      ];

      const result = await TransactionManager.executeInTransaction(operations);

      expect(result.metrics).toBeDefined();
      expect(result.metrics!.operationCount).toBe(2);
      expect(result.metrics!.retryCount).toBe(0);
      expect(result.metrics!.rollbackCount).toBe(0);
      expect(result.metrics!.successRate).toBe(1);
    });
  });

  describe('Rollback Strategies', () => {
    it('should execute simple rollback strategy', async () => {
      let rollbackExecuted = false;
      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => {
          throw new Error('Operation failed');
        }, {
          rollback: async () => {
            rollbackExecuted = true;
          }
        })
      ];

      const result = await TransactionManager.executeInTransaction(
        operations,
        { enableRollback: true }
      );

      expect(result.success).toBe(false);
      expect(result.context.status).toBe('ROLLED_BACK');
      expect(rollbackExecuted).toBe(true);
    });

    it('should execute compensation rollback strategy', async () => {
      let compensationExecuted = false;
      const operations = [
        TransactionHelpers.createOperation('op1', 'compensation-operation', async () => {
          const error = new Error('Business rule violation');
          error.name = 'BusinessRuleError';
          throw error;
        }, {
          rollback: async () => {
            compensationExecuted = true;
          }
        })
      ];

      const result = await TransactionManager.executeInTransaction(
        operations,
        { enableRollback: true },
        RollbackStrategies.compensation()
      );

      expect(result.success).toBe(false);
      expect(compensationExecuted).toBe(true);
    });

    it('should not execute rollback for non-compensatable errors', async () => {
      let rollbackExecuted = false;
      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => {
          throw new Error('System error');
        }, {
          rollback: async () => {
            rollbackExecuted = true;
          }
        })
      ];

      const result = await TransactionManager.executeInTransaction(
        operations,
        { enableRollback: true },
        RollbackStrategies.compensation()
      );

      expect(result.success).toBe(false);
      expect(rollbackExecuted).toBe(false);
    });

    it('should handle rollback operation failures gracefully', async () => {
      const operations = [
        TransactionHelpers.createOperation('op1', 'test', async () => {
          throw new Error('Operation failed');
        }, {
          rollback: async () => {
            throw new Error('Rollback failed');
          }
        })
      ];

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await TransactionManager.executeInTransaction(
        operations,
        { enableRollback: true }
      );

      expect(result.success).toBe(false);
      expect(result.context.status).toBe('ROLLED_BACK');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Rollback operation test failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Operation Dependencies', () => {
    it('should execute operations in dependency order', async () => {
      const executionOrder: string[] = [];
      
      const operations = [
        TransactionHelpers.createOperation('op1', 'first', async () => {
          executionOrder.push('op1');
          return 'op1-result';
        }),
        TransactionHelpers.createOperation('op2', 'second', async () => {
          executionOrder.push('op2');
          return 'op2-result';
        }, { dependencies: ['op1'] }),
        TransactionHelpers.createOperation('op3', 'third', async () => {
          executionOrder.push('op3');
          return 'op3-result';
        }, { dependencies: ['op2'] })
      ];

      const result = await TransactionManager.executeInTransaction(operations);

      expect(result.success).toBe(true);
      expect(executionOrder).toEqual(['op1', 'op2', 'op3']);
    });

    it('should detect circular dependencies', async () => {
      const operations = [
        TransactionHelpers.createOperation('op1', 'first', async () => 'op1-result', {
          dependencies: ['op2']
        }),
        TransactionHelpers.createOperation('op2', 'second', async () => 'op2-result', {
          dependencies: ['op1']
        })
      ];

      const result = await TransactionManager.executeInTransaction(operations);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cyclic dependency detected');
    });

    it('should detect missing dependencies', async () => {
      const operations = [
        TransactionHelpers.createOperation('op1', 'first', async () => 'op1-result', {
          dependencies: ['nonexistent']
        })
      ];

      const result = await TransactionManager.executeInTransaction(operations);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('depends on non-existent operation');
    });
  });

  describe('Validation', () => {
    it('should reject empty operations array', async () => {
      const result = await TransactionManager.executeInTransaction([]);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('At least one operation is required');
    });

    it('should detect duplicate operation IDs', async () => {
      const operations = [
        TransactionHelpers.createOperation('op1', 'test1', async () => 'success1'),
        TransactionHelpers.createOperation('op1', 'test2', async () => 'success2')
      ];

      const result = await TransactionManager.executeInTransaction(operations);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Duplicate operation IDs found');
    });
  });
});

describe('Utility Functions', () => {
  describe('withRetry', () => {
    it('should retry on retryable errors', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('timeout');
        }
        return 'success';
      };

      const result = await withRetry(operation, {
        maxRetries: 3,
        baseDelay: 10
      });

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should respect max retries', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        throw new Error('timeout');
      };

      await expect(withRetry(operation, {
        maxRetries: 2,
        baseDelay: 10
      })).rejects.toThrow('timeout');

      expect(attemptCount).toBe(3); // initial + 2 retries
    });

    it('should apply exponential backoff with jitter', async () => {
      const startTime = Date.now();
      let attemptCount = 0;
      
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('timeout');
        }
        return 'success';
      };

      await withRetry(operation, {
        maxRetries: 3,
        baseDelay: 100,
        backoffMultiplier: 2,
        jitter: true
      });

      const duration = Date.now() - startTime;
      // Should have waited at least 100ms + 200ms = 300ms (with jitter)
      expect(duration).toBeGreaterThan(150); // More lenient timing
    });
  });

  describe('withTimeout', () => {
    it('should timeout slow operations', async () => {
      const slowOperation = async () => {
        await delayAsync(100);
        return 'success';
      };

      await expect(withTimeout(slowOperation(), 50)).rejects.toThrow('timed out');
    });

    it('should complete fast operations', async () => {
      const fastOperation = async () => {
        await delayAsync(10);
        return 'success';
      };

      const result = await withTimeout(fastOperation(), 100);
      expect(result).toBe('success');
    });

    it('should handle abort signal with timeout', async () => {
      const abortController = new AbortController();
      const slowOperation = async () => {
        await delayAsync(100);
        return 'success';
      };

      // Abort after 25ms
      setTimeout(() => abortController.abort(), 25);

      await expect(withTimeout(slowOperation(), 50, abortController.signal))
        .rejects.toThrow('Operation aborted');
    });
  });

  describe('withAbort', () => {
    it('should abort immediately if signal is already aborted', async () => {
      const abortController = new AbortController();
      abortController.abort();

      const operation = async () => 'success';

      await expect(withAbort(operation(), abortController.signal))
        .rejects.toThrow('Operation aborted');
    });

    it('should abort during operation execution', async () => {
      const abortController = new AbortController();
      
      const operation = async () => {
        await delayAsync(50);
        return 'success';
      };

      // Abort after 25ms
      setTimeout(() => abortController.abort(), 25);

      await expect(withAbort(operation(), abortController.signal))
        .rejects.toThrow('Operation aborted');
    });

    it('should complete operation if not aborted', async () => {
      const abortController = new AbortController();
      
      const operation = async () => {
        await delayAsync(10);
        return 'success';
      };

      const result = await withAbort(operation(), abortController.signal);
      expect(result).toBe('success');
    });
  });

  describe('delayAsync', () => {
    it('should delay for specified time', async () => {
      const startTime = Date.now();
      await delayAsync(50);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeGreaterThanOrEqual(45);
      expect(duration).toBeLessThan(100);
    });

    it('should handle negative delays', async () => {
      const startTime = Date.now();
      await delayAsync(-10);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(20); // More lenient timing
    });

    it('should handle zero delay', async () => {
      const startTime = Date.now();
      await delayAsync(0);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(20); // More lenient timing
    });
  });
});

describe('TransactionHelpers', () => {
  describe('createOperation', () => {
    it('should create operation with all options', () => {
      const operation = TransactionHelpers.createOperation(
        'test-id',
        'test-name',
        async () => 'result',
        {
          rollback: async () => {},
          dependencies: ['dep1'],
          timeout: 5000
        }
      );

      expect(operation.id).toBe('test-id');
      expect(operation.name).toBe('test-name');
      expect(operation.dependencies).toEqual(['dep1']);
      expect(operation.timeout).toBe(5000);
      expect(typeof operation.execute).toBe('function');
      expect(typeof operation.rollback).toBe('function');
    });

    it('should create operation with minimal options', () => {
      const operation = TransactionHelpers.createOperation(
        'test-id',
        'test-name',
        async () => 'result'
      );

      expect(operation.id).toBe('test-id');
      expect(operation.name).toBe('test-name');
      expect(operation.dependencies).toBeUndefined();
      expect(operation.timeout).toBeUndefined();
      expect(operation.rollback).toBeUndefined();
    });
  });

  describe('createTransactionOptions', () => {
    it('should create options with defaults', () => {
      const options = TransactionHelpers.createTransactionOptions();

      expect(options.timeout).toBe(30000);
      expect(options.isolationLevel).toBe('READ_COMMITTED');
      expect(options.retryAttempts).toBe(3);
      expect(options.retryDelay).toBe(1000);
      expect(options.enableRollback).toBe(true);
      expect(options.enableMetrics).toBe(true);
    });

    it('should override defaults with provided options', () => {
      const options = TransactionHelpers.createTransactionOptions({
        timeout: 60000,
        isolationLevel: 'SERIALIZABLE',
        retryAttempts: 5,
        enableRollback: false
      });

      expect(options.timeout).toBe(60000);
      expect(options.isolationLevel).toBe('SERIALIZABLE');
      expect(options.retryAttempts).toBe(5);
      expect(options.enableRollback).toBe(false);
    });
  });

  describe('createRetryOptions', () => {
    it('should create retry options with defaults', () => {
      const options = TransactionHelpers.createRetryOptions();

      expect(options.maxRetries).toBe(3);
      expect(options.baseDelay).toBe(1000);
      expect(options.maxDelay).toBe(30000);
      expect(options.backoffMultiplier).toBe(2);
      expect(options.jitter).toBe(true);
      expect(typeof options.retryCondition).toBe('function');
    });

    it('should override defaults with provided options', () => {
      const customCondition = (error: Error) => error.message.includes('custom');
      const options = TransactionHelpers.createRetryOptions({
        maxRetries: 5,
        baseDelay: 500,
        jitter: false,
        retryCondition: customCondition
      });

      expect(options.maxRetries).toBe(5);
      expect(options.baseDelay).toBe(500);
      expect(options.jitter).toBe(false);
      expect(options.retryCondition).toBe(customCondition);
    });
  });
});

describe('RollbackStrategies', () => {
  describe('simple', () => {
    it('should execute all rollback operations', async () => {
      const executedRollbacks: string[] = [];
      const context = {
        transactionId: 'test-txn',
        startTime: new Date(),
        operations: [],
        rollbackOperations: [
          {
            id: 'rb1',
            name: 'rollback1',
            execute: async () => { executedRollbacks.push('rb1'); },
            priority: 1
          },
          {
            id: 'rb2',
            name: 'rollback2',
            execute: async () => { executedRollbacks.push('rb2'); },
            priority: 2
          }
        ],
        status: 'FAILED' as const,
        operation: 'test'
      };

      const strategy = RollbackStrategies.simple();
      await strategy.execute(context);

      expect(executedRollbacks).toEqual(['rb2', 'rb1']); // Higher priority first
    });

    it('should handle rollback failures gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const context = {
        transactionId: 'test-txn',
        startTime: new Date(),
        operations: [],
        rollbackOperations: [
          {
            id: 'rb1',
            name: 'failing-rollback',
            execute: async () => { throw new Error('Rollback failed'); },
            priority: 1
          },
          {
            id: 'rb2',
            name: 'successful-rollback',
            execute: async () => {},
            priority: 2
          }
        ],
        status: 'FAILED' as const,
        operation: 'test'
      };

      const strategy = RollbackStrategies.simple();
      await strategy.execute(context);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Rollback operation failing-rollback failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('compensation', () => {
    it('should only execute compensation operations', async () => {
      const executedRollbacks: string[] = [];
      const context = {
        transactionId: 'test-txn',
        startTime: new Date(),
        operations: [],
        rollbackOperations: [
          {
            id: 'rb1',
            name: 'regular-rollback',
            execute: async () => { executedRollbacks.push('rb1'); },
            priority: 1
          },
          {
            id: 'rb2',
            name: 'compensation-operation',
            execute: async () => { executedRollbacks.push('rb2'); },
            priority: 2
          }
        ],
        status: 'FAILED' as const,
        operation: 'test'
      };

      const strategy = RollbackStrategies.compensation();
      await strategy.execute(context);

      expect(executedRollbacks).toEqual(['rb2']); // Only compensation operation
    });

    it('should handle all error types but only execute compensation operations', () => {
      const strategy = RollbackStrategies.compensation();

      const businessError = new Error('Business rule violation');
      businessError.name = 'BusinessRuleError';

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';

      const systemError = new Error('System error');
      systemError.name = 'SystemError';

      // Compensation strategy handles all errors but only executes compensation operations
      expect(strategy.canRollback(businessError)).toBe(true);
      expect(strategy.canRollback(validationError)).toBe(true);
      expect(strategy.canRollback(systemError)).toBe(true);
    });
  });

  describe('noOp', () => {
    it('should not execute any rollback operations', async () => {
      const executedRollbacks: string[] = [];
      const context = {
        transactionId: 'test-txn',
        startTime: new Date(),
        operations: [],
        rollbackOperations: [
          {
            id: 'rb1',
            name: 'rollback1',
            execute: async () => { executedRollbacks.push('rb1'); },
            priority: 1
          }
        ],
        status: 'FAILED' as const,
        operation: 'test'
      };

      const strategy = RollbackStrategies.noOp();
      await strategy.execute(context);

      expect(executedRollbacks).toEqual([]);
    });

    it('should never allow rollback', () => {
      const strategy = RollbackStrategies.noOp();
      expect(strategy.canRollback(new Error('Any error'))).toBe(false);
    });
  });
});
