/**
 * Trial Balance Utilities - Phase 1 Implementation
 * 
 * Build trial balances with period filters and perform hard accounting checks.
 * Provides comprehensive trial balance generation and validation.
 * 
 * Features:
 * - Trial balance builder for any period
 * - Period filtering by date ranges and fiscal periods
 * - Hard checks for accounting equation (Assets = Liabilities + Equity)
 * - Account grouping by type and category
 * - Variance analysis between periods
 * - Export capabilities
 */

import {
  type SupportedCurrency,
  type AccountType,
  roundToCurrency,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';
import type { JournalEntry } from './journal-entry-utilities';
import type { DateRange } from './date-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Account {
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
  isActive: boolean;
  currency: SupportedCurrency;
  openingBalance: number;
  balanceType: 'debit' | 'credit';
}

export interface TrialBalanceAccount {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  openingBalance: number;
  periodDebits: number;
  periodCredits: number;
  closingBalance: number;
  balanceType: 'debit' | 'credit';
}

export interface TrialBalance {
  period: DateRange;
  accounts: TrialBalanceAccount[];
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  generatedAt: Date;
}

export interface FiscalPeriod {
  id: string;
  year: number;
  period: number;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface ComparativeTrialBalance {
  current: TrialBalance;
  prior: TrialBalance;
  variances: TrialBalanceVariance[];
  summary: {
    totalVariance: number;
    significantVariances: number;
    accountsWithVariances: number;
  };
}

export interface TrialBalanceVariance {
  accountCode: string;
  accountName: string;
  currentBalance: number;
  priorBalance: number;
  variance: number;
  variancePercentage: number;
  isSignificant: boolean;
}

export interface EquationValidationResult {
  isValid: boolean;
  assets: number;
  liabilities: number;
  equity: number;
  difference: number;
  withinTolerance: boolean;
}

export interface SumValidationResult {
  isValid: boolean;
  totalDebits: number;
  totalCredits: number;
  difference: number;
  entries: Array<{
    id: string;
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  }>;
}

export interface IntegrityCheckResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
}

export interface VarianceAnalysis {
  totalVariance: number;
  significantVariances: TrialBalanceVariance[];
  accountsWithVariances: number;
  largestVariance: TrialBalanceVariance | null;
  smallestVariance: TrialBalanceVariance | null;
}

export interface SignificantVariance {
  accountCode: string;
  accountName: string;
  currentBalance: number;
  priorBalance: number;
  variance: number;
  variancePercentage: number;
  threshold: number;
}

// ============================================================================
// TRIAL BALANCE GENERATION
// ============================================================================

/**
 * Build trial balance for a specific period
 */
export function buildTrialBalance(
  accounts: Account[],
  entries: JournalEntry[],
  period: DateRange
): TrialBalance {
  if (!accounts || accounts.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Accounts are required',
      accounts,
      { operation: 'build-trial-balance' }
    );
  }

  if (!entries) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Journal entries are required',
      entries,
      { operation: 'build-trial-balance' }
    );
  }

  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Period is required',
      period,
      { operation: 'build-trial-balance' }
    );
  }

  // Filter entries by period
  const periodEntries = entries.filter(entry => 
    entry.date >= period.start && entry.date <= period.end
  );

  // Build trial balance accounts
  const trialBalanceAccounts: TrialBalanceAccount[] = accounts.map(account => {
    const accountEntries = periodEntries.filter(entry =>
      entry.lines.some(line => line.accountCode === account.code)
    );

    let periodDebits = 0;
    let periodCredits = 0;

    // Calculate period activity
    for (const entry of accountEntries) {
      for (const line of entry.lines) {
        if (line.accountCode === account.code) {
          periodDebits += line.debit;
          periodCredits += line.credit;
        }
      }
    }

    // Calculate closing balance
    let closingBalance = account.openingBalance;
    if (account.balanceType === 'debit') {
      closingBalance += periodDebits - periodCredits;
    } else {
      closingBalance += periodCredits - periodDebits;
    }

    return {
      accountCode: account.code,
      accountName: account.name,
      accountType: account.type,
      openingBalance: account.openingBalance,
      periodDebits,
      periodCredits,
      closingBalance: roundToCurrency(closingBalance, account.currency),
      balanceType: account.balanceType,
    };
  });

  // Calculate totals
  const totalDebits = trialBalanceAccounts.reduce((sum, account) => sum + account.periodDebits, 0);
  const totalCredits = trialBalanceAccounts.reduce((sum, account) => sum + account.periodCredits, 0);
  const netBalance = totalDebits - totalCredits;

  return {
    period,
    accounts: trialBalanceAccounts,
    totalDebits: roundToCurrency(totalDebits, 'MYR'), // Default currency
    totalCredits: roundToCurrency(totalCredits, 'MYR'),
    netBalance: roundToCurrency(netBalance, 'MYR'),
    generatedAt: new Date(),
  };
}

