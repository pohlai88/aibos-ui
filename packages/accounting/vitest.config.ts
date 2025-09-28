import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node environment for accounting package
    environment: 'node',
    // Include scripts directory tests
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    // Exclude patterns specific to accounting package
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    // Longer timeout for accounting tests
    testTimeout: 30000,
    // Strong determinism (inherited from root)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    bail: 0,
    // Coverage configuration for accounting package
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'scripts/**/*.mjs'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'scripts/**/*.test.mjs', // Exclude test files from coverage
      ],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
  // ESBuild configuration for better ESM support
  esbuild: {
    target: 'node18',
    format: 'esm',
  },
});
