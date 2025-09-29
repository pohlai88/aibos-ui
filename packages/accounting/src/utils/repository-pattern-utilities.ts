/**
 * Repository Pattern Utilities - Phase 2 Implementation
 * 
 * Provides standardized repository base classes and patterns for consistent
 * data access, error handling, and CRUD operations across all repositories.
 * 
 * Features:
 * - BaseRepository abstract class with common patterns
 * - Standardized CRUD operations
 * - Error handling for data access
 * - Entity validation integration
 * - Logging and monitoring
 * - Query building helpers
 */

import { Logger } from '@nestjs/common';
import { 
  createBusinessError,
  createValidationError,
  type ErrorContext,
  type BusinessRuleError
} from './error-utilities';
import { 
  createProfiler,
  type PerformanceProfiler,
  PerformanceTimer
} from './performance-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RepositoryOptions {
  enableLogging?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableValidation?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  includeDeleted?: boolean;
  /** Optional transaction object passed through to concrete repos */
  tx?: unknown;
  /** Optional cancellation signal to abort long-running ops */
  signal?: AbortSignal;
}

export interface RepositoryContext extends ErrorContext {
  operation: string;
  entityId?: string;
  entityType?: string;
  query?: unknown;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export interface FindOptions extends QueryOptions {
  where?: Partial<Record<string | number | symbol, unknown>>; // overridden in subclasses for keyof T
  relations?: string[];
  select?: string[]; // subclasses may tighten to (keyof T)[]
}

export interface SaveOptions {
  /** When true, run validation. When false, skip. Undefined => use repository default (enabled). */
  validate?: boolean;
  /** @deprecated Use `validate: false`. Retained for back-compat. */
  skipValidation?: boolean;
  returnEntity?: boolean;
  /** Optional transaction object passed through to concrete repos */
  tx?: unknown;
  /** Optional cancellation signal to abort long-running ops */
  signal?: AbortSignal;
}

export interface DeleteOptions {
  softDelete?: boolean;
  cascade?: boolean;
  validate?: boolean;
  /** Optional transaction object passed through to concrete repos */
  tx?: unknown;
  /** Optional cancellation signal to abort long-running ops */
  signal?: AbortSignal;
}

// ============================================================================
// ABSTRACT BASE REPOSITORY
// ============================================================================

/**
 * Abstract base class for all repositories
 * Provides standardized patterns for data access, error handling, and monitoring
 */
export abstract class BaseRepository<T, ID = string> {
  protected abstract entityName: string;
  protected readonly logger: Logger;
  protected readonly profiler: PerformanceProfiler;
  protected readonly options: RepositoryOptions;

  constructor(
    repositoryName: string,
    options: RepositoryOptions = {}
  ) {
    this.logger = new Logger(repositoryName);
    this.profiler = createProfiler({
      sampleRate: 0.1,
      maxSamples: 1000,
      includeMemory: true
    });
    this.options = {
      enableLogging: options.enableLogging ?? true,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
      enableValidation: options.enableValidation ?? true,
      logLevel: options.logLevel ?? 'info'
    };
  }

  // ============================================================================
  // FIND OPERATIONS
  // ============================================================================

  /**
   * Find entity by ID with error handling
   */
  protected async findByIdWithErrorHandling(
    id: ID,
    options: FindOptions = {}
  ): Promise<T | null> {
    const context = this.createContext('findById', { entityId: String(id) });
    const timer = this.startTimer('findById');

    try {
      this.logOperation('Finding entity by ID', context);
      this.throwIfAborted(options.signal, context);
      
      const entity = await this.findById(id, options);
      
      if (!entity) {
        this.logOperation('Entity not found', context);
      } else {
        this.logOperation('Entity found successfully', context);
      }
      
      this.finishTimer(timer, context);
      return entity;
    } catch (error) {
      this.finishTimer(timer, context);
      this.logError('Failed to find entity by ID', error as Error, context);
      throw this.enhanceRepositoryError(error as Error, 'findById', context);
    }
  }

