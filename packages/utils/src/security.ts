import path from 'node:path';
import escapeStringRegexp from 'escape-string-regexp';

/**
 * Security utility functions for safe object access, file operations, and regex patterns.
 * These helpers prevent common security vulnerabilities like object injection, path traversal, and regex injection.
 */

/**
 * Asserts that a key is in the allowed list, throwing an error if not.
 * This prevents object injection attacks by validating keys before access.
 */
export function assertAllowedKey<T extends string>(
  key: string,
  allow: readonly T[],
): asserts key is T {
  if (!allow.includes(key as T)) {
    throw new Error(`Invalid key: ${key}. Allowed keys: ${allow.join(', ')}`);
  }
}

/**
 * Safely gets a value from an object using a validated key.
 * Prevents object injection by ensuring the key is in the allowed list.
 */
export function safeGet<T extends Record<string, unknown>, K extends string>(
  object: T,
  key: string,
  allow: readonly K[],
): T[K] {
  assertAllowedKey(key, allow);
  return object[key as K];
}

/**
 * Safely joins a base directory with a user-provided path, preventing path traversal attacks.
 * Ensures the resulting path stays within the base directory.
 */
export function safeJoin(baseDirectory: string, userPath: string): string {
  const base = path.resolve(baseDirectory);
  const full = path.resolve(base, userPath);

  // Check if the resolved path is within the base directory
  if (!full.startsWith(base + path.sep) && full !== base) {
    throw new Error(`Path traversal blocked: ${userPath} would escape ${baseDirectory}`);
  }

  return full;
}

/**
 * Creates a safe RegExp from user input by escaping special regex characters.
 * Prevents regex injection attacks.
 */
export function safeRegExpFromUser(userInput: string, flags?: string): RegExp {
  const escaped = escapeStringRegexp(userInput);
  // Use safe regex construction with validated input
  return new RegExp(escaped, flags);
}

/**
 * Validates that a string contains only safe characters for use in file paths.
 * Prevents injection of special characters that could be used for path traversal.
 */
export function isValidPathComponent(input: string): boolean {
  // Allow alphanumeric, hyphens, underscores, dots, and forward slashes
  // Block backslashes, null bytes, and other potentially dangerous characters
  return /^[a-zA-Z0-9._/-]+$/.test(input) && !input.includes('..') && !input.includes('\0');
}

/**
 * Safely constructs a file path from components, validating each component.
 */
export function safePathJoin(...components: string[]): string {
  for (const component of components) {
    if (!isValidPathComponent(component)) {
      throw new Error(`Invalid path component: ${component}`);
    }
  }
  return path.join(...components);
}

/**
 * Narrowed & whitelisted map access for safer object property access.
 * This is an alias for safeGet but with a more specific name for map-like objects.
 */
export function safeMapGet<T extends Record<string, unknown>, K extends string>(
  map: T,
  key: string,
  allow: readonly K[],
): T[K] {
  assertAllowedKey(key, allow);
  return map[key as K];
}
