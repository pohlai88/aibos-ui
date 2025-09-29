import type { EventHandler } from '../core/event-handler';
/**
 * Kafka consumer configuration
 */
export interface KafkaConsumerConfig {
    brokers: string[];
    clientId: string;
    groupId: string;
    topics: string[];
    retry?: {
        retries: number;
        initialRetryTime: number;
        maxRetryTime: number;
    };
    sessionTimeout?: number;
    heartbeatInterval?: number;
    maxBytesPerPartition?: number;
    maxWaitTimeInMs?: number;
}
/**
 * Consumer checkpoint for resumable processing
 */
export interface ConsumerCheckpoint {
    topic: string;
    partition: number;
    offset: string;
    timestamp: Date;
}
/**
 * Kafka consumer for processing domain events
 */
export declare class KafkaEventConsumer {
    private config;
    private eventHandlers;
    private consumer;
    private isRunning;
    private checkpoints;
    constructor(config: KafkaConsumerConfig, eventHandlers: EventHandler[]);
    /**
     * Connect and start consuming messages
     */
    start(): Promise<void>;
    /**
     * Stop consuming messages
     */
    stop(): Promise<void>;
    /**
     * Handle individual message
     */
    private handleMessage;
    /**
     * Parse message from Kafka
     */
    private parseMessage;
    /**
     * Update checkpoint for a partition
     */
    private updateCheckpoint;
    /**
     * Get current checkpoints
     */
    getCheckpoints(): ConsumerCheckpoint[];
    /**
     * Get checkpoint for specific topic-partition
     */
    getCheckpoint(topic: string, partition: number): ConsumerCheckpoint | undefined;
    /**
     * Check if consumer is running
     */
    isConsumerRunning(): boolean;
    /**
     * Get consumer metrics
     */
    getMetrics(): Promise<{
        running: boolean;
        topics: string[];
        checkpoints: number;
    }>;
    /**
     * Pause consumption for specific partitions
     */
    pausePartitions(topic: string, partitions: number[]): Promise<void>;
    /**
     * Resume consumption for specific partitions
     */
    resumePartitions(topic: string, partitions: number[]): Promise<void>;
}
//# sourceMappingURL=kafka-consumer.d.ts.map