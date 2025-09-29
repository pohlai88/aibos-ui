/**
 * Trial Balance Validation - SSOT Implementation
 * 
 * Validation logic for trial balance operations.
 * Imports from trial-balance-types.ts and policies/validation-policy.ts for consistency.
 */

import type { 
  TrialBalance,
  TrialBalanceAccount,
  TrialBalanceValidationResult,
  TrialBalanceValidationOptions,
  EquationValidationResult,
  AccountType
} from './trial-balance-types-utilities';
import { 
  roundToCurrency
} from './accounting-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import { createValidationIssue, createBusinessValidationResult } from './policies/validation-policy';

// ============================================================================
// TRIAL BALANCE VALIDATOR
// ============================================================================

export class TrialBalanceValidator {
  /**
   * Validate trial balance
   */
  static validateTrialBalance(
    trialBalance: TrialBalance,
    options: TrialBalanceValidationOptions = {}
  ): TrialBalanceValidationResult {
    const defaultOptions: TrialBalanceValidationOptions = {
      checkEquation: true,
      checkBalances: true,
      checkCurrencies: true,
      checkPeriod: true,
      checkAccounts: true,
      tolerance: 0.01,
      strictMode: false,
      ...options
    };

    const errors: string[] = [];
    const warnings: string[] = [];
    const checks = {
      equationCheck: { isValid: true } as EquationValidationResult,
      balanceCheck: true,
      currencyCheck: true,
      periodCheck: true,
      accountCheck: true
    };

    // Check accounting equation
    if (defaultOptions.checkEquation) {
      checks.equationCheck = this.validateAccountingEquation(trialBalance, defaultOptions.tolerance!);
      if (!checks.equationCheck.isValid) {
        errors.push(`Accounting equation validation failed: ${checks.equationCheck.difference}`);
      }
    }

    // Check balance consistency
    if (defaultOptions.checkBalances) {
      checks.balanceCheck = this.validateBalanceConsistency(trialBalance);
      if (!checks.balanceCheck) {
        errors.push('Balance consistency validation failed');
      }
    }

    // Check currency consistency
    if (defaultOptions.checkCurrencies) {
      checks.currencyCheck = this.validateCurrencyConsistency(trialBalance);
      if (!checks.currencyCheck) {
        warnings.push('Currency consistency validation failed');
      }
    }

    // Check period validity
    if (defaultOptions.checkPeriod) {
      checks.periodCheck = this.validatePeriod(trialBalance);
      if (!checks.periodCheck) {
        errors.push('Period validation failed');
      }
    }

    // Check account validity
    if (defaultOptions.checkAccounts) {
      checks.accountCheck = this.validateAccounts(trialBalance);
      if (!checks.accountCheck) {
        errors.push('Account validation failed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validationDate: new Date(),
      checks
    };
  }

  /**
   * Validate accounting equation (Assets = Liabilities + Equity)
   */
  static validateAccountingEquation(
    trialBalance: TrialBalance,
    tolerance: number = 0.01
  ): EquationValidationResult {
    const assets = this.calculateAccountTypeTotal(trialBalance, 'ASSET');
    const liabilities = this.calculateAccountTypeTotal(trialBalance, 'LIABILITY');
    const equity = this.calculateAccountTypeTotal(trialBalance, 'EQUITY');
    
    const equationBalance = liabilities + equity;
    const difference = Math.abs(assets - equationBalance);
    const withinTolerance = difference <= tolerance;
    
    const assetAccounts = trialBalance.accounts.filter(a => a.accountType === 'ASSET').length;
    const liabilityAccounts = trialBalance.accounts.filter(a => a.accountType === 'LIABILITY').length;
    const equityAccounts = trialBalance.accounts.filter(a => a.accountType === 'EQUITY').length;
    
    return {
      isValid: withinTolerance,
      assets: roundToCurrency(assets, trialBalance.reportingCurrency || 'MYR'),
      liabilities: roundToCurrency(liabilities, trialBalance.reportingCurrency || 'MYR'),
      equity: roundToCurrency(equity, trialBalance.reportingCurrency || 'MYR'),
      difference: roundToCurrency(difference, trialBalance.reportingCurrency || 'MYR'),
      withinTolerance,
      tolerance,
      validationDate: new Date(),
      details: {
        assetAccounts,
        liabilityAccounts,
        equityAccounts,
        totalAccounts: trialBalance.accounts.length
      }
    };
  }

  /**
   * Validate balance consistency
   */
  static validateBalanceConsistency(trialBalance: TrialBalance): boolean {
    // Check that total debits equal total credits
    const calculatedDebits = trialBalance.accounts.reduce((sum, account) => {
      return sum + (account.balanceType === 'debit' ? account.closingBalance : 0);
    }, 0);
    
    const calculatedCredits = trialBalance.accounts.reduce((sum, account) => {
      return sum + (account.balanceType === 'credit' ? account.closingBalance : 0);
    }, 0);
    
    const difference = Math.abs(calculatedDebits - calculatedCredits);
    const tolerance = 0.01;
    
    return difference <= tolerance;
  }

  /**
   * Validate currency consistency
   */
  static validateCurrencyConsistency(trialBalance: TrialBalance): boolean {
    if (!trialBalance.reportingCurrency) {
      return true; // No reporting currency specified
    }
    
    // Check if all accounts use the same currency as reporting currency
    const inconsistentAccounts = trialBalance.accounts.filter(
      account => account.currency !== trialBalance.reportingCurrency
    );
    
    return inconsistentAccounts.length === 0;
  }

  /**
   * Validate period
   */
  static validatePeriod(trialBalance: TrialBalance): boolean {
    const { period } = trialBalance;
    
    // Check that start date is before end date
    if (period.start >= period.end) {
      return false;
    }
    
    // Check that period is not in the future
    const now = new Date();
    if (period.end > now) {
      return false;
    }
    
    // Check that period is not too old (e.g., more than 2 years)
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    if (period.start < twoYearsAgo) {
      return false;
    }
    
    return true;
  }

  /**
   * Validate accounts
   */
  static validateAccounts(trialBalance: TrialBalance): boolean {
    // Check that all accounts have required fields
    for (const account of trialBalance.accounts) {
      if (!account.accountCode || !account.accountName || !account.accountType) {
        return false;
      }
      
      // Check that balance type is valid
      if (!['debit', 'credit'].includes(account.balanceType)) {
        return false;
      }
      
      // Check that account type is valid
      const validAccountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
      if (!validAccountTypes.includes(account.accountType)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculate total for specific account type
   */
  private static calculateAccountTypeTotal(
    trialBalance: TrialBalance,
    accountType: AccountType
  ): number {
    return trialBalance.accounts
      .filter(account => account.accountType === accountType)
      .reduce((sum, account) => {
        if (account.balanceType === 'debit') {
          return sum + account.closingBalance;
        } else {
          return sum - account.closingBalance;
        }
      }, 0);
  }

  /**
   * Validate trial balance account
   */
  static validateTrialBalanceAccount(account: TrialBalanceAccount): BusinessValidationResult {
    const issues: ValidationIssue[] = [];
    
    if (!account.accountCode || account.accountCode.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_ACCOUNT_CODE',
        'Account code is required',
        'error',
        'accountCode',
        account.accountCode
      ));
    }
    
    if (!account.accountName || account.accountName.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_ACCOUNT_NAME',
        'Account name is required',
        'error',
        'accountName',
        account.accountName
      ));
    }
    
    if (!account.accountType) {
      issues.push(createValidationIssue(
        'MISSING_ACCOUNT_TYPE',
        'Account type is required',
        'error',
        'accountType',
        account.accountType
      ));
    }
    
    if (!['debit', 'credit'].includes(account.balanceType)) {
      issues.push(createValidationIssue(
        'INVALID_BALANCE_TYPE',
        'Balance type must be debit or credit',
        'error',
        'balanceType',
        account.balanceType
      ));
    }
    
    if (account.periodDebits < 0) {
      issues.push(createValidationIssue(
        'NEGATIVE_PERIOD_DEBITS',
        'Period debits cannot be negative',
        'error',
        'periodDebits',
        account.periodDebits
      ));
    }
    
    if (account.periodCredits < 0) {
      issues.push(createValidationIssue(
        'NEGATIVE_PERIOD_CREDITS',
        'Period credits cannot be negative',
        'error',
        'periodCredits',
        account.periodCredits
      ));
    }
    
    return createBusinessValidationResult(issues.length === 0, issues);
  }

  /**
   * Validate trial balance for specific account type
   */
  static validateAccountTypeBalance(
    trialBalance: TrialBalance,
    accountType: AccountType
  ): BusinessValidationResult {
    const issues: ValidationIssue[] = [];
    const accounts = trialBalance.accounts.filter(a => a.accountType === accountType);
    
    if (accounts.length === 0) {
      issues.push(createValidationIssue(
        'NO_ACCOUNTS_OF_TYPE',
        `No accounts found for type ${accountType}`,
        'warning',
        'accountType',
        accountType
      ));
    }
    
    const totalBalance = accounts.reduce((sum, account) => {
      if (account.balanceType === 'debit') {
        return sum + account.closingBalance;
      } else {
        return sum - account.closingBalance;
      }
    }, 0);
    
    // Check if balance is reasonable for account type
    if (accountType === 'ASSET' && totalBalance < 0) {
      issues.push(createValidationIssue(
        'NEGATIVE_ASSET_BALANCE',
        'Total asset balance is negative',
        'error',
        'totalBalance',
        totalBalance
      ));
    }
    
    if (accountType === 'LIABILITY' && totalBalance < 0) {
      issues.push(createValidationIssue(
        'NEGATIVE_LIABILITY_BALANCE',
        'Total liability balance is negative',
        'error',
        'totalBalance',
        totalBalance
      ));
    }
    
    return createBusinessValidationResult(issues.length === 0, issues);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate trial balance
 */
export function validateTrialBalance(
  trialBalance: TrialBalance,
  options: TrialBalanceValidationOptions = {}
): TrialBalanceValidationResult {
  return TrialBalanceValidator.validateTrialBalance(trialBalance, options);
}

/**
 * Validate accounting equation
 */
export function validateAccountingEquation(
  trialBalance: TrialBalance,
  tolerance: number = 0.01
): EquationValidationResult {
  return TrialBalanceValidator.validateAccountingEquation(trialBalance, tolerance);
}

/**
 * Validate trial balance account
 */
export function validateTrialBalanceAccount(account: TrialBalanceAccount): BusinessValidationResult {
  return TrialBalanceValidator.validateTrialBalanceAccount(account);
}

/**
 * Validate account type balance
 */
export function validateAccountTypeBalance(
  trialBalance: TrialBalance,
  accountType: AccountType
): BusinessValidationResult {
  return TrialBalanceValidator.validateAccountTypeBalance(trialBalance, accountType);
}

/**
 * Check if trial balance is balanced
 */
export function isTrialBalanceBalanced(trialBalance: TrialBalance, tolerance: number = 0.01): boolean {
  const equationCheck = TrialBalanceValidator.validateAccountingEquation(trialBalance, tolerance);
  return equationCheck.isValid;
}

/**
 * Get trial balance validation summary
 */
export function getTrialBalanceValidationSummary(
  trialBalance: TrialBalance,
  options: TrialBalanceValidationOptions = {}
): {
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  checksPassed: number;
  totalChecks: number;
} {
  const validation = TrialBalanceValidator.validateTrialBalance(trialBalance, options);
  const checksPassed = Object.values(validation.checks).filter(check => 
    typeof check === 'boolean' ? check : check.isValid
  ).length;
  const totalChecks = Object.keys(validation.checks).length;
  
  return {
    isValid: validation.isValid,
    totalErrors: validation.errors.length,
    totalWarnings: validation.warnings.length,
    checksPassed,
    totalChecks
  };
}
