/**
 * Internal utility functions for the UI package
 * These are internal helpers not meant for external consumption
 */

import React from 'react';

/**
 * Safe object property access with fallback
 */
export function safeGet<T = unknown>(obj: unknown, path: string | string[], defaultValue?: T): T | undefined {
  if (obj == null) return defaultValue;
  
  if (typeof path === 'string') {
    path = path.split('.');
  }
  
  let current: unknown = obj;
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return current !== undefined ? current as T : defaultValue;
}

/**
 * Create a safe Set with fallback
 */
export function createSafeSet<T>(items?: T[]): Set<T> {
  return new Set(items || []);
}

/**
 * Set value if allowed by whitelist
 */
export function setIfAllowed<T>(value: T, whitelist: T[]): T | undefined {
  return whitelist.includes(value) ? value : undefined;
}

/**
 * Get value if allowed by whitelist
 */
export function getIfAllowed<T>(value: T, whitelist: T[]): T | undefined {
  return whitelist.includes(value) ? value : undefined;
}

/**
 * Whitelist type for allowed values
 */
export type Whitelist<T> = T[];

/**
 * Narrow React children to React elements
 */
export function narrowToElements(children: React.ReactNode): React.ReactElement[] {
  if (!children) return [];
  
  return React.Children.toArray(children).filter((child): child is React.ReactElement => {
    return React.isValidElement(child);
  });
}
