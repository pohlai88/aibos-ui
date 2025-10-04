import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import tailwind from 'eslint-plugin-tailwindcss'
import security from 'eslint-plugin-security'
import prettier from 'eslint-config-prettier'

export default [
  // Base configuration
  js.configs.recommended,

  // UI Package specific ignores
  {
    ignores: [
      // Build artifacts
      'node_modules/',
      'dist/',
      'build/',
      '.turbo/',
      'coverage/',
      '**/*.tsbuildinfo',
      '**/.tsbuildinfo',
      '**/.cache/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/build/**',
      // Lock files
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
      // Storybook files
      '**/*.stories.*',
      '**/*.story.*',
      '**/*.snap',
      // Generated and misc
      '**/.next/**',
      '**/.vite/**',
      '**/.storybook/**',
      // JSON files (handled separately)
      '**/*.json'
    ],
  },

  // TypeScript baseline for all TS/TSX (excluding JSON files)
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.json'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        // Enable fast, zero-config type-aware linting across monorepo
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Browser/DOM globals for UI components
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        performance: 'readonly',
        localStorage: 'readonly',
        process: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLLabelElement: 'readonly',
        HTMLParagraphElement: 'readonly',
        HTMLHeadingElement: 'readonly',
        HTMLLIElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLSpanElement: 'readonly',
        HTMLOListElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        SVGSVGElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        Document: 'readonly',
        MediaQueryList: 'readonly',
        MediaQueryListEvent: 'readonly',
        ResizeObserver: 'readonly',
        ResizeObserverEntry: 'readonly',
        ResizeObserverCallback: 'readonly',
        IntersectionObserver: 'readonly',
        IntersectionObserverEntry: 'readonly',
        IntersectionObserverCallback: 'readonly',
        MutationObserver: 'readonly',
        MutationCallback: 'readonly',
        DOMRect: 'readonly',
        DOMRectReadOnly: 'readonly',
        Performance: 'readonly',
        FrameRequestCallback: 'readonly',
        Window: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // React/JSX globals
        JSX: 'readonly',
        React: 'readonly',
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
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      'tailwindcss': tailwind,
      security,
    },
    rules: {
      // TypeScript rules optimized for UI components
      '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true, ignoreRestArgs: false }],
      // For UI components we can infer props/returns; keep this off to reduce noise
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports', disallowTypeAnnotations: false },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Basic hardening; keep this lightweight for UI
      'security/detect-object-injection': 'warn',
      // Tailwind: keep classes ordered and prevent drift to ad-hoc classnames
      'tailwindcss/classnames-order': 'warn',
      // Disable custom classname checking since we use no-restricted-syntax for raw color detection
      'tailwindcss/no-custom-classname': 'off',
      // 🚫 Ban raw Tailwind color utilities in JSX className literals/templates.
      // Encourage tokens (e.g., semantic-text-primary) instead.
      // This targets <div className="..."> and className={`...`}
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/\\b(?:text|bg|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\\b/]",
          message:
            'Use semantic tokens (e.g., semantic-text-primary) — raw Tailwind color utilities are forbidden in UI code.',
        },
        {
          // Template literals: className={`text-blue-600 ...`}
          selector:
            "JSXAttribute[name.name='className'] TemplateLiteral[quasis.0.value.raw=/\\b(?:text|bg|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\\b/]",
          message:
            'Use semantic tokens (e.g., semantic-text-primary) — raw Tailwind color utilities are forbidden in UI code.',
        },
        {
          // cn("text-blue-600", ...) or cn(`text-blue-600 ...`)
          selector:
            "CallExpression[callee.name='cn'] Literal[value=/\\b(?:text|bg|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\\b/]",
          message:
            'Use semantic tokens (e.g., semantic-text-primary) — raw Tailwind color utilities are forbidden in UI code.',
        },
        {
          // cva({ base: "text-blue-600 ..." })
          selector:
            "CallExpression[callee.name='cva'] Property[key.name='base'] Literal[value=/\\b(?:text|bg|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\\b/]",
          message:
            'Use semantic tokens (e.g., semantic-text-primary) — raw Tailwind color utilities are forbidden in UI code.',
        },
        {
          // Ban raw <svg> elements outside icons package
          selector: "JSXOpeningElement[name.name='svg']",
          message: 'Use @icons/internal/* components, not raw <svg> elements.',
        },
      ],
    },
    settings: {
      tailwindcss: { callees: ['cn', 'cva'] }, // recognize your common class combiner helpers
      react: { version: 'detect' },
    },
  },

  // React/JSX specific rules for UI components
  {
    files: ['**/*.tsx'],
    rules: {
      // Essential JSX-a11y rules for UI components
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/heading-has-content': 'error',
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
      // React hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Icons package - allow raw SVG elements
  {
    files: ['packages/ui/src/icons/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off', // Allow raw <svg> in icons package
    },
  },

  // Test files configuration - relaxed rules for UI testing
  {
    files: [
      '**/*.test.{js,ts,jsx,tsx}',
      '**/*.spec.{js,ts,jsx,tsx}',
      '**/__tests__/**/*.{js,ts,jsx,tsx}',
      '**/__mocks__/**/*.{js,ts,jsx,tsx}',
      '**/tests/**/*.{js,ts,jsx,tsx}',
      '**/test/**/*.{js,ts,jsx,tsx}',
    ],
    rules: {
      // Relaxed rules for test files
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': 'off',
      'jsx-a11y/no-autofocus': 'off', // Allow autofocus in tests
      'tailwindcss/no-custom-classname': 'off',
      // Let tests use raw colors if needed for snapshots/visual assertions
      'no-restricted-syntax': 'off',
    },
  },

  // Config files - minimal rules for configuration files
  {
    files: [
      // Allow raw tailwind in theme/tokens/stories/playground by design
      'src/theme/**',
      'src/tokens/**',
      'src/**/playground/**',
      '**/*.stories.*',

      '**/*.config.{js,cjs,ts,mjs}',
      '**/tsup.config.ts',
      '**/vitest.config.ts',
      '**/tailwind.config.js',
      '**/postcss.config.js',
      '**/eslint.config.{js,mjs,cjs}',
      '**/turbo.json',
      '**/pnpm-workspace.yaml',
      '**/package.json',
      '**/tsconfig*.json',
      '**/vite.config.ts',
      'scripts/**/*.{js,ts,cjs,mjs}',
      // Root level config files
      'eslint.config.js',
      'pnpm-workspace.yaml',
      'scripts/enforce-pnpm.js',
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        // Disable project service for config files to avoid parsing errors
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
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
        NodeJS: 'readonly',
      },
    },
    rules: {
      // Minimal rules for config files
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-unused-labels': 'off',
      'tailwindcss/no-custom-classname': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  // Narrow, type-aware pass ONLY for src/** to keep ESLint fast
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Keep the type-driven checks here if you want to add any later
    },
  },

  // Prettier integration (must be last)
  prettier,
]
