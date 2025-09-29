/**
 * UI Integration Service
 *
 * Enterprise-grade service for UI-specific accounting operations.
 * Provides optimized data access patterns for frontend components.
 *
 * Phase 1: Foundation Architecture - Core UI integration patterns
 */

import { Injectable } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { Account } from '../domain/account.domain';
import { JournalEntry } from '../domain/journal-entry';
import { CreateAccountCommand } from '../commands/create-account.command';
import { PostJournalEntryCommand } from '../commands/post-journal-entry.command';
import { TrialBalanceService } from './trial-balance.service';
import { AccountType } from '../domain/account.domain';
import { omitUndefined, roundAmount } from '../utils';
import { createBusinessError, createValidationError, ErrorContext } from '../utils/error-utilities';
import { PerformanceProfiler, createProfiler, PerformanceTimer } from '../utils/performance-utilities';

// Constants for error messages
const UI_GET_ACCOUNTS_FAILED_MESSAGE = 'Failed to get accounts for UI';
const UI_INTEGRATION_ENTITY = 'ui-integration';

export interface UIAccountSummary {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  isActive: boolean;
  parentCode?: string;
  childrenCount: number;
}

export interface UIJournalEntrySummary {
  id: string;
  reference: string;
  description: string;
  postingDate: Date;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  status: string;
  lineCount: number;
}

export interface UIBalanceValidation {
  isBalanced: boolean;
  totalDebits: number;
  totalCredits: number;
  difference: number;
  errors: string[];
}

export interface UIAccountingContext {
  tenantId: string;
  userId: string;
  currentPeriod: string;
  baseCurrency: string;
  userRole: 'CFO' | 'Accountant' | 'Auditor' | 'Bookkeeper';
  permissions: string[];
}

@Injectable()
export class UIIntegrationService {
  private readonly profiler: PerformanceProfiler;

  constructor(
    private readonly accountingService: AccountingService,
    private readonly trialBalanceService: TrialBalanceService,
  ) {
    this.profiler = createProfiler();
  }

  /**
   * Get accounts optimized for UI display
   * Provides hierarchical account structure with summary information
   */
  async getAccountsForUI(
    context: UIAccountingContext,
    options: {
      includeInactive?: boolean;
      parentCode?: string;
      accountType?: string;
      searchTerm?: string;
    } = {},
  ): Promise<UIAccountSummary[]> {
    const timer = new PerformanceTimer('getAccountsForUI');
    const errorContext: ErrorContext = {
      operation: 'getAccountsForUI',
      tenantId: context.tenantId,
      userId: context.userId,
      userRole: context.userRole,
    };

    try {
      // Use proper service method - Clean Architecture compliant
      const accounts = await this.accountingService.getAccountsForTenant(context.tenantId);

      return accounts
        .filter((account: Account) => {
          if (!options.includeInactive && !account.isActive) return false;
          if (options.parentCode && account.parentAccountCode !== options.parentCode) return false;
          if (options.accountType && account.accountType !== options.accountType) return false;
          if (options.searchTerm) {
            const searchLower = options.searchTerm.toLowerCase();
            return (
              account.accountCode.toLowerCase().includes(searchLower) ||
              account.accountName.toLowerCase().includes(searchLower)
            );
          }
          return true;
        })
        .map((account: Account) =>
          omitUndefined({
            id: account.accountCode, // Use accountCode as ID for now
            code: account.accountCode,
            name: account.accountName,
            type: account.accountType,
            balance: account.balance,
            currency: context.baseCurrency,
            isActive: account.isActive,
            parentCode: account.parentAccountCode || undefined,
            childrenCount: accounts.filter(
              (a: Account) => a.parentAccountCode === account.accountCode,
            ).length,
          }),
        );
    } catch (_error) {
      throw createBusinessError(
        'ui-get-accounts-failed',
        UI_GET_ACCOUNTS_FAILED_MESSAGE,
        UI_INTEGRATION_ENTITY,
        errorContext
      );
    } finally {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
    }
  }

