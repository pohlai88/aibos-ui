import type { DomainEvent } from '../core/domain-event';
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
export const DEFAULT_REPLAY_CONFIG: EventReplayConfig = {
  batchSize: 1000,
  checkpointInterval: 100,
  maxRetries: 3,
  retryDelayMs: 1000,
};

/**
 * Event replay engine for replaying events through handlers
 */
export class EventReplayEngine {
  private config: EventReplayConfig;

  constructor(
    private eventStore: EventStore,
    config: Partial<EventReplayConfig> = {},
  ) {
    this.config = { ...DEFAULT_REPLAY_CONFIG, ...config };
  }

  /**
   * Replay events for a specific stream
   */
  async replayStream(
    streamId: string,
    handlers: EventHandler[],
    fromVersion?: number,
  ): Promise<void> {
    console.log(`Starting replay of stream: ${streamId}`);

    const startTime = Date.now();
    let processedCount = 0;
    let lastCheckpoint = 0;

    try {
      // Get events from the stream
      const events = await this.eventStore.getEvents(streamId, fromVersion);

      console.log(`Found ${events.length} events for stream ${streamId}`);

      // Process events in batches
      for (let index = 0; index < events.length; index += this.config.batchSize) {
        const batch = events.slice(index, index + this.config.batchSize);

        for (const event of batch) {
          await this.processEvent(event, handlers);
          processedCount++;
        }

        // Checkpoint
        if (processedCount - lastCheckpoint >= this.config.checkpointInterval) {
          console.log(`Processed ${processedCount}/${events.length} events for stream ${streamId}`);
          lastCheckpoint = processedCount;
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `Completed replay of stream ${streamId}: ${processedCount} events processed in ${duration}ms`,
      );
    } catch (error) {
      console.error(`Failed to replay stream ${streamId}:`, error);
      throw error;
    }
  }

  /**
   * Replay events from a specific timestamp
   */
  async replayFromTimestamp(fromTimestamp: Date, handlers: EventHandler[]): Promise<void> {
    console.log(`Starting replay from timestamp: ${fromTimestamp.toISOString()}`);

    const startTime = Date.now();
    let processedCount = 0;
    let lastCheckpoint = 0;

    try {
      // Get events from the timestamp
      const events = await this.eventStore.getEventsFromTimestamp(fromTimestamp);

      console.log(`Found ${events.length} events from timestamp`);

      // Process events in batches
      for (let index = 0; index < events.length; index += this.config.batchSize) {
        const batch = events.slice(index, index + this.config.batchSize);

        for (const event of batch) {
          await this.processEvent(event, handlers);
          processedCount++;
        }

        // Checkpoint
        if (processedCount - lastCheckpoint >= this.config.checkpointInterval) {
          console.log(`Processed ${processedCount}/${events.length} events from timestamp`);
          lastCheckpoint = processedCount;
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `Completed replay from timestamp: ${processedCount} events processed in ${duration}ms`,
      );
    } catch (error) {
      console.error('Failed to replay from timestamp:', error);
      throw error;
    }
  }

  /**
   * Replay events for multiple streams
   */
  async replayStreams(streamIds: string[], handlers: EventHandler[]): Promise<void> {
    console.log(`Starting replay of ${streamIds.length} streams`);

    const startTime = Date.now();

    for (const streamId of streamIds) {
      await this.replayStream(streamId, handlers);
    }

    const duration = Date.now() - startTime;
    console.log(`Completed replay of ${streamIds.length} streams in ${duration}ms`);
  }

  /**
   * Process a single event through handlers
   */
  private async processEvent(event: unknown, handlers: EventHandler[]): Promise<void> {
    const relevantHandlers = handlers.filter((handler) => handler.canHandle(event as DomainEvent));

    for (const handler of relevantHandlers) {
      try {
        await handler.handle(event as DomainEvent);
      } catch (error) {
        const eventData = event as { id: string };
        console.error(
          `Failed to process event ${eventData.id} with handler ${handler.getEventType()}:`,
          error,
        );
        throw error;
      }
    }
  }

  /**
   * Get replay statistics
   */
  async getReplayStatistics(streamId: string): Promise<{
    totalEvents: number;
    lastEventTimestamp?: Date;
    firstEventTimestamp?: Date;
  }> {
    const events = await this.eventStore.getEvents(streamId);

    if (events.length === 0) {
      return { totalEvents: 0 };
    }

    const timestamps = events.map((event) => event.occurredAt);
    const sortedTimestamps = timestamps.sort((a, b) => a.getTime() - b.getTime());

    const result: {
      totalEvents: number;
      lastEventTimestamp?: Date;
      firstEventTimestamp?: Date;
    } = {
      totalEvents: events.length,
    };

    if (sortedTimestamps.length > 0) {
      const firstTimestamp = sortedTimestamps[0];
      const lastTimestamp = sortedTimestamps.at(-1);
      if (firstTimestamp !== undefined) {
        result.firstEventTimestamp = firstTimestamp;
      }
      if (lastTimestamp !== undefined) {
        result.lastEventTimestamp = lastTimestamp;
      }
    }

    return result;
  }
}