  /**
   * Find entities with error handling
   */
  protected async findWithErrorHandling(
    options: FindOptions = {}
  ): Promise<T[]> {
    const context = this.createContext('find', { query: options });
    const timer = this.startTimer('find');

    try {
      this.logOperation('Finding entities', context);
      this.throwIfAborted(options.signal, context);
      
      const entities = await this.find(options);
      
      this.logOperation(`Found ${entities.length} entities`, context);
      
      this.finishTimer(timer, context);
      return entities;
    } catch (error) {
      this.finishTimer(timer, context);
      this.logError('Failed to find entities', error as Error, context);
      throw this.enhanceRepositoryError(error as Error, 'find', context);
    }
  }

  /**
   * Find one entity with error handling
   */
  protected async findOneWithErrorHandling(
    options: FindOptions = {}
  ): Promise<T | null> {
    const context = this.createContext('findOne', { query: options });
    const timer = this.startTimer('findOne');

    try {
      this.logOperation('Finding one entity', context);
      this.throwIfAborted(options.signal, context);
      
      const entity = await this.findOne(options);
      
      if (!entity) {
        this.logOperation('Entity not found', context);
      } else {
        this.logOperation('Entity found successfully', context);
      }
      
      this.finishTimer(timer, context);
      return entity;
    } catch (error) {
      this.finishTimer(timer, context);
      this.logError('Failed to find entity', error as Error, context);
      throw this.enhanceRepositoryError(error as Error, 'findOne', context);
    }
  }

  // ============================================================================
  // SAVE OPERATIONS
  // ============================================================================

  /**
   * Save entity with validation and error handling
   */
  protected async saveWithValidation(
    entity: T,
    options: SaveOptions = {}
  ): Promise<T> {
    const context = this.createContext('save', { 
      entityId: this.getEntityId(entity),
      entityType: this.entityName
    });
    const timer = this.startTimer('save');

    try {
      this.logOperation('Saving entity', context);
      this.throwIfAborted(options.signal, context);

      // Validate entity if validation is enabled
      if (this.shouldValidate(options)) {
        this.validateEntity(entity, context);
      }

      const saved = await this.save(entity, options);
      
      this.logOperation('Entity saved successfully', context);
      
      this.finishTimer(timer, context);
      return saved;
    } catch (error) {
      this.finishTimer(timer, context);
      this.logError('Failed to save entity', error as Error, context);
      throw this.enhanceRepositoryError(error as Error, 'save', context);
    }
  }

  /**
   * Update entity with validation and error handling
   */
  protected async updateWithValidation(
    id: ID,
    updates: Partial<T>,
    options: SaveOptions = {}
  ): Promise<T> {
    const context = this.createContext('update', { 
      entityId: String(id),
      entityType: this.entityName
    });
    const timer = this.startTimer('update');

    try {
      this.logOperation('Updating entity', context);
      this.throwIfAborted(options.signal, context);

      // Check if entity exists
      const existing = await this.findById(id, { tx: options.tx, signal: options.signal } as any);
      if (!existing) {
        throw this.createNotFoundError(id);
      }

      // Validate updates if validation is enabled
      if (this.shouldValidate(options)) {
        this.validateEntityUpdates(updates, context);
      }

      const updated = await this.update(id, updates, options);
      
      this.logOperation('Entity updated successfully', context);
      
      this.finishTimer(timer, context);
      return updated;
    } catch (error) {
      this.finishTimer(timer, context);
      this.logError('Failed to update entity', error as Error, context);
      throw this.enhanceRepositoryError(error as Error, 'update', context);
    }
  }

  // ============================================================================
  // DELETE OPERATIONS
  // ============================================================================

  /**
   * Delete entity with error handling
   */
  protected async deleteWithErrorHandling(
    id: ID,
    options: DeleteOptions = {}
  ): Promise<void> {
    const context = this.createContext('delete', { 
      entityId: String(id),
      entityType: this.entityName
    });
    const timer = this.startTimer('delete');

    try {
      this.logOperation('Deleting entity', context);
      this.throwIfAborted(options.signal, context);

      // Check if entity exists
      const existing = await this.findById(id, { tx: options.tx, signal: options.signal } as any);
      if (!existing) {
        throw this.createNotFoundError(id);
      }

      await this.delete(id, options);
      
      this.logOperation('Entity deleted successfully', context);
      
      this.finishTimer(timer, context);
    } catch (error) {
      this.finishTimer(timer, context);
      this.logError('Failed to delete entity', error as Error, context);
      throw this.enhanceRepositoryError(error as Error, 'delete', context);
    }
  }

