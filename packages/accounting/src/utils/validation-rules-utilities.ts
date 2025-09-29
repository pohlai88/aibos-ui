/**
 * Validation Rules - SSOT Implementation
 * 
 * Pre-configured validation rules for common accounting operations.
 * Integrates with SSOT validation policies for consistent behavior.
 */

import { 
  type ValidationIssue,
  type BusinessValidationResult
} from './validation-utilities';
import { 
  type BaseAccount,
  type BaseTransaction,
  type BaseJournalEntry,
  type BaseTaxCalculation
} from './core-types-utilities';
import { 
  type ValidationRule,
  type Validator
} from './validation-pipeline-core-utilities';
import { 
  createValidationIssue,
  createBusinessValidationResult
} from './policies/validation-policy';

// ============================================================================
// ACCOUNT VALIDATION RULES
// ============================================================================

export const accountValidationRules: ValidationRule<BaseAccount>[] = [
  {
    name: 'accountCodeFormat',
    validator: (account: BaseAccount): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (!account.code || account.code.length < 3 || account.code.length > 20) {
        issues.push(createValidationIssue(
          'INVALID_CODE_FORMAT',
          'Account code must be between 3 and 20 characters',
          'error',
          'code',
          account.code
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  },
  {
    name: 'accountCodePattern',
    validator: (account: BaseAccount): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (!account.code.match(/^[A-Z0-9]+$/)) {
        issues.push(createValidationIssue(
          'INVALID_CODE_PATTERN',
          'Account code must contain only uppercase letters and numbers',
          'error',
          'code',
          account.code
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  },
  {
    name: 'accountNameRequired',
    validator: (account: BaseAccount): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (!account.name || account.name.trim().length === 0) {
        issues.push(createValidationIssue(
          'MISSING_NAME',
          'Account name is required',
          'error',
          'name',
          account.name
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  },
  {
    name: 'accountNameLength',
    validator: (account: BaseAccount): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (account.name && account.name.length > 100) {
        issues.push(createValidationIssue(
          'NAME_TOO_LONG',
          'Account name should not exceed 100 characters',
          'warning',
          'name',
          account.name
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'warning',
    stopOnError: false
  }
];

// ============================================================================
// TRANSACTION VALIDATION RULES
// ============================================================================

export const transactionValidationRules: ValidationRule<BaseTransaction>[] = [
  {
    name: 'transactionAmountPositive',
    validator: (transaction: BaseTransaction): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (transaction.amount < 0) {
        issues.push(createValidationIssue(
          'NEGATIVE_AMOUNT',
          'Transaction amount must be positive',
          'error',
          'amount',
          transaction.amount
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  },
  {
    name: 'transactionAmountPrecision',
    validator: (transaction: BaseTransaction): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (transaction.amount % 0.01 !== 0) {
        issues.push(createValidationIssue(
          'INVALID_PRECISION',
          'Transaction amount must have maximum 2 decimal places',
          'error',
          'amount',
          transaction.amount
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  },
  {
    name: 'transactionDateValid',
    validator: (transaction: BaseTransaction): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (!transaction.date || isNaN(transaction.date.getTime())) {
        issues.push(createValidationIssue(
          'INVALID_DATE',
          'Transaction date must be valid',
          'error',
          'date',
          transaction.date
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  },
  {
    name: 'transactionDescriptionRequired',
    validator: (transaction: BaseTransaction): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (!transaction.description || transaction.description.trim().length === 0) {
        issues.push(createValidationIssue(
          'MISSING_DESCRIPTION',
          'Transaction description is required',
          'error',
          'description',
          transaction.description
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  }
];

// ============================================================================
// JOURNAL ENTRY VALIDATION RULES
// ============================================================================

export const journalEntryValidationRules: ValidationRule<BaseJournalEntry>[] = [
  {
    name: 'journalEntryBalanced',
    validator: (entry: BaseJournalEntry): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (entry.totalDebits !== entry.totalCredits) {
        issues.push(createValidationIssue(
          'UNBALANCED_ENTRY',
          'Journal entry must be balanced (debits = credits)',
          'error',
          'balance',
          { totalDebits: entry.totalDebits, totalCredits: entry.totalCredits }
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  },
  {
    name: 'journalEntryDateValid',
    validator: (entry: BaseJournalEntry): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (!entry.date || isNaN(entry.date.getTime())) {
        issues.push(createValidationIssue(
          'INVALID_DATE',
          'Journal entry date must be valid',
          'error',
          'date',
          entry.date
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  },
  {
    name: 'journalEntryDescriptionRequired',
    validator: (entry: BaseJournalEntry): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (!entry.description || entry.description.trim().length === 0) {
        issues.push(createValidationIssue(
          'MISSING_DESCRIPTION',
          'Journal entry description is required',
          'error',
          'description',
          entry.description
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  }
];

// ============================================================================
// TAX VALIDATION RULES
// ============================================================================

export const taxValidationRules: ValidationRule<BaseTaxCalculation>[] = [
  {
    name: 'taxRateValid',
    validator: (tax: BaseTaxCalculation): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (tax.rate < 0 || tax.rate > 1) {
        issues.push(createValidationIssue(
          'INVALID_RATE',
          'Tax rate must be between 0 and 1',
          'error',
          'rate',
          tax.rate
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  },
  {
    name: 'taxAmountPositive',
    validator: (tax: BaseTaxCalculation): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (tax.amount < 0) {
        issues.push(createValidationIssue(
          'NEGATIVE_AMOUNT',
          'Tax amount must be positive',
          'error',
          'amount',
          tax.amount
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  },
  {
    name: 'taxTypeRequired',
    validator: (tax: BaseTaxCalculation): BusinessValidationResult => {
      const issues: ValidationIssue[] = [];
      
      if (!tax.taxType || tax.taxType.trim().length === 0) {
        issues.push(createValidationIssue(
          'MISSING_TYPE',
          'Tax type is required',
          'error',
          'taxType',
          tax.taxType
        ));
      }
      
      return createBusinessValidationResult(issues.length === 0, issues);
    },
    severity: 'error',
    stopOnError: true
  }
];

// ============================================================================
// VALIDATION RULE REGISTRY
// ============================================================================

export const VALIDATION_RULES = {
  account: accountValidationRules,
  transaction: transactionValidationRules,
  journalEntry: journalEntryValidationRules,
  tax: taxValidationRules
} as const;

export type ValidationRuleType = keyof typeof VALIDATION_RULES;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get validation rules for a specific type
 */
export function getValidationRules<T>(type: ValidationRuleType): ValidationRule<T>[] {
  return VALIDATION_RULES[type] as ValidationRule<T>[];
}

/**
 * Create a validator from a simple function
 */
export function createValidator<T>(
  name: string,
  validatorFn: (data: T) => boolean | string,
  severity: 'error' | 'warning' = 'error'
): ValidationRule<T> {
  return {
    name,
    validator: (data: T) => {
      const result = validatorFn(data);
      
      if (typeof result === 'boolean') {
        return createBusinessValidationResult(result, []);
      } else {
        return createBusinessValidationResult(false, [
          createValidationIssue('VALIDATION_FAILED', result, severity)
        ]);
      }
    },
    severity,
    stopOnError: severity === 'error'
  };
}

/**
 * Create a conditional validator
 */
export function createConditionalValidator<T>(
  name: string,
  condition: (data: T) => boolean,
  validator: Validator<T>,
  severity: 'error' | 'warning' = 'error'
): ValidationRule<T> {
  return {
    name,
    validator: (data: T) => {
      if (condition(data)) {
        return validator(data);
      }
      return createBusinessValidationResult(true, []);
    },
    severity,
    stopOnError: severity === 'error'
  };
}
