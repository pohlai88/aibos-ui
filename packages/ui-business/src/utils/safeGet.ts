import { isRecord, hasKey } from '../types/safety';

export function safeGet<T extends object, K extends PropertyKey, R = unknown>(
  object: T | unknown,
  key: K,
  fallback?: R,
): R | unknown {
  if (!isRecord(object)) return fallback as R;
  return hasKey(object as T, key) ? (object as T)[key as keyof T] : (fallback as R);
}

export function safeSet<T extends object, K extends PropertyKey>(
  object: T,
  key: K,
  value: unknown,
): T {
  if (!isRecord(object)) return object;
  return { ...object, [key]: value };
}

export function safeDelete<T extends object, K extends PropertyKey>(object: T, key: K): Omit<T, K> {
  if (!isRecord(object)) return object as Omit<T, K>;
  const { [key]: _, ...rest } = object as T & Record<K, unknown>;
  return rest as Omit<T, K>;
}

export function safeKeys<T extends object>(object: T | unknown): (keyof T)[] {
  if (!isRecord(object)) return [];
  return Object.keys(object) as (keyof T)[];
}

export function safeValues<T extends object>(object: T | unknown): T[keyof T][] {
  if (!isRecord(object)) return [];
  return Object.values(object) as T[keyof T][];
}

export function safeEntries<T extends object>(object: T | unknown): [keyof T, T[keyof T]][] {
  if (!isRecord(object)) return [];
  return Object.entries(object) as [keyof T, T[keyof T]][];
}
