/**
 * FX Revaluation Utilities
 * 
 * Handle realized/unrealized GL revaluations and period-end adjustments.
 * Provides comprehensive foreign exchange revaluation calculations and journal entry generation.
 * 
 * @fileoverview FX revaluation engine, realized/unrealized calculations, and period-end operations
 */

import type {
  SupportedCurrency,
} from './accounting-utilities';
import { roundToCurrency } from './accounting-utilities';
import { createValidationError } from './error-utilities';
import { type ValidationIssue, type BusinessValidationResult, type ValidationCode } from './validation-utilities';
import { formatDate, isAfterFns, isBeforeFns } from './date-utilities';
import type { JournalEntry, JournalLine } from './journal-entry-utilities';
import type { FiscalPeriod, PeriodStatus } from './fiscal-period-utilities';
import type { ExchangeRate } from './fx-ledger-utilities';
import { getLatestExchangeRate } from './fx-ledger-utilities';

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
  /** Base currency for postings (prevents hard-coding USD) */
  baseCurrency: SupportedCurrency;
}

// Optional controls for netting behavior
export interface NettingOptions {
  /** If true (default), create separate journals per currency *and* type (gain vs loss). */
  byType?: boolean;
  /** Skip tiny lines (post-filter), in base currency units. Default 0. */
  minEntry?: number;
  /** Collapse individual account lines into a single consolidated account line. Default false. */
  collapseAccounts?: boolean;
  /** Account to use for collapsed account line when collapseAccounts = true. */
  consolidatedAccountCode?: string; // e.g., 'FX-REVAL-CONSOLIDATED'
  /** Override gain/loss accounts (defaults from postRevaluationEntries behavior). */
  gainAccountCode?: string;         // default 'FX_GAIN_ACCOUNT'
  lossAccountCode?: string;         // default 'FX_LOSS_ACCOUNT'
  /** Optional description prefix on each journal. */
  descriptionPrefix?: string;       // e.g., 'Period End'
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
  
  // Calculate revaluation amount (base currency exposure)
  const balanceInBase = account.balance * historicalRateValue;
  const currentValueInBase = account.balance * currentRateValue;
  const delta = currentValueInBase - balanceInBase;
  const revaluationAmount = Math.abs(delta);
  const revaluationType = delta >= 0 ? 'gain' : 'loss';
  
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
  
  // Calculate realized gain/loss (base currency)
  const transactionValueInBase = transaction.amount * transactionRate;
  const settlementValueInBase = transaction.amount * settlementRateValue;
  const delta = settlementValueInBase - transactionValueInBase;
  const realizedGainLoss = Math.abs(delta);
  const gainLossType = delta >= 0 ? 'gain' : 'loss';
  
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
  
