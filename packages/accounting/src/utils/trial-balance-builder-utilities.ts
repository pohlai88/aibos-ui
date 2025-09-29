/**
 * Trial Balance Builder - SSOT Implementation
 * 
 * Builder logic for trial balance generation and construction.
 * Imports from trial-balance-types.ts and core-types.ts for consistency.
 */

import type { 
  type TrialBalance,
  type TrialBalanceAccount,
  type Account,
  type TrialBalanceBuilderOptions,
  type TrialBalanceBuilderResult,
  type DateRange,
  type BalanceType
} from './trial-balance-types-utilities';
import { 
  type AccountType,
  roundToCurrency
} from './accounting-utilities';
import type { 
  type BaseJournalEntry
} from './core-types-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import { createValidationIssue, createBusinessValidationResult } from './policies/validation-policy';

// ============================================================================
// TRIAL BALANCE BUILDER
// ============================================================================

export class TrialBalanceBuilder {
  private options: TrialBalanceBuilderOptions;
  private accounts: Account[] = [];
  private journalEntries: BaseJournalEntry[] = [];

  constructor(options: TrialBalanceBuilderOptions) {
    this.options = {
      includeInactive: false,
      grouping: 'BY_TYPE',
      includeVariances: false,
      varianceThreshold: 0.1,
      ...options
    };
  }

  /**
   * Set accounts for trial balance
   */
  setAccounts(accounts: Account[]): this {
    this.accounts = accounts;
    return this;
  }

  /**
   * Set journal entries for trial balance
   */
  setJournalEntries(entries: BaseJournalEntry[]): this {
    this.journalEntries = entries;
    return this;
  }

  /**
   * Build trial balance
   */
  build(): TrialBalanceBuilderResult {
    const startTime = Date.now();
    
    // Filter accounts based on options
    const filteredAccounts = this.filterAccounts();
    
    // Calculate trial balance accounts
    const trialBalanceAccounts = this.calculateTrialBalanceAccounts(filteredAccounts);
    
    // Group accounts if requested
    const groupedAccounts = this.groupAccounts(trialBalanceAccounts);
    
    // Calculate totals
    const totals = this.calculateTotals(groupedAccounts);
    
    // Create trial balance
    const trialBalance: TrialBalance = {
      id: this.generateTrialBalanceId(),
      title: `Trial Balance - ${this.formatPeriod(this.options.period)}`,
      period: this.options.period,
      accounts: groupedAccounts,
      totalDebits: totals.totalDebits,
      totalCredits: totals.totalCredits,
      netBalance: totals.netBalance,
      generatedAt: new Date(),
      generatedBy: 'system',
      status: 'DRAFT',
      reportingCurrency: this.options.reportingCurrency || 'MYR',
      metadata: {
        totalAccounts: filteredAccounts.length,
        activeAccounts: filteredAccounts.filter(a => a.isActive).length,
        inactiveAccounts: filteredAccounts.filter(a => !a.isActive).length,
        multiCurrencyAccounts: filteredAccounts.filter(a => a.currency !== (this.options.reportingCurrency || 'MYR')).length,
        generationTime: Date.now() - startTime
      }
    };
    
    // Validate trial balance
    const validationResult = this.validateTrialBalance(trialBalance);
    
    // Calculate variances if requested
    const variances = this.options.includeVariances ? 
      this.calculateVariances(trialBalance) : [];
    
    return {
      trialBalance,
      validationResult,
      ...(variances.length > 0 && { variances }),
      metadata: {
        totalAccounts: filteredAccounts.length,
        activeAccounts: filteredAccounts.filter(a => a.isActive).length,
        inactiveAccounts: filteredAccounts.filter(a => !a.isActive).length,
        multiCurrencyAccounts: filteredAccounts.filter(a => a.currency !== this.options.reportingCurrency).length,
        generationTime: Date.now() - startTime
      }
    };
  }

  /**
   * Filter accounts based on options
   */
  private filterAccounts(): Account[] {
    let filtered = [...this.accounts];
    
    // Filter by active status
    if (!this.options.includeInactive) {
      filtered = filtered.filter(account => account.isActive);
    }
    
    // Filter by period (if accounts have date ranges)
    // This would be implemented based on account date ranges
    
    return filtered;
  }

  /**
   * Calculate trial balance accounts
   */
  private calculateTrialBalanceAccounts(accounts: Account[]): TrialBalanceAccount[] {
    return accounts.map(account => {
      // Calculate period debits and credits from journal entries
      const periodDebits = this.calculatePeriodDebits(account.code);
      const periodCredits = this.calculatePeriodCredits(account.code);
      
      // Calculate closing balance
      const closingBalance = account.openingBalance + periodDebits - periodCredits;
      
      // Determine balance type
      const balanceType = this.determineBalanceType(account.type, closingBalance);
      
      return {
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        openingBalance: account.openingBalance,
        periodDebits,
        periodCredits,
        closingBalance,
        balanceType,
        currency: account.currency,
        ...(account.parentCode && { parentCode: account.parentCode }),
        isActive: account.isActive
      };
    });
  }

