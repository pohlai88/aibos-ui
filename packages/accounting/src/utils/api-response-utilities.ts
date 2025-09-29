/**
 * API Response Utilities - Phase 2 Implementation
 * 
 * Provides standardized API response building and handling for consistent
 * response formats across all controllers and API endpoints.
 * 
 * Features:
 * - ApiResponseBuilder for standardized response creation
 * - ControllerBase abstract class for common controller patterns
 * - Error response standardization
 * - Success response formatting
 * - Validation error handling
 * - Response metadata and pagination support
 */

import {
  type ErrorContext,
  // keep creators out if unused to avoid dead-code
} from './error-utilities';
import { type ValidationIssue, type BusinessValidationResult } from './validation-utilities';
// Import runtime constructors (classes) or fall back to narrowers if your
// error-utilities exposes functions. Replace these as appropriate in your codebase.
import {
  ValidationError,        // runtime constructor (class) recommended
  BusinessRuleError,      // runtime constructor (class) recommended
  AuthorizationError      // runtime constructor (class) recommended
} from './error-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  metadata?: ResponseMetadata;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  context?: ErrorContext;
  issues?: ValidationIssue[];
  timestamp: string;
  requestId?: string;
}

export interface ResponseMetadata {
  timestamp?: string;
  requestId?: string;
  processingTime?: number;
  version?: string;
  pagination?: PaginationMetadata;
}

/**
 * Create a standardized 400 response from a ValidationResult,
 * preserving structured issues for frontends to pinpoint fields.
 */
export function validationError(
  result: BusinessValidationResult,
  opts: { requestId?: string; context?: ErrorContext; message?: string } = {}
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: 'VALIDATION_FAILED',
    message: opts.message ?? (result.errors?.[0] ?? 'Validation failed'),
    statusCode: 400,
    issues: result.issues ?? [],
    timestamp: new Date().toISOString()
  };
  
  if (opts.context) {
    response.context = opts.context;
  }
  
  if (opts.requestId) {
    response.requestId = opts.requestId;
  }
  
  return response;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiResponseOptions {
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
  includeRequestId?: boolean;
  version?: string;
  /** Use an existing request id if you already have one upstream */
  requestId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

// ============================================================================
// API RESPONSE BUILDER
// ============================================================================

/**
 * Builder class for creating standardized API responses
 */
export class ApiResponseBuilder {
  private static readonly DEFAULT_VERSION = '1.0.0';

  /** Public accessor to avoid private reflection hacks */
  public static get defaultVersion(): string {
    return this.DEFAULT_VERSION;
  }

  /** Public, stable request id generator */
  public static newRequestId(): string {
    try {
      // Prefer crypto.randomUUID when available
      const uuid = globalThis.crypto?.randomUUID?.();
      if (uuid) return `req_${uuid}`;
    } catch {
      // Fallback to timestamp + random
    }
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Create a success response
   */
  static success<T>(
    data: T,
    message: string = 'Operation completed successfully',
    options: ApiResponseOptions = {}
  ): SuccessResponse<T> {
    const response: SuccessResponse<T> = {
      success: true,
      message,
      data
    };

    if (options.includeMetadata !== false) {
      response.metadata = {
        ...(options.includeTimestamp !== false ? { timestamp: new Date().toISOString() } : {}),
        version: options.version || this.DEFAULT_VERSION
      };

      if (response.metadata) {
        if (options.requestId) {
          response.metadata.requestId = options.requestId;
        } else if (options.includeRequestId) {
          response.metadata.requestId = this.newRequestId();
        }
      }
    }

    return response;
  }

  /**
   * Create a success response with pagination
   */
  static successWithPagination<T>(
    data: T[],
    pagination: PaginationOptions,
    message: string = 'Data retrieved successfully',
    options: ApiResponseOptions = {}
  ): SuccessResponse<T[]> {
    const response = this.success(data, message, options);
    
    if (response.metadata) {
      response.metadata.pagination = createPaginationMetadata(
        pagination.page,
        pagination.limit,
        pagination.total
      );
    }

    return response;
  }

  /**
   * Create an error response
   */
  static error(
    error: Error,
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    const statusCode = this.getStatusCode(error);
    
    const response: ErrorResponse = {
      success: false,
      error: error.name || 'UnknownError',
      message: error.message,
      statusCode,
      timestamp: new Date().toISOString()
    };

    if (context) {
      response.context = context;
    }

    if (options.requestId) {
      response.requestId = options.requestId;
    } else if (options.includeRequestId) {
      response.requestId = this.newRequestId();
    }

    // attach validation issues if present
    const issues = getIssuesIfAny(error);
    if (issues) response.issues = issues;

    return response;
  }

  /**
   * Create a validation error response
   */
  static validationError(
    issues: ValidationIssue[],
    message: string = 'Validation failed',
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: 'ValidationError',
      message,
      statusCode: 400,
      issues,
      timestamp: new Date().toISOString()
    };

    if (context) {
      response.context = context;
    }

    if (options.requestId) {
      response.requestId = options.requestId;
    } else if (options.includeRequestId) {
      response.requestId = this.newRequestId();
    }

    return response;
  }

  /**
   * Create a business rule error response
   */
  static businessError(
    errorCode: string,
    message: string,
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: 'BusinessRuleError',
      message,
      statusCode: 422,
      timestamp: new Date().toISOString()
    };

    if (context) {
      response.context = { ...context, errorCode };
    }

    if (options.requestId) {
      response.requestId = options.requestId;
    } else if (options.includeRequestId) {
      response.requestId = this.newRequestId();
    }

    return response;
  }

  /**
   * Create a not found error response
   */
  static notFound(
    resource: string,
    identifier: string,
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: 'NotFoundError',
      message: `${resource} with identifier '${identifier}' not found`,
      statusCode: 404,
      timestamp: new Date().toISOString()
    };

    if (context) {
      response.context = context;
    }

    if (options.requestId) {
      response.requestId = options.requestId;
    } else if (options.includeRequestId) {
      response.requestId = this.newRequestId();
    }

    return response;
  }

  /**
   * Create an unauthorized error response
   */
  static unauthorized(
    message: string = 'Unauthorized access',
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: 'UnauthorizedError',
      message,
      statusCode: 401,
      timestamp: new Date().toISOString()
    };

    if (context) {
      response.context = context;
    }

    if (options.requestId) {
      response.requestId = options.requestId;
    } else if (options.includeRequestId) {
      response.requestId = this.newRequestId();
    }

    return response;
  }

  /**
   * Create a forbidden error response
   */
  static forbidden(
    message: string = 'Access forbidden',
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: 'ForbiddenError',
      message,
      statusCode: 403,
      timestamp: new Date().toISOString()
    };

    if (context) {
      response.context = context;
    }

    if (options.requestId) {
      response.requestId = options.requestId;
    } else if (options.includeRequestId) {
      response.requestId = this.newRequestId();
    }

    return response;
  }

  /**
   * Create an internal server error response
   */
  static internalError(
    message: string = 'Internal server error',
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: 'InternalServerError',
      message,
      statusCode: 500,
      timestamp: new Date().toISOString()
    };

    if (context) {
      response.context = context;
    }

    if (options.requestId) {
      response.requestId = options.requestId;
    } else if (options.includeRequestId) {
      response.requestId = this.newRequestId();
    }

    return response;
  }

  /**
   * Get HTTP status code for an error
   */
  private static getStatusCode(error: Error): number {
    // Prefer runtime constructors; otherwise fall back to name/code checks
    if (isValidationError(error)) return 400;
    if (isBusinessRuleError(error)) return 422;
    if (isAuthorizationError(error)) return 403;
    // Framework / library hints (Nest HttpException or similar)
    const hinted = getHttpStatusFromLike(error as unknown);
    if (typeof hinted === 'number') return hinted;
    // Check error name for common patterns
    if (error.name === 'UnauthorizedError') return 401;
    if (error.name === 'ForbiddenError') return 403;
    if (error.name === 'NotFoundError') return 404;
    if (error.name === 'ConflictError') return 409;
    if (error.name === 'TooManyRequestsError') return 429;
    if ((error as Error)?.name === 'ZodError') return 400;
    return 500;
  }

}

// ============================================================================
// CONTROLLER BASE
// ============================================================================

/**
 * Abstract base class for all API controllers
 * Provides standardized response building and error handling
 */
export abstract class ControllerBase {
  protected readonly controllerName: string;

  constructor(controllerName: string) {
    this.controllerName = controllerName;
  }

  /** Subclasses can override to route through Monitoring utilities */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected logError(error: Error, context?: any): void {
    // Keep console fallback to avoid breaking environments without a logger
    // You can override in child controllers to send to your Monitoring layer
    // or use dependency injection to wire a logger.
     
    console.error(`Controller ${this.controllerName} error:`, error, context);
  }

  /**
   * Build a success response
   */
  protected buildSuccessResponse<T>(
    data: T,
    message?: string,
    options: ApiResponseOptions = {}
  ): SuccessResponse<T> {
    return ApiResponseBuilder.success(data, message, options);
  }

  /**
   * Build a success response with pagination
   */
  protected buildSuccessResponseWithPagination<T>(
    data: T[],
    pagination: PaginationOptions,
    message?: string,
    options: ApiResponseOptions = {}
  ): SuccessResponse<T[]> {
    return ApiResponseBuilder.successWithPagination(data, pagination, message, options);
  }

  /**
   * Build an error response
   */
  protected buildErrorResponse(
    error: Error,
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    return ApiResponseBuilder.error(error, context, options);
  }

  /**
   * Build a validation error response
   */
  protected buildValidationErrorResponse(
    issues: ValidationIssue[],
    message?: string,
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    return ApiResponseBuilder.validationError(issues, message, context, options);
  }

  /**
   * Build a business error response
   */
  protected buildBusinessErrorResponse(
    errorCode: string,
    message: string,
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    return ApiResponseBuilder.businessError(errorCode, message, context, options);
  }

  /**
   * Build a not found error response
   */
  protected buildNotFoundResponse(
    resource: string,
    identifier: string,
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    return ApiResponseBuilder.notFound(resource, identifier, context, options);
  }

  /**
   * Build an unauthorized error response
   */
  protected buildUnauthorizedResponse(
    message?: string,
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    return ApiResponseBuilder.unauthorized(message, context, options);
  }

  /**
   * Build a forbidden error response
   */
  protected buildForbiddenResponse(
    message?: string,
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    return ApiResponseBuilder.forbidden(message, context, options);
  }

  /**
   * Build an internal server error response
   */
  protected buildInternalErrorResponse(
    message?: string,
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    return ApiResponseBuilder.internalError(message, context, options);
  }

  /**
   * Handle an error and return appropriate response
   */
  protected handleError(
    error: Error,
    context?: ErrorContext,
    options: ApiResponseOptions = {}
  ): ErrorResponse {
    // Log the error for debugging (overridable hook)
    this.logError(error, context);

    // Return appropriate error response
    return this.buildErrorResponse(error, context, options);
  }

  /**
   * Create error context for the controller
   */
  protected createErrorContext(
    operation: string,
    additionalContext?: Partial<ErrorContext>
  ): ErrorContext {
    return {
      operation,
      component: this.controllerName,
      timestamp: new Date(),
      ...additionalContext
    };
  }
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create a pagination metadata object
 */
export function createPaginationMetadata(
  page: number,
  limit: number,
  total: number
): PaginationMetadata {
  const safePage = Math.max(1, Math.trunc(page || 1));
  const safeLimit = Math.max(1, Math.trunc(limit || 1));
  const safeTotal = Math.max(0, Math.trunc(total || 0));
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));
  
  return {
    page: Math.min(safePage, totalPages),
    limit: safeLimit,
    total: safeTotal,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrevious: safePage > 1
  };
}

/**
 * Create response metadata
 */
export function createResponseMetadata(
  startTime: Date,
  options: ApiResponseOptions = {}
): ResponseMetadata {
  const metadata: ResponseMetadata = {
    ...(options.includeTimestamp !== false ? { timestamp: new Date().toISOString() } : {}),
    version: options.version || ApiResponseBuilder.defaultVersion
  };

  if (options.requestId) {
    metadata.requestId = options.requestId;
  } else if (options.includeRequestId) {
    metadata.requestId = ApiResponseBuilder.newRequestId();
  }

  if (startTime) {
    metadata.processingTime = Date.now() - startTime.getTime();
  }

  return metadata;
}

/**
 * Check if a response is a success response
 */
export function isSuccessResponse<T = unknown>(response: unknown): response is SuccessResponse<T> {
  return !!(response && (response as { success?: boolean }).success === true);
}

/**
 * Check if a response is an error response
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return !!(response && (response as { success?: boolean }).success === false);
}

/**
 * Extract data from a success response
 */
export function extractData<T>(response: SuccessResponse<T>): T {
  return response.data;
}

/**
 * Extract error message from an error response
 */
export function extractErrorMessage(response: ErrorResponse): string {
  return response.message;
}

/**
 * Extract validation issues from an error response
 */
export function extractValidationIssues(response: ErrorResponse): ValidationIssue[] {
  return response.issues || [];
}

// -------------------- local type guards --------------------
function isValidationError(e: Error): boolean {
  // runtime constructor first
  if (typeof ValidationError === 'function' && e instanceof (ValidationError as any)) return true;
  return e.name === 'ValidationError';
}
function isBusinessRuleError(e: Error): boolean {
  if (typeof BusinessRuleError === 'function' && e instanceof (BusinessRuleError as any)) return true;
  return e.name === 'BusinessRuleError' || (e as Error & { code?: string }).code === 'BUSINESS_RULE_VIOLATION';
}
function isAuthorizationError(e: Error): boolean {
  if (typeof AuthorizationError === 'function' && e instanceof (AuthorizationError as any)) return true;
  return e.name === 'AuthorizationError' || (e as Error & { code?: string }).code === 'AUTH_FORBIDDEN';
}
function getIssuesIfAny(e: unknown): ValidationIssue[] | undefined {
  const issues = (e as { issues?: unknown })?.issues;
  return Array.isArray(issues) ? issues as ValidationIssue[] : undefined;
}

// Pull status hints from common error shapes (Nest HttpException, fetch Response-like, etc.)
function getHttpStatusFromLike(e: unknown): number | undefined {
  try {
    if (e && typeof (e as { getStatus?: () => unknown }).getStatus === 'function') {
      const s = (e as { getStatus: () => unknown }).getStatus();
      if (typeof s === 'number') return s;
    }
    if (typeof (e as { status?: unknown })?.status === 'number') return (e as { status: number }).status;
    if (typeof (e as { statusCode?: unknown })?.statusCode === 'number') return (e as { statusCode: number }).statusCode;
  } catch {}
  return undefined;
}
