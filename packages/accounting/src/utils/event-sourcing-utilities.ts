/**
 * Event Sourcing Utilities - Phase 2 Implementation
 * 
 * Provides advanced event sourcing patterns and utilities for aggregate
 * reconstruction, event application, and event store operations.
 * 
 * Features:
 * - EventSourcingHelper for aggregate reconstruction
 * - Event application and replay utilities
 * - Snapshot management and optimization
 * - Event store abstraction and helpers
 * - Aggregate versioning and conflict resolution
 * - Event projection and read model utilities
 */

import { 
  type ErrorContext,
  createBusinessError,
  createValidationError
} from './error-utilities';
import { 
  type DomainEvent
} from './domain-event-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AggregateRoot<T = any> {
  id: string;
  version: number;
  uncommittedEvents: DomainEvent[];
  applyEvent(event: DomainEvent): void;
  getSnapshot(): T;
  loadFromSnapshot(snapshot: T, version: number): void;
}

export interface EventStore {
  saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number, toVersion?: number): Promise<DomainEvent[]>;
  getEventsByType(eventType: string, fromDate?: Date, toDate?: Date): Promise<DomainEvent[]>;
  getEventsByAggregateType(aggregateType: string, fromDate?: Date, toDate?: Date): Promise<DomainEvent[]>;
}

export interface Snapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: any;
  timestamp: Date;
  eventId: string;
}

export interface SnapshotStore {
  saveSnapshot(snapshot: Snapshot): Promise<void>;
  getSnapshot(aggregateId: string): Promise<Snapshot | null>;
  deleteSnapshots(aggregateId: string, upToVersion: number): Promise<void>;
}

export interface EventProjection {
  name: string;
  version: number;
  eventHandlers: Map<string, (event: DomainEvent) => Promise<void>>;
  processEvent(event: DomainEvent): Promise<void>;
  reset(): Promise<void>;
  getVersion(): number;
  setVersion(version: number): void;
}

export interface EventSourcingOptions {
  enableSnapshots?: boolean;
  snapshotInterval?: number;
  enableProjections?: boolean;
  enableOptimisticLocking?: boolean;
  maxRetries?: number;
}

export interface AggregateContext extends ErrorContext {
  aggregateId: string;
  aggregateType: string;
  version: number;
  eventCount: number;
  snapshotVersion?: number;
}

// ============================================================================
// EVENT SOURCING HELPER
// ============================================================================

/**
 * Helper class for event sourcing operations
 */
export class EventSourcingHelper {
  private static readonly DEFAULTS: Required<Pick<EventSourcingOptions, 'snapshotInterval' | 'maxRetries'>> = {
    snapshotInterval: 100,
    maxRetries: 3,
  };

