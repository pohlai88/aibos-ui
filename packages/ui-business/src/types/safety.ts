// Minimal, reusable type guards & helpers to eliminate `any`
export type Dict = Record<string, unknown>;

export function isRecord(v: unknown): v is Dict {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function hasKey<T extends object>(object: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function asBoolean(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

export function asArray<T>(v: unknown, fallback: T[] = []): T[] {
  return Array.isArray(v) ? v : fallback;
}

export function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

export function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

export function isFunction(v: unknown): v is Function {
  return typeof v === 'function';
}

export function isNullish(v: unknown): v is null | undefined {
  return v === null || v === undefined;
}

export function isNotNullish<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}
