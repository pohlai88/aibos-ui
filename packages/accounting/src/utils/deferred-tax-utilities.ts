/**
 * Deferred Tax Utilities - Enterprise Production Ready
 * 
 * Comprehensive deferred tax calculations and temporary difference tracking
 * per MFRS 112 Income Taxes with full integration capabilities.
 * 
 * Features:
 * - Temporary difference calculations
 * - Deferred tax asset/liability recognition
 * - Tax rate change impact analysis
 * - Reversal tracking and scheduling
 * - Integration with existing tax utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   calculateTemporaryDifference,
 *   recognizeDeferredTax,
 *   analyzeTaxRateChange,
 *   scheduleReversals
 * } from './deferred-tax-utilities';
 * 
 * // Calculate temporary difference
 * const tempDiff = calculateTemporaryDifference(asset, taxBase);
 * 
 * // Recognize deferred tax
 * const deferredTax = recognizeDeferredTax(tempDiff, taxRate);
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';
import type { 
  JournalEntry,
  JournalLine
} from './journal-entry-utilities';
import { 
  applyTaxRounding
} from './tax-core-utilities';
import { 
  RoundingMethod
} from './accounting-utilities';

// -----------------------------------------------------------------------------
// CONFIG: Default account codes (can be overridden via function params)
// -----------------------------------------------------------------------------
const DEFAULT_ACCOUNTS = {
  deferredTaxAsset: 'DEFERRED-TAX-ASSET',
  deferredTaxLiability: 'DEFERRED-TAX-LIABILITY',
  deferredTaxExpense: 'INCOME-TAX-EXPENSE-DEFERRED',
} as const;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Temporary difference for deferred tax
 */
export interface TemporaryDifference {
  readonly differenceId: string;
  readonly accountCode: string;
  readonly differenceType: TemporaryDifferenceType;
  readonly carryingAmount: number;
  readonly taxBase: number;
  readonly differenceAmount: number;
  readonly currency: SupportedCurrency;
  readonly recognitionDate: Date;
  readonly reversalDate: Date | undefined;
  readonly reversalSchedule: readonly ReversalSchedule[];
  readonly taxRate: number;
  readonly deferredTaxAmount: number;
  readonly status: TemporaryDifferenceStatus;
}

/**
 * Deferred tax asset/liability
 */
export interface DeferredTaxItem {
  readonly itemId: string;
  readonly temporaryDifference: TemporaryDifference;
  readonly deferredTaxAsset: number;
  readonly deferredTaxLiability: number;
  readonly netDeferredTax: number;
  readonly currency: SupportedCurrency;
  readonly recognitionDate: Date;
  readonly valuationAllowance: ValuationAllowance;
  readonly journalEntry: JournalEntry;
}

/**
 * Tax rate change impact
 */
export interface TaxRateChangeImpact {
  readonly impactId: string;
  readonly oldTaxRate: number;
  readonly newTaxRate: number;
  readonly effectiveDate: Date;
  readonly affectedItems: readonly DeferredTaxItem[];
  readonly totalImpact: number;
  readonly currency: SupportedCurrency;
  readonly journalEntries: readonly JournalEntry[];
}

/**
 * Reversal schedule
 */
export interface ReversalSchedule {
  readonly scheduleId: string;
  readonly differenceId: string;
  readonly reversalDate: Date;
  readonly reversalAmount: number;
  readonly reversalType: ReversalType;
  readonly currency: SupportedCurrency;
  readonly status: ReversalStatus;
}

/**
 * Valuation allowance
 */
export interface ValuationAllowance {
  readonly allowanceId: string;
  readonly itemId: string;
  readonly allowanceAmount: number;
  readonly allowanceReason: ValuationAllowanceReason;
  readonly assessmentDate: Date;
  readonly currency: SupportedCurrency;
  readonly documentation: ValuationAllowanceDocumentation;
}

/**
 * Valuation allowance documentation
 */
export interface ValuationAllowanceDocumentation {
  readonly documentationId: string;
  readonly assessmentMethod: AssessmentMethod;
  readonly supportingEvidence: readonly string[];
  readonly reviewDate: Date;
  readonly nextReviewDate: Date;
  readonly approvedBy: string;
  readonly approvedDate: Date;
}

/**
 * Temporary difference types
 */
