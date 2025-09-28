/**
 * Hooks Index - Centralized Exports
 *
 * Centralized exports for all custom hooks following
 * enterprise-grade standards and tree-shaking optimization.
 */

// Theme Hook Exports
export {
  ThemeProvider,
  useTheme,
  useThemeAwareStyles,
  type ThemeMode,
  type ThemeConfig,
  type ThemeContextValue,
  type ThemeProviderProperties,
  type UseThemeReturn,
  type UseThemeAwareStylesReturn,
} from '@hooks/use-theme';

// Media Query Hook Exports
export {
  useMediaQuery,
  useMediaQueries,
  useBreakpoints,
  useResponsive,
  useContainerQuery,
  DEFAULT_BREAKPOINTS,
  type Breakpoint,
  type MediaQueryConfig,
  type MediaQueryState,
  type UseMediaQueryReturn,
  type UseMediaQueriesReturn,
  type UseBreakpointsReturn,
  type UseResponsiveReturn,
  type UseContainerQueryReturn,
} from '@hooks/use-media-query';

// Correlation Hook Exports
export {
  CorrelationProvider,
  useCorrelation,
  useCorrelationRelationship,
  useCorrelationAnalytics,
  type CorrelationType,
  type CorrelationConfig,
  type CorrelationState,
  type CorrelationActions,
  type CorrelationContextValue,
  type CorrelationProviderProperties,
  type UseCorrelationReturn,
  type UseCorrelationRelationshipReturn,
  type UseCorrelationAnalyticsReturn,
} from '@hooks/use-correlation';

// Toast Hook Exports
export { useToast, toast } from '@hooks/use-toast';
