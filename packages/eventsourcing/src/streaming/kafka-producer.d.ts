import type { DomainEvent } from '../core/domain-event';
/**
 * Kafka producer configuration
 */
export interface KafkaProducerConfig {
    brokers: string[];
    clientId: string;
    retry?: {
        retries: number;
        initialRetryTime: number;
        maxRetryTime: number;
    };
    compression?: 'gzip' | 'snappy' | 'lz4' | 'zstd';
    idempotent?: boolean;
    maxInFlightRequests?: number;
}
/**
 * Event publishing result
 */
export interface PublishResult {
    topicName: string;
    partition: number;
    offset: string;
    timestamp: string;
}
/**
 * Kafka producer for publishing domain events
 */
export declare class KafkaEventProducer {
    private producer;
    private isConnected;
    constructor(config: KafkaProducerConfig);
    /**
     * Connect to Kafka cluster
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Kafka cluster
     */
    disconnect(): Promise<void>;
    /**
     * Publish a domain event to the appropriate topic
     */
    publishEvent(event: DomainEvent): Promise<PublishResult>;
    /**
     * Publish multiple events in a batch
     */
    publishEvents(events: DomainEvent[]): Promise<PublishResult[]>;
    /**
     * Get topic name based on event type
     */
    private getTopicName;
    /**
     * Check if producer is connected
     */
    isProducerConnected(): boolean;
    /**
     * Get producer metrics
     */
    getMetrics(): Promise<{
        connected: boolean;
        topics: string[];
    }>;
}
//# sourceMappingURL=kafka-producer.d.ts.map