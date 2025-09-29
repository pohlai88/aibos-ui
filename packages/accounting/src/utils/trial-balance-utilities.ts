/**
 * Trial Balance Utilities - Refactored
 * 
 * Build trial balances with period filters and perform hard accounting checks.
 * Now uses SSOT architecture with split modules for better maintainability.
 * 
 * Features:
 * - Trial balance builder for any period
 * - Period filtering by date ranges and fiscal periods
 * - Hard checks for accounting equation (Assets = Liabilities + Equity)
 * - Account grouping by type and category
 * - Variance analysis between periods
 * - Export capabilities
 */

// Re-export from split modules for backward compatibility
export type * from './trial-balance-types-utilities';
export * from './trial-balance-builder-utilities';
export * from './trial-balance-validation-utilities';
export * from './trial-balance-formatters-utilities';

import {
  type SupportedCurrency,
  type AccountType,
  roundToCurrency,
} from './accounting-utilities';
import type { JournalEntry } from './journal-entry-utilities';
import type { DateRange } from './date-utilities';

// ============================================================================
// TRIAL BALANCE UTILITIES (Backward Compatibility)
// ============================================================================

/**
 * Build trial balance for a specific period
 */
export function buildTrialBalanceForPeriod(
  period: DateRange,
  accounts: Array<{
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
  isActive: boolean;
  currency: SupportedCurrency;
  openingBalance: number;
  balanceType: 'debit' | 'credit';
  }>,
  journalEntries: JournalEntry[] = []
): {
  period: DateRange;
  accounts: Array<{
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  openingBalance: number;
  periodDebits: number;
  periodCredits: number;
  closingBalance: number;
  balanceType: 'debit' | 'credit';
  }>;
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  generatedAt: Date;
} {
  // Calculate trial balance accounts
  const trialBalanceAccounts = accounts.map(account => {
    const periodDebits = calculatePeriodDebits(account.code, journalEntries, period);
    const periodCredits = calculatePeriodCredits(account.code, journalEntries, period);
    const closingBalance = account.openingBalance + periodDebits - periodCredits;

    return {
      accountCode: account.code,
      accountName: account.name,
      accountType: account.type,
      openingBalance: account.openingBalance,
      periodDebits,
      periodCredits,
      closingBalance,
      balanceType: account.balanceType
    };
  });

  // Calculate totals
  const totalDebits = trialBalanceAccounts.reduce((sum, account) => {
    return sum + (account.balanceType === 'debit' ? account.closingBalance : 0);
  }, 0);
  
  const totalCredits = trialBalanceAccounts.reduce((sum, account) => {
    return sum + (account.balanceType === 'credit' ? account.closingBalance : 0);
  }, 0);
  
  const netBalance = totalDebits - totalCredits;

  return {
    period,
    accounts: trialBalanceAccounts,
    totalDebits: roundToCurrency(totalDebits, 'MYR'),
    totalCredits: roundToCurrency(totalCredits, 'MYR'),
    netBalance: roundToCurrency(netBalance, 'MYR'),
    generatedAt: new Date()
  };
}

/**
 * Calculate period debits for an account
 */
function calculatePeriodDebits(
  _accountCode: string,
  journalEntries: JournalEntry[],
  period: DateRange
): number {
  return journalEntries
    .filter(entry => 
      entry.date >= period.start && 
      entry.date <= period.end
    )
    .reduce((total, _entry) => {
      // This would be implemented based on journal entry line structure
      // For now, return 0
      return total;
    }, 0);
}

/**
 * Calculate period credits for an account
 */
function calculatePeriodCredits(
  _accountCode: string,
  journalEntries: JournalEntry[],
  period: DateRange
): number {
  return journalEntries
    .filter(entry => 
      entry.date >= period.start && 
      entry.date <= period.end
    )
    .reduce((total, _entry) => {
      // This would be implemented based on journal entry line structure
      // For now, return 0
      return total;
    }, 0);
}

/**
 * Validate accounting equation (Assets = Liabilities + Equity)
 */
export function validateAccountingEquation(trialBalance: {
  accounts: Array<{
    accountType: AccountType;
    closingBalance: number;
    balanceType: 'debit' | 'credit';
  }>;
}): {
  isValid: boolean;
  assets: number;
  liabilities: number;
  equity: number;
  difference: number;
  withinTolerance: boolean;
} {
  const assets = calculateAccountTypeTotal(trialBalance, 'ASSET');
  const liabilities = calculateAccountTypeTotal(trialBalance, 'LIABILITY');
  const equity = calculateAccountTypeTotal(trialBalance, 'EQUITY');
  
  const equationBalance = liabilities + equity;
  const difference = Math.abs(assets - equationBalance);
  const tolerance = 0.01;
  const withinTolerance = difference <= tolerance;

  return {
    isValid: withinTolerance,
    assets: roundToCurrency(assets, 'MYR'),
    liabilities: roundToCurrency(liabilities, 'MYR'),
    equity: roundToCurrency(equity, 'MYR'),
    difference: roundToCurrency(difference, 'MYR'),
    withinTolerance
  };
}

