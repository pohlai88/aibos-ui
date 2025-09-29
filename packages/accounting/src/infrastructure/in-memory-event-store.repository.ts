import type { EventStore, DomainEvent, AggregateRoot } from '@aibos/eventsourcing';
import type { EntityManager } from 'typeorm';
import { createBusinessError } from '../utils/error-utilities';

export class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();
  private streams: Map<string, number> = new Map();
  private snapshots: Map<string, AggregateRoot> = new Map();

  reset(): void {
    this.events.clear();
    this.streams.clear();
    this.snapshots.clear();
  }

  async append(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
  ): Promise<void> {
    const existingEvents = this.events.get(streamId) || [];
    const currentVersion = existingEvents.length;

    // Check optimistic concurrency
    if (currentVersion !== expectedVersion) {
      throw createBusinessError(
        'CONCURRENCY_CONFLICT',
        `Concurrency conflict. Expected version ${expectedVersion}, but current version is ${currentVersion}`,
        expectedVersion.toString(),
        { operation: 'append-events' }
      );
    }

    // Add new events
    const newEvents = [...existingEvents, ...events];
    this.events.set(streamId, newEvents);
    this.streams.set(streamId, newEvents.length);
  }

  async getEvents(
    streamId: string,
    fromVersion?: number,
  ): Promise<DomainEvent[]> {
    const events = this.events.get(streamId) || [];

    if (fromVersion !== undefined) {
      return events.filter((event) => event.version >= fromVersion);
    }

    return events;
  }

  async getEventsFromTimestamp(timestamp: Date): Promise<DomainEvent[]> {
    const allEvents: DomainEvent[] = [];
    for (const events of Array.from(this.events.values())) {
      allEvents.push(...events);
    }
    return allEvents.filter((event) => event.occurredAt >= timestamp);
  }

  async createSnapshot(streamId: string, aggregate: AggregateRoot): Promise<void> {
    this.snapshots.set(streamId, aggregate);
  }

  async getSnapshot(streamId: string): Promise<AggregateRoot | null> {
    return this.snapshots.get(streamId) || null;
  }

  async getStreamVersion(streamId: string): Promise<number> {
    return this.streams.get(streamId) || 0;
  }

  async streamExists(streamId: string): Promise<boolean> {
    return this.events.has(streamId);
  }

  async deleteStream(streamId: string): Promise<void> {
    this.events.delete(streamId);
    this.streams.delete(streamId);
    this.snapshots.delete(streamId);
  }

  // Additional methods for extended functionality
  async appendWithTransaction(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
    idempotencyKey?: string,
  ): Promise<EntityManager> {
    // For in-memory store, just call append and return a mock EntityManager
    await this.append(streamId, events, expectedVersion);

    // Return a mock EntityManager that can be used for outbox co-commit
    // In a real implementation, this would be the actual EntityManager from the transaction
    return {} as EntityManager;
  }

  // Additional utility methods for testing
  getAllStreamIds(): string[] {
    return Array.from(this.events.keys());
  }

  getTotalEventCount(): number {
    let total = 0;
    for (const events of Array.from(this.events.values())) {
      total += events.length;
    }
    return total;
  }
}
