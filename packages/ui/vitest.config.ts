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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', '**/coverage/**'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
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
      '@scripts': path.resolve(__dirname, './src/scripts'),
      '@scripts/*': path.resolve(__dirname, './src/scripts/*'),
      '@examples': path.resolve(__dirname, './src/examples'),
      '@examples/*': path.resolve(__dirname, './src/examples/*'),
      '@types': path.resolve(__dirname, './src/types'),
      '@types/*': path.resolve(__dirname, './src/types/*'),
    },
  },
});
