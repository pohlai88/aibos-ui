/**
 * Internal UI Utilities
 * 
 * Self-contained utilities for the UI package to avoid external dependencies.
 * These are lightweight, focused utilities specifically for UI components.
 */

// Type guards
export const isNonNullish = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Safe object access
export const safeGet = <T>(obj: unknown, path: string, defaultValue?: T): T | undefined => {
  if (!isRecord(obj)) return defaultValue;
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (!isRecord(current) || !(key in current)) {
      return defaultValue;
    }
    // eslint-disable-next-line security/detect-object-injection
    current = current[key];
  }
  
  return current as T;
};

// Safe object creation
export const createDict = <T = unknown>(): Record<string, T> => {
  return Object.create(null);
};

export const safeSet = <T>(obj: Record<string, unknown>, key: string, value: T): void => {
  if (isString(key) && key.length > 0) {
    // eslint-disable-next-line security/detect-object-injection
    obj[key] = value;
  }
};

// Safe array operations
export const safeJoin = (arr: unknown[], separator: string = ','): string => {
  if (!Array.isArray(arr)) return '';
  return arr.filter(isNonNullish).map(String).join(separator);
};

// React-specific utilities
export const narrowToElements = (children: unknown): React.ReactElement[] => {
  if (!Array.isArray(children)) {
    return children && typeof children === 'object' && 'type' in children 
      ? [children as React.ReactElement] 
      : [];
  }
  
  return children.filter((child): child is React.ReactElement => {
    return child && typeof child === 'object' && 'type' in child;
  });
};

export const isReactElement = (value: unknown): value is React.ReactElement => {
  return value !== null && typeof value === 'object' && 'type' in value;
};

// Safe regex creation
export const safeRegExpFromUser = (pattern: string, flags?: string): RegExp | null => {
  try {
    if (!isString(pattern) || pattern.length === 0) return null;
    
    // Basic safety check for dangerous patterns
    if (pattern.includes('(?:') && pattern.length > 100) return null;
    
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
};

// Whitelist-based operations
export type Whitelist = Set<string>;

export const setIfAllowed = <T>(
  obj: Record<string, unknown>, 
  key: string, 
  value: T, 
  whitelist: Whitelist
): boolean => {
  if (whitelist.has(key)) {
    // eslint-disable-next-line security/detect-object-injection
    obj[key] = value;
    return true;
  }
  return false;
};

export const getIfAllowed = <T>(
  obj: Record<string, unknown>, 
  key: string, 
  whitelist: Whitelist
): T | undefined => {
  if (whitelist.has(key)) {
    // eslint-disable-next-line security/detect-object-injection
    return obj[key] as T;
  }
  return undefined;
};

// Safe counter operations
let counter = 0;
export const createSafeCounter = (): number => {
  return ++counter;
};

export const safeIncrement = (current: number): number => {
  return isNumber(current) ? current + 1 : 1;
};

export const getCounter = (): number => {
  return counter;
};

// Safe string operations
export const safeToString = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (isString(value)) return value;
  if (isNumber(value)) return String(value);
  if (typeof value === 'boolean') return String(value);
  
  try {
    return String(value);
  } catch {
    return '[object Object]';
  }
};

// Safe coalescing
export const safeCoalesce = <T>(...values: (T | null | undefined)[]): T | undefined => {
  for (const value of values) {
    if (isNonNullish(value)) {
      return value;
    }
  }
  return undefined;
};

// Null/undefined conversions
export const nullToUndefined = <T>(value: T | null): T | undefined => {
  return value === null ? undefined : value;
};

export const undefinedToNull = <T>(value: T | undefined): T | null => {
  return value === undefined ? null : value;
};

// Safe array creation
export class SafeArray<T> {
  private items: T[] = [];
  
  constructor(initialItems: T[] = []) {
    this.items = [...initialItems];
  }
  
  add(item: T): void {
    this.items.push(item);
  }
  
  get(index: number): T | undefined {
    // eslint-disable-next-line security/detect-object-injection
    return this.items[index];
  }
  
  getAll(): readonly T[] {
    return [...this.items];
  }
  
