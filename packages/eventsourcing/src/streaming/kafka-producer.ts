import type { DomainEvent } from '../core/domain-event';
import type { Producer } from 'kafkajs';

import { Kafka } from 'kafkajs';

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
export class KafkaEventProducer {
  private producer: Producer;
  private isConnected = false;

  constructor(config: KafkaProducerConfig) {
    const kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      retry: config.retry || {
        retries: 5,
        initialRetryTime: 100,
        maxRetryTime: 30000,
      },
    });

    this.producer = kafka.producer({
      idempotent: config.idempotent ?? true,
      maxInFlightRequests: config.maxInFlightRequests || 1,
    });
  }

  /**
   * Connect to Kafka cluster
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('Kafka producer connected successfully');
    } catch (error) {
      console.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Kafka cluster
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('Kafka producer disconnected');
    } catch (error) {
      console.error('Failed to disconnect Kafka producer:', error);
      throw error;
    }
  }

  /**
   * Publish a domain event to the appropriate topic
   */
  async publishEvent(event: DomainEvent): Promise<PublishResult> {
    if (!this.isConnected) {
      throw new Error('Producer not connected. Call connect() first.');
    }

    const topicName = this.getTopicName(event.eventType);
    const key = event.aggregateId;
    const value = JSON.stringify({
      id: event.id,
      aggregateId: event.aggregateId,
      version: event.version,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      causationId: event.causationId,
      data: event.serialize(),
      metadata: {
        schemaVersion: 1,
        publishedAt: new Date().toISOString(),
      },
    });

    const headers = {
      'event-type': event.eventType,
      'tenant-id': event.tenantId,
      'schema-version': '1',
      'correlation-id': event.correlationId ?? '',
      'causation-id': event.causationId ?? '',
    };

    try {
      const result = await this.producer.send({
        topic: topicName,
        messages: [
          {
            key,
            value,
            headers,
            timestamp: event.occurredAt.getTime().toString(),
          },
        ],
      });

      const messageResult = result[0];
      if (!messageResult) {
        throw new Error('No message result returned from Kafka producer');
      }
      return {
        topicName: messageResult.topicName,
        partition: messageResult.partition,
        offset: messageResult.offset ?? '',
        timestamp: messageResult.timestamp ?? '',
      };
    } catch (error) {
      console.error(`Failed to publish event ${event.id} to topic ${topicName}:`, error);
      throw error;
    }
  }

  /**
   * Publish multiple events in a batch
   */
  async publishEvents(events: DomainEvent[]): Promise<PublishResult[]> {
    if (!this.isConnected) {
      throw new Error('Producer not connected. Call connect() first.');
    }

    if (events.length === 0) {
      return [];
    }

    // Group events by topic for efficient batching
    const eventsByTopic = new Map<string, DomainEvent[]>();
    for (const event of events) {
      const topicName = this.getTopicName(event.eventType);
      if (!eventsByTopic.has(topicName)) {
        eventsByTopic.set(topicName, []);
      }
      eventsByTopic.get(topicName)!.push(event);
    }

    const results: PublishResult[] = [];

    // Publish each topic batch
    for (const [topicName, topicEvents] of eventsByTopic) {
      const messages = topicEvents.map((event) => {
        const key = event.aggregateId;
        const value = JSON.stringify({
          id: event.id,
          aggregateId: event.aggregateId,
          version: event.version,
          eventType: event.eventType,
          occurredAt: event.occurredAt.toISOString(),
          tenantId: event.tenantId,
          correlationId: event.correlationId,
          causationId: event.causationId,
          data: event.serialize(),
          metadata: {
            schemaVersion: 1,
            publishedAt: new Date().toISOString(),
          },
        });

        return {
          key,
          value,
          headers: {
            'event-type': event.eventType,
            'tenant-id': event.tenantId,
            'schema-version': '1',
            'correlation-id': event.correlationId || '',
            'causation-id': event.causationId || '',
          },
          timestamp: event.occurredAt.getTime().toString(),
        };
      });

      try {
        const result = await this.producer.send({
          topic: topicName,
          messages,
        });

        const messageResults = result.map((messageResult) => ({
          topicName: messageResult.topicName,
          partition: messageResult.partition,
          offset: messageResult.offset ?? '',
          timestamp: messageResult.timestamp ?? '',
        }));

        results.push(...messageResults);
      } catch (error) {
        console.error(`Failed to publish batch to topic ${topicName}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Get topic name based on event type
   */
  private getTopicName(eventType: string): string {
    const ACC_TOPIC = 'acc.events.v1';
    const INV_TOPIC = 'inv.events.v1';
    const AUDIT_TOPIC = 'audit.events.v1';

    // Map event types to domain topics
    if (
      eventType.startsWith('Journal') ||
      eventType.startsWith('Account') ||
      eventType.startsWith('Trial')
    ) {
      return ACC_TOPIC;
    }
    if (eventType.startsWith('Stock') || eventType.startsWith('Inventory')) {
      return INV_TOPIC;
    }
    if (
      eventType.startsWith('User') ||
      eventType.startsWith('Data') ||
      eventType.startsWith('Config')
    ) {
      return AUDIT_TOPIC;
    }

    // Default to accounting for unknown events
    return ACC_TOPIC;
  }

  /**
   * Check if producer is connected
   */
  isProducerConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get producer metrics
   */
  async getMetrics(): Promise<{
    connected: boolean;
    topics: string[];
  }> {
    return {
      connected: this.isConnected,
      topics: ['acc.events.v1', 'inv.events.v1', 'audit.events.v1'],
    };
  }
}
