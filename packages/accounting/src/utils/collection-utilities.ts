/**
 * Collection & Array Utilities - Phase 1 Implementation
 * 
 * Provides enterprise-grade array and collection operations for accounting.
 * Built to handle common patterns found across the codebase.
 * 
 * Features:
 * - Type-safe operations with full TypeScript support
 * - Immutable operations (no side effects)
 * - Comprehensive error handling
 * - Performance optimized for large datasets
 * - Accounting-specific collection operations
 */

import { addMonthsToDate, isDateInRange } from './index';
import { createValidationError } from './error-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SortDirection = 'asc' | 'desc';

// Internal: robust comparator for numbers | strings | Dates (locale-aware for strings)
type Comparable = string | number | Date | boolean | null | undefined;
type FieldType = 'string' | 'number' | 'date' | 'boolean';
export interface CompareOptions {
  direction?: SortDirection;
  locale?: string | undefined; // e.g. 'en', 'vi', 'ms'
  localeOptions?: Intl.CollatorOptions; // { sensitivity: 'base', numeric: true } etc.
}
function compareValues(a: Comparable, b: Comparable, options: CompareOptions = {}): number {
  const dir = options.direction === 'desc' ? -1 : 1;
  // Normalize Dates
  if (a instanceof Date) a = a.valueOf();
  if (b instanceof Date) b = b.valueOf();
  // Handle undefined/null last
  const aU = a == null, bU = b == null;
  if (aU && bU) return 0;
  if (aU) return 1 * dir;
  if (bU) return -1 * dir;
  // Strings: localeCompare with numeric if requested
  if (typeof a === 'string' && typeof b === 'string') {
    return (a.localeCompare(b, options.locale, options.localeOptions)) * dir;
  }
  // Booleans -> numbers
  if (typeof a === 'boolean') a = a ? 1 : 0;
  if (typeof b === 'boolean') b = b ? 1 : 0;
  // Numbers fallback (including coerced dates/booleans)
  if ((a as number) < (b as number)) return -1 * dir;
  if ((a as number) > (b as number)) return  1 * dir;
  return 0;
}

// Stable sort utility (Schwartzian transform: index tiebreaker)
function stableSort<T>(array: T[], cmp: (a: T, b: T) => number): T[] {
  return array.map((v, index) => [v, index] as const)
           .sort((x, y) => cmp(x[0], y[0]) || (x[1] - y[1]))
           .map(([v]) => v);
}

export interface SortKey<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface GroupByResult<T, K extends string | number> {
  groups: Record<K, T[]>;
  keys: K[];
  counts: Record<K, number>;
}

export interface PartitionResult<T> {
  left: T[];
  right: T[];
}

export interface ChunkResult<T> {
  chunks: T[][];
  remainder: T[];
  totalChunks: number;
}

// ============================================================================
// FILTERING UTILITIES
// ============================================================================

/**
 * Filter out null and undefined values from an array
 * 
 * @param array - Array containing potentially null/undefined values
 * @returns Array with only non-null values
 * 
 * @example
 * ```typescript
 * filterNonNull([1, null, 2, undefined, 3]); // [1, 2, 3]
 * ```
 */
export function filterNonNull<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((item): item is T => item != null);
}

/**
 * Filter out empty values (null, undefined, empty string, empty array)
 * 
 * @param array - Array to filter
 * @returns Array with only non-empty values
 * 
 * @example
 * ```typescript
 * filterEmpty(['hello', '', null, 'world', []]); // ['hello', 'world']
 * ```
 */
export function filterEmpty<T>(array: T[]): T[] {
  return array.filter(item => {
    if (item == null) return false;
    if (typeof item === 'string') {
      return item.trim().length > 0; // treat whitespace-only as empty
    }
    if (Array.isArray(item)) return hasItems(item);
    if (typeof item === 'object') return Object.keys(item).length > 0;
    return true;
  });
}

/**
 * Filter array by a specific property value
 * 
 * @param array - Array to filter
 * @param property - Property name to check
 * @param value - Value to match
 * @returns Filtered array
 * 
 * @example
 * ```typescript
 * filterByProperty(accounts, 'isActive', true);
 * ```
 */
export function filterByProperty<T, K extends keyof T>(
  array: T[],
  property: K,
  value: T[K]
): T[] {
  return array.filter(item => item[property] === value);
}

/**
 * Filter array by a predicate function
 * 
 * @param array - Array to filter
 * @param predicate - Function that returns true for items to keep
 * @returns Filtered array
 * 
 * @example
 * ```typescript
 * filterByPredicate(transactions, t => t.amount > 1000);
 * ```
 */
export function filterByPredicate<T>(
  array: T[],
  predicate: (item: T) => boolean
): T[] {
  return array.filter(predicate);
}

/**
 * Filter array by multiple conditions (AND logic)
 * 
 * @param array - Array to filter
 * @param predicates - Array of predicate functions
 * @returns Filtered array
 * 
 * @example
 * ```typescript
 * filterByMultiple(accounts, [
 *   acc => acc.isActive,
 *   acc => acc.balance > 0
 * ]);
 * ```
 */
export function filterByMultiple<T>(
  array: T[], 
  predicates: Array<(item: T) => boolean>
): T[] {
  return array.filter(item => predicates.every(predicate => predicate(item)));
}

// ============================================================================
// GROUPING UTILITIES
// ============================================================================

/**
 * Group array items by a key function
 * 
 * @param array - Array to group
 * @param keyFn - Function that returns the grouping key
 * @returns Grouped result with groups, keys, and counts
 * 
 * @example
 * ```typescript
 * groupBy(transactions, t => t.accountType);
 * ```
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFunction: (item: T) => K
): GroupByResult<T, K> {
  const groups: Record<K, T[]> = {} as Record<K, T[]>;
  const counts: Record<K, number> = {} as Record<K, number>;
  const keysInOrder: K[] = [];

  for (const item of array) {
    const key = keyFunction(item);
    if (!(key in groups)) {
      groups[key] = [];
      counts[key] = 0;
      keysInOrder.push(key);
    }
    groups[key]!.push(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return { groups, keys: keysInOrder, counts };
}

/**
 * Group array items by a specific property
 * 
 * @param array - Array to group
 * @param property - Property name to group by
 * @returns Grouped result
 * 
 * @example
 * ```typescript
 * groupByProperty(accounts, 'accountType');
 * ```
 */
