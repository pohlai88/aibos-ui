// Enhanced ESLint Configuration - Extends Root Config
// This provides better control with standard tooling (Flat Config)

import base from '../../eslint.config.js'; // path from utils → root

export default [
  // Extend root config (includes centralized ignores)
  ...base,

  // Utils-specific overrides optimized for utility functions
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Security rules - optimized for utility functions
      'security/detect-object-injection': 'warn', // Downgrade to warn for utility functions
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',

      // Code quality rules - appropriate for utility functions
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/no-unused-collection': 'warn',
      'sonarjs/cognitive-complexity': ['warn', 20],
    },
  },
];
