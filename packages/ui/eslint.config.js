// Enhanced ESLint Configuration - Extends Root Config
// This provides better control with standard tooling (Flat Config)

import base from '../../eslint.config.js'; // path from ui → root

export default [
  // Extend root config (includes centralized ignores)
  ...base,

  // UI-specific overrides (do NOT re-enable formatting rules)
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // UI-specific non-formatting rules only
      'unicorn/no-null': 'off', // Allow null for React components (empty renders)
      'security/detect-object-injection': 'error', // Stricter for UI package
      
      // React-specific abbreviations
      'unicorn/prevent-abbreviations': [
        'warn',
        {
          allowList: {
            // React-specific abbreviations
            Props: true,
            Ref: true,
            refs: true,
            prop: true,
            props: true,
            ComponentProps: true,
            ComponentRef: true,
            ReactRef: true,
            StyleProps: true,
            AriaProps: true,
            ComponentPropsWithoutRef: true,
            // Common abbreviations
            e: true,
            err: true,
            ref: true,
            ctx: true,
            dir: true,
            rel: true,
            env: true,
            req: true,
            res: true,
            args: true,
            Args: true,
            arg: true,
            db: true,
            id: true,
            params: true,
            api: true,
            pkg: true,
            src: true,
            ts: true,
            tx: true,
            ulid: true,
            uuid: true,
            i18n: true,
            erp: true,
            ui: true,
            bff: true,
            crm: true,
            hrm: true,
            scm: true,
            wms: true,
          },
        },
      ],
      
      // Enterprise-appropriate complexity thresholds for UI components
      'complexity': 'off',                    // Disabled as requested
      'max-depth': 'off',                      // Disabled as requested
      'max-lines-per-function': 'off',       // Disabled as requested
      'sonarjs/cognitive-complexity': 'off', // Disabled as requested
      '@typescript-eslint/max-params': 'off', // Disabled as requested
    },
  },

  // Performance monitoring files - relaxed security rules for controlled metrics
  {
    files: ['src/performance/**/*.{ts,tsx}', 'src/utils/safe-object.utility.ts'],
    rules: {
      'security/detect-object-injection': 'warn', // Downgrade to warn for controlled metrics
    },
  },

  // Scripts directory - completely ignored from linting
  {
    ignores: ['src/scripts/**/*'],
  },

  // CommonJS files (fix 'require'/'module' not defined)
  {
    files: ['**/*.{cjs,cts}', '**/tailwind.plugins/**/*.js'],
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

  // ESM .mjs that run in Node but still see console
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off', // Allow globals in .mjs files
    },
  },

  // Specific rules for radix wrapper files - allow direct Radix imports
  {
    files: ['src/radix/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  // Specific rules for primitives files - allow direct Radix imports for form controls
  {
    files: ['src/primitives/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['lucide-react'],
              message: 'Use @aibos/ui/icons wrapper to avoid heavy bundles',
            },
          ],
        },
      ],
    },
  },

  // Specific rules for unsafe types file - allow any only here
  {
    files: ['src/types/unsafe.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Note: Prettier config is handled by root config
];
