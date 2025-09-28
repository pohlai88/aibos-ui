// Enhanced ESLint Configuration - Extends Root Config
// This provides better control with standard tooling (Flat Config)

import base from '../../eslint.config.js'; // path from web → root

export default [
  // Extend root config (includes centralized ignores)
  ...base,

  // Next.js specific overrides
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    rules: {
      // Next.js specific rules
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',
      '@next/next/no-page-custom-font': 'error',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-title-in-document-head': 'error',
      '@next/next/no-unwanted-polyfillio': 'error',
      '@next/next/no-css-tags': 'error',
      '@next/next/no-head-element': 'error',
      '@next/next/no-head-import-in-document': 'error',
      '@next/next/no-script-component-in-head': 'error',
      '@next/next/no-styled-jsx-in-document': 'error',
      '@next/next/no-typos': 'error',
      '@next/next/no-document-import-in-page': 'error',
      '@next/next/no-duplicate-head': 'error',
      
      // Next.js specific overrides
      'jsx-a11y/anchor-is-valid': 'off', // Next.js Link component handles this
      'import/no-anonymous-default-export': 'off', // Next.js pages use default exports
    },
  },
];
