// events/common.ts

import { isNonEmpty } from '../utils';

/** Assert aggregateId follows a tenant-scoped naming convention. */
export function assertAggregateMatchesTenant(
  aggregateId: string,
  tenantId: string,
  options?: { prefix?: string },
): void {
  const prefix = options?.prefix ?? 'chart-of-accounts-';
  if (typeof aggregateId !== 'string' || !isNonEmpty(aggregateId)) {
    throw new TypeError('aggregateId must be a non-empty string');
  }
  if (typeof tenantId !== 'string' || !isNonEmpty(tenantId)) {
    throw new TypeError('tenantId must be a non-empty string');
  }
  const expected = `${prefix}${tenantId.trim()}`;
  if (aggregateId.trim() !== expected) {
    throw new TypeError(`aggregateId "${aggregateId}" does not match expected "${expected}"`);
  }
}

/**
 * Safe Money-from-cents shim:
 * - Uses Money.fromCents if it exists (preferred, lossless)
 * - Else falls back to Money.fromNumber(Number(cents)/100) without throwing
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function moneyFromCentsShim(MoneyClass: any, cents: bigint): any {
  if (MoneyClass && typeof MoneyClass.fromCents === 'function') {
    return MoneyClass.fromCents(cents);
  }
  if (MoneyClass && typeof MoneyClass.fromNumber === 'function') {
    // Avoid floating errors by dividing late; callers keep cents in serialization anyway.
    const n = Number(cents) / 100;
    return MoneyClass.fromNumber(n);
  }
  throw new TypeError('Money class lacks fromCents/fromNumber constructors');
}
