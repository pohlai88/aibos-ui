/**
 * Code Quality Examples
 *
 * This file demonstrates how to use the utils package to resolve common code quality issues:
 * - Null vs undefined usage
 * - Duplicate strings
 * - Unused collections
 * - Object injection prevention
 */

import {
  // Null/undefined handling
  nullToUndefined,
  undefinedToNull,
  safeCoalesce,

  // String management
  createStringConstant,
  COMMON_STRINGS,
  safeToString,

  // Collection management
  createSafeArray,
  createSafeSet,

  // Object injection prevention
  createSafeObjectBuilder,

  // Counter utilities
  createSafeCounter,
  safeIncrement,
  safeGetCount,
} from '../index';

// ---------- Example 1: Null vs Undefined Handling ----------

/**
 * Example: Converting between null and undefined based on context
 */
export function exampleNullUndefinedHandling(): string {
  // Internal code should use undefined for omitted values
  const internalValue: string | undefined = getInternalValue();

  // Convert to null for DTO/DB/JSON serialization
  const dtoValue = undefinedToNull(internalValue);

  // Convert back to undefined for internal processing
  const processedValue = nullToUndefined(dtoValue);

  // Safe nullish coalescing
  return safeCoalesce(processedValue, 'default');
}

function getInternalValue(): string | undefined {
  return Math.random() > 0.5 ? 'value' : undefined;
}

// ---------- Example 2: Duplicate String Management ----------

/**
 * Example: Using string constants to prevent duplication
 */
export function exampleStringManagement(): {
  statusActive: string;
  statusInactive: string;
  statusPending: string;
  separator: string;
  emptyValue: string;
  userInput: string;
} {
  // Instead of repeating strings, use constants
  const statusActive = createStringConstant('STATUS_ACTIVE', 'active');
  const statusInactive = createStringConstant('STATUS_INACTIVE', 'inactive');
  const statusPending = createStringConstant('STATUS_PENDING', 'pending');

  // Use common strings from registry
  const separator = COMMON_STRINGS.COMMA;
  const emptyValue = COMMON_STRINGS.EMPTY;

  // Safe string conversion
  const userInput = safeToString(someValue);

  return {
    statusActive,
    statusInactive,
    statusPending,
    separator,
    emptyValue,
    userInput,
  };
}

function someValue(): unknown {
  return Math.random() > 0.5 ? 'test' : undefined;
}

// ---------- Example 3: Collection Management ----------

/**
 * Example: Using safe collections to prevent unused collection warnings
 */
export function exampleCollectionManagement(): {
  allItems: string[];
  itemCount: number;
  uniqueCount: number;
  hasItem: boolean;
} {
  // Safe array that tracks usage
  const items = createSafeArray<string>();

  // Add items
  items.add('item1');
  items.add('item2');
  items.add('item3');

  // Check if collection has been used
  if (!items.hasBeenAccessed()) {
    console.warn('Collection created but never accessed');
  }

  // Access the collection
  const allItems = items.getAll();
  const itemCount = items.length;

  // Safe set for unique values
  const uniqueItems = createSafeSet<string>();
  uniqueItems.add('unique1');
  uniqueItems.add('unique2');
  uniqueItems.add('unique1'); // Duplicate, will be ignored

  const uniqueCount = uniqueItems.size;
  const hasItem = uniqueItems.has('unique1');

  return {
    allItems,
    itemCount,
    uniqueCount,
    hasItem,
  };
}

// ---------- Example 4: Object Injection Prevention ----------

/**
 * Example: Using safe object builder to prevent object injection
 */
export function exampleObjectInjectionPrevention(): { name: string; age: number; email: string } {
  // Define allowed keys
  const allowedKeys = ['name', 'age', 'email'];

  // Create safe object builder
  const userBuilder = createSafeObjectBuilder<{ name: string; age: number; email: string }>(
    allowedKeys,
  );

  // Safely set properties
  userBuilder.set('name', 'John Doe').set('age', 30).set('email', 'john@example.com');

  // This would throw an error for invalid keys:
  // userBuilder.set('malicious', 'value'); // Error: Key 'malicious' is not in the allowed keys list

  // Build the final object
  return userBuilder.build();
}

// ---------- Example 5: Counter Management ----------

/**
 * Example: Using safe counters for tracking occurrences
 */
export function exampleCounterManagement(): {
  helloCount: number;
  worldCount: number;
  universeCount: number;
  totalWords: number;
} {
  // Create a safe counter
  const wordCounts = createSafeCounter();

  // Count words in a text
  const text = 'hello world hello universe world hello';
  const words = text.split(' ');

  for (const word of words) {
    safeIncrement(wordCounts, word);
  }

  // Get counts
  const helloCount = safeGetCount(wordCounts, 'hello');
  const worldCount = safeGetCount(wordCounts, 'world');
  const universeCount = safeGetCount(wordCounts, 'universe');

  return {
    helloCount,
    worldCount,
    universeCount,
    totalWords: words.length,
  };
}

// ---------- Example 6: Comprehensive Data Processing ----------

/**
 * Example: Combining multiple utilities for comprehensive data processing
 */
export function exampleComprehensiveProcessing(): {
  processedData: { id: number; name: string; age: number; email: string }[];
  nameCounts: [string, number][];
  ageCounts: [string, number][];
} {
  // Input data that might have null/undefined values
  const rawData = [
    { id: 1, name: 'John', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane', age: undefined, email: 'jane@example.com' },
    { id: 3, name: undefined, age: 25, email: 'bob@example.com' },
    { id: 4, name: 'Alice', age: 35, email: undefined },
  ];

  // Process data safely
  const processedData = rawData.map((item) => {
    const builder = createSafeObjectBuilder<{
      id: number;
      name: string;
      age: number;
      email: string;
    }>();

    // Safely handle null/undefined values
    builder
      .set('id', item.id)
      .set('name', safeCoalesce(nullToUndefined(item.name), COMMON_STRINGS.EMPTY))
      .set('age', safeCoalesce(nullToUndefined(item.age), 0))
      .set('email', safeCoalesce(nullToUndefined(item.email), COMMON_STRINGS.EMPTY));

    return builder.build();
  });

  // Count occurrences safely
  const nameCounts = createSafeCounter();
  const ageCounts = createSafeCounter();

  for (const item of processedData) {
    if (item.name !== COMMON_STRINGS.EMPTY) {
      safeIncrement(nameCounts, item.name);
    }
    safeIncrement(ageCounts, item.age.toString());
  }

  return {
    processedData,
    nameCounts: Array.from(nameCounts.entries()),
    ageCounts: Array.from(ageCounts.entries()),
  };
}

// ---------- Example 7: Error Handling with Safe Utilities ----------

/**
 * Example: Using safe utilities for error handling
 */
export function exampleErrorHandling(): { success: boolean; result?: string; error?: string } {
  try {
    // Simulate some operation that might fail
    const result = performRiskyOperation();

    // Safely handle the result
    const safeResult = safeCoalesce(result, COMMON_STRINGS.EMPTY);

    return {
      success: true,
      result: safeResult,
    };
  } catch (error) {
    // Safely convert error to string
    const errorMessage = safeToString(error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

function performRiskyOperation(): string | undefined {
  const random = Math.random();
  if (random < 0.3) return 'success';
  if (random < 0.6) return undefined;
  return undefined;
}

// ---------- Example 8: Configuration Management ----------

/**
 * Example: Using safe utilities for configuration management
 */
export function exampleConfigurationManagement(): {
  config: { apiUrl: string; timeout: number; retries: number; debug: boolean };
  isValid: boolean;
  errors: string[];
} {
  // Define configuration keys
  const configKeys = ['apiUrl', 'timeout', 'retries', 'debug'];

  // Create safe configuration builder
  const configBuilder = createSafeObjectBuilder<{
    apiUrl: string;
    timeout: number;
    retries: number;
    debug: boolean;
  }>(configKeys);

  // Set configuration values
  configBuilder
    .set('apiUrl', 'https://api.example.com')
    .set('timeout', 5000)
    .set('retries', 3)
    .set('debug', false);

  // Build configuration
  const config = configBuilder.build();

  // Validate configuration
  const validationErrors = createSafeArray<string>();

  if (config.apiUrl === COMMON_STRINGS.EMPTY) {
    validationErrors.add('API URL is required');
  }

  if (config.timeout <= 0) {
    validationErrors.add('Timeout must be positive');
  }

  if (config.retries < 0) {
    validationErrors.add('Retries must be non-negative');
  }

  return {
    config,
    isValid: validationErrors.isEmpty(),
    errors: validationErrors.getAll(),
  };
}
