/**
 * omitUndefined
 * Removes keys whose values are strictly `undefined`.
 * The return type excludes `undefined` from property types to play nicely
 * with `exactOptionalPropertyTypes`.
 */
export function omitUndefined<T extends object>(obj: T): {
  [K in keyof T as undefined extends T[K] ? K : K]: Exclude<T[K], undefined>
} {
  const out: Record<string, unknown> = {};
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const v = (obj as Record<string, unknown>)[k];
      if (v !== undefined) out[k] = v;
    }
  }
  return out as any;
}

/**
 * omitUndefinedDeep (optional)
 * Deep variant – only if you actually need it. Safe for nested objects/arrays.
 */
export function omitUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(omitUndefinedDeep) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = omitUndefinedDeep(v);
    }
    return out as unknown as T;
  }
  return value;
}

/**
 * Conditionally include a single property in a type-safe way.
 * True branch returns a typed single-key object; false branch returns {}.
 */
/* eslint-disable no-redeclare */
export function conditionalProperty<K extends PropertyKey, V>(
  condition: true,
  key: K,
  value: V,
): { [P in K]: V };
export function conditionalProperty<K extends PropertyKey, V>(
  condition: false,
  key: K,
  value: V,
): {};
export function conditionalProperty<K extends PropertyKey, V>(
  condition: boolean,
  key: K,
  value: V,
): { [P in K]: V } | {} {
  return condition ? ({ [key]: value } as { [P in K]: V }) : {};
}
/* eslint-enable no-redeclare */

/**
 * Builds an object with conditional properties from tuples.
 */
export function buildConditionalObject<T extends object, K extends keyof T>(
  ...props: Array<[boolean, K, T[K]]>
): Partial<T> {
  const out = {} as Partial<T>;
  for (const [cond, key, value] of props) {
    if (cond) (out as Record<string, unknown>)[key as string] = value;
  }
  return out;
}

/**
 * Safely spreads an object, omitting undefined values and narrowing types.
 */
export function safeSpread<T extends Record<string, unknown>>(object: Partial<T>): Partial<T> {
  return omitUndefined(object as T) as Partial<T>;
}
