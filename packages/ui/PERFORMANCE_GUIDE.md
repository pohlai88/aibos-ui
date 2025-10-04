# 🚀 Performance Optimization Guide - Milestone 8

## Overview

This guide covers the performance optimizations implemented in Milestone 8, including bundle analysis, code splitting, dynamic imports, and performance monitoring.

## Bundle Size Budgets

Our performance targets are enforced through automated bundle size checking:

| Bundle Type | Target Size | Current Size | Status |
|-------------|-------------|--------------|--------|
| Main Bundle | ≤150KB | 26.28KB | ✅ |
| Total Initial JS | ≤220KB | 29.60KB | ✅ |
| Largest Async Chunk | ≤180KB | 5.75KB | ✅ |
| Individual Components | ≤50KB | <1KB each | ✅ |

## Code Splitting Strategy

### Dynamic Imports

Heavy components are dynamically imported to reduce initial bundle size:

```typescript
import { lazy } from 'react';

// Heavy components loaded on-demand
export const DataGrid = lazy(() => import('../components/data-grid'));
export const DataTable = lazy(() => import('../components/data-table'));
export const CommandPalette = lazy(() => import('../components/command-palette'));
export const MultiSelect = lazy(() => import('../components/multi-select'));
```

### Usage Patterns

```typescript
// ✅ Good: Dynamic import for heavy components
const DataGrid = lazy(() => import('@aibos/ui/components/data-grid'));

// ✅ Good: Keep lightweight components in main bundle
import { Button, Input, Card } from '@aibos/ui';

// ❌ Avoid: Importing heavy components directly
import { DataGrid } from '@aibos/ui/components/data-grid';
```

## Performance Monitoring

### Development Mode

Performance monitoring is enabled by default in development:

```typescript
// Automatically tracks:
// - Component render times
// - Bundle loading performance
// - Web Vitals (LCP, FID, CLS)
// - Memory usage
```

### Production Mode

Enable performance monitoring in production:

```bash
# Set environment variable
NEXT_PUBLIC_PERF=1

# Or in your app
if (process.env.NEXT_PUBLIC_PERF) {
  import('@aibos/ui/performance').then(({ initializePerformanceMonitoring }) => {
    initializePerformanceMonitoring();
  });
}
```

## Bundle Analysis

### Running Bundle Analysis

```bash
# Analyze current bundle sizes
pnpm run size

# Full analysis with build
pnpm run analyze

# CI build with budget checking
pnpm run build:ci
```

### Interpreting Results

```
📊 Bundle Size Analysis:
────────────────────────────────────────────────────────────────────────────────
✅ OK            Main Bundle (index.js)           26.28 KB / 146.48 KB
✅ OK            Component: accordion.js           0.19 KB / 48.83 KB
✅ OK            Total Initial JS                 29.60 KB / 214.84 KB
✅ OK            Largest Async Chunk               5.75 KB / 175.78 KB
────────────────────────────────────────────────────────────────────────────────

✅ All bundle size budgets met!
```

## Performance Testing

### Running Performance Tests

```bash
# Run performance regression tests
pnpm run test src/test/performance/

# Run with performance monitoring
pnpm run test -- --reporter=verbose src/test/performance/
```

### Performance Thresholds

| Component | Render Time | Memory Usage |
|-----------|-------------|--------------|
| Button | <5ms | <1MB |
| Card | <10ms | <2MB |
| Modal | <20ms | <5MB |
| Table | <50ms | <10MB |
| DataTable | <100ms | <20MB |

## Optimization Strategies

### 1. Tree Shaking

Ensure proper tree shaking by using named imports:

```typescript
// ✅ Good: Named imports
import { Button, Input } from '@aibos/ui';

// ❌ Avoid: Default imports for utilities
import utils from '@aibos/ui/utils';
```

### 2. Icon Optimization

Icons are optimized through our icon system:

