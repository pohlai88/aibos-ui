import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AccountingError,
  ValidationError,
  BusinessRuleError,
  AuthenticationError,
  AuthorizationError,
  ExternalServiceError,
  TimeoutError,
  createValidationError,
  createBusinessError,
  createAuthError,
  createAuthzError,
  createServiceError,
  createTimeoutError,
  handleAsyncError,
  retryOperation,
  withTimeout,
  CircuitBreaker,
  createCircuitBreaker,
  isRetryableError,
  extractErrorContext,
  formatErrorForUser,
  isValidationError,
  isBusinessRuleError,
  isAuthenticationError,
  isAuthorizationError,
  isExternalServiceError,
  isTimeoutError
} from '../error-utilities';

describe('Error Utilities', () => {
  describe('AccountingError', () => {
    it('should create error with message and code', () => {
      const error = new AccountingError('Test error', 'TEST_CODE');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AccountingError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should include context when provided', () => {
      const context = { userId: '123', operation: 'test' };
      const error = new AccountingError('Test error', 'TEST_CODE', context);
      
      expect(error.context).toEqual(context);
    });

    it('should serialize to JSON correctly', () => {
      const context = { userId: '123' };
      const error = new AccountingError('Test error', 'TEST_CODE', context);
      const json = error.toJSON();
      
      expect(json.name).toBe('AccountingError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_CODE');
      expect(json.context).toEqual(context);
      expect(json.timestamp).toBeDefined();
    });

    it('should return user-friendly message', () => {
      const error = new AccountingError('Test error', 'TEST_CODE');
      expect(error.getUserMessage()).toBe('Test error');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid value', 'email', 'invalid@');
      
      expect(error.message).toBe('Invalid value');
      expect(error.field).toBe('email');
      expect(error.value).toBe('invalid@');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    it('should return formatted user message', () => {
      const error = new ValidationError('Invalid format', 'email');
      expect(error.getUserMessage()).toBe('Invalid email: Invalid format');
    });
  });

  describe('BusinessRuleError', () => {
    it('should create business rule error', () => {
      const error = new BusinessRuleError('Rule violated', 'BALANCE_CHECK', 'account');
      
      expect(error.message).toBe('Rule violated');
      expect(error.rule).toBe('BALANCE_CHECK');
      expect(error.entity).toBe('account');
      expect(error.code).toBe('BUSINESS_RULE_ERROR');
      expect(error.name).toBe('BusinessRuleError');
    });

    it('should return formatted user message', () => {
      const error = new BusinessRuleError('Insufficient funds', 'BALANCE_CHECK');
      expect(error.getUserMessage()).toBe('Business rule violation: Insufficient funds');
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError('Invalid credentials');
      
      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.name).toBe('AuthenticationError');
    });

    it('should use default message when none provided', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication required');
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error', () => {
      const error = new AuthorizationError('Access denied', 'READ_ACCOUNTS', 'account-123');
      
      expect(error.message).toBe('Access denied');
      expect(error.permission).toBe('READ_ACCOUNTS');
      expect(error.resource).toBe('account-123');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.name).toBe('AuthorizationError');
    });

    it('should return formatted user message', () => {
      const error = new AuthorizationError('No permission', 'WRITE_TRANSACTIONS');
      expect(error.getUserMessage()).toBe('Access denied: No permission');
    });
  });

  describe('ExternalServiceError', () => {
    it('should create external service error', () => {
      const error = new ExternalServiceError('Service down', 'payment-gateway', 503);
      
      expect(error.message).toBe('Service down');
      expect(error.service).toBe('payment-gateway');
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.name).toBe('ExternalServiceError');
    });

    it('should return formatted user message', () => {
      const error = new ExternalServiceError('Timeout', 'api-service');
      expect(error.getUserMessage()).toBe('Service unavailable: api-service');
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError('Operation timed out', 5000);
      
      expect(error.message).toBe('Operation timed out');
      expect(error.timeoutMs).toBe(5000);
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.name).toBe('TimeoutError');
    });

    it('should return formatted user message', () => {
      const error = new TimeoutError('Timeout', 3000);
      expect(error.getUserMessage()).toBe('Operation timed out after 3000ms');
    });
  });

  describe('Error Creation Helpers', () => {
    it('should create validation error', () => {
      const error = createValidationError('email', 'Invalid format', 'test@');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe('email');
      expect(error.message).toBe('Invalid format');
    });

    it('should create business error', () => {
      const error = createBusinessError('BALANCE_CHECK', 'Insufficient funds');
      expect(error).toBeInstanceOf(BusinessRuleError);
      expect(error.rule).toBe('BALANCE_CHECK');
      expect(error.message).toBe('Insufficient funds');
    });

    it('should create auth error', () => {
      const error = createAuthError('Invalid token');
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Invalid token');
    });

    it('should create authz error', () => {
      const error = createAuthzError('No permission', 'READ_DATA');
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.permission).toBe('READ_DATA');
    });

    it('should create service error', () => {
      const error = createServiceError('Service down', 'api', 500);
      expect(error).toBeInstanceOf(ExternalServiceError);
      expect(error.service).toBe('api');
      expect(error.statusCode).toBe(500);
    });

    it('should create timeout error', () => {
      const error = createTimeoutError('Timeout', 1000);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.timeoutMs).toBe(1000);
    });
  });

  describe('handleAsyncError', () => {
    it('should handle successful async operation', async () => {
      const result = await handleAsyncError(async () => 'success');
      
      expect(result.data).toBe('success');
      expect(result.error).toBeNull();
    });

    it('should handle async operation error', async () => {
      const result = await handleAsyncError(async () => {
        throw new Error('Test error');
      });
      
      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(AccountingError);
      expect(result.error?.message).toBe('Test error');
    });

    it('should preserve AccountingError instances', async () => {
      const originalError = new ValidationError('Invalid', 'field');
      const result = await handleAsyncError(async () => {
        throw originalError;
      });
      
      expect(result.error).toBe(originalError);
    });
  });

  describe('retryOperation', () => {
    it('should succeed on first attempt', async () => {
      const result = await retryOperation(
        async () => 'success',
        { maxRetries: 3, delay: 10 }
      );
      
      expect(result).toBe('success');
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const result = await retryOperation(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return 'success';
        },
        { maxRetries: 3, delay: 10 }
      );
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      await expect(retryOperation(
        async () => {
          throw new Error('Persistent failure');
        },
        { maxRetries: 2, delay: 10 }
      )).rejects.toThrow('Operation failed after 3 attempts');
    });

    it('should respect retry condition', async () => {
      await expect(retryOperation(
        async () => {
          throw new Error('Non-retryable error');
        },
        { 
          maxRetries: 2, 
          delay: 10,
          retryCondition: (error) => !error.message.includes('Non-retryable')
        }
      )).rejects.toThrow('Non-retryable error');
    });
  });

  describe('withTimeout', () => {
    it('should return result before timeout', async () => {
      const result = await withTimeout(
        Promise.resolve('success'),
        1000
      );
      
      expect(result).toBe('success');
    });

    it('should throw timeout error', async () => {
      await expect(withTimeout(
        new Promise(resolve => setTimeout(() => resolve('success'), 2000)),
        1000
      )).rejects.toThrow('Operation timed out after 1000ms');
    });
  });

  describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker<string>;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker(
        async () => 'success',
        { failureThreshold: 2, recoveryTimeout: 1000, monitoringPeriod: 5000 }
      );
    });

    it('should execute successfully when closed', async () => {
      const result = await circuitBreaker.execute();
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should open after failure threshold', async () => {
      let callCount = 0;
      const failingFn = async () => {
        callCount++;
        throw new Error('Service failure');
      };
      
      const breaker = new CircuitBreaker(failingFn, {
        failureThreshold: 2,
        recoveryTimeout: 1000,
        monitoringPeriod: 5000
      });

      // First two failures
      await expect(breaker.execute()).rejects.toThrow('Service failure');
      await expect(breaker.execute()).rejects.toThrow('Service failure');
      
      // Should be open now
      await expect(breaker.execute()).rejects.toThrow('Circuit breaker is OPEN');
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should transition to half-open after recovery timeout', async () => {
      let callCount = 0;
      const failingFn = async () => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Service failure');
        }
        return 'recovered';
      };
      
      const breaker = new CircuitBreaker(failingFn, {
        failureThreshold: 2,
        recoveryTimeout: 100,
        monitoringPeriod: 5000
      });

      // Cause failures to open circuit
      await expect(breaker.execute()).rejects.toThrow();
      await expect(breaker.execute()).rejects.toThrow();
      
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should succeed and close circuit
      const result = await breaker.execute();
      expect(result).toBe('recovered');
      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('Error Analysis Utilities', () => {
    it('should identify retryable errors', () => {
      expect(isRetryableError(new ExternalServiceError('Service down', 'api'))).toBe(true);
      expect(isRetryableError(new TimeoutError('Timeout', 1000))).toBe(true);
      expect(isRetryableError(new ValidationError('Invalid', 'field'))).toBe(false);
      
      const networkError = new Error('Network connection failed');
      expect(isRetryableError(networkError)).toBe(true);
    });

    it('should extract error context', () => {
      const context = { userId: '123', operation: 'test' };
      const error = new AccountingError('Test', 'CODE', context);
      
      expect(extractErrorContext(error)).toEqual(context);
      
      const plainError = new Error('Plain error');
      const extracted = extractErrorContext(plainError);
      expect(extracted.stack).toBeDefined();
      expect(extracted.timestamp).toBeInstanceOf(Date);
    });

    it('should format error for user', () => {
      const error = new ValidationError('Invalid format', 'email');
      expect(formatErrorForUser(error)).toBe('Invalid email: Invalid format');
      
      const plainError = new Error('Technical error');
      expect(formatErrorForUser(plainError)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should identify error types', () => {
      const validationError = new ValidationError('Invalid', 'field');
      const businessError = new BusinessRuleError('Rule violated', 'RULE');
      const authError = new AuthenticationError('Invalid token');
      const authzError = new AuthorizationError('No permission', 'READ');
      const serviceError = new ExternalServiceError('Service down', 'api');
      const timeoutError = new TimeoutError('Timeout', 1000);
      
      expect(isValidationError(validationError)).toBe(true);
      expect(isBusinessRuleError(businessError)).toBe(true);
      expect(isAuthenticationError(authError)).toBe(true);
      expect(isAuthorizationError(authzError)).toBe(true);
      expect(isExternalServiceError(serviceError)).toBe(true);
      expect(isTimeoutError(timeoutError)).toBe(true);
      
      // Test with non-matching errors
      expect(isValidationError(businessError)).toBe(false);
      expect(isBusinessRuleError(validationError)).toBe(false);
    });
  });
});
