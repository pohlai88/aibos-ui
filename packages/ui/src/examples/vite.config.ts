import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@aibos/ui': path.resolve(__dirname, '../'),
    },
  },
  css: {
    postcss: {
      plugins: [
        require('tailwindcss')({
          config: path.resolve(__dirname, '../../tailwind.config.js'),
        }),
        require('autoprefixer'),
      ],
    },
  },
  server: {
    port: 3001,
    open: true,
  },
});