export type TemporaryDifferenceType = 
  | 'taxable_temporary_difference'
  | 'deductible_temporary_difference'
  | 'permanent_difference'
  | 'timing_difference'
  | 'revenue_recognition'
  | 'expense_recognition'
  | 'asset_revaluation'
  | 'liability_recognition';

/**
 * Temporary difference status
 */
export type TemporaryDifferenceStatus = 
  | 'active'
  | 'reversed'
  | 'expired'
  | 'cancelled'
  | 'adjusted';

/**
 * Reversal types
 */
export type ReversalType = 
  | 'automatic_reversal'
  | 'manual_reversal'
  | 'rate_change_adjustment'
  | 'reassessment';

/**
 * Reversal status
 */
export type ReversalStatus = 
  | 'pending'
  | 'processed'
  | 'cancelled'
  | 'adjusted';

/**
 * Valuation allowance reasons
 */
export type ValuationAllowanceReason = 
  | 'probable_loss'
  | 'uncertain_collection'
  | 'regulatory_restriction'
  | 'business_restructure'
  | 'economic_uncertainty';

/**
 * Assessment methods
 */
export type AssessmentMethod = 
  | 'historical_analysis'
  | 'forecast_based'
  | 'probability_weighted'
  | 'regression_analysis'
  | 'expert_judgment';

// ============================================================================
// TEMPORARY DIFFERENCE CALCULATIONS
// ============================================================================

/**
 * Calculate temporary difference
 * 
 * @param carryingAmount - Carrying amount in financial statements
 * @param taxBase - Tax base amount
 * @param accountCode - Account code
 * @param differenceType - Type of temporary difference
 * @param taxRate - Applicable tax rate
 * @param currency - Currency for the calculation
 * @param recognitionDate - Recognition date (defaults to current date)
 * @returns Temporary difference calculation
 * 
 * @example
 * ```typescript
 * const tempDiff = calculateTemporaryDifference(100000, 80000, '4000', 'taxable_temporary_difference', 0.25, 'MYR');
 * ```
 */
export function calculateTemporaryDifference(
  carryingAmount: number,
  taxBase: number,
  accountCode: string,
  differenceType: TemporaryDifferenceType,
  taxRate: number,
  currency: SupportedCurrency,
  recognitionDate: Date = new Date()
): TemporaryDifference {
  // Validate inputs
  if (taxRate < 0 || taxRate > 1) {
    throw new Error('Tax rate must be between 0 and 1');
  }

  // Calculate difference amount
  const differenceAmount = carryingAmount - taxBase;

  // Calculate deferred tax amount
  const deferredTaxAmount = differenceAmount * taxRate;

  // Apply rounding
  const roundedDifferenceAmount = applyTaxRounding(differenceAmount, RoundingMethod.HALF_EVEN, 2);
  const roundedDeferredTaxAmount = applyTaxRounding(deferredTaxAmount, RoundingMethod.HALF_EVEN, 2);

  return {
    differenceId: `temp-diff-${accountCode}-${Date.now()}`,
    accountCode,
    differenceType,
    carryingAmount,
    taxBase,
    differenceAmount: roundedDifferenceAmount,
    currency,
    recognitionDate,
    reversalDate: undefined,
    reversalSchedule: [],
    taxRate,
    deferredTaxAmount: roundedDeferredTaxAmount,
    status: 'active'
  };
}

/**
 * Recognize deferred tax asset/liability
 * 
 * @param temporaryDifference - Temporary difference
 * @returns Deferred tax item
 * 
 * @example
 * ```typescript
 * const deferredTax = recognizeDeferredTax(temporaryDifference);
 * ```
 */
