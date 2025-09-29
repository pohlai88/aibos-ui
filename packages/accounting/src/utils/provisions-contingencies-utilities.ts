/**
 * Provisions & Contingencies Utilities - Enterprise Production Ready
 * 
 * Comprehensive provisions and contingencies utilities per MFRS 137
 * Provisions, Contingent Liabilities and Contingent Assets with recognition,
 * measurement, and unwind calculations.
 * 
 * Features:
 * - Provision recognition and measurement
 * - Contingent liability assessment
 * - Contingent asset recognition
 * - Discount unwind calculations
 * - Provision reversal handling
 * - Integration with existing accounting utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   recognizeProvision,
 *   measureProvision,
 *   unwindDiscount,
 *   assessContingency
 * } from './provisions-contingencies-utilities';
 * 
 * // Recognize provision
 * const provision = recognizeProvision(obligation, bestEstimate);
 * 
 * // Unwind discount
 * const unwind = unwindDiscount(provision, discountRate);
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';
import type { 
  JournalEntry
} from './journal-entry-utilities';
import { 
  roundToCurrency
} from './accounting-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Provision details
 */
export interface Provision {
  readonly provisionId: string;
  readonly provisionType: ProvisionType;
  readonly obligation: Obligation;
  readonly bestEstimate: number;
  readonly currency: SupportedCurrency;
  readonly recognitionDate: Date;
  readonly expectedSettlementDate: Date;
  readonly discountRate: number;
  readonly presentValue: number;
  readonly status: ProvisionStatus;
  readonly unwindSchedule: readonly DiscountUnwind[];
}

/**
 * Obligation details
 */
export interface Obligation {
  readonly obligationId: string;
  readonly obligationType: ObligationType;
  readonly description: string;
  readonly legalObligation: boolean;
  readonly constructiveObligation: boolean;
  readonly pastEvent: boolean;
  readonly probableOutflow: boolean;
  readonly reliableEstimate: boolean;
  readonly currency: SupportedCurrency;
  readonly obligationDate: Date;
}

/**
 * Contingent liability
 */
export interface ContingentLiability {
  readonly contingentId: string;
  readonly description: string;
  readonly probability: ProbabilityLevel;
  readonly possibleOutflow: number;
  readonly currency: SupportedCurrency;
  readonly assessmentDate: Date;
  readonly disclosureRequired: boolean;
  readonly recognitionRequired: boolean;
}

/**
 * Contingent asset
 */
export interface ContingentAsset {
  readonly contingentId: string;
  readonly description: string;
  readonly probability: ProbabilityLevel;
  readonly possibleInflow: number;
  readonly currency: SupportedCurrency;
  readonly assessmentDate: Date;
  readonly disclosureRequired: boolean;
  readonly recognitionRequired: boolean;
}

/**
 * Discount unwind entry
 */
export interface DiscountUnwind {
  readonly unwindId: string;
  readonly provisionId: string;
  readonly unwindDate: Date;
  readonly openingPresentValue: number;
  readonly discountUnwind: number;
  readonly closingPresentValue: number;
  readonly currency: SupportedCurrency;
  readonly journalEntry: JournalEntry;
}

/**
 * Provision reversal
 */
export interface ProvisionReversal {
  readonly reversalId: string;
  readonly provisionId: string;
  readonly reversalDate: Date;
  readonly reversalReason: ReversalReason;
  readonly reversalAmount: number;
  readonly currency: SupportedCurrency;
  readonly journalEntry: JournalEntry;
}

/**
 * Provision types
 */
export type ProvisionType = 
  | 'warranty_provision'
  | 'restructuring_provision'
  | 'environmental_provision'
  | 'legal_provision'
  | 'onerous_contract_provision'
  | 'decommissioning_provision'
  | 'employee_benefit_provision'
  | 'other_provision';

/**
 * Obligation types
 */
export type ObligationType = 
  | 'legal_obligation'
  | 'constructive_obligation'
  | 'implied_obligation'
  | 'contractual_obligation'
  | 'regulatory_obligation';

/**
 * Provision status
 */
export type ProvisionStatus = 
  | 'recognized'
  | 'reversed'
  | 'settled'
  | 'adjusted'
  | 'expired';

/**
 * Probability levels
 */
export type ProbabilityLevel = 
  | 'virtually_certain'
  | 'probable'
  | 'possible'
  | 'remote';

/**
 * Reversal reasons
 */
export type ReversalReason = 
  | 'obligation_no_longer_exists'
  | 'best_estimate_reduced'
  | 'settlement_completed'
  | 'time_expired'
  | 'circumstances_changed';

