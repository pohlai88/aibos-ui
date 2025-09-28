import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Temporarily disable DTS - will create manually
  splitting: true,
  sourcemap: true,
  clean: false,
  treeshake: true,
  skipNodeModulesBundle: true,
  minify: true,
  target: 'es2022',
  external: ['node:*'],
});
