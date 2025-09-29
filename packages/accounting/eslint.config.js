import base from '../../eslint.config.js';

export default [
  // Extend root config (includes centralized ignores)
  ...base,

  // Exclude utilities directory from linting
  {
    ignores: ['src/utils/**/*'],
  },

  // Package-specific overrides ONLY
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Package-specific rules only
      'security/detect-object-injection': 'warn', // Backend package - allow controlled access patterns
      
      // Enforce barrel imports for utilities (except the barrel file itself)
      'no-restricted-imports': [
        'error',
        {
                 paths: [
                   {
                     name: './utils/safe-object',
                     message: 'Import from utils barrel instead. Use: import { safeGet, round2 } from "./utils"'
                   },
                   {
                     name: './utils/omitUndefined',
                     message: 'Import from utils barrel instead. Use: import { omitUndefined, buildConditionalObject } from "./utils"'
                   }
                 ],
          patterns: [
            {
              group: [
                '@aibos/accounting/*',
                '**/utils/safe-object',
                '**/utils/omitUndefined',
                '**/utils/accounting-utilities'
              ],
              message: 'Import from @aibos/accounting (barrel) only.'
            }
          ]
        }
      ],
    },
  },
    {
      // Allow the barrel file to import from core files
      files: ['src/utils/index.ts'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
];
