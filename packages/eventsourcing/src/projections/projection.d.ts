import type { DomainEvent } from '../core/domain-event';
/**
 * Base interface for projections in the event sourcing system
 */
export interface Projection {
    /**
     * Get the name of this projection
     */
    getName(): string;
    /**
     * Get the event types this projection handles
     */
    getEventTypes(): string[];
    /**
     * Process a domain event
     */
    process(event: DomainEvent): Promise<void>;
    /**
     * Reset the projection state
     */
    reset(): Promise<void>;
    /**
     * Get the current state of the projection
     */
    getState(): unknown;
    /**
     * Get the last processed event version
     */
    getLastProcessedVersion(): number;
    /**
     * Set the last processed event version
     */
    setLastProcessedVersion(version: number): void;
}
/**
 * Abstract base class for projections
 */
export declare abstract class BaseProjection implements Projection {
    private lastProcessedVersion;
    abstract getName(): string;
    abstract getEventTypes(): string[];
    abstract process(event: DomainEvent): Promise<void>;
    abstract reset(): Promise<void>;
    abstract getState(): unknown;
    getLastProcessedVersion(): number;
    setLastProcessedVersion(version: number): void;
}
//# sourceMappingURL=projection.d.ts.map