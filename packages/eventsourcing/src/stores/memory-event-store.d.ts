import type { AggregateRoot } from '../core/aggregate-root';
import type { DomainEvent } from '../core/domain-event';
import type { EventStore } from '../core/event-store';
/**
 * In-memory implementation of the Event Store for testing
 */
export declare class MemoryEventStore implements EventStore {
    private events;
    private streams;
    private snapshots;
    append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
    getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
    getEventsFromTimestamp(timestamp: Date): Promise<DomainEvent[]>;
    createSnapshot(streamId: string, aggregate: AggregateRoot): Promise<void>;
    getSnapshot(streamId: string): Promise<AggregateRoot | null>;
    getStreamVersion(streamId: string): Promise<number>;
    streamExists(streamId: string): Promise<boolean>;
    deleteStream(streamId: string): Promise<void>;
    /**
     * Clear all data (for testing)
     */
    clear(): void;
    /**
     * Get all stream IDs
     */
    getAllStreamIds(): string[];
    /**
     * Get total event count
     */
    getTotalEventCount(): number;
}
//# sourceMappingURL=memory-event-store.d.ts.map