  /**
   * Get journal entries optimized for UI display
   * Provides summary information for list views
   */
  async getJournalEntriesForUI(
    context: UIAccountingContext,
    options: {
      startDate?: Date;
      endDate?: Date;
      accountCode?: string;
      reference?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<UIJournalEntrySummary[]> {
    const timer = new PerformanceTimer('getJournalEntriesForUI');
    const errorContext: ErrorContext = {
      operation: 'getJournalEntriesForUI',
      tenantId: context.tenantId,
      userId: context.userId,
      userRole: context.userRole,
    };

    try {
      // Use proper service method - Clean Architecture compliant
      const journalEntries = await this.accountingService.getJournalEntriesForTenant(
        context.tenantId,
      );

      return journalEntries
        .filter((entry: JournalEntry) => {
          if (options.accountCode) {
            return entry.getAccountCodes().includes(options.accountCode);
          }
          if (options.reference) {
            return entry.getReference().toLowerCase().includes(options.reference.toLowerCase());
          }
          return true;
        })
        .map((entry: JournalEntry) => {
          const totalDebits = entry.getTotalDebit();
          const totalCredits = entry.getTotalCredit();

          return {
            id: entry.getId(), // Use inherited getId() method
            reference: entry.getReference(),
            description: entry.getDescription(),
            postingDate: entry.getPostedAt() || new Date(),
            totalDebits,
            totalCredits,
            isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
            status: entry.getStatus(),
            lineCount: entry.getEntries().length,
          };
        });
    } catch (_error) {
      throw createBusinessError(
        'ui-get-journal-entries-failed',
        UI_GET_ACCOUNTS_FAILED_MESSAGE,
        UI_INTEGRATION_ENTITY,
        errorContext
      );
    } finally {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
    }
  }

  /**
   * Validate journal entry balance for real-time UI feedback
   * Provides immediate validation for form components
   */
  async validateJournalEntryBalance(
    context: UIAccountingContext,
    entries: Array<{
      accountCode: string;
      debitAmount: number;
      creditAmount: number;
      currency: string;
      description: string;
    }>,
  ): Promise<UIBalanceValidation> {
    const timer = new PerformanceTimer('validateJournalEntryBalance');
    const errorContext: ErrorContext = {
      operation: 'validateJournalEntryBalance',
      tenantId: context.tenantId,
      userId: context.userId,
      userRole: context.userRole,
    };

    try {
      const totalDebits = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
      const totalCredits = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
      const difference = Math.abs(totalDebits - totalCredits);
      const isBalanced = difference < 0.01;

      const errors: string[] = [];

      if (!isBalanced) {
        errors.push(
          `Debits (${roundAmount(totalDebits, 2)}) and credits (${roundAmount(totalCredits, 2)}) must balance`,
        );
      }

      if (entries.length < 2) {
        errors.push('At least two journal entry lines are required');
      }

      // Validate account codes exist
      const accounts = await this.accountingService.getAccountsForTenant(context.tenantId);
      const accountCodes = accounts.map((a: Account) => a.accountCode);

      for (const entry of entries) {
        if (!accountCodes.includes(entry.accountCode)) {
          errors.push(`Account code ${entry.accountCode} does not exist`);
        }
      }

      return {
        isBalanced,
        totalDebits,
        totalCredits,
        difference,
        errors,
      };
    } catch (_error) {
      throw createValidationError(
        'journalEntryBalance',
        UI_GET_ACCOUNTS_FAILED_MESSAGE,
        entries,
        errorContext
      );
    } finally {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
    }
  }

  /**
   * Create account with UI-optimized response
   * Provides immediate feedback for form components
   */
  async createAccountFromUI(
    context: UIAccountingContext,
    accountData: {
      accountCode: string;
      accountName: string;
      accountType: string;
      parentAccountCode?: string;
      postingAllowed: boolean;
    },
  ): Promise<UIAccountSummary> {
    const timer = new PerformanceTimer('createAccountFromUI');
    const errorContext: ErrorContext = {
      operation: 'createAccountFromUI',
      tenantId: context.tenantId,
      userId: context.userId,
      userRole: context.userRole,
      accountCode: accountData.accountCode,
      accountName: accountData.accountName,
    };

    try {
      const command = new CreateAccountCommand(
        omitUndefined({
          tenantId: context.tenantId,
          userId: context.userId,
          accountCode: accountData.accountCode,
          accountName: accountData.accountName,
          accountType: accountData.accountType as AccountType,
          parentAccountCode: accountData.parentAccountCode,
          postingAllowed: accountData.postingAllowed,
        }),
      );

      await this.accountingService.createAccount(command);

      // Get the created account using proper service method
      const account = await this.accountingService.getAccountByCode(
        command.accountCode,
        context.tenantId,
      );

      if (!account) {
        throw createBusinessError(
          'account-creation-failed',
          'Account was not created successfully',
          'account',
          errorContext
        );
      }

      return omitUndefined({
        id: account.accountCode, // Use accountCode as ID for now
        code: account.accountCode,
        name: account.accountName,
        type: account.accountType,
        balance: account.balance,
        currency: context.baseCurrency,
        isActive: account.isActive,
        parentCode: account.parentAccountCode,
        childrenCount: 0,
      });
    } catch (_error) {
      throw createBusinessError(
        'ui-create-account-failed',
        UI_GET_ACCOUNTS_FAILED_MESSAGE,
        UI_INTEGRATION_ENTITY,
        errorContext
      );
    } finally {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
    }
  }

  /**
   * Post journal entry with UI-optimized response
   * Provides immediate feedback for form components
   */
  async postJournalEntryFromUI(
    context: UIAccountingContext,
    journalEntryData: {
      journalEntryId: string;
      reference: string;
      description: string;
      postingDate: Date;
      entries: Array<{
        accountCode: string;
        debitAmount: number;
        creditAmount: number;
        currency: string;
        description: string;
      }>;
    },
    idempotencyKey?: string,
  ): Promise<UIJournalEntrySummary> {
    const timer = new PerformanceTimer('postJournalEntryFromUI');
    const errorContext: ErrorContext = {
      operation: 'postJournalEntryFromUI',
      tenantId: context.tenantId,
      userId: context.userId,
      userRole: context.userRole,
      journalEntryId: journalEntryData.journalEntryId,
      reference: journalEntryData.reference,
    };

    try {
      const command = new PostJournalEntryCommand({
        journalEntryId: journalEntryData.journalEntryId,
        tenantId: context.tenantId,
        userId: context.userId,
        entries: journalEntryData.entries,
        reference: journalEntryData.reference,
        description: journalEntryData.description,
        postingDate: journalEntryData.postingDate,
      });

      await this.accountingService.postJournalEntry(command, idempotencyKey);

      // Get the posted journal entry using proper service method
      const journalEntry = await this.accountingService.getJournalEntryById(
        command.journalEntryId,
        context.tenantId,
      );

      if (!journalEntry) {
        throw createBusinessError(
          'journal-entry-posting-failed',
          'Journal entry was not posted successfully',
          'journal-entry',
          errorContext
        );
      }

      const totalDebits = journalEntry.getTotalDebit();
      const totalCredits = journalEntry.getTotalCredit();

      return {
        id: journalEntry.getId(),
        reference: journalEntry.getReference(),
        description: journalEntry.getDescription(),
        postingDate: journalEntry.getPostedAt() || new Date(),
        totalDebits,
        totalCredits,
        isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
        status: journalEntry.getStatus(),
        lineCount: journalEntry.getEntries().length,
      };
    } catch (_error) {
      throw createBusinessError(
        'ui-post-journal-entry-failed',
        UI_GET_ACCOUNTS_FAILED_MESSAGE,
        UI_INTEGRATION_ENTITY,
        errorContext
      );
    } finally {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
    }
  }

  /**
   * Get real-time balance information for UI components
   * Provides live balance data for dashboard components
   */
  async getRealTimeBalances(
    context: UIAccountingContext,
    accountCodes: string[],
  ): Promise<Map<string, number>> {
    const timer = new PerformanceTimer('getRealTimeBalances');
    const errorContext: ErrorContext = {
      operation: 'getRealTimeBalances',
      tenantId: context.tenantId,
      userId: context.userId,
      userRole: context.userRole,
    };

    try {
      const balances = new Map<string, number>();

      // Get trial balance data for the current period
      const trialBalance = await this.trialBalanceService.generateTrialBalance(
        context.tenantId,
        context.currentPeriod,
      );

      // Extract balances for requested account codes
      for (const accountCode of accountCodes) {
        const accountData = trialBalance.accounts.find(
          (accumulator) => accumulator.accountCode === accountCode,
        );
        if (accountData) {
          // Calculate net balance (debit - credit)
          const netBalance = accountData.debitBalance - accountData.creditBalance;
          balances.set(accountCode, netBalance);
        } else {
          balances.set(accountCode, 0);
        }
      }

      return balances;
    } catch (_error) {
      throw createBusinessError(
        'ui-get-real-time-balances-failed',
        UI_GET_ACCOUNTS_FAILED_MESSAGE,
        UI_INTEGRATION_ENTITY,
        errorContext
      );
    } finally {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
    }
  }

  /**
   * Get accounting context for UI components
   * Provides user-specific context and permissions
   */
  async getAccountingContext(tenantId: string, userId: string): Promise<UIAccountingContext> {
    const timer = new PerformanceTimer('getAccountingContext');
    const errorContext: ErrorContext = {
      operation: 'getAccountingContext',
      tenantId,
      userId,
    };

    try {
      // This would typically fetch from user service
      // For now, returning default context
      return {
        tenantId,
        userId,
        currentPeriod: '2024-Q4',
        baseCurrency: 'MYR',
        userRole: 'Accountant',
        permissions: ['CREATE_ACCOUNT', 'POST_JOURNAL_ENTRY', 'VIEW_REPORTS'],
      };
    } catch (_error) {
      throw createBusinessError(
        'ui-get-accounting-context-failed',
        UI_GET_ACCOUNTS_FAILED_MESSAGE,
        UI_INTEGRATION_ENTITY,
        errorContext
      );
    } finally {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
    }
  }
}
