# AIBOS UI Development Environment

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development environment
pnpm run dev:full

# Run validation
pnpm run validate
```

## 📋 Available Scripts

### Development
- `pnpm run dev` - Start build watcher
- `pnpm run dev:full` - Start all development services
- `pnpm run dev:test` - Run tests in watch mode
- `pnpm run dev:lint` - Fix linting issues
- `pnpm run dev:typecheck` - Type check in watch mode

### Building
- `pnpm run build` - Build production bundle
- `pnpm run build:watch` - Build in watch mode
- `pnpm run build:types` - Generate TypeScript declarations

### Testing
- `pnpm run test` - Run tests with coverage
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:ui` - Open Vitest UI
- `pnpm run test:coverage` - Generate coverage report
- `pnpm run test:ci` - Run tests for CI

### Quality Assurance
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix linting issues
- `pnpm run typecheck` - Type check
- `pnpm run validate` - Run all quality checks

### Analysis
- `pnpm run size` - Check bundle size
- `pnpm run analyze` - Analyze bundle composition

## 🏗️ Architecture

### Package Structure
```
src/
├── components/     # High-level UI components
├── primitives/     # Atomic UI primitives
├── radix/         # Radix UI wrappers
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── tokens/        # Design tokens
├── icons/         # Icon system
├── performance/   # Performance monitoring
├── test/          # Test utilities
└── types/         # TypeScript definitions
```

### Build Output
```
dist/
├── index.js/cjs   # Main bundle
├── core.js/cjs    # Core utilities
├── tokens.js/cjs  # Design tokens
├── utils.js/cjs   # Utilities
├── performance.js/cjs # Performance tools
├── components/    # Individual components
├── primitives/    # Individual primitives
└── types/         # TypeScript declarations
```

## 🎯 Development Standards

### Code Quality
- **TypeScript**: Strict mode enabled
- **ESLint**: Zero warnings policy
- **Testing**: 85% coverage minimum
- **Accessibility**: WCAG 2.2 AAA compliance

### Performance
- **Bundle Size**: <150kb gzipped
- **Tree Shaking**: Optimized exports
- **Source Maps**: Enabled for debugging
- **Minification**: Production builds

### Development Experience
- **Hot Reload**: Instant feedback
- **Type Safety**: Full TypeScript support
- **Testing**: Vitest with UI
- **Linting**: Auto-fix on save

## 🔧 Configuration Files

- `tsup.config.ts` - Build configuration
- `vitest.config.ts` - Test configuration
- `tailwind.config.js` - Styling configuration
- `eslint.config.js` - Linting rules
- `.bundlesizerc.json` - Bundle size limits

## 📊 Monitoring

### Performance Metrics
- Render time: <16ms (60fps)
- Mount time: <100ms
- Update time: <50ms
- Unmount time: <30ms

### Bundle Analysis
- Main bundle: <150kb
- Core utilities: <50kb
- Design tokens: <30kb
- Individual components: <20kb

## 🚀 Production Readiness

### Pre-publish Checks
1. Type checking passes
2. Linting passes with zero warnings
3. Tests pass with 85%+ coverage
4. Bundle size within limits
5. Build artifacts generated

### Quality Gates
- ✅ TypeScript compilation
- ✅ ESLint validation
- ✅ Test coverage
- ✅ Bundle size analysis
- ✅ Performance benchmarks
