/**
 * FX Revaluation Utilities
 * 
 * Handle realized/unrealized GL revaluations and period-end adjustments.
 * Provides comprehensive foreign exchange revaluation calculations and journal entry generation.
 * 
 * @fileoverview FX revaluation engine, realized/unrealized calculations, and period-end operations
 */

import {
  SupportedCurrency,
  roundToCurrency,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';
import { type ValidationIssue, type BusinessValidationResult, type ValidationCode } from './validation-utilities';
import { formatDate, isAfterFns, isBeforeFns } from './date-utilities';
import { JournalEntry, JournalLine } from './journal-entry-utilities';
import { FiscalPeriod, PeriodStatus } from './fiscal-period-utilities';
import { ExchangeRate, getLatestExchangeRate } from './fx-ledger-utilities';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface FXAccount {
  accountCode: string;
  currency: SupportedCurrency;
  baseCurrency: SupportedCurrency;
  balance: number;
  lastRevaluationDate: Date;
  lastRevaluationRate: number;
  revaluationMethod: RevaluationMethod;
}

export interface RevaluationResult {
  account: FXAccount;
  currentRate: number;
  historicalRate: number;
  revaluationAmount: number;
  revaluationType: 'gain' | 'loss';
  isRealized: boolean;
  period: FiscalPeriod;
}

export interface RevaluationEntry {
  accountCode: string;
  revaluationAmount: number;
  revaluationType: 'gain' | 'loss';
  isRealized: boolean;
  rate: number;
  period: FiscalPeriod;
}

export interface FXTransaction {
  id: string;
  accountCode: string;
  currency: SupportedCurrency;
  baseCurrency: SupportedCurrency;
  amount: number;
  transactionDate: Date;
  settlementDate?: Date;
  rate: number;
  isSettled: boolean;
}

export interface RealizedResult {
  transaction: FXTransaction;
  settlementRate: number;
  realizedGainLoss: number;
  gainLossType: 'gain' | 'loss';
  period: FiscalPeriod;
}

export interface UnrealizedResult {
  account: FXAccount;
  currentRate: number;
  unrealizedGainLoss: number;
  gainLossType: 'gain' | 'loss';
  period: FiscalPeriod;
}

export interface RevaluationHistory {
  id: string;
  accountCode: string;
  period: FiscalPeriod;
  revaluationAmount: number;
  revaluationType: 'gain' | 'loss';
  isRealized: boolean;
  rate: number;
  date: Date;
}

export interface RevaluationOptions {
  revaluationMethod?: RevaluationMethod;
  rateType?: 'mid' | 'buy' | 'sell';
  includeRealized?: boolean;
  includeUnrealized?: boolean;
  tolerance?: number;
}

export type RevaluationMethod = 'current_rate' | 'historical_rate' | 'average_rate';

// ============================================================================
// Revaluation Storage
// ============================================================================

// In-memory storage for revaluation history
const revaluationHistory = new Map<string, RevaluationHistory[]>();

/**
 * Store revaluation history
 */
function storeRevaluationHistory(account: FXAccount, revaluation: RevaluationResult): void {
  const history: RevaluationHistory = {
    id: `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    accountCode: account.accountCode,
    period: revaluation.period,
    revaluationAmount: revaluation.revaluationAmount,
    revaluationType: revaluation.revaluationType,
    isRealized: revaluation.isRealized,
    rate: revaluation.currentRate,
    date: new Date(),
  };
  
  const existing = revaluationHistory.get(account.accountCode) || [];
  existing.push(history);
  revaluationHistory.set(account.accountCode, existing);
}

// ============================================================================
// Revaluation Calculations
// ============================================================================

/**
 * Calculate revaluation gain/loss
 */
export function calculateRevaluationGainLoss(
  account: FXAccount,
  currentRate: ExchangeRate,
  historicalRate: ExchangeRate
): RevaluationResult {
  if (account.currency === account.baseCurrency) {
    throw createValidationError(
      'SAME_CURRENCY',
      'Account currency and base currency cannot be the same for revaluation',
      { account: account.accountCode, currency: account.currency },
      { operation: 'calculate-revaluation-gain-loss' }
    );
  }
  
  const currentRateValue = currentRate.rate;
  const historicalRateValue = historicalRate.rate;
  
  // Calculate revaluation amount
  const balanceInBase = account.balance * historicalRateValue;
  const currentValueInBase = account.balance * currentRateValue;
  const revaluationAmount = Math.abs(currentValueInBase - balanceInBase);
  
  const revaluationType = currentValueInBase > balanceInBase ? 'gain' : 'loss';
  
  return {
    account,
    currentRate: currentRateValue,
    historicalRate: historicalRateValue,
    revaluationAmount: roundToCurrency(revaluationAmount, account.baseCurrency),
    revaluationType,
    isRealized: false,
    period: {
      id: `P-${formatDate(new Date())}`,
      name: formatDate(new Date()),
      startDate: new Date(),
      endDate: new Date(),
      status: { status: 'open' } as PeriodStatus,
      year: new Date().getFullYear(),
      period: 1,
      backdateWindow: 30,
    },
  };
}

/**
 * Calculate realized gain/loss
 */
export function calculateRealizedGainLoss(
  transaction: FXTransaction,
  settlementRate: ExchangeRate
): RealizedResult {
  if (transaction.currency === transaction.baseCurrency) {
    throw createValidationError(
      'SAME_CURRENCY',
      'Transaction currency and base currency cannot be the same for realized calculation',
      { transaction: transaction.id, currency: transaction.currency },
      { operation: 'calculate-realized-gain-loss' }
    );
  }
  
  const transactionRate = transaction.rate;
  const settlementRateValue = settlementRate.rate;
  
  // Calculate realized gain/loss
  const transactionValueInBase = transaction.amount * transactionRate;
  const settlementValueInBase = transaction.amount * settlementRateValue;
  const realizedGainLoss = Math.abs(settlementValueInBase - transactionValueInBase);
  
  const gainLossType = settlementValueInBase > transactionValueInBase ? 'gain' : 'loss';
  
  return {
    transaction,
    settlementRate: settlementRateValue,
    realizedGainLoss: roundToCurrency(realizedGainLoss, transaction.baseCurrency),
    gainLossType,
    period: {
      id: `P-${formatDate(new Date())}`,
      name: formatDate(new Date()),
      startDate: new Date(),
      endDate: new Date(),
      status: { status: 'open' } as PeriodStatus,
      year: new Date().getFullYear(),
      period: 1,
      backdateWindow: 30,
    },
  };
}

/**
 * Calculate unrealized gain/loss
 */
export function calculateUnrealizedGainLoss(
  account: FXAccount,
  currentRate: ExchangeRate
): UnrealizedResult {
  if (account.currency === account.baseCurrency) {
    throw createValidationError(
      'SAME_CURRENCY',
      'Account currency and base currency cannot be the same for unrealized calculation',
      { account: account.accountCode, currency: account.currency },
      { operation: 'calculate-unrealized-gain-loss' }
    );
  }
  
  const currentRateValue = currentRate.rate;
  const historicalRateValue = account.lastRevaluationRate;
  
  // Calculate unrealized gain/loss
  const balanceInBase = account.balance * historicalRateValue;
  const currentValueInBase = account.balance * currentRateValue;
  const unrealizedGainLoss = Math.abs(currentValueInBase - balanceInBase);
  
  const gainLossType = currentValueInBase > balanceInBase ? 'gain' : 'loss';
  
  return {
    account,
    currentRate: currentRateValue,
    unrealizedGainLoss: roundToCurrency(unrealizedGainLoss, account.baseCurrency),
    gainLossType,
    period: {
      id: `P-${formatDate(new Date())}`,
      name: formatDate(new Date()),
      startDate: new Date(),
      endDate: new Date(),
      status: { status: 'open' } as PeriodStatus,
      year: new Date().getFullYear(),
      period: 1,
      backdateWindow: 30,
    },
  };
}

// ============================================================================
// Period-End Operations
// ============================================================================

/**
 * Generate period-end revaluation
 */
export function generatePeriodEndRevaluation(
  accounts: FXAccount[],
  period: FiscalPeriod
): RevaluationEntry[] {
  const entries: RevaluationEntry[] = [];
  
  for (const account of accounts) {
    if (account.currency === account.baseCurrency) {
      continue; // Skip accounts with same currency as base
    }
    
    const currentRate = getLatestExchangeRate(account.currency, account.baseCurrency, 'mid');
    if (!currentRate) {
      throw createValidationError(
        'MISSING_EXCHANGE_RATE',
        `Exchange rate not found for ${account.currency} to ${account.baseCurrency}`,
        { account: account.accountCode, currency: account.currency },
        { operation: 'generate-period-end-revaluation' }
      );
    }
    
    const revaluation = calculateUnrealizedGainLoss(account, currentRate);
    
    entries.push({
      accountCode: account.accountCode,
      revaluationAmount: revaluation.unrealizedGainLoss,
      revaluationType: revaluation.gainLossType,
      isRealized: false,
      rate: revaluation.currentRate,
      period,
    });
  }
  
  return entries;
}

/**
 * Post revaluation entries
 */
export function postRevaluationEntries(entries: RevaluationEntry[]): JournalEntry[] {
  const journalEntries: JournalEntry[] = [];
  
  for (const entry of entries) {
    const lines: JournalLine[] = [];
    
    // Create revaluation account line
    const revaluationAccount = entry.revaluationType === 'gain' 
      ? 'FX_GAIN_ACCOUNT' 
      : 'FX_LOSS_ACCOUNT';
    
    lines.push({
      id: `REV-${entry.accountCode}-1`,
      accountCode: revaluationAccount,
      description: `FX ${entry.revaluationType} revaluation for ${entry.accountCode}`,
      debit: entry.revaluationType === 'loss' ? entry.revaluationAmount : 0,
      credit: entry.revaluationType === 'gain' ? entry.revaluationAmount : 0,
      currency: 'USD', // Base currency
    });
    
    // Create account line
    lines.push({
      id: `REV-${entry.accountCode}-2`,
      accountCode: entry.accountCode,
      description: `FX ${entry.revaluationType} revaluation adjustment`,
      debit: entry.revaluationType === 'gain' ? entry.revaluationAmount : 0,
      credit: entry.revaluationType === 'loss' ? entry.revaluationAmount : 0,
      currency: 'USD', // Base currency
    });
    
    const journalEntry: JournalEntry = {
      id: `JE-REV-${entry.accountCode}-${Date.now()}`,
      description: `FX Revaluation - ${entry.accountCode}`,
      date: new Date(),
      lines,
      totalDebits: entry.revaluationAmount,
      totalCredits: entry.revaluationAmount,
      currency: 'USD',
      status: 'posted',
      reference: `FX-REV-${entry.period.id}`,
    };
    
    journalEntries.push(journalEntry);
  }
  
  return journalEntries;
}

/**
 * Validate revaluation entries
 */
export function validateRevaluationEntries(entries: RevaluationEntry[]): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  for (const entry of entries) {
    if (!entry.accountCode) {
      issues.push({
        code: 'REQUIRED' as ValidationCode,
        message: 'Account code is required',
        path: 'accountCode',
      });
    }
    
    if (!entry.revaluationAmount || entry.revaluationAmount <= 0) {
      issues.push({
        code: 'RANGE' as ValidationCode,
        message: 'Revaluation amount must be greater than zero',
        path: 'revaluationAmount',
      });
    }
    
    if (!entry.revaluationType || !['gain', 'loss'].includes(entry.revaluationType)) {
      issues.push({
        code: 'FORMAT' as ValidationCode,
        message: 'Revaluation type must be gain or loss',
        path: 'revaluationType',
      });
    }
    
    if (!entry.rate || entry.rate <= 0) {
      issues.push({
        code: 'RANGE' as ValidationCode,
        message: 'Exchange rate must be greater than zero',
        path: 'rate',
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(i => i.severity !== 'warning').map(i => i.message),
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    issues,
  };
}

// ============================================================================
// History and Tracking
// ============================================================================

/**
 * Track revaluation history
 */
export function trackRevaluationHistory(account: FXAccount, revaluation: RevaluationResult): void {
  storeRevaluationHistory(account, revaluation);
}

/**
 * Get revaluation history
 */
export function getRevaluationHistory(
  account: FXAccount,
  period: { startDate: Date; endDate: Date }
): RevaluationHistory[] {
  const history = revaluationHistory.get(account.accountCode) || [];
  
  return history.filter(h => 
    isAfterFns(h.date, period.startDate) && isBeforeFns(h.date, period.endDate)
  );
}

/**
 * Calculate cumulative revaluation
 */
export function calculateCumulativeRevaluation(account: FXAccount, asOfDate: Date): number {
  const history = revaluationHistory.get(account.accountCode) || [];
  
  const relevantHistory = history.filter(h => isBeforeFns(h.date, asOfDate));
  
  return relevantHistory.reduce((total, h) => {
    const amount = h.revaluationType === 'gain' ? h.revaluationAmount : -h.revaluationAmount;
    return total + amount;
  }, 0);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get revaluation summary
 */
export function getRevaluationSummary(
  accounts: FXAccount[],
  period: FiscalPeriod
): {
  totalGains: number;
  totalLosses: number;
  netRevaluation: number;
  accountCount: number;
  realizedCount: number;
  unrealizedCount: number;
} {
  const entries = generatePeriodEndRevaluation(accounts, period);
  
  const totalGains = entries
    .filter(e => e.revaluationType === 'gain')
    .reduce((sum, e) => sum + e.revaluationAmount, 0);
  
  const totalLosses = entries
    .filter(e => e.revaluationType === 'loss')
    .reduce((sum, e) => sum + e.revaluationAmount, 0);
  
  const realizedCount = entries.filter(e => e.isRealized).length;
  const unrealizedCount = entries.filter(e => !e.isRealized).length;
  
  return {
    totalGains,
    totalLosses,
    netRevaluation: totalGains - totalLosses,
    accountCount: entries.length,
    realizedCount,
    unrealizedCount,
  };
}

/**
 * Clear revaluation history (for testing)
 */
export function clearRevaluationHistory(): void {
  revaluationHistory.clear();
}

/**
 * Get revaluation statistics
 */
export function getRevaluationStatistics(
  account: FXAccount,
  period: { startDate: Date; endDate: Date }
): {
  totalRevaluations: number;
  totalGains: number;
  totalLosses: number;
  netRevaluation: number;
  averageRate: number;
  rateVolatility: number;
} {
  const history = getRevaluationHistory(account, period);
  
  if (history.length === 0) {
    return {
      totalRevaluations: 0,
      totalGains: 0,
      totalLosses: 0,
      netRevaluation: 0,
      averageRate: 0,
      rateVolatility: 0,
    };
  }
  
  const totalGains = history
    .filter(h => h.revaluationType === 'gain')
    .reduce((sum, h) => sum + h.revaluationAmount, 0);
  
  const totalLosses = history
    .filter(h => h.revaluationType === 'loss')
    .reduce((sum, h) => sum + h.revaluationAmount, 0);
  
  const rates = history.map(h => h.rate);
  const averageRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  
  const rateVariance = rates.reduce((sum, rate) => sum + Math.pow(rate - averageRate, 2), 0) / rates.length;
  const rateVolatility = Math.sqrt(rateVariance);
  
  return {
    totalRevaluations: history.length,
    totalGains,
    totalLosses,
    netRevaluation: totalGains - totalLosses,
    averageRate,
    rateVolatility,
  };
}
