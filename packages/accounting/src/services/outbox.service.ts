import type { DomainEvent } from '@aibos/eventsourcing';

import { OutboxEventEntity } from '../infrastructure/outbox-event.entity';
import { type KafkaProducerService } from '../services/kafka-producer.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository, type EntityManager } from 'typeorm';
import { isEmpty } from '../utils';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly outboxRepository: Repository<OutboxEventEntity>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  /**
   * If provided, `manager` will be used to save outbox rows within an existing DB transaction.
   */
  async publishEvents(
    events: DomainEvent[],
    tenantId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const now = new Date();
    const outboxEvents = events.map((event) => {
      if (manager) {
        return manager.create(OutboxEventEntity, {
          tenantId,
          topic: this.getTopicForEvent(event),
          key: event.aggregateId,
          payload: (event as { serialize?: () => Record<string, unknown> }).serialize
            ? (event as { serialize: () => Record<string, unknown> }).serialize()
            : event,
          status: 'READY',
          retryCount: 0,
          createdAt: now,
        });
      } else {
        return this.outboxRepository.create({
          tenantId,
          topic: this.getTopicForEvent(event),
          key: event.aggregateId,
          payload: (event as { serialize?: () => Record<string, unknown> }).serialize
            ? (event as { serialize: () => Record<string, unknown> }).serialize()
            : event,
          status: 'READY',
          retryCount: 0,
          createdAt: now,
        });
      }
    });

    if (manager) {
      await manager.save(OutboxEventEntity, outboxEvents);
    } else {
      await this.outboxRepository.save(outboxEvents);
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxEvents(): Promise<void> {
    // Lease a batch with SKIP LOCKED to support parallel workers safely.
    const pendingEvents: OutboxEventEntity[] = await this.outboxRepository.manager.query(
      `
      UPDATE outbox_events
      SET status = 'PROCESSING', processed_at = NOW()
      WHERE id IN (
        SELECT id
        FROM outbox_events
        WHERE status = 'READY'
          AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 100
      )
      RETURNING *;
      `,
    );

    if (isEmpty(pendingEvents)) {
      return;
    }

    this.logger.log(`Processing ${pendingEvents.length} outbox events`);

    for (const event of pendingEvents) {
      try {
        // Convert outbox event back to DomainEvent for publishing
        const domainEvent = event.payload as DomainEvent;
        await this.kafkaProducer.publishEvent(domainEvent);

        await this.outboxRepository.update(event.id, {
          status: 'PUBLISHED',
          processedAt: new Date(),
        });

        this.logger.debug(`Published event ${event.id} to topic ${event.topic}`);
      } catch (error) {
        this.logger.error(`Failed to publish event ${event.id}:`, error);
        const retries = (event.retryCount ?? 0) + 1;
        const backoffMs = Math.min(60000, 2000 * retries) + Math.floor(Math.random() * 500);
        await this.outboxRepository.update(event.id, {
          status: 'READY',
          retryCount: retries,
          nextAttemptAt: new Date(Date.now() + backoffMs),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errorReason: String((error as any)?.message ?? 'unknown'),
        });
      }
    }
  }

  private getTopicForEvent(event: DomainEvent): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventType = (event as any).eventType ?? event.constructor.name;
    const topicMap = {
      AccountCreatedEvent: 'accounting.account.created',
      JournalEntryPostedEvent: 'accounting.journal.posted',
      // Add other event mappings
    };

    return topicMap[eventType as keyof typeof topicMap] || 'accounting.unknown';
  }
}
