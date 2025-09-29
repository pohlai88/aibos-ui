import { IdempotencyKey } from './idempotency-key';
/**
 * Middleware for handling idempotency in event sourcing
 * Ensures that duplicate requests are handled gracefully
 */
export declare class IdempotencyMiddleware {
    private idempotencyKeys;
    /**
     * Check if a request is idempotent
     * @param requestId - Unique identifier for the request
     * @returns Promise<IdempotencyKey | null> - Returns existing key if found, null otherwise
     */
    checkIdempotency(requestId: string): Promise<IdempotencyKey | null>;
    /**
     * Create a new idempotency key for a request
     * @param requestId - Unique identifier for the request
     * @param ttlMinutes - Time to live in minutes
     * @param responseData - Optional response data to cache
     * @returns Promise<IdempotencyKey> - The created idempotency key
     */
    createIdempotencyKey(requestId: string, ttlMinutes?: number, // 1 hour default
    responseData?: Record<string, unknown>): Promise<IdempotencyKey>;
    /**
     * Update an existing idempotency key with response data
     * @param requestId - Unique identifier for the request
     * @param responseData - Response data to cache
     * @returns Promise<boolean> - True if key was updated, false if not found
     */
    updateIdempotencyKey(requestId: string, responseData: Record<string, unknown>): Promise<boolean>;
    /**
     * Remove an idempotency key
     * @param requestId - Unique identifier for the request
     * @returns Promise<boolean> - True if key was removed, false if not found
     */
    removeIdempotencyKey(requestId: string): Promise<boolean>;
    /**
     * Clean up expired idempotency keys
     * @returns Promise<number> - Number of keys cleaned up
     */
    cleanupExpiredKeys(): Promise<number>;
    /**
     * Get all active idempotency keys
     * @returns Promise<IdempotencyKey[]> - Array of active keys
     */
    getActiveKeys(): Promise<IdempotencyKey[]>;
    /**
     * Get statistics about idempotency keys
     * @returns Promise<{total: number, active: number, expired: number}> - Key statistics
     */
    getStatistics(): Promise<{
        total: number;
        active: number;
        expired: number;
    }>;
    /**
     * Clear all idempotency keys
     * @returns Promise<void>
     */
    clearAll(): Promise<void>;
}
/**
 * Factory function to create an idempotency middleware instance
 * @returns IdempotencyMiddleware - New middleware instance
 */
export declare function createIdempotencyMiddleware(): IdempotencyMiddleware;
/**
 * Decorator for making methods idempotent
 * @param requestIdExtractor - Function to extract request ID from method arguments
 * @returns Method decorator
 */
export declare function Idempotent(requestIdExtractor: (...args: unknown[]) => string): (_target: unknown, _propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=idempotency-middleware.d.ts.map