export function groupByProperty<T, K extends keyof T>(
  array: T[],
  property: K
): GroupByResult<T, string> {
  return groupBy(array, item => String(item[property]));
}

/**
 * Group array items by multiple properties
 * 
 * @param array - Array to group
 * @param properties - Array of property names
 * @returns Grouped result with composite keys
 * 
 * @example
 * ```typescript
 * groupByMultiple(transactions, ['accountType', 'currency']);
 * ```
 */
export function groupByMultiple<T>(
  array: T[], 
  properties: Array<keyof T>
): GroupByResult<T, string> {
  // Use a low-likelihood separator and escape it to avoid key collisions.
  const SEP = '\u001F'; // Unit Separator
  const ESC = (s: string) => s.replaceAll(SEP, `${SEP}${SEP}`);
  return groupBy(array, item => {
    const parts = properties.map(property => ESC(String(item[property])));
    return parts.join(SEP);
  });
}

// ============================================================================
// UNIQUENESS UTILITIES
// ============================================================================

/**
 * Remove duplicate values from an array
 * 
 * @param array - Array to deduplicate
 * @returns Array with unique values
 * 
 * @example
 * ```typescript
 * unique([1, 2, 2, 3, 3, 3]); // [1, 2, 3]
 * ```
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Remove duplicates based on a specific property
 * 
 * @param array - Array to deduplicate
 * @param property - Property to check for uniqueness
 * @returns Array with unique items based on property
 * 
 * @example
 * ```typescript
 * uniqueBy(accounts, 'accountCode');
 * ```
 */
