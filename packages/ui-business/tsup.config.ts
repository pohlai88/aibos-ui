import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Always false - types generated separately
  splitting: true,
  sourcemap: true,
  clean: false, // Always false - matches working packages
  treeshake: true,
  skipNodeModulesBundle: true,
  minify: true,
  target: 'es2022',
  external: [
    'react',
    'react-dom',
    '@radix-ui/react-accordion',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-dialog',
    '@radix-ui/react-menu',
    '@radix-ui/react-popover',
    '@radix-ui/react-radio-group',
    '@radix-ui/react-select',
    '@radix-ui/react-slot',
    '@radix-ui/react-switch',
    '@radix-ui/react-tabs',
    '@radix-ui/react-toast',
    '@radix-ui/react-tooltip',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'lucide-react',
  ],
  esbuildOptions(options) {
    options.treeShaking = true;
    options.drop = ['console', 'debugger'];
  },
});
