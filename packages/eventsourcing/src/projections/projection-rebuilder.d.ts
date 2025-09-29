import type { EventStore } from '../core/event-store';
import type { Projection } from './projection';
/**
 * Configuration for projection rebuilding
 */
export interface ProjectionRebuilderConfig {
    batchSize: number;
    checkpointInterval: number;
    maxRetries: number;
    retryDelayMs: number;
}
/**
 * Default configuration for projection rebuilding
 */
export declare const DEFAULT_REBUILDER_CONFIG: ProjectionRebuilderConfig;
/**
 * Projection rebuilder for rebuilding projections from events
 */
export declare class ProjectionRebuilder {
    private eventStore;
    private config;
    constructor(eventStore: EventStore, config?: Partial<ProjectionRebuilderConfig>);
    /**
     * Rebuild a projection from all events
     */
    rebuildProjection(projection: Projection): Promise<void>;
    /**
     * Rebuild a projection from a specific timestamp
     */
    rebuildProjectionFromTimestamp(projection: Projection, fromTimestamp: Date): Promise<void>;
    /**
     * Rebuild multiple projections
     */
    rebuildProjections(projections: Projection[]): Promise<void>;
    /**
     * Validate projection consistency
     */
    validateProjection(projection: Projection): Promise<boolean>;
}
//# sourceMappingURL=projection-rebuilder.d.ts.map