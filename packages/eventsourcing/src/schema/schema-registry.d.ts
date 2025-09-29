import type { DomainEvent } from '../core/domain-event';
/**
 * Schema version information
 */
export interface SchemaVersion {
    version: number;
    schema: Record<string, unknown>;
    createdAt: Date;
    deprecated: boolean;
    deprecatedAt?: Date;
}
/**
 * Event schema definition
 */
export interface EventSchema {
    eventType: string;
    versions: SchemaVersion[];
    currentVersion: number;
}
/**
 * Schema registry interface
 */
export interface SchemaRegistry {
    registerSchema(eventType: string, schema: Record<string, unknown>): Promise<void>;
    getSchema(eventType: string, version?: number): Promise<EventSchema | null>;
    validateEvent(event: DomainEvent): Promise<boolean>;
    getCurrentVersion(eventType: string): Promise<number>;
    deprecateVersion(eventType: string, version: number): Promise<void>;
}
/**
 * In-memory schema registry implementation
 */
export declare class InMemorySchemaRegistry implements SchemaRegistry {
    private schemas;
    /**
     * Register a new schema version
     */
    registerSchema(eventType: string, schema: Record<string, unknown>): Promise<void>;
    /**
     * Get schema for event type and version
     */
    getSchema(eventType: string, version?: number): Promise<EventSchema | null>;
    /**
     * Validate event against schema
     */
    validateEvent(event: DomainEvent): Promise<boolean>;
    /**
     * Get current version for event type
     */
    getCurrentVersion(eventType: string): Promise<number>;
    /**
     * Deprecate a schema version
     */
    deprecateVersion(eventType: string, version: number): Promise<void>;
    /**
     * Extract required fields from schema
     */
    private extractRequiredFields;
    /**
     * Get all registered schemas
     */
    getAllSchemas(): EventSchema[];
    /**
     * Clear all schemas (for testing)
     */
    clear(): void;
}
//# sourceMappingURL=schema-registry.d.ts.map