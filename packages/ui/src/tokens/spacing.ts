/**
 * Spacing Design Tokens
 *
 * Enterprise-grade spacing system with consistent scale.
 * All spacing values use CSS variables for theming support.
 */

const CSS_VAR_PREFIX = 'aibos' as const;

export const spacing = {
  // Base spacing scale (4px base unit)
  0: '0px',
  0.5: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 0.5)`, // 2px
  1: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 1)`, // 4px
  1.5: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 1.5)`, // 6px
  2: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 2)`, // 8px
  2.5: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 2.5)`, // 10px
  3: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 3)`, // 12px
  3.5: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 3.5)`, // 14px
  4: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 4)`, // 16px
  5: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 5)`, // 20px
  6: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 6)`, // 24px
  7: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 7)`, // 28px
  8: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 8)`, // 32px
  9: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 9)`, // 36px
  10: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 10)`, // 40px
  11: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 11)`, // 44px
  12: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 12)`, // 48px
  14: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 14)`, // 56px
  16: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 16)`, // 64px
  20: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 20)`, // 80px
  24: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 24)`, // 96px
  28: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 28)`, // 112px
  32: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 32)`, // 128px
  36: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 36)`, // 144px
  40: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 40)`, // 160px
  44: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 44)`, // 176px
  48: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 48)`, // 192px
  52: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 52)`, // 208px
  56: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 56)`, // 224px
  60: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 60)`, // 240px
  64: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 64)`, // 256px
  72: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 72)`, // 288px
  80: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 80)`, // 320px
  96: `calc(var(--${CSS_VAR_PREFIX}-spacing-unit) * 96)`, // 384px
} as const;

/**
 * Semantic spacing tokens for consistent component spacing
 */
export const semanticSpacing = {
  // Component spacing
  'component-padding': `var(--${CSS_VAR_PREFIX}-spacing-component-padding)`,
  'component-margin': `var(--${CSS_VAR_PREFIX}-spacing-component-margin)`,
  'component-gap': `var(--${CSS_VAR_PREFIX}-spacing-component-gap)`,

  // Layout spacing
  'layout-padding': `var(--${CSS_VAR_PREFIX}-spacing-layout-padding)`,
  'layout-margin': `var(--${CSS_VAR_PREFIX}-spacing-layout-margin)`,
  'layout-gap': `var(--${CSS_VAR_PREFIX}-spacing-layout-gap)`,

  // Content spacing
  'content-padding': `var(--${CSS_VAR_PREFIX}-spacing-content-padding)`,
  'content-margin': `var(--${CSS_VAR_PREFIX}-spacing-content-margin)`,
  'content-gap': `var(--${CSS_VAR_PREFIX}-spacing-content-gap)`,

  // Form spacing
  'form-gap': `var(--${CSS_VAR_PREFIX}-spacing-form-gap)`,
  'form-padding': `var(--${CSS_VAR_PREFIX}-spacing-form-padding)`,
  'field-gap': `var(--${CSS_VAR_PREFIX}-spacing-field-gap)`,

  // Navigation spacing
  'nav-gap': `var(--${CSS_VAR_PREFIX}-spacing-nav-gap)`,
  'nav-padding': `var(--${CSS_VAR_PREFIX}-spacing-nav-padding)`,
  'nav-margin': `var(--${CSS_VAR_PREFIX}-spacing-nav-margin)`,

  // Table spacing
  'table-padding': `var(--${CSS_VAR_PREFIX}-spacing-table-padding)`,
  'table-gap': `var(--${CSS_VAR_PREFIX}-spacing-table-gap)`,
  'cell-padding': `var(--${CSS_VAR_PREFIX}-spacing-cell-padding)`,

  // Modal/Dialog spacing
  'modal-padding': `var(--${CSS_VAR_PREFIX}-spacing-modal-padding)`,
  'modal-gap': `var(--${CSS_VAR_PREFIX}-spacing-modal-gap)`,
  'modal-margin': `var(--${CSS_VAR_PREFIX}-spacing-modal-margin)`,
} as const;

/**
 * Spacing token resolver for dynamic spacing access
 */
type AnySpacingKey = keyof typeof spacing | keyof typeof semanticSpacing;

export const spacingResolver = {
  /**
   * Get spacing value by key
   * @param key - Spacing key (e.g., '4', 'component-padding')
   * @returns Spacing value
   */
  getValue<T extends AnySpacingKey>(key: T, options?: { strict?: boolean }): string {
    if ((key as string) in spacing) {
      const value = (spacing as unknown as Record<string, string>)[key as unknown as string];
      if (value !== undefined) return value;
    }
    if ((key as string) in semanticSpacing) {
      return semanticSpacing[key as keyof typeof semanticSpacing];
    }
    if (options?.strict) throw new Error(`Spacing token not found: ${String(key)}`);
    // Development warning for unknown spacing keys
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      console.warn(`[spacing] Unknown key "${String(key)}" – falling back to "0px".`);
    }
    return '0px';
  },

  /**
   * Convert spacing key to CSS variable name (without var())
   * @param key - Spacing key
   * @returns CSS variable name string
   */
  toCSSVar(key: string): string {
    // kept for backward compatibility – alias of toVarName
    return this.toVarName(key as AnySpacingKey);
  },

  /**
   * Get CSS var() string from key
   */
  toVar<T extends AnySpacingKey>(key: T): string {
    if ((key as string) in spacing || (key as string) in semanticSpacing) {
      return `var(--${CSS_VAR_PREFIX}-spacing-${String(key)})`;
    }
    throw new Error(`Spacing token not found: ${String(key)}`);
  },

  /**
   * Get CSS variable name (without var())
   */
  toVarName<T extends AnySpacingKey>(key: T): string {
    if ((key as string) in spacing || (key as string) in semanticSpacing) {
      return `--${CSS_VAR_PREFIX}-spacing-${String(key)}`;
    }
    throw new Error(`Spacing token not found: ${String(key)}`);
  },

  /**
   * Guards & metadata
   */
  isSpacingKey(key: string): key is string {
    return key in spacing;
  },
  isSemanticSpacingKey(key: string): key is string {
    return key in semanticSpacing;
  },
  exists(key: string): key is string {
    return key in spacing || key in semanticSpacing;
  },
  keys(): ReadonlyArray<AnySpacingKey> {
    return [...Object.keys(spacing), ...Object.keys(semanticSpacing)] as AnySpacingKey[];
  },
  entries(): ReadonlyArray<readonly [AnySpacingKey, string]> {
    return [...Object.entries(spacing), ...Object.entries(semanticSpacing)] as ReadonlyArray<
      readonly [AnySpacingKey, string]
    >;
  },
} as const;

export type SpacingToken = typeof spacing;
export type SemanticSpacingToken = typeof semanticSpacing;
export type SpacingKey = keyof typeof spacing;
export type SemanticSpacingKey = keyof typeof semanticSpacing;

/**
 * Flat map for Tailwind theme.spacing bridging:
 *   theme: { spacing: { ...spacingThemeBridge } }
 */

export const spacingThemeBridge: Record<string, string> = Object.fromEntries([
  ...Object.entries(spacing).map(([k, v]) => [String(k), v]),
  ...Object.entries(semanticSpacing),
]) as Record<string, string>;