  // ============================================================================
  // COUNT OPERATIONS
  // ============================================================================

  /**
   * Count entities with error handling
   */
  protected async countWithErrorHandling(
    options: FindOptions = {}
  ): Promise<number> {
    const context = this.createContext('count', { query: options });
    const timer = this.startTimer('count');

    try {
      this.logOperation('Counting entities', context);
      this.throwIfAborted(options.signal, context);
      
      const count = await this.count(options);
      
      this.logOperation(`Counted ${count} entities`, context);
      
      this.finishTimer(timer, context);
      return count;
    } catch (error) {
      this.finishTimer(timer, context);
      this.logError('Failed to count entities', error as Error, context);
      throw this.enhanceRepositoryError(error as Error, 'count', context);
    }
  }

  // ============================================================================
  // EXISTS OPERATIONS
  // ============================================================================

  /**
   * Check if entity exists with error handling
   */
  protected async existsWithErrorHandling(
    id: ID
  ): Promise<boolean> {
    const context = this.createContext('exists', { entityId: String(id) });
    const timer = this.startTimer('exists');

    try {
      this.logOperation('Checking entity existence', context);
      // no extra options here; callers can prefer findByIdWithErrorHandling with signal/tx
      
      const exists = await this.exists(id);
      
      this.logOperation(`Entity exists: ${exists}`, context);
      
      this.finishTimer(timer, context);
      return exists;
    } catch (error) {
      this.finishTimer(timer, context);
      this.logError('Failed to check entity existence', error as Error, context);
      throw this.enhanceRepositoryError(error as Error, 'exists', context);
    }
  }

  // ============================================================================
  // ABSTRACT METHODS (TO BE IMPLEMENTED BY SUBCLASSES)
  // ============================================================================

  protected abstract findById(id: ID, options?: FindOptions): Promise<T | null>;
  protected abstract find(options?: FindOptions): Promise<T[]>;
  protected abstract findOne(options?: FindOptions): Promise<T | null>;
  protected abstract save(entity: T, options?: SaveOptions): Promise<T>;
  protected abstract update(id: ID, updates: Partial<T>, options?: SaveOptions): Promise<T>;
  protected abstract delete(id: ID, options?: DeleteOptions): Promise<void>;
  protected abstract count(options?: FindOptions): Promise<number>;
  protected abstract exists(id: ID): Promise<boolean>;

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  /**
   * Validate entity (to be overridden by subclasses)
   */
  protected validateEntity(entity: T, context?: RepositoryContext): void {
    // Default validation - can be overridden by subclasses
    if (!entity) {
      throw createValidationError(
        'entity',
        'Entity cannot be null or undefined',
        entity,
        context
      );
    }
  }