  /**
   * Apply events to an aggregate
   */
  static async applyEvents<T extends AggregateRoot>(
    aggregate: T,
    events: DomainEvent[],
    eventHandlers: Map<string, (aggregate: T, event: DomainEvent) => void | Promise<void>>
  ): Promise<T> {
    let currentAggregate = aggregate;
    // Defensive copy + order by version (ascending) without mutating input
    const ordered = [...events].sort((a, b) => a.version - b.version);
    let expectedVersion = currentAggregate.version + 1;

    for (const event of ordered) {
      try {
        // Sequence & identity guards
        if (event.aggregateId !== currentAggregate.id) {
          throw new Error(`Event aggregateId mismatch: ${event.aggregateId} !== ${currentAggregate.id}`);
        }
        if (event.version !== expectedVersion) {
          throw new Error(`Event sequence mismatch: got v${event.version}, expected v${expectedVersion}`);
        }
        // Apply event to aggregate
        currentAggregate.applyEvent(event);
        expectedVersion++;
        // Apply custom event handler if available
        const handler = eventHandlers.get(event.eventType);
        if (handler) {
          await handler(currentAggregate, event);
        }
        
      } catch (error) {
        throw createBusinessError(
          'EVENT_APPLICATION_FAILED',
          `Failed to apply event ${event.eventType} to aggregate ${event.aggregateId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'EventSourcingHelper',
          {
            data: {
              eventType: event.eventType,
              eventVersion: event.version
            }
          }
        );
      }
    }
    
    return currentAggregate;
  }

  /**
   * Reconstruct aggregate from events
   */
  static async reconstructAggregate<T extends AggregateRoot>(
    aggregateId: string,
    eventStore: EventStore,
    aggregateFactory: () => T,
    eventHandlers: Map<string, (aggregate: T, event: DomainEvent) => void | Promise<void>>
  ): Promise<T> {
    try {
      // Get all events for the aggregate
      const events = await eventStore.getEvents(aggregateId);
      
      if (events.length === 0) {
        throw createBusinessError(
          'AGGREGATE_NOT_FOUND',
          `No events found for aggregate ${aggregateId}`,
          'EventSourcingHelper',
          {}
        );
      }

      // Create new aggregate instance
      const aggregate = aggregateFactory();
      
      // Apply events to reconstruct state
      return await this.applyEvents(aggregate, events, eventHandlers);
      
    } catch (error) {
      // Prefer structured code checks instead of message contains
      if ((error as any)?.code === 'AGGREGATE_NOT_FOUND') {
        throw error;
      }
      
      throw createBusinessError(
        'AGGREGATE_RECONSTRUCTION_FAILED',
        `Failed to reconstruct aggregate ${aggregateId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EventSourcingHelper',
        {}
      );
    }
  }

  /**
   * Reconstruct aggregate with snapshot optimization
   */
  static async reconstructAggregateWithSnapshot<T extends AggregateRoot>(
    aggregateId: string,
    eventStore: EventStore,
    snapshotStore: SnapshotStore,
    aggregateFactory: () => T,
    eventHandlers: Map<string, (aggregate: T, event: DomainEvent) => void | Promise<void>>
  ): Promise<T> {
    try {
      // Try to get snapshot first
      const snapshot = await snapshotStore.getSnapshot(aggregateId);
      
      let aggregate = aggregateFactory();
      let fromVersion = 0;
      
      if (snapshot) {
        // Load from snapshot
        aggregate.loadFromSnapshot(snapshot.data, snapshot.version);
        fromVersion = snapshot.version + 1;
      }
      
      // Get events after snapshot
      const events = await eventStore.getEvents(aggregateId, fromVersion);
      
      if (events.length > 0) {
        // Apply events to aggregate
        aggregate = await this.applyEvents(aggregate, events, eventHandlers);
      }
      
      return aggregate;
      
    } catch (error) {
      throw createBusinessError(
        'AGGREGATE_RECONSTRUCTION_FAILED',
        `Failed to reconstruct aggregate ${aggregateId} with snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EventSourcingHelper',
        {}
      );
    }
  }

  /**
   * Save aggregate changes to event store
   */
  static async saveAggregateChanges<T extends AggregateRoot>(
    aggregate: T,
    eventStore: EventStore,
    options: EventSourcingOptions = {},
    snapshotStore?: SnapshotStore,
    aggregateType?: string
  ): Promise<void> {
    try {
      const uncommittedEvents = aggregate.uncommittedEvents;
      
      if (uncommittedEvents.length === 0) {
        return; // No changes to save
      }

      const expectedVersion = aggregate.version - uncommittedEvents.length;
      // Pre-validate sequence & versions before hitting store
      EventStoreUtilities.validateEventsBatch(uncommittedEvents, expectedVersion);
      const maxRetries = options.maxRetries ?? EventSourcingHelper.DEFAULTS.maxRetries;
      const optimistic = !!options.enableOptimisticLocking;

      let attempt = 0;
      // bounded retry w/ simple exponential backoff for write conflicts
      // (your store should throw a recognizable error on version mismatch)
      // NOTE: no busy-wait; use setTimeout via Promise
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          await eventStore.saveEvents(aggregate.id, uncommittedEvents, expectedVersion);
          break;
        } catch (err) {
          if (!optimistic || attempt >= maxRetries) {
            throw err;
          }
          const delayMs = Math.min(1000, 50 * Math.pow(2, attempt)); // 50,100,200,400,800,1000...
          await new Promise(res => setTimeout(res, delayMs));
          attempt++;
        }
      }
      
      // Clear uncommitted events
      aggregate.uncommittedEvents = [];

      // Optional snapshotting on save
      if (options.enableSnapshots && snapshotStore && aggregateType) {
        const interval = options.snapshotInterval ?? EventSourcingHelper.DEFAULTS.snapshotInterval;
        const last = await snapshotStore.getSnapshot(aggregate.id);
        const lastVersion = last?.version ?? 0;
        if (SnapshotUtilities.shouldCreateSnapshot(aggregate.version, lastVersion, interval)) {
          await snapshotStore.saveSnapshot({
            aggregateId: aggregate.id,
            aggregateType,
            version: aggregate.version,
            data: aggregate.getSnapshot(),
            timestamp: new Date(),
            eventId: `snapshot_${aggregate.id}_${aggregate.version}`,
          });
        }
      }
      
    } catch (error) {
      throw createBusinessError(
        'AGGREGATE_SAVE_FAILED',
        `Failed to save aggregate ${aggregate.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EventSourcingHelper',
        { data: { version: aggregate.version } }
      );
    }
  }

  /**
   * Create snapshot for aggregate
   */
  static async createSnapshot<T extends AggregateRoot>(
    aggregate: T,
    snapshotStore: SnapshotStore,
    aggregateType: string
  ): Promise<void> {
    try {
      const snapshot: Snapshot = {
        aggregateId: aggregate.id,
        aggregateType,
        version: aggregate.version,
        data: aggregate.getSnapshot(),
        timestamp: new Date(),
        eventId: `snapshot_${aggregate.id}_${aggregate.version}`
      };
      
      await snapshotStore.saveSnapshot(snapshot);
      
    } catch (error) {
      throw createBusinessError(
        'SNAPSHOT_CREATION_FAILED',
        `Failed to create snapshot for aggregate ${aggregate.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EventSourcingHelper',
        { data: { version: aggregate.version } }
      );
    }
  }
}

// ============================================================================
// AGGREGATE BASE CLASS
// ============================================================================

/**
 * Base class for aggregate roots
 */
export abstract class BaseAggregateRoot<T = any> implements AggregateRoot<T> {
  public id: string;
  public version: number;
  public uncommittedEvents: DomainEvent[] = [];

  constructor(id: string, version: number = 0) {
    this.id = id;
    this.version = version;
  }

  /**
   * Apply event to aggregate
   */
  applyEvent(event: DomainEvent): void {
    // Validate event
    if (event.aggregateId !== this.id) {
      throw createValidationError(
        'event.aggregateId',
        `Event aggregate ID ${event.aggregateId} does not match aggregate ID ${this.id}`,
        event
      );
    }

    if (event.version !== this.version + 1) {
      throw createValidationError(
        'event.version',
        `Event version ${event.version} does not match expected version ${this.version + 1}`,
        event
      );
    }

    // Apply event to aggregate state
    this.applyEventToState(event);
    
    // Update version
    this.version = event.version;
  }

  /**
   * Add uncommitted event
   */
  protected addUncommittedEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }

  /**
   * Clear uncommitted events
   */
  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  /**
   * Convenience: apply an event and stage it for persistence.
   * Keeps version sequencing correct by using applyEvent -> push.
   */
  protected raiseEvent(event: DomainEvent): void {
    this.applyEvent(event);
    this.addUncommittedEvent(event);
  }

  /**
   * Get snapshot of aggregate state
   */
  abstract getSnapshot(): T;

  /**
   * Load aggregate from snapshot
   */
  abstract loadFromSnapshot(snapshot: T, version: number): void;

  /**
   * Apply event to aggregate state (to be implemented by subclasses)
   */
  protected abstract applyEventToState(event: DomainEvent): void;
}

// ============================================================================
// EVENT PROJECTION UTILITIES
// ============================================================================

/**
 * Base class for event projections
 */
export abstract class BaseEventProjection implements EventProjection {
  public name: string;
  public version: number;
  public eventHandlers: Map<string, (event: DomainEvent) => Promise<void>>;

  constructor(name: string, version: number = 0) {
    this.name = name;
    this.version = version;
    this.eventHandlers = new Map();
  }

  /**
   * Process event through projection
   */
  async processEvent(event: DomainEvent): Promise<void> {
    const handler = this.eventHandlers.get(event.eventType);
    if (handler) {
      await handler(event);
    }
  }

  /**
   * Reset projection state
   */
  abstract reset(): Promise<void>;

  /**
   * Get projection version
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Set projection version
   */
  setVersion(version: number): void {
    this.version = version;
  }

  /**
   * Register event handler
   */
  protected registerEventHandler(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>
  ): void {
    this.eventHandlers.set(eventType, handler);
  }
}

// ============================================================================
// SNAPSHOT UTILITIES
// ============================================================================

/**
 * Utilities for snapshot management
 */
export class SnapshotUtilities {
  /**
   * Check if snapshot should be created
   */
  static shouldCreateSnapshot(
    currentVersion: number,
    lastSnapshotVersion: number,
    snapshotInterval: number = 100
  ): boolean {
    return (currentVersion - lastSnapshotVersion) >= snapshotInterval;
  }

  /**
   * Create snapshot from aggregate
   */
  static createSnapshotFromAggregate<T extends AggregateRoot>(
    aggregate: T,
    aggregateType: string
  ): Snapshot {
    return {
      aggregateId: aggregate.id,
      aggregateType,
      version: aggregate.version,
      data: aggregate.getSnapshot(),
      timestamp: new Date(),
      eventId: `snapshot_${aggregate.id}_${aggregate.version}`
    };
  }

  /**
   * Validate snapshot
   */
  static validateSnapshot(snapshot: Snapshot): void {
    if (!snapshot.aggregateId) {
      throw createValidationError('aggregateId', 'Snapshot aggregate ID is required', snapshot);
    }
    if (!snapshot.aggregateType) {
      throw createValidationError('aggregateType', 'Snapshot aggregate type is required', snapshot);
    }
    if (snapshot.version < 0) {
      throw createValidationError('version', 'Snapshot version must be >= 0', snapshot);
    }
    if (!snapshot.data) {
      throw createValidationError('data', 'Snapshot data is required', snapshot);
    }
    if (!(snapshot.timestamp instanceof Date) || Number.isNaN(snapshot.timestamp.getTime())) {
      throw createValidationError('timestamp', 'Snapshot timestamp must be a valid Date', snapshot);
    }
  }

  /**
   * Check if snapshot is expired
   */
  static isSnapshotExpired(
    snapshot: Snapshot,
    maxAgeMs: number = 24 * 60 * 60 * 1000 // 24 hours
  ): boolean {
    const now = new Date();
    const age = now.getTime() - snapshot.timestamp.getTime();
    return age > maxAgeMs;
  }
}

// ============================================================================
// EVENT STORE UTILITIES
// ============================================================================

/**
 * Utilities for event store operations
 */
export class EventStoreUtilities {
  /**
   * Validate event before saving
   */
  static validateEventForSave(event: DomainEvent, expectedVersion: number): void {
    if (!event.aggregateId) {
      throw createValidationError('aggregateId', 'Event aggregate ID is required', event);
    }
    if (!event.eventType) {
      throw createValidationError('eventType', 'Event type is required', event);
    }
    if (event.version !== expectedVersion + 1) {
      throw createValidationError(
        'version',
        `Event version ${event.version} does not match expected version ${expectedVersion + 1}`,
        event
      );
    }
  }

  /**
   * Validate events batch
   */
  static validateEventsBatch(events: DomainEvent[], expectedVersion: number): void {
    if (!events || events.length === 0) {
      throw createValidationError('events', 'Events array cannot be empty', events);
    }

    let currentVersion = expectedVersion;
    for (const event of events) {
      this.validateEventForSave(event, currentVersion);
      currentVersion = event.version;
    }
  }

  /**
   * Sort events by version
   */
  static sortEventsByVersion(events: DomainEvent[]): DomainEvent[] {
    return events.sort((a, b) => a.version - b.version);
  }

  /**
   * Filter events by type
   */
  static filterEventsByType(events: DomainEvent[], eventType: string): DomainEvent[] {
    return events.filter(event => event.eventType === eventType);
  }

  /**
   * Filter events by date range
   */
  static filterEventsByDateRange(
    events: DomainEvent[],
    fromDate: Date,
    toDate: Date
  ): DomainEvent[] {
    return events.filter(event => 
      event.timestamp >= fromDate && event.timestamp <= toDate
    );
  }

  /**
   * Get latest event version
   */
  static getLatestEventVersion(events: DomainEvent[]): number {
    if (events.length === 0) return 0;
    let max = 0;
    for (const e of events) if (e.version > max) max = e.version;
    return max;
  }

  /**
   * Check for version conflicts
   */
  static checkVersionConflicts(events: DomainEvent[]): void {
    const seen = new Set<number>();
    const dups: number[] = [];
    for (const e of events) {
      if (seen.has(e.version)) dups.push(e.version);
      else seen.add(e.version);
    }
    if (dups.length > 0) {
      throw createValidationError(
        'events',
        `Version conflicts detected: ${Array.from(new Set(dups)).join(', ')}`,
        events
      );
    }
  }
}

// ============================================================================
// EVENT SOURCING HELPERS
// ============================================================================

/**
 * Helper functions for event sourcing operations
 */
export class EventSourcingHelpers {
  // canonical JSON for deterministic state hashing
  private static canonicalStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(v => this.canonicalStringify(v)).join(',') + ']';
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + this.canonicalStringify(obj[k])).join(',') + '}';
  }

  /**
   * Create aggregate context
   */
  static createAggregateContext(
    aggregateId: string,
    aggregateType: string,
    version: number,
    additionalContext?: Partial<AggregateContext>
  ): AggregateContext {
    return {
      aggregateId,
      aggregateType,
      version,
      eventCount: 0,
      timestamp: new Date(),
      ...additionalContext
    };
  }

  /**
   * Check if aggregate exists
   */
  static async aggregateExists(
    aggregateId: string,
    eventStore: EventStore
  ): Promise<boolean> {
    try {
      const events = await eventStore.getEvents(aggregateId, 0, 1);
      return events.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get aggregate version
   */
  static async getAggregateVersion(
    aggregateId: string,
    eventStore: EventStore
  ): Promise<number> {
    try {
      const events = await eventStore.getEvents(aggregateId);
      return events.length > 0 ? Math.max(...events.map(e => e.version)) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Check if event is applicable to aggregate
   */
  static isEventApplicable(event: DomainEvent, aggregate: AggregateRoot): boolean {
    return event.aggregateId === aggregate.id && event.version === aggregate.version + 1;
  }

  /**
   * Calculate aggregate state hash
   */
  static calculateStateHash(state: any): string {
    return this.canonicalStringify(state);
  }

  /**
   * Compare aggregate states
   */
  static compareStates(state1: any, state2: any): boolean {
    return this.calculateStateHash(state1) === this.calculateStateHash(state2);
  }
}
