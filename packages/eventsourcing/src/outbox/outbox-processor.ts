import type { Pool } from 'pg';

import { OutboxEvent, OutboxEventStatus } from './outbox-event';

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
export const DEFAULT_OUTBOX_CONFIG: OutboxProcessorConfig = {
  batchSize: 100,
  pollIntervalMs: 1000,
  maxRetries: 3,
  retryDelayMs: 5000,
  deadLetterThreshold: 10,
};

/**
 * Outbox processor for reliable event publishing
 */
export class OutboxProcessor {
  private isRunning = false;
  private intervalId?: ReturnType<typeof setInterval>;
  private config: OutboxProcessorConfig;

  constructor(
    private pool: Pool,
    private eventPublisher: (event: OutboxEvent) => Promise<void>,
    config: Partial<OutboxProcessorConfig> = {},
  ) {
    this.config = { ...DEFAULT_OUTBOX_CONFIG, ...config };
  }

  /**
   * Start the outbox processor
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => this.processBatch(), this.config.pollIntervalMs);
  }

  /**
   * Stop the outbox processor
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      delete this.intervalId;
    }
  }

  /**
   * Process a batch of outbox events
   */
  private async processBatch(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await (
        client as {
          query: (sql: string, params: unknown[]) => Promise<unknown>;
        }
      ).query('BEGIN', []);

      // Get pending events
      const result = await client.query(
        `SELECT id, aggregate_id, event_type, event_data, tenant_id, created_at, 
                retry_count, status, correlation_id, causation_id
         FROM eventsourcing.outbox_events 
         WHERE status = $1 AND retry_count < $2
         ORDER BY created_at ASC 
         LIMIT $3`,
        [OutboxEventStatus.PENDING, this.config.maxRetries, this.config.batchSize],
      );

      const events = result.rows.map((row: unknown) => this.mapRowToOutboxEvent(row));

      for (const event of events) {
        await this.processEvent(client, event);
      }

      await (
        client as {
          query: (sql: string, params: unknown[]) => Promise<unknown>;
        }
      ).query('COMMIT', []);
    } catch (error) {
      await (
        client as {
          query: (sql: string, params: unknown[]) => Promise<unknown>;
        }
      ).query('ROLLBACK', []);
      console.error('Error processing outbox batch:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Process a single outbox event
   */
  private async processEvent(client: unknown, event: OutboxEvent): Promise<void> {
    try {
      // Mark as processing
      await (
        client as {
          query: (sql: string, params: unknown[]) => Promise<unknown>;
        }
      ).query(
        `UPDATE eventsourcing.outbox_events 
         SET status = $1 
         WHERE id = $2`,
        [OutboxEventStatus.PROCESSING, event.id],
      );

      // Publish the event
      await this.eventPublisher(event);

      // Mark as processed
      await (
        client as {
          query: (sql: string, params: unknown[]) => Promise<unknown>;
        }
      ).query(
        `UPDATE eventsourcing.outbox_events 
         SET status = $1, processed_at = $2 
         WHERE id = $3`,
        [OutboxEventStatus.PROCESSED, new Date(), event.id],
      );
    } catch (error) {
      // Mark as failed
      await (
        client as {
          query: (sql: string, params: unknown[]) => Promise<unknown>;
        }
      ).query(
        `UPDATE eventsourcing.outbox_events 
         SET status = $1, retry_count = $2, error_message = $3 
         WHERE id = $4`,
        [
          OutboxEventStatus.FAILED,
          event.retryCount + 1,
          error instanceof Error ? error.message : 'Unknown error',
          event.id,
        ],
      );

      console.error(`Failed to process outbox event ${event.id}:`, error);
    }
  }

  /**
   * Add an event to the outbox
   */
  async addEvent(event: OutboxEvent): Promise<void> {
    const client = await this.pool.connect();

    try {
      await (
        client as {
          query: (sql: string, params: unknown[]) => Promise<unknown>;
        }
      ).query(
        `INSERT INTO eventsourcing.outbox_events 
         (id, aggregate_id, event_type, event_data, tenant_id, created_at, 
          retry_count, status, correlation_id, causation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          event.id,
          event.aggregateId,
          event.eventType,
          JSON.stringify(event.eventData),
          event.tenantId,
          event.createdAt,
          event.retryCount,
          event.status,
          event.correlationId,
          event.causationId,
        ],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Clean up old processed events
   */
  async cleanupProcessedEvents(olderThanDays: number = 7): Promise<void> {
    const client = await this.pool.connect();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      await (
        client as {
          query: (sql: string, params: unknown[]) => Promise<unknown>;
        }
      ).query(
        `DELETE FROM eventsourcing.outbox_events 
         WHERE status = $1 AND processed_at < $2`,
        [OutboxEventStatus.PROCESSED, cutoffDate],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get outbox statistics
   */
  async getStatistics(): Promise<{
    pending: number;
    processing: number;
    processed: number;
    failed: number;
  }> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT status, COUNT(*) as count 
         FROM eventsourcing.outbox_events 
         GROUP BY status`,
      );

      const stats = {
        pending: 0,
        processing: 0,
        processed: 0,
        failed: 0,
      };

      for (const row of result.rows) {
        stats[row.status as keyof typeof stats] = Number.parseInt(row.count);
      }

      return stats;
    } finally {
      client.release();
    }
  }

  private mapRowToOutboxEvent(row: unknown): OutboxEvent {
    const rowData = row as Record<string, unknown>;
    const event = new OutboxEvent(
      rowData.aggregate_id as string,
      rowData.event_type as string,
      rowData.event_data as Record<string, unknown>,
      rowData.tenant_id as string,
      rowData.correlation_id as string,
      rowData.causation_id as string,
    );

    // Set additional properties
    (event as unknown as { id: string }).id = rowData.id as string;
    (event as unknown as { createdAt: Date }).createdAt = rowData.created_at as Date;
    (event as unknown as { retryCount: number }).retryCount = rowData.retry_count as number;
    (event as unknown as { status: string }).status = rowData.status as string;

    return event;
  }
}
