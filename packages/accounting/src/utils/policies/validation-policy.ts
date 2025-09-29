/**
 * Validation Policy - SSOT (Single Source of Truth)
 * 
 * Centralized validation rules and policies for consistent validation across all utilities.
 * This ensures uniform validation behavior and error handling throughout the accounting system.
 */

import type { ValidationIssue, BusinessValidationResult, ValidationCode } from '../validation-utilities';

// ============================================================================
// VALIDATION RULE TYPES
// ============================================================================

export interface ValidationRule {
  name: string;
  condition: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ValidationPolicy {
  id: string;
  name: string;
  description: string;
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  priority: number;
  maxRetries: number;
  timeoutMs: number;
  errorCodes: Record<string, string>;
  rules: ValidationRule[];
}

export const ACCOUNT_VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'accountCodeFormat',
    condition: 'code.length >= 3 && code.length <= 20',
    severity: 'error',
    message: 'Account code must be between 3 and 20 characters'
  },
  {
    name: 'accountCodePattern',
    condition: 'code.match(/^[A-Z0-9]+$/)',
    severity: 'error',
    message: 'Account code must contain only uppercase letters and numbers'
  },
  {
    name: 'accountNameRequired',
    condition: 'name && name.trim().length > 0',
    severity: 'error',
    message: 'Account name is required'
  },
  {
    name: 'accountNameLength',
    condition: 'name.length <= 100',
    severity: 'warning',
    message: 'Account name should not exceed 100 characters'
  }
];

export const CURRENCY_VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'currencySupported',
    condition: 'currency in SUPPORTED_CURRENCIES',
    severity: 'error',
    message: 'Currency must be supported'
  },
  {
    name: 'amountPositive',
    condition: 'amount >= 0',
    severity: 'error',
    message: 'Amount must be positive'
  },
  {
    name: 'amountPrecision',
    condition: 'amount % 0.01 === 0',
    severity: 'error',
    message: 'Amount must have maximum 2 decimal places'
  }
];

export const JOURNAL_ENTRY_VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'balancedEntry',
    condition: 'totalDebits === totalCredits',
    severity: 'error',
    message: 'Journal entry must be balanced (debits = credits)'
  },
  {
    name: 'hasLines',
    condition: 'lines.length > 0',
    severity: 'error',
    message: 'Journal entry must have at least one line'
  },
  {
    name: 'validDate',
    condition: 'date <= new Date()',
    severity: 'warning',
    message: 'Journal entry date should not be in the future'
  }
];

export const TAX_VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'taxRateValid',
    condition: 'rate >= 0 && rate <= 1',
    severity: 'error',
    message: 'Tax rate must be between 0 and 1'
  },
  {
    name: 'taxAmountPositive',
    condition: 'amount >= 0',
    severity: 'error',
    message: 'Tax amount must be positive'
  },
  {
    name: 'taxTypeRequired',
    condition: 'taxType && taxType.trim().length > 0',
    severity: 'error',
    message: 'Tax type is required'
  }
];

// ============================================================================
// VALIDATION POLICIES
// ============================================================================

export const ACCOUNT_VALIDATION_POLICY: ValidationPolicy = {
  id: 'account-validation',
  name: 'Account Validation Policy',
  description: 'Standard validation rules for account entities',
  active: true,
  effectiveDate: new Date('2024-01-01'),
  priority: 1,
  maxRetries: 3,
  timeoutMs: 5000,
  errorCodes: {
    'INVALID_CODE_FORMAT': 'Account code format is invalid',
    'INVALID_CODE_PATTERN': 'Account code pattern is invalid',
    'MISSING_NAME': 'Account name is required',
    'NAME_TOO_LONG': 'Account name exceeds maximum length'
  },
  rules: ACCOUNT_VALIDATION_RULES
};

export const CURRENCY_VALIDATION_POLICY: ValidationPolicy = {
  id: 'currency-validation',
  name: 'Currency Validation Policy',
  description: 'Standard validation rules for currency operations',
  active: true,
  effectiveDate: new Date('2024-01-01'),
  priority: 1,
  maxRetries: 3,
  timeoutMs: 5000,
  errorCodes: {
    'UNSUPPORTED_CURRENCY': 'Currency is not supported',
    'NEGATIVE_AMOUNT': 'Amount cannot be negative',
    'INVALID_PRECISION': 'Amount precision is invalid'
  },
  rules: CURRENCY_VALIDATION_RULES
};