// ============================================================================
// PROVISION RECOGNITION & MEASUREMENT
// ============================================================================

/**
 * Recognize provision
 * 
 * @param obligation - Obligation details
 * @param bestEstimate - Best estimate of outflow
 * @param expectedSettlementDate - Expected settlement date
 * @param discountRate - Discount rate
 * @returns Provision
 * 
 * @example
 * ```typescript
 * const provision = recognizeProvision(obligation, 100000, new Date('2025-12-31'), 0.05);
 * ```
 */
export function recognizeProvision(
  obligation: Obligation,
  bestEstimate: number,
  expectedSettlementDate: Date,
  discountRate: number
): Provision {
  // Validate obligation criteria (MFRS 137 recognition tests)
  validateObligationCriteria(obligation);
  validateProvisionInputs({
    amount: bestEstimate,
    settlementDate: expectedSettlementDate,
    recognitionDate: obligation.obligationDate ?? new Date(),
    discountRate,
  });

  // Calculate present value (pre-tax rate, recognition→settlement)
  const presentValue = calculatePresentValue(
    bestEstimate,
    expectedSettlementDate,
    discountRate,
    obligation.obligationDate ?? new Date()
  );

  // Generate discount unwind schedule
  const unwindSchedule = generateDiscountUnwindSchedule(
    obligation.obligationId,
    presentValue,
    expectedSettlementDate,
    discountRate,
    obligation.currency
  );

  return {
    provisionId: `provision-${obligation.obligationId}-${Date.now()}`,
    provisionType: determineProvisionType(obligation),
    obligation,
    bestEstimate: roundToCurrency(bestEstimate, obligation.currency),
    currency: obligation.currency,
    recognitionDate: new Date(),
    expectedSettlementDate,
    discountRate,
    presentValue: roundToCurrency(presentValue, obligation.currency),
    status: 'recognized',
    unwindSchedule
  };
}

/**
 * Measure provision
 * 
 * @param provision - Existing provision
 * @param newBestEstimate - New best estimate
 * @param newSettlementDate - New settlement date
 * @param newDiscountRate - New discount rate
 * @returns Updated provision
 * 
 * @example
 * ```typescript
 * const updatedProvision = measureProvision(provision, 120000, new Date('2026-12-31'), 0.06);
 * ```
 */
export function measureProvision(
  provision: Provision,
  newBestEstimate: number,
  newSettlementDate: Date,
  newDiscountRate: number
): Provision {
  validateProvisionInputs({
    amount: newBestEstimate,
    settlementDate: newSettlementDate,
    recognitionDate: provision.recognitionDate ?? new Date(),
    discountRate: newDiscountRate,
  });

  // Calculate new present value
  const newPresentValue = calculatePresentValue(
    newBestEstimate,
    newSettlementDate,
    newDiscountRate,
    provision.recognitionDate ?? new Date()
  );

  // Generate new unwind schedule
  const newUnwindSchedule = generateDiscountUnwindSchedule(
    provision.provisionId,
    newPresentValue,
    newSettlementDate,
    newDiscountRate,
    provision.currency
  );

  return {
    ...provision,
    bestEstimate: roundToCurrency(newBestEstimate, provision.currency),
    expectedSettlementDate: newSettlementDate,
    discountRate: newDiscountRate,
    presentValue: roundToCurrency(newPresentValue, provision.currency),
    unwindSchedule: newUnwindSchedule
  };
}

// ============================================================================
// DISCOUNT UNWIND CALCULATIONS
// ============================================================================

/**
 * Unwind discount for provision
 * 
 * @param provision - Provision
 * @param unwindDate - Unwind date
 * @returns Discount unwind entry
 * 
 * @example
 * ```typescript
 * const unwind = unwindDiscount(provision, new Date());
 * ```
 */
export function unwindDiscount(
  provision: Provision,
  unwindDate: Date
): DiscountUnwind {
  // Find the appropriate unwind period
  const currentUnwind = provision.unwindSchedule.find(
    entry => entry.unwindDate.getTime() === unwindDate.getTime()
  );

  if (!currentUnwind) {
    throw new Error(`No unwind schedule found for date: ${unwindDate.toISOString()}`);
  }

  return currentUnwind;
}

// ============================================================================
// CONTINGENCY ASSESSMENT
// ============================================================================

/**
 * Assess contingent liability
 * 
 * @param description - Contingency description
 * @param possibleOutflow - Possible outflow amount
 * @param probability - Probability level
 * @param currency - Currency
 * @returns Contingent liability assessment
 * 
 * @example
 * ```typescript
 * const contingent = assessContingentLiability('Legal claim', 50000, 'possible', 'MYR');
 * ```
 */
