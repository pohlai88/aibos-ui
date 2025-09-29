import { z } from 'zod';
/**
 * Outbox event for reliable messaging
 */
export declare class OutboxEvent {
    readonly id: string;
    readonly aggregateId: string;
    readonly eventType: string;
    readonly eventData: Record<string, unknown>;
    readonly tenantId: string;
    readonly createdAt: Date;
    processedAt?: Date;
    retryCount: number;
    status: OutboxEventStatus;
    errorMessage?: string;
    readonly correlationId?: string;
    readonly causationId?: string;
    constructor(aggregateId: string, eventType: string, eventData: Record<string, unknown>, tenantId: string, _correlationId?: string, _causationId?: string);
    /**
     * Mark event as processing
     */
    markAsProcessing(): void;
    /**
     * Mark event as processed
     */
    markAsProcessed(): void;
    /**
     * Mark event as failed
     */
    markAsFailed(errorMessage: string): void;
    /**
     * Check if event should be retried
     */
    shouldRetry(maxRetries?: number): boolean;
    /**
     * Reset event for retry
     */
    resetForRetry(): void;
}
/**
 * Outbox event status
 */
export declare enum OutboxEventStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    PROCESSED = "processed",
    FAILED = "failed"
}
/**
 * Schema for outbox event validation
 */
export declare const OutboxEventSchema: z.ZodObject<{
    id: z.ZodString;
    aggregateId: z.ZodString;
    eventType: z.ZodString;
    eventData: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    tenantId: z.ZodString;
    createdAt: z.ZodDate;
    processedAt: z.ZodOptional<z.ZodDate>;
    retryCount: z.ZodNumber;
    status: z.ZodNativeEnum<typeof OutboxEventStatus>;
    errorMessage: z.ZodOptional<z.ZodString>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    status: OutboxEventStatus;
    aggregateId: string;
    eventType: string;
    createdAt: Date;
    eventData: Record<string, unknown>;
    retryCount: number;
    causationId?: string | undefined;
    correlationId?: string | undefined;
    processedAt?: Date | undefined;
    errorMessage?: string | undefined;
}, {
    id: string;
    tenantId: string;
    status: OutboxEventStatus;
    aggregateId: string;
    eventType: string;
    createdAt: Date;
    eventData: Record<string, unknown>;
    retryCount: number;
    causationId?: string | undefined;
    correlationId?: string | undefined;
    processedAt?: Date | undefined;
    errorMessage?: string | undefined;
}>;
export type OutboxEventData = z.infer<typeof OutboxEventSchema>;
//# sourceMappingURL=outbox-event.d.ts.map