  /**
   * Calculate period debits for an account
   */
  private calculatePeriodDebits(_accountCode: string): number {
    return this.journalEntries
      .filter(entry => 
        entry.date >= this.options.period.start && 
        entry.date <= this.options.period.end
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
  private calculatePeriodCredits(_accountCode: string): number {
    return this.journalEntries
      .filter(entry => 
        entry.date >= this.options.period.start && 
        entry.date <= this.options.period.end
      )
      .reduce((total, _entry) => {
        // This would be implemented based on journal entry line structure
        // For now, return 0
        return total;
      }, 0);
  }

  /**
   * Determine balance type based on account type and balance
   */
  private determineBalanceType(accountType: AccountType, balance: number): BalanceType {
    // Asset accounts: debit balance is positive
    if (['ASSET', 'EXPENSE'].includes(accountType)) {
      return balance >= 0 ? 'debit' : 'credit';
    }
    
    // Liability and equity accounts: credit balance is positive
    if (['LIABILITY', 'EQUITY', 'REVENUE'].includes(accountType)) {
      return balance >= 0 ? 'credit' : 'debit';
    }
    
    return 'debit';
  }

  /**
   * Group accounts based on grouping option
   */
  private groupAccounts(accounts: TrialBalanceAccount[]): TrialBalanceAccount[] {
    switch (this.options.grouping) {
      case 'BY_TYPE':
        return this.groupByType(accounts);
      case 'BY_CATEGORY':
        return this.groupByCategory(accounts);
      case 'BY_PARENT':
        return this.groupByParent(accounts);
      case 'BY_CURRENCY':
        return this.groupByCurrency(accounts);
      default:
        return accounts;
    }
  }

  /**
   * Group accounts by type
   */
  private groupByType(accounts: TrialBalanceAccount[]): TrialBalanceAccount[] {
    const typeOrder = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    return accounts.sort((a, b) => {
      const aIndex = typeOrder.indexOf(a.accountType);
      const bIndex = typeOrder.indexOf(b.accountType);
      return aIndex - bIndex;
    });
  }

  /**
   * Group accounts by category
   */
  private groupByCategory(accounts: TrialBalanceAccount[]): TrialBalanceAccount[] {
    // This would be implemented based on account category structure
    return accounts;
  }

  /**
   * Group accounts by parent
   */
  private groupByParent(accounts: TrialBalanceAccount[]): TrialBalanceAccount[] {
    return accounts.sort((a, b) => {
      if (a.parentCode && b.parentCode) {
        return a.parentCode.localeCompare(b.parentCode);
      }
      if (a.parentCode) return -1;
      if (b.parentCode) return 1;
      return a.accountCode.localeCompare(b.accountCode);
    });
  }

  /**
   * Group accounts by currency
   */
  private groupByCurrency(accounts: TrialBalanceAccount[]): TrialBalanceAccount[] {
    return accounts.sort((a, b) => a.currency.localeCompare(b.currency));
  }

  /**
   * Calculate totals
   */
  private calculateTotals(accounts: TrialBalanceAccount[]): {
    totalDebits: number;
    totalCredits: number;
    netBalance: number;
  } {
    const totalDebits = accounts.reduce((sum, account) => {
      return sum + (account.balanceType === 'debit' ? account.closingBalance : 0);
    }, 0);
    
    const totalCredits = accounts.reduce((sum, account) => {
      return sum + (account.balanceType === 'credit' ? account.closingBalance : 0);
    }, 0);
    
    const netBalance = totalDebits - totalCredits;
    
    return {
      totalDebits: roundToCurrency(totalDebits, this.options.reportingCurrency || 'MYR'),
      totalCredits: roundToCurrency(totalCredits, this.options.reportingCurrency || 'MYR'),
      netBalance: roundToCurrency(netBalance, this.options.reportingCurrency || 'MYR')
    };
  }

  /**
   * Validate trial balance
   */
  private validateTrialBalance(trialBalance: TrialBalance): unknown {
    // This would implement the equation validation logic
    return {
      isValid: true,
      assets: 0,
      liabilities: 0,
      equity: 0,
      difference: 0,
      withinTolerance: true,
      tolerance: 0.01,
      validationDate: new Date(),
      details: {
        assetAccounts: 0,
        liabilityAccounts: 0,
        equityAccounts: 0,
        totalAccounts: trialBalance.accounts.length
      }
    };
  }

  /**
   * Calculate variances
   */
  private calculateVariances(_trialBalance: TrialBalance): unknown[] {
    // This would implement variance calculation logic
    return [];
  }

  /**
   * Generate trial balance ID
   */
  private generateTrialBalanceId(): string {
    return `TB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format period for display
   */
  private formatPeriod(period: DateRange): string {
    const start = period.start.toLocaleDateString();
    const end = period.end.toLocaleDateString();
    return `${start} - ${end}`;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create trial balance builder
 */
export function createTrialBalanceBuilder(options: TrialBalanceBuilderOptions): TrialBalanceBuilder {
  return new TrialBalanceBuilder(options);
}

/**
 * Build trial balance with accounts and journal entries
 */
export function buildTrialBalance(
  options: TrialBalanceBuilderOptions,
  accounts: Account[],
  journalEntries: BaseJournalEntry[] = []
): TrialBalanceBuilderResult {
  const builder = new TrialBalanceBuilder(options);
  builder.setAccounts(accounts);
  builder.setJournalEntries(journalEntries);
  return builder.build();
}

/**
 * Validate trial balance builder options
 */
export function validateTrialBalanceBuilderOptions(
  options: TrialBalanceBuilderOptions
): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!options.period) {
    issues.push(createValidationIssue(
      'MISSING_PERIOD',
      'Period is required',
      'error',
      'period',
      options.period
    ));
  }
  
  if (options.period && options.period.start >= options.period.end) {
    issues.push(createValidationIssue(
      'INVALID_PERIOD',
      'Start date must be before end date',
      'error',
      'period',
      options.period
    ));
  }
  
  if (options.varianceThreshold && (options.varianceThreshold < 0 || options.varianceThreshold > 1)) {
    issues.push(createValidationIssue(
      'INVALID_VARIANCE_THRESHOLD',
      'Variance threshold must be between 0 and 1',
      'error',
      'varianceThreshold',
      options.varianceThreshold
    ));
  }
  
  return createBusinessValidationResult(issues.length === 0, issues);
}
