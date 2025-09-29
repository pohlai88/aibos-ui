import type { AggregateRoot } from './aggregate-root';
import type { DomainEvent } from './domain-event';
/**
 * Event store interface for storing and retrieving domain events
 */
export interface EventStore {
    /**
     * Append events to a stream with optimistic concurrency control
     */
    append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
    /**
     * Get all events for a stream
     */
    getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
    /**
     * Get events from a specific timestamp
     */
    getEventsFromTimestamp(timestamp: Date): Promise<DomainEvent[]>;
    /**
     * Create a snapshot of an aggregate
     */
    createSnapshot(streamId: string, aggregate: AggregateRoot): Promise<void>;
    /**
     * Get a snapshot of an aggregate
     */
    getSnapshot(streamId: string): Promise<AggregateRoot | null>;
    /**
     * Get the current version of a stream
     */
    getStreamVersion(streamId: string): Promise<number>;
    /**
     * Check if a stream exists
     */
    streamExists(streamId: string): Promise<boolean>;
    /**
     * Delete a stream (for testing purposes)
     */
    deleteStream(streamId: string): Promise<void>;
}
/**
 * Event store configuration
 */
export interface EventStoreConfig {
    connectionString: string;
    schema?: string;
    tablePrefix?: string;
    maxRetries?: number;
    retryDelay?: number;
}
/**
 * Event store error types
 */
export declare class ConcurrencyError extends Error {
    readonly streamId: string;
    readonly expectedVersion: number;
    readonly actualVersion: number;
    constructor(streamId: string, expectedVersion: number, actualVersion: number);
}
export declare class StreamNotFoundError extends Error {
    readonly streamId: string;
    constructor(streamId: string);
}
export declare class EventStoreError extends Error {
    readonly cause?: Error | undefined;
    constructor(message: string, cause?: Error | undefined);
}
//# sourceMappingURL=event-store.d.ts.map