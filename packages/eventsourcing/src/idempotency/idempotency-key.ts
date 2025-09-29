import { z } from 'zod';

/**
 * Idempotency key for ensuring operations are only executed once
 */
export class IdempotencyKey {
  public readonly key: string;
  public readonly requestId: string;
  public readonly responseData?: Record<string, unknown>;
  public readonly createdAt: Date;
  public readonly expiresAt: Date;

  constructor(
    key: string,
    requestId: string,
    ttlMinutes: number = 60,
    responseData?: Record<string, unknown>,
  ) {
    this.key = key;
    this.requestId = requestId;
    if (responseData !== undefined) {
      this.responseData = responseData;
    }
    this.createdAt = new Date();
    this.expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  }

  /**
   * Check if the key has expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Get time until expiration in milliseconds
   */
  getTimeUntilExpiration(): number {
    return this.expiresAt.getTime() - Date.now();
  }

  /**
   * Serialize for storage
   */
  serialize(): Record<string, unknown> {
    return {
      key: this.key,
      requestId: this.requestId,
      responseData: this.responseData,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
    };
  }

  /**
   * Deserialize from storage
   */
  static deserialize(data: Record<string, unknown>): IdempotencyKey {
    const key = new IdempotencyKey(
      data.key as string,
      data.requestId as string,
      0, // TTL not needed for deserialization
      data.responseData as Record<string, unknown> | undefined,
    );

    (key as unknown as { createdAt: Date; expiresAt: Date }).createdAt = new Date(
      data.createdAt as string,
    );
    (key as unknown as { createdAt: Date; expiresAt: Date }).expiresAt = new Date(
      data.expiresAt as string,
    );

    return key;
  }
}

/**
 * Schema for idempotency key validation
 */
export const IdempotencyKeySchema = z.object({
  key: z.string().min(1),
  requestId: z.string().uuid(),
  responseData: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  expiresAt: z.date(),
});

export type IdempotencyKeyData = z.infer<typeof IdempotencyKeySchema>;

/**
 * Idempotency key generator
 */
export class IdempotencyKeyGenerator {
  /**
   * Generate a key from request data
   */
  static generate(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): string {
    const data = {
      method: method.toUpperCase(),
      path,
      body: body ? JSON.stringify(body, Object.keys(body).sort()) : undefined,
      idempotencyKey: headers?.['idempotency-key'],
    };

    const hash = this.hashObject(data);
    return `idempotency:${hash}`;
  }

  /**
   * Generate a key for a specific operation
   */
  static generateForOperation(operation: string, tenantId: string, resourceId?: string): string {
    const data = {
      operation,
      tenantId,
      resourceId,
    };

    const hash = this.hashObject(data);
    return `operation:${operation}:${tenantId}:${hash}`;
  }

  /**
   * Hash an object to create a consistent key
   */
  private static hashObject(object: Record<string, unknown>): string {
    const string_ = JSON.stringify(object, Object.keys(object).sort());
    return btoa(string_).replaceAll(/[+/=]/g, '');
  }
}
