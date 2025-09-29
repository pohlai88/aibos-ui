import type { Pool } from 'pg';
/**
 * Projection checkpoint record
 */
export interface ProjectionCheckpoint {
    projectorName: string;
    topic: string;
    partition: number;
    offset: string;
    updatedAt: Date;
}
/**
 * Projection status record
 */
export interface ProjectionStatus {
    projectorName: string;
    status: 'stopped' | 'running' | 'paused' | 'error';
    lastProcessedAt: Date | null;
    lastError: string | null;
    processedCount: number;
    errorCount: number;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Projection lag information
 */
export interface ProjectionLag {
    topic: string;
    partition: number;
    lagMs: number;
}
/**
 * Projection checkpoint manager for resumable processing
 */
export declare class ProjectionCheckpointManager {
    private pool;
    constructor(pool: Pool);
    /**
     * Save checkpoint for a projector
     */
    saveCheckpoint(checkpoint: ProjectionCheckpoint): Promise<void>;
    /**
     * Get checkpoint for a projector and topic-partition
     */
    getCheckpoint(projectorName: string, topic: string, partition: number): Promise<ProjectionCheckpoint | null>;
    /**
     * Get all checkpoints for a projector
     */
    getProjectorCheckpoints(projectorName: string): Promise<ProjectionCheckpoint[]>;
    /**
     * Reset checkpoint for a projector and topic-partition
     */
    resetCheckpoint(projectorName: string, topic: string, partition: number): Promise<void>;
    /**
     * Update projection status
     */
    updateProjectionStatus(projectorName: string, status: ProjectionStatus['status'], lastError?: string): Promise<void>;
    /**
     * Increment processed count
     */
    incrementProcessedCount(projectorName: string): Promise<void>;
    /**
     * Increment error count
     */
    incrementErrorCount(projectorName: string, error: string): Promise<void>;
    /**
     * Get projection status
     */
    getProjectionStatus(projectorName: string): Promise<ProjectionStatus | null>;
    /**
     * Get projection lag information
     */
    getProjectionLag(projectorName: string): Promise<ProjectionLag[]>;
    /**
     * Record projection metric
     */
    recordMetric(projectorName: string, metricName: string, metricValue: number): Promise<void>;
    /**
     * Get projection metrics for a time range
     */
    getProjectionMetrics(projectorName: string, metricName: string, fromDate: Date, toDate: Date): Promise<Array<{
        value: number;
        timestamp: Date;
    }>>;
    /**
     * Cleanup old metrics
     */
    cleanupOldMetrics(retentionDays?: number): Promise<void>;
    /**
     * Get all projector names
     */
    getAllProjectorNames(): Promise<string[]>;
    /**
     * Get projection health summary
     */
    getProjectionHealthSummary(): Promise<{
        totalProjectors: number;
        runningProjectors: number;
        errorProjectors: number;
        stoppedProjectors: number;
        totalProcessedEvents: number;
        totalErrors: number;
    }>;
}
//# sourceMappingURL=projection-checkpoint-manager.d.ts.map