export const JOURNAL_ENTRY_VALIDATION_POLICY: ValidationPolicy = {
  id: 'journal-entry-validation',
  name: 'Journal Entry Validation Policy',
  description: 'Standard validation rules for journal entries',
  active: true,
  effectiveDate: new Date('2024-01-01'),
  priority: 1,
  maxRetries: 3,
  timeoutMs: 5000,
  errorCodes: {
    'UNBALANCED_ENTRY': 'Journal entry is not balanced',
    'NO_LINES': 'Journal entry must have lines',
    'FUTURE_DATE': 'Journal entry date is in the future'
  },
  rules: JOURNAL_ENTRY_VALIDATION_RULES
};

export const TAX_VALIDATION_POLICY: ValidationPolicy = {
  id: 'tax-validation',
  name: 'Tax Validation Policy',
  description: 'Standard validation rules for tax calculations',
  active: true,
  effectiveDate: new Date('2024-01-01'),
  priority: 1,
  maxRetries: 3,
  timeoutMs: 5000,
  errorCodes: {
    'INVALID_RATE': 'Tax rate is invalid',
    'NEGATIVE_AMOUNT': 'Tax amount cannot be negative',
    'MISSING_TYPE': 'Tax type is required'
  },
  rules: TAX_VALIDATION_RULES
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function createValidationIssue(
  code: ValidationCode,
  message: string,
  severity: 'error' | 'warning' = 'error',
  path: string = '',
  value?: unknown
): ValidationIssue {
  return {
    code,
    message,
    severity,
    path,
    value
  };
}

export function createBusinessValidationResult(
  isValid: boolean,
  issues: ValidationIssue[] = [],
  _context?: Record<string, unknown>
): BusinessValidationResult {
  return {
    isValid,
    errors: issues.filter(issue => issue.severity === 'error').map(issue => issue.message),
    warnings: issues.filter(issue => issue.severity === 'warning').map(issue => issue.message),
    issues
  };
}

export function validateAccountCode(code: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (!code || code.length < 3 || code.length > 20) {
    issues.push(createValidationIssue(
      'INVALID_CODE_FORMAT' as ValidationCode,
      'Account code must be between 3 and 20 characters',
      'error',
      'code',
      code
    ));
  }
  
  if (!code.match(/^[A-Z0-9]+$/)) {
    issues.push(createValidationIssue(
      'INVALID_CODE_PATTERN' as ValidationCode,
      'Account code must contain only uppercase letters and numbers',
      'error',
      'code',
      code
    ));
  }
  
  return issues;
}

export function validateCurrencyAmount(amount: number, _currency: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (amount < 0) {
    issues.push(createValidationIssue(
      'NEGATIVE_AMOUNT',
      'Amount must be positive',
      'error',
      'amount',
      amount
    ));
  }
  
  if (amount % 0.01 !== 0) {
    issues.push(createValidationIssue(
      'INVALID_PRECISION',
      'Amount must have maximum 2 decimal places',
      'error',
      'amount',
      amount
    ));
  }
  
  return issues;
}

export function validateJournalEntryBalance(totalDebits: number, totalCredits: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (totalDebits !== totalCredits) {
    issues.push(createValidationIssue(
      'UNBALANCED_ENTRY',
      'Journal entry must be balanced (debits = credits)',
      'error',
      'balance',
      { totalDebits, totalCredits }
    ));
  }
  
  return issues;
}

// ============================================================================
// POLICY REGISTRY
// ============================================================================

export const VALIDATION_POLICIES = {
  account: ACCOUNT_VALIDATION_POLICY,
  currency: CURRENCY_VALIDATION_POLICY,
  journalEntry: JOURNAL_ENTRY_VALIDATION_POLICY,
  tax: TAX_VALIDATION_POLICY
} as const;

export type ValidationPolicyType = keyof typeof VALIDATION_POLICIES;
