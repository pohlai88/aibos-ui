/**
 * Design Tokens - Main Exports
 *
 * Enterprise-grade design token system with semantic naming,
 * CSS variables, and comprehensive type safety.
 */

// Constants to avoid duplicate string literals
const semanticPrimaryBase = 'hsl(var(--aibos-semantic-primary))';
const spacingCalcPrefix = 'calc(var(--aibos-spacing-unit) *';

// Individual token exports
export * from './colors';
export * from './spacing';
export * from './typography';
export * from './shadows';

// Re-export for convenience
export {
  colors,
  colorResolver,
  type ColorToken,
  type SemanticColor,
  type BrandColor,
  type AccentColor,
} from './colors';
export {
  spacing,
  semanticSpacing,
  spacingResolver,
  type SpacingToken,
  type SpacingKey,
} from './spacing';
export {
  typography,
  semanticTypography,
  typographyResolver,
  type TypographyToken,
  type FontSizeKey,
} from './typography';
export {
  shadows,
  semanticShadows,
  shadowResolver,
  type ShadowToken,
  type ShadowKey,
} from './shadows';

/**
 * Complete token collection for easy access
 */
export const tokens = {
  colors: {
    // Premium neutral palette
    neutral: {
      0: 'hsl(var(--aibos-neutral-0))',
      50: 'hsl(var(--aibos-neutral-50))',
      100: 'hsl(var(--aibos-neutral-100))',
      200: 'hsl(var(--aibos-neutral-200))',
      300: 'hsl(var(--aibos-neutral-300))',
      400: 'hsl(var(--aibos-neutral-400))',
      500: 'hsl(var(--aibos-neutral-500))',
      600: 'hsl(var(--aibos-neutral-600))',
      700: 'hsl(var(--aibos-neutral-700))',
      800: 'hsl(var(--aibos-neutral-800))',
      900: 'hsl(var(--aibos-neutral-900))',
    },
    // Brand colors
    brand: {
      400: 'hsl(var(--aibos-brand-400))',
      500: 'hsl(var(--aibos-brand-500))',
      600: 'hsl(var(--aibos-brand-600))',
    },
    // Accent colors
    accent: {
      500: 'hsl(var(--aibos-accent-500))',
    },
    // Semantic colors (for backward compatibility)
    primary: {
      50: 'hsl(var(--aibos-semantic-primary) / 0.1)',
      100: 'hsl(var(--aibos-semantic-primary) / 0.2)',
      200: 'hsl(var(--aibos-semantic-primary) / 0.3)',
      300: 'hsl(var(--aibos-semantic-primary) / 0.4)',
      400: 'hsl(var(--aibos-semantic-primary) / 0.6)',
      500: semanticPrimaryBase,
      600: 'hsl(var(--aibos-semantic-primary) / 0.8)',
      700: 'hsl(var(--aibos-semantic-primary) / 0.9)',
      800: 'hsl(var(--aibos-semantic-primary) / 0.95)',
      900: 'hsl(var(--aibos-semantic-primary) / 1)',
    },
    success: {
      50: 'hsl(var(--aibos-success) / 0.1)',
      100: 'hsl(var(--aibos-success) / 0.2)',
      200: 'hsl(var(--aibos-success) / 0.3)',
      300: 'hsl(var(--aibos-success) / 0.4)',
      400: 'hsl(var(--aibos-success) / 0.6)',
      500: 'hsl(var(--aibos-success))',
      600: 'hsl(var(--aibos-success) / 0.8)',
      700: 'hsl(var(--aibos-success) / 0.9)',
      800: 'hsl(var(--aibos-success) / 0.95)',
      900: 'hsl(var(--aibos-success) / 1)',
    },
    warning: {
      50: 'hsl(var(--aibos-warning) / 0.1)',
      100: 'hsl(var(--aibos-warning) / 0.2)',
      200: 'hsl(var(--aibos-warning) / 0.3)',
      300: 'hsl(var(--aibos-warning) / 0.4)',
      400: 'hsl(var(--aibos-warning) / 0.6)',
      500: 'hsl(var(--aibos-warning))',
      600: 'hsl(var(--aibos-warning) / 0.8)',
      700: 'hsl(var(--aibos-warning) / 0.9)',
      800: 'hsl(var(--aibos-warning) / 0.95)',
      900: 'hsl(var(--aibos-warning) / 1)',
    },
    error: {
      50: 'hsl(var(--aibos-semantic-destructive) / 0.1)',
      100: 'hsl(var(--aibos-semantic-destructive) / 0.2)',
      200: 'hsl(var(--aibos-semantic-destructive) / 0.3)',
      300: 'hsl(var(--aibos-semantic-destructive) / 0.4)',
      400: 'hsl(var(--aibos-semantic-destructive) / 0.6)',
      500: 'hsl(var(--aibos-semantic-destructive))',
      600: 'hsl(var(--aibos-semantic-destructive) / 0.8)',
      700: 'hsl(var(--aibos-semantic-destructive) / 0.9)',
      800: 'hsl(var(--aibos-semantic-destructive) / 0.95)',
      900: 'hsl(var(--aibos-semantic-destructive) / 1)',
    },
    // Semantic colors
    semantic: {
      background: 'hsl(var(--aibos-semantic-background))',
      foreground: 'hsl(var(--aibos-semantic-foreground))',
      primary: semanticPrimaryBase,
      'primary-foreground': 'hsl(var(--aibos-semantic-primary-foreground))',
      secondary: 'hsl(var(--aibos-semantic-muted))',
      'secondary-foreground': 'hsl(var(--aibos-semantic-muted-foreground))',
      muted: 'hsl(var(--aibos-semantic-muted))',
      'muted-foreground': 'hsl(var(--aibos-semantic-muted-foreground))',
      accent: 'hsl(var(--aibos-semantic-accent))',
      'accent-foreground': 'hsl(var(--aibos-semantic-accent-foreground))',
      destructive: 'hsl(var(--aibos-semantic-destructive))',
      'destructive-foreground': 'hsl(var(--aibos-semantic-destructive-foreground))',
      border: 'hsl(var(--aibos-semantic-border))',
      input: 'hsl(var(--aibos-semantic-input))',
      ring: 'hsl(var(--aibos-semantic-ring))',
      success: 'hsl(var(--aibos-success))',
      warning: 'hsl(var(--aibos-warning))',
      info: 'hsl(var(--aibos-info))',
    },
  },
  spacing: {
    0: '0px',
    1: `${spacingCalcPrefix} 1)`,
    2: `${spacingCalcPrefix} 2)`,
    3: `${spacingCalcPrefix} 3)`,
    4: `${spacingCalcPrefix} 4)`,
    5: `${spacingCalcPrefix} 5)`,
    6: `${spacingCalcPrefix} 6)`,
    8: `${spacingCalcPrefix} 8)`,
    10: `${spacingCalcPrefix} 10)`,
    12: `${spacingCalcPrefix} 12)`,
    16: `${spacingCalcPrefix} 16)`,
    20: `${spacingCalcPrefix} 20)`,
    24: `${spacingCalcPrefix} 24)`,
    32: `${spacingCalcPrefix} 32)`,
  },
  typography: {
    fontSize: {
      xs: 'var(--aibos-font-size-xs)',
      sm: 'var(--aibos-font-size-sm)',
      base: 'var(--aibos-font-size-base)',
      lg: 'var(--aibos-font-size-lg)',
      xl: 'var(--aibos-font-size-xl)',
      '2xl': 'var(--aibos-font-size-2xl)',
      '3xl': 'var(--aibos-font-size-3xl)',
      '4xl': 'var(--aibos-font-size-4xl)',
    },
    fontWeight: {
      normal: 'var(--aibos-font-weight-normal)',
      medium: 'var(--aibos-font-weight-medium)',
      semibold: 'var(--aibos-font-weight-semibold)',
      bold: 'var(--aibos-font-weight-bold)',
    },
    fontFamily: {
      sans: 'var(--aibos-font-family-sans)',
      mono: 'var(--aibos-font-family-mono)',
    },
  },
  borderRadius: {
    none: '0px',
    sm: 'calc(var(--aibos-spacing-unit) * 0.5)',
    base: 'calc(var(--aibos-spacing-unit) * 1)',
    md: 'calc(var(--aibos-spacing-unit) * 1.5)',
    lg: 'calc(var(--aibos-spacing-unit) * 2)',
    xl: 'calc(var(--aibos-spacing-unit) * 3)',
    '2xl': 'calc(var(--aibos-spacing-unit) * 4)',
    full: '9999px',
  },
  shadows: {
    // Premium elevation system
    'elev-1': 'var(--aibos-shadow-elev-1)',
    'elev-2': 'var(--aibos-shadow-elev-2)',
    'elev-3': 'var(--aibos-shadow-elev-3)',
    // Legacy shadows
    sm: 'var(--aibos-shadow-sm)',
    base: 'var(--aibos-shadow-base)',
    md: 'var(--aibos-shadow-md)',
    lg: 'var(--aibos-shadow-lg)',
    xl: 'var(--aibos-shadow-xl)',
  },
} as const;

