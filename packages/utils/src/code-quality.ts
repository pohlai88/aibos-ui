/**
 * Code Quality Utilities
 *
 * Provides utilities to resolve common code quality issues:
 * - Null vs undefined handling
 * - Duplicate string management
 * - Collection management
 * - Object injection prevention
 */

import { createDict, safeGet, safeSet, isSafeKey } from './safe-object';

// ---------- Null vs Undefined Handling ----------

/**
 * Policy: Use undefined for omitted/absent values, null for intentionally empty values
 * This utility helps convert between the two based on context
 */

/**
 * Converts null to undefined for internal code consistency
 * @param value - Value that might be null
 * @returns undefined if value is null, otherwise the original value
 */
export const nullToUndefined = <T>(value: T | null): T | undefined =>
  value === null ? undefined : value;

/**
 * Converts undefined to null for DTO/DB/JSON serialization
 * @param value - Value that might be undefined
 * @returns null if value is undefined, otherwise the original value
 */
export const undefinedToNull = <T>(value: T | undefined): T | null =>
  value === undefined ? null : value;

/**
 * Safe nullish coalescing that handles both null and undefined
 * @param value - The value to check
 * @param fallback - The fallback value
 * @returns The value if it's not nullish, otherwise the fallback
 */
export const safeCoalesce = <T>(value: T | null | undefined, fallback: T): T => value ?? fallback;

// ---------- Duplicate String Management ----------

/**
 * String constants registry to prevent duplicate strings
 * Use this for commonly repeated strings to improve maintainability
 */
class StringRegistry {
  private readonly registry = createDict<string>();
  private readonly reverseRegistry = createDict<string>();

  /**
   * Registers a string constant and returns a reference
   * @param key - The key for the string
   * @param value - The string value
   * @returns The registered string
   */
  register(key: string, value: string): string {
    if (!isSafeKey(key)) {
      throw new Error(`Invalid string registry key: ${key}`);
    }

    const existing = safeGet(this.registry, key);
    if (existing && existing !== value) {
      throw new Error(`String registry key '${key}' already exists with different value`);
    }

    safeSet(this.registry, key, value);
    safeSet(this.reverseRegistry, value, key);
    return value;
  }

  /**
   * Gets a registered string by key
   * @param key - The key to look up
   * @returns The registered string or undefined if not found
   */
  get(key: string): string | undefined {
    return safeGet(this.registry, key);
  }

  /**
   * Gets the key for a registered string value
   * @param value - The string value to look up
   * @returns The key or undefined if not found
   */
  getKey(value: string): string | undefined {
    return safeGet(this.reverseRegistry, value);
  }

  /**
   * Checks if a string is already registered
   * @param value - The string to check
   * @returns true if the string is registered
   */
  isRegistered(value: string): boolean {
    return safeGet(this.reverseRegistry, value) !== undefined;
  }

  /**
   * Gets all registered strings
   * @returns Array of all registered string values
   */
  getAllValues(): string[] {
    return Object.values(this.registry);
  }
}

// Global string registry instance
export const stringRegistry = new StringRegistry();

/**
 * Creates a string constant to prevent duplication
 * @param key - The key for the string constant
 * @param value - The string value
 * @returns The string constant
 */
export const createStringConstant = (key: string, value: string): string =>
  stringRegistry.register(key, value);

/**
 * Gets a string constant by key
 * @param key - The key to look up
 * @returns The string constant or undefined if not found
 */
export const getStringConstant = (key: string): string | undefined => stringRegistry.get(key);

// ---------- Collection Management ----------

/**
 * Safe collection utilities to prevent unused collections
 */

/**
 * Creates a safe array that can be checked for usage
 */
export class SafeArray<T> {
  private readonly items: T[] = [];
  private accessed = false;
  private modified = false;

  /**
   * Adds an item to the array
   * @param item - The item to add
   */
  add(item: T): void {
    this.items.push(item);
    this.modified = true;
  }

