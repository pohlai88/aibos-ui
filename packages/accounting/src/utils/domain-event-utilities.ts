/**
 * Domain Event Utilities - Phase 2 Implementation
 * 
 * Provides standardized domain event creation, handling, and management
 * for consistent event sourcing patterns across the accounting domain.
 * 
 * Features:
 * - DomainEventFactory for standardized event creation
 * - Event metadata generation
 * - Event validation and serialization
 * - Event handler registration and execution
 * - Event store integration helpers
 * - Event replay and projection utilities
 */

import { 
  type ErrorContext,
  createValidationError
} from './error-utilities';
import type { z } from 'zod';

// UUID implementation for consistent ID generation


// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** Narrow event types used across accounting */
export type EventType =
  | 'AccountCreated'
  | 'AccountUpdated'
  | 'AccountParentChanged'
  | 'JournalEntryPosted'
  | 'JournalEntryCancelled'
  | 'InvoiceIssued'
  | 'InvoicePaid';

export interface EventMetadata {
  eventId: string;
  aggregateId: string;
  version: number;
  timestamp: Date;
  causationId?: string;
  correlationId: string;
  eventType: EventType | string;
  source?: string;
  userId?: string;
  tenantId?: string;
}

export interface DomainEvent<T = unknown> {
  eventId: string;
  aggregateId: string;
  version: number;
  timestamp: Date;
  causationId?: string;
  correlationId: string;
  eventType: EventType | string;
  data: T;
  metadata: EventMetadata;
}

export interface EventHandler<T = unknown> {
  eventType: EventType | string;
  handler: (event: DomainEvent<T>, context?: EventContext) => Promise<void> | void;
  priority?: number;
  async?: boolean;
}

export interface EventContext extends ErrorContext {
  eventId?: string;
  aggregateId?: string;
  causationId?: string;
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  timestamp?: Date;
}

export interface EventStoreOptions {
  validateEvents?: boolean;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  batchSize?: number;
  /** Max concurrent async handlers (applies when handler.async === true). Default: 8 */
  maxAsyncConcurrency?: number;
  /** If true, async handlers are routed through a bounded queue (backpressure). Default: true */
  backpressureAsync?: boolean;
}

export interface EventReplayOptions {
  fromVersion?: number;
  toVersion?: number;
  fromDate?: Date;
  toDate?: Date;
  eventTypes?: Array<EventType | string>;
  aggregateIds?: string[];
}

// ============================================================================
// DOMAIN EVENT FACTORY
// ============================================================================

/**
 * Factory class for creating standardized domain events
 */
export class DomainEventFactory {
  private static readonly EVENT_ID_PREFIX = 'evt_';
  private static readonly CORRELATION_ID_PREFIX = 'corr_';
  /** Zod schema registry per eventType (optional). */
  private static readonly schemas = new Map<string, z.ZodTypeAny>();

  /**
   * Create event metadata
   */
  static createEventMetadata(
    aggregateId: string,
    version: number,
    eventType: EventType | string,
    options: {
      causationId?: string;
      correlationId?: string;
      userId?: string;
      tenantId?: string;
      source?: string;
    } = {}
  ): EventMetadata {
    const metadata: EventMetadata = {
      eventId: this.generateEventId(),
      aggregateId,
      version,
      timestamp: new Date(),
      correlationId: options.correlationId || this.generateCorrelationId(),
      eventType
    };

    if (options.causationId) metadata.causationId = options.causationId;
    if (options.source) metadata.source = options.source;
    if (options.userId) metadata.userId = options.userId;
    if (options.tenantId) metadata.tenantId = options.tenantId;

    return metadata;
  }

  /**
   * Register a Zod schema for an event type. Subsequent emits will be validated.
   * Usage: DomainEventFactory.withSchema('InvoiceIssued', schema)
   */
  static withSchema(eventType: EventType | string, schema: z.ZodTypeAny): void {
    this.schemas.set(eventType, schema);
  }

  /** Validate payload against a registered schema (if any) */
  private static validatePayload(eventType: string, data: unknown): void {
    const schema = this.schemas.get(eventType);
    if (!schema) return;
    const result = schema.safeParse(data);
    if (!result.success) {
      // surface the first issue in our standardized error
      const issue = result.error.issues[0];
      const path = issue?.path?.join('.') || 'data';
      throw createValidationError(path, issue?.message || 'Invalid event payload', data);
    }
  }

