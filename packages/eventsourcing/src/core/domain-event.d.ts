import { z } from 'zod';
/**
 * Base class for all domain events in the Event Sourcing system
 */
export declare abstract class DomainEvent {
    readonly id: string;
    readonly aggregateId: string;
    readonly version: number;
    readonly occurredAt: Date;
    readonly tenantId: string;
    readonly correlationId?: string;
    readonly causationId?: string;
    constructor(aggregateId: string, version: number, tenantId: string, correlationId?: string, causationId?: string);
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
    static deserialize<T extends DomainEvent>(this: new (...args: unknown[]) => T, _data: Record<string, unknown>): T;
}
/**
 * Schema for event metadata
 */
export declare const EventMetadataSchema: z.ZodObject<{
    id: z.ZodString;
    aggregateId: z.ZodString;
    version: z.ZodNumber;
    eventType: z.ZodString;
    occurredAt: z.ZodDate;
    tenantId: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    aggregateId: string;
    eventType: string;
    version: number;
    occurredAt: Date;
    causationId?: string | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    tenantId: string;
    aggregateId: string;
    eventType: string;
    version: number;
    occurredAt: Date;
    causationId?: string | undefined;
    correlationId?: string | undefined;
}>;
export type EventMetadata = z.infer<typeof EventMetadataSchema>;
//# sourceMappingURL=domain-event.d.ts.map