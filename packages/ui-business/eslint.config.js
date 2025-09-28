// Enhanced ESLint Configuration - Extends Root Config
// This provides better control with standard tooling (Flat Config)

import base from '../../eslint.config.js'; // path from ui-business → root

export default [
  // Extend root config (includes centralized ignores)
  ...base,

  // UI-Business specific overrides (do NOT re-enable formatting rules)
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // UI-Business specific non-formatting rules only
      'unicorn/no-null': 'off', // Allow null for React components (empty renders)
      'security/detect-object-injection': 'error', // Stricter for UI package
      
      // Enterprise-appropriate complexity thresholds for UI-Business
      'complexity': ['warn', 20],                    // Cyclomatic complexity limit
      'max-depth': ['warn', 5],                      // Nesting depth limit
      'max-lines-per-function': ['warn', 80],       // Function length limit
      'sonarjs/cognitive-complexity': ['warn', 25], // Cognitive complexity limit
      '@typescript-eslint/max-params': ['warn', { max: 5 }], // Parameter count limit
      '@typescript-eslint/no-explicit-any': ['error'],
      '@typescript-eslint/explicit-module-boundary-types': ['error']
    },
  },

  // Relax lint on stories, tests, and generated files
  {
    files: ['**/*.stories.@(ts|tsx)', '**/*.test.@(ts|tsx)', '**/__tests__/**/*', '**/*.generated.@(ts|tsx)'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines-per-function': 'off',
      'sonarjs/cognitive-complexity': 'off'
    }
  },

  // CommonJS files (fix 'require'/'module' not defined)
  {
    files: ['**/*.{cjs,cts}'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off', // Allow globals in CommonJS files
    },
  },

  // Note: Prettier config is handled by root config
];