import type { EventStore } from '@aibos/accounting';
import type { DomainEvent } from '@aibos/eventsourcing';
import type { EntityManager } from 'typeorm';
import { createBusinessError } from '../../utils/error-utilities';

export class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();

  reset(): void {
    this.events.clear();
  }

  async append(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
    _idempotencyKey?: string,
  ): Promise<void> {
    const key = `${tenantId}:${streamId}`;
    const existingEvents = this.events.get(key) || [];

    // Check optimistic concurrency
    if (existingEvents.length !== expectedVersion) {
      throw createBusinessError(
        'CONCURRENCY_CONFLICT',
        `Concurrency conflict. Expected version ${expectedVersion}, but current version is ${existingEvents.length}`,
        expectedVersion.toString(),
        { operation: 'append-events' }
      );
    }

    // Add new events
    const newEvents = [...existingEvents, ...events];
    this.events.set(key, newEvents);
  }

  async appendWithTransaction(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
    idempotencyKey?: string,
  ): Promise<EntityManager> {
    // For in-memory store, just call append and return a mock EntityManager
    await this.append(streamId, events, expectedVersion, tenantId, idempotencyKey);

    // Return a mock EntityManager that can be used for outbox co-commit
    // In a real implementation, this would be the actual EntityManager from the transaction
    return {} as EntityManager;
  }

  async getEvents(
    streamId: string,
    fromVersion?: number,
    tenantId?: string,
  ): Promise<DomainEvent[]> {
    const key = `${tenantId}:${streamId}`;
    const events = this.events.get(key) || [];

    if (fromVersion !== undefined) {
      return events.filter((event) => event.version >= fromVersion);
    }

    return events;
  }
}