export function uniqueBy<T, K extends keyof T>(
  array: T[],
  property: K
): T[] {
  const seen = new Set<T[K]>();
  return array.filter(item => {
    const value = item[property];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Remove duplicates based on a key function
 * 
 * @param array - Array to deduplicate
 * @param keyFn - Function that returns the uniqueness key
 * @returns Array with unique items
 * 
 * @example
 * ```typescript
 * uniqueByKey(transactions, t => `${t.accountCode}-${t.date}`);
 * ```
 */
export function uniqueByKey<T, K>(
  array: T[], 
  keyFunction: (item: T) => K
): T[] {
  const seen = new Set<K>();
  return array.filter(item => {
    const key = keyFunction(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Find duplicate values in an array
 * 
 * @param array - Array to check
 * @returns Array of duplicate values
 * 
 * @example
 * ```typescript
 * findDuplicates([1, 2, 2, 3, 3, 3]); // [2, 3]
 * ```
 */
export function findDuplicates<T>(array: T[]): T[] {
  const counts = new Map<T, number>();
  const duplicates: T[] = [];
  
  for (const item of array) {
    const count = counts.get(item) || 0;
    counts.set(item, count + 1);
    if (count === 1) {
      duplicates.push(item);
    }
  }
  
  return duplicates;
}

/**
 * Remove all duplicate values (keep none of the duplicates)
 * 
 * @param array - Array to process
 * @returns Array with duplicates completely removed
 * 
 * @example
 * ```typescript
 * removeDuplicates([1, 2, 2, 3, 3, 3]); // [1]
 * ```
 */
export function removeDuplicates<T>(array: T[]): T[] {
  const counts = new Map<T, number>();
  
  // Count occurrences
  for (const item of array) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  
  // Return only items that appear once
  return array.filter(item => counts.get(item) === 1);
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

/**
 * Sort array by a specific property
 * 
 * @param array - Array to sort
 * @param property - Property to sort by
 * @param direction - Sort direction (default: 'asc')
 * @returns Sorted array
 * 
 * @example
 * ```typescript
 * sortBy(accounts, 'accountCode', 'asc');
 * ```
 */
export function sortBy<T, K extends keyof T>(
  array: T[],
  property: K,
  direction: SortDirection = 'asc'
): T[] {
  const options: CompareOptions = {
    direction,
    locale: undefined,
    localeOptions: { numeric: true, sensitivity: 'base' },
  };
  return [...array].sort((a, b) =>
    compareValues(a[property] as Comparable, b[property] as Comparable, options)
  );
}

/**
 * Sort array by multiple properties
 * 
 * @param array - Array to sort
 * @param sortKeys - Array of sort configurations
 * @returns Sorted array
 * 
 * @example
 * ```typescript
 * sortByMultiple(transactions, [
 *   { key: 'date', direction: 'desc' },
 *   { key: 'amount', direction: 'asc' }
 * ]);
 * ```
 */
export function sortByMultiple<T>(
  array: T[],
  sortKeys: SortKey<T>[]
): T[] {
  const array_ = [...array];
  return array_.sort((a, b) => {
    for (const { key, direction } of sortKeys) {
      const cmp = compareValues(a[key] as Comparable, b[key] as Comparable, {
        direction,
        localeOptions: { numeric: true, sensitivity: 'base' },
      });
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

/**
 * Sort array by a custom comparison function
 * 
 * @param array - Array to sort
 * @param compareFn - Comparison function
 * @returns Sorted array
 * 
 * @example
 * ```typescript
 * sortByFunction(accounts, (a, b) => a.balance - b.balance);
 * ```
 */
export function sortByFunction<T>(
  array: T[], 
  compareFunction: (a: T, b: T) => number
): T[] {
  return [...array].sort(compareFunction);
}

// ============================================================================
// SCHEMA-AWARE COMPARATORS
// ============================================================================

export interface SchemaKey<T> {
  key: keyof T;
  type: FieldType;
  direction?: SortDirection;
  /** Where null/undefined go (default 'last') */
  nulls?: 'first' | 'last';
  /** String-only locale options */
  locale?: string;
  localeOptions?: Intl.CollatorOptions; // e.g. { numeric: true, sensitivity: 'base' }
  /** Optional transform hook BEFORE type coercion */
  transform?: (v: unknown) => unknown;
}

function coerceByType(v: unknown, type: FieldType): Comparable {
  if (v == null) return v;
  switch (type) {
    case 'string':  return String(v);
    case 'number':  return typeof v === 'number' ? v : (v === '' ? 0 : Number(v));
    case 'date':    return v instanceof Date ? v : (v && typeof v === 'string' ? new Date(v) : (v as Comparable));
    case 'boolean': return Boolean(v);
  }
}

function compareWithNulls(a: Comparable, b: Comparable, nulls: 'first'|'last', cmp: () => number): number {
  const aU = a == null, bU = b == null;
  if (aU && bU) return 0;
  if (aU) return nulls === 'first' ? -1 : 1;
  if (bU) return nulls === 'first' ?  1 : -1;
  return cmp();
}

export function buildFieldComparator<T>(spec: SchemaKey<T>): (a: T, b: T) => number {
  const dir = spec.direction ?? 'asc';
  const nulls = spec.nulls ?? 'last';
  const options: CompareOptions = {
    direction: dir,
    locale: spec.locale,
    localeOptions: spec.localeOptions ?? { numeric: true, sensitivity: 'base' },
  };
  return (a: T, b: T) => {
    const avRaw = (a as Record<string, unknown>)[spec.key as string];
    const bvRaw = (b as Record<string, unknown>)[spec.key as string];
    const avT = spec.transform ? spec.transform(avRaw) : avRaw;
    const bvT = spec.transform ? spec.transform(bvRaw) : bvRaw;
    const av = coerceByType(avT, spec.type);
    const bv = coerceByType(bvT, spec.type);
    return compareWithNulls(av, bv, nulls, () => compareValues(av, bv, options));
  };
}

export function buildSchemaComparator<T>(schema: SchemaKey<T>[]): (a: T, b: T) => number {
  const fns = schema.map(buildFieldComparator);
  return (a: T, b: T) => {
    for (const function_ of fns) {
      const r = function_(a, b);
      if (r !== 0) return r;
    }
    return 0;
  };
}

/**
 * Sort using a field schema (stable).
 * Example:
 * sortBySchema(rows, [
 *   { key: 'date', type: 'date', direction: 'desc', nulls: 'last' },
 *   { key: 'accountCode', type: 'string' },
 * ])
 */
export function sortBySchema<T>(array: T[], schema: SchemaKey<T>[]): T[] {
  const cmp = buildSchemaComparator(schema);
  return stableSort([...array], cmp);
}

// ============================================================================
// ARRAY MANIPULATION UTILITIES
// ============================================================================

/**
 * Split array into chunks of specified size
 * 
 * @param array - Array to chunk
 * @param size - Chunk size
 * @returns Chunk result with chunks, remainder, and total count
 * 
 * @example
 * ```typescript
 * chunk([1, 2, 3, 4, 5], 2); // { chunks: [[1, 2], [3, 4]], remainder: [5], totalChunks: 2 }
 * ```
 */
export function chunk<T>(array: T[], size: number): ChunkResult<T> {
  if (size <= 0) {
    throw createValidationError(
      'INVALID_CHUNK_SIZE',
      'Chunk size must be greater than 0',
      size.toString(),
      { operation: 'chunk-array' }
    );
  }
  
  const chunks: T[][] = [];
  const remainder: T[] = [];
  
  for (let index = 0; index < array.length; index += size) {
    const chunk = array.slice(index, index + size);
    if (chunk.length === size) {
      chunks.push(chunk);
    } else {
      remainder.push(...chunk);
    }
  }
  
  return {
    chunks,
    remainder,
    totalChunks: chunks.length
  };
}

/**
 * Flatten nested arrays
 * 
 * @param array - Array of arrays to flatten
 * @returns Flattened array
 * 
 * @example
 * ```typescript
 * flatten([[1, 2], [3, 4], [5]]); // [1, 2, 3, 4, 5]
 * ```
 */
export function flatten<T>(array: T[][]): T[] {
  return array.flat();
}

/**
 * Flatten deeply nested arrays
 * 
 * @param array - Array to flatten
 * @param depth - Maximum depth to flatten (default: Infinity)
 * @returns Flattened array
 * 
 * @example
 * ```typescript
 * flattenDeep([1, [2, [3, [4]]]]); // [1, 2, 3, 4]
 * ```
 */
export function flattenDeep<T>(array: unknown[], depth: number = Infinity): T[] {
  return array.flat(depth) as T[];
}

/**
 * Partition array into two arrays based on a predicate
 * 
 * @param array - Array to partition
 * @param predicate - Function that returns true for left partition
 * @returns Partition result with left and right arrays
 * 
 * @example
 * ```typescript
 * partition(accounts, acc => acc.isActive);
 * ```
 */
export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean
): PartitionResult<T> {
  const left: T[] = [];
  const right: T[] = [];
  
  for (const item of array) {
    if (predicate(item)) {
      left.push(item);
    } else {
      right.push(item);
    }
  }
  
  return { left, right };
}

/**
 * Split array at a specific index
 * 
 * @param array - Array to split
 * @param index - Index to split at
 * @returns Tuple with left and right parts
 * 
 * @example
 * ```typescript
 * splitAt([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4, 5]]
 * ```
 */
export function splitAt<T>(array: T[], index: number): [T[], T[]] {
  return [array.slice(0, index), array.slice(index)];
}

/**
 * Take first n elements from array
 * 
 * @param array - Array to take from
 * @param n - Number of elements to take
 * @returns Array with first n elements
 * 
 * @example
 * ```typescript
 * take([1, 2, 3, 4, 5], 3); // [1, 2, 3]
 * ```
 */
export function take<T>(array: T[], n: number): T[] {
  return array.slice(0, n);
}

/**
 * Take last n elements from array
 * 
 * @param array - Array to take from
 * @param n - Number of elements to take
 * @returns Array with last n elements
 * 
 * @example
 * ```typescript
 * takeLast([1, 2, 3, 4, 5], 3); // [3, 4, 5]
 * ```
 */
export function takeLast<T>(array: T[], n: number): T[] {
  return array.slice(-n);
}

/**
 * Drop first n elements from array
 * 
 * @param array - Array to drop from
 * @param n - Number of elements to drop
 * @returns Array without first n elements
 * 
 * @example
 * ```typescript
 * drop([1, 2, 3, 4, 5], 2); // [3, 4, 5]
 * ```
 */
export function drop<T>(array: T[], n: number): T[] {
  return array.slice(n);
}

/**
 * Drop last n elements from array
 * 
 * @param array - Array to drop from
 * @param n - Number of elements to drop
 * @returns Array without last n elements
 * 
 * @example
 * ```typescript
 * dropLast([1, 2, 3, 4, 5], 2); // [1, 2, 3]
 * ```
 */
export function dropLast<T>(array: T[], n: number): T[] {
  return array.slice(0, -n);
}

// ============================================================================
// SEARCH & FIND UTILITIES
// ============================================================================

/**
 * Find first item that matches predicate
 * 
 * @param array - Array to search
 * @param predicate - Function that returns true for matching item
 * @returns First matching item or undefined
 * 
 * @example
 * ```typescript
 * findFirst(accounts, acc => acc.balance > 1000);
 * ```
 */
export function findFirst<T>(
  array: T[], 
  predicate: (item: T) => boolean
): T | undefined {
  return array.find(predicate);
}

/**
 * Find last item that matches predicate
 * 
 * @param array - Array to search
 * @param predicate - Function that returns true for matching item
 * @returns Last matching item or undefined
 * 
 * @example
 * ```typescript
 * findLast(transactions, t => t.amount > 1000);
 * ```
 */
export function findLast<T>(
  array: T[], 
  predicate: (item: T) => boolean
): T | undefined {
  for (let index = array.length - 1; index >= 0; index--) {
    if (predicate(array[index]!)) {
      return array[index];
    }
  }
  return undefined;
}

/**
 * Find all items that match predicate
 * 
 * @param array - Array to search
 * @param predicate - Function that returns true for matching items
 * @returns Array of all matching items
 * 
 * @example
 * ```typescript
 * findAll(accounts, acc => acc.isActive);
 * ```
 */
export function findAll<T>(
  array: T[], 
  predicate: (item: T) => boolean
): T[] {
  return array.filter(predicate);
}

/**
 * Find index of first item that matches predicate
 * 
 * @param array - Array to search
 * @param predicate - Function that returns true for matching item
 * @returns Index of first matching item or -1
 * 
 * @example
 * ```typescript
 * findIndex(accounts, acc => acc.accountCode === '1001');
 * ```
 */
export function findIndex<T>(
  array: T[],
  predicate: (item: T) => boolean
): number {
  return array.findIndex(predicate);
}

/**
 * Find index of last item that matches predicate
 * 
 * @param array - Array to search
 * @param predicate - Function that returns true for matching item
 * @returns Index of last matching item or -1
 * 
 * @example
 * ```typescript
 * findLastIndex(transactions, t => t.amount > 1000);
 * ```
 */
export function findLastIndex<T>(
  array: T[],
  predicate: (item: T) => boolean
): number {
  for (let index = array.length - 1; index >= 0; index--) {
    if (predicate(array[index]!)) {
      return index;
    }
  }
  return -1;
}

// ============================================================================
// TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Map array and filter out undefined results
 * 
 * @param array - Array to map
 * @param mapper - Function that maps items (may return undefined)
 * @returns Array with only defined results
 * 
 * @example
 * ```typescript
 * mapDefined(accounts, acc => acc.isActive ? acc.accountCode : undefined);
 * ```
 */
export function mapDefined<T, U>(
  array: T[],
  mapper: (item: T) => U | undefined
): U[] {
  const result: U[] = [];
  for (const item of array) {
    const mapped = mapper(item);
    if (mapped !== undefined) {
      result.push(mapped);
    }
  }
  return result;
}

/**
 * Map array and flatten results
 * 
 * @param array - Array to map
 * @param mapper - Function that returns arrays
 * @returns Flattened array of mapped results
 * 
 * @example
 * ```typescript
 * flatMap(accounts, acc => acc.transactions);
 * ```
 */
export function flatMap<T, U>(
  array: T[],
  mapper: (item: T) => U[]
): U[] {
  return array.flatMap(mapper);
}

/**
 * Reduce array with early termination
 * 
 * @param array - Array to reduce
 * @param reducer - Reduction function
 * @param initialValue - Initial accumulator value
 * @param shouldStop - Function that determines when to stop
 * @returns Final accumulator value
 * 
 * @example
 * ```typescript
 * reduceUntil(transactions, (sum, t) => sum + t.amount, 0, sum => sum > 10000);
 * ```
 */
export function reduceUntil<T, U>(
  array: T[], 
  reducer: (accumulator: U, item: T) => U, 
  initialValue: U,
  shouldStop: (accumulator: U) => boolean
): U {
  let accumulator = initialValue;
  for (const item of array) {
    accumulator = reducer(accumulator, item);
    if (shouldStop(accumulator)) {
      break;
    }
  }
  return accumulator;
}

// ============================================================================
// ACCOUNTING-SPECIFIC UTILITIES
// ============================================================================

/**
 * Group transactions by account code
 * 
 * @param transactions - Array of transactions
 * @returns Grouped transactions by account code
 * 
 * @example
 * ```typescript
 * groupTransactionsByAccount(transactions);
 * ```
 */
export function groupTransactionsByAccount<T extends { accountCode: string }>(
  transactions: T[]
): GroupByResult<T, string> {
  return groupByProperty(transactions, 'accountCode');
}

/**
 * Filter transactions by date range
 * 
 * @param transactions - Array of transactions
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Filtered transactions
 * 
 * @example
 * ```typescript
 * filterTransactionsByDateRange(transactions, startDate, endDate);
 * ```
 */
export function filterTransactionsByDateRange<T extends { date: Date }>(
  transactions: T[],
  startDate: Date,
  endDate: Date
): T[] {
  return filterByPredicate(transactions, transaction => 
    isDateInRange(transaction.date, startDate, endDate)
  );
}

/**
 * Calculate total amount from transactions
 * 
 * @param transactions - Array of transactions
 * @param amountField - Field name containing the amount
 * @returns Total amount
 * 
 * @example
 * ```typescript
 * calculateTotalAmount(transactions, 'amount');
 * ```
 */
export function calculateTotalAmount<T>(
  transactions: T[],
  amountField: keyof T
): number {
  return transactions.reduce((sum, transaction) => {
    const amount = transaction[amountField];
    return sum + (typeof amount === 'number' ? amount : 0);
  }, 0);
}

/**
 * Get top N items by a numeric field
 * 
 * @param items - Array of items
 * @param field - Numeric field to sort by
 * @param n - Number of top items to return
 * @param direction - Sort direction (default: 'desc')
 * @returns Top N items
 * 
 * @example
 * ```typescript
 * getTopAccountsByBalance(accounts, 'balance', 10);
 * ```
 */
export function getTopByField<T>(
  items: T[],
  field: keyof T,
  n: number,
  direction: SortDirection = 'desc'
): T[] {
  return take(sortBy(items, field, direction), n);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if array is empty
 * 
 * @param array - Array to check
 * @returns True if array is empty
 */
export function isEmpty<T>(array: T[]): boolean {
  return array.length === 0;
}

/**
 * Check if array has any items
 * 
 * @param array - Array to check
 * @returns True if array has items
 */
export function hasItems<T>(array: T[]): boolean {
  return array.length > 0;
}

/**
 * Get array length safely
 * 
 * @param array - Array to get length of
 * @returns Array length or 0 if null/undefined
 */
export function getLength<T>(array: T[] | null | undefined): number {
  return array?.length ?? 0;
}

/**
 * Create array of specified length filled with value
 * 
 * @param length - Length of array
 * @param value - Value to fill with
 * @returns Filled array
 * 
 * @example
 * ```typescript
 * fill(5, 0); // [0, 0, 0, 0, 0]
 * ```
 */
export function fill<T>(length: number, value: T): T[] {
  return Array(length).fill(value);
}

/**
 * Create array of specified length with generated values
 * 
 * @param length - Length of array
 * @param generator - Function that generates values
 * @returns Generated array
 * 
 * @example
 * ```typescript
 * generate(5, i => i * 2); // [0, 2, 4, 6, 8]
 * ```
 */
export function generate<T>(length: number, generator: (index: number) => T): T[] {
  return Array.from({ length }, (_, index) => generator(index));
}

// ============================================================================
// PERFORMANCE HELPERS
// ============================================================================

/**
 * Binary search over a sorted array.
 * @returns index of found element or bitwise complement (~insertionIndex) if not found.
 */
export function binarySearch<T>(
  array: T[],
  needle: T,
  compare: (a: T, b: T) => number
): number {
  let lo = 0, hi = array.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cmp = compare(array[mid]!, needle);
    if (cmp === 0) return mid;
    if (cmp < 0) lo = mid + 1;
    else hi = mid - 1;
  }
  return ~lo; // insertion point
}

/**
 * Top-K selection without fully sorting the array (min-heap).
 * Great when K << N (e.g., top 10 from millions).
 */
export function topKBy<T>(
  array: T[],
  k: number,
  score: (item: T) => number
): T[] {
  if (k <= 0) return [];
  if (k >= array.length) {
    return [...array].sort((a,b) => score(b) - score(a));
  }
  // small binary heap inline (min-heap of size k)
  const heap: { s: number; v: T }[] = [];
  const up = (index: number) => {
    while (index > 0) {
      const p = (index - 1) >> 1;
      if (heap[p]!.s <= heap[index]!.s) break;
      [heap[p], heap[index]] = [heap[index]!, heap[p]!];
      index = p;
    }
  };
  const down = (index: number) => {
    for (;;) {
      let l = index * 2 + 1, r = l + 1, m = index;
      if (l < heap.length && heap[l]!.s < heap[m]!.s) m = l;
      if (r < heap.length && heap[r]!.s < heap[m]!.s) m = r;
      if (m === index) break;
      [heap[m], heap[index]] = [heap[index]!, heap[m]!];
      index = m;
    }
  };
  for (const v of array) {
    const s = score(v);
    if (heap.length < k) {
      heap.push({ s, v }); up(heap.length - 1);
    } else if (s > heap[0]!.s) {
      heap[0] = { s, v }; down(0);
    }
  }
  return heap.sort((a,b) => b.s - a.s).map(x => x.v);
}

/**
 * Stable unique (preserve first occurrence order) using a key function.
 */
export function uniqueStableBy<T, K>(
  array: T[],
  keyFunction: (item: T) => K
): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of array) {
    const k = keyFunction(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/**
 * Partition + map in a single pass.
 */
export function partitionMap<T, L, R>(
  array: T[],
  toLeft: (item: T) => L | undefined,
  toRight: (item: T) => R | undefined
): { left: L[]; right: R[] } {
  const left: L[] = [], right: R[] = [];
  for (const item of array) {
    const l = toLeft(item); if (l !== undefined) left.push(l);
    const r = toRight(item); if (r !== undefined) right.push(r);
  }
  return { left, right };
}

// ============================================================================
// ASYNC / CHUNKED PIPELINES (non-blocking with concurrency + progress)
// ============================================================================

export interface AsyncChunkOptions {
  /** How many tasks in parallel (default 4). Use navigator.hardwareConcurrency when available if you like. */
  concurrency?: number;
  /** Yield back to event loop after this many tasks (default 100). */
  yieldEvery?: number;
  /** Optional cancellation. */
  signal?: AbortSignal | { aborted: boolean };
  /** Progress callback (completed / total). */
  onProgress?: (done: number, total: number) => void;
}

async function maybeYield(countSinceYield: number, yieldEvery: number): Promise<number> {
  if (countSinceYield >= yieldEvery) {
    await Promise.resolve(); // microtask yield (fast)
    return 0;
  }
  return countSinceYield;
}

/**
 * Map with concurrency, yielding periodically to avoid blocking the UI thread.
 */
export async function mapAsyncChunked<T, U>(
  array: T[],
  mapper: (item: T, index: number) => Promise<U> | U,
  options: AsyncChunkOptions = {}
): Promise<U[]> {
  const { concurrency = 4, yieldEvery = 100, signal, onProgress } = options;
  const total = array.length;
  const out = new Array<U>(total);
  let next = 0, done = 0, sinceYield = 0;
  if (signal?.aborted) throw new Error('Aborted');

  async function worker() {
    while (true) {
      if (signal?.aborted) throw new Error('Aborted');
      const index = next++;
      if (index >= total) break;
      out[index] = await mapper(array[index]!, index);
      done++;
      if (onProgress && (done % 10 === 0 || done === total)) onProgress(done, total);
      sinceYield++;
      sinceYield = await maybeYield(sinceYield, yieldEvery);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, total) }, worker);
  await Promise.all(workers);
  return out;
}

/**
 * Reduce asynchronously in chunks without blocking.
 */
export async function reduceAsyncChunked<T, U>(
  array: T[],
  reducer: (accumulator: U, item: T, index: number) => Promise<U> | U,
  initial: U,
  options: AsyncChunkOptions = {}
): Promise<U> {
  const { yieldEvery = 100, signal, onProgress } = options;
  let accumulator = initial, sinceYield = 0;
  for (let index = 0; index < array.length; index++) {
    if (signal?.aborted) throw new Error('Aborted');
    accumulator = await reducer(accumulator, array[index]!, index);
    if (onProgress && (index % 10 === 9 || index === array.length - 1)) onProgress(index + 1, array.length);
    sinceYield++;
    sinceYield = await maybeYield(sinceYield, yieldEvery);
  }
  return accumulator;
}

/**
 * Concurrent forEach (fire-and-wait), useful for side effects (I/O).
 */
export async function forEachAsyncChunked<T>(
  array: T[],
  function_: (item: T, index: number) => Promise<unknown> | unknown,
  options: AsyncChunkOptions = {}
): Promise<void> {
  await mapAsyncChunked(array, function_, options);
}

// ============================================================================
// TINY QUERY ENGINE (select / where / order / limit / join) + PAGINATION
// ============================================================================

// ---- Core query typings -----------------------------------------------------
export type Predicate<T> = (row: T) => boolean;
export type Projector<T, U> = (row: T) => U;

export interface OrderKey<T> {
  key: keyof T;
  direction?: SortDirection;
  type?: 'string' | 'number' | 'date' | 'boolean';
  nulls?: 'first' | 'last';
  locale?: string | undefined;
  localeOptions?: Intl.CollatorOptions;
  transform?: (v: unknown) => unknown;
}

export interface QuerySpec<T, U = T> {
  from: ReadonlyArray<T>;
  where?: Predicate<T> | Array<Predicate<T>>;
  select?: Projector<T, U>;
  orderBy?: Array<OrderKey<U>>;
  limit?: number;
  offset?: number;
  distinctBy?: (row: U) => unknown; // for SELECT DISTINCT-like behavior
}

export interface QueryResult<U> {
  rows: U[];
  total: number;         // total after where/distinct, before limit/offset
}

// ---- Helpers ----------------------------------------------------------------
function andAll<T>(preds: Array<Predicate<T>>): Predicate<T> {
  return (r) => {
    for (let index = 0; index < preds.length; index++) {
      const pred = preds[index];
      if (pred && !pred(r)) return false;
    }
    return true;
  };
}

function applyWhere<T>(rows: ReadonlyArray<T>, where?: Predicate<T> | Array<Predicate<T>>): T[] {
  if (!where) return rows.slice();
  const p = Array.isArray(where) ? andAll(where) : where;
  return rows.filter(p);
}

function applyDistinct<U>(rows: U[], distinctBy?: (row: U) => unknown): U[] {
  if (!distinctBy) return rows;
  const seen = new Set<unknown>();
  const out: U[] = [];
  for (const r of rows) {
    const k = distinctBy(r);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(r);
    }
  }
  return out;
}

function applyOrder<U>(rows: U[], orderBy?: Array<OrderKey<U>>): U[] {
  if (!orderBy || isEmpty(orderBy)) return rows;
  // Convert to schema-based comparator for stability + correctness
  const schema = orderBy.map(o => ({
    key: o.key,
    type: o.type ?? 'string',
    direction: o.direction ?? 'asc',
    nulls: o.nulls ?? 'last',
    locale: o.locale,
    localeOptions: o.localeOptions,
    transform: o.transform,
  })) as SchemaKey<U>[];
  return sortBySchema(rows, schema);
}

function applySelect<T, U>(rows: T[], select?: Projector<T, U>): U[] {
  return select ? rows.map(select) : (rows as unknown as U[]);
}

// ---- Public: query() --------------------------------------------------------
export function query<T, U = T>(spec: QuerySpec<T, U>): QueryResult<U> {
  // 1) WHERE
  const filtered = applyWhere(spec.from, spec.where);
  // 2) SELECT (project early so ORDER BY can use projected fields)
  const projected = applySelect(filtered, spec.select);
  // 3) DISTINCT (after projection)
  const deduped = applyDistinct(projected, spec.distinctBy);
  // 4) ORDER
  const ordered = applyOrder(deduped, spec.orderBy as OrderKey<U>[] | undefined);
  // 5) PAGING (offset/limit)
  const total = ordered.length;
  const start = Math.max(0, spec.offset ?? 0);
  const end = spec.limit != null ? start + Math.max(0, spec.limit) : total;
  const slice = ordered.slice(start, end);
  return { rows: slice, total };
}

// ---- Convenience builders ---------------------------------------------------
export function qFrom<T>(from: ReadonlyArray<T>): {
  where: (w: Predicate<T> | Array<Predicate<T>>) => unknown;
  select: <U>(sel: Projector<T, U>) => unknown;
  orderBy: (o: Array<OrderKey<T>>) => unknown;
  exec: () => QueryResult<T>;
} {
  return {
    where: (w: Predicate<T> | Array<Predicate<T>>) => qFromWhere(from, w),
    select: <U>(sel: Projector<T, U>) => qFromSelect(from, sel),
    orderBy: (o: Array<OrderKey<T>>) => qFromOrder(from, o),
    exec: () => query<T>({ from }),
  };
}
function qFromWhere<T>(from: ReadonlyArray<T>, where: Predicate<T> | Array<Predicate<T>>) {
  return {
    select: <U>(sel: Projector<T, U>) => query<T, U>({ from, where, select: sel }),
    orderBy: (o: Array<OrderKey<T>>) => query<T>({ from, where, orderBy: o }),
    limit: (n: number) => query<T>({ from, where, limit: n }),
    exec: () => query<T>({ from, where }),
  };
}
function qFromSelect<T, U>(from: ReadonlyArray<T>, select: Projector<T, U>) {
  return {
    where: (w: Predicate<T> | Array<Predicate<T>>) => qFromSelectWhere(from, select, w),
    orderBy: (o: Array<OrderKey<U>>) => query<T, U>({ from, select, orderBy: o }),
    limit: (n: number) => query<T, U>({ from, select, limit: n }),
    exec: () => query<T, U>({ from, select }),
  };
}

function qFromSelectWhere<T, U>(from: ReadonlyArray<T>, select: Projector<T, U>, where: Predicate<T> | Array<Predicate<T>>) {
  return {
    orderBy: (o: Array<OrderKey<U>>) => query<T, U>({ from, where, select, orderBy: o }),
    limit: (n: number) => query<T, U>({ from, where, select, limit: n }),
    exec: () => query<T, U>({ from, where, select }),
  };
}
function qFromOrder<T>(from: ReadonlyArray<T>, orderBy: Array<OrderKey<T>>) {
  return {
    where: (w: Predicate<T> | Array<Predicate<T>>) => query<T>({ from, where: w, orderBy }),
    select: <U>(sel: Projector<T, U>) => query<T, U>({ from, select: sel, orderBy: orderBy as unknown as OrderKey<U>[] }),
    exec: () => query<T>({ from, orderBy }),
  };
}

// ---- Joins (inner/left) ----------------------------------------------------
export type KeySelector<T> = (row: T) => string | number;

export function innerJoin<A, B, R = A & B>(options: {
  left: ReadonlyArray<A>;
  right: ReadonlyArray<B>;
  on: { leftKey: KeySelector<A>; rightKey: KeySelector<B> };
  project?: (a: A, b: B) => R;
}): R[] {
  const { left, right, on, project } = options;
  const index = new Map<string | number, B[]>();
  for (const r of right) {
    const k = on.rightKey(r);
    const array = index.get(k) ?? [];
    array.push(r);
    index.set(k, array);
  }
  const out: R[] = [];
  for (const a of left) {
    const k = on.leftKey(a);
    const matches = index.get(k);
    if (!matches) continue;
    for (const b of matches) {
      out.push(project ? project(a, b) : ({ ...(a as Record<string, unknown>), ...(b as Record<string, unknown>) } as R));
    }
  }
  return out;
}

export function leftJoin<A, B, R = A & Partial<B>>(options: {
  left: ReadonlyArray<A>;
  right: ReadonlyArray<B>;
  on: { leftKey: KeySelector<A>; rightKey: KeySelector<B> };
  project?: (a: A, b: B | undefined) => R;
}): R[] {
  const { left, right, on, project } = options;
  const index = new Map<string | number, B[]>();
  for (const r of right) {
    const k = on.rightKey(r);
    const array = index.get(k) ?? [];
    array.push(r);
    index.set(k, array);
  }
  const out: R[] = [];
  for (const a of left) {
    const k = on.leftKey(a);
    const matches = index.get(k);
    if (!matches || isEmpty(matches)) {
      out.push(project ? project(a, undefined) : ({ ...(a as Record<string, unknown>) } as R));
    } else {
      for (const b of matches) {
        out.push(project ? project(a, b) : ({ ...(a as Record<string, unknown>), ...(b as Record<string, unknown>) } as R));
      }
    }
  }
  return out;
}

// ---- Pagination (offset & cursor) ------------------------------------------
export type Page<T> = {
  items: T[];
  total: number;            // total available rows
  page: number;             // current page number (1-based)
  pageSize: number;
  pageCount: number;
};

export function paginateOffset<T>(rows: ReadonlyArray<T>, page: number, pageSize: number): Page<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const p = Math.min(Math.max(1, page), pageCount);
  const start = (p - 1) * pageSize;
  const end = Math.min(total, start + pageSize);
  return { items: rows.slice(start, end), total, page: p, pageSize, pageCount };
}

/**
 * Cursor-based pagination using a stable comparator + cursor encoder.
 * - cursor encodes the last item's sort fields as JSON (safe for APIs).
 * - Requires the same orderBy schema used to sort the dataset.
 */
export type CursorResult<T> = {
  items: T[];
  nextCursor?: string | undefined;
  total: number;
};

export function paginateCursor<T>(options: {
  rows: ReadonlyArray<T>;
  orderBy: Array<OrderKey<T>>;        // must be stable and deterministic
  pageSize: number;
  cursor?: string;                     // encoded last-key from previous page
}): CursorResult<T> {
  const { rows, orderBy, pageSize, cursor } = options;
  const ordered = applyOrder(rows.slice(), orderBy);
  const total = ordered.length;
  if (!cursor) {
    const slice = ordered.slice(0, pageSize);
    const nextCursor = encodeCursor(slice[slice.length - 1], orderBy);
    return { items: slice, nextCursor, total };
  }
  const lastKey = JSON.parse(cursor) as Record<string, unknown>;
  const cmp = buildSchemaComparator(orderBy.map(o => ({
    key: o.key, 
    type: o.type ?? 'string', 
    direction: o.direction ?? 'asc',
    nulls: o.nulls ?? 'last', 
    locale: o.locale, 
    localeOptions: o.localeOptions, 
    transform: o.transform,
  })) as SchemaKey<unknown>[]);
  const startIndex = binarySearch(ordered, deserializeKeyAsRow<T>(lastKey), cmp);
  // If found, move past it; if not found (~idx), start at insertion point
  const si = startIndex >= 0 ? startIndex + 1 : ~startIndex;
  const slice = ordered.slice(si, si + pageSize);
  const nextCursor = hasItems(slice) ? encodeCursor(slice[slice.length - 1], orderBy) : undefined;
  return { items: slice, nextCursor, total };
}

function encodeCursor<T>(row: T | undefined, orderBy: Array<OrderKey<T>>): string | undefined {
  if (!row) return undefined;
  const object: Record<string, unknown> = {};
  for (const k of orderBy) object[String(k.key)] = (row as Record<string, unknown>)[String(k.key)];
  return JSON.stringify(object);
}

function deserializeKeyAsRow<T>(keyObject: Record<string, unknown>): T {
  return keyObject as unknown as T; // used only for binarySearch with comparator that reads keys
}

// ---- Query + Pagination convenience ----------------------------------------
export function queryPage<T, U = T>(spec: QuerySpec<T, U> & { page?: number; pageSize?: number }): Page<U> {
  const res = query(spec);
  const p = paginateOffset(res.rows, spec.page ?? 1, spec.pageSize ?? (spec.limit ?? 20));
  // Note: res.total is after where/distinct/order, before paging; we preserve it in Page.total
  return { ...p, total: res.total };
}

// ============================================================================
// FILTER DSL (declarative where conditions) + RANGE INDEX
// ============================================================================

// ---- Filter DSL Types -----------------------------------------------------
export type FilterOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not-in' | 'contains' | 'starts-with' | 'ends-with' | 'regex';

export interface FilterCondition<T> {
  field: keyof T;
  op: FilterOperator;
  value: unknown;
}

export interface FilterGroup<T> {
  op: 'AND' | 'OR';
  conditions: Array<FilterCondition<T> | FilterGroup<T>>;
}

export type FilterDSL<T> = FilterCondition<T> | FilterGroup<T>;

// ---- Filter DSL Implementation ---------------------------------------------
function evaluateCondition<T>(row: T, condition: FilterCondition<T>): boolean {
  const { field, op, value } = condition;
  const fieldValue = (row as Record<string, unknown>)[String(field)];

  switch (op) {
    case '=': return fieldValue === value;
    case '!=': return fieldValue !== value;
    case '>': return (fieldValue as number) > (value as number);
    case '>=': return (fieldValue as number) >= (value as number);
    case '<': return (fieldValue as number) < (value as number);
    case '<=': return (fieldValue as number) <= (value as number);
    case 'in': return Array.isArray(value) && value.includes(fieldValue);
    case 'not-in': return Array.isArray(value) && !value.includes(fieldValue);
    case 'contains': return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.includes(value);
    case 'starts-with': return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.startsWith(value);
    case 'ends-with': return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.endsWith(value);
    case 'regex': {
      if (typeof fieldValue !== 'string' || typeof value !== 'string') return false;
      try {
        return new RegExp(value).test(fieldValue);
      } catch {
        return false;
      }
    }
    default: return false;
  }
}

function evaluateGroup<T>(row: T, group: FilterGroup<T>): boolean {
  const { op, conditions } = group;
  const results = conditions.map(condition => {
    if ('op' in condition && (condition.op === 'AND' || condition.op === 'OR')) {
      return evaluateGroup(row, condition as FilterGroup<T>);
    } else {
      return evaluateCondition(row, condition as FilterCondition<T>);
    }
  });
  
  return op === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

export function buildFilter<T>(dsl: FilterDSL<T>): Predicate<T> {
  return (row: T) => {
    if ('op' in dsl && (dsl.op === 'AND' || dsl.op === 'OR')) {
      return evaluateGroup(row, dsl as FilterGroup<T>);
    } else {
      return evaluateCondition(row, dsl as FilterCondition<T>);
    }
  };
}

// ---- Range Index Helper ---------------------------------------------------
export interface RangeIndex<T> {
  ranges: Map<string, { start: number; end: number; items: T[] }>;
  keyFn: (item: T) => string;
}

export function createRangeIndex<T>(
  items: ReadonlyArray<T>,
  keyFunction: (item: T) => string,
  ranges: Array<{ key: string; start: number; end: number }>
): RangeIndex<T> {
  const index = new Map<string, { start: number; end: number; items: T[] }>();
  
  for (const range of ranges) {
    const rangeItems = items.slice(range.start, range.end);
    index.set(range.key, { start: range.start, end: range.end, items: rangeItems });
  }
  
  return { ranges: index, keyFn: keyFunction };
}

export function queryRangeIndex<T>(
  index: RangeIndex<T>,
  rangeKey: string,
  additionalFilter?: Predicate<T>
): T[] {
  const range = index.ranges.get(rangeKey);
  if (!range) return [];
  
  let items = range.items;
  if (additionalFilter) {
    items = items.filter(additionalFilter);
  }
  
  return items;
}

export function createMonthlyRangeIndex<T>(
  items: ReadonlyArray<T>,
  dateField: keyof T,
  startDate: Date,
  endDate: Date
): RangeIndex<T> {
  const ranges: Array<{ key: string; start: number; end: number }> = [];
  let currentIndex = 0;
  
  let current = new Date(startDate);
  while (current <= endDate) {
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);
    
    const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    
    // Find items in this month range
    const startIndex = currentIndex;
    while (currentIndex < items.length) {
      const itemDate = new Date((items[currentIndex] as Record<string, unknown>)[String(dateField)] as string | number | Date);
      if (itemDate > monthEnd) break;
      currentIndex++;
    }
    
    ranges.push({ key: monthKey, start: startIndex, end: currentIndex });
    
    // Move to next month
    current = addMonthsToDate(current, 1);
  }
  
  return createRangeIndex(items, item => {
    const date = new Date((item as Record<string, unknown>)[String(dateField)] as string | number | Date);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, ranges);
}

// ---- Enhanced Query with DSL Support --------------------------------------
export interface EnhancedQuerySpec<T, U = T> extends QuerySpec<T, U> {
  whereDSL?: FilterDSL<T>;
}

export function queryWithDSL<T, U = T>(spec: EnhancedQuerySpec<T, U>): QueryResult<U> {
  const { whereDSL, ...baseSpec } = spec;
  
  if (whereDSL) {
    const dslFilter = buildFilter(whereDSL);
    const existingWhere = baseSpec.where;
    
    if (existingWhere) {
      baseSpec.where = Array.isArray(existingWhere) 
        ? [...existingWhere, dslFilter]
        : [existingWhere, dslFilter];
    } else {
      baseSpec.where = dslFilter;
    }
  }
  
  return query(baseSpec);
}

// ============================================================================
// EXPORTS
// ============================================================================

// Collection utilities are self-contained and don't need external re-exports