  /**
   * Gets all items from the array
   * @returns Array of all items
   */
  getAll(): T[] {
    this.accessed = true;
    return [...this.items];
  }

  /**
   * Gets the length of the array
   * @returns The number of items
   */
  get length(): number {
    this.accessed = true;
    return this.items.length;
  }

  /**
   * Checks if the array has been accessed
   * @returns true if the array has been accessed
   */
  hasBeenAccessed(): boolean {
    return this.accessed;
  }

  /**
   * Checks if the array has been modified
   * @returns true if the array has been modified
   */
  hasBeenModified(): boolean {
    return this.modified;
  }

  /**
   * Checks if the array is empty
   * @returns true if the array is empty
   */
  isEmpty(): boolean {
    this.accessed = true;
    return this.items.length === 0;
  }

  /**
   * Clears the array
   */
  clear(): void {
    this.items.length = 0;
    this.modified = true;
  }
}

/**
 * Creates a safe array
 * @returns A new SafeArray instance
 */
export const createSafeArray = <T>(): SafeArray<T> => new SafeArray<T>();

/**
 * Creates a safe set that can be checked for usage
 */
export class SafeSet<T> {
  private readonly items = new Set<T>();
  private accessed = false;
  private modified = false;

  /**
   * Adds an item to the set
   * @param item - The item to add
   */
  add(item: T): void {
    this.items.add(item);
    this.modified = true;
  }

  /**
   * Checks if an item exists in the set
   * @param item - The item to check
   * @returns true if the item exists
   */
  has(item: T): boolean {
    this.accessed = true;
    return this.items.has(item);
  }

  /**
   * Removes an item from the set
   * @param item - The item to remove
   * @returns true if the item was removed
   */
  delete(item: T): boolean {
    this.modified = true;
    return this.items.delete(item);
  }

  /**
   * Gets all items from the set
   * @returns Array of all items
   */
  getAll(): T[] {
    this.accessed = true;
    return Array.from(this.items);
  }

  /**
   * Gets the size of the set
   * @returns The number of items
   */
  get size(): number {
    this.accessed = true;
    return this.items.size;
  }

  /**
   * Checks if the set has been accessed
   * @returns true if the set has been accessed
   */
  hasBeenAccessed(): boolean {
    return this.accessed;
  }

  /**
   * Checks if the set has been modified
   * @returns true if the set has been modified
   */
  hasBeenModified(): boolean {
    return this.modified;
  }

  /**
   * Checks if the set is empty
   * @returns true if the set is empty
   */
  isEmpty(): boolean {
    this.accessed = true;
    return this.items.size === 0;
  }

  /**
   * Clears the set
   */
  clear(): void {
    this.items.clear();
    this.modified = true;
  }
}

/**
 * Creates a safe set
 * @returns A new SafeSet instance
 */
export const createSafeSet = <T>(): SafeSet<T> => new SafeSet<T>();

// ---------- Object Injection Prevention ----------

/**
 * Safe object builder that prevents object injection
 */
export class SafeObjectBuilder<T extends Record<string, unknown>> {
  private readonly data = createDict<unknown>();
  private readonly allowedKeys: Set<string>;

  constructor(allowedKeys: string[] = []) {
    this.allowedKeys = new Set(allowedKeys);
  }

  /**
   * Adds a property to the object
   * @param key - The property key
   * @param value - The property value
   * @returns The builder instance for chaining
   */
  set<K extends string>(key: K, value: unknown): SafeObjectBuilder<T & Record<K, unknown>> {
    if (!isSafeKey(key)) {
      throw new Error(`Invalid object key: ${key}`);
    }

    if (this.allowedKeys.size > 0 && !this.allowedKeys.has(key)) {
      throw new Error(`Key '${key}' is not in the allowed keys list`);
    }

    safeSet(this.data, key, value);
    return this as SafeObjectBuilder<T & Record<K, unknown>>;
  }

