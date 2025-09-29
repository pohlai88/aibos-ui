import type { DomainEvent } from '../core/domain-event';
/**
 * Upcaster function type
 */
export type Upcaster = (event: DomainEvent) => DomainEvent;
/**
 * Upcaster pipeline configuration
 */
export interface UpcasterPipelineConfig {
    maxVersions: number;
    enableLogging: boolean;
}
/**
 * Default upcaster pipeline configuration
 */
export declare const DEFAULT_UPASTER_CONFIG: UpcasterPipelineConfig;
/**
 * Upcaster pipeline for event evolution
 */
export declare class UpcasterPipeline {
    private config;
    private upcasters;
    constructor(config?: UpcasterPipelineConfig);
    /**
     * Register an upcaster for an event type
     */
    registerUpcaster(eventType: string, upcaster: Upcaster): void;
    /**
     * Upcast an event to the latest version
     */
    upcastEvent(event: DomainEvent): DomainEvent;
    /**
     * Check if upcasters exist for event type
     */
    hasUpcasters(eventType: string): boolean;
    /**
     * Get upcaster count for event type
     */
    getUpcasterCount(eventType: string): number;
    /**
     * Get all registered event types
     */
    getRegisteredEventTypes(): string[];
    /**
     * Clear all upcasters (for testing)
     */
    clear(): void;
}
/**
 * Built-in upcasters for common event evolution patterns
 */
export declare class BuiltInUpcasters {
    /**
     * Add a new field with default value
     */
    static addField(fieldName: string, defaultValue: unknown): Upcaster;
    /**
     * Rename a field
     */
    static renameField(oldFieldName: string, newFieldName: string): Upcaster;
    /**
     * Remove a field
     */
    static removeField(fieldName: string): Upcaster;
    /**
     * Transform field value
     */
    static transformField(fieldName: string, transformer: (value: unknown) => unknown): Upcaster;
    /**
     * Update schema version in metadata
     */
    static updateSchemaVersion(newVersion: number): Upcaster;
}
/**
 * Default upcaster pipeline with common event evolution patterns
 */
export declare function createDefaultUpcasterPipeline(): UpcasterPipeline;
//# sourceMappingURL=upcaster.d.ts.map