export function assessContingentLiability(
  description: string,
  possibleOutflow: number,
  probability: ProbabilityLevel,
  currency: SupportedCurrency
): ContingentLiability {
  // MFRS 137: Contingent liabilities are NOT recognized.
  // Disclose if probable or possible; no disclosure if remote (subject to specific exceptions not handled here).
  const disclosureRequired = probability === 'probable' || probability === 'possible';
  const recognitionRequired = false;

  return {
    contingentId: `contingent-liability-${Date.now()}`,
    description,
    probability,
    possibleOutflow: roundToCurrency(possibleOutflow, currency),
    currency,
    assessmentDate: new Date(),
    disclosureRequired,
    recognitionRequired
  };
}

/**
 * Assess contingent asset
 * 
 * @param description - Contingency description
 * @param possibleInflow - Possible inflow amount
 * @param probability - Probability level
 * @param currency - Currency
 * @returns Contingent asset assessment
 * 
 * @example
 * ```typescript
 * const contingent = assessContingentAsset('Insurance claim', 30000, 'probable', 'MYR');
 * ```
 */
export function assessContingentAsset(
  description: string,
  possibleInflow: number,
  probability: ProbabilityLevel,
  currency: SupportedCurrency
): ContingentAsset {
  // MFRS 137: Contingent assets are recognized ONLY when inflow is virtually certain.
  // Disclose when probable; do not disclose when merely possible; remote -> no disclosure.
  const recognitionRequired = probability === 'virtually_certain';
  const disclosureRequired = probability === 'probable';

  return {
    contingentId: `contingent-asset-${Date.now()}`,
    description,
    probability,
    possibleInflow: roundToCurrency(possibleInflow, currency),
    currency,
    assessmentDate: new Date(),
    disclosureRequired,
    recognitionRequired
  };
}

// ============================================================================
// PROVISION REVERSAL
// ============================================================================

/**
 * Reverse provision
 * 
 * @param provision - Provision to reverse
 * @param reversalReason - Reason for reversal
 * @param reversalAmount - Amount to reverse
 * @returns Provision reversal
 * 
 * @example
 * ```typescript
 * const reversal = reverseProvision(provision, 'obligation_no_longer_exists', 50000);
 * ```
 */