  /**
   * Builds the final object
   * @returns The built object
   */
  build(): T {
    return this.data as T;
  }

  /**
   * Gets a property value
   * @param key - The property key
   * @returns The property value or undefined
   */
  get<K extends string>(key: K): unknown {
    return safeGet(this.data, key);
  }

  /**
   * Checks if a property exists
   * @param key - The property key
   * @returns true if the property exists
   */
  has<K extends string>(key: K): boolean {
    return safeGet(this.data, key) !== undefined;
  }
}

/**
 * Creates a safe object builder
 * @param allowedKeys - Optional array of allowed keys
 * @returns A new SafeObjectBuilder instance
 */
export const createSafeObjectBuilder = <T extends Record<string, unknown>>(
  allowedKeys?: string[],
): SafeObjectBuilder<T> => new SafeObjectBuilder<T>(allowedKeys);

// ---------- Common String Constants ----------

// Register common strings to prevent duplication
export const COMMON_STRINGS = {
  EMPTY: createStringConstant('EMPTY', ''),
  SPACE: createStringConstant('SPACE', ' '),
  NEWLINE: createStringConstant('NEWLINE', '\n'),
  TAB: createStringConstant('TAB', '\t'),
  COMMA: createStringConstant('COMMA', ','),
  DOT: createStringConstant('DOT', '.'),
  SLASH: createStringConstant('SLASH', '/'),
  BACKSLASH: createStringConstant('BACKSLASH', '\\'),
  COLON: createStringConstant('COLON', ':'),
  SEMICOLON: createStringConstant('SEMICOLON', ';'),
  EQUALS: createStringConstant('EQUALS', '='),
  QUESTION: createStringConstant('QUESTION', '?'),
  EXCLAMATION: createStringConstant('EXCLAMATION', '!'),
  AMPERSAND: createStringConstant('AMPERSAND', '&'),
  PIPE: createStringConstant('PIPE', '|'),
  PLUS: createStringConstant('PLUS', '+'),
  MINUS: createStringConstant('MINUS', '-'),
  ASTERISK: createStringConstant('ASTERISK', '*'),
  UNDERSCORE: createStringConstant('UNDERSCORE', '_'),
  HYPHEN: createStringConstant('HYPHEN', '-'),
} as const;

// ---------- Utility Functions ----------

/**
 * Checks if a value is null or undefined
 * @param value - The value to check
 * @returns true if the value is null or undefined
 */
export const isNullish = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

/**
 * Checks if a value is not null or undefined
 * @param value - The value to check
 * @returns true if the value is not null or undefined
 */
export const isNotNullish = (value: unknown): boolean => value !== null && value !== undefined;

/**
 * Safely converts a value to a string
 * @param value - The value to convert
 * @returns The string representation or empty string if nullish
 */
export const safeToString = (value: unknown): string => {
  if (value === null) return COMMON_STRINGS.EMPTY;
  if (value === undefined) return COMMON_STRINGS.EMPTY;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return COMMON_STRINGS.EMPTY;
};

/**
 * Creates a safe counter for tracking occurrences
 * @returns A new safe counter
 */
export const createSafeCounter = (): Map<string, number> => new Map<string, number>();

/**
 * Safely increments a counter
 * @param counter - The counter map
 * @param key - The key to increment
 * @returns The new count value
 */
export const safeIncrement = (counter: Map<string, number>, key: string): number => {
  if (!isSafeKey(key)) {
    throw new Error(`Invalid counter key: ${key}`);
  }

  const current = counter.get(key) ?? 0;
  const newValue = current + 1;
  counter.set(key, newValue);
  return newValue;
};

/**
 * Safely gets a counter value
 * @param counter - The counter map
 * @param key - The key to get
 * @returns The count value or 0 if not found
 */
export const safeGetCount = (counter: Map<string, number>, key: string): number => {
  if (!isSafeKey(key)) {
    throw new Error(`Invalid counter key: ${key}`);
  }

  return counter.get(key) ?? 0;
};
