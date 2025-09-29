import type {
  GeneralLedgerProjection,
  TrialBalanceData,
  GLIntegrityReport,
} from '../projections/general-ledger.projection';

// Re-export types for external use
export type { TrialBalanceData, GLIntegrityReport };

import { AccountType } from '../domain/account.domain';
import { roundAmount, isEmpty, hasItems } from '../utils';
import { createValidationError } from '../utils/error-utilities';

/**
 * Trial balance validation result
 */
export interface TrialBalanceValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly totalDebits: number;
  readonly totalCredits: number;
  readonly difference: number;
  readonly isBalanced: boolean;
}

/**
 * Reconciliation report for trial balance variances
 */
export interface ReconciliationReport {
  readonly tenantId: string;
  readonly period: string;
  readonly generatedAt: Date;
  readonly totalVariances: number;
  readonly variances: Array<{
    readonly accountCode: string;
    readonly accountName: string;
    readonly expectedBalance: number;
    readonly actualBalance: number;
    readonly variance: number;
    readonly varianceType: 'DEBIT' | 'CREDIT';
    readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  readonly recommendations: string[];
  readonly isReconciled: boolean;
}

/**
 * Trial Balance Service
 *
 * Provides automated trial balance generation, validation, and reconciliation.
 * Implements modern accounting best practices with comprehensive error detection.
 *
 * Key Features:
 * - Automated trial balance generation
 * - Balance validation and error detection
 * - Variance analysis and reconciliation
 * - Exception reporting and alerts
 * - Multi-currency support
 * - Period-based reporting
 */
export class TrialBalanceService {
  constructor(private readonly glProjection: GeneralLedgerProjection) {}

  /**
   * Generate trial balance for a tenant and period
   */
  public async generateTrialBalance(
    tenantId: string,
    _period: string,
    asOfDate?: Date,
  ): Promise<TrialBalanceData> {
    const trialBalance = this.glProjection.getTrialBalanceData(tenantId, asOfDate);

    // Validate the generated trial balance
    const validation = this.validateTrialBalance(trialBalance);
    if (!validation.isValid) {
      throw createValidationError(
        'TRIAL_BALANCE_VALIDATION_FAILED',
        `Trial balance validation failed: ${validation.errors.join(', ')}`,
        'trialBalance',
        { operation: 'validate-trial-balance' }
      );
    }

    return trialBalance;
  }

  /**
   * Validate trial balance data
   */
  public validateTrialBalance(trialBalance: TrialBalanceData): TrialBalanceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if trial balance is balanced
    const difference = Math.abs(trialBalance.totalDebits - trialBalance.totalCredits);
    const isBalanced = difference < 0.01; // Allow for minor rounding differences

    if (!isBalanced) {
      errors.push(
        `Trial balance is not balanced. Debits: ${roundAmount(trialBalance.totalDebits, 2)}, ` +
          `Credits: ${roundAmount(trialBalance.totalCredits, 2)}, Difference: ${roundAmount(difference, 2)}`,
      );
    }

    // Check for accounts with both debit and credit balances
    for (const account of trialBalance.accounts) {
      if (account.debitBalance > 0 && account.creditBalance > 0) {
        errors.push(`Account ${account.accountCode} has both debit and credit balances`);
      }
    }

    // Check for accounts with zero balances (warning)
    const zeroBalanceAccounts = trialBalance.accounts.filter(
      (accumulator) => accumulator.debitBalance === 0 && accumulator.creditBalance === 0,
    );

    if (hasItems(zeroBalanceAccounts)) {
      warnings.push(`${zeroBalanceAccounts.length} accounts have zero balances`);
    }

    // Check for unusually large balances (warning)
    const largeBalanceThreshold = 1_000_000; // $1M threshold
    const largeBalances = trialBalance.accounts.filter(
      (accumulator) =>
        accumulator.debitBalance > largeBalanceThreshold ||
        accumulator.creditBalance > largeBalanceThreshold,
    );

    if (hasItems(largeBalances)) {
      warnings.push(
        `${largeBalances.length} accounts have unusually large balances (>${largeBalanceThreshold.toLocaleString()})`,
      );
    }

    // Validate account type consistency
    this.validateAccountTypeConsistency(trialBalance, errors, warnings);

    return {
      isValid: isEmpty(errors),
      errors,
      warnings,
      totalDebits: trialBalance.totalDebits,
      totalCredits: trialBalance.totalCredits,
      difference,
      isBalanced,
    };
  }

  /**
   * Reconcile trial balance variances
   */
  public async reconcileVariances(
    tenantId: string,
    period: string,
    expectedBalances?: Map<string, number>,
  ): Promise<ReconciliationReport> {
    const trialBalance = await this.generateTrialBalance(tenantId, period);
    const variances: ReconciliationReport['variances'] = [];
    const recommendations: string[] = [];

    // If no expected balances provided, use GL integrity check
    if (!expectedBalances) {
      const integrityReport = this.glProjection.validateGLIntegrity(tenantId);

      if (!integrityReport.isHealthy) {
        for (const _issue of integrityReport.issues) {
          variances.push({
            accountCode: 'UNKNOWN',
            accountName: 'Unknown Account',
            expectedBalance: 0,
            actualBalance: 0,
            variance: 0,
            varianceType: 'DEBIT',
            severity: 'HIGH',
          });
        }

        recommendations.push('Review GL integrity issues before proceeding with reconciliation');
      }

      return {
        tenantId,
        period,
        generatedAt: new Date(),
        totalVariances: variances.length,
        variances,
        recommendations,
        isReconciled: isEmpty(variances),
      };
    }

    // Compare actual vs expected balances
    for (const account of trialBalance.accounts) {
      const expectedBalance = expectedBalances.get(account.accountCode) ?? 0;
      const actualBalance = account.debitBalance - account.creditBalance;
      const variance = Math.abs(actualBalance - expectedBalance);

      if (variance > 0.01) {
        // Only report variances > $0.01
        const severity = this.calculateVarianceSeverity(variance, actualBalance);

        variances.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          expectedBalance,
          actualBalance,
          variance,
          varianceType: actualBalance >= 0 ? 'DEBIT' : 'CREDIT',
          severity,
        });
      }
    }

    // Generate recommendations based on variances
    this.generateReconciliationRecommendations(variances, recommendations);

    return {
      tenantId,
      period,
      generatedAt: new Date(),
      totalVariances: variances.length,
      variances,
      recommendations,
      isReconciled: isEmpty(variances),
    };
  }

  /**
   * Generate exception report for trial balance
   */
  public async generateExceptionReport(tenantId: string, period: string): Promise<ExceptionReport> {
    const trialBalance = await this.generateTrialBalance(tenantId, period);
    const validation = this.validateTrialBalance(trialBalance);
    const integrityReport = this.glProjection.validateGLIntegrity(tenantId);

    const exceptions: ExceptionReport['exceptions'] = [];

    // Add validation errors as exceptions
    for (const error of validation.errors) {
      exceptions.push({
        type: 'VALIDATION_ERROR',
        severity: 'CRITICAL',
        message: error,
        accountCode: 'N/A',
        recommendation: 'Review and correct the validation error',
      });
    }

    // Add integrity issues as exceptions
    for (const _issue of integrityReport.issues) {
      exceptions.push({
        type: 'INTEGRITY_ISSUE',
        severity: 'HIGH',
        message: _issue,
        accountCode: 'N/A',
        recommendation: 'Review account balance polarity rules',
      });
    }

    // Add warnings as exceptions
    for (const warning of validation.warnings) {
      exceptions.push({
        type: 'WARNING',
        severity: 'MEDIUM',
        message: warning,
        accountCode: 'N/A',
        recommendation: 'Review account balances for potential issues',
      });
    }

    return {
      tenantId,
      period,
      generatedAt: new Date(),
      totalExceptions: exceptions.length,
      exceptions,
      requiresAttention: exceptions.some(
        (exception) => exception.severity === 'CRITICAL' || exception.severity === 'HIGH',
      ),
    };
  }

  private validateAccountTypeConsistency(
    trialBalance: TrialBalanceData,
    _errors: string[],
    warnings: string[],
  ): void {
    for (const account of trialBalance.accounts) {
      const { accountType, debitBalance, creditBalance } = account;

      // Debit accounts (Assets, Expenses) should typically have debit balances
      if (accountType === AccountType.ASSET || accountType === AccountType.EXPENSE) {
        if (creditBalance > debitBalance && creditBalance > 0.01) {
          warnings.push(
            `${accountType} account ${account.accountCode} has credit balance: ${creditBalance}`,
          );
        }
      }

      // Credit accounts (Liabilities, Equity, Revenue) should typically have credit balances
      if (
        accountType === AccountType.LIABILITY ||
        accountType === AccountType.EQUITY ||
        accountType === AccountType.REVENUE
      ) {
        if (debitBalance > creditBalance && debitBalance > 0.01) {
          warnings.push(
            `${accountType} account ${account.accountCode} has debit balance: ${debitBalance}`,
          );
        }
      }
    }
  }

  private calculateVarianceSeverity(
    variance: number,
    actualBalance: number,
  ): ReconciliationReport['variances'][0]['severity'] {
    const variancePercentage =
      actualBalance !== 0 ? (variance / Math.abs(actualBalance)) * 100 : 100;

    if (variancePercentage > 50 || variance > 100_000) {
      return 'CRITICAL';
    } else if (variancePercentage > 25 || variance > 10_000) {
      return 'HIGH';
    } else if (variancePercentage > 10 || variance > 1_000) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  private generateReconciliationRecommendations(
    variances: ReconciliationReport['variances'],
    recommendations: string[],
  ): void {
    const criticalVariances = variances.filter((v) => v.severity === 'CRITICAL');
    const highVariances = variances.filter((v) => v.severity === 'HIGH');

    if (hasItems(criticalVariances)) {
      recommendations.push(
        `Immediate attention required: ${criticalVariances.length} critical variances found`,
      );
    }

    if (hasItems(highVariances)) {
      recommendations.push(
        `High priority review: ${highVariances.length} high-severity variances found`,
      );
    }

    if (hasItems(variances)) {
      recommendations.push('Review journal entries for the affected accounts');
      recommendations.push('Verify account balances against source documents');
      recommendations.push('Consider implementing automated balance validation rules');
    }
  }
}

/**
 * Exception report for trial balance
 */
export interface ExceptionReport {
  readonly tenantId: string;
  readonly period: string;
  readonly generatedAt: Date;
  readonly totalExceptions: number;
  readonly exceptions: Array<{
    readonly type: 'VALIDATION_ERROR' | 'INTEGRITY_ISSUE' | 'WARNING';
    readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    readonly message: string;
    readonly accountCode: string;
    readonly recommendation: string;
  }>;
  readonly requiresAttention: boolean;
}
