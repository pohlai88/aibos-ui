import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false,        // ← tsc builds the .d.ts via `pnpm typecheck`
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'es2022',
  splitting: false,
  shims: false,
  treeshake: true,
  cjsInterop: true,
  // Externals managed by the package.json "peerDependencies"
  external: [
    'react', 'react-dom',
    // add framework libs here as peers to keep bundles slim
  ]
});
