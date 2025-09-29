import type { KafkaEventProducer } from '../streaming/kafka-producer';
import type { Pool } from 'pg';
/**
 * Outbox worker configuration
 */
export interface OutboxWorkerConfig {
    batchSize: number;
    pollIntervalMs: number;
    maxRetries: number;
    retryBackoffMs: number;
    maxRetryBackoffMs: number;
    dlqThreshold: number;
    processingTimeoutMs: number;
}
/**
 * Default outbox worker configuration
 */
export declare const DEFAULT_OUTBOX_WORKER_CONFIG: OutboxWorkerConfig;
/**
 * Outbox event record
 */
export interface OutboxEventRecord {
    id: string;
    aggregateId: string;
    eventType: string;
    eventData: Record<string, unknown>;
    metadata: Record<string, unknown>;
    tenantId: string;
    createdAt: Date;
    processedAt: Date | null;
    retryCount: number;
    status: 'pending' | 'processing' | 'done' | 'dlq';
    errorMessage: string | null;
    correlationId: string | null;
    causationId: string | null;
}
/**
 * Outbox worker metrics
 */
export interface OutboxWorkerMetrics {
    processedCount: number;
    failedCount: number;
    dlqCount: number;
    averageProcessingTimeMs: number;
    lastProcessedAt: Date | null;
    isRunning: boolean;
}
/**
 * Transactional outbox worker with retry logic and DLQ
 */
export declare class OutboxWorker {
    private pool;
    private kafkaProducer;
    private config;
    private isRunning;
    private metrics;
    private processingTimes;
    constructor(pool: Pool, kafkaProducer: KafkaEventProducer, config?: OutboxWorkerConfig);
    /**
     * Start the outbox worker
     */
    start(): Promise<void>;
    /**
     * Stop the outbox worker
     */
    stop(): Promise<void>;
    /**
     * Main processing loop
     */
    private processLoop;
    /**
     * Process a batch of outbox events
     */
    private processBatch;
    /**
     * Claim a batch of events atomically
     */
    private claimBatch;
    /**
     * Process a single outbox event
     */
    private processEvent;
    /**
     * Mark event as successfully processed
     */
    private markEventAsDone;
    /**
     * Handle event processing failure
     */
    private handleEventFailure;
    /**
     * Map database row to outbox event record
     */
    private mapRowToOutboxEvent;
    /**
     * Update worker metrics
     */
    private updateMetrics;
    /**
     * Get worker metrics
     */
    getMetrics(): OutboxWorkerMetrics;
    /**
     * Get outbox statistics
     */
    getOutboxStats(): Promise<{
        pending: number;
        processing: number;
        done: number;
        dlq: number;
        total: number;
    }>;
    /**
     * Sleep utility
     */
    private sleep;
    /**
     * Check if worker is running
     */
    isWorkerRunning(): boolean;
}
//# sourceMappingURL=outbox-worker.d.ts.map