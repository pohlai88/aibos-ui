/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * Object Utilities (Strict & Safe)
 *
 * - Immutable by default (never mutates inputs)
 * - Prototype-pollution safe (blocks __proto__/prototype/constructor)
 * - Works with symbols, Maps/Sets, Dates/RegExps, typed arrays
 * - Path utilities with bracket & dot notation (e.g. "a.b[0].c", "x['weird.key']")
 * - Deep clone with cycle handling
 * - Deep merge with array strategies + customizer
 *
 * This file is framework-agnostic and has zero deps.
 */

// =============================== Common helpers ===============================

const POLLUTION_KEYS = new Set(['__proto__', 'prototype', 'constructor'] as const);

function isPollutionKey(k: PropertyKey): boolean {
  return typeof k === 'string' && POLLUTION_KEYS.has(k as '__proto__' | 'prototype' | 'constructor');
}

export function isPlainObject(v: unknown): v is Record<PropertyKey, unknown> {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return isPlainObject(v);
}

export function hasOwn(obj: unknown, key: PropertyKey): boolean {
  return obj != null && Object.prototype.hasOwnProperty.call(obj, key);
}

export function keysOf<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

export function symbolKeysOf(obj: unknown): symbol[] {
  return typeof obj === 'object' && obj !== null ? Object.getOwnPropertySymbols(obj) : [];
}

// =============================== Types ===============================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};

export interface CloneOptions {
  deep?: boolean;                  // default: true
  preserveFunctions?: boolean;     // default: false
  preserveSymbols?: boolean;       // default: false
}

export interface MergeOptions {
  deep?: boolean;                  // default: true
  overwrite?: boolean;             // default: true (source wins on conflict)
  arrayStrategy?: 'replace' | 'merge' | 'concat'; // default: 'replace'
}

export type MergeCustomizer = (args: {
  key: PropertyKey;
  path: PropertyKey[];
  targetValue: unknown;
  sourceValue: unknown;
  targetObj: unknown;
  sourceObj: unknown;
}) => unknown | undefined;

// =============================== Clone ===============================

/**
 * Deep clone with circular-reference detection.
 * Immutable and prototype-safe.
 */
export function deepClone<T>(value: T, options: CloneOptions = {}): T {
  const { deep = true, preserveFunctions = false, preserveSymbols = false } = options;
  const seen = new WeakMap<object, unknown>();

  const clone = (v: unknown): unknown => {
    if (v === null || typeof v !== 'object') return v;

    if (seen.has(v as object)) return seen.get(v as object);

    // Arrays
    if (Array.isArray(v)) {
      const arr: unknown[] = [];
      seen.set(v, arr);
      for (let i = 0; i < v.length; i++) {
        arr[i] = deep ? clone(v[i]) : v[i];
      }
      return arr as unknown;
    }

    // Typed arrays & ArrayBuffer/DataView
    if (ArrayBuffer.isView(v)) {
      return new (v as any).constructor((v as any).buffer.slice(0));
    }
    if (v instanceof ArrayBuffer) return v.slice(0);
    if (v instanceof DataView) return new DataView(v.buffer.slice(0), v.byteOffset, v.byteLength);

    // Domain objects
    if (v instanceof Date) return new Date(v.getTime());
    if (v instanceof RegExp) return new RegExp(v.source, v.flags);
    if (v instanceof Map) {
      const m = new Map<unknown, unknown>();
      seen.set(v, m);
      for (const [k, vv] of v) m.set(deep ? clone(k) : k, deep ? clone(vv) : vv);
      return m;
    }
    if (v instanceof Set) {
      const s = new Set<unknown>();
      seen.set(v, s);
      for (const vv of v) s.add(deep ? clone(vv) : vv);
      return s;
    }
    if (v instanceof Error) {
      const e = new (v as any).constructor(v.message);
      e.name = v.name;
      e.stack = v.stack;
      seen.set(v, e);
      return e;
    }
    if (typeof URL !== 'undefined' && v instanceof URL) {
      return new URL(v.toString());
    }

    // Plain object
    if (isPlainObject(v)) {
      const out: Record<PropertyKey, unknown> = {};
      seen.set(v, out);
      for (const k of Object.keys(v)) {
        if (isPollutionKey(k)) continue;
        const val = (v as Record<string, unknown>)[k];
        if (typeof val === 'function' && !preserveFunctions) continue;
        out[k] = deep ? clone(val) : val;
      }
      if (preserveSymbols) {
        for (const s of Object.getOwnPropertySymbols(v)) {
          const val = (v as Record<PropertyKey, unknown>)[s];
          if (typeof val === 'function' && !preserveFunctions) continue;
          out[s] = deep ? clone(val) : val;
        }
      }
      return out;
    }

    // Fallback: unknown object (class instance) — return as-is (immutable guarantee not possible)
    return v;
  };

  return clone(value) as T;
}