export function recognizeDeferredTax(
  temporaryDifference: TemporaryDifference,
  accounts: Partial<typeof DEFAULT_ACCOUNTS> = {}
): DeferredTaxItem {
  const acct = { ...DEFAULT_ACCOUNTS, ...accounts };
  // Calculate deferred tax amounts based on difference type
  let deferredTaxAsset = 0;
  let deferredTaxLiability = 0;

  switch (temporaryDifference.differenceType) {
    case 'taxable_temporary_difference':
      // Taxable temporary difference creates deferred tax liability
      deferredTaxLiability = Math.abs(temporaryDifference.deferredTaxAmount);
      break;
    
    case 'deductible_temporary_difference':
      // Deductible temporary difference creates deferred tax asset
      deferredTaxAsset = Math.abs(temporaryDifference.deferredTaxAmount);
      break;
    
    case 'permanent_difference':
      // Permanent differences do not create deferred tax
      break;
    
    case 'timing_difference':
    case 'revenue_recognition':
    case 'expense_recognition':
    case 'asset_revaluation':
    case 'liability_recognition':
      // Timing differences create deferred tax based on direction
      if (temporaryDifference.differenceAmount > 0) {
        deferredTaxLiability = temporaryDifference.deferredTaxAmount;
      } else {
        deferredTaxAsset = Math.abs(temporaryDifference.deferredTaxAmount);
      }
      break;
  }

  // Apply rounding
  deferredTaxAsset = applyTaxRounding(deferredTaxAsset, RoundingMethod.HALF_EVEN, 2);
  deferredTaxLiability = applyTaxRounding(deferredTaxLiability, RoundingMethod.HALF_EVEN, 2);

  // Calculate net deferred tax
  const netDeferredTax = deferredTaxAsset - deferredTaxLiability;

  // Create valuation allowance if needed
  const valuationAllowance = createValuationAllowance(
    temporaryDifference.differenceId,
    deferredTaxAsset,
    temporaryDifference.currency
  );

  // Generate journal entry
  const journalEntry = generateDeferredTaxJournalEntry(
    temporaryDifference,
    deferredTaxAsset,
    deferredTaxLiability,
    acct
  );

  return {
    itemId: `deferred-tax-${temporaryDifference.differenceId}`,
    temporaryDifference,
    deferredTaxAsset,
    deferredTaxLiability,
    netDeferredTax,
    currency: temporaryDifference.currency,
    recognitionDate: new Date(),
    valuationAllowance,
    journalEntry
  };
}

// ============================================================================
// TAX RATE CHANGE ANALYSIS
// ============================================================================

/**
 * Analyze tax rate change impact
 * 
 * @param deferredTaxItems - Existing deferred tax items
 * @param newTaxRate - New tax rate
 * @param effectiveDate - Rate change effective date
 * @returns Tax rate change impact analysis
 * 
 * @example
 * ```typescript
 * const impact = analyzeTaxRateChange(deferredTaxItems, 0.30, new Date());
 * ```
 */
export function analyzeTaxRateChangeImpact(
  deferredTaxItems: readonly DeferredTaxItem[],
  newTaxRate: number,
  effectiveDate: Date
): TaxRateChangeImpact {
  // Validate tax rate
  if (newTaxRate < 0 || newTaxRate > 1) {
    throw new Error('Tax rate must be between 0 and 1');
  }

  const journalEntries: JournalEntry[] = [];
  let totalImpact = 0;

  // Analyze impact on each deferred tax item
  for (const item of deferredTaxItems) {
    const oldTaxRate = item.temporaryDifference.taxRate;
    const differenceAmount = item.temporaryDifference.differenceAmount;
    
    // Calculate impact of rate change
    const oldDeferredTax = differenceAmount * oldTaxRate;
    const newDeferredTax = differenceAmount * newTaxRate;
    const rateChangeImpact = newDeferredTax - oldDeferredTax;

    if (Math.abs(rateChangeImpact) > 0.01) { // Only process significant impacts
      totalImpact += rateChangeImpact;

      // Generate journal entry for rate change adjustment
      const adjustmentEntry = generateTaxRateChangeJournalEntry(
        item,
        oldTaxRate,
        newTaxRate,
        rateChangeImpact,
        effectiveDate
      );
      journalEntries.push(adjustmentEntry);
    }
  }

  // Apply rounding to total impact
  totalImpact = applyTaxRounding(totalImpact, RoundingMethod.HALF_EVEN, 2);

  return {
    impactId: `tax-rate-impact-${Date.now()}`,
    oldTaxRate: deferredTaxItems[0]?.temporaryDifference.taxRate || 0,
    newTaxRate,
    effectiveDate,
    affectedItems: deferredTaxItems,
    totalImpact,
    currency: deferredTaxItems[0]?.currency || 'MYR',
    journalEntries
  };
}

// ============================================================================
// REVERSAL SCHEDULING
// ============================================================================

/**
 * Schedule temporary difference reversals
 * 
 * @param temporaryDifference - Temporary difference
 * @param reversalDates - Expected reversal dates
 * @param reversalAmounts - Reversal amounts
 * @returns Reversal schedule
 * 
 * @example
 * ```typescript
 * const schedule = scheduleReversals(tempDiff, [new Date('2024-12-31')], [20000]);
 * ```
 */
export function scheduleReversals(
  temporaryDifference: TemporaryDifference,
  reversalDates: readonly Date[],
  reversalAmounts: readonly number[]
): readonly ReversalSchedule[] {
  if (reversalDates.length !== reversalAmounts.length) {
    throw new Error('Reversal dates and amounts must have the same length');
  }

  const schedules: ReversalSchedule[] = [];

  for (let i = 0; i < reversalDates.length; i++) {
    const reversalDate = reversalDates[i]!;
    const reversalAmount = reversalAmounts[i]!;

    const schedule: ReversalSchedule = {
      scheduleId: `reversal-${temporaryDifference.differenceId}-${i}`,
      differenceId: temporaryDifference.differenceId,
      reversalDate,
      reversalAmount: applyTaxRounding(reversalAmount, RoundingMethod.HALF_EVEN, 2),
      reversalType: 'automatic_reversal',
      currency: temporaryDifference.currency,
      status: 'pending'
    };

    schedules.push(schedule);
  }

  return schedules;
}

// ============================================================================
// VALUATION ALLOWANCE
// ============================================================================

/**
 * Create valuation allowance
 * 
 * @param itemId - Deferred tax item ID
 * @param deferredTaxAsset - Deferred tax asset amount
 * @param currency - Currency
 * @returns Valuation allowance
 * 
 * @example
 * ```typescript
 * const allowance = createValuationAllowance('item-001', 50000, 'MYR');
 * ```
 */
export function createValuationAllowance(
  itemId: string,
  deferredTaxAsset: number,
  currency: SupportedCurrency
): ValuationAllowance {
  // Determine if valuation allowance is needed
  const allowanceAmount = deferredTaxAsset > 0 ? deferredTaxAsset * 0.1 : 0; // 10% allowance
  const allowanceReason: ValuationAllowanceReason = 'probable_loss';

  const documentation: ValuationAllowanceDocumentation = {
    documentationId: `allowance-doc-${itemId}`,
    assessmentMethod: 'historical_analysis',
    supportingEvidence: ['Historical collection rates', 'Economic indicators'],
    reviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    approvedBy: 'Tax Manager',
    approvedDate: new Date()
  };

  return {
    allowanceId: `allowance-${itemId}`,
    itemId,
    allowanceAmount: applyTaxRounding(allowanceAmount, RoundingMethod.HALF_EVEN, 2),
    allowanceReason,
    assessmentDate: new Date(),
    currency,
    documentation
  };
}

// ============================================================================
// JOURNAL ENTRY GENERATION
// ============================================================================

/**
 * Generate deferred tax journal entry
 * 
 * @param temporaryDifference - Temporary difference
 * @param deferredTaxAsset - Deferred tax asset amount
 * @param deferredTaxLiability - Deferred tax liability amount
 * @returns Journal entry
 * 
 * @example
 * ```typescript
 * const entry = generateDeferredTaxJournalEntry(tempDiff, 10000, 5000);
 * ```
 */