/**
 * Calculate total for specific account type
 */
function calculateAccountTypeTotal(
  trialBalance: {
    accounts: Array<{
      accountType: AccountType;
      closingBalance: number;
      balanceType: 'debit' | 'credit';
    }>;
  },
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
 * Group accounts by type
 */
export function groupAccountsByType(accounts: Array<{
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  closingBalance: number;
  balanceType: 'debit' | 'credit';
}>): Array<{
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  closingBalance: number;
  balanceType: 'debit' | 'credit';
}> {
  const typeOrder = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
  return accounts.sort((a, b) => {
    const aIndex = typeOrder.indexOf(a.accountType);
    const bIndex = typeOrder.indexOf(b.accountType);
    return aIndex - bIndex;
  });
}

/**
 * Calculate variance between two trial balances
 */
export function calculateTrialBalanceVariance(
  current: {
    accounts: Array<{
      accountCode: string;
      accountName: string;
      closingBalance: number;
    }>;
  },
  prior: {
    accounts: Array<{
      accountCode: string;
      accountName: string;
      closingBalance: number;
    }>;
  }
): Array<{
  accountCode: string;
  accountName: string;
  currentBalance: number;
  priorBalance: number;
  variance: number;
  variancePercentage: number;
  isSignificant: boolean;
}> {
  const variances: Array<{
    accountCode: string;
    accountName: string;
    currentBalance: number;
    priorBalance: number;
    variance: number;
    variancePercentage: number;
    isSignificant: boolean;
  }> = [];
  
  current.accounts.forEach(currentAccount => {
    const priorAccount = prior.accounts.find(p => p.accountCode === currentAccount.accountCode);
    if (priorAccount) {
      const variance = currentAccount.closingBalance - priorAccount.closingBalance;
      const variancePercentage = priorAccount.closingBalance !== 0 ? 
        (variance / Math.abs(priorAccount.closingBalance)) * 100 : 0;
      const isSignificant = Math.abs(variancePercentage) > 10; // 10% threshold
      
      variances.push({
        accountCode: currentAccount.accountCode,
        accountName: currentAccount.accountName,
        currentBalance: currentAccount.closingBalance,
        priorBalance: priorAccount.closingBalance,
        variance,
        variancePercentage,
        isSignificant
      });
    }
  });
  
  return variances;
}

/**
 * Format trial balance for display
 */
export function formatTrialBalanceForDisplay(trialBalance: {
  period: DateRange;
  accounts: Array<{
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    openingBalance: number;
    periodDebits: number;
    periodCredits: number;
    closingBalance: number;
    balanceType: 'debit' | 'credit';
  }>;
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  generatedAt: Date;
}): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`Trial Balance`);
  lines.push(`Period: ${trialBalance.period.start.toLocaleDateString()} - ${trialBalance.period.end.toLocaleDateString()}`);
  lines.push(`Generated: ${trialBalance.generatedAt.toLocaleString()}`);
  lines.push('');
  
  // Account details
  lines.push('Account Code | Account Name | Type | Opening Balance | Debits | Credits | Closing Balance | Balance Type');
  lines.push('-'.repeat(120));
  
  trialBalance.accounts.forEach(account => {
    const line = [
      account.accountCode.padEnd(12),
      account.accountName.padEnd(20),
      account.accountType.padEnd(8),
      account.openingBalance.toFixed(2).padStart(15),
      account.periodDebits.toFixed(2).padStart(8),
      account.periodCredits.toFixed(2).padStart(8),
      account.closingBalance.toFixed(2).padStart(15),
      account.balanceType.padEnd(12)
    ].join(' | ');
    
    lines.push(line);
  });
  
  lines.push('-'.repeat(120));
  
  // Totals
  lines.push(`Total Debits: ${trialBalance.totalDebits.toFixed(2)}`);
  lines.push(`Total Credits: ${trialBalance.totalCredits.toFixed(2)}`);
  lines.push(`Net Balance: ${trialBalance.netBalance.toFixed(2)}`);
  
  return lines.join('\n');
}

/**
 * Export trial balance to CSV
 */
export function exportTrialBalanceToCSV(trialBalance: {
  period: DateRange;
  accounts: Array<{
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    openingBalance: number;
    periodDebits: number;
    periodCredits: number;
    closingBalance: number;
    balanceType: 'debit' | 'credit';
  }>;
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  generatedAt: Date;
}): string {
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
    account.openingBalance.toFixed(2),
    account.periodDebits.toFixed(2),
    account.periodCredits.toFixed(2),
    account.closingBalance.toFixed(2),
    account.balanceType
  ]);

  const csvLines = [headers.join(','), ...rows.map(row => row.join(','))];
  return csvLines.join('\n');
}