/** Shallow clone common JS values (arrays, dates, regex) else object spread. */
export function shallowClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return [...obj] as unknown as T;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags) as unknown as T;
  if (isPlainObject(obj)) return { ...(obj as Record<string, unknown>) } as unknown as T;
  return obj; // Map/Set/typed arrays: return as-is (explicit-only)
}

// =============================== Merge ===============================

/**
 * Deep merge with customizer and array strategies.
 * Prototype-safe, immutable (returns a new value).
 */
export function mergeWith<TTarget extends Record<PropertyKey, unknown>, TSource extends Record<PropertyKey, unknown>>(
  target: TTarget,
  source: Partial<TSource>,
  customizer: MergeCustomizer,
  options: MergeOptions = {}
): TTarget & TSource {
  const { deep = true, overwrite = true, arrayStrategy = 'replace' } = options;
  const out: Record<PropertyKey, unknown> = isPlainObject(target) ? { ...target } : {};

  const walk = (
    dst: Record<PropertyKey, unknown>,
    src: Record<PropertyKey, unknown>,
    path: PropertyKey[]
  ): Record<PropertyKey, unknown> => {
    for (const k of Reflect.ownKeys(src)) {
      if (isPollutionKey(k)) continue;
      if (!Object.prototype.propertyIsEnumerable.call(src, k)) continue;

      const sVal = (src as Record<PropertyKey, unknown>)[k];
      const tVal = (dst as Record<PropertyKey, unknown>)[k];
      const nextPath = [...path, k];

      // let customizer take over
      const customized = customizer({
        key: k,
        path: nextPath,
        targetValue: tVal,
        sourceValue: sVal,
        targetObj: dst,
        sourceObj: src,
      });
      if (customized !== undefined) {
        dst[k] = customized;
        continue;
      }

      // default behavior
      if (sVal === undefined) continue;
      if (sVal === null) {
        if (overwrite) dst[k] = null;
        continue;
      }

      // arrays
      if (Array.isArray(sVal)) {
        if (Array.isArray(tVal)) {
          if (arrayStrategy === 'replace') {
            dst[k] = sVal.slice();
          } else if (arrayStrategy === 'concat') {
            dst[k] = (tVal as unknown[]).concat(sVal);
          } else {
            // index-wise merge
            const max = Math.max(tVal.length, sVal.length);
            const merged: unknown[] = new Array(max);
            for (let i = 0; i < max; i++) {
              const tv = tVal[i];
              const sv = sVal[i];
              if (sv === undefined) merged[i] = tv;
              else if (tv === undefined) merged[i] = deep ? deepClone(sv) : sv;
              else if (deep && isPlainObject(tv) && isPlainObject(sv)) {
                merged[i] = mergeWith(tv as Record<PropertyKey, unknown>, sv as Record<PropertyKey, unknown>, customizer, options);
              } else {
                merged[i] = sv;
              }
            }
            dst[k] = merged;
          }
        } else {
          dst[k] = sVal.slice();
        }
        continue;
      }

      // special objects copy-by-value
      if (sVal instanceof Date || sVal instanceof RegExp) { dst[k] = deep ? deepClone(sVal) : sVal; continue; }
      if (sVal instanceof Map) { dst[k] = new Map(sVal); continue; }
      if (sVal instanceof Set) { dst[k] = new Set(sVal); continue; }

      // plain-object deep merge
      if (deep && isPlainObject(sVal) && isPlainObject(tVal)) {
        dst[k] = walk({ ...(tVal as Record<PropertyKey, unknown>) }, sVal as Record<PropertyKey, unknown>, nextPath);
      } else {
        dst[k] = sVal;
      }
    }
    return dst;
  };

  return walk(out, (source ?? {}) as Record<PropertyKey, unknown>, []) as TTarget & TSource;
}

/** Deep merge (no customizer). */
export function deepMerge<TTarget extends Record<PropertyKey, unknown>, TSource extends Record<PropertyKey, unknown>>(
  target: TTarget,
  source: Partial<TSource>,
  options: MergeOptions = {}
): TTarget & TSource {
  return mergeWith(target, source, () => undefined, options);
}

/** Shallow merge (source wins on conflicts). */
export function shallowMerge<T1 extends object, T2 extends object>(a: T1, b: T2): T1 & T2 {
  return { ...(a as Record<string, unknown>), ...(b as Record<string, unknown>) } as T1 & T2;
}

/** Merge many (left→right). */
export function mergeMultiple<T extends Record<PropertyKey, unknown>>(
  objects: Array<Partial<T>>,
  options: MergeOptions = {}
): T {
  let acc = {} as T;
  for (const o of objects) acc = deepMerge(acc, o, options);
  return acc;
}

// =============================== Pick / Omit ===============================

export function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) {
    if (k in obj) (out as Record<PropertyKey, unknown>)[k as PropertyKey] = obj[k];
  }
  return out;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const out: Record<PropertyKey, unknown> = Array.isArray(obj) 
    ? Object.fromEntries((obj as unknown[]).map((v, i) => [i, v])) 
    : { ...(obj as Record<string, unknown>) };
  for (const k of keys) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete out[k as unknown as PropertyKey];
  }
  return out as Omit<T, K>;
}

export function pickBy<T extends Record<PropertyKey, unknown>>(
  obj: T,
  predicate: (value: unknown, key: PropertyKey) => boolean
): Partial<T> {
  const out: Record<PropertyKey, unknown> = {};
  for (const k of keysOf(obj as Record<string, unknown>)) {
    const v = (obj as Record<PropertyKey, unknown>)[k];
    if (predicate(v, k)) out[k] = v;
  }
  for (const s of symbolKeysOf(obj)) {
    const v = (obj as Record<PropertyKey, unknown>)[s];
    if (predicate(v, s)) out[s] = v;
  }
  return out as Partial<T>;
}

export function omitBy<T extends Record<PropertyKey, unknown>>(
  obj: T,
  predicate: (value: unknown, key: PropertyKey) => boolean
): Partial<T> {
  const out: Record<PropertyKey, unknown> = {};
  for (const k of keysOf(obj as Record<string, unknown>)) {
    const v = (obj as Record<PropertyKey, unknown>)[k];
    if (!predicate(v, k)) out[k] = v;
  }
  for (const s of symbolKeysOf(obj)) {
    const v = (obj as Record<PropertyKey, unknown>)[s];
    if (!predicate(v, s)) out[s] = v;
  }
  return out as Partial<T>;
}

// =============================== Map / Transform ===============================

export function mapKeys<T extends Record<PropertyKey, unknown>>(
  obj: T,
  keyMapper: (key: string) => string
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keysOf(obj as Record<string, unknown>)) out[keyMapper(String(k))] = (obj as Record<PropertyKey, unknown>)[k];
  for (const s of symbolKeysOf(obj)) out[keyMapper(String(s))] = (obj as Record<PropertyKey, unknown>)[s];
  return out;
}

export function mapValues<T extends Record<PropertyKey, unknown>, U>(
  obj: T,
  valueMapper: (value: unknown, key: PropertyKey) => U
): Record<PropertyKey, U> {
  const out: Record<PropertyKey, U> = {};
  for (const k of keysOf(obj as Record<string, unknown>)) out[k] = valueMapper((obj as Record<PropertyKey, unknown>)[k], k);
  for (const s of symbolKeysOf(obj)) out[s] = valueMapper((obj as Record<PropertyKey, unknown>)[s], s);
  return out;
}

export function mapEntries<T extends Record<PropertyKey, unknown>, U>(
  obj: T,
  transformer: (entry: [PropertyKey, unknown]) => [string, U]
): Record<string, U> {
  const out: Record<string, U> = {};
  for (const k of keysOf(obj as Record<string, unknown>)) {
    const [nk, nv] = transformer([k, (obj as Record<PropertyKey, unknown>)[k]]);
    out[nk] = nv;
  }
  for (const s of symbolKeysOf(obj)) {
    const [nk, nv] = transformer([s, (obj as Record<PropertyKey, unknown>)[s]]);
    out[nk] = nv;
  }
  return out;
}

export function invert<T extends Record<string, string>>(obj: T): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(obj)) {
    const value = obj[k];
    if (value !== undefined) {
      out[value] = k;
    }
  }
  return out;
}

