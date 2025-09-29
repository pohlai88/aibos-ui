import { z } from 'zod';
/**
 * Idempotency key for ensuring operations are only executed once
 */
export declare class IdempotencyKey {
    readonly key: string;
    readonly requestId: string;
    readonly responseData?: Record<string, unknown>;
    readonly createdAt: Date;
    readonly expiresAt: Date;
    constructor(key: string, requestId: string, ttlMinutes?: number, responseData?: Record<string, unknown>);
    /**
     * Check if the key has expired
     */
    isExpired(): boolean;
    /**
     * Get time until expiration in milliseconds
     */
    getTimeUntilExpiration(): number;
    /**
     * Serialize for storage
     */
    serialize(): Record<string, unknown>;
    /**
     * Deserialize from storage
     */
    static deserialize(data: Record<string, unknown>): IdempotencyKey;
}
/**
 * Schema for idempotency key validation
 */
export declare const IdempotencyKeySchema: z.ZodObject<{
    key: z.ZodString;
    requestId: z.ZodString;
    responseData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodDate;
    expiresAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    key: string;
    requestId: string;
    createdAt: Date;
    expiresAt: Date;
    responseData?: Record<string, unknown> | undefined;
}, {
    key: string;
    requestId: string;
    createdAt: Date;
    expiresAt: Date;
    responseData?: Record<string, unknown> | undefined;
}>;
export type IdempotencyKeyData = z.infer<typeof IdempotencyKeySchema>;
/**
 * Idempotency key generator
 */
export declare class IdempotencyKeyGenerator {
    /**
     * Generate a key from request data
     */
    static generate(method: string, path: string, body?: Record<string, unknown>, headers?: Record<string, string>): string;
    /**
     * Generate a key for a specific operation
     */
    static generateForOperation(operation: string, tenantId: string, resourceId?: string): string;
    /**
     * Hash an object to create a consistent key
     */
    private static hashObject;
}
//# sourceMappingURL=idempotency-key.d.ts.map