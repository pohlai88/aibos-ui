import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['tests/perf/setup.ts'],
    environment: 'jsdom',
    include: [
      'scripts/**/*.spec.ts',
      'scripts/**/*.test.ts',
      'tests/perf/**/*.spec.ts',
      'tests/perf/**/*.test.ts',
      'packages/**/*.test.ts',
      'packages/**/*.spec.ts',
      'packages/**/*.test.mjs',
      'packages/**/*.spec.mjs',
    ],
    exclude: ['node_modules', 'dist'],
    // strong determinism
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    bail: 0,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['scripts/**/*.ts'],
      exclude: ['scripts/**/*.d.ts', 'scripts/**/__tests__/**'],
    },
  },
  esbuild: {
    target: 'node18',
  },
});
