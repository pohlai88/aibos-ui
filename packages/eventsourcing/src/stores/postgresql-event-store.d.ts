import type { AggregateRoot } from '../core/aggregate-root';
import type { DomainEvent } from '../core/domain-event';
import type { EventStore, EventStoreConfig } from '../core/event-store';
/**
 * PostgreSQL implementation of the Event Store
 */
export declare class PostgreSQLEventStore implements EventStore {
    private pool;
    private schema;
    private tablePrefix;
    constructor(config: EventStoreConfig);
    append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
    getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
    getEventsFromTimestamp(timestamp: Date): Promise<DomainEvent[]>;
    createSnapshot(streamId: string, aggregate: AggregateRoot): Promise<void>;
    getSnapshot(streamId: string): Promise<AggregateRoot | null>;
    getStreamVersion(streamId: string): Promise<number>;
    streamExists(streamId: string): Promise<boolean>;
    deleteStream(streamId: string): Promise<void>;
    private deserializeEvent;
    close(): Promise<void>;
}
//# sourceMappingURL=postgresql-event-store.d.ts.map