```typescript
// ✅ Good: Use icon system
import { ChevronDownIcon } from '@aibos/ui/icons';

// ❌ Avoid: Direct Lucide imports
import { ChevronDown } from 'lucide-react';
```

### 3. Component Lazy Loading

Use dynamic imports for heavy components:

```typescript
import { lazy, Suspense } from 'react';

const DataGrid = lazy(() => import('@aibos/ui/components/data-grid'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DataGrid data={data} />
    </Suspense>
  );
}
```

### 4. Memory Management

Components are optimized for memory efficiency:

```typescript
// ✅ Good: Memoized components
const OptimizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// ✅ Good: Stable callbacks
const handleClick = useCallback(() => {
  // Handle click
}, [dependency]);
```

## Monitoring & Alerts

### Bundle Size Alerts

The CI pipeline will fail if bundle sizes exceed budgets:

```bash
# This will fail if budgets are exceeded
pnpm run build:ci
```

### Performance Regression Detection

Performance tests run automatically and will fail if thresholds are exceeded:

```bash
# Performance regression test
pnpm run test src/test/performance/performance-regression.test.tsx
```

## Best Practices

### 1. Import Strategy

- **Main Bundle**: Keep frequently used, lightweight components
- **Dynamic Imports**: Use for heavy, rarely used components
- **Tree Shaking**: Always use named imports

### 2. Component Design

- **Memoization**: Use `React.memo` for expensive components
- **Callback Stability**: Use `useCallback` for event handlers
- **Dependency Optimization**: Minimize dependency arrays

### 3. Bundle Optimization

- **Code Splitting**: Split by feature, not by file
- **Lazy Loading**: Load components on-demand
- **Preloading**: Preload critical components

### 4. Performance Monitoring

- **Development**: Always enabled for debugging
- **Production**: Opt-in for performance tracking
- **CI/CD**: Automated budget enforcement

## Troubleshooting

### Bundle Size Issues

If bundle sizes exceed budgets:

1. **Check for unused imports**:
   ```bash
   pnpm run lint -- --rule=no-unused-vars
   ```

2. **Analyze bundle composition**:
   ```bash
   pnpm run analyze
   ```

3. **Move heavy components to dynamic imports**:
   ```typescript
   // Move to dynamic-imports.ts
   export const HeavyComponent = lazy(() => import('./heavy-component'));
   ```

### Performance Issues

If performance tests fail:

1. **Check render times**:
   ```bash
   pnpm run test src/test/performance/ -- --reporter=verbose
   ```

2. **Profile component performance**:
   ```typescript
   import { performanceTestUtils } from '@aibos/ui/test/performance';
   
   const renderTime = performanceTestUtils.measureRenderTime(<Component />);
   ```

3. **Optimize expensive operations**:
   - Use `React.memo` for expensive renders
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for stable references

## Future Optimizations

### Planned Improvements

1. **Virtual Scrolling**: For large data sets
2. **Image Optimization**: Lazy loading and WebP support
3. **Service Worker**: For offline functionality
4. **Preloading**: Intelligent component preloading

### Monitoring Enhancements

1. **Real User Monitoring**: Production performance tracking
2. **Error Tracking**: Performance-related error monitoring
3. **Analytics Integration**: Performance metrics dashboard

---

## Quick Reference

### Commands

```bash
# Bundle analysis
pnpm run size

# Performance testing
pnpm run test src/test/performance/

# Full analysis
pnpm run analyze

# CI build
pnpm run build:ci
```

### Key Files

- `scripts/check-bundle-budgets.mjs` - Bundle size enforcement
- `src/dynamic-imports.ts` - Dynamic import configuration
- `src/performance/performance-monitor-enhanced.ts` - Performance monitoring
- `src/test/performance/performance-regression.test.tsx` - Performance tests

### Environment Variables

- `NEXT_PUBLIC_PERF=1` - Enable production performance monitoring
- `PERF_MONITORING=true` - Force enable performance monitoring