// =============================== Equality / Size ===============================

/** Deep structural equality (handles cycles, Maps/Sets, Dates/RegExps). */
export function isEqual(a: unknown, b: unknown): boolean {
  const seen = new WeakMap<object, object>();

  const eq = (x: unknown, y: unknown): boolean => {
    if (x === y) return x !== 0 || 1 / (x as number) === 1 / (y as number); // -0/+0
    if (Number.isNaN(x) && Number.isNaN(y)) return true;
    if (x == null || y == null) return false;
    const tx = typeof x, ty = typeof y;
    if (tx !== ty) return false;
    if (tx !== 'object') return false;

    // cycles
    if (seen.get(x as object) === (y as object)) return true;
    seen.set(x as object, y as object);

    if (x instanceof Date && y instanceof Date) return x.getTime() === y.getTime();
    if (x instanceof RegExp && y instanceof RegExp) return x.source === y.source && x.flags === y.flags;

    if (Array.isArray(x) || Array.isArray(y)) {
      if (!(Array.isArray(x) && Array.isArray(y))) return false;
      if (x.length !== y.length) return false;
      for (let i = 0; i < x.length; i++) if (!eq(x[i], y[i])) return false;
      return true;
    }

    if (x instanceof Map && y instanceof Map) {
      if (x.size !== y.size) return false;
      for (const [k, v] of x) {
        if (!y.has(k)) return false;
        if (!eq(v, y.get(k))) return false;
      }
      return true;
    }

    if (x instanceof Set && y instanceof Set) {
      if (x.size !== y.size) return false;
      for (const v of x) if (!y.has(v)) return false;
      return true;
    }

    if (!isPlainObject(x) || !isPlainObject(y)) return false;
    const xKeys = [...Object.keys(x), ...Object.getOwnPropertySymbols(x)];
    const yKeys = [...Object.keys(y), ...Object.getOwnPropertySymbols(y)];
    if (xKeys.length !== yKeys.length) return false;
    for (const k of xKeys) {
      if (!hasOwn(y, k)) return false;
      if (!eq((x as any)[k], (y as any)[k])) return false;
    }
    return true;
  };

  return eq(a, b);
}

export function isObjectEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v !== 'object') return false;
  if (Array.isArray(v)) return v.length === 0;
  return Object.keys(v).length === 0 && Object.getOwnPropertySymbols(v).length === 0;
}

export const hasProperties = (v: unknown): boolean => !isObjectEmpty(v);

export function getObjectSize(v: unknown): number {
  if (v == null || typeof v !== 'object') return 0;
  if (Array.isArray(v)) return v.length;
  return Object.keys(v).length + Object.getOwnPropertySymbols(v).length;
}

// =============================== Path parsing ===============================

/**
 * Parses paths like:
 *  - a.b.c
 *  - a[0].b
 *  - a['weird.key'][2]
 */
export function parsePath(path: string): PropertyKey[] {
  const tokens: PropertyKey[] = [];
  let i = 0;

  const push = (s: string) => {
    if (s === '') return;
    const n = Number(s);
    tokens.push(Number.isFinite(n) && String(n) === s ? n : s);
  };

  while (i < path.length) {
    if (path[i] === '.') { i++; continue; }
    if (path[i] === '[') {
      // bracket segment
      i++;
      // quoted key?
      if (path[i] === "'" || path[i] === '"') {
        const quote = path[i++];
        let buf = '';
        while (i < path.length && path[i] !== quote) {
          if (path[i] === '\\' && i + 1 < path.length) { buf += path[i + 1]; i += 2; }
          else { buf += path[i++]; }
        }
        i++; // skip closing quote
        while (i < path.length && path[i] !== ']') i++;
        i++; // skip ]
        push(buf);
      } else {
        // number or bare identifier until ]
        let buf = '';
        while (i < path.length && path[i] !== ']') buf += path[i++];
        i++; // skip ]
        push(buf.trim());
      }
    } else {
      // dot segment
      let buf = '';
      while (i < path.length && path[i] !== '.' && path[i] !== '[') buf += path[i++];
      push(buf);
    }
  }
  return tokens;
}

// =============================== Path ops (get/set/unset/update) ===============================

export function hasPath(obj: unknown, path: string): boolean {
  const segs = parsePath(path);
  let cur: unknown = obj;
  for (const k of segs) {
    if (cur == null || typeof cur !== 'object' || !hasOwn(cur, k)) return false;
    cur = (cur as any)[k];
  }
  return true;
}

