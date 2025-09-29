import { z } from 'zod';
/**
 * Base class for all commands in the Event Sourcing system
 */
export declare abstract class Command {
    readonly id: string;
    readonly tenantId: string;
    readonly correlationId?: string;
    readonly causationId?: string;
    readonly timestamp: Date;
    constructor(tenantId: string, correlationId?: string, causationId?: string);
    /**
     * Get the command type name
     */
    abstract get commandType(): string;
    /**
     * Validate the command
     */
    abstract validate(): void;
    /**
     * Serialize command data
     */
    abstract serialize(): Record<string, unknown>;
}
/**
 * Schema for command metadata
 */
export declare const CommandMetadataSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
    commandType: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    id: string;
    tenantId: string;
    commandType: string;
    causationId?: string | undefined;
    correlationId?: string | undefined;
}, {
    timestamp: Date;
    id: string;
    tenantId: string;
    commandType: string;
    causationId?: string | undefined;
    correlationId?: string | undefined;
}>;
export type CommandMetadata = z.infer<typeof CommandMetadataSchema>;
//# sourceMappingURL=command.d.ts.map