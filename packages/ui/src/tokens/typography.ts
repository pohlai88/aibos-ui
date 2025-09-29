/**
 * Typography Design Tokens
 *
 * Enterprise-grade typography system with consistent scale.
 * All typography values use CSS variables for theming support.
 */

import { safeGet } from '../utils/internal';

const CSS_VAR_PREFIX = 'aibos' as const;

export const typography = {
  // Font Families
  fontFamily: {
    sans: `var(--${CSS_VAR_PREFIX}-font-family-sans)`,
    serif: `var(--${CSS_VAR_PREFIX}-font-family-serif)`,
    mono: `var(--${CSS_VAR_PREFIX}-font-family-mono)`,
    display: `var(--${CSS_VAR_PREFIX}-font-family-display)`,
  },

  // Font Sizes
  fontSize: {
    xs: `var(--${CSS_VAR_PREFIX}-font-size-xs)`, // 12px
    sm: `var(--${CSS_VAR_PREFIX}-font-size-sm)`, // 14px
    base: `var(--${CSS_VAR_PREFIX}-font-size-base)`, // 16px
    lg: `var(--${CSS_VAR_PREFIX}-font-size-lg)`, // 18px
    xl: `var(--${CSS_VAR_PREFIX}-font-size-xl)`, // 20px
    '2xl': `var(--${CSS_VAR_PREFIX}-font-size-2xl)`, // 24px
    '3xl': `var(--${CSS_VAR_PREFIX}-font-size-3xl)`, // 30px
    '4xl': `var(--${CSS_VAR_PREFIX}-font-size-4xl)`, // 36px
    '5xl': `var(--${CSS_VAR_PREFIX}-font-size-5xl)`, // 48px
    '6xl': `var(--${CSS_VAR_PREFIX}-font-size-6xl)`, // 60px
    '7xl': `var(--${CSS_VAR_PREFIX}-font-size-7xl)`, // 72px
    '8xl': `var(--${CSS_VAR_PREFIX}-font-size-8xl)`, // 96px
    '9xl': `var(--${CSS_VAR_PREFIX}-font-size-9xl)`, // 128px
  },

  // Font Weights
  fontWeight: {
    thin: `var(--${CSS_VAR_PREFIX}-font-weight-thin)`, // 100
    extralight: `var(--${CSS_VAR_PREFIX}-font-weight-extralight)`, // 200
    light: `var(--${CSS_VAR_PREFIX}-font-weight-light)`, // 300
    normal: `var(--${CSS_VAR_PREFIX}-font-weight-normal)`, // 400
    medium: `var(--${CSS_VAR_PREFIX}-font-weight-medium)`, // 500
    semibold: `var(--${CSS_VAR_PREFIX}-font-weight-semibold)`, // 600
    bold: `var(--${CSS_VAR_PREFIX}-font-weight-bold)`, // 700
    extrabold: `var(--${CSS_VAR_PREFIX}-font-weight-extrabold)`, // 800
    black: `var(--${CSS_VAR_PREFIX}-font-weight-black)`, // 900
  },

  // Line Heights
  lineHeight: {
    none: `var(--${CSS_VAR_PREFIX}-line-height-none)`, // 1
    tight: `var(--${CSS_VAR_PREFIX}-line-height-tight)`, // 1.25
    snug: `var(--${CSS_VAR_PREFIX}-line-height-snug)`, // 1.375
    normal: `var(--${CSS_VAR_PREFIX}-line-height-normal)`, // 1.5
    relaxed: `var(--${CSS_VAR_PREFIX}-line-height-relaxed)`, // 1.625
    loose: `var(--${CSS_VAR_PREFIX}-line-height-loose)`, // 2
  },

  // Letter Spacing
  letterSpacing: {
    tighter: `var(--${CSS_VAR_PREFIX}-letter-spacing-tighter)`, // -0.05em
    tight: `var(--${CSS_VAR_PREFIX}-letter-spacing-tight)`, // -0.025em
    normal: `var(--${CSS_VAR_PREFIX}-letter-spacing-normal)`, // 0em
    wide: `var(--${CSS_VAR_PREFIX}-letter-spacing-wide)`, // 0.025em
    wider: `var(--${CSS_VAR_PREFIX}-letter-spacing-wider)`, // 0.05em
    widest: `var(--${CSS_VAR_PREFIX}-letter-spacing-widest)`, // 0.1em
  },
} as const;

/**
 * Semantic typography tokens for consistent text styling
 */
