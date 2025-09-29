// Enhanced ESLint Configuration - Extends Root Config
// This provides better control with standard tooling (Flat Config)

import base from '../../eslint.config.js'; // path from accounting-web → root

export default [
  // Extend root config (includes centralized ignores)
  ...base,

  // Frontend package specific overrides
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Frontend package specific rules
      'security/detect-object-injection': 'error', // Frontend package - stricter security
    },
  },
];
