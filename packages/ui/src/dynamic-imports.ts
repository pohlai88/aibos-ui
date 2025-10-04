/**
 * Dynamic Imports - Milestone 8 Performance Optimization
 * 
 * Provides dynamic imports for heavy components to enable code splitting.
 * Components are loaded on-demand to reduce initial bundle size.
 */

import { lazy } from 'react';

// Heavy components that should be dynamically imported
// Note: These components may not exist yet, so we'll comment them out for now
// export const DataGrid = lazy(() => import('../components/data-grid'));
// export const DataTable = lazy(() => import('../components/data-table'));
// export const CommandPalette = lazy(() => import('../components/command-palette'));
// export const MultiSelect = lazy(() => import('../components/multi-select'));
// export const DateRangePicker = lazy(() => import('../components/date-range-picker'));
// export const ColorPicker = lazy(() => import('../components/color-picker'));

// Advanced primitives that are rarely used
// export const Calendar = lazy(() => import('../primitives/calendar'));
// export const FileUpload = lazy(() => import('../primitives/file-upload'));
// export const Progress = lazy(() => import('../primitives/progress'));
// export const Slider = lazy(() => import('../primitives/slider'));
// export const ToggleGroup = lazy(() => import('../primitives/toggle-group'));

// Chart components (when they exist)
// export const ChartPanel = lazy(() => import('../components/charts/ChartPanel'));
// export const DataVisualization = lazy(() => import('../components/charts/DataVisualization'));

// Dynamic import utilities
export const dynamicImport = {
  // Load component with loading fallback
  withLoading: (importFn: () => Promise<{ default: React.ComponentType }>, LoadingComponent: React.ComponentType) => {
    return lazy(() => 
      importFn().then((module: { default: React.ComponentType }) => ({
        default: module.default,
        LoadingComponent
      }))
    );
  },

  // Load component with error boundary
  withErrorBoundary: (importFn: () => Promise<{ default: React.ComponentType }>, ErrorComponent: React.ComponentType) => {
    return lazy(() => 
      importFn().catch(() => ({
        default: ErrorComponent
      }))
    );
  },

  // Preload component for better UX
  preload: (importFn: () => Promise<unknown>) => {
    return () => {
      importFn();
    };
  }
};

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  // import('../components/data-table');
  // import('../components/command-palette');
};

// Export dynamic import configuration
export const dynamicImportConfig = {
  // Components that should always be in main bundle
  alwaysInclude: [
    'Button',
    'Input', 
    'Card',
    'Modal',
    'Toast',
    'Tooltip'
  ],
  
  // Components that should be dynamically imported
  dynamicImport: [
    'DataGrid',
    'DataTable', 
    'CommandPalette',
    'MultiSelect',
    'DateRangePicker',
    'ColorPicker',
    'Calendar',
    'FileUpload',
    'Progress',
    'Slider',
    'ToggleGroup'
  ],
  
  // Components that should be preloaded
  preload: [
    'DataTable',
    'CommandPalette'
  ]
};
