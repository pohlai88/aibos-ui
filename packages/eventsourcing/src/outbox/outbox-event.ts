import { z } from 'zod';

/**
 * Outbox event for reliable messaging
 */
export class OutboxEvent {
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly eventType: string;
  public readonly eventData: Record<string, unknown>;
  public readonly tenantId: string;
  public readonly createdAt: Date;
  public processedAt?: Date;
  public retryCount: number;
  public status: OutboxEventStatus;
  public errorMessage?: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  constructor(
    aggregateId: string,
    eventType: string,
    eventData: Record<string, unknown>,
    tenantId: string,
    _correlationId?: string,
    _causationId?: string,
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.eventData = eventData;
    this.tenantId = tenantId;
    this.createdAt = new Date();
    this.retryCount = 0;
    this.status = OutboxEventStatus.PENDING;
  }

  /**
   * Mark event as processing
   */
  markAsProcessing(): void {
    this.status = OutboxEventStatus.PROCESSING;
  }

  /**
   * Mark event as processed
   */
  markAsProcessed(): void {
    this.status = OutboxEventStatus.PROCESSED;
    this.processedAt = new Date();
  }

  /**
   * Mark event as failed
   */
  markAsFailed(errorMessage: string): void {
    this.status = OutboxEventStatus.FAILED;
    this.errorMessage = errorMessage;
    this.retryCount++;
  }

  /**
   * Check if event should be retried
   */
  shouldRetry(maxRetries: number = 3): boolean {
    return this.status === OutboxEventStatus.FAILED && this.retryCount < maxRetries;
  }

  /**
   * Reset event for retry
   */
  resetForRetry(): void {
    this.status = OutboxEventStatus.PENDING;
    delete this.errorMessage;
  }
}

/**
 * Outbox event status
 */
export enum OutboxEventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

/**
 * Schema for outbox event validation
 */
export const OutboxEventSchema = z.object({
  id: z.string().uuid(),
  aggregateId: z.string(),
  eventType: z.string(),
  eventData: z.record(z.unknown()),
  tenantId: z.string().uuid(),
  createdAt: z.date(),
  processedAt: z.date().optional(),
  retryCount: z.number().int().min(0),
  status: z.nativeEnum(OutboxEventStatus),
  errorMessage: z.string().optional(),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
});

export type OutboxEventData = z.infer<typeof OutboxEventSchema>;
