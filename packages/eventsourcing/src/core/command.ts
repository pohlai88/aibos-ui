import { z } from 'zod';

/**
 * Base class for all commands in the Event Sourcing system
 */
export abstract class Command {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;
  public readonly timestamp: Date;

  constructor(tenantId: string, correlationId?: string, causationId?: string) {
    this.id = crypto.randomUUID();
    this.tenantId = tenantId;
    if (correlationId !== undefined) {
      this.correlationId = correlationId;
    }
    if (causationId !== undefined) {
      this.causationId = causationId;
    }
    this.timestamp = new Date();
  }

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
export const CommandMetadataSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
  timestamp: z.date(),
  commandType: z.string(),
});

export type CommandMetadata = z.infer<typeof CommandMetadataSchema>;
