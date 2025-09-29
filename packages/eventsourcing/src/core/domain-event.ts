import { z } from 'zod';

/**
 * Base class for all domain events in the Event Sourcing system
 */
export abstract class DomainEvent {
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  constructor(
    aggregateId: string,
    version: number,
    tenantId: string,
    correlationId?: string,
    causationId?: string,
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = aggregateId;
    this.version = version;
    this.occurredAt = new Date();
    this.tenantId = tenantId;
    if (correlationId !== undefined) {
      this.correlationId = correlationId;
    }
    if (causationId !== undefined) {
      this.causationId = causationId;
    }
  }

  /**
   * Get the event type name for serialization
   */
  abstract get eventType(): string;

  /**
   * Serialize event data for storage
   */
  abstract serialize(): Record<string, unknown>;

  /**
   * Deserialize event data from storage
   */
  static deserialize<T extends DomainEvent>(
    this: new (...args: unknown[]) => T,
    _data: Record<string, unknown>,
  ): T {
    throw new Error('Deserialize method must be implemented by subclasses');
  }
}

/**
 * Schema for event metadata
 */
export const EventMetadataSchema = z.object({
  id: z.string().uuid(),
  aggregateId: z.string(),
  version: z.number().int().positive(),
  eventType: z.string(),
  occurredAt: z.date(),
  tenantId: z.string().uuid(),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
});

export type EventMetadata = z.infer<typeof EventMetadataSchema>;