  /**
   * Validate entity updates (to be overridden by subclasses)
   */
  protected validateEntityUpdates(updates: Partial<T>, context?: RepositoryContext): void {
    // Default validation - can be overridden by subclasses
    if (!updates || Object.keys(updates).length === 0) {
      throw createValidationError(
        'updates',
        'Updates cannot be empty',
        updates,
        context
      );
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /**
   * Create a not found error
   */
  protected createNotFoundError(id: ID): BusinessRuleError {
    return createBusinessError(
      'ENTITY_NOT_FOUND',
      `${this.entityName} with ID '${id}' not found`,
      this.constructor.name,
      { entityId: String(id), entityType: this.entityName }
    );
  }

  /**
   * Enhance repository error with additional context
   */
  protected enhanceRepositoryError(
    error: Error,
    operation: string,
    context: RepositoryContext
  ): Error {
    // If it's already a business error, just add context (duck-typing)
    if (isBusinessError(error)) {
      (error as any).context = { ...(error as any).context, ...context };
      return error as Error;
    }

    // For other errors, wrap them in a business error
    return createBusinessError(
      'REPOSITORY_OPERATION_FAILED',
      `${operation} failed: ${error.message}`,
      this.constructor.name,
      context
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get entity ID (to be overridden by subclasses)
   */
  protected getEntityId(entity: T): string {
    const anyEntity = entity as any;
    if (anyEntity && (typeof anyEntity.id === 'string' || typeof anyEntity.id === 'number')) {
      return String(anyEntity.id);
    }
    return 'unknown';
  }

  /**
   * Create repository context
   */
  protected createContext(
    operation: string,
    additionalContext?: Partial<RepositoryContext>
  ): RepositoryContext {
    return {
      operation,
      entityType: this.entityName,
      timestamp: new Date(),
      startTime: new Date(),
      ...additionalContext
    };
  }

  /**
   * Start performance timer
   */
  protected startTimer(operation: string): PerformanceTimer {
    return new PerformanceTimer(`${this.entityName}_${operation}`);
  }

  /**
   * Log operation
   */
  protected logOperation(message: string, context: RepositoryContext): void {
    if (this.options.enableLogging && this.shouldLog('info')) {
      // Log message with repository name as Nest "context" and JSON payload inline
      this.logger.log(`${message} | ${JSON.stringify({
        operation: context.operation,
        entityType: context.entityType,
        entityId: context.entityId,
        duration: context.duration
      })}`, this.constructor.name);
    }
  }

  /**
   * Log error
   */
  protected logError(message: string, error: Error, context: RepositoryContext): void {
    if (this.options.enableLogging && this.shouldLog('error')) {
      this.logger.error(
        `${message}: ${error.message} | ${JSON.stringify({
          operation: context.operation,
          entityType: context.entityType,
          entityId: context.entityId,
          duration: context.duration
        })}`,
        (error as any)?.stack,
        this.constructor.name
      );
    }
  }

  /**
   * Get performance metrics
   */
  protected getPerformanceMetrics(): any {
    return this.profiler.getStats();
  }

  /** Minimal log threshold check against options.logLevel */
  private shouldLog(level: 'debug'|'info'|'warn'|'error'): boolean {
    const order: Record<'debug'|'info'|'warn'|'error', number> = { debug: 10, info: 20, warn: 30, error: 40 };
    const min = this.options.logLevel ?? 'info';
    return order[level] >= order[min];
  }

  /** Decide if validation should run, honoring both validate and deprecated skipValidation flags */
  protected shouldValidate(options?: SaveOptions): boolean {
    if (!this.options.enableValidation) return false;
    if (!options) return true;
    if (options.validate === false) return false;
    if (options.skipValidation === true) return false;
    return true;
  }

  /** Finish timer and stamp timing into context */
  protected finishTimer(timer: PerformanceTimer, context: RepositoryContext): void {
    try {
      const duration = timer.getElapsedTime();
      context.endTime = new Date();
      if (!context.startTime) context.startTime = new Date(context.endTime.getTime() - duration);
      context.duration = duration;
      // Record metrics only if perf monitoring is enabled
      if (this.options.enablePerformanceMonitoring) {
        this.profiler.record(timer.getMetrics());
      }
    } catch {
      // timer may throw if already ended; ignore to keep repository path robust
    }
  }

  /** Throw a business error if the provided signal is already aborted */
  protected throwIfAborted(signal: AbortSignal | undefined, context: RepositoryContext): void {
    if (signal?.aborted) {
      throw createBusinessError(
        'REPOSITORY_OPERATION_ABORTED',
        `${context.operation} aborted${(signal as any)?.reason ? `: ${(signal as any).reason}` : ''}`,
        this.constructor.name,
        { ...context, reason: (signal as any)?.reason }
      );
    }
  }

  /**
   * Run a function within a transaction boundary.
   * Base implementation throws; infrastructure repos should override.
   */
  protected async withTransaction<R, Tx = unknown>(_fn: (tx: Tx) => Promise<R>): Promise<R> {
    throw createBusinessError(
      'TRANSACTION_NOT_SUPPORTED',
      'withTransaction is not supported by this repository; override in infrastructure repository',
      this.constructor.name,
      { operation: 'withTransaction', entityType: this.entityName }
    );
  }
}

// ============================================================================
// CONCRETE REPOSITORY IMPLEMENTATIONS
// ============================================================================

/**
 * Base class for domain repositories
 */
export abstract class DomainRepositoryBase<T, ID = string> extends BaseRepository<T, ID> {
  constructor(repositoryName: string, options: RepositoryOptions = {}) {
    super(repositoryName, {
      ...options,
      enableLogging: options.enableLogging ?? true,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
      enableValidation: options.enableValidation ?? true
    });
  }
}

/**
 * Base class for infrastructure repositories
 */
export abstract class InfrastructureRepositoryBase<T, ID = string> extends BaseRepository<T, ID> {
  constructor(repositoryName: string, options: RepositoryOptions = {}) {
    super(repositoryName, {
      ...options,
      enableLogging: options.enableLogging ?? false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
      enableValidation: options.enableValidation ?? false
    });
  }
}

// ============================================================================
// QUERY BUILDERS
// ============================================================================

/**
 * Query builder for common repository operations
 */
export class RepositoryQueryBuilder {
  private query: FindOptions = {};

  static create(): RepositoryQueryBuilder {
    return new RepositoryQueryBuilder();
  }

  where(condition: Record<string, any>): this {
    this.query.where = { ...this.query.where, ...condition };
    return this;
  }

  limit(count: number): this {
    this.query.limit = count;
    return this;
  }

  offset(count: number): this {
    this.query.offset = count;
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.query.orderBy = field;
    this.query.orderDirection = (direction || 'ASC').toUpperCase() as 'ASC'|'DESC';
    return this;
  }

  relations(relations: string[]): this {
    this.query.relations = relations;
    return this;
  }

  select(fields: string[]): this {
    this.query.select = fields;
    return this;
  }

  includeDeleted(include: boolean = true): this {
    this.query.includeDeleted = include;
    return this;
  }

  tx(tx: unknown): this {
    this.query.tx = tx;
    return this;
  }

  cancellable(signal: AbortSignal): this {
    this.query.signal = signal;
    return this;
  }

  build(): FindOptions {
    return this.query;
  }
}

// ============================================================================
// REPOSITORY HELPERS
// ============================================================================

/**
 * Create pagination options
 */
export function createPaginationOptions(
  page: number = 1,
  limit: number = 10
): QueryOptions {
  return {
    limit,
    offset: (page - 1) * limit,
    orderBy: 'id',
    orderDirection: 'ASC'
  };
}

/**
 * Create find options with pagination
 */
export function createFindOptionsWithPagination(
  page: number = 1,
  limit: number = 10,
  where?: Partial<Record<string | number | symbol, unknown>>
): FindOptions {
  return {
    ...createPaginationOptions(page, limit),
    ...(where && { where })
  };
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  const safeLimit = Math.max(1, Math.trunc(limit || 1));
  return Math.ceil(total / safeLimit);
}

/**
 * Check if page exists
 */
export function pageExists(page: number, totalPages: number): boolean {
  return page >= 1 && page <= totalPages;
}

// -----------------------------------------------------------------------------
// Pagination result type and helper
// -----------------------------------------------------------------------------
export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Built-in pagination that honors `FindOptions` (including tx/signal).
 * Uses repository's count/find wrappers to keep logging/metrics/errors unified.
 */
export async function paginateRepository<T, ID = string>(
  repo: BaseRepository<T, ID>,
  options: FindOptions & { page?: number; limit?: number } = {}
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 10);
  const findOpts: FindOptions = {
    ...options,
    ...createPaginationOptions(page, limit),
  };
  const [total, data] = await Promise.all([
    (repo as any).countWithErrorHandling({ ...options }),
    (repo as any).findWithErrorHandling(findOpts),
  ]);
  const totalPages = calculateTotalPages(total, limit);
  return { data, page, limit, total, totalPages };
}

// --------------------------------------------------------------------------------------
// Local type guard to avoid runtime `instanceof` on an erased type import
// --------------------------------------------------------------------------------------
function isBusinessError(err: unknown): err is BusinessRuleError & { context?: unknown } {
  const e = err as any;
  return !!e && typeof e === 'object'
    && typeof e.code === 'string'
    && typeof e.message === 'string'
    && (typeof e.source === 'string' || typeof e.source === 'undefined');
}
