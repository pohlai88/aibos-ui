/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    // Enhanced test configuration for UI packages
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Parallel execution for faster tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/*.stories.*',
        '**/*.story.*',
        '**/index.ts', // Barrel exports
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
        // Include source maps for better coverage reporting
        // sourcemap: true, // Removed - not supported in current version
    },
    // Performance monitoring
    benchmark: {
      include: ['src/**/*.{bench,benchmark}.{js,ts,jsx,tsx}'],
      exclude: ['node_modules', 'dist'],
    },
    // UI-specific test utilities
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@aibos/ui': path.resolve(__dirname, './src'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@utils/*': path.resolve(__dirname, './src/utils/*'),
      '@icons': path.resolve(__dirname, './src/icons'),
      '@icons/*': path.resolve(__dirname, './src/icons/*'),
      '@components': path.resolve(__dirname, './src/components'),
      '@components/*': path.resolve(__dirname, './src/components/*'),
      '@primitives': path.resolve(__dirname, './src/primitives'),
      '@primitives/*': path.resolve(__dirname, './src/primitives/*'),
      '@radix': path.resolve(__dirname, './src/radix'),
      '@radix/*': path.resolve(__dirname, './src/radix/*'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@hooks/*': path.resolve(__dirname, './src/hooks/*'),
      '@tokens': path.resolve(__dirname, './src/tokens'),
      '@tokens/*': path.resolve(__dirname, './src/tokens/*'),
      '@performance': path.resolve(__dirname, './src/performance'),
      '@performance/*': path.resolve(__dirname, './src/performance/*'),
      '@test': path.resolve(__dirname, './src/test'),
      '@test/*': path.resolve(__dirname, './src/test/*'),
      '@types': path.resolve(__dirname, './src/types'),
      '@types/*': path.resolve(__dirname, './src/types/*'),
    },
  },
  // Development server configuration
  server: {
    port: 3000,
    open: true,
  },
  // Build optimization
  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: true,
  },
});
