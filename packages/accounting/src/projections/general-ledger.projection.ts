import type { DomainEvent as _DomainEvent } from '@aibos/eventsourcing';

import { AccountType } from '../domain/account.domain';
import { toMinorUnits, isEmpty } from '../utils';
import {
  type AccountBalanceUpdatedEvent,
  type AccountStateUpdatedEvent,
} from '../events/account-updated.event';
import { type JournalEntryPostedEvent } from '../events/journal-entry-posted.event';

/**
 * Account balance snapshot at a specific point in time
 */
export interface AccountBalance {
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly balance: number;
  readonly balanceCents: bigint; // Lossless precision
  readonly currencyCode: string;
  readonly asOfDate: Date;
  readonly lastUpdated: Date;
  readonly tenantId: string;
}

/**
 * General Ledger Projection
 *
 * Maintains real-time account balances by processing accounting events.
 * Provides read-optimized access to account balances and GL data.
 *
 * Key Features:
 * - Event-driven balance updates
 * - Lossless precision with cents
 * - Multi-currency support
 * - Period-based reporting
 * - Audit trail preservation
 */
export class GeneralLedgerProjection {
  private readonly balances: Map<string, AccountBalance> = new Map();
  private readonly balanceHistory: Map<string, AccountBalance[]> = new Map();
  private readonly periodBalances: Map<string, Map<string, AccountBalance>> = new Map();

  /**
   * Update GL balances from a journal entry event
   */
  public async updateFromJournalEntry(event: JournalEntryPostedEvent): Promise<void> {
    const { entries, tenantId, currencyCode, accountingPeriod, occurredAt } = event;

    for (const entry of entries) {
      const accountCode = entry.accountCode;
      const key = `${tenantId}:${accountCode}`;

      // Get current balance or create new
      const currentBalance = this.balances.get(key);
      const netAmount = entry.debitAmount - entry.creditAmount;

      const newBalance: AccountBalance = {
        accountCode,
        accountName: currentBalance?.accountName ?? `Account ${accountCode}`, // Fallback name
        accountType: currentBalance?.accountType ?? AccountType.ASSET, // Fallback type
        balance: (currentBalance?.balance ?? 0) + netAmount,
        balanceCents: (currentBalance?.balanceCents ?? 0n) + BigInt(toMinorUnits(netAmount, 2)),
        currencyCode: currencyCode ?? 'MYR', // Default to Malaysian Ringgit
        asOfDate: occurredAt,
        lastUpdated: new Date(),
        tenantId,
      };

      // Update current balance
      this.balances.set(key, newBalance);

      // Add to history
      this.addToHistory(key, newBalance);

      // Update period balances
      this.updatePeriodBalance(accountingPeriod, key, newBalance);
    }
  }

  /**
   * Update GL balance from account balance event
   */
  public async updateFromAccountBalance(event: AccountBalanceUpdatedEvent): Promise<void> {
    const { accountCode, balance, tenantId, occurredAt } = event;
    const key = `${tenantId}:${accountCode}`;

    const currentBalance = this.balances.get(key);
    const newBalance: AccountBalance = {
      accountCode,
      accountName: currentBalance?.accountName ?? `Account ${accountCode}`,
      accountType: currentBalance?.accountType ?? AccountType.ASSET,
      balance,
      balanceCents: BigInt(toMinorUnits(balance, 2)),
      currencyCode: currentBalance?.currencyCode ?? 'MYR',
      asOfDate: occurredAt,
      lastUpdated: new Date(),
      tenantId,
    };

    this.balances.set(key, newBalance);
    this.addToHistory(key, newBalance);
  }

  public async updateFromAccountState(event: AccountStateUpdatedEvent): Promise<void> {
    const { accountCode, accountName, accountType, tenantId, occurredAt } = event;
    const key = `${tenantId}:${accountCode}`;

    const currentBalance = this.balances.get(key);
    const newBalance: AccountBalance = {
      accountCode,
      accountName: accountName,
      accountType: accountType,
      balance: currentBalance?.balance ?? 0,
      balanceCents: currentBalance?.balanceCents ?? BigInt(0),
      currencyCode: currentBalance?.currencyCode ?? 'MYR',
      asOfDate: occurredAt,
      lastUpdated: new Date(),
      tenantId,
    };

    this.balances.set(key, newBalance);
    this.addToHistory(key, newBalance);
  }

  /**
   * Get account balance as of specific date
   */
  public getAccountBalance(
    accountCode: string,
    tenantId: string,
    asOfDate?: Date,
  ): AccountBalance | undefined {
    const key = `${tenantId}:${accountCode}`;
    const balance = this.balances.get(key);

    if (!balance) {
      return undefined;
    }

    if (!asOfDate) {
      return balance;
    }

    // Find the most recent balance before or on the asOfDate
    const history = this.balanceHistory.get(key) ?? [];
    const historicalBalance = history
      .filter((b) => b.asOfDate <= asOfDate)
      .sort((a, b) => b.asOfDate.getTime() - a.asOfDate.getTime())[0];

    return historicalBalance ?? balance;
  }

