/**
 * Color Design Tokens
 *
 * Enterprise-grade semantic color system with CSS variables.
 * All colors use semantic naming for maintainability and theming.
 */

import { safeGet } from '@aibos/utils';

const CSS_VAR_PREFIX = 'aibos' as const;

export const colors = {
  // Premium Neutral Palette - Soft, sophisticated neutrals
  neutral: {
    0: `hsl(var(--${CSS_VAR_PREFIX}-neutral-0))`,
    50: `hsl(var(--${CSS_VAR_PREFIX}-neutral-50))`,
    100: `hsl(var(--${CSS_VAR_PREFIX}-neutral-100))`,
    200: `hsl(var(--${CSS_VAR_PREFIX}-neutral-200))`,
    300: `hsl(var(--${CSS_VAR_PREFIX}-neutral-300))`,
    400: `hsl(var(--${CSS_VAR_PREFIX}-neutral-400))`,
    500: `hsl(var(--${CSS_VAR_PREFIX}-neutral-500))`,
    600: `hsl(var(--${CSS_VAR_PREFIX}-neutral-600))`,
    700: `hsl(var(--${CSS_VAR_PREFIX}-neutral-700))`,
    800: `hsl(var(--${CSS_VAR_PREFIX}-neutral-800))`,
    900: `hsl(var(--${CSS_VAR_PREFIX}-neutral-900))`,
  },

  // Brand Colors - Sophisticated, muted accents
  brand: {
    400: `hsl(var(--${CSS_VAR_PREFIX}-brand-400))`,
    500: `hsl(var(--${CSS_VAR_PREFIX}-brand-500))`,
    600: `hsl(var(--${CSS_VAR_PREFIX}-brand-600))`,
  },

  // Accent Colors - Boutique, refined accents
  accent: {
    500: `hsl(var(--${CSS_VAR_PREFIX}-accent-500))`,
  },

  // Semantic Colors - Premium, sophisticated mapping
  semantic: {
    // Background Colors - Soft, elegant backgrounds
    background: `hsl(var(--${CSS_VAR_PREFIX}-semantic-background))`,
    'background-secondary': `hsl(var(--${CSS_VAR_PREFIX}-neutral-100))`,
    'background-tertiary': `hsl(var(--${CSS_VAR_PREFIX}-neutral-200))`,

    // Surface Colors - Clean, premium surfaces
    surface: `hsl(var(--${CSS_VAR_PREFIX}-semantic-card))`,
    'surface-secondary': `hsl(var(--${CSS_VAR_PREFIX}-neutral-100))`,
    'surface-tertiary': `hsl(var(--${CSS_VAR_PREFIX}-neutral-200))`,

    // Text Colors - Sophisticated typography
    foreground: `hsl(var(--${CSS_VAR_PREFIX}-semantic-foreground))`,
    'foreground-secondary': `hsl(var(--${CSS_VAR_PREFIX}-neutral-600))`,
    'foreground-tertiary': `hsl(var(--${CSS_VAR_PREFIX}-neutral-500))`,
    'muted-foreground': `hsl(var(--${CSS_VAR_PREFIX}-semantic-muted-foreground))`,

    // Border Colors - Subtle, refined borders
    border: `hsl(var(--${CSS_VAR_PREFIX}-semantic-border))`,
    'border-secondary': `hsl(var(--${CSS_VAR_PREFIX}-neutral-200))`,
    'border-tertiary': `hsl(var(--${CSS_VAR_PREFIX}-neutral-300))`,

    // Interactive Colors - Premium interactions
    ring: `hsl(var(--${CSS_VAR_PREFIX}-semantic-ring))`,
    'ring-offset': `hsl(var(--${CSS_VAR_PREFIX}-neutral-0))`,

    // Status Colors - Boutique, refined status
    success: `hsl(var(--${CSS_VAR_PREFIX}-success))`,
    'success-foreground': `hsl(var(--${CSS_VAR_PREFIX}-success-foreground))`,
    warning: `hsl(var(--${CSS_VAR_PREFIX}-warning))`,
    'warning-foreground': `hsl(var(--${CSS_VAR_PREFIX}-warning-foreground))`,
    destructive: `hsl(var(--${CSS_VAR_PREFIX}-semantic-destructive))`,
    'destructive-foreground': `hsl(var(--${CSS_VAR_PREFIX}-semantic-destructive-foreground))`,
    info: `hsl(var(--${CSS_VAR_PREFIX}-info))`,
    'info-foreground': `hsl(var(--${CSS_VAR_PREFIX}-info-foreground))`,

    // Accent Colors - Sophisticated accents
    accent: `hsl(var(--${CSS_VAR_PREFIX}-semantic-accent))`,
    'accent-foreground': `hsl(var(--${CSS_VAR_PREFIX}-semantic-accent-foreground))`,

    // Popover Colors - Clean, premium popovers
    popover: `hsl(var(--${CSS_VAR_PREFIX}-semantic-popover))`,
    'popover-foreground': `hsl(var(--${CSS_VAR_PREFIX}-semantic-popover-foreground))`,

    // Card Colors - Elegant, refined cards
    card: `hsl(var(--${CSS_VAR_PREFIX}-semantic-card))`,
    'card-foreground': `hsl(var(--${CSS_VAR_PREFIX}-semantic-card-foreground))`,

    // Input Colors - Clean, sophisticated inputs
    input: `hsl(var(--${CSS_VAR_PREFIX}-semantic-input))`,
    'input-foreground': `hsl(var(--${CSS_VAR_PREFIX}-semantic-foreground))`,

    // Primary Colors - Premium brand colors
    primary: `hsl(var(--${CSS_VAR_PREFIX}-semantic-primary))`,
    'primary-foreground': `hsl(var(--${CSS_VAR_PREFIX}-semantic-primary-foreground))`,

    // Muted Colors - Subtle, refined muted elements
    muted: `hsl(var(--${CSS_VAR_PREFIX}-semantic-muted))`,
  },
} as const;

// ===========================
// 🔒 Typed resolver utilities
// ===========================
export type ColorToken = typeof colors;
export type SemanticColor = keyof typeof colors.semantic;
export type BrandColor = keyof typeof colors.brand;
export type AccentColor = keyof typeof colors.accent;
export type NeutralColor = keyof typeof colors.neutral;

// Valid token paths (compile-time safety for callers)
export type ColorPath =
  | `neutral.${NeutralColor}`
  | `brand.${BrandColor}`
  | `accent.${AccentColor}`
  | `semantic.${SemanticColor}`;

function getByPath<T extends object>(object: T, path: string): unknown {
  return path.split('.').reduce<unknown>((accumulator, key) => {
    if (
      accumulator &&
      typeof accumulator === 'object' &&
      key in (accumulator as Record<string, unknown>)
    ) {
      return safeGet(
        accumulator as Record<string, unknown>,
        key,
        Object.keys(accumulator as Record<string, unknown>),
      );
    }
    throw new Error(`Color token not found: ${path}`);
  }, object as unknown);
}

/**
 * Color token resolver for dynamic color access (typed)
 */
export const colorResolver = {
  /** Get the HSL/var string value, e.g. `hsl(var(--aibos-primary-500))` */
  getValue(path: ColorPath, options?: { strict?: boolean }): string {
    try {
      return getByPath(colors, path) as string;
    } catch {
      if (options?.strict) throw new Error(`Color token not found: ${path}`);
      // Development warning for unknown color paths
      if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
        console.warn(`[colors] Unknown path "${path}" – falling back to 'hsl(0 0% 0% / 0)'`);
      }
      return 'hsl(0 0% 0% / 0)'; // transparent fallback
    }
  },
  /** Get the CSS variable name, e.g. `--aibos-primary-500` */
  toCSSVar(path: ColorPath): string {
    return `--${CSS_VAR_PREFIX}-${path.replace(/\./g, '-')}`;
  },
  /** Convenience: `hsl(var(--aibos-…))` built from a path (mirrors token format) */
  toHSLVar(path: ColorPath): string {
    return `hsl(var(${this.toCSSVar(path)}))`;
  },
  /** Tailwind-friendly opacity helper: `hsl(var(--token)/opacity)` */
  withOpacity(path: ColorPath, opacity: number | `${number}%`): string {
    const variableName = this.toCSSVar(path);
    const op = typeof opacity === 'number' ? String(opacity) : opacity;
    return `hsl(var(${variableName}) / ${op})`;
  },
  /** Boolean existence check */
  exists(path: string): path is ColorPath {
    try {
      return typeof getByPath(colors, path) === 'string';
    } catch {
      return false;
    }
  },
} as const;

/**
 * Premium color bridge for Tailwind theme.colors:
 *   theme: { colors: { ...colorThemeBridge } }
 * Preserves your `hsl(var(--...))` format with premium palette.
 */
export const colorThemeBridge: Record<string, string> = (() => {
  const flatten = (object: Record<string, unknown>, prefix = ''): Record<string, string> => {
    return Object.fromEntries(
      Object.entries(object).flatMap(([k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'string') return [[key, v]] as [string, string][];
        return Object.entries(flatten(v as Record<string, unknown>, key));
      }),
    );
  };
  // Flatten then convert dotted paths to Tailwind-friendly keys with dashes.
  const flat = flatten(colors);

  return Object.fromEntries(
    Object.entries(flat).map(([k, v]) => [k.replace(/\./g, '-'), v as string]),
  ) as Record<string, string>;
})();
