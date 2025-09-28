/**
 * Type Guards and Utilities
 *
 * Policy:
 * - Internal code: use `undefined` for omitted/absent values
 * - DTO/DB/JSON:   use `null` for intentionally empty values
 * - React components: return `null` for empty renders
 */

// ---------- Core nullability ----------
export const isNonNullish = <T>(v: T): v is Exclude<T, null | undefined> =>
  v !== null && v !== undefined;

export const toNullable = <T>(v: T | null | undefined): T | null => v ?? null;
export const toUndefinable = <T>(v: T | null | undefined): T | undefined => v ?? undefined;

// Safer primitive → string coercers (no "[object Object]")
export const toNullableString = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (
    typeof v === 'number' ||
    typeof v === 'boolean' ||
    typeof v === 'bigint' ||
    typeof v === 'symbol'
  )
    return String(v);
  return null; // objects/functions → null (don't stringify)
};

export const toUndefinableString = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === 'string') return v;
  if (
    typeof v === 'number' ||
    typeof v === 'boolean' ||
    typeof v === 'bigint' ||
    typeof v === 'symbol'
  )
    return String(v);
  return undefined; // objects/functions → undefined
};

// ---------- General-purpose guards ----------
export const isString = (v: unknown): v is string => typeof v === 'string';
export const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  Object.prototype.toString.call(v) === '[object Object]';

// ---------- React children narrowing ----------
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type ElementType,
} from 'react';

/** Normalize to elements (filters out text, booleans, null, etc.) */
export const narrowToElements = (children: ReactNode | ReactNode[]): readonly ReactElement[] =>
  Children.toArray(children).filter(isValidElement) as ReactElement[];

/** Single node guard */
export const isReactElement = <P extends object = Record<string, unknown>>(
  node: ReactNode,
): node is ReactElement<P> => isValidElement(node);

/**
 * Match only elements of given component types.
 * Works with direct references AND displayName (useful for HOCs).
 */
export const elementsOf = <P extends object = Record<string, unknown>>(
  children: ReactNode | ReactNode[],
  types: readonly ElementType[],
): readonly ReactElement<P>[] => {
  const names = new Set(
    types
      .map((t) =>
        typeof t === 'function' ? (t as { displayName?: string }).displayName : undefined,
      )
      .filter(Boolean),
  );
  return narrowToElements(children).filter((element) => {
    const elementType = element.type as ElementType & { displayName?: string };
    return (
      types.includes(elementType) ||
      (elementType &&
        typeof elementType === 'function' &&
        elementType.displayName &&
        names.has(elementType.displayName))
    );
  }) as ReactElement<P>[];
};