  /**
   * Get all account balances for a tenant
   */
  public getAllAccountBalances(tenantId: string): AccountBalance[] {
    return Array.from(this.balances.values()).filter((balance) => balance.tenantId === tenantId);
  }

  /**
   * Get account balances by type
   */
  public getAccountBalancesByType(tenantId: string, accountType: AccountType): AccountBalance[] {
    return this.getAllAccountBalances(tenantId).filter(
      (balance) => balance.accountType === accountType,
    );
  }

  /**
   * Get period balances for a specific accounting period
   */
  public getPeriodBalances(tenantId: string, period: string): AccountBalance[] {
    const periodBalances = this.periodBalances.get(period);
    if (!periodBalances) {
      return [];
    }

    return Array.from(periodBalances.values()).filter((balance) => balance.tenantId === tenantId);
  }

  /**
   * Get balance history for an account
   */
  public getAccountBalanceHistory(accountCode: string, tenantId: string): AccountBalance[] {
    const key = `${tenantId}:${accountCode}`;
    return this.balanceHistory.get(key) ?? [];
  }

  /**
   * Calculate total balance for account type
   */
  public getTotalBalanceByType(tenantId: string, accountType: AccountType): number {
    return this.getAccountBalancesByType(tenantId, accountType).reduce(
      (total, balance) => total + balance.balance,
      0,
    );
  }

  /**
   * Get trial balance data
   */
  public getTrialBalanceData(tenantId: string, asOfDate?: Date): TrialBalanceData {
    const balances = this.getAllAccountBalances(tenantId);

    const accounts = balances.map((balance) => ({
      accountCode: balance.accountCode,
      accountName: balance.accountName,
      accountType: balance.accountType,
      debitBalance: balance.balance >= 0 ? balance.balance : 0,
      creditBalance: balance.balance < 0 ? Math.abs(balance.balance) : 0,
      currencyCode: balance.currencyCode,
    }));

    // Calculate totals
    const totalDebits = accounts.reduce((sum, accumulator) => sum + accumulator.debitBalance, 0);
    const totalCredits = accounts.reduce((sum, accumulator) => sum + accumulator.creditBalance, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    const trialBalance: TrialBalanceData = {
      tenantId,
      asOfDate: asOfDate ?? new Date(),
      accounts,
      totalDebits,
      totalCredits,
      isBalanced,
    };

    return trialBalance;
  }

  /**
   * Validate GL integrity
   */
  public validateGLIntegrity(tenantId: string): GLIntegrityReport {
    const balances = this.getAllAccountBalances(tenantId);
    const issues: string[] = [];

    // Check for negative balances on debit accounts
    const debitAccounts = balances.filter(
      (b) => b.accountType === AccountType.ASSET || b.accountType === AccountType.EXPENSE,
    );

    for (const account of debitAccounts) {
      if (account.balance < 0) {
        issues.push(
          `Debit account ${account.accountCode} has negative balance: ${account.balance}`,
        );
      }
    }

    // Check for positive balances on credit accounts
    const creditAccounts = balances.filter(
      (b) =>
        b.accountType === AccountType.LIABILITY ||
        b.accountType === AccountType.EQUITY ||
        b.accountType === AccountType.REVENUE,
    );

    for (const account of creditAccounts) {
      if (account.balance > 0) {
        issues.push(
          `Credit account ${account.accountCode} has positive balance: ${account.balance}`,
        );
      }
    }

    return {
      tenantId,
      validatedAt: new Date(),
      totalAccounts: balances.length,
      issuesFound: issues.length,
      issues,
      isHealthy: isEmpty(issues),
    };
  }

  /**
   * Clear all data (for testing)
   */
  public clear(): void {
    this.balances.clear();
    this.balanceHistory.clear();
    this.periodBalances.clear();
  }

  private addToHistory(key: string, balance: AccountBalance): void {
    const history = this.balanceHistory.get(key) ?? [];
    history.push(balance);

    // Keep only last 1000 entries per account to prevent memory bloat
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    this.balanceHistory.set(key, history);
  }

  private updatePeriodBalance(period: string, key: string, balance: AccountBalance): void {
    let periodBalances = this.periodBalances.get(period);
    if (!periodBalances) {
      periodBalances = new Map();
      this.periodBalances.set(period, periodBalances);
    }

    periodBalances.set(key, balance);
  }
}

/**
 * Trial balance data structure
 */
export interface TrialBalanceData {
  readonly tenantId: string;
  readonly asOfDate: Date;
  readonly accounts: Array<{
    readonly accountCode: string;
    readonly accountName: string;
    readonly accountType: AccountType;
    readonly debitBalance: number;
    readonly creditBalance: number;
    readonly currencyCode: string;
  }>;
  readonly totalDebits: number;
  readonly totalCredits: number;
  readonly isBalanced: boolean;
}

/**
 * GL integrity validation report
 */
export interface GLIntegrityReport {
  readonly tenantId: string;
  readonly validatedAt: Date;
  readonly totalAccounts: number;
  readonly issuesFound: number;
  readonly issues: string[];
  readonly isHealthy: boolean;
}
