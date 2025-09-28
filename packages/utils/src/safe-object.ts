/**
 * Safe Object Utilities - Security-First Object Manipulation
 *
 * Provides secure alternatives to direct object property access
 * to prevent object injection attacks and prototype pollution.
 */

/**
 * Safe object helpers to avoid prototype pollution / object injection sinks.
 * Always prefer Map for dynamic keys; when plain objects are required,
 * use a null-prototype dictionary.
 */
export const hasOwn = (object: object, key: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(object, key);

export const createDict = <T extends unknown>(): Record<string, T> =>
  Object.create(null) as Record<string, T>;

/**
 * Validates that a key is safe for object access
 * Allows alphanumeric, underscore, colon, hyphen, max 64 chars
 */
export const isSafeKey = (key: string): boolean => /^[a-z0-9:_-]{1,64}$/i.test(key);

/**
 * Safe get function for dynamic object access with key validation
 * @param dict - The dictionary (Record or Map) to access
 * @param key - The key to access
 * @returns The value if key is safe and exists, undefined otherwise
 */
export function safeGet<T>(dict: Record<string, T> | Map<string, T>, key: string): T | undefined {
  if (!isSafeKey(key)) return undefined;
  if (dict instanceof Map) return dict.get(key);
  // eslint-disable-next-line security/detect-object-injection -- safe: key validated by isSafeKey and dict is null-prototype
  return hasOwn(dict, key) ? dict[key] : undefined;
}

/**
 * Safe set function for dynamic object assignment with key validation
 * @param dict - The dictionary (Record or Map) to modify
 * @param key - The key to set
 * @param value - The value to set
 */
export function safeSet<T>(dict: Record<string, T> | Map<string, T>, key: string, value: T): void {
  if (!isSafeKey(key)) return;
  if (dict instanceof Map) {
    dict.set(key, value);
  } else {
    // eslint-disable-next-line security/detect-object-injection -- safe: key validated by isSafeKey and dict is null-prototype
    dict[key] = value; // dict must come from createDict()
  }
}

export type Whitelist = Record<string, true>;

/**
 * Asserts that a key is allowed in the whitelist
 */
export function assertAllowed(key: string, allowed: Whitelist, label = 'key'): string {
  if (!Object.prototype.hasOwnProperty.call(allowed, key)) {
    throw new Error(`Invalid ${label}: ${key}`);
  }
  return key;
}

/**
 * Safely sets a property on an object using whitelist validation
 */
export function setIfAllowed<T extends Record<string, unknown>>(
  object: T,
  key: string,
  value: unknown,
  allowed: Whitelist,
  label = 'key',
): void {
  const k = assertAllowed(key, allowed, label);
  // Use Object.assign to avoid prototype mutations
  Object.assign(object, { [k]: value });
}

/**
 * Safely gets a property from an object using whitelist validation
 */
export function getIfAllowed<T extends Record<string, unknown>, R = unknown>(
  object: T,
  key: string,
  allowed: Whitelist,
  label = 'key',
): R {
  const k = assertAllowed(key, allowed, label);
  // eslint-disable-next-line security/detect-object-injection -- safe: key validated by assertAllowed whitelist
  return object[k] as R;
}

/**
 * Creates a safe counter map for dynamic keys
 */
export function createSafeCounter(): Map<string, number> {
  return new Map<string, number>();
}

/**
 * Safely increments a counter in a Map
 */
export function incrementCounter(counter: Map<string, number>, key: string): number {
  const current = counter.get(key) ?? 0;
  const newValue = current + 1;
  counter.set(key, newValue);
  return newValue;
}

/**
 * Safely gets a counter value from a Map
 */
export function getCounter(counter: Map<string, number>, key: string): number {
  return counter.get(key) ?? 0;
}
