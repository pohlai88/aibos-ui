import type { EventHandler } from '../core/event-handler';
import type { EventStore } from '../core/event-store';
/**
 * Configuration for event replay
 */
export interface EventReplayConfig {
    batchSize: number;
    checkpointInterval: number;
    maxRetries: number;
    retryDelayMs: number;
}
/**
 * Default configuration for event replay
 */
export declare const DEFAULT_REPLAY_CONFIG: EventReplayConfig;
/**
 * Event replay engine for replaying events through handlers
 */
export declare class EventReplayEngine {
    private eventStore;
    private config;
    constructor(eventStore: EventStore, config?: Partial<EventReplayConfig>);
    /**
     * Replay events for a specific stream
     */
    replayStream(streamId: string, handlers: EventHandler[], fromVersion?: number): Promise<void>;
    /**
     * Replay events from a specific timestamp
     */
    replayFromTimestamp(fromTimestamp: Date, handlers: EventHandler[]): Promise<void>;
    /**
     * Replay events for multiple streams
     */
    replayStreams(streamIds: string[], handlers: EventHandler[]): Promise<void>;
    /**
     * Process a single event through handlers
     */
    private processEvent;
    /**
     * Get replay statistics
     */
    getReplayStatistics(streamId: string): Promise<{
        totalEvents: number;
        lastEventTimestamp?: Date;
        firstEventTimestamp?: Date;
    }>;
}
//# sourceMappingURL=event-replay.d.ts.map