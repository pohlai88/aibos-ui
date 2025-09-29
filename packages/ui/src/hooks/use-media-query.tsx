/**
 * Media Query Hook - Enterprise Production Ready
 *
 * Media query hook with responsive design support, semantic tokens,
 * and comprehensive accessibility features.
 */

// Type definitions for browser APIs
declare global {
  interface MediaQueryListEvent extends Event {
    readonly matches: boolean;
  }

  interface MediaQueryList {
    readonly matches: boolean;
    readonly media: string;
    addListener(listener: (event: MediaQueryListEvent) => void): void;
    removeListener(listener: (event: MediaQueryListEvent) => void): void;
  }

  interface Window {
    ResizeObserver: typeof ResizeObserver;
  }

  interface ResizeObserverEntry {
    readonly contentRect: DOMRectReadOnly;
    readonly target: Element;
  }
}

import { setIfAllowed, getIfAllowed as _getIfAllowed, type Whitelist, safeGet } from '../utils/internal';
import * as React from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface MediaQueryConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export const DEFAULT_BREAKPOINTS: MediaQueryConfig = {
  xs: '(min-width: 0px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

// Breakpoint pixel values for dynamic queries
const BREAKPOINTS: Record<string, number> = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Export for potential use in other components
export { BREAKPOINTS };

// Helper functions to reduce complexity

function determineBreakpoint(matches: Record<string, boolean>): Breakpoint {
  if (matches['2xl']) return '2xl';
  if (matches.xl) return 'xl';
  if (matches.lg) return 'lg';
  if (matches.md) return 'md';
  if (matches.sm) return 'sm';
  return 'xs';
}

// Whitelist for safe object access
const MEDIA_STATE_KEYS: Whitelist = new Set([
  'width',
  'height', 
  'query',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
]);

export interface MediaQueryState {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: Breakpoint;
  isPortrait: boolean;
  isLandscape: boolean;
  isReducedMotion: boolean;
  isHighContrast: boolean;
  isPrint: boolean;
}

/**
 * Hook to track media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    const handleChange = (event: Event) => {
      const mediaQueryEvent = event as MediaQueryListEvent;
      setMatches(mediaQueryEvent.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Hook to track multiple media queries
 */
export function useMediaQueries(queries: Record<string, string>): Record<string, boolean> {
  const [matches, setMatches] = React.useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') {
      return Object.keys(queries).reduce(
        (accumulator, key) => ({ ...accumulator, [key]: false }),
        {},
      );
    }

    return Object.keys(queries).reduce(
      (accumulator, key) => {
        const query = safeGet(queries, key) as string | undefined;
        if (query) {
          setIfAllowed(accumulator, key, window.matchMedia(query).matches, MEDIA_STATE_KEYS);
        } else {
          setIfAllowed(accumulator, key, false, MEDIA_STATE_KEYS);
        }
        return accumulator;
      },
      {} as Record<string, boolean>,
    );
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueries = Object.keys(queries)
      .map((key) => {
        const query = safeGet(queries, key) as string | undefined;
        return {
          key,
          mediaQuery: query ? window.matchMedia(query) : undefined,
        };
      })
      .filter((item) => item.mediaQuery !== undefined) as Array<{
      key: string;
      mediaQuery: MediaQueryList;
    }>;

    const handleChange = (key: string) => (event: Event) => {
      const mediaQueryEvent = event as MediaQueryListEvent;
      setMatches((previous) => ({ ...previous, [key]: mediaQueryEvent.matches }));
    };

    // Set initial values
    const initialMatches = mediaQueries.reduce(
      (accumulator, { key, mediaQuery }) => ({
        ...accumulator,
        [key]: mediaQuery.matches,
      }),
      {} as Record<string, boolean>,
    );
    setMatches((previous) => ({ ...previous, ...initialMatches }));

    // Listen for changes
    const listeners = mediaQueries.map(({ key, mediaQuery }) => {
      const listener = handleChange(key);
      mediaQuery.addEventListener('change', listener);
      return { mediaQuery, listener };
    });

    return () => {
      listeners.forEach(({ mediaQuery, listener }) => {
        mediaQuery.removeEventListener('change', listener);
      });
    };
  }, [queries]);

  return matches;
}

/**
 * Hook to track responsive breakpoints
 */
export function useBreakpoints(
  breakpoints: MediaQueryConfig = DEFAULT_BREAKPOINTS,
): MediaQueryState {
  // Convert MediaQueryConfig to Record<string, string> for useMediaQueries
  const queriesRecord: Record<string, string> = {
    xs: breakpoints.xs,
    sm: breakpoints.sm,
    md: breakpoints.md,
    lg: breakpoints.lg,
    xl: breakpoints.xl,
    '2xl': breakpoints['2xl'],
  };

  const matches = useMediaQueries(queriesRecord);

  const state = React.useMemo((): MediaQueryState => {
    const xs = matches.xs ?? false;
    const sm = matches.sm ?? false;
    const md = matches.md ?? false;
    const lg = matches.lg ?? false;
    const xl = matches.xl ?? false;
    const twoXl = matches['2xl'] ?? false;
    const currentBreakpoint = determineBreakpoint(matches);

    return {
      xs,
      sm,
      md,
      lg,
      xl,
      '2xl': twoXl,
      isMobile: xs && !sm,
      isTablet: sm && !lg,
      isDesktop: lg && !xl,
      isLargeDesktop: xl,
      currentBreakpoint,
      isPortrait: false, // Will be set by separate hooks
      isLandscape: false, // Will be set by separate hooks
      isReducedMotion: false, // Will be set by separate hooks
      isHighContrast: false, // Will be set by separate hooks
      isPrint: false, // Will be set by separate hooks
    };
  }, [matches]);

  // Use separate hooks for additional media queries
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isHighContrast = useMediaQuery('(prefers-contrast: high)');
  const isPrint = useMediaQuery('print');

  return {
    ...state,
    isPortrait,
    isLandscape,
    isReducedMotion,
    isHighContrast,
    isPrint,
  };
}

/**
 * Hook for responsive design utilities
 */
export function useResponsive(): {
  isBreakpoint: (_breakpoint: Breakpoint) => boolean;
  isBreakpointUp: (_breakpoint: Breakpoint) => boolean;
  isBreakpointDown: (_breakpoint: Breakpoint) => boolean;
  getResponsiveClass: (_classes: Partial<Record<Breakpoint, string>>) => string;
  getResponsiveValue: <T>(_values: Partial<Record<Breakpoint, T>>, _defaultValue: T) => T;
  isDevice: (_type: 'mobile' | 'tablet' | 'desktop' | 'large-desktop') => boolean;
  getAccessibilityClass: () => string;
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: Breakpoint;
  isPortrait: boolean;
  isLandscape: boolean;
  isReducedMotion: boolean;
  isHighContrast: boolean;
  isPrint: boolean;
} {
  const breakpoints = useBreakpoints();

  return React.useMemo(
    () => ({
      // Breakpoint utilities
      isBreakpoint: (_breakpoint: Breakpoint) => {
        switch (_breakpoint) {
          case 'xs':
            return breakpoints.xs;
          case 'sm':
            return breakpoints.sm;
          case 'md':
            return breakpoints.md;
          case 'lg':
            return breakpoints.lg;
          case 'xl':
            return breakpoints.xl;
          case '2xl':
            return breakpoints['2xl'];
          default:
            return false;
        }
      },
      isBreakpointUp: (_breakpoint: Breakpoint) => {
        const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        const currentIndex = order.indexOf(breakpoints.currentBreakpoint);
        const targetIndex = order.indexOf(_breakpoint);
        return currentIndex >= targetIndex;
      },
      isBreakpointDown: (_breakpoint: Breakpoint) => {
        const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        const currentIndex = order.indexOf(breakpoints.currentBreakpoint);
        const targetIndex = order.indexOf(_breakpoint);
        return currentIndex <= targetIndex;
      },

      // Responsive class utilities
      getResponsiveClass: (_classes: Partial<Record<Breakpoint, string>>) => {
        const { currentBreakpoint } = breakpoints;
        return (safeGet(_classes, currentBreakpoint) as string) || '';
      },

      // Responsive value utilities
      getResponsiveValue: <T,>(_values: Partial<Record<Breakpoint, T>>, _defaultValue: T): T => {
        const { currentBreakpoint } = breakpoints;
        return (safeGet(_values, currentBreakpoint) as T) || _defaultValue;
      },

      // Device type utilities
      isDevice: (_type: 'mobile' | 'tablet' | 'desktop' | 'large-desktop') => {
        switch (_type) {
          case 'mobile':
            return breakpoints.isMobile;
          case 'tablet':
            return breakpoints.isTablet;
          case 'desktop':
            return breakpoints.isDesktop;
          case 'large-desktop':
            return breakpoints.isLargeDesktop;
          default:
            return false;
        }
      },

      // Accessibility utilities
      getAccessibilityClass: () => {
        const classes = [];
        if (breakpoints.isReducedMotion) classes.push('motion-reduce');
        if (breakpoints.isHighContrast) classes.push('high-contrast');
        return classes.join(' ');
      },

      // Breakpoint state
      ...breakpoints,
    }),
    [breakpoints],
  );
}

/**
 * Hook for responsive container queries (when supported)
 */
export function useContainerQuery(
  containerReference: React.RefObject<HTMLElement>,
  query: string,
): boolean {
  const [matches, setMatches] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!containerReference.current) return;

    // Check if container queries are supported
    if (!('ResizeObserver' in window)) {
      console.warn('Container queries not supported in this browser');
      return;
    }

    const resizeObserver = new (
      window as Window & { ResizeObserver: typeof ResizeObserver }
    ).ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;

        // Simple container query evaluation
        // This is a basic implementation - in production, you might want to use a library
        if (query.includes('min-width')) {
          const minWidth = parseInt(query.match(/min-width:\s*(\d+)px/)?.[1] || '0');
          setMatches(width >= minWidth);
        } else if (query.includes('max-width')) {
          const maxWidth = parseInt(query.match(/max-width:\s*(\d+)px/)?.[1] || '0');
          setMatches(width <= maxWidth);
        }
      }
    });

    resizeObserver.observe(containerReference.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerReference, query]);

  return matches;
}

export type UseMediaQueryReturn = boolean;
export type UseMediaQueriesReturn = Record<string, boolean>;
export type UseBreakpointsReturn = MediaQueryState;
export type UseResponsiveReturn = ReturnType<typeof useResponsive>;
export type UseContainerQueryReturn = boolean;
