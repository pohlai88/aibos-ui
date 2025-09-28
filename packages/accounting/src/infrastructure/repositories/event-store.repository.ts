import type { EventStore } from '../../domain/repositories.interface';
import { safeGet } from '../../utils';
import type { DomainEvent } from '@aibos/eventsourcing';
import type { DataSource, QueryRunner, EntityManager } from 'typeorm';

import { AccountCreatedEvent } from '../../events/account-created.event';
import { JournalEntryPostedEvent } from '../../events/journal-entry-posted.event';
import { AccountingEventEntity } from '../accounting-event.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

@Injectable()
export class PostgreSQLEventStore implements EventStore {
  private readonly logger = new Logger(PostgreSQLEventStore.name);

  constructor(
    @InjectRepository(AccountingEventEntity)
    private readonly eventRepository: Repository<AccountingEventEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async append(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
    idempotencyKey?: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Set tenant context
      await queryRunner.query('SELECT set_tenant_context($1)', [tenantId]);

      // Check current version for optimistic concurrency
      const currentVersion = await this.getCurrentVersion(streamId, tenantId, queryRunner);
      if (currentVersion !== expectedVersion) {
        throw new Error(
          `Concurrency conflict. Expected version ${expectedVersion}, but current version is ${currentVersion}`,
        );
      }

      // Check for idempotency if key provided
      if (idempotencyKey) {
        const existingEvent = await queryRunner.query(
          'SELECT id FROM acc_event WHERE idempotency_key = $1 AND tenant_id = $2',
          [idempotencyKey, tenantId],
        );
        if (existingEvent.length > 0) {
          this.logger.debug(
            `Event with idempotency key ${idempotencyKey} already exists, skipping`,
          );
          await queryRunner.commitTransaction();
          return;
        }
      }

      // Insert events
      const eventEntities = events.map((event, index) => ({
        tenantId,
        streamId,
        version: expectedVersion + index + 1,
        eventType: event.constructor.name,
        eventData: (event as unknown as { toJSON?: () => Record<string, unknown> }).toJSON
          ? (event as unknown as { toJSON: () => Record<string, unknown> }).toJSON()
          : event.serialize(),
        metadata: {
          correlationId: event.correlationId,
          causationId: event.causationId,
        },
        occurredAt: event.occurredAt,
        correlationId: event.correlationId,
        causationId: event.causationId,
        idempotencyKey: index === 0 ? idempotencyKey : undefined, // Only first event gets the key
      }));

      await queryRunner.manager.save(AccountingEventEntity, eventEntities);
      await queryRunner.commitTransaction();

      this.logger.debug(`Successfully appended ${events.length} events to stream ${streamId}`);
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();

      // Handle specific PostgreSQL errors
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        // Unique violation
        const pgError = error as { code: string; constraint?: string };
        if (pgError.constraint?.includes('idempotency_key')) {
          this.logger.debug(`Idempotency key conflict for ${idempotencyKey}, treating as success`);
          return; // Treat as success for idempotency
        }
        if (pgError.constraint?.includes('tenant_id_stream_id_version')) {
          throw new Error(`Concurrency conflict: version ${expectedVersion} already exists`);
        }
      }

      this.logger.error(`Failed to append events to stream ${streamId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async appendWithTransaction(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
    idempotencyKey?: string,
  ): Promise<EntityManager> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Set tenant context
      await queryRunner.query('SELECT set_tenant_context($1)', [tenantId]);

      // Check current version for optimistic concurrency
      const currentVersion = await this.getCurrentVersion(streamId, tenantId, queryRunner);
      if (currentVersion !== expectedVersion) {
        throw new Error(
          `Concurrency conflict. Expected version ${expectedVersion}, but current version is ${currentVersion}`,
        );
      }

      // Check for idempotency if key provided
      if (idempotencyKey) {
        const existingEvent = await queryRunner.query(
          'SELECT id FROM acc_event WHERE idempotency_key = $1 AND tenant_id = $2',
          [idempotencyKey, tenantId],
        );
        if (existingEvent.length > 0) {
          this.logger.debug(
            `Event with idempotency key ${idempotencyKey} already exists, skipping`,
          );
          await queryRunner.commitTransaction();
          return queryRunner.manager;
        }
      }

      // Insert events
      const eventEntities = events.map((event, index) => ({
        tenantId,
        streamId,
        version: expectedVersion + index + 1,
        eventType: event.constructor.name,
        eventData: (event as unknown as { toJSON?: () => Record<string, unknown> }).toJSON
          ? (event as unknown as { toJSON: () => Record<string, unknown> }).toJSON()
          : event.serialize(),
        metadata: {
          correlationId: event.correlationId,
          causationId: event.causationId,
        },
        occurredAt: event.occurredAt,
        correlationId: event.correlationId,
        causationId: event.causationId,
        idempotencyKey: index === 0 ? idempotencyKey : undefined, // Only first event gets the key
      }));

      await queryRunner.manager.save(AccountingEventEntity, eventEntities);
      await queryRunner.commitTransaction();

      this.logger.debug(
        `Successfully appended ${events.length} events to stream ${streamId} with transaction`,
      );
      return queryRunner.manager;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();

      // Handle specific PostgreSQL errors
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        // Unique violation
        const pgError = error as { code: string; constraint?: string };
        if (pgError.constraint?.includes('idempotency_key')) {
          this.logger.debug(`Idempotency key conflict for ${idempotencyKey}, treating as success`);
          await queryRunner.commitTransaction();
          return queryRunner.manager; // Treat as success for idempotency
        }
        if (pgError.constraint?.includes('tenant_id_stream_id_version')) {
          throw new Error(`Concurrency conflict: version ${expectedVersion} already exists`);
        }
      }

      this.logger.error(`Failed to append events to stream ${streamId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getEvents(
    streamId: string,
    fromVersion?: number,
    tenantId?: string,
  ): Promise<DomainEvent[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.streamId = :streamId', { streamId })
      .orderBy('event.version', 'ASC');

    if (fromVersion !== undefined) {
      queryBuilder.andWhere('event.version >= :fromVersion', { fromVersion });
    }

    if (tenantId) {
      queryBuilder.andWhere('event.tenantId = :tenantId', { tenantId });
    }

    const events = await queryBuilder.getMany();
    return events.map(this.toDomainEvent);
  }

  private async getCurrentVersion(
    streamId: string,
    tenantId: string,
    queryRunner: QueryRunner,
  ): Promise<number> {
    const result = await queryRunner.query(
      'SELECT COALESCE(MAX(version), 0) as version FROM acc_event WHERE stream_id = $1 AND tenant_id = $2',
      [streamId, tenantId],
    );
    return /* TODO: allow-list */ safeGet(result, 0, [] as const)?.version || 0;
  }

  private toDomainEvent(entity: AccountingEventEntity): DomainEvent {
    // Event reconstruction logic based on event type
    const EventClass = this.getEventClass(entity.eventType);
    if (
      EventClass &&
      typeof (EventClass as { fromJSON?: (...args: unknown[]) => DomainEvent }).fromJSON ===
        'function'
    ) {
      return (EventClass as { fromJSON: (...args: unknown[]) => DomainEvent }).fromJSON(
        entity.eventData,
        {
          id: entity.id,
          occurredAt: entity.occurredAt,
          correlationId: entity.correlationId || undefined,
          causationId: entity.causationId || undefined,
        },
      );
    }
    // Fallback: create a basic domain event if reconstruction fails
    throw new Error(`Cannot reconstruct event of type ${entity.eventType}`);
  }

  private getEventClass(eventType: string): unknown {
    // Event type registry - maps event type strings to classes
    const eventRegistry: Record<string, unknown> = {
      AccountCreatedEvent,
      JournalEntryPostedEvent,
      // Add other event types
    };

    // Use Object.hasOwn to safely check for property existence
    if (!Object.hasOwn(eventRegistry, eventType)) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    return /* TODO: allow-list */ safeGet(eventRegistry, eventType, [] as const);
  }
}
