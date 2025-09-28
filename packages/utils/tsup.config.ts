import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/security.ts', 'src/safeFs.ts', 'src/type-guards.ts', 'src/code-quality.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  sourcemap: true,
  clean: false,
  splitting: false,
  target: 'es2022',
  treeshake: true,
  minify: true,
  external: ['node:*'],
});