/**
 * CSS Variable Generator
 *
 * Generates CSS variables for theming support.
 * Can be used at build time or runtime for dynamic theming.
 */
export const generateCSSVariables = (theme: 'light' | 'dark' = 'light'): string => {
  const baseVariables = `
    /* Spacing */
    --aibos-spacing-unit: 4px;
    
    /* Typography */
    --aibos-font-family-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
    --aibos-font-family-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    
    --aibos-font-size-xs: 0.75rem;
    --aibos-font-size-sm: 0.875rem;
    --aibos-font-size-base: 1rem;
    --aibos-font-size-lg: 1.125rem;
    --aibos-font-size-xl: 1.25rem;
    --aibos-font-size-2xl: 1.5rem;
    --aibos-font-size-3xl: 1.875rem;
    --aibos-font-size-4xl: 2.25rem;
    
    --aibos-font-weight-normal: 400;
    --aibos-font-weight-medium: 500;
    --aibos-font-weight-semibold: 600;
    --aibos-font-weight-bold: 700;
    
    --aibos-line-height-tight: 1.25;
    --aibos-line-height-snug: 1.375;
    --aibos-line-height-normal: 1.5;
    --aibos-line-height-relaxed: 1.625;
    
    /* Shadows */
    --aibos-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --aibos-shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --aibos-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --aibos-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --aibos-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  `;

  const lightTheme = `
    /* Premium Light Theme Colors */
    --aibos-neutral-0: 0 0% 100%;
    --aibos-neutral-50: 220 12% 98%;
    --aibos-neutral-100: 220 10% 96%;
    --aibos-neutral-200: 220 10% 92%;
    --aibos-neutral-300: 220 8% 88%;
    --aibos-neutral-400: 220 7% 70%;
    --aibos-neutral-500: 220 7% 54%;
    --aibos-neutral-600: 220 8% 40%;
    --aibos-neutral-700: 220 9% 28%;
    --aibos-neutral-800: 220 10% 18%;
    --aibos-neutral-900: 220 12% 10%;
    
    --aibos-brand-400: 220 12% 48%;
    --aibos-brand-500: 220 13% 42%;
    --aibos-brand-600: 220 14% 36%;
    --aibos-accent-500: 268 10% 46%;
    
    --aibos-semantic-background: var(--aibos-neutral-50);
    --aibos-semantic-foreground: 220 20% 14%;
    --aibos-semantic-card: var(--aibos-neutral-0);
    --aibos-semantic-card-foreground: 220 22% 16%;
    --aibos-semantic-popover: var(--aibos-neutral-0);
    --aibos-semantic-popover-foreground: 220 22% 16%;
    --aibos-semantic-border: 220 12% 85%;
    --aibos-semantic-input: 220 12% 90%;
    --aibos-semantic-ring: var(--aibos-brand-400);
    --aibos-semantic-primary: var(--aibos-brand-500);
    --aibos-semantic-primary-foreground: 0 0% 100%;
    --aibos-semantic-muted: var(--aibos-neutral-100);
    --aibos-semantic-muted-foreground: 220 10% 40%;
    --aibos-semantic-accent: var(--aibos-accent-500);
    --aibos-semantic-accent-foreground: 0 0% 100%;
    --aibos-semantic-destructive: 7 78% 53%;
    --aibos-semantic-destructive-foreground: 0 0% 100%;
    --aibos-success: 142 76% 36%;
    --aibos-warning: 38 92% 50%;
    --aibos-info: 199 89% 48%;
    
    --aibos-shadow-elev-1: 0 1px 2px 0 rgb(0 0 0 / 0.03);
    --aibos-shadow-elev-2: 0 4px 10px -2px rgb(0 0 0 / 0.06);
    --aibos-shadow-elev-3: 0 16px 40px -12px rgb(0 0 0 / 0.08);
  `;

  const darkTheme = `
    /* Premium Dark Theme Colors */
    --aibos-neutral-0: 220 18% 10%;
    --aibos-neutral-50: 220 18% 12%;
    --aibos-neutral-100: 220 18% 14%;
    --aibos-neutral-200: 220 18% 16%;
    --aibos-neutral-300: 220 18% 18%;
    --aibos-neutral-400: 220 18% 25%;
    --aibos-neutral-500: 220 18% 35%;
    --aibos-neutral-600: 220 18% 45%;
    --aibos-neutral-700: 220 18% 55%;
    --aibos-neutral-800: 220 18% 65%;
    --aibos-neutral-900: 220 18% 75%;
    
    --aibos-brand-400: 220 14% 64%;
    --aibos-brand-500: 220 14% 58%;
    --aibos-brand-600: 220 14% 52%;
    --aibos-accent-500: 268 14% 64%;
    
    --aibos-semantic-background: 220 18% 10%;
    --aibos-semantic-foreground: 220 15% 92%;
    --aibos-semantic-card: 220 16% 12%;
    --aibos-semantic-card-foreground: 220 15% 92%;
    --aibos-semantic-popover: 220 16% 12%;
    --aibos-semantic-popover-foreground: 220 15% 92%;
    --aibos-semantic-border: 220 14% 24%;
    --aibos-semantic-input: 220 13% 20%;
    --aibos-semantic-ring: var(--aibos-brand-400);
    --aibos-semantic-primary: 220 14% 64%;
    --aibos-semantic-primary-foreground: 220 22% 12%;
    --aibos-semantic-muted: 220 18% 14%;
    --aibos-semantic-muted-foreground: 220 14% 66%;
    --aibos-semantic-accent: 268 14% 64%;
    --aibos-semantic-accent-foreground: 220 22% 12%;
    --aibos-semantic-destructive: 0 62.8% 30.6%;
    --aibos-semantic-destructive-foreground: 210 40% 98%;
    --aibos-success: 142 76% 36%;
    --aibos-warning: 38 92% 50%;
    --aibos-info: 199 89% 48%;
    
    --aibos-shadow-elev-1: 0 1px 2px 0 rgb(0 0 0 / 0.15);
    --aibos-shadow-elev-2: 0 4px 10px -2px rgb(0 0 0 / 0.25);
    --aibos-shadow-elev-3: 0 16px 40px -12px rgb(0 0 0 / 0.35);
  `;

  return `
    :root, [data-theme="${theme}"] {
      ${baseVariables}
      ${theme === 'light' ? lightTheme : darkTheme}
    }
  `.trim();
};

/**
 * Critical tokens for above-the-fold performance
 * Keep under 2KB for optimal loading
 */
export const criticalTokens = {
  colors: {
    background: 'hsl(var(--aibos-semantic-background))',
    foreground: 'hsl(var(--aibos-semantic-foreground))',
    primary: semanticPrimaryBase,
    border: 'hsl(var(--aibos-semantic-border))',
  },
  spacing: {
    0: '0px',
    1: `${spacingCalcPrefix} 1)`,
    2: `${spacingCalcPrefix} 2)`,
    4: `${spacingCalcPrefix} 4)`,
  },
  typography: {
    fontSize: {
      sm: 'var(--aibos-font-size-sm)',
      base: 'var(--aibos-font-size-base)',
    },
    fontWeight: {
      normal: 'var(--aibos-font-weight-normal)',
      medium: 'var(--aibos-font-weight-medium)',
    },
  },
} as const;

export type TokenSystem = typeof tokens;
export type CriticalTokens = typeof criticalTokens;
