/**
 * Opening Balance Utilities - Phase 1 Implementation
 * 
 * Handle opening balance imports, retained earnings carry-forward, and period 0 checks.
 * Provides comprehensive opening balance management and validation.
 * 
 * Features:
 * - Opening balance import and validation
 * - Retained earnings calculation and posting
 * - Period 0 validation
 * - Balance carry-forward between periods
 * - Import validation and error handling
 */

import {
  type SupportedCurrency,
  roundToCurrency,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';
import type { JournalEntry, JournalLine } from './journal-entry-utilities';
import type { FiscalPeriod } from './trial-balance-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface OpeningBalance {
  accountCode: string;
  accountName: string;
  balance: number;
  balanceType: 'debit' | 'credit';
  currency: SupportedCurrency;
  dimensions?: Record<string, string>;
}

export interface RetainedEarningsCalculation {
  priorPeriodEnd: number;
  currentPeriodNetIncome: number;
  dividends: number;
  adjustments: number;
  calculatedRetainedEarnings: number;
  period: FiscalPeriod;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  journalEntry?: JournalEntry | undefined;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Period0ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

// ============================================================================
// OPENING BALANCE MANAGEMENT
// ============================================================================

/**
 * Import opening balances for a fiscal period
 */
export function importOpeningBalances(
  balances: OpeningBalance[],
  period: FiscalPeriod
): ImportResult {
  if (!balances || balances.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Opening balances are required',
      balances,
      { operation: 'import-opening-balances' }
    );
  }

  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'import-opening-balances' }
    );
  }

  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  let importedCount = 0;

  // Validate each balance
  for (let i = 0; i < balances.length; i++) {
    const balance = balances[i]!;
    const row = i + 1;

    try {
      const validation = validateOpeningBalance(balance);
      if (!validation.isValid) {
        errors.push(...validation.errors.map(error => ({
          row,
          field: 'balance',
          message: error,
          value: balance,
        })));
        continue;
      }

      warnings.push(...validation.warnings.map(warning => ({
        row,
        field: 'balance',
        message: warning,
        value: balance,
      })));

      importedCount++;
    } catch (error) {
      errors.push({
        row,
        field: 'balance',
        message: `Validation failed: ${error}`,
        value: balance,
      });
    }
  }

  // Create journal entry if import is successful
  let journalEntry: JournalEntry | undefined;
  if (errors.length === 0 && importedCount > 0) {
    try {
      journalEntry = postOpeningBalances(balances, period);
    } catch (error) {
      errors.push({
        row: 0,
        field: 'journal',
        message: `Failed to create journal entry: ${error}`,
        value: balances,
      });
    }
  }

  return {
    success: errors.length === 0,
    importedCount,
    errors,
    warnings,
    journalEntry,
  };
}

/**
 * Validate opening balance data
 */