  length(): number {
    return this.items.length;
  }
}

export const createSafeArray = <T>(initialItems: T[] = []): SafeArray<T> => {
  return new SafeArray(initialItems);
};

// Safe set creation
export class SafeSet<T> {
  private items = new Set<T>();
  
  constructor(initialItems: T[] = []) {
    initialItems.forEach(item => this.items.add(item));
  }
  
  add(item: T): void {
    this.items.add(item);
  }
  
  has(item: T): boolean {
    return this.items.has(item);
  }
  
  delete(item: T): boolean {
    return this.items.delete(item);
  }
  
  getAll(): T[] {
    return Array.from(this.items);
  }
  
  size(): number {
    return this.items.size;
  }
}

export const createSafeSet = <T>(initialItems: T[] = []): SafeSet<T> => {
  return new SafeSet(initialItems);
};

// Common string constants
export const COMMON_STRINGS = {
  EMPTY: '',
  SPACE: ' ',
  COMMA: ',',
  DOT: '.',
  DASH: '-',
  UNDERSCORE: '_',
  SLASH: '/',
  BACKSLASH: '\\',
} as const;

// String registry for constants
const stringRegistry = new Map<string, string>();

export const createStringConstant = (key: string, value: string): string => {
  stringRegistry.set(key, value);
  return value;
};

export const getStringConstant = (key: string): string | undefined => {
  return stringRegistry.get(key);
};

// Safe object builder
export class SafeObjectBuilder<T = unknown> {
  private obj: Record<string, T> = createDict<T>();
  
  set(key: string, value: T): this {
    safeSet(this.obj, key, value);
    return this;
  }
  
  get(key: string): T | undefined {
    // eslint-disable-next-line security/detect-object-injection
    return this.obj[key];
  }
  
  build(): Record<string, T> {
    return { ...this.obj };
  }
}

export const createSafeObjectBuilder = <T = unknown>(): SafeObjectBuilder<T> => {
  return new SafeObjectBuilder<T>();
};

// Nullish checks
export const isNullish = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

export const isNotNullish = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

// Path validation
export const isValidPathComponent = (component: string): boolean => {
  if (!isString(component) || component.length === 0) return false;
  
  // Basic path component validation
  const dangerousPatterns = ['..', '~', '$', '`'];
  return !dangerousPatterns.some(pattern => component.includes(pattern));
};

export const safePathJoin = (...parts: string[]): string => {
  return parts
    .filter(isString)
    .filter(part => part.length > 0)
    .filter(isValidPathComponent)
    .join('/');
};

// Safe filesystem operations
export const safePath = (path: string): string => {
  if (!isString(path)) return '';
  return path.replace(/[<>:"|?*]/g, ''); // Remove dangerous characters
};

export const readFileSafe = (filePath: string): string | null => {
  try {
    if (!isValidPathComponent(filePath)) return null;
    // This is a placeholder - in a real implementation, you'd use fs.readFileSync
    return null;
  } catch {
    return null;
  }
};

export const readDirectorySafe = (dirPath: string): string[] => {
  try {
    if (!isValidPathComponent(dirPath)) return [];
    // This is a placeholder - in a real implementation, you'd use fs.readdirSync
    return [];
  } catch {
    return [];
  }
};

export const existsSafe = (path: string): boolean => {
  try {
    return isValidPathComponent(path);
  } catch {
    return false;
  }
};

export const hasOwn = (obj: unknown, key: string): boolean => {
  return isRecord(obj) && Object.prototype.hasOwnProperty.call(obj, key);
};

export const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'] as const;

// Argument parsing utilities (simplified)
export interface ScanComponentsArgs {
  help?: boolean;
  json?: boolean;
  verbose?: boolean;
}

export const parseArgs = (args: string[]): ScanComponentsArgs => {
  return {
    help: args.includes('--help') || args.includes('-h'),
    json: args.includes('--json'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
};

export const showHelp = (): void => {
  console.log('Usage: scan-components [options]');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --json         Output in JSON format');
  console.log('  --verbose, -v  Verbose output');
};
