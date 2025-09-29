import { IdempotencyKey } from './idempotency-key';

/**
 * Middleware for handling idempotency in event sourcing
 * Ensures that duplicate requests are handled gracefully
 */
export class IdempotencyMiddleware {
  private idempotencyKeys: Map<string, IdempotencyKey> = new Map();

  /**
   * Check if a request is idempotent
   * @param requestId - Unique identifier for the request
   * @returns Promise<IdempotencyKey | null> - Returns existing key if found, null otherwise
   */
  async checkIdempotency(requestId: string): Promise<IdempotencyKey | null> {
    const key = this.idempotencyKeys.get(requestId);

    if (key && !key.isExpired()) {
      return key;
    }

    return null;
  }

  /**
   * Create a new idempotency key for a request
   * @param requestId - Unique identifier for the request
   * @param ttlMinutes - Time to live in minutes
   * @param responseData - Optional response data to cache
   * @returns Promise<IdempotencyKey> - The created idempotency key
   */
  async createIdempotencyKey(
    requestId: string,
    ttlMinutes: number = 60, // 1 hour default
    responseData?: Record<string, unknown>,
  ): Promise<IdempotencyKey> {
    const key = new IdempotencyKey(requestId, requestId, ttlMinutes, responseData);
    this.idempotencyKeys.set(requestId, key);
    return key;
  }

  /**
   * Update an existing idempotency key with response data
   * @param requestId - Unique identifier for the request
   * @param responseData - Response data to cache
   * @returns Promise<boolean> - True if key was updated, false if not found
   */
  async updateIdempotencyKey(
    requestId: string,
    responseData: Record<string, unknown>,
  ): Promise<boolean> {
    const existingKey = this.idempotencyKeys.get(requestId);

    if (existingKey) {
      // Create a new key with updated response data
      const updatedKey = new IdempotencyKey(
        existingKey.key,
        existingKey.requestId,
        existingKey.getTimeUntilExpiration() / (60 * 1000), // Convert to minutes
        responseData,
      );
      this.idempotencyKeys.set(requestId, updatedKey);
      return true;
    }

    return false;
  }

  /**
   * Remove an idempotency key
   * @param requestId - Unique identifier for the request
   * @returns Promise<boolean> - True if key was removed, false if not found
   */
  async removeIdempotencyKey(requestId: string): Promise<boolean> {
    return this.idempotencyKeys.delete(requestId);
  }

  /**
   * Clean up expired idempotency keys
   * @returns Promise<number> - Number of keys cleaned up
   */
  async cleanupExpiredKeys(): Promise<number> {
    let cleanedCount = 0;

    for (const [requestId, key] of this.idempotencyKeys.entries()) {
      if (key.isExpired()) {
        this.idempotencyKeys.delete(requestId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Get all active idempotency keys
   * @returns Promise<IdempotencyKey[]> - Array of active keys
   */
  async getActiveKeys(): Promise<IdempotencyKey[]> {
    const activeKeys: IdempotencyKey[] = [];

    for (const key of this.idempotencyKeys.values()) {
      if (!key.isExpired()) {
        activeKeys.push(key);
      }
    }

    return activeKeys;
  }

  /**
   * Get statistics about idempotency keys
   * @returns Promise<{total: number, active: number, expired: number}> - Key statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
  }> {
    let active = 0;
    let expired = 0;

    for (const key of this.idempotencyKeys.values()) {
      if (key.isExpired()) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.idempotencyKeys.size,
      active,
      expired,
    };
  }

  /**
   * Clear all idempotency keys
   * @returns Promise<void>
   */
  async clearAll(): Promise<void> {
    this.idempotencyKeys.clear();
  }
}

/**
 * Factory function to create an idempotency middleware instance
 * @returns IdempotencyMiddleware - New middleware instance
 */
export function createIdempotencyMiddleware(): IdempotencyMiddleware {
  return new IdempotencyMiddleware();
}

/**
 * Decorator for making methods idempotent
 * @param requestIdExtractor - Function to extract request ID from method arguments
 * @returns Method decorator
 */
export function Idempotent(requestIdExtractor: (...args: unknown[]) => string) {
  return function (
    _target: unknown,
    _propertyName: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const method = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const requestId = requestIdExtractor(...args);
      const middleware = new IdempotencyMiddleware();

      // Check if request is already processed
      const existingKey = await middleware.checkIdempotency(requestId);
      if (existingKey && existingKey.responseData) {
        return existingKey.responseData;
      }

      // Create new idempotency key
      await middleware.createIdempotencyKey(requestId);

      try {
        // Execute the original method
        const result = await method.apply(this, args);

        // Update key with response data
        await middleware.updateIdempotencyKey(requestId, result);

        return result;
      } catch (error) {
        // Remove key on error
        await middleware.removeIdempotencyKey(requestId);
        throw error;
      }
    };

    return descriptor;
  };
}