export function validateOpeningBalances(balances: OpeningBalance[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!balances || balances.length === 0) {
    errors.push('Opening balances are required');
    return { isValid: false, errors, warnings };
  }

  // Check for duplicate account codes
  const accountCodes = balances.map(balance => balance.accountCode);
  const duplicateCodes = accountCodes.filter((code, index) => accountCodes.indexOf(code) !== index);
  if (duplicateCodes.length > 0) {
    errors.push(`Duplicate account codes found: ${duplicateCodes.join(', ')}`);
  }

  // Validate each balance
  for (let i = 0; i < balances.length; i++) {
    const balance = balances[i]!;
    const balanceValidation = validateOpeningBalance(balance);
    
    if (!balanceValidation.isValid) {
      errors.push(`Row ${i + 1}: ${balanceValidation.errors.join(', ')}`);
    }
    
    warnings.push(...balanceValidation.warnings.map(warning => `Row ${i + 1}: ${warning}`));
  }

  // Check currency consistency
  const currencies = new Set(balances.map(balance => balance.currency));
  if (currencies.size > 1) {
    warnings.push(`Multiple currencies found: ${Array.from(currencies).join(', ')}`);
  }

  // Check balance types
  const balanceTypes = new Set(balances.map(balance => balance.balanceType));
  if (balanceTypes.size > 1) {
    warnings.push(`Multiple balance types found: ${Array.from(balanceTypes).join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single opening balance
 */
export function validateOpeningBalance(balance: OpeningBalance): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!balance) {
    errors.push('Opening balance is required');
    return { isValid: false, errors, warnings };
  }

  // Validate account code
  if (!balance.accountCode || typeof balance.accountCode !== 'string') {
    errors.push('Account code is required and must be a string');
  }

  // Validate account name
  if (!balance.accountName || typeof balance.accountName !== 'string') {
    errors.push('Account name is required and must be a string');
  }

  // Validate balance
  if (typeof balance.balance !== 'number' || isNaN(balance.balance)) {
    errors.push('Balance must be a valid number');
  } else if (balance.balance < 0) {
    errors.push('Balance cannot be negative');
  }

  // Validate balance type
  if (!balance.balanceType || !['debit', 'credit'].includes(balance.balanceType)) {
    errors.push('Balance type must be either "debit" or "credit"');
  }

  // Validate currency
  if (!balance.currency || typeof balance.currency !== 'string') {
    errors.push('Currency is required and must be a string');
  }

  // Check for zero balance
  if (balance.balance === 0) {
    warnings.push('Zero balance detected');
  }

  // Check for unusually large balance
  if (balance.balance > 1000000) {
    warnings.push('Unusually large balance detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Post opening balances as journal entries
 */
export function postOpeningBalances(
  balances: OpeningBalance[],
  period: FiscalPeriod
): JournalEntry {
  if (!balances || balances.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Opening balances are required',
      balances,
      { operation: 'post-opening-balances' }
    );
  }

  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'post-opening-balances' }
    );
  }

  // Validate balances first
  const validation = validateOpeningBalances(balances);
  if (!validation.isValid) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `Invalid opening balances: ${validation.errors.join(', ')}`,
      balances,
      { operation: 'post-opening-balances' }
    );
  }

  // Create journal lines
  const lines: JournalLine[] = balances.map((balance, index) => {
    const line: JournalLine = {
      id: `OB-${period.id}-${index}`,
      accountCode: balance.accountCode,
      description: `Opening balance for ${balance.accountName}`,
      debit: balance.balanceType === 'debit' ? roundToCurrency(balance.balance, balance.currency) : 0,
      credit: balance.balanceType === 'credit' ? roundToCurrency(balance.balance, balance.currency) : 0,
      currency: balance.currency,
      ...(balance.dimensions && { dimensions: balance.dimensions }),
    };

    return line;
  });

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  // Create journal entry
  const entry: JournalEntry = {
    id: `OB-${period.id}-${Date.now()}`,
    date: period.startDate,
    reference: `OB-${period.year}-${period.period}`,
    description: `Opening balances for ${period.name}`,
    lines,
    totalDebits: roundToCurrency(totalDebits, 'MYR'), // Default currency
    totalCredits: roundToCurrency(totalCredits, 'MYR'),
    currency: 'MYR',
    status: 'draft',
  };

  return entry;
}

// ============================================================================
// RETAINED EARNINGS
// ============================================================================

/**
 * Calculate retained earnings for a period
 */
export function calculateRetainedEarnings(
  priorPeriod: FiscalPeriod,
  currentPeriod: FiscalPeriod
): RetainedEarningsCalculation {
  if (!priorPeriod) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Prior period is required',
      priorPeriod,
      { operation: 'calculate-retained-earnings' }
    );
  }

  if (!currentPeriod) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Current period is required',
      currentPeriod,
      { operation: 'calculate-retained-earnings' }
    );
  }

  // This would typically calculate from actual financial data
  // For now, return a placeholder calculation
  const priorPeriodEnd = 0; // Would be calculated from prior period trial balance
  const currentPeriodNetIncome = 0; // Would be calculated from P&L
  const dividends = 0; // Would be calculated from dividend transactions
  const adjustments = 0; // Would be calculated from adjustment entries

  const calculatedRetainedEarnings = priorPeriodEnd + currentPeriodNetIncome - dividends + adjustments;

  return {
    priorPeriodEnd,
    currentPeriodNetIncome,
    dividends,
    adjustments,
    calculatedRetainedEarnings: roundToCurrency(calculatedRetainedEarnings, 'MYR'),
    period: currentPeriod,
  };
}

/**
 * Post retained earnings calculation
 */
export function postRetainedEarnings(calculation: RetainedEarningsCalculation): JournalEntry {
  if (!calculation) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Retained earnings calculation is required',
      calculation,
      { operation: 'post-retained-earnings' }
    );
  }

  // Validate calculation
  const validation = validateRetainedEarnings(calculation);
  if (!validation.isValid) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `Invalid retained earnings calculation: ${validation.errors.join(', ')}`,
      calculation,
      { operation: 'post-retained-earnings' }
    );
  }

  // Create journal lines
  const lines: JournalLine[] = [];

  // Net income line
  if (calculation.currentPeriodNetIncome !== 0) {
    lines.push({
      id: `RE-${calculation.period.id}-NI`,
      accountCode: 'RETAINED_EARNINGS',
      description: 'Net income for period',
      debit: calculation.currentPeriodNetIncome < 0 ? Math.abs(calculation.currentPeriodNetIncome) : 0,
      credit: calculation.currentPeriodNetIncome > 0 ? calculation.currentPeriodNetIncome : 0,
      currency: 'MYR',
    });
  }

  // Dividends line
  if (calculation.dividends !== 0) {
    lines.push({
      id: `RE-${calculation.period.id}-DIV`,
      accountCode: 'RETAINED_EARNINGS',
      description: 'Dividends declared',
      debit: calculation.dividends,
      credit: 0,
      currency: 'MYR',
    });
  }

  // Adjustments line
  if (calculation.adjustments !== 0) {
    lines.push({
      id: `RE-${calculation.period.id}-ADJ`,
      accountCode: 'RETAINED_EARNINGS',
      description: 'Period adjustments',
      debit: calculation.adjustments < 0 ? Math.abs(calculation.adjustments) : 0,
      credit: calculation.adjustments > 0 ? calculation.adjustments : 0,
      currency: 'MYR',
    });
  }

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  // Create journal entry
  const entry: JournalEntry = {
    id: `RE-${calculation.period.id}-${Date.now()}`,
    date: calculation.period.endDate,
    reference: `RE-${calculation.period.year}-${calculation.period.period}`,
    description: `Retained earnings for ${calculation.period.name}`,
    lines,
    totalDebits: roundToCurrency(totalDebits, 'MYR'),
    totalCredits: roundToCurrency(totalCredits, 'MYR'),
    currency: 'MYR',
    status: 'draft',
  };

  return entry;
}

/**
 * Validate retained earnings calculation
 */
export function validateRetainedEarnings(calculation: RetainedEarningsCalculation): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!calculation) {
    errors.push('Retained earnings calculation is required');
    return { isValid: false, errors, warnings };
  }

  // Validate period
  if (!calculation.period) {
    errors.push('Period is required');
  }

  // Validate amounts
  if (typeof calculation.priorPeriodEnd !== 'number' || isNaN(calculation.priorPeriodEnd)) {
    errors.push('Prior period end must be a valid number');
  }

  if (typeof calculation.currentPeriodNetIncome !== 'number' || isNaN(calculation.currentPeriodNetIncome)) {
    errors.push('Current period net income must be a valid number');
  }

  if (typeof calculation.dividends !== 'number' || isNaN(calculation.dividends)) {
    errors.push('Dividends must be a valid number');
  }

  if (typeof calculation.adjustments !== 'number' || isNaN(calculation.adjustments)) {
    errors.push('Adjustments must be a valid number');
  }

  if (typeof calculation.calculatedRetainedEarnings !== 'number' || isNaN(calculation.calculatedRetainedEarnings)) {
    errors.push('Calculated retained earnings must be a valid number');
  }

  // Check for negative dividends
  if (calculation.dividends < 0) {
    warnings.push('Negative dividends detected');
  }

  // Check for large adjustments
  if (Math.abs(calculation.adjustments) > 10000) {
    warnings.push('Large adjustment amount detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// PERIOD 0 OPERATIONS
// ============================================================================

/**
 * Validate period 0 data
 */
export function validatePeriod0Data(
  period: FiscalPeriod,
  balances: OpeningBalance[]
): Period0ValidationResult {
  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Period is required',
      period,
      { operation: 'validate-period-0-data' }
    );
  }

  if (!balances || balances.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Opening balances are required',
      balances,
      { operation: 'validate-period-0-data' }
    );
  }

  const issues: string[] = [];
  const warnings: string[] = [];

  // Validate balances
  const balanceValidation = validateOpeningBalances(balances);
  if (!balanceValidation.isValid) {
    issues.push(...balanceValidation.errors);
  }
  warnings.push(...balanceValidation.warnings);

  // Calculate totals
  const totalDebits = balances
    .filter(balance => balance.balanceType === 'debit')
    .reduce((sum, balance) => sum + balance.balance, 0);

  const totalCredits = balances
    .filter(balance => balance.balanceType === 'credit')
    .reduce((sum, balance) => sum + balance.balance, 0);

  const isBalanced = Math.abs(totalDebits - totalCredits) <= 0.01;

  if (!isBalanced) {
    issues.push(`Period 0 is not balanced. Difference: ${Math.abs(totalDebits - totalCredits)}`);
  }

  // Check for required accounts
  const requiredAccounts = ['CASH', 'RETAINED_EARNINGS', 'EQUITY'];
  const presentAccounts = balances.map(balance => balance.accountCode);
  const missingAccounts = requiredAccounts.filter(account => !presentAccounts.includes(account));

  if (missingAccounts.length > 0) {
    warnings.push(`Missing recommended accounts: ${missingAccounts.join(', ')}`);
  }

  // Check for zero balances
  const zeroBalances = balances.filter(balance => balance.balance === 0);
  if (zeroBalances.length > 0) {
    warnings.push(`${zeroBalances.length} accounts have zero opening balances`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    totalDebits: roundToCurrency(totalDebits, 'MYR'),
    totalCredits: roundToCurrency(totalCredits, 'MYR'),
    isBalanced,
  };
}

/**
 * Create period 0 entries
 */
export function createPeriod0Entries(balances: OpeningBalance[]): JournalEntry[] {
  if (!balances || balances.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Opening balances are required',
      balances,
      { operation: 'create-period-0-entries' }
    );
  }

  // Validate balances
  const validation = validateOpeningBalances(balances);
  if (!validation.isValid) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `Invalid opening balances: ${validation.errors.join(', ')}`,
      balances,
      { operation: 'create-period-0-entries' }
    );
  }

  // Create a single journal entry for all opening balances
  const lines: JournalLine[] = balances.map((balance, index) => ({
    id: `P0-${index}`,
    accountCode: balance.accountCode,
    description: `Period 0 opening balance for ${balance.accountName}`,
    debit: balance.balanceType === 'debit' ? roundToCurrency(balance.balance, balance.currency) : 0,
    credit: balance.balanceType === 'credit' ? roundToCurrency(balance.balance, balance.currency) : 0,
    currency: balance.currency,
    ...(balance.dimensions && { dimensions: balance.dimensions }),
  }));

  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  const entry: JournalEntry = {
    id: `P0-${Date.now()}`,
    date: new Date(),
    reference: 'P0-OPENING',
    description: 'Period 0 opening balances',
    lines,
    totalDebits: roundToCurrency(totalDebits, 'MYR'),
    totalCredits: roundToCurrency(totalCredits, 'MYR'),
    currency: 'MYR',
    status: 'draft',
  };

  return [entry];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create an empty opening balance
 */
export function createEmptyOpeningBalance(
  accountCode: string,
  accountName: string,
  currency: SupportedCurrency = 'MYR'
): OpeningBalance {
  if (!accountCode) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Account code is required',
      accountCode,
      { operation: 'create-empty-opening-balance' }
    );
  }

  if (!accountName) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Account name is required',
      accountName,
      { operation: 'create-empty-opening-balance' }
    );
  }

  return {
    accountCode,
    accountName,
    balance: 0,
    balanceType: 'debit',
    currency,
  };
}

/**
 * Convert opening balance to journal line
 */
export function openingBalanceToJournalLine(
  balance: OpeningBalance,
  lineId: string
): JournalLine {
  if (!balance) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Opening balance is required',
      balance,
      { operation: 'opening-balance-to-journal-line' }
    );
  }

  if (!lineId) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Line ID is required',
      lineId,
      { operation: 'opening-balance-to-journal-line' }
    );
  }

  return {
    id: lineId,
    accountCode: balance.accountCode,
    description: `Opening balance for ${balance.accountName}`,
    debit: balance.balanceType === 'debit' ? roundToCurrency(balance.balance, balance.currency) : 0,
    credit: balance.balanceType === 'credit' ? roundToCurrency(balance.balance, balance.currency) : 0,
    currency: balance.currency,
    ...(balance.dimensions && { dimensions: balance.dimensions }),
  };
}

/**
 * Get opening balance summary
 */
export function getOpeningBalanceSummary(balances: OpeningBalance[]): {
  totalAccounts: number;
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  isBalanced: boolean;
  currencies: SupportedCurrency[];
  balanceTypes: string[];
} {
  if (!balances || balances.length === 0) {
    return {
      totalAccounts: 0,
      totalDebits: 0,
      totalCredits: 0,
      netBalance: 0,
      isBalanced: true,
      currencies: [],
      balanceTypes: [],
    };
  }

  const totalDebits = balances
    .filter(balance => balance.balanceType === 'debit')
    .reduce((sum, balance) => sum + balance.balance, 0);

  const totalCredits = balances
    .filter(balance => balance.balanceType === 'credit')
    .reduce((sum, balance) => sum + balance.balance, 0);

  const netBalance = totalDebits - totalCredits;
  const isBalanced = Math.abs(netBalance) <= 0.01;

  const currencies = Array.from(new Set(balances.map(balance => balance.currency)));
  const balanceTypes = Array.from(new Set(balances.map(balance => balance.balanceType)));

  return {
    totalAccounts: balances.length,
    totalDebits: roundToCurrency(totalDebits, 'MYR'),
    totalCredits: roundToCurrency(totalCredits, 'MYR'),
    netBalance: roundToCurrency(netBalance, 'MYR'),
    isBalanced,
    currencies,
    balanceTypes,
  };
}