export const semanticTypography = {
  // Headings
  'heading-1': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-4xl)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-bold)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-tight)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-tight)`,
  },
  'heading-2': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-3xl)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-semibold)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-tight)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-tight)`,
  },
  'heading-3': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-2xl)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-semibold)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-snug)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-normal)`,
  },
  'heading-4': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-xl)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-medium)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-snug)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-normal)`,
  },
  'heading-5': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-lg)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-medium)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-normal)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-normal)`,
  },
  'heading-6': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-base)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-medium)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-normal)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-normal)`,
  },

  // Body Text
  'body-large': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-lg)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-normal)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-relaxed)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-normal)`,
  },
  'body-base': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-base)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-normal)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-normal)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-normal)`,
  },
  'body-small': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-sm)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-normal)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-normal)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-normal)`,
  },

  // Labels and Captions
  'label-large': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-sm)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-medium)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-normal)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-wide)`,
  },
  'label-base': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-xs)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-medium)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-normal)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-wide)`,
  },
  'label-small': {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-xs)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-normal)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-normal)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-wide)`,
  },

  // Captions
  caption: {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-xs)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-normal)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-normal)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-normal)`,
  },

  // Code
  code: {
    fontSize: `var(--${CSS_VAR_PREFIX}-font-size-sm)`,
    fontWeight: `var(--${CSS_VAR_PREFIX}-font-weight-normal)`,
    lineHeight: `var(--${CSS_VAR_PREFIX}-line-height-normal)`,
    letterSpacing: `var(--${CSS_VAR_PREFIX}-letter-spacing-normal)`,
    fontFamily: `var(--${CSS_VAR_PREFIX}-font-family-mono)`,
  },
} as const;

/**
 * Typography token resolver for dynamic typography access
 */
type TypoCategoryKey = 'fontFamily' | 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing';
type AnyTypoPath = `${TypoCategoryKey}.${string}` | `semantic.${keyof typeof semanticTypography}`;

export const typographyResolver = {
  /**
   * Get typography value by path
   * @param path - Typography path (e.g., 'fontSize.lg', 'semantic.heading-1')
   * @returns Typography value
   */
  getValue<T extends AnyTypoPath>(path: T, options?: { strict?: boolean }): string | object {
    const keys = path.split('.') as string[];
    let current: Record<string, unknown> = typography;

    for (const key of keys) {
      current = safeGet(current, key) as Record<string, unknown>;
      if (current === undefined) {
        // Try semantic typography
        if (keys[0] === 'semantic' && keys[1] && keys[1] in semanticTypography) {
          return (
            safeGet(
              semanticTypography,
              keys[1] as keyof typeof semanticTypography,
            ) || path
          );
        }
        if (options?.strict) throw new Error(`Typography token not found: ${path}`);
        // Development warning for unknown typography paths
        if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
          console.warn(`[typography] Unknown path "${path}" – returning path as CSS var.`);
        }
        // Return a best-effort var() so UI doesn't crash
        return `var(--${CSS_VAR_PREFIX}-${path.replaceAll('.', '-')})`;
      }
    }

    return current as string | object;
  },

  /**
   * Convert typography path to CSS variable name (without var())
   * @param path - Typography path
   * @returns CSS variable name
   */
  toCSSVar(path: string): string {
    // kept for back-compat; alias of toVarName
    return this.toVarName(path as AnyTypoPath);
  },

  /**
   * Get CSS var() from path
   */
  toVar<T extends AnyTypoPath>(path: T): string {
    return `var(--${CSS_VAR_PREFIX}-${String(path).replaceAll('.', '-')})`;
  },

  /**
   * Get CSS variable name from path (without var())
   */
  toVarName<T extends AnyTypoPath>(path: T): string {
    return `--${CSS_VAR_PREFIX}-${String(path).replaceAll('.', '-')}`;
  },

  /**
   * Guards & metadata
   */
  exists(path: string): boolean {
    const keys = path.split('.') as string[];
    if (keys[0] === 'semantic') {
      return Boolean(keys[1] && keys[1] in semanticTypography);
    }
    let current: Record<string, unknown> = typography;
    for (const key of keys) {
      if (!(key in current)) return false;
      current = safeGet(current, key) as Record<string, unknown>;
    }
    return true;
  },
} as const;

export type TypographyToken = typeof typography;
export type SemanticTypographyToken = typeof semanticTypography;
export type FontSizeKey = keyof typeof typography.fontSize;
export type FontWeightKey = keyof typeof typography.fontWeight;
export type LineHeightKey = keyof typeof typography.lineHeight;
export type LetterSpacingKey = keyof typeof typography.letterSpacing;
export type SemanticTypographyKey = keyof typeof semanticTypography;

/**
 * Tailwind bridges (optional): spread into theme.* for token-driven config.
 */
export const fontFamilyThemeBridge = { ...typography.fontFamily } as Record<string, string>;
export const fontSizeThemeBridge = { ...typography.fontSize } as Record<string, string>;
export const fontWeightThemeBridge = { ...typography.fontWeight } as Record<string, string>;
export const lineHeightThemeBridge = { ...typography.lineHeight } as Record<string, string>;
export const letterSpacingThemeBridge = { ...typography.letterSpacing } as Record<string, string>;