  // Calculate unrealized gain/loss (base currency)
  const balanceInBase = account.balance * historicalRateValue;
  const currentValueInBase = account.balance * currentRateValue;
  const delta = currentValueInBase - balanceInBase;
  const unrealizedGainLoss = Math.abs(delta);
  const gainLossType = delta >= 0 ? 'gain' : 'loss';
  
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
  period: FiscalPeriod,
  options: RevaluationOptions = {}
): RevaluationEntry[] {
  const entries: RevaluationEntry[] = [];
  const rateType = options.rateType ?? 'mid';
  const tolerance = options.tolerance ?? 0;
  const method = options.revaluationMethod ?? 'current_rate';
  
  for (const account of accounts) {
    if (account.currency === account.baseCurrency) {
      continue; // Skip accounts with same currency as base
    }
    
    const currentRate = getLatestExchangeRate(account.currency, account.baseCurrency, rateType);
    if (!currentRate) {
      throw createValidationError(
        'MISSING_EXCHANGE_RATE',
        `Exchange rate not found for ${account.currency} to ${account.baseCurrency}`,
        { account: account.accountCode, currency: account.currency },
        { operation: 'generate-period-end-revaluation' }
      );
    }

    // Choose historical/anchor rate per method
    let revaluationAmount = 0;
    let revaluationType: 'gain' | 'loss' = 'gain';
    if (method === 'current_rate') {
      const r = calculateUnrealizedGainLoss(account, currentRate);
      revaluationAmount = r.unrealizedGainLoss;
      revaluationType = r.gainLossType;
    } else if (method === 'historical_rate') {
      // Anchor to last revaluation rate (already in account.lastRevaluationRate)
      const balanceInBase = account.balance * account.lastRevaluationRate;
      const currentValueInBase = account.balance * currentRate.rate;
      const delta = currentValueInBase - balanceInBase;
      revaluationAmount = Math.abs(delta);
      revaluationType = delta >= 0 ? 'gain' : 'loss';
    } else if (method === 'average_rate') {
      // Midway: use average of current and last reval as anchor
      const avgRate = (currentRate.rate + account.lastRevaluationRate) / 2;
      const balanceInBase = account.balance * avgRate;
      const currentValueInBase = account.balance * currentRate.rate;
      const delta = currentValueInBase - balanceInBase;
      revaluationAmount = Math.abs(delta);
      revaluationType = delta >= 0 ? 'gain' : 'loss';
    }

    // Materiality filter
    if (revaluationAmount <= tolerance) continue;
    
    entries.push({
      accountCode: account.accountCode,
      revaluationAmount: roundToCurrency(revaluationAmount, account.baseCurrency),
      revaluationType,
      isRealized: false,
      rate: currentRate.rate,
      period,
      baseCurrency: account.baseCurrency
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
      currency: entry.baseCurrency ?? 'USD',
    });
    
    // Create account line
    lines.push({
      id: `REV-${entry.accountCode}-2`,
      accountCode: entry.accountCode,
      description: `FX ${entry.revaluationType} revaluation adjustment`,
      debit: entry.revaluationType === 'gain' ? entry.revaluationAmount : 0,
      credit: entry.revaluationType === 'loss' ? entry.revaluationAmount : 0,
      currency: entry.baseCurrency ?? 'USD',
    });
    
    const journalEntry: JournalEntry = {
      id: `JE-REV-${entry.accountCode}-${Date.now()}`,
      description: `FX Revaluation - ${entry.accountCode}`,
      date: new Date(),
      lines,
      totalDebits: roundToCurrency(entry.revaluationAmount, entry.baseCurrency ?? 'USD'),
      totalCredits: roundToCurrency(entry.revaluationAmount, entry.baseCurrency ?? 'USD'),
      currency: entry.baseCurrency ?? 'USD',
      status: 'posted',
      reference: `FX-REV-${entry.period.id}`,
    };
    
    journalEntries.push(journalEntry);
  }
  
  return journalEntries;
}

// ============================================================================
// Netting helper
// ============================================================================
/**
 * Net a list of revaluation entries into one journal per base currency (and per type if byType=true).
 * - For GAINS: each account is **debit**; one offset **credit** to FX_GAIN_ACCOUNT.
 * - For LOSSES: each account is **credit**; one offset **debit** to FX_LOSS_ACCOUNT.
 */
