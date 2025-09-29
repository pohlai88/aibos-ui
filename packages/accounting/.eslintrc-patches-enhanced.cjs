module.exports = {
  rules: {
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    'no-restricted-syntax': [
      'error',
      {
        selector: "TSEnumDeclaration[id.name='RoundingMethod']",
        message: 'Use policies/rounding-policy.RoundingMethod (SSOT) instead of redefining.',
      },
      {
        selector: "TSTypeAliasDeclaration[id.name='ConditionOperator']",
        message: 'Use shared-operators.ConditionOperator (SSOT) instead of redefining.',
      },
      {
        selector: "TSTypeAliasDeclaration[id.name='LogicalOperator']",
        message: 'Use shared-operators.LogicalOperator (SSOT) instead of redefining.',
      },
      {
        selector: "TSTypeAliasDeclaration[id.name='SupportedCurrency']",
        message: 'Use policies/currency-policy.SupportedCurrency (SSOT) instead of redefining.',
      },
      // Prevent circular imports
      {
        selector: "ImportDeclaration[source.value='./accounting-utilities']",
        message: 'Avoid importing from accounting-utilities in safe-object.ts to prevent circular dependency.',
      },
      {
        selector: "ImportDeclaration[source.value='./safe-object']",
        message: 'Avoid importing from safe-object in accounting-utilities.ts to prevent circular dependency.',
      },
    ],
    // Prevent string literals for rounding methods
    'no-restricted-globals': [
      'error',
      {
        name: 'round_half_up',
        message: 'Use RoundingMethod.HALF_UP instead of string literal.',
      },
      {
        name: 'round_half_even',
        message: 'Use RoundingMethod.HALF_EVEN instead of string literal.',
      },
      {
        name: 'round_up',
        message: 'Use RoundingMethod.CEILING instead of string literal.',
      },
      {
        name: 'round_down',
        message: 'Use RoundingMethod.FLOOR instead of string literal.',
      },
    ],
  },
};