  /**
   * Create a domain event
   */
  static createDomainEvent<T = unknown>(
    aggregateId: string,
    version: number,
    eventType: EventType | string,
    data: T,
    options: {
      causationId?: string;
      correlationId?: string;
      userId?: string;
      tenantId?: string;
      source?: string;
    } = {}
  ): DomainEvent<T> {
    // Optional payload validation via Zod
    this.validatePayload(eventType, data);

    const metadata = this.createEventMetadata(
      aggregateId,
      version,
      eventType,
      options
    );

    const event: DomainEvent<T> = {
      eventId: metadata.eventId,
      aggregateId,
      version,
      timestamp: metadata.timestamp,
      correlationId: metadata.correlationId,
      eventType,
      data,
      metadata
    };

    if (metadata.causationId) event.causationId = metadata.causationId;

    return event;
  }

  // ============================================================================
  // ACCOUNT EVENTS
  // ============================================================================

  /**
   * Create AccountCreatedEvent
   */
  static createAccountCreatedEvent(
    accountCode: string,
    tenantId: string,
    data: {
      accountName: string;
      accountType: string;
      parentAccountCode?: string;
      balance: number;
    },
    options: {
      causationId?: string;
      correlationId?: string;
      userId?: string;
    } = {}
  ): DomainEvent<typeof data> {
    return this.createDomainEvent(
      accountCode,
      1,
      'AccountCreated',
      data,
      {
        ...options,
        tenantId,
        source: 'AccountService'
      }
    );
  }

  /**
   * Create AccountUpdatedEvent
   */
  static createAccountUpdatedEvent(
    accountCode: string,
    version: number,
    tenantId: string,
    data: {
      accountName?: string;
      accountType?: string;
      parentAccountCode?: string;
      balance?: number;
      isActive?: boolean;
    },
    options: {
      causationId?: string;
      correlationId?: string;
      userId?: string;
    } = {}
  ): DomainEvent<typeof data> {
    return this.createDomainEvent(
      accountCode,
      version,
      'AccountUpdated',
      data,
      {
        ...options,
        tenantId,
        source: 'AccountService'
      }
    );
  }

  /**
   * Create AccountParentChangedEvent
   */
  static createAccountParentChangedEvent(
    accountCode: string,
    version: number,
    tenantId: string,
    data: {
      oldParentAccountCode?: string;
      newParentAccountCode?: string;
    },
    options: {
      causationId?: string;
      correlationId?: string;
      userId?: string;
    } = {}
  ): DomainEvent<typeof data> {
    return this.createDomainEvent(
      accountCode,
      version,
      'AccountParentChanged',
      data,
      {
        ...options,
        tenantId,
        source: 'AccountService'
      }
    );
  }

  // ============================================================================
  // JOURNAL ENTRY EVENTS
  // ============================================================================

  /**
   * Create JournalEntryPostedEvent
   */
  static createJournalEntryPostedEvent(
    journalEntryId: string,
    version: number,
    tenantId: string,
    data: {
      entryNumber: string;
      description: string;
      postingDate: Date;
      totalDebit: number;
      totalCredit: number;
      lines: Array<{
        accountCode: string;
        description: string;
        debitAmount: number;
        creditAmount: number;
      }>;
    },
    options: {
      causationId?: string;
      correlationId?: string;
      userId?: string;
    } = {}
  ): DomainEvent<typeof data> {
    return this.createDomainEvent(
      journalEntryId,
      version,
      'JournalEntryPosted',
      data,
      {
        ...options,
        tenantId,
        source: 'JournalEntryService'
      }
    );
  }

  /**
   * Create JournalEntryCancelledEvent
   */
  static createJournalEntryCancelledEvent(
    journalEntryId: string,
    version: number,
    tenantId: string,
    data: {
      reason: string;
      cancelledBy: string;
    },
    options: {
      causationId?: string;
      correlationId?: string;
      userId?: string;
    } = {}
  ): DomainEvent<typeof data> {
    return this.createDomainEvent(
      journalEntryId,
      version,
      'JournalEntryCancelled',
      data,
      {
        ...options,
        tenantId,
        source: 'JournalEntryService'
      }
    );
  }

  // ============================================================================
  // INVOICE EVENTS
  // ============================================================================