export function netRevaluationEntries(
  entries: RevaluationEntry[],
  options: NettingOptions = {}
): JournalEntry[] {
  const {
    byType = true,
    minEntry = 0,
    collapseAccounts = false,
    consolidatedAccountCode = 'FX-REVAL-CONSOLIDATED',
    gainAccountCode = 'FX_GAIN_ACCOUNT',
    lossAccountCode = 'FX_LOSS_ACCOUNT',
    descriptionPrefix = 'FX Revaluation (Netted)'
  } = options;

  // Guard
  if (!entries.length) return [];

  // Group by base currency (and type if requested)
  const keyFor = (e: RevaluationEntry) =>
    byType ? `${e.baseCurrency}|${e.revaluationType}` : `${e.baseCurrency}|all`;

  const groups = new Map<string, RevaluationEntry[]>();
  for (const e of entries) {
    if (!e.baseCurrency) continue;
    if (e.revaluationAmount <= 0) continue;
    if (e.revaluationAmount < minEntry) continue;
    const k = keyFor(e);
    const list = groups.get(k) ?? [];
    list.push(e);
    groups.set(k, list);
  }

  const journals: JournalEntry[] = [];
  const now = new Date();

  for (const [k, list] of groups.entries()) {
    if (!list.length) continue;
    const [baseCurrency, typeTag] = k.split('|') as [SupportedCurrency, string];

    // If byType=false, we need to split internally to keep sign logic consistent
    const buckets: Record<'gain'|'loss', RevaluationEntry[]> = { gain: [], loss: [] };
    if (typeTag === 'all') {
      for (const e of list) buckets[e.revaluationType].push(e);
    } else {
      const t = typeTag === 'gain' ? 'gain' : 'loss';
      buckets[t] = list;
    }

    for (const t of ['gain','loss'] as const) {
      const bucket = buckets[t];
      if (!bucket.length) continue;

      const total = roundToCurrency(
        bucket.reduce((s, e) => s + e.revaluationAmount, 0),
        baseCurrency
      );
      if (total <= 0) continue;

      const lines: JournalLine[] = [];

      if (collapseAccounts) {
        // One consolidated account line
        lines.push({
          id: `NET-${baseCurrency}-${t}-ACCT`,
          accountCode: consolidatedAccountCode,
          description: `${descriptionPrefix} — consolidated ${t} (${baseCurrency})`,
          debit: t === 'gain' ? total : 0,
          credit: t === 'loss' ? total : 0,
          currency: baseCurrency
        });
      } else {
        // One line per account
        for (const e of bucket) {
          lines.push({
            id: `NET-${e.accountCode}-${t}-${e.period.id}`,
            accountCode: e.accountCode,
            description: `${descriptionPrefix} for ${e.accountCode} (${t})`,
            debit: t === 'gain' ? e.revaluationAmount : 0,
            credit: t === 'loss' ? e.revaluationAmount : 0,
            currency: baseCurrency
          });
        }
      }

      // Offset line to gain/loss account
      const offsetAccount = t === 'gain' ? gainAccountCode : lossAccountCode;
      lines.push({
        id: `NET-${baseCurrency}-${t}-OFFSET`,
        accountCode: offsetAccount,
        description: `${descriptionPrefix} offset (${t})`,
        debit: t === 'loss' ? total : 0,
        credit: t === 'gain' ? total : 0,
        currency: baseCurrency
      });

      const totalDebits = lines.reduce((s, l) => s + l.debit, 0);
      const totalCredits = lines.reduce((s, l) => s + l.credit, 0);

      journals.push({
        id: `JE-NET-${baseCurrency}-${t}-${now.getTime()}`,
        description: `${descriptionPrefix} — ${t.toUpperCase()} (${baseCurrency})`,
        date: now,
        lines,
        totalDebits: roundToCurrency(totalDebits, baseCurrency),
        totalCredits: roundToCurrency(totalCredits, baseCurrency),
        currency: baseCurrency,
        status: 'posted',
        reference: `FX-REV-NET-${baseCurrency}-${t}`
      });
    }
  }

  return journals;
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
        severity: 'error'
      });
    }
    
    if (!entry.revaluationAmount || entry.revaluationAmount <= 0) {
      issues.push({
        code: 'RANGE' as ValidationCode,
        message: 'Revaluation amount must be greater than zero',
        path: 'revaluationAmount',
        severity: 'error'
      });
    }
    
    if (!entry.revaluationType || !['gain', 'loss'].includes(entry.revaluationType)) {
      issues.push({
        code: 'FORMAT' as ValidationCode,
        message: 'Revaluation type must be gain or loss',
        path: 'revaluationType',
        severity: 'error'
      });
    }
    
    if (!entry.rate || entry.rate <= 0) {
      issues.push({
        code: 'RANGE' as ValidationCode,
        message: 'Exchange rate must be greater than zero',
        path: 'rate',
        severity: 'error'
      });
    }

    if (!entry.baseCurrency) {
      issues.push({
        code: 'REQUIRED' as ValidationCode,
        message: 'Base currency is required',
        path: 'baseCurrency',
        severity: 'error'
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

// ============================================================================
// HEDGE ACCOUNTING INTEGRATION - PHASE 1 EXTENSIONS
// ============================================================================

/**
 * Hedge designation for FX risk management
 */
export interface HedgeDesignation {
  readonly designationId: string;
  readonly hedgeInstrument: HedgeInstrument;
  readonly hedgedItem: HedgedItem;
  readonly hedgeType: HedgeType;
  readonly designationDate: Date;
  readonly effectivenessMethod: EffectivenessMethod;
  readonly documentation: HedgeDocumentation;
}

/**
 * Hedge instrument details
 */
export interface HedgeInstrument {
  readonly instrumentId: string;
  readonly instrumentType: HedgeInstrumentType;
  readonly notionalAmount: number;
  readonly currency: SupportedCurrency;
  readonly maturityDate: Date;
  readonly fairValue: number;
  readonly instrumentDescription: string;
}

/**
 * Hedged item details
 */
export interface HedgedItem {
  readonly itemId: string;
  readonly itemType: HedgedItemType;
  readonly exposureAmount: number;
  readonly currency: SupportedCurrency;
  readonly expectedDate: Date;
  readonly itemDescription: string;
}

/**
 * Hedge accounting integration result
 */
export interface HedgeAccountingIntegration {
  readonly integrationId: string;
  readonly hedgeDesignation: HedgeDesignation;
  readonly fxRevaluation: FXRevaluationResult;
  readonly effectivenessRatio: number;
  readonly isEffective: boolean;
  readonly ociReclassification: OCIReclassification;
  readonly journalEntries: readonly JournalEntry[];
}

/**
 * FX revaluation result for hedge accounting
 */
export interface FXRevaluationResult {
  readonly revaluationId: string;
  readonly accountCode: string;
  readonly currency: SupportedCurrency;
  readonly baseCurrency: SupportedCurrency;
  readonly exposureAmount: number;
  readonly currentRate: number;
  readonly historicalRate: number;
  readonly revaluationAmount: number;
  readonly revaluationType: 'gain' | 'loss';
  readonly revaluationDate: Date;
}

/**
 * OCI reclassification for hedge accounting
 */
export interface OCIReclassification {
  readonly reclassificationId: string;
  readonly hedgeDesignation: HedgeDesignation;
  readonly reclassificationDate: Date;
  readonly ociAmount: number;
  readonly currency: SupportedCurrency;
  readonly reclassificationReason: ReclassificationReason;
  readonly journalEntry: JournalEntry;
}

/**
 * Hedge documentation
 */
export interface HedgeDocumentation {
  readonly documentationId: string;
  readonly designationId: string;
  readonly documentationType: HedgeDocumentationType;
  readonly content: string;
  readonly reviewDate: Date;
  readonly nextReviewDate: Date;
  readonly approvedBy: string;
  readonly approvedDate: Date;
}

/**
 * Hedge types
 */
export type HedgeType = 
  | 'fair_value_hedge'
  | 'cash_flow_hedge'
  | 'net_investment_hedge';

/**
 * Hedge instrument types
 */
export type HedgeInstrumentType = 
  | 'forward_contract'
  | 'swap_contract'
  | 'option_contract'
  | 'futures_contract'
  | 'currency_swap';

/**
 * Hedged item types
 */
export type HedgedItemType = 
  | 'foreign_currency_exposure'
  | 'forecast_transaction'
  | 'recognized_asset'
  | 'recognized_liability'
  | 'net_investment';

/**
 * Effectiveness methods
 */
export type EffectivenessMethod = 
  | 'dollar_offset_method'
  | 'regression_analysis'
  | 'critical_terms_match'
  | 'prospective_method'
  | 'retrospective_method';

/**
 * Hedge documentation types
 */
export type HedgeDocumentationType = 
  | 'hedge_documentation'
  | 'effectiveness_assessment'
  | 'risk_management_objective'
  | 'hedge_strategy';

/**
 * OCI reclassification reasons
 */
export type ReclassificationReason = 
  | 'hedge_ineffective'
  | 'hedge_expired'
  | 'hedge_terminated'
  | 'forecast_transaction_occurred'
  | 'net_investment_disposed';

// ============================================================================
// HEDGE ACCOUNTING INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Integrate hedge accounting with FX revaluation
 * 
 * @param fxRevaluation - FX revaluation result
 * @param hedgeDesignation - Hedge designation
 * @returns Hedge accounting integration result
 * 
 * @example
 * ```typescript
 * const integration = integrateHedgeAccounting(fxRevaluation, hedgeDesignation);
 * ```
 */
export function integrateHedgeAccounting(
  fxRevaluation: FXRevaluationResult,
  hedgeDesignation: HedgeDesignation
): HedgeAccountingIntegration {
  // Validate hedge designation
  if (!hedgeDesignation) {
    throw new Error('Hedge designation is required');
  }

  // Calculate hedge effectiveness
  const effectivenessRatio = calculateHedgeEffectiveness(fxRevaluation, hedgeDesignation);
  const isEffective = effectivenessRatio >= 0.8 && effectivenessRatio <= 1.25;

  // Calculate OCI reclassification
  const ociReclassification = calculateOCIReclassification(
    hedgeDesignation,
    fxRevaluation,
    effectivenessRatio
  );

  // Generate journal entries
  const journalEntries = generateHedgeAccountingJournalEntries(
    fxRevaluation,
    hedgeDesignation,
    effectivenessRatio,
    ociReclassification
  );

  return {
    integrationId: `hedge-integration-${hedgeDesignation.designationId}-${fxRevaluation.revaluationId}`,
    hedgeDesignation,
    fxRevaluation,
    effectivenessRatio,
    isEffective,
    ociReclassification,
    journalEntries
  };
}

/**
 * Calculate hedge effectiveness ratio
 * 
 * @param fxRevaluation - FX revaluation result
 * @param hedgeDesignation - Hedge designation
 * @returns Effectiveness ratio
 * 
 * @example
 * ```typescript
 * const ratio = calculateHedgeEffectiveness(fxRevaluation, hedgeDesignation);
 * ```
 */
export function calculateHedgeEffectiveness(
  fxRevaluation: FXRevaluationResult,
  hedgeDesignation: HedgeDesignation
): number {
  const hedgedItemExposure = hedgeDesignation.hedgedItem.exposureAmount;
  const hedgeInstrumentValue = hedgeDesignation.hedgeInstrument.fairValue;

  if (hedgedItemExposure === 0) {
    throw new Error('Hedged item exposure amount cannot be zero');
  }

  // Calculate effectiveness ratio (simplified calculation)
  const effectivenessRatio = Math.abs(hedgeInstrumentValue / hedgedItemExposure);
  
  // Apply rounding using existing utilities
  return roundToCurrency(effectivenessRatio, fxRevaluation.currency);
}

/**
 * Calculate OCI reclassification
 * 
 * @param hedgeDesignation - Hedge designation
 * @param fxRevaluation - FX revaluation result
 * @param effectivenessRatio - Hedge effectiveness ratio
 * @returns OCI reclassification
 * 
 * @example
 * ```typescript
 * const ociReclass = calculateOCIReclassification(hedgeDesignation, fxRevaluation, 0.95);
 * ```
 */
export function calculateOCIReclassification(
  hedgeDesignation: HedgeDesignation,
  fxRevaluation: FXRevaluationResult,
  effectivenessRatio: number
): OCIReclassification {
  // Determine reclassification reason based on effectiveness
  let reclassificationReason: ReclassificationReason;
  if (effectivenessRatio < 0.8 || effectivenessRatio > 1.25) {
    reclassificationReason = 'hedge_ineffective';
  } else {
    reclassificationReason = 'forecast_transaction_occurred';
  }

  // Calculate OCI amount (simplified calculation)
  const ociAmount = fxRevaluation.revaluationAmount * effectivenessRatio;

  // Generate journal entry for OCI reclassification
  const journalEntry = generateOCIReclassificationJournalEntry(
    hedgeDesignation,
    fxRevaluation,
    ociAmount,
    reclassificationReason
  );

  return {
    reclassificationId: `oci-reclass-${hedgeDesignation.designationId}-${Date.now()}`,
    hedgeDesignation,
    reclassificationDate: new Date(),
    ociAmount,
    currency: fxRevaluation.currency,
    reclassificationReason,
    journalEntry
  };
}

/**
 * Generate hedge accounting journal entries
 * 
 * @param fxRevaluation - FX revaluation result
 * @param hedgeDesignation - Hedge designation
 * @param effectivenessRatio - Hedge effectiveness ratio
 * @param ociReclassification - OCI reclassification
 * @returns Journal entries
 * 
 * @example
 * ```typescript
 * const entries = generateHedgeAccountingJournalEntries(fxRevaluation, hedgeDesignation, 0.95, ociReclass);
 * ```
 */
export function generateHedgeAccountingJournalEntries(
  fxRevaluation: FXRevaluationResult,
  hedgeDesignation: HedgeDesignation,
  effectivenessRatio: number,
  ociReclassification: OCIReclassification
): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  // Add OCI reclassification entry
  entries.push(ociReclassification.journalEntry);

  // Add hedge instrument fair value adjustment entry
  const hedgeInstrumentEntry = generateHedgeInstrumentJournalEntry(
    hedgeDesignation,
    fxRevaluation,
    effectivenessRatio
  );
  entries.push(hedgeInstrumentEntry);

  return entries;
}

// ============================================================================
// HELPER FUNCTIONS FOR HEDGE ACCOUNTING INTEGRATION
// ============================================================================

/**
 * Generate OCI reclassification journal entry
 * 
 * @param hedgeDesignation - Hedge designation
 * @param fxRevaluation - FX revaluation result
 * @param ociAmount - OCI amount
 * @param reason - Reclassification reason
 * @returns Journal entry
 */
function generateOCIReclassificationJournalEntry(
  hedgeDesignation: HedgeDesignation,
  fxRevaluation: FXRevaluationResult,
  ociAmount: number,
  reason: ReclassificationReason
): JournalEntry {
  const lines: JournalLine[] = [];

  if (ociAmount > 0) {
    lines.push({
      id: `oci-reclass-line-1-${hedgeDesignation.designationId}`,
      accountCode: 'OCI-HEDGE-RESERVE',
      description: `OCI reclassification: ${reason}`,
      debit: ociAmount,
      credit: 0,
      currency: fxRevaluation.currency
    });

    lines.push({
      id: `oci-reclass-line-2-${hedgeDesignation.designationId}`,
      accountCode: fxRevaluation.accountCode,
      description: `OCI reclassification offset`,
      debit: 0,
      credit: ociAmount,
      currency: fxRevaluation.currency
    });
  } else {
    lines.push({
      id: `oci-reclass-line-1-${hedgeDesignation.designationId}`,
      accountCode: fxRevaluation.accountCode,
      description: `OCI reclassification: ${reason}`,
      debit: Math.abs(ociAmount),
      credit: 0,
      currency: fxRevaluation.currency
    });

    lines.push({
      id: `oci-reclass-line-2-${hedgeDesignation.designationId}`,
      accountCode: 'OCI-HEDGE-RESERVE',
      description: `OCI reclassification offset`,
      debit: 0,
      credit: Math.abs(ociAmount),
      currency: fxRevaluation.currency
    });
  }

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: `oci-reclassification-entry-${hedgeDesignation.designationId}`,
    date: new Date(),
    reference: `OCI-${hedgeDesignation.designationId}`,
    description: `OCI reclassification: ${reason}`,
    lines,
    totalDebits,
    totalCredits,
    currency: fxRevaluation.currency,
    status: 'draft'
  };
}

/**
 * Generate hedge instrument journal entry
 * 
 * @param hedgeDesignation - Hedge designation
 * @param fxRevaluation - FX revaluation result
 * @param effectivenessRatio - Hedge effectiveness ratio
 * @returns Journal entry
 */
function generateHedgeInstrumentJournalEntry(
  hedgeDesignation: HedgeDesignation,
  fxRevaluation: FXRevaluationResult,
  effectivenessRatio: number
): JournalEntry {
  const lines: JournalLine[] = [];

  // Calculate hedge instrument adjustment
  const hedgeAdjustment = fxRevaluation.revaluationAmount * effectivenessRatio;

  if (hedgeAdjustment > 0) {
    lines.push({
      id: `hedge-instrument-line-1-${hedgeDesignation.designationId}`,
      accountCode: 'HEDGE-INSTRUMENT',
      description: `Hedge instrument fair value adjustment`,
      debit: hedgeAdjustment,
      credit: 0,
      currency: fxRevaluation.currency
    });

    lines.push({
      id: `hedge-instrument-line-2-${hedgeDesignation.designationId}`,
      accountCode: 'HEDGE-GAIN-LOSS',
      description: `Hedge instrument gain/loss`,
      debit: 0,
      credit: hedgeAdjustment,
      currency: fxRevaluation.currency
    });
  } else {
    lines.push({
      id: `hedge-instrument-line-1-${hedgeDesignation.designationId}`,
      accountCode: 'HEDGE-GAIN-LOSS',
      description: `Hedge instrument gain/loss`,
      debit: Math.abs(hedgeAdjustment),
      credit: 0,
      currency: fxRevaluation.currency
    });

    lines.push({
      id: `hedge-instrument-line-2-${hedgeDesignation.designationId}`,
      accountCode: 'HEDGE-INSTRUMENT',
      description: `Hedge instrument fair value adjustment`,
      debit: 0,
      credit: Math.abs(hedgeAdjustment),
      currency: fxRevaluation.currency
    });
  }

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: `hedge-instrument-entry-${hedgeDesignation.designationId}`,
    date: new Date(),
    reference: `HEDGE-${hedgeDesignation.designationId}`,
    description: `Hedge instrument fair value adjustment`,
    lines,
    totalDebits,
    totalCredits,
    currency: fxRevaluation.currency,
    status: 'draft'
  };
}
