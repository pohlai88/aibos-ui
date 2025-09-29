import type { Pool } from 'pg';
import { OutboxEvent } from './outbox-event';
/**
 * Configuration for the outbox processor
 */
export interface OutboxProcessorConfig {
    batchSize: number;
    pollIntervalMs: number;
    maxRetries: number;
    retryDelayMs: number;
    deadLetterThreshold: number;
}
/**
 * Default configuration for the outbox processor
 */
export declare const DEFAULT_OUTBOX_CONFIG: OutboxProcessorConfig;
/**
 * Outbox processor for reliable event publishing
 */
export declare class OutboxProcessor {
    private pool;
    private eventPublisher;
    private isRunning;
    private intervalId?;
    private config;
    constructor(pool: Pool, eventPublisher: (event: OutboxEvent) => Promise<void>, config?: Partial<OutboxProcessorConfig>);
    /**
     * Start the outbox processor
     */
    start(): void;
    /**
     * Stop the outbox processor
     */
    stop(): void;
    /**
     * Process a batch of outbox events
     */
    private processBatch;
    /**
     * Process a single outbox event
     */
    private processEvent;
    /**
     * Add an event to the outbox
     */
    addEvent(event: OutboxEvent): Promise<void>;
    /**
     * Clean up old processed events
     */
    cleanupProcessedEvents(olderThanDays?: number): Promise<void>;
    /**
     * Get outbox statistics
     */
    getStatistics(): Promise<{
        pending: number;
        processing: number;
        processed: number;
        failed: number;
    }>;
    private mapRowToOutboxEvent;
}
//# sourceMappingURL=outbox-processor.d.ts.map