  /**
   * Create InvoiceIssuedEvent
   */
  static createInvoiceIssuedEvent(
    invoiceId: string,
    version: number,
    tenantId: string,
    data: {
      invoiceNumber: string;
      customerId: string;
      issueDate: Date;
      dueDate: Date;
      subtotal: number;
      tax: number;
      total: number;
      items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        amount: number;
      }>;
    },
    options: {
      causationId?: string;
      correlationId?: string;
      userId?: string;
    } = {}
  ): DomainEvent<typeof data> {
    return this.createDomainEvent(
      invoiceId,
      version,
      'InvoiceIssued',
      data,
      {
        ...options,
        tenantId,
        source: 'InvoiceService'
      }
    );
  }

  /**
   * Create InvoicePaidEvent
   */
  static createInvoicePaidEvent(
    invoiceId: string,
    version: number,
    tenantId: string,
    data: {
      paymentDate: Date;
      paidAmount: number;
      paymentMethod: string;
      reference: string;
    },
    options: {
      causationId?: string;
      correlationId?: string;
      userId?: string;
    } = {}
  ): DomainEvent<typeof data> {
    return this.createDomainEvent(
      invoiceId,
      version,
      'InvoicePaid',
      data,
      {
        ...options,
        tenantId,
        source: 'InvoiceService'
      }
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    return `${this.EVENT_ID_PREFIX}${DomainEventFactory.generateUUID()}`;
  }

  /**
   * Generate unique correlation ID
   */
  private static generateCorrelationId(): string {
    return `${this.CORRELATION_ID_PREFIX}${DomainEventFactory.generateUUID()}`;
  }


  /**
   * Generate UUID using crypto.randomUUID when available, with fallback.
   * Ensures consistent ID generation across all utilities.
   */
  private static generateUUID(): string {
    try {
      // Prefer crypto.randomUUID when available
      const uuid = globalThis.crypto?.randomUUID?.();
      if (uuid) return uuid;
    } catch {
      // Fallback to timestamp + random
    }
    return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }


  /**
   * Validate event data
   */
  static validateEvent(event: DomainEvent): void {
    if (!event.eventId) {
      throw createValidationError('eventId', 'Event ID is required', event);
    }
    if (!event.aggregateId) {
      throw createValidationError('aggregateId', 'Aggregate ID is required', event);
    }
    if (!event.eventType) {
      throw createValidationError('eventType', 'Event type is required', event);
    }
    if (!(event.timestamp instanceof Date) || Number.isNaN(event.timestamp.getTime())) {
      throw createValidationError('timestamp', 'Timestamp must be a valid Date', event);
    }
    // force integer semantics
    if (!Number.isFinite(event.version) || Math.trunc(event.version) < 1) {
      throw createValidationError('version', 'Version must be an integer >= 1', event);
    }
  }

  /**
   * Serialize event to JSON
   */
  static serializeEvent(event: DomainEvent): string {
    this.validateEvent(event);
    return JSON.stringify(event, null, 2);
  }

  /**
   * Deserialize event from JSON
   */
  static deserializeEvent<T = unknown>(json: string): DomainEvent<T> {
    try {
      const raw = JSON.parse(json);
      // revive timestamps to Date instances
      const timestamp = raw.timestamp ? new Date(raw.timestamp) : new Date();
      const metadataTs = raw.metadata?.timestamp ? new Date(raw.metadata.timestamp) : timestamp;
      const metadata: EventMetadata = {
        eventId: raw.eventId ?? `${this.EVENT_ID_PREFIX}${this.generateUUID()}`,
        aggregateId: raw.aggregateId,
        version: raw.version,
        timestamp: metadataTs,
        causationId: raw.causationId ?? raw.metadata?.causationId,
        correlationId: raw.correlationId ?? raw.metadata?.correlationId ?? `${this.CORRELATION_ID_PREFIX}${this.generateUUID()}`,
        eventType: raw.eventType,
        source: raw.metadata?.source,
        userId: raw.metadata?.userId,
        tenantId: raw.metadata?.tenantId,
      };
      const event: DomainEvent<T> = {
        eventId: raw.eventId ?? metadata.eventId,
        aggregateId: raw.aggregateId,
        version: raw.version,
        timestamp,
        causationId: raw.causationId,
        correlationId: raw.correlationId ?? metadata.correlationId,
        eventType: raw.eventType,
        data: raw.data as T,
        metadata
      };
      // Optional payload validation on deserialize
      this.validatePayload(event.eventType, event.data);
      this.validateEvent(event);
      return event;
    } catch (_error) {
      throw createValidationError('json', 'Invalid event JSON', json);
    }
  }

}

// ============================================================================
// EVENT HANDLER REGISTRY
// ============================================================================

/**
 * Registry for managing event handlers
 */
export class EventHandlerRegistry {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register an event handler
   */
  register(handler: EventHandler): void {
    const eventType = handler.eventType;
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    const handlers = this.handlers.get(eventType)!;
    handlers.push(handler);
    
    // Sort by priority (higher priority first)
    handlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Unregister an event handler
   */
  unregister(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get handlers for an event type
   */
  getHandlers(eventType: EventType | string): EventHandler[] {
    return this.handlers.get(eventType) || [];
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
  }
}

// ============================================================================
// EVENT PROCESSOR
// ============================================================================

/** Minimal semaphore for bounded concurrency */
class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];
  constructor(permits: number) {
    this.permits = Math.max(1, permits | 0);
  }
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    await new Promise<void>(res => this.queue.push(res));
  }
  release(): void {
    const next = this.queue.shift();
    if (next) next();
    else this.permits++;
  }
  /** Run fn within a permit; always releases. */
  async run<T>(fn: () => Promise<T> | T): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * Processor for handling domain events
 */
export class EventProcessor {
  private registry: EventHandlerRegistry;
  private options: EventStoreOptions;
  private asyncSem: Semaphore;
  /** Track pending async handler tasks for flush semantics */
  private pendingAsyncTasks = 0;

  constructor(
    registry: EventHandlerRegistry,
    options: EventStoreOptions = {}
  ) {
    this.registry = registry;
    this.options = {
      validateEvents: options.validateEvents ?? true,
      enableLogging: options.enableLogging ?? true,
      enableMetrics: options.enableMetrics ?? true,
      batchSize: options.batchSize ?? 100,
      maxAsyncConcurrency: options.maxAsyncConcurrency ?? 8,
      backpressureAsync: options.backpressureAsync ?? true
    };
    this.asyncSem = new Semaphore(this.options.maxAsyncConcurrency!);
  }


  /**
   * Process a single event
   */
  async processEvent(
    event: DomainEvent,
    context?: EventContext
  ): Promise<void> {
    if (this.options.validateEvents) {
      DomainEventFactory.validateEvent(event);
    }

    const handlers = this.registry.getHandlers(event.eventType);
    
    if (this.options.enableLogging) {
      console.log(`Processing event ${event.eventType} for aggregate ${event.aggregateId}`);
    }

    // Execute handlers in order of priority
    for (const handler of handlers) {
      try {
        if (handler.async) {
          // Backpressure-aware async handling via semaphore
          if (this.options.backpressureAsync) {
            // schedule but do not await; concurrency is bounded globally
             
            (async () => {
              this.pendingAsyncTasks++;
              try {
                await this.asyncSem.run(async () => {
                  await handler.handler(event, context);
                });
              } catch (error) {
                console.error(`Async handler failed for event ${event.eventType}:`, error);
              } finally {
                this.pendingAsyncTasks--;
              }
            })();
          } else {
            // Legacy fire-and-forget (no bound)
            const schedule = (fn: () => void) =>
              (typeof (globalThis as unknown).queueMicrotask === 'function' ? (globalThis as unknown).queueMicrotask : (cb: unknown) => setTimeout(cb, 0))(fn);
            schedule(() => {
              const result = handler.handler(event, context);
              if (result && typeof (result as Promise<unknown>).catch === 'function') {
                (result as Promise<unknown>).catch((error: unknown) => {
                  console.error(`Async handler failed for event ${event.eventType}:`, error);
                });
              }
            });
          }
        } else {
          // Synchronous execution
          await handler.handler(event, context);
        }
      } catch (error) {
        console.error(`Handler failed for event ${event.eventType}:`, error);
        // Continue with other handlers
      }
    }
  }


  /**
   * Process multiple events
   */
  async processEvents(
    events: DomainEvent[],
    context?: EventContext
  ): Promise<void> {
    for (const event of events) {
      await this.processEvent(event, context);
    }
  }

  /**
   * Process events in batches
   */
  async processEventsInBatches(
    events: DomainEvent[],
    context?: EventContext
  ): Promise<void> {
    const batchSize = this.options.batchSize!;
    
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await Promise.all(
        batch.map(event => this.processEvent(event, context))
      );
    }
  }

  /**
   * Wait until all scheduled async handlers finish (useful for tests / graceful shutdown).
   */
  async flushAsync(pollIntervalMs = 10): Promise<void> {
    // simple spin-wait with small sleeps; replace with condition var if needed
    while (this.pendingAsyncTasks > 0) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

}

// ============================================================================
// EVENT REPLAY UTILITIES
// ============================================================================

/**
 * Utilities for event replay and projection
 */
export class EventReplayUtilities {
  /**
   * Filter events based on replay options
   */
  static filterEvents(
    events: DomainEvent[],
    options: EventReplayOptions
  ): DomainEvent[] {
    return events.filter(event => {
      // Version filter
      if (options.fromVersion && event.version < options.fromVersion) {
        return false;
      }
      if (options.toVersion && event.version > options.toVersion) {
        return false;
      }

      // Date filter
      if (options.fromDate && event.timestamp < options.fromDate) {
        return false;
      }
      if (options.toDate && event.timestamp > options.toDate) {
        return false;
      }

      // Event type filter
      if (options.eventTypes && !options.eventTypes.includes(event.eventType)) {
        return false;
      }

      // Aggregate ID filter
      if (options.aggregateIds && !options.aggregateIds.includes(event.aggregateId)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sort events by version
   */
  static sortEventsByVersion(events: DomainEvent[]): DomainEvent[] {
    return events.sort((a, b) => a.version - b.version);
  }

  /**
   * Sort events by timestamp
   */
  static sortEventsByTimestamp(events: DomainEvent[]): DomainEvent[] {
    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // ----------------------- Pure / Immutable variants -----------------------
  /** Returns a new array sorted by version (ascending). Does not mutate input. */
  static sortedByVersion(events: ReadonlyArray<DomainEvent>): DomainEvent[] {
    return [...events].sort((a, b) => a.version - b.version);
  }

  /** Returns a new array sorted by timestamp (ascending). Does not mutate input. */
  static sortedByTimestamp(events: ReadonlyArray<DomainEvent>): DomainEvent[] {
    return [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /** Returns a new array filtered by options. Does not mutate input. */
  static filtered(events: ReadonlyArray<DomainEvent>, options: EventReplayOptions): DomainEvent[] {
    return (events as DomainEvent[]).filter(event => {
      if (options.fromVersion && event.version < options.fromVersion) return false;
      if (options.toVersion && event.version > options.toVersion) return false;
      if (options.fromDate && event.timestamp < options.fromDate) return false;
      if (options.toDate && event.timestamp > options.toDate) return false;
      if (options.eventTypes && !options.eventTypes.includes(event.eventType)) return false;
      if (options.aggregateIds && !options.aggregateIds.includes(event.aggregateId)) return false;
      return true;
    });
  }


  /**
   * Group events by aggregate ID
   */
  static groupEventsByAggregate(events: DomainEvent[]): Map<string, DomainEvent[]> {
    const grouped = new Map<string, DomainEvent[]>();
    
    for (const event of events) {
      if (!grouped.has(event.aggregateId)) {
        grouped.set(event.aggregateId, []);
      }
      grouped.get(event.aggregateId)!.push(event);
    }
    
    return grouped;
  }

  /**
   * Get latest version for each aggregate
   */
  static getLatestVersions(events: DomainEvent[]): Map<string, number> {
    const versions = new Map<string, number>();
    
    for (const event of events) {
      const current = versions.get(event.aggregateId) || 0;
      if (event.version > current) {
        versions.set(event.aggregateId, event.version);
      }
    }
    
    return versions;
  }
}

// ============================================================================
// EVENT STORE HELPERS
// ============================================================================

/**
 * Helper functions for event store operations
 */
export class EventStoreHelpers {
  /**
   * Create event context from domain event
   */
  static createEventContext(event: DomainEvent): EventContext {
    const context: EventContext = {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      correlationId: event.correlationId,
      timestamp: event.timestamp
    };

    if (event.causationId) context.causationId = event.causationId;
    if (event.metadata.userId) context.userId = event.metadata.userId;
    if (event.metadata.tenantId) context.tenantId = event.metadata.tenantId;

    return context;
  }

  /**
   * Check if event is older than specified duration
   */
  static isEventOlderThan(event: DomainEvent, durationMs: number): boolean {
    const now = new Date();
    const eventTime = event.timestamp;
    return (now.getTime() - eventTime.getTime()) > durationMs;
  }

  /**
   * Get event age in milliseconds
   */
  static getEventAge(event: DomainEvent): number {
    const now = new Date();
    return now.getTime() - event.timestamp.getTime();
  }

  /**
   * Check if event is from today
   */
  static isEventFromToday(event: DomainEvent): boolean {
    const today = new Date();
    const eventDate = event.timestamp;
    
    return today.getFullYear() === eventDate.getFullYear() &&
           today.getMonth() === eventDate.getMonth() &&
           today.getDate() === eventDate.getDate();
  }
}
