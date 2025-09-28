/**
 * Theme Hook - Enterprise Production Ready
 *
 * Theme management hook with semantic tokens, dark mode support,
 * and comprehensive accessibility features.
 */

import * as React from 'react';

const THEME_MODE_DARK = 'dark';
const THEME_MODE_LIGHT = 'light';
const PREFERS_COLOR_SCHEME_DARK = '(prefers-color-scheme: dark)';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  enableTransitions: boolean;
  enableAnimations: boolean;
  enableReducedMotion: boolean;
}

export interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const DEFAULT_THEME: ThemeConfig = {
  mode: 'system',
  enableTransitions: true,
  enableAnimations: true,
  enableReducedMotion: false,
};

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = 'aibos-ui-theme',
  attribute = 'class',
  value: _value,
  disableTransitionOnChange = false,
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeConfig;
  storageKey?: string;
  attribute?: string;
  value?: ThemeConfig;
  disableTransitionOnChange?: boolean;
}): React.ReactElement {
  const [theme, setThemeState] = React.useState<ThemeConfig>(() => {
    if (_value) return _value;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return { ...DEFAULT_THEME, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore localStorage errors
    }

    return defaultTheme;
  });

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const setTheme = React.useCallback(
    (newTheme: Partial<ThemeConfig>) => {
      setThemeState((previous) => {
        const updated = { ...previous, ...newTheme };

        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {
          // Ignore localStorage errors
        }

        return updated;
      });
    },
    [storageKey],
  );

  const toggleTheme = React.useCallback(() => {
    setTheme({
      mode: theme.mode === 'light' ? 'dark' : 'light',
    });
  }, [theme.mode, setTheme]);

  // Apply theme to document
  React.useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    // Remove previous theme classes
    root.classList.remove('light', 'dark');

    // Determine actual theme mode
    let actualMode = theme.mode;
    if (theme.mode === 'system') {
      actualMode = window.matchMedia(PREFERS_COLOR_SCHEME_DARK).matches
        ? THEME_MODE_DARK
        : THEME_MODE_LIGHT;
    }

    // Apply theme class
    root.classList.add(actualMode);

    // Set attribute for CSS selectors
    if (attribute !== 'class') {
      root.setAttribute(attribute, actualMode);
    }

    // Handle transitions
    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.appendChild(
        document.createTextNode(
          `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`,
        ),
      );
      document.head.appendChild(css);

      return () => {
        // Force reflow
        (() => window.getComputedStyle(document.body))();

        // Wait for next tick before removing
        setTimeout(() => {
          document.head.removeChild(css);
        }, 1);
      };
    }
  }, [theme.mode, mounted, attribute, disableTransitionOnChange]);

  // Listen for system theme changes
  React.useEffect(() => {
    if (theme.mode !== 'system') return;

    const mediaQuery = window.matchMedia(PREFERS_COLOR_SCHEME_DARK);

    const handleChange = () => {
      const root = window.document.documentElement;
      const actualMode = mediaQuery.matches ? THEME_MODE_DARK : THEME_MODE_LIGHT;

      root.classList.remove('light', 'dark');
      root.classList.add(actualMode);

      if (attribute !== 'class') {
        root.setAttribute(attribute, actualMode);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme.mode, attribute]);

  // Listen for reduced motion preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      setTheme({ enableReducedMotion: mediaQuery.matches });
    };

    // Set initial value
    handleChange();

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  const contextValue: ThemeContextValue = React.useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark:
        theme.mode === 'dark' ||
        (theme.mode === 'system' && window.matchMedia(PREFERS_COLOR_SCHEME_DARK).matches),
      isLight:
        theme.mode === 'light' ||
        (theme.mode === 'system' && !window.matchMedia(PREFERS_COLOR_SCHEME_DARK).matches),
      isSystem: theme.mode === 'system',
    }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// Utility hook for theme-aware styling
export function useThemeAwareStyles(): {
  getSemanticColor: (_color: string) => string;
  getSemanticColorWithOpacity: (_color: string, _opacity: number) => string;
  getThemeClass: (_lightClass: string, _darkClass: string) => string;
  getAnimationClass: (_animation: string) => string;
  getTransitionClass: (_transition: string) => string;
  isDark: boolean;
  isLight: boolean;
  theme: ThemeConfig;
} {
  const { theme, isDark, isLight } = useTheme();

  return React.useMemo(
    () => ({
      // Semantic color utilities
      getSemanticColor: (_color: string) => `hsl(var(--aibos-semantic-${_color}))`,
      getSemanticColorWithOpacity: (_color: string, _opacity: number) =>
        `hsl(var(--aibos-semantic-${_color}) / ${_opacity})`,

      // Theme-aware classes
      getThemeClass: (_lightClass: string, _darkClass: string) =>
        isDark ? _darkClass : _lightClass,

      // Animation utilities
      getAnimationClass: (_animation: string) =>
        theme.enableAnimations && !theme.enableReducedMotion ? _animation : '',

      // Transition utilities
      getTransitionClass: (_transition: string) =>
        theme.enableTransitions && !theme.enableReducedMotion ? _transition : '',

      // Theme state
      isDark,
      isLight,
      theme,
    }),
    [theme, isDark, isLight],
  );
}

export type ThemeProviderProperties = React.ComponentProps<typeof ThemeProvider>;
export type UseThemeReturn = ThemeContextValue;
export type UseThemeAwareStylesReturn = ReturnType<typeof useThemeAwareStyles>;
