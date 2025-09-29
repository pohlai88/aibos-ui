// Enhanced ESLint Configuration - Extends Root Config
// This provides better control with standard tooling (Flat Config)

import base from '../../eslint.config.js'; // path from accounting-contracts → root

export default [
  // Extend root config (includes centralized ignores)
  ...base,

  // Backend package specific overrides
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Backend package specific rules
      'security/detect-object-injection': 'warn', // Backend package - allow controlled access patterns
    },
  },
];