export function reverseProvision(
  provision: Provision,
  reversalReason: ReversalReason,
  reversalAmount: number
): ProvisionReversal {
  // Generate journal entry for reversal
  const journalEntry = generateReversalJournalEntry(
    provision,
    reversalAmount,
    reversalReason
  );

  return {
    reversalId: `reversal-${provision.provisionId}-${Date.now()}`,
    provisionId: provision.provisionId,
    reversalDate: new Date(),
    reversalReason,
    reversalAmount: roundToCurrency(reversalAmount, provision.currency),
    currency: provision.currency,
    journalEntry
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate obligation criteria
 * 
 * @param obligation - Obligation to validate
 */
function validateObligationCriteria(obligation: Obligation): void {
  if (!obligation.pastEvent) {
    throw new Error('Past event criterion not met');
  }

  if (!obligation.probableOutflow) {
    throw new Error('Probable outflow criterion not met');
  }

  if (!obligation.reliableEstimate) {
    throw new Error('Reliable estimate criterion not met');
  }

  if (!obligation.legalObligation && !obligation.constructiveObligation) {
    throw new Error('Legal or constructive obligation criterion not met');
  }
}

/**
 * Calculate present value
 * 
 * @param amount - Amount to discount
 * @param settlementDate - Settlement date
 * @param discountRate - Discount rate
 * @param recognitionDate - Recognition date (anchor)
 * @returns Present value
 */
function calculatePresentValue(
  amount: number,
  settlementDate: Date,
  discountRate: number,
  recognitionDate: Date
): number {
  const msInYear = 365.25 * 24 * 60 * 60 * 1000;
  const yearsToSettlement = (settlementDate.getTime() - recognitionDate.getTime()) / msInYear;
  const discountFactor = Math.pow(1 + discountRate, -yearsToSettlement);
  return amount * discountFactor;
}

/**
 * Determine provision type
 * 
 * @param obligation - Obligation
 * @returns Provision type
 */
function determineProvisionType(obligation: Obligation): ProvisionType {
  // Simplified logic - in practice, this would be more sophisticated
  if (obligation.description.toLowerCase().includes('warranty')) {
    return 'warranty_provision';
  }
  if (obligation.description.toLowerCase().includes('restructuring')) {
    return 'restructuring_provision';
  }
  if (obligation.description.toLowerCase().includes('environmental')) {
    return 'environmental_provision';
  }
  if (obligation.description.toLowerCase().includes('legal')) {
    return 'legal_provision';
  }
  
  return 'other_provision';
}

/**
 * Generate discount unwind schedule
 * 
 * @param provisionId - Provision ID
 * @param presentValue - Present value
 * @param settlementDate - Settlement date
 * @param discountRate - Discount rate
 * @param currency - Currency
 * @returns Discount unwind schedule
 */
function generateDiscountUnwindSchedule(
  provisionId: string,
  presentValue: number,
  settlementDate: Date,
  discountRate: number,
  currency: SupportedCurrency
): readonly DiscountUnwind[] {
  const schedule: DiscountUnwind[] = [];
  const start = new Date(); // assumes schedule is generated at recognition; could be parameterized
  const monthsToSettlement = Math.max(1, monthsBetween(start, settlementDate));
  let currentPresentValue = presentValue;
  const monthlyDiscountRate = discountRate / 12;

  for (let month = 1; month <= monthsToSettlement; month++) {
    const unwindDate = addMonths(start, month);
    const discountUnwind = currentPresentValue * monthlyDiscountRate;
    const closingPresentValue = currentPresentValue + discountUnwind;

    // Generate journal entry for unwind
    const journalEntry = generateUnwindJournalEntry(
      provisionId,
      discountUnwind,
      unwindDate,
      currency
    );

    schedule.push({
      unwindId: `unwind-${provisionId}-${month}`,
      provisionId,
      unwindDate,
      openingPresentValue: roundToCurrency(currentPresentValue, currency),
      discountUnwind: roundToCurrency(discountUnwind, currency),
      closingPresentValue: roundToCurrency(closingPresentValue, currency),
      currency,
      journalEntry
    });

    currentPresentValue = closingPresentValue;
  }

  return schedule;
}

/**
 * Generate unwind journal entry
 * 
 * @param provisionId - Provision ID
 * @param discountUnwind - Discount unwind amount
 * @param unwindDate - Unwind date
 * @param currency - Currency
 * @returns Journal entry
 */
function generateUnwindJournalEntry(
  provisionId: string,
  discountUnwind: number,
  unwindDate: Date,
  currency: SupportedCurrency
): JournalEntry {
  return {
    id: `unwind-entry-${provisionId}-${unwindDate.getTime()}`,
    date: unwindDate,
    reference: `UNWIND-${provisionId}`,
    description: `Discount unwind: ${provisionId}`,
    lines: [
      {
        id: `unwind-finance-cost-${provisionId}`,
        accountCode: 'FINANCE-COST',
        description: 'Discount unwind - finance cost',
        debit: discountUnwind,
        credit: 0,
        currency
      },
      {
        id: `unwind-provision-${provisionId}`,
        accountCode: 'PROVISION',
        description: 'Discount unwind - provision',
        debit: 0,
        credit: discountUnwind,
        currency
      }
    ],
    totalDebits: discountUnwind,
    totalCredits: discountUnwind,
    currency,
    status: 'draft'
  };
}

/**
 * Generate reversal journal entry
 * 
 * @param provision - Provision
 * @param reversalAmount - Reversal amount
 * @param reason - Reversal reason
 * @returns Journal entry
 */
function generateReversalJournalEntry(
  provision: Provision,
  reversalAmount: number,
  reason: ReversalReason
): JournalEntry {
  return {
    id: `reversal-entry-${provision.provisionId}-${Date.now()}`,
    date: new Date(),
    reference: `REVERSAL-${provision.provisionId}`,
    description: `Provision reversal: ${reason}`,
    lines: [
      {
        id: `reversal-provision-${provision.provisionId}`,
        accountCode: 'PROVISION',
        description: `Provision reversal: ${reason}`,
        debit: reversalAmount,
        credit: 0,
        currency: provision.currency
      },
      {
        id: `reversal-income-${provision.provisionId}`,
        accountCode: 'OTHER-INCOME',
        description: `Provision reversal income: ${reason}`,
        debit: 0,
        credit: reversalAmount,
        currency: provision.currency
      }
    ],
    totalDebits: reversalAmount,
    totalCredits: reversalAmount,
    currency: provision.currency,
    status: 'draft'
  };
}

/**
 * Additional numeric/date validations for provisions.
 */
function validateProvisionInputs(args: {
  amount: number;
  settlementDate: Date;
  recognitionDate: Date;
  discountRate: number;
}): void {
  const { amount, settlementDate, recognitionDate, discountRate } = args;
  if (!(settlementDate instanceof Date) || isNaN(settlementDate.getTime())) {
    throw new Error('Invalid settlement date');
  }
  if (!(recognitionDate instanceof Date) || isNaN(recognitionDate.getTime())) {
    throw new Error('Invalid recognition date');
  }
  if (settlementDate.getTime() <= recognitionDate.getTime()) {
    throw new Error('Settlement date must be after recognition date');
  }
  if (!isFinite(amount) || amount < 0) {
    throw new Error('Amount must be a non-negative finite number');
  }
  if (!isFinite(discountRate) || discountRate < 0) {
    throw new Error('Discount rate must be a non-negative finite number');
  }
}

// --- small date helpers (no external deps) ---
function addMonths(d: Date, months: number): Date {
  const dt = new Date(d.getTime());
  const day = dt.getDate();
  dt.setMonth(dt.getMonth() + months);
  // handle month-end rollover (e.g., Jan 31 -> Feb)
  if (dt.getDate() < day) dt.setDate(0);
  return dt;
}

function monthsBetween(a: Date, b: Date): number {
  const from = new Date(a.getFullYear(), a.getMonth(), 1);
  const to = new Date(b.getFullYear(), b.getMonth(), 1);
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (addMonths(from, months).getTime() < to.getTime()) months += 1;
  return Math.max(0, months);
}

// ============================================================================ 
// ADDITIONAL EXPORTED HELPERS (RECOGNITION & RE-MEASUREMENT JOURNALS)
// ============================================================================ 

/**
 * Generate initial recognition journal entry for a provision
 * DR Expense / CR Provision (liability).
 * Caller can override default account codes.
 */
export function generateProvisionRecognitionJournalEntry(
  provision: Provision,
  opts?: { expenseAccountCode?: string; provisionAccountCode?: string }
): JournalEntry {
  const expense = opts?.expenseAccountCode ?? 'PROVISION-EXPENSE';
  const provisionAcct = opts?.provisionAccountCode ?? 'PROVISION';
  const amt = provision.presentValue;
  return {
    id: `recognition-entry-${provision.provisionId}`,
    date: provision.recognitionDate,
    reference: `RECOG-${provision.provisionId}`,
    description: `Provision recognition (${provision.provisionType})`,
    lines: [
      { id: `rec-exp-${provision.provisionId}`, accountCode: expense, description: 'Provision expense', debit: amt, credit: 0, currency: provision.currency },
      { id: `rec-prov-${provision.provisionId}`, accountCode: provisionAcct, description: 'Provision liability', debit: 0, credit: amt, currency: provision.currency },
    ],
    totalDebits: amt,
    totalCredits: amt,
    currency: provision.currency,
    status: 'draft',
  };
}

/**
 * Generate re-measurement journal entry for a provision delta (excluding unwind).
 * Positive delta => DR Expense / CR Provision, negative => DR Provision / CR Income.
 */
export function generateProvisionRemeasurementJournalEntry(
  oldPV: number,
  newPV: number,
  currency: SupportedCurrency,
  provisionId: string,
  opts?: { expenseAccountCode?: string; incomeAccountCode?: string; provisionAccountCode?: string }
): JournalEntry | null {
  const delta = roundToCurrency(newPV - oldPV, currency);
  if (delta === 0) return null;
  const expense = opts?.expenseAccountCode ?? 'PROVISION-EXPENSE';
  const income = opts?.incomeAccountCode ?? 'OTHER-INCOME';
  const provisionAcct = opts?.provisionAccountCode ?? 'PROVISION';
  const isIncrease = delta > 0;
  const abs = Math.abs(delta);
  return {
    id: `remeasure-entry-${provisionId}-${Date.now()}`,
    date: new Date(),
    reference: `REMEAS-${provisionId}`,
    description: 'Provision re-measurement',
    lines: isIncrease
      ? [
          { id: `remeas-exp-${provisionId}`, accountCode: expense, description: 'Provision re-measurement expense', debit: abs, credit: 0, currency },
          { id: `remeas-prov-${provisionId}`, accountCode: provisionAcct, description: 'Provision liability increase', debit: 0, credit: abs, currency },
        ]
      : [
          { id: `remeas-prov-${provisionId}`, accountCode: provisionAcct, description: 'Provision liability decrease', debit: abs, credit: 0, currency },
          { id: `remeas-inc-${provisionId}`, accountCode: income, description: 'Provision re-measurement income', debit: 0, credit: abs, currency },
        ],
    totalDebits: abs,
    totalCredits: abs,
    currency,
    status: 'draft',
  };
}
