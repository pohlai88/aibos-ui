/**
 * Error Handling Utilities - Phase 3 Implementation
 * 
 * Comprehensive error handling utilities for accounting operations.
 * Provides structured error types and error handling patterns.
 * 
 * Features:
 * - Custom error classes for accounting domain
 * - Validation error handling
 * - Business rule error handling
 * - Authorization error handling
 * - Async error handling with retry logic
 * - Timeout handling
 * - Error context and debugging support
 * - Circuit breaker integration
 * - Error recovery strategies
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp?: Date;
  operation?: string;
  component?: string;
  errorCode?: string;
  entityId?: string;
  entityType?: string;
  data?: unknown;
  stack?: string;
  tenantId?: string;
  invoiceId?: string;
  customerId?: string;
  invoiceNumber?: string;
  status?: string;
  issuedBy?: string;
  sentBy?: string;
  paidBy?: string;
  cancelledBy?: string;
  paidAmount?: number;
  paymentDate?: Date;
  reason?: string;
  userRole?: string;
  accountCode?: string;
  accountName?: string;
  journalEntryId?: string;
  reference?: string;
  fromCurrency?: string;
  toCurrency?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  limit?: string;
}

export interface ErrorRetryOptions {
  maxRetries: number;
  delay: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  retryCondition?: (error: Error) => boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * Base error class for all accounting-related errors
 */
export class AccountingError extends Error {
  public readonly code: string;
  public readonly context?: ErrorContext;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    context?: ErrorContext
  ) {
    super(message);
    this.name = 'AccountingError';
    this.code = code;
    if (context !== undefined) {
      this.context = context;
    }
    this.timestamp = new Date();
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AccountingError);
    }
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.message;
  }
}

/**
 * Validation error for data validation failures
 */
export class ValidationError extends AccountingError {
  public readonly field: string;
  public readonly value: unknown;

  constructor(
    message: string,
    field: string,
    value?: unknown,
    context?: ErrorContext
  ) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }

  override getUserMessage(): string {
    return `Invalid ${this.field}: ${this.message}`;
  }
}

/**
 * Business rule error for domain logic violations
 */
export class BusinessRuleError extends AccountingError {
  public readonly rule: string;
  public readonly entity?: string;

  constructor(
    message: string,
    rule: string,
    entity?: string,
    context?: ErrorContext
  ) {
    super(message, 'BUSINESS_RULE_ERROR', context);
    this.name = 'BusinessRuleError';
    this.rule = rule;
    if (entity !== undefined) {
      this.entity = entity;
    }
  }

  override getUserMessage(): string {
    return `Business rule violation: ${this.message}`;
  }
}

/**
 * Authentication/authorization error
 */
export class AuthenticationError extends AccountingError {
  constructor(
    message: string = 'Authentication required',
    context?: ErrorContext
  ) {
    super(message, 'AUTHENTICATION_ERROR', context);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization/permission error
 */
export class AuthorizationError extends AccountingError {
  public readonly permission: string;
  public readonly resource?: string;

  constructor(
    message: string,
    permission: string,
    resource?: string,
    context?: ErrorContext
  ) {
    super(message, 'AUTHORIZATION_ERROR', context);
    this.name = 'AuthorizationError';
    this.permission = permission;
    if (resource !== undefined) {
      this.resource = resource;
    }
  }

  override getUserMessage(): string {
    return `Access denied: ${this.message}`;
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AccountingError {
  public readonly service: string;
  public readonly statusCode?: number;

  constructor(
    message: string,
    service: string,
    statusCode?: number,
    context?: ErrorContext
  ) {
    super(message, 'EXTERNAL_SERVICE_ERROR', context);
    this.name = 'ExternalServiceError';
    this.service = service;
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
  }

  override getUserMessage(): string {
    return `Service unavailable: ${this.service}`;
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends AccountingError {
  public readonly timeoutMs: number;

  constructor(
    message: string,
    timeoutMs: number,
    context?: ErrorContext
  ) {
    super(message, 'TIMEOUT_ERROR', context);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }

  override getUserMessage(): string {
    return `Operation timed out after ${this.timeoutMs}ms`;
  }
}

// ============================================================================
// ERROR CREATION HELPERS
// ============================================================================

/**
 * Create a validation error with context
 */
export function createValidationError(
  field: string,
  message: string,
  value?: unknown,
  context?: ErrorContext
): ValidationError {
  return new ValidationError(message, field, value, context);
}

/**
 * Create a business rule error with context
 */
export function createBusinessError(
  rule: string,
  message: string,
  entity?: string,
  context?: ErrorContext
): BusinessRuleError {
  return new BusinessRuleError(message, rule, entity, context);
}

/**
 * Create an authentication error
 */
export function createAuthError(
  message?: string,
  context?: ErrorContext
): AuthenticationError {
  return new AuthenticationError(message, context);
}

/**
 * Create an authorization error
 */
export function createAuthzError(
  message: string,
  permission: string,
  resource?: string,
  context?: ErrorContext
): AuthorizationError {
  return new AuthorizationError(message, permission, resource, context);
}

/**
 * Create an external service error
 */
export function createServiceError(
  message: string,
  service: string,
  statusCode?: number,
  context?: ErrorContext
): ExternalServiceError {
  return new ExternalServiceError(message, service, statusCode, context);
}

/**
 * Create a timeout error
 */
export function createTimeoutError(
  message: string,
  timeoutMs: number,
  context?: ErrorContext
): TimeoutError {
  return new TimeoutError(message, timeoutMs, context);
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Handle async operations with error wrapping
 */
export async function handleAsyncError<T>(
  function_: () => Promise<T>,
  context?: ErrorContext
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await function_();
    return { data, error: null };
  } catch (error) {
    const wrappedError = error instanceof AccountingError 
      ? error 
      : new AccountingError(
          error instanceof Error ? error.message : 'Unknown error',
          'UNKNOWN_ERROR',
          context
        );
    return { data: null, error: wrappedError };
  }
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  function_: () => Promise<T>,
  options: ErrorRetryOptions,
  context?: ErrorContext
): Promise<T> {
  const {
    maxRetries,
    delay,
    backoffMultiplier = 2,
    maxDelay = 30000,
    retryCondition = () => true
  } = options;

  let lastError: Error;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await function_();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries || !retryCondition(lastError)) {
        throw new AccountingError(
          `Operation failed after ${maxRetries + 1} attempts: ${lastError.message}`,
          'RETRY_EXHAUSTED',
          { ...context, operation: 'retry' }
        );
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      
      // Exponential backoff
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
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
  context?: ErrorContext
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(createTimeoutError(
        `Operation timed out after ${timeoutMs}ms`,
        timeoutMs,
        context
      ));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker<T> {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private function_: () => Promise<T>,
    private options: CircuitBreakerOptions
  ) {}

  async execute(): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw createServiceError(
          'Circuit breaker is OPEN',
          'circuit-breaker',
          undefined,
          { operation: 'circuit-breaker-execute' }
        );
      }
    }

    try {
      const result = await this.function_();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

/**
 * Create a circuit breaker
 */
export function createCircuitBreaker<T>(
  function_: () => Promise<T>,
  options: CircuitBreakerOptions
): CircuitBreaker<T> {
  return new CircuitBreaker(function_, options);
}

// ============================================================================
// ERROR ANALYSIS UTILITIES
// ============================================================================

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof AccountingError) {
    return ['EXTERNAL_SERVICE_ERROR', 'TIMEOUT_ERROR'].includes(error.code);
  }
  
  // Check for common retryable error patterns
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /connection/i,
    /service unavailable/i,
    /rate limit/i
  ];
  
  return retryablePatterns.some(pattern => pattern.test(error.message));
}

/**
 * Extract error context for logging
 */
export function extractErrorContext(error: Error): ErrorContext {
  if (error instanceof AccountingError) {
    return error.context || {};
  }
  
  return {
    ...(error.stack && { stack: error.stack }),
    timestamp: new Date()
  };
}

/**
 * Format error for user display
 */
export function formatErrorForUser(error: Error): string {
  if (error instanceof AccountingError) {
    return error.getUserMessage();
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: Error): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if error is a business rule error
 */
export function isBusinessRuleError(error: Error): error is BusinessRuleError {
  return error instanceof BusinessRuleError;
}

/**
 * Check if error is an authentication error
 */
export function isAuthenticationError(error: Error): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Check if error is an authorization error
 */
export function isAuthorizationError(error: Error): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

/**
 * Check if error is an external service error
 */
export function isExternalServiceError(error: Error): error is ExternalServiceError {
  return error instanceof ExternalServiceError;
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: Error): error is TimeoutError {
  return error instanceof TimeoutError;
}
