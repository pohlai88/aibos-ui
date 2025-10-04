import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    core: 'src/core.ts',
    tokens: 'src/tokens/index.ts',
    utils: 'src/utils/index.ts',
    performance: 'src/performance/index.ts',
    // Individual component exports for optimal tree-shaking
    'components/accordion': 'src/components/accordion.tsx',
    'components/async-loading': 'src/components/async-loading.tsx',
    'components/breadcrumb': 'src/components/breadcrumb.tsx',
    'components/card': 'src/components/card.tsx',
    'components/error-boundary': 'src/components/error-boundary.tsx',
    'components/form': 'src/components/form.tsx',
    'components/loading-button': 'src/components/loading-button.tsx',
    'components/modal': 'src/components/modal.tsx',
    'components/navigation': 'src/components/navigation.tsx',
    'components/pagination': 'src/components/pagination.tsx',
    'components/popover': 'src/components/popover.tsx',
    'components/select': 'src/components/select.tsx',
    'components/skeleton-table': 'src/components/skeleton-table.tsx',
    'components/table': 'src/components/table.tsx',
    'components/tabs': 'src/components/tabs.tsx',
    'components/toast': 'src/components/toast.tsx',
    'components/tooltip': 'src/components/tooltip.tsx',
    'components/virtual-table': 'src/components/virtual-table.tsx',
    // Primitives for granular imports
    'primitives/badge': 'src/primitives/badge.tsx',
    'primitives/button': 'src/primitives/button.tsx',
    'primitives/checkbox': 'src/primitives/checkbox.tsx',
    'primitives/input': 'src/primitives/input.tsx',
    'primitives/loading-spinner': 'src/primitives/loading-spinner.tsx',
    'primitives/radio': 'src/primitives/radio.tsx',
    'primitives/switch': 'src/primitives/switch.tsx',
  },
  format: ['esm', 'cjs'],
  dts: false,
  splitting: true,
  sourcemap: true,
  clean: false,
  treeshake: true,
  skipNodeModulesBundle: true,
  minify: true,
  target: 'es2022',
  // Enhanced code splitting configuration
  chunkSizeWarningLimit: 1000, // Warn if chunks exceed 1MB
  metafile: true, // Generate bundle analysis metadata
  external: [
    'react', 'react-dom',
    '@radix-ui/react-accordion', '@radix-ui/react-checkbox',
    '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-menu', '@radix-ui/react-popover',
    '@radix-ui/react-portal', '@radix-ui/react-radio-group',
    '@radix-ui/react-select', '@radix-ui/react-slot',
    '@radix-ui/react-switch', '@radix-ui/react-tabs',
    '@radix-ui/react-toast', '@radix-ui/react-tooltip',
    '@tanstack/react-table', '@tanstack/react-virtual',
    'class-variance-authority', 'clsx', 'tailwind-merge', 'lucide-react',
    'react-hook-form', '@hookform/resolvers', 'zod',
  ],
  esbuildOptions(options) {
    options.treeShaking = true;
    options.drop = ['console', 'debugger'];
    options.define = {
      'process.env.NODE_ENV': '"production"',
    };
  },
  onSuccess: 'echo "✅ Build completed successfully"',
});