/**
 * Build trial balance by fiscal period
 */
export function buildTrialBalanceByPeriod(
  accounts: Account[],
  entries: JournalEntry[],
  period: FiscalPeriod
): TrialBalance {
  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'build-trial-balance-by-period' }
    );
  }

  const dateRange: DateRange = {
    start: period.startDate,
    end: period.endDate,
  };

  return buildTrialBalance(accounts, entries, dateRange);
}

/**
 * Build comparative trial balance
 */
export function buildComparativeTrialBalance(
  current: TrialBalance,
  prior: TrialBalance
): ComparativeTrialBalance {
  if (!current) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Current trial balance is required',
      current,
      { operation: 'build-comparative-trial-balance' }
    );
  }

  if (!prior) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Prior trial balance is required',
      prior,
      { operation: 'build-comparative-trial-balance' }
    );
  }

  // Create account map for efficient lookup
  const priorAccountMap = new Map(
    prior.accounts.map(account => [account.accountCode, account])
  );

  const variances: TrialBalanceVariance[] = [];
  let totalVariance = 0;
  let significantVariances = 0;
  let accountsWithVariances = 0;

  for (const currentAccount of current.accounts) {
    const priorAccount = priorAccountMap.get(currentAccount.accountCode);
    const priorBalance = priorAccount ? priorAccount.closingBalance : 0;
    
    const variance = currentAccount.closingBalance - priorBalance;
    const variancePercentage = priorBalance !== 0 
      ? (variance / Math.abs(priorBalance)) * 100 
      : 0;

    const isSignificant = Math.abs(variance) > 1000 || Math.abs(variancePercentage) > 10;

    if (variance !== 0) {
      accountsWithVariances++;
      if (isSignificant) {
        significantVariances++;
      }
    }

    totalVariance += Math.abs(variance);

    variances.push({
      accountCode: currentAccount.accountCode,
      accountName: currentAccount.accountName,
      currentBalance: currentAccount.closingBalance,
      priorBalance,
      variance,
      variancePercentage,
      isSignificant,
    });
  }

  return {
    current,
    prior,
    variances,
    summary: {
      totalVariance,
      significantVariances,
      accountsWithVariances,
    },
  };
}

// ============================================================================
// HARD CHECKS
// ============================================================================

/**
 * Validate accounting equation (Assets = Liabilities + Equity)
 */
export function validateAccountingEquation(trialBalance: TrialBalance): EquationValidationResult {
  if (!trialBalance) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Trial balance is required',
      trialBalance,
      { operation: 'validate-accounting-equation' }
    );
  }

  let assets = 0;
  let liabilities = 0;
  let equity = 0;

  for (const account of trialBalance.accounts) {
    const balance = account.closingBalance;
    
    switch (account.accountType) {
      case 'ASSET':
        assets += balance;
        break;
      case 'LIABILITY':
        liabilities += balance;
        break;
      case 'EQUITY':
        equity += balance;
        break;
      case 'REVENUE':
      case 'EXPENSE':
        // Revenue and expense accounts don't affect the balance sheet equation
        break;
    }
  }

  const difference = assets - (liabilities + equity);
  const tolerance = 0.01; // 1 cent tolerance
  const withinTolerance = Math.abs(difference) <= tolerance;
  const isValid = withinTolerance;

  return {
    isValid,
    assets: roundToCurrency(assets, 'MYR'),
    liabilities: roundToCurrency(liabilities, 'MYR'),
    equity: roundToCurrency(equity, 'MYR'),
    difference: roundToCurrency(difference, 'MYR'),
    withinTolerance,
  };
}

/**
 * Validate journal entry sums
 */
export function validateJournalEntrySums(entries: JournalEntry[]): SumValidationResult {
  if (!entries) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Journal entries are required',
      entries,
      { operation: 'validate-journal-entry-sums' }
    );
  }

  const entryResults: Array<{
    id: string;
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  }> = [];

  let totalDebits = 0;
  let totalCredits = 0;

  for (const entry of entries) {
    const entryDebits = entry.totalDebits;
    const entryCredits = entry.totalCredits;
    const isBalanced = Math.abs(entryDebits - entryCredits) <= 0.01;

    entryResults.push({
      id: entry.id,
      totalDebits: entryDebits,
      totalCredits: entryCredits,
      isBalanced,
    });

    totalDebits += entryDebits;
    totalCredits += entryCredits;
  }

  const difference = totalDebits - totalCredits;
  const isValid = Math.abs(difference) <= 0.01;

  return {
    isValid,
    totalDebits: roundToCurrency(totalDebits, 'MYR'),
    totalCredits: roundToCurrency(totalCredits, 'MYR'),
    difference: roundToCurrency(difference, 'MYR'),
    entries: entryResults,
  };
}

/**
 * Check trial balance integrity
 */
export function checkTrialBalanceIntegrity(trialBalance: TrialBalance): IntegrityCheckResult {
  if (!trialBalance) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Trial balance is required',
      trialBalance,
      { operation: 'check-trial-balance-integrity' }
    );
  }

  const issues: string[] = [];
  const warnings: string[] = [];

  // Check if trial balance is balanced
  const difference = Math.abs(trialBalance.totalDebits - trialBalance.totalCredits);
  if (difference > 0.01) {
    issues.push(`Trial balance is not balanced. Difference: ${difference}`);
  }

  // Check accounting equation
  const equationValidation = validateAccountingEquation(trialBalance);
  if (!equationValidation.isValid) {
    issues.push(`Accounting equation not balanced. Difference: ${equationValidation.difference}`);
  }

  // Check for duplicate account codes
  const accountCodes = trialBalance.accounts.map(account => account.accountCode);
  const duplicateCodes = accountCodes.filter((code, index) => accountCodes.indexOf(code) !== index);
  if (duplicateCodes.length > 0) {
    issues.push(`Duplicate account codes found: ${duplicateCodes.join(', ')}`);
  }

  // Check for zero-balance accounts
  const zeroBalanceAccounts = trialBalance.accounts.filter(account => account.closingBalance === 0);
  if (zeroBalanceAccounts.length > 0) {
    warnings.push(`${zeroBalanceAccounts.length} accounts have zero balances`);
  }

  // Check for negative balances in asset accounts
  const negativeAssetAccounts = trialBalance.accounts.filter(account => 
    account.accountType === 'ASSET' && account.closingBalance < 0
  );
  if (negativeAssetAccounts.length > 0) {
    warnings.push(`${negativeAssetAccounts.length} asset accounts have negative balances`);
  }

  // Check for negative balances in liability accounts
  const negativeLiabilityAccounts = trialBalance.accounts.filter(account => 
    account.accountType === 'LIABILITY' && account.closingBalance < 0
  );
  if (negativeLiabilityAccounts.length > 0) {
    warnings.push(`${negativeLiabilityAccounts.length} liability accounts have negative balances`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  };
}

// ============================================================================
// ANALYSIS
// ============================================================================

/**
 * Calculate variances between two trial balances
 */
export function calculateVariances(
  current: TrialBalance,
  prior: TrialBalance
): VarianceAnalysis {
  if (!current || !prior) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Both current and prior trial balances are required',
      { current, prior },
      { operation: 'calculate-variances' }
    );
  }

  const comparative = buildComparativeTrialBalance(current, prior);
  const significantVariances = comparative.variances.filter(v => v.isSignificant);
  
  const largestVariance = significantVariances.length > 0 
    ? significantVariances.reduce((max, current) => 
        Math.abs(current.variance) > Math.abs(max.variance) ? current : max, 
        significantVariances[0]!
      )
    : null;

  const smallestVariance = significantVariances.length > 0 
    ? significantVariances.reduce((min, current) => 
        Math.abs(current.variance) < Math.abs(min.variance) ? current : min, 
        significantVariances[0]!
      )
    : null;

  return {
    totalVariance: comparative.summary.totalVariance,
    significantVariances,
    accountsWithVariances: comparative.summary.accountsWithVariances,
    largestVariance,
    smallestVariance,
  };
}

/**
 * Identify significant variances
 */
export function identifySignificantVariances(
  trialBalance: TrialBalance,
  threshold: number
): SignificantVariance[] {
  if (!trialBalance) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Trial balance is required',
      trialBalance,
      { operation: 'identify-significant-variances' }
    );
  }

  if (typeof threshold !== 'number' || threshold < 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Threshold must be a non-negative number',
      threshold,
      { operation: 'identify-significant-variances' }
    );
  }

  // This would typically compare against a prior period
  // For now, return empty array as placeholder
  return [];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Group trial balance accounts by type
 */
export function groupAccountsByType(trialBalance: TrialBalance): Record<AccountType, TrialBalanceAccount[]> {
  if (!trialBalance) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Trial balance is required',
      trialBalance,
      { operation: 'group-accounts-by-type' }
    );
  }

  const grouped: Record<AccountType, TrialBalanceAccount[]> = {} as Record<AccountType, TrialBalanceAccount[]>;

  for (const account of trialBalance.accounts) {
    if (!grouped[account.accountType]) {
      grouped[account.accountType] = [];
    }
    grouped[account.accountType].push(account);
  }

  return grouped;
}

/**
 * Get trial balance summary
 */
export function getTrialBalanceSummary(trialBalance: TrialBalance): {
  totalAccounts: number;
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  isBalanced: boolean;
  equationValidation: EquationValidationResult;
  integrityCheck: IntegrityCheckResult;
} {
  if (!trialBalance) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Trial balance is required',
      trialBalance,
      { operation: 'get-trial-balance-summary' }
    );
  }

  const isBalanced = Math.abs(trialBalance.totalDebits - trialBalance.totalCredits) <= 0.01;
  const equationValidation = validateAccountingEquation(trialBalance);
  const integrityCheck = checkTrialBalanceIntegrity(trialBalance);

  return {
    totalAccounts: trialBalance.accounts.length,
    totalDebits: trialBalance.totalDebits,
    totalCredits: trialBalance.totalCredits,
    netBalance: trialBalance.netBalance,
    isBalanced,
    equationValidation,
    integrityCheck,
  };
}

/**
 * Export trial balance to CSV format
 */
export function exportTrialBalanceToCSV(trialBalance: TrialBalance): string {
  if (!trialBalance) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Trial balance is required',
      trialBalance,
      { operation: 'export-trial-balance-to-csv' }
    );
  }

  const headers = [
    'Account Code',
    'Account Name',
    'Account Type',
    'Opening Balance',
    'Period Debits',
    'Period Credits',
    'Closing Balance',
    'Balance Type'
  ];

  const rows = trialBalance.accounts.map(account => [
    account.accountCode,
    account.accountName,
    account.accountType,
    account.openingBalance.toString(),
    account.periodDebits.toString(),
    account.periodCredits.toString(),
    account.closingBalance.toString(),
    account.balanceType
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Create an empty trial balance
 */
export function createEmptyTrialBalance(period: DateRange): TrialBalance {
  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Period is required',
      period,
      { operation: 'create-empty-trial-balance' }
    );
  }

  return {
    period,
    accounts: [],
    totalDebits: 0,
    totalCredits: 0,
    netBalance: 0,
    generatedAt: new Date(),
  };
}
