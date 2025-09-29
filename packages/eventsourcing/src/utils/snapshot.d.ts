import type { AggregateRoot } from '../core/aggregate-root';
import type { EventStore } from '../core/event-store';
/**
 * Snapshot configuration
 */
export interface SnapshotConfig {
    snapshotThreshold: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
}
/**
 * Default snapshot configuration
 */
export declare const DEFAULT_SNAPSHOT_CONFIG: SnapshotConfig;
/**
 * Snapshot manager for creating and managing aggregate snapshots
 */
export declare class SnapshotManager {
    private eventStore;
    private config;
    constructor(eventStore: EventStore, config?: Partial<SnapshotConfig>);
    /**
     * Create a snapshot if needed
     */
    createSnapshotIfNeeded(streamId: string, aggregate: AggregateRoot): Promise<void>;
    /**
     * Create a snapshot
     */
    createSnapshot(streamId: string, aggregate: AggregateRoot): Promise<void>;
    /**
     * Get a snapshot
     */
    getSnapshot(streamId: string): Promise<AggregateRoot | null>;
    /**
     * Rebuild aggregate from snapshot and events
     */
    rebuildAggregate<T extends AggregateRoot>(streamId: string, aggregateClass: new (id: string, version: number) => T): Promise<T>;
    /**
     * Check if snapshot exists
     */
    hasSnapshot(streamId: string): Promise<boolean>;
    /**
     * Get snapshot statistics
     */
    getSnapshotStatistics(streamId: string): Promise<{
        hasSnapshot: boolean;
        snapshotVersion?: number;
        eventsAfterSnapshot?: number;
    }>;
    /**
     * Clean up old snapshots
     */
    cleanupOldSnapshots(keepLatest?: number): Promise<void>;
}
//# sourceMappingURL=snapshot.d.ts.map