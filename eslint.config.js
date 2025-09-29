import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
// import perfectionist from 'eslint-plugin-perfectionist'; // Removed - too strict for development workflow
import promise from 'eslint-plugin-promise';
import sonarjs from 'eslint-plugin-sonarjs';
import security from 'eslint-plugin-security';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import jsoncParser from 'jsonc-eslint-parser';
import jsonc from 'eslint-plugin-jsonc';
import noNpmUsage from './scripts/eslint-rules/no-npm-usage.js';
// import aibosUi from './packages/ui/eslint-plugin/index.js'; // REMOVED - custom plugin deleted
// import nextPlugin from 'eslint-config-next'; // Temporarily disabled due to ESLint compatibility issues

export default [
  // Base configuration
  js.configs.recommended,

  // Single source of truth for all ignores
  {
    ignores: [
      // Build artifacts
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '**/*.gen.ts',
      '**/*.generated.ts',
      '**/dist/**',
      '**/build/**',
      '**/apps/web/.next/**',
      '**/apps/web/.next/types/**',
      '**/apps/web/.next/static/**',
      '**/apps/web/.next/server/**',
      
      // Test files and related content - SINGLE SOURCE OF TRUTH
      '**/*.test.*',
      '**/*.spec.*',
      '**/__tests__/**',
      '**/__mocks__/**',
      '**/tests/**',
      '**/test/**',
      '**/e2e/**',
      '**/integration/**',
      '**/fixtures/**',
      '**/*.stories.*',
      '**/*.story.*',
      '**/*.snap',
      'coverage/**',
    ],
  },

  // TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Node.js globals
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        // Node.js namespace
        NodeJS: 'readonly',
        // Browser/DOM globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        performance: 'readonly',
        // DOM element types
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLOListElement: 'readonly',
        HTMLLIElement: 'readonly',
        HTMLParagraphElement: 'readonly',
        HTMLLabelElement: 'readonly',
        HTMLSpanElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLHeadingElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        // SVG types
        SVGElement: 'readonly',
        SVGSVGElement: 'readonly',
        // Media query and resize observer
        ResizeObserver: 'readonly',
        ResizeObserverEntry: 'readonly',
        MediaQueryList: 'readonly',
        MediaQueryListEvent: 'readonly',
        DOMRectReadOnly: 'readonly',
        IntersectionObserver: 'readonly',
        IntersectionObserverEntry: 'readonly',
        Window: 'readonly',
        // React/JSX globals
        JSX: 'readonly',
        React: 'readonly',
        // Theme/Design system globals (for UI components)
        primary: 'readonly',
        spacing: 'readonly',
        neutral: 'readonly',
        // Other globals
        btoa: 'readonly',
        atob: 'readonly',
        URL: 'readonly',
        alert: 'readonly',
        // Test globals
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vitest: 'readonly',
        vi: 'readonly',
        // CommonJS globals
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      boundaries,
      import: importPlugin,
      // perfectionist, // Removed - too strict for development workflow
      promise,
      sonarjs,
      security,
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      'no-npm-usage': noNpmUsage,
      jsonc,
      // 'aibos-ui': aibosUi, // REMOVED - custom plugin deleted
    },
    rules: {
      // Enhanced TypeScript rules
      '@typescript-eslint/no-explicit-any': [
        'error',
        { fixToUnknown: true, ignoreRestArgs: false },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-unused-vars': 'off', // ← CRITICAL: Disable base rule first
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Boundaries rules (architectural lineage) - temporarily disabled for baseline
      'boundaries/element-types': 'off',
      'boundaries/no-unknown-files': 'off',

      // Import hygiene - simplified approach
      'import/order': 'off',
      // Removed perfectionist/sort-imports - too strict for development workflow
      // Use Prettier or IDE auto-formatting for consistent import ordering
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.ts',
            '**/*.spec.ts',
            '**/test/**',
            '**/__tests__/**',
            '**/*.config.{js,cjs,ts}',
            'scripts/**',
            'tests/**',
            '**/setup.ts',
            '**/setup.js',
          ],
        },
      ],

      // Enhanced Security rules - optimized for development workflow
      'security/detect-object-injection': 'warn', // Keep as warn for controlled access patterns
      'security/detect-non-literal-regexp': 'warn', // Downgrade to warn for dynamic patterns
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',

      // Critical security rules only
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn', // Allow for build scripts
      'security/detect-non-literal-require': 'warn', // Allow for dynamic imports
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-new-buffer': 'error',

      // Complexity rules - Temporarily disabled for development
      complexity: 'off', // Temporarily disabled
      'max-depth': 'off', // Temporarily disabled
      'max-lines-per-function': 'off', // Temporarily disabled

      // Performance rules
      'sonarjs/no-duplicate-string': 'error',
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      'sonarjs/cognitive-complexity': 'off', // Temporarily disabled

      // NPM blocking rules
      'no-npm-usage/no-npm-usage': 'error',
      'no-npm-usage/no-npm-scripts': 'error',
      'no-npm-usage/no-npm-install': 'error',
      'no-npm-usage/no-npm-run': 'error',
      'no-npm-usage/no-npm-add': 'error',
      'no-npm-usage/no-npm-remove': 'error',
      'no-npm-usage/no-npm-update': 'error',
      'no-npm-usage/no-npm-publish': 'error',

      // Local policies
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react',
              message: 'Use @aibos/ui/icons wrapper to avoid heavy bundles.',
            },
            {
              name: 'lodash',
              message: 'Use lodash-es per‑method imports or stdlib.',
            },
          ],
          patterns: [
            // No deep internal paths across services
            '@aibos/*/src/*',
          ],
        },
      ],
    },
    settings: {
      'import/resolver': {
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
      },
      'import/internal-regex': '^(@aibos|~)/',
      'boundaries/elements': [
        { type: 'packages', pattern: 'packages/*/src/**/*' },
        { type: 'apps', pattern: 'apps/*/src/**/*' },
        { type: 'services', pattern: 'services/*/src/**/*' },
      ],
      'boundaries/ignore': ['**/*.test.ts', '**/*.spec.ts', '**/*.config.ts', '**/*.d.ts'],
    },
  },

  // React/JSX specific rules
  {
    files: ['**/*.tsx'],
    rules: {
      // Re-enable JSX-a11y rules for React files
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },


  // Config files and scripts
  {
    files: [
      '**/*.config.{js,cjs,ts,mjs}',
      '**/tsup.config.ts',
      '**/vitest.config.ts',
      '**/playwright.config.ts',
      '**/tailwind.config.js',
      '**/next.config.js',
      '**/postcss.config.js',
      '**/eslint.config.{js,mjs,cjs}',
      '**/dangerfile.js',
      '**/turbo.json',
      '**/pnpm-workspace.yaml',
      '**/package.json',
      '**/tsconfig*.json',
      '**/vite.config.ts',
      '**/webpack.config.js',
      '**/rollup.config.js',
      '**/jest.config.{js,ts}',
      '**/cypress.config.{ts,js}',
      'scripts/**/*.{js,ts,cjs,mjs}',
      '**/scripts/**/*.{js,ts,cjs,mjs}',
      '**/codemods/**/*.{js,ts,cjs,mjs}',
      '**/eslint-rules/**/*.{js,ts,cjs,mjs}',
      '**/grafana-datasources/**/*.{yml,yaml,json,ts,js,mjs,cjs}',
      '**/storybook/**/*.{ts,js,mjs,cjs}',
      '**/.storybook/**/*.{ts,js,mjs,cjs}',
      // Root-level scripts
      '*.js',
      '*.mjs',
      '*.cjs',
    ],
    plugins: {
      security,
    },
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        // Node.js globals
        NodeJS: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        // CommonJS globals
        define: 'readonly',
        defineProperty: 'readonly',
        // Build tool globals
        import: 'readonly',
        importMeta: 'readonly',
      },
    },
    rules: {
      'import/no-commonjs': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-undef': 'off', // Config files often use global variables
      'no-unused-vars': 'off', // Scripts often have unused vars
      '@typescript-eslint/no-unused-vars': 'off',
      'security/detect-object-injection': 'warn', // Config files often use dynamic keys
      'security/detect-non-literal-fs-filename': 'warn', // Build scripts often use dynamic paths
      'security/detect-non-literal-regexp': 'warn', // Config files may use dynamic regex
    },
  },

  // UI package specific rules
  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    rules: {
      // Keep explicit types for library surface; relax for internal fns
      '@typescript-eslint/explicit-module-boundary-types': ['warn'],

      // Allow null for React components (empty renders) but prefer undefined for internal logic
      // Note: React components need to return null for empty renders

      // Guarded dynamic access is okay with justification comments
      'security/detect-object-injection': 'error',

      // Keep complexity realistic, fail egregious cases - Temporarily disabled
      'sonarjs/cognitive-complexity': 'off', // Temporarily disabled
      // Disable perfectionist import sorting for UI package (too strict)
      'perfectionist/sort-imports': 'off',
      // Handle unused vars in UI package
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Next.js app specific configuration
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      // Next.js specific rules - manually configured due to ESLint compatibility issues
      // These rules are equivalent to what eslint-config-next would provide
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      // Disable some rules that conflict with Next.js patterns
      'jsx-a11y/anchor-is-valid': 'off', // Next.js Link component handles this
      'import/no-anonymous-default-export': 'off', // Next.js pages use default exports
    },
  },

  // BFF package (NestJS) - handle injected dependencies
  {
    files: ['apps/bff/**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Eventsourcing package - handle unused vars and any types
  {
    files: ['packages/eventsourcing/**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Accounting package - handle unused vars and enum values
  {
    files: ['packages/accounting/**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Accounting-web package - handle unused vars
  {
    files: ['packages/accounting-web/**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Web app - handle unused vars and restricted imports
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Temporarily disable restricted imports for lucide-react
      'no-restricted-imports': 'off',
    },
  },

  // ESLint plugin - Node.js environment for CommonJS
  {
    files: ['packages/ui/eslint-plugin/**/*.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        global: 'readonly',
        NodeJS: 'readonly',
      },
    },
    rules: {
      'import/no-commonjs': 'off',
    },
  },

  // Tailwind plugins - CommonJS files
  {
    files: ['**/tailwind.plugins/**/*.js'],
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
        NodeJS: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off', // Allow globals in CommonJS files
      'import/no-commonjs': 'off',
    },
  },

  // ------------- TIERED COMPLEXITY RULES -------------
  // ERP-grade complexity management with folder-based overrides
  
  // Base TypeScript settings with real complexity measures
  {
    name: 'complexity/base',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { 
        project: ['./tsconfig.json'],
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: { 
      '@typescript-eslint': typescript, 
      sonarjs: sonarjs,
      security: security
    },
    rules: {
      // General safety/perf rules
      'security/detect-object-injection': 'error',
      'no-new-func': 'error',
      'no-eval': 'error',
      
      // Prefer real complexity measures over raw line count - Temporarily disabled
      complexity: 'off', // Temporarily disabled
      'sonarjs/cognitive-complexity': 'off', // Temporarily disabled
      // '@typescript-eslint/max-params': ['error', { max: 5 }], // Temporarily disabled
      
      // Tiered line count - base threshold - Temporarily disabled
      'max-lines-per-function': 'off', // Temporarily disabled
    },
  },

  // Base JavaScript settings (no TypeScript parser)
  {
    name: 'complexity/base-js',
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { 
      sonarjs: sonarjs,
      security: security
    },
    rules: {
      // General safety/perf rules
      'security/detect-object-injection': 'error',
      'no-new-func': 'error',
      'no-eval': 'error',
      
      // Prefer real complexity measures over raw line count - Temporarily disabled
      complexity: 'off', // Temporarily disabled
      'sonarjs/cognitive-complexity': 'off', // Temporarily disabled
      
      // Tiered line count - base threshold - Temporarily disabled
      'max-lines-per-function': 'off', // Temporarily disabled
    },
  },

  // UI components tighter (favor hooks & composition)
  {
    name: 'complexity/ui-components',
    files: ['packages/ui/**', 'packages/ui-business/**'],
    rules: {
      complexity: 'off', // Temporarily disabled
      'sonarjs/cognitive-complexity': 'off', // Temporarily disabled
      'max-lines-per-function': 'off', // Temporarily disabled
      // '@typescript-eslint/max-params': ['error', { max: 5 }], // Temporarily disabled
    },
  },

  // Charts/visualizations: allow lines, control complexity
  {
    name: 'complexity/charts',
    files: ['**/financial-charts/**'],
    rules: {
      'max-lines-per-function': 'off', // Temporarily disabled
      complexity: 'off', // Temporarily disabled
      'sonarjs/cognitive-complexity': 'off', // Temporarily disabled
      // '@typescript-eslint/max-params': ['error', { max: 6 }], // Temporarily disabled
    },
  },

  // Scripts/CLI: slightly higher line budget
  {
    name: 'complexity/scripts',
    files: ['**/scripts/**'],
    rules: {
      'max-lines-per-function': 'off', // Temporarily disabled
      complexity: 'off', // Temporarily disabled
      'sonarjs/cognitive-complexity': 'off', // Temporarily disabled
      // '@typescript-eslint/max-params': ['error', { max: 6 }], // Temporarily disabled
    },
  },

  // Turn off in seeds/migrations/generated/storybook
  {
    name: 'complexity/exclusions',
    files: [
      '**/__fixtures__/**',
      '**/*.stories.*',
      'apps/**/seeds/**',
      '**/migrations/**',
      '**/generated/**',
    ],
    rules: {
      'max-lines-per-function': 'off',
      complexity: 'off',
      'sonarjs/cognitive-complexity': 'off',
      '@typescript-eslint/max-params': 'off',
    },
  },

  // JSON/JSONC file handling - stops "Unexpected token :" errors
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: jsoncParser,
    },
    plugins: {
      jsonc,
    },
    rules: {},
  },
  {
    files: ['**/*.jsonc'],
    languageOptions: {
      parser: jsoncParser,
    },
    plugins: {
      jsonc,
    },
    rules: {},
  },

  // ------------- PRETTIER INTEGRATION -------------
  // IMPORTANT: Prettier config MUST be LAST to disable conflicting formatting rules
  prettier,
];
