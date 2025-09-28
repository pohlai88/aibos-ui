/**
 * Shadow Design Tokens
 *
 * Enterprise-grade shadow system with consistent elevation.
 * All shadow values use CSS variables for theming support.
 */

const CSS_VAR_PREFIX = 'aibos' as const;

export const shadows = {
  // Premium shadow system - Subtle, sophisticated depth
  none: 'none',
  'elev-1': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`, // Subtle elevation
  'elev-2': `var(--${CSS_VAR_PREFIX}-shadow-elev-2)`, // Medium elevation
  'elev-3': `var(--${CSS_VAR_PREFIX}-shadow-elev-3)`, // High elevation

  // Legacy shadows (kept for compatibility)
  sm: `var(--${CSS_VAR_PREFIX}-shadow-sm)`,
  base: `var(--${CSS_VAR_PREFIX}-shadow-base)`,
  md: `var(--${CSS_VAR_PREFIX}-shadow-md)`,
  lg: `var(--${CSS_VAR_PREFIX}-shadow-lg)`,
  xl: `var(--${CSS_VAR_PREFIX}-shadow-xl)`,
  '2xl': `var(--${CSS_VAR_PREFIX}-shadow-2xl)`,
  inner: `var(--${CSS_VAR_PREFIX}-shadow-inner)`,
} as const;

/**
 * Premium semantic shadow tokens for sophisticated component elevation
 */
export const semanticShadows = {
  // Component shadows - Premium, subtle elevation
  component: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  'component-hover': `var(--${CSS_VAR_PREFIX}-shadow-elev-2)`,
  'component-active': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,

  // Card shadows - Elegant, refined cards
  card: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  'card-hover': `var(--${CSS_VAR_PREFIX}-shadow-elev-2)`,
  'card-active': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,

  // Modal/Dialog shadows - Premium, sophisticated modals
  modal: `var(--${CSS_VAR_PREFIX}-shadow-elev-3)`,
  'modal-backdrop': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,

  // Popover shadows - Clean, elegant popovers
  popover: `var(--${CSS_VAR_PREFIX}-shadow-elev-2)`,
  'popover-hover': `var(--${CSS_VAR_PREFIX}-shadow-elev-3)`,

  // Tooltip shadows - Subtle, refined tooltips
  tooltip: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,

  // Dropdown shadows - Clean, sophisticated dropdowns
  dropdown: `var(--${CSS_VAR_PREFIX}-shadow-elev-2)`,
  'dropdown-hover': `var(--${CSS_VAR_PREFIX}-shadow-elev-3)`,

  // Button shadows - Premium, elegant buttons
  button: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  'button-hover': `var(--${CSS_VAR_PREFIX}-shadow-elev-2)`,
  'button-active': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  'button-focus': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,

  // Input shadows - Clean, sophisticated inputs
  input: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  'input-focus': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  'input-error': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,

  // Table shadows - Elegant, refined tables
  table: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  'table-header': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,

  // Navigation shadows - Clean, sophisticated navigation
  nav: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  'nav-item': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  'nav-item-hover': `var(--${CSS_VAR_PREFIX}-shadow-elev-2)`,
  'nav-item-active': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,

  // Form shadows - Elegant, refined forms
  form: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  'form-section': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,

  // Status shadows - Subtle, refined status indicators
  success: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  warning: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  error: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  info: `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,

  // Elevation shadows - Premium elevation system
  'elevation-1': `var(--${CSS_VAR_PREFIX}-shadow-elev-1)`,
  'elevation-2': `var(--${CSS_VAR_PREFIX}-shadow-elev-2)`,
  'elevation-3': `var(--${CSS_VAR_PREFIX}-shadow-elev-3)`,
  'elevation-4': `var(--${CSS_VAR_PREFIX}-shadow-elev-3)`,
  'elevation-5': `var(--${CSS_VAR_PREFIX}-shadow-elev-3)`,
} as const;

/**
 * Shadow token resolver for dynamic shadow access
 */
type AnyShadowKey = keyof typeof shadows | keyof typeof semanticShadows;

export const shadowResolver = {
  /**
   * Get shadow value by key
   * @param key - Shadow key (e.g., 'lg', 'component', 'modal')
   * @returns Shadow value
   */
  getValue<T extends AnyShadowKey>(key: T, options?: { strict?: boolean }): string {
    if ((key as string) in shadows) return shadows[key as keyof typeof shadows];
    if ((key as string) in semanticShadows)
      return semanticShadows[key as keyof typeof semanticShadows];
    if (options?.strict) throw new Error(`Shadow token not found: ${String(key)}`);
    // Development warning for unknown shadow keys
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      console.warn(`[shadows] Unknown key "${String(key)}" – falling back to "none".`);
    }
    return 'none';
  },

  /**
   * Get CSS var() string from key
   * @param key - Shadow key
   * @returns CSS variable string like var(--aibos-shadow-xxx)
   */
  toVar<T extends AnyShadowKey>(key: T): string {
    if ((key as string) in shadows) return `var(--${CSS_VAR_PREFIX}-shadow-${String(key)})`;
    if ((key as string) in semanticShadows) return `var(--${CSS_VAR_PREFIX}-shadow-${String(key)})`;
    throw new Error(`Shadow token not found: ${String(key)}`);
  },

  /**
   * Get CSS variable name (without var())
   */
  toVarName<T extends AnyShadowKey>(key: T): string {
    if ((key as string) in shadows || (key as string) in semanticShadows) {
      return `--${CSS_VAR_PREFIX}-shadow-${String(key)}`;
    }
    throw new Error(`Shadow token not found: ${String(key)}`);
  },

  /**
   * Utility guards and metadata
   */
  isShadowKey(key: string): key is keyof typeof shadows {
    return key in shadows;
  },
  isSemanticShadowKey(key: string): key is keyof typeof semanticShadows {
    return key in semanticShadows;
  },
  exists(key: string): key is AnyShadowKey {
    return key in shadows || key in semanticShadows;
  },
  keys(): ReadonlyArray<AnyShadowKey> {
    return [...Object.keys(shadows), ...Object.keys(semanticShadows)] as AnyShadowKey[];
  },
  entries(): ReadonlyArray<readonly [AnyShadowKey, string]> {
    return [...Object.entries(shadows), ...Object.entries(semanticShadows)] as ReadonlyArray<
      readonly [AnyShadowKey, string]
    >;
  },
} as const;

export type ShadowToken = typeof shadows;
export type SemanticShadowToken = typeof semanticShadows;
export type ShadowKey = keyof typeof shadows;
export type SemanticShadowKey = keyof typeof semanticShadows;

/**
 * Premium elevation aliases (compact usage) – maps e1..e3 to elevation-1..3.
 * Sophisticated elevation system for premium UI components.
 */
export const elevationAlias: Record<`e${1 | 2 | 3}`, SemanticShadowKey> = {
  e1: 'elevation-1',
  e2: 'elevation-2',
  e3: 'elevation-3',
} as const;

/**
 * Premium shadow bridge for Tailwind theme.boxShadow:
 *   theme: { boxShadow: { ...shadowThemeBridge } }
 * Sophisticated elevation system for premium UI components.
 */

export const shadowThemeBridge: Record<string, string> = Object.fromEntries([
  ...Object.entries(shadows),
  ...Object.entries(semanticShadows),
]) as Record<string, string>;