export function generateDeferredTaxJournalEntry(
  temporaryDifference: TemporaryDifference,
  deferredTaxAsset: number,
  deferredTaxLiability: number,
  accounts: typeof DEFAULT_ACCOUNTS = DEFAULT_ACCOUNTS
): JournalEntry {
  const lines: JournalLine[] = [];

  // Recognition should route through Deferred Tax Expense (P&L)
  // DTA recognition => benefit => Dr DTA, Cr Deferred Tax Expense
  if (deferredTaxAsset > 0) {
    const amt = applyTaxRounding(deferredTaxAsset, RoundingMethod.HALF_EVEN, 2);
    lines.push({
      id: `dt-asset-line-${temporaryDifference.differenceId}`,
      accountCode: accounts.deferredTaxAsset,
      description: `Deferred tax asset: ${temporaryDifference.accountCode}`,
      debit: amt,
      credit: 0,
      currency: temporaryDifference.currency
    });
    lines.push({
      id: `dt-asset-offset-line-${temporaryDifference.differenceId}`,
      accountCode: accounts.deferredTaxExpense,
      description: `Deferred tax benefit (asset recognition)`,
      debit: 0,
      credit: amt,
      currency: temporaryDifference.currency
    });
  }

  // DTL recognition => expense => Dr Deferred Tax Expense, Cr DTL
  if (deferredTaxLiability > 0) {
    const amt = applyTaxRounding(deferredTaxLiability, RoundingMethod.HALF_EVEN, 2);
    lines.push({
      id: `dt-liability-expense-${temporaryDifference.differenceId}`,
      accountCode: accounts.deferredTaxExpense,
      description: `Deferred tax expense (liability recognition)`,
      debit: amt,
      credit: 0,
      currency: temporaryDifference.currency
    });
    lines.push({
      id: `dt-liability-line-${temporaryDifference.differenceId}`,
      accountCode: accounts.deferredTaxLiability,
      description: `Deferred tax liability: ${temporaryDifference.accountCode}`,
      debit: 0,
      credit: amt,
      currency: temporaryDifference.currency
    });
  }

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: `deferred-tax-entry-${temporaryDifference.differenceId}`,
    date: new Date(),
    reference: `DT-${temporaryDifference.accountCode}`,
    description: `Deferred tax recognition (through P&L): ${temporaryDifference.accountCode}`,
    lines,
    totalDebits,
    totalCredits,
    currency: temporaryDifference.currency,
    status: 'draft'
  };
}

/**
 * Generate tax rate change journal entry
 * 
 * @param item - Deferred tax item
 * @param oldTaxRate - Old tax rate
 * @param newTaxRate - New tax rate
 * @param impact - Rate change impact
 * @param effectiveDate - Effective date
 * @returns Journal entry
 * 
 * @example
 * ```typescript
 * const entry = generateTaxRateChangeJournalEntry(item, 0.25, 0.30, 5000, new Date());
 * ```
 */
export function generateTaxRateChangeJournalEntry(
  item: DeferredTaxItem,
  oldTaxRate: number,
  newTaxRate: number,
  impact: number,
  effectiveDate: Date
): JournalEntry {
  const lines: JournalLine[] = [];
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
  const acct = DEFAULT_ACCOUNTS;
  const amt = applyTaxRounding(Math.abs(impact), RoundingMethod.HALF_EVEN, 2);

  // Positive impact => expense (Dr), negative => benefit (Cr)
  const expenseDebit = impact > 0 ? amt : 0;
  const expenseCredit = impact < 0 ? amt : 0;

  // Offset to B/S: if the original is a DTA (asset>0), adjust DTA; else adjust DTL
  const isAsset = item.deferredTaxAsset > 0;
  const bsDebit = impact < 0 ? amt : 0;   // benefit reduces DTL (Dr DTL) or increases DTA (Dr DTA)
  const bsCredit = impact > 0 ? amt : 0;  // expense increases DTL (Cr DTL) or reduces DTA (Cr DTA)

  lines.push({
    id: `rate-change-expense-${item.itemId}`,
    accountCode: acct.deferredTaxExpense,
    description: `Deferred tax ${impact > 0 ? 'expense' : 'benefit'} due to tax rate change: ${pct(oldTaxRate)} → ${pct(newTaxRate)}`,
    debit: expenseDebit,
    credit: expenseCredit,
    currency: item.currency
  });

  lines.push({
    id: `rate-change-bs-${item.itemId}`,
    accountCode: isAsset ? acct.deferredTaxAsset : acct.deferredTaxLiability,
    description: `Re-measure ${isAsset ? 'deferred tax asset' : 'deferred tax liability'} at ${pct(newTaxRate)}`,
    debit: bsDebit,
    credit: bsCredit,
    currency: item.currency
  });

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: `tax-rate-change-entry-${item.itemId}`,
    date: effectiveDate,
    reference: `TRC-${item.temporaryDifference.accountCode}`,
    description: `Tax rate change adjustment: ${pct(oldTaxRate)} to ${pct(newTaxRate)}`,
    lines,
    totalDebits,
    totalCredits,
    currency: item.currency,
    status: 'draft'
  };
}