export function getPath<T = unknown>(obj: unknown, path: string, defaultValue?: T): T | undefined {
  const segs = parsePath(path);
  let cur: unknown = obj;
  for (const k of segs) {
    if (cur == null || typeof cur !== 'object') return defaultValue;
    cur = (cur as any)[k];
  }
  return (cur === undefined ? defaultValue : (cur as T));
}

export function setPath<T>(obj: T, path: string, value: unknown): T {
  return setPathWith(obj, path, () => value);
}

export function setPathWith<T>(obj: T, path: string, updater: (prev: unknown) => unknown): T {
  const segs = parsePath(path);
  const out = deepClone(obj);
  let cur: unknown = out;

  for (let i = 0; i < segs.length - 1; i++) {
    const k = segs[i]!;
    if (typeof k === 'string' && isPollutionKey(k)) return out;
    const nextK = segs[i + 1]!;
    const shouldArray = typeof nextK === 'number';

    // @ts-expect-error: index via PropertyKey
    let next: unknown = cur[k];
    if (next == null || typeof next !== 'object' || Array.isArray(next) !== shouldArray) {
      next = shouldArray ? [] : {};
      // @ts-expect-error: index via PropertyKey
      cur[k] = next;
    }
    cur = next;
  }

  const last = segs[segs.length - 1]!;
  if (typeof last === 'string' && isPollutionKey(last)) return out;
  // @ts-expect-error: index via PropertyKey
  const prev = cur[last];
  // @ts-expect-error: index via PropertyKey
  cur[last] = updater(prev);
  return out;
}

export function unsetPath<T>(obj: T, path: string): T {
  const segs = parsePath(path);
  const out = deepClone(obj);
  let cur: unknown = out;
  for (let i = 0; i < segs.length - 1; i++) {
    const k = segs[i]!;
    // @ts-expect-error: index via PropertyKey
    if (cur == null || typeof cur !== 'object' || cur[k] == null) return out;
    // @ts-expect-error: index via PropertyKey
    cur = cur[k];
  }
  const last = segs[segs.length - 1]!;
  if (typeof last === 'string' && isPollutionKey(last)) return out;
  // @ts-expect-error: index via PropertyKey
  if (cur && typeof cur === 'object') delete cur[last];
  return out;
}

// =============================== Converters / small utils ===============================

export function fromPairs(pairs: ReadonlyArray<readonly [string, unknown]>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of pairs) out[k] = v;
  return out;
}

export function toPairs(obj: unknown): Array<[string, unknown]> {
  const out: Array<[string, unknown]> = [];
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) out.push([k, (obj as Record<string, unknown>)[k]]);
    for (const s of Object.getOwnPropertySymbols(obj)) out.push([String(s), (obj as Record<PropertyKey, unknown>)[s]]);
  }
  return out;
}

export function fromKeys(keys: ReadonlyArray<string>, value: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = value;
  return out;
}

// =============================== Opinionated “safe object” helpers ===============================

/** Deep-merge `overrides` onto `defaults` with overwrite + replace arrays (idempotent for config). */
export function createSafeObject<T extends Record<PropertyKey, unknown>>(
  defaults: T,
  overrides: DeepPartial<T> = {}
): T {
  return deepMerge(defaults, overrides as Partial<T>, { deep: true, overwrite: true, arrayStrategy: 'replace' });
}

/** Remove properties whose value is strictly `undefined` (keeps nulls). */
export function sanitizeObject<T extends Record<PropertyKey, unknown>>(obj: T): Partial<T> {
  return omitBy(obj, (v) => v === undefined);
}

/** camelCase key normalizer (keeps symbols) */
export function normalizeKeys<T extends Record<PropertyKey, unknown>>(obj: T): Record<string, unknown> {
  const toCamel = (k: string) => k.replace(/[-\s]+/g, '_').replace(/_+([a-zA-Z0-9])/g, (_, c) => String(c).toUpperCase());
  return mapKeys(obj, toCamel);
}

/** snake_case key normalizer (keeps symbols) */
export function denormalizeKeys<T extends Record<PropertyKey, unknown>>(obj: T): Record<string, unknown> {
  const toSnake = (k: string) =>
    k.replace(/([A-Z])/g, '_$1').replace(/[-\s]+/g, '_').replace(/__+/g, '_').toLowerCase();
  return mapKeys(obj, toSnake);
}
