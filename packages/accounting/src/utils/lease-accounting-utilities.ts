/**
 * Lease Accounting Utilities - Enterprise Production Ready
 * 
 * Comprehensive lease accounting utilities per MFRS 16 Leases
 * with ROU asset and lease liability calculations, interest splits, and remeasurement events.
 * 
 * Features:
 * - Right-of-use (ROU) asset calculations
 * - Lease liability amortization schedules
 * - Interest vs principal splits
 * - Lease remeasurement events
 * - Short-term and low-value lease exemptions
 * - Integration with existing accounting utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   calculateLeaseLiability,
 *   calculateROUAsset,
 *   generateLeaseSchedule,
 *   processRemeasurement
 * } from './lease-accounting-utilities';
 * 
 * // Calculate lease liability
 * const liability = calculateLeaseLiability(leasePayments, discountRate);
 * 
 * // Calculate ROU asset
 * const rouAsset = calculateROUAsset(liability, initialCosts);
 * ```
 */

import type { SupportedCurrency } from './accounting-utilities';
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
 * Lease contract details
 */
export interface LeaseContract {
  readonly contractId: string;
  readonly lesseeId: string;
  readonly lessorId: string;
  readonly leaseType: LeaseType;
  readonly leaseClassification: LeaseClassification;
  readonly commencementDate: Date;
  readonly leaseTerm: number; // in months
  readonly leasePayments: readonly LeasePayment[];
  readonly discountRate: number;
  readonly initialDirectCosts: number;
  readonly currency: SupportedCurrency;
  readonly contractDescription: string;
}

/**
 * Lease payment schedule
 */
export interface LeasePayment {
  readonly paymentId: string;
  readonly contractId: string;
  readonly paymentDate: Date;
  readonly paymentAmount: number;
  readonly paymentType: PaymentType;
  readonly currency: SupportedCurrency;
  readonly isVariable: boolean;
  readonly variablePaymentBasis?: VariablePaymentBasis;
}

/**
 * Lease liability calculation
 */
export interface LeaseLiability {
  readonly liabilityId: string;
  readonly contractId: string;
  readonly initialLiability: number;
  readonly currentLiability: number;
  readonly currency: SupportedCurrency;
  readonly calculationDate: Date;
  readonly discountRate: number;
  readonly amortizationSchedule: readonly LiabilityAmortization[];
}

/**
 * ROU asset calculation
 */
export interface ROUAsset {
  readonly assetId: string;
  readonly contractId: string;
  readonly initialAsset: number;
  readonly currentAsset: number;
  readonly accumulatedDepreciation: number;
  readonly currency: SupportedCurrency;
  readonly calculationDate: Date;
  readonly usefulLife: number;
  readonly depreciationSchedule: readonly AssetDepreciation[];
}

/**
 * Liability amortization entry
 */
export interface LiabilityAmortization {
  readonly amortizationId: string;
  readonly liabilityId: string;
  readonly periodDate: Date;
  readonly openingBalance: number;
  readonly interestExpense: number;
  readonly principalPayment: number;
  readonly closingBalance: number;
  readonly currency: SupportedCurrency;
}

/**
 * Asset depreciation entry
 */
export interface AssetDepreciation {
  readonly depreciationId: string;
  readonly assetId: string;
  readonly periodDate: Date;
  readonly openingBalance: number;
  readonly depreciationExpense: number;
  readonly closingBalance: number;
  readonly currency: SupportedCurrency;
}

/**
 * Lease remeasurement event
 */
export interface LeaseRemeasurement {
  readonly remeasurementId: string;
  readonly contractId: string;
  readonly remeasurementDate: Date;
  readonly remeasurementReason: RemeasurementReason;
  readonly oldLiability: number;
  readonly newLiability: number;
  readonly liabilityAdjustment: number;
  readonly oldROUAsset: number;
  readonly newROUAsset: number;
  readonly assetAdjustment: number;
  readonly currency: SupportedCurrency;
  readonly journalEntries: readonly JournalEntry[];
}

/**
 * Lease classification assessment
 */
export interface LeaseClassification {
  readonly classificationId: string;
  readonly contractId: string;
  readonly assessmentDate: Date;
  readonly classificationResult: LeaseClassificationResult;
  readonly assessmentCriteria: LeaseAssessmentCriteria;
  readonly isShortTermLease: boolean;
  readonly isLowValueLease: boolean;
  readonly exemptionReason?: LeaseExemptionReason;
}

/**
 * Lease assessment criteria
 */
export interface LeaseAssessmentCriteria {
  readonly transferOfOwnership: boolean;
  readonly purchaseOption: boolean;
  readonly purchaseOptionPrice?: number;
  readonly leaseTerm: number;
  readonly presentValueOfPayments: number;
  readonly fairValueOfAsset: number;
  readonly specializedAsset: boolean;
  readonly alternativeUse: boolean;
}

/**
 * Lease types
 */
export type LeaseType = 
  | 'operating_lease'
  | 'finance_lease'
  | 'short_term_lease'
  | 'low_value_lease';

/**
 * Payment types
 */
export type PaymentType = 
  | 'fixed_payment'
  | 'variable_payment'
  | 'incentive_payment'
  | 'penalty_payment'
  | 'residual_value_guarantee';

/**
 * Variable payment basis
 */
export type VariablePaymentBasis = 
  | 'sales_based'
  | 'usage_based'
  | 'inflation_linked'
  | 'market_rate_linked'
  | 'performance_based';

/**
 * Lease classification results
 */
export type LeaseClassificationResult = 
  | 'finance_lease'
  | 'operating_lease'
  | 'exempt_short_term'
  | 'exempt_low_value';

/**
 * Remeasurement reasons
 */
export type RemeasurementReason = 
  | 'lease_term_change'
  | 'discount_rate_change'
  | 'payment_amount_change'
  | 'contingent_rent_change'
  | 'residual_value_change'
  | 'purchase_option_change';

/**
 * Lease exemption reasons
 */
export type LeaseExemptionReason = 
  | 'short_term_lease'
  | 'low_value_asset'
  | 'immaterial_amount'
  | 'simplified_accounting';

// ============================================================================
// LEASE LIABILITY CALCULATIONS
// ============================================================================

/**
 * Calculate lease liability
 * 
 * @param leasePayments - Lease payment schedule
 * @param discountRate - Discount rate (annual)
 * @param commencementDate - Lease commencement date
 * @param currency - Currency
 * @returns Lease liability calculation
 * 
 * @example
 * ```typescript
 * const liability = calculateLeaseLiability(leasePayments, 0.05, new Date(), 'MYR');
 * ```
 */
export function calculateLeaseLiability(
  leasePayments: readonly LeasePayment[],
  discountRate: number,
  commencementDate: Date,
  currency: SupportedCurrency
): LeaseLiability {
  // Validate inputs
  if (discountRate < 0 || discountRate > 1) {
    throw new Error('Discount rate must be between 0 and 1');
  }

  // Calculate present value of lease payments
  const initialLiability = calculatePresentValue(leasePayments, discountRate, commencementDate);

  // Generate amortization schedule
  const liabilityId = `lease-liability-${ulid()}`;
  const amortizationSchedule = generateLiabilityAmortizationSchedule(
    leasePayments,
    initialLiability,
    discountRate,
    commencementDate,
    currency,
    liabilityId
  );

  // Calculate current liability
  const currentLiability = amortizationSchedule.length > 0 
    ? amortizationSchedule[amortizationSchedule.length - 1]!.closingBalance
    : initialLiability;

  return {
    liabilityId,
    contractId: leasePayments[0]?.contractId || 'unknown',
    initialLiability: roundToCurrency(initialLiability, currency),
    currentLiability: roundToCurrency(currentLiability, currency),
    currency,
    calculationDate: new Date(),
    discountRate,
    amortizationSchedule
  };
}

/**
 * Calculate ROU asset
 * 
 * @param leaseLiability - Lease liability
 * @param initialDirectCosts - Initial direct costs
 * @param currency - Currency
 * @returns ROU asset calculation
 * 
 * @example
 * ```typescript
 * const rouAsset = calculateROUAsset(leaseLiability, 5000, 'MYR');
 * ```
 */
export function calculateROUAsset(
  leaseLiability: LeaseLiability,
  initialDirectCosts: number,
  currency: SupportedCurrency
): ROUAsset {
  // Calculate initial ROU asset (simple form). See helper below for full MFRS16 composition.
  const initialAsset = leaseLiability.initialLiability + (initialDirectCosts ?? 0);

  // Generate depreciation schedule
  const depreciationSchedule = generateAssetDepreciationSchedule(
    initialAsset,
    leaseLiability.amortizationSchedule,
    currency
  );

  // Calculate current asset and accumulated depreciation
  const accumulatedDepreciation = depreciationSchedule.reduce(
    (sum, entry) => sum + entry.depreciationExpense,
    0
  );
  const currentAsset = initialAsset - accumulatedDepreciation;

  return {
    assetId: `rou-asset-${leaseLiability.liabilityId}`,
    contractId: leaseLiability.contractId,
    initialAsset: roundToCurrency(initialAsset, currency),
    currentAsset: roundToCurrency(currentAsset, currency),
    accumulatedDepreciation: roundToCurrency(accumulatedDepreciation, currency),
    currency,
    calculationDate: new Date(),
    usefulLife: leaseLiability.amortizationSchedule.length,
    depreciationSchedule
  };
}

/**
 * (Additive) Full MFRS16 initial ROU composition.
 * PV of lease payments ± prepayments/incentives + initial direct costs + restoration provision.
 */
export function calculateInitialROUCost(args: {
  pvOfLeasePayments: number;
  initialDirectCosts?: number;
  prepaidLeasePayments?: number;
  leaseIncentivesReceived?: number; // subtract
  restorationProvision?: number;
}): number {
  const {
    pvOfLeasePayments,
    initialDirectCosts = 0,
    prepaidLeasePayments = 0,
    leaseIncentivesReceived = 0,
    restorationProvision = 0,
  } = args;
  return pvOfLeasePayments
    + initialDirectCosts
    + prepaidLeasePayments
    - leaseIncentivesReceived
    + restorationProvision;
}

// ============================================================================
// LEASE CLASSIFICATION
// ============================================================================

/**
 * Classify lease contract
 * 
 * @param contract - Lease contract
 * @param assessmentCriteria - Assessment criteria
 * @returns Lease classification
 * 
 * @example
 * ```typescript
 * const classification = classifyLease(contract, assessmentCriteria);
 * ```
 */
export function classifyLease(
  contract: LeaseContract,
  assessmentCriteria: LeaseAssessmentCriteria
): LeaseClassification {
  // Check for exemptions first
  if (assessmentCriteria.leaseTerm <= 12) {
    return {
      classificationId: `classification-${contract.contractId}`,
      contractId: contract.contractId,
      assessmentDate: new Date(),
      classificationResult: 'exempt_short_term',
      assessmentCriteria,
      isShortTermLease: true,
      isLowValueLease: false,
      exemptionReason: 'short_term_lease'
    };
  }

  // Check for low value lease (policy threshold; keep configurable externally)
  const lowValueThreshold = 5000; // MYR 5,000 default
  if (assessmentCriteria.presentValueOfPayments <= lowValueThreshold) {
    return {
      classificationId: `classification-${contract.contractId}`,
      contractId: contract.contractId,
      assessmentDate: new Date(),
      classificationResult: 'exempt_low_value',
      assessmentCriteria,
      isShortTermLease: false,
      isLowValueLease: true,
      exemptionReason: 'low_value_asset'
    };
  }

  /**
   * Under MFRS/IFRS 16, **lessees** do not classify leases as finance/operating
   * (except for short-term / low-value exemptions). Most leases recognize ROU+liability.
   * We retain the result below only for compatibility / lessor workflows.
   */
  const isFinanceLease = assessFinanceLeaseCriteria(assessmentCriteria);

  return {
    classificationId: `classification-${contract.contractId}`,
    contractId: contract.contractId,
    assessmentDate: new Date(),
    classificationResult: isFinanceLease ? 'finance_lease' : 'operating_lease',
    assessmentCriteria,
    isShortTermLease: false,
    isLowValueLease: false
  };
}

// ============================================================================
// LEASE REMEASUREMENT
// ============================================================================

/**
 * Process lease remeasurement
 * 
 * @param contract - Lease contract
 * @param oldLiability - Old lease liability
 * @param oldROUAsset - Old ROU asset
 * @param remeasurementReason - Reason for remeasurement
 * @param adjustmentAmount - Adjustment amount
 * @returns Lease remeasurement
 * 
 * @example
 * ```typescript
 * const remeasurement = processRemeasurement(contract, oldLiability, oldROUAsset, 'lease_term_change', 10000);
 * ```
 */
export function processRemeasurement(
  contract: LeaseContract,
  oldLiability: LeaseLiability,
  oldROUAsset: ROUAsset,
  remeasurementReason: RemeasurementReason,
  adjustmentAmount: number
): LeaseRemeasurement {
  // Calculate new liability and asset values
  const newLiability = oldLiability.currentLiability + adjustmentAmount;
  let assetAdjustment = adjustmentAmount;
  let pnlImpact = 0;
  // If adjustment reduces liability below ROU carrying amount, the ROU absorbs it.
  // If reduction would drive ROU below zero, excess hits P&L (MFRS16.39-46).
  if (adjustmentAmount < 0 && Math.abs(adjustmentAmount) > oldROUAsset.currentAsset) {
    pnlImpact = Math.abs(adjustmentAmount) - oldROUAsset.currentAsset;
    assetAdjustment = -oldROUAsset.currentAsset; // zero out asset; rest to P&L
  }
  const newROUAsset = oldROUAsset.currentAsset + assetAdjustment;

  // Generate journal entries for remeasurement
  const journalEntries = generateRemeasurementJournalEntries(contract, assetAdjustment, remeasurementReason, pnlImpact);

  return {
    remeasurementId: `remeasurement-${contract.contractId}-${Date.now()}`,
    contractId: contract.contractId,
    remeasurementDate: new Date(),
    remeasurementReason,
    oldLiability: oldLiability.currentLiability,
    newLiability: roundToCurrency(newLiability, contract.currency),
    liabilityAdjustment: roundToCurrency(adjustmentAmount, contract.currency),
    oldROUAsset: oldROUAsset.currentAsset,
    newROUAsset: roundToCurrency(newROUAsset, contract.currency),
    assetAdjustment: roundToCurrency(assetAdjustment, contract.currency),
    currency: contract.currency,
    journalEntries
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate present value of lease payments
 * 
 * @param leasePayments - Lease payments
 * @param discountRate - Discount rate
 * @param commencementDate - Commencement date
 * @returns Present value
 */
function calculatePresentValue(
  leasePayments: readonly LeasePayment[],
  discountRate: number,
  commencementDate: Date
): number {
  let pv = 0;
  const r = Math.pow(1 + discountRate, 1 / 12) - 1; // effective monthly rate
  for (const p of leasePayments) {
    if (p.isVariable) continue; // exclude variable payments not index/rate-based at commencement
    const m = monthsBetween(commencementDate, p.paymentDate);
    const df = Math.pow(1 + r, -m);
    const amt = p.paymentAmount;
    pv += amt * df;
  }
  return pv;
}

/**
 * Generate liability amortization schedule
 * 
 * @param leasePayments - Lease payments
 * @param initialLiability - Initial liability
 * @param discountRate - Discount rate
 * @param commencementDate - Commencement date
 * @param currency - Currency
 * @returns Amortization schedule
 */
function generateLiabilityAmortizationSchedule(
  leasePayments: readonly LeasePayment[],
  initialLiability: number,
  discountRate: number,
  _commencementDate: Date,
  currency: SupportedCurrency,
  liabilityId: string
): readonly LiabilityAmortization[] {
  const schedule: LiabilityAmortization[] = [];
  let currentBalance = initialLiability;
  const monthlyRate = Math.pow(1 + discountRate, 1 / 12) - 1;

  // Sort payments by date
  const sortedPayments = [...leasePayments].sort((a, b) => 
    a.paymentDate.getTime() - b.paymentDate.getTime()
  );

  for (const payment of sortedPayments) {
    if (payment.isVariable) continue; // Skip variable payments

    const interestExpense = currentBalance * monthlyRate;
    const principalPayment = Math.min(payment.paymentAmount - interestExpense, currentBalance);
    const closingBalance = currentBalance - principalPayment;

    schedule.push({
      amortizationId: `amortization-${payment.paymentId}`,
      liabilityId,
      periodDate: payment.paymentDate,
      openingBalance: roundToCurrency(currentBalance, currency),
      interestExpense: roundToCurrency(interestExpense, currency),
      principalPayment: roundToCurrency(principalPayment, currency),
      closingBalance: roundToCurrency(closingBalance, currency),
      currency
    });

    currentBalance = closingBalance;
  }

  return schedule;
}

/**
 * Generate asset depreciation schedule
 * 
 * @param initialAsset - Initial asset value
 * @param amortizationSchedule - Liability amortization schedule
 * @param currency - Currency
 * @returns Depreciation schedule
 */
function generateAssetDepreciationSchedule(
  initialAsset: number,
  amortizationSchedule: readonly LiabilityAmortization[],
  currency: SupportedCurrency
): readonly AssetDepreciation[] {
  const schedule: AssetDepreciation[] = [];
  const totalPeriods = amortizationSchedule.length;
  const monthlyDepreciation = initialAsset / totalPeriods;

  for (let i = 0; i < totalPeriods; i++) {
    const amortization = amortizationSchedule[i]!;
    const openingBalance = i === 0 ? initialAsset : schedule[i - 1]!.closingBalance;
    const closingBalance = openingBalance - monthlyDepreciation;

    schedule.push({
      depreciationId: `depreciation-${amortization.amortizationId}`,
      assetId: `rou-asset-${amortization.liabilityId}`,
      periodDate: amortization.periodDate,
      openingBalance: roundToCurrency(openingBalance, currency),
      depreciationExpense: roundToCurrency(monthlyDepreciation, currency),
      closingBalance: roundToCurrency(closingBalance, currency),
      currency
    });
  }

  return schedule;
}

/**
 * Assess finance lease criteria
 * 
 * @param criteria - Assessment criteria
 * @returns True if finance lease
 */
function assessFinanceLeaseCriteria(criteria: LeaseAssessmentCriteria): boolean {
  // MFRS 16 finance lease criteria
  if (criteria.transferOfOwnership) return true;
  if (criteria.purchaseOption && criteria.purchaseOptionPrice) return true;
  
  // Lease term covers major part of asset's economic life
  const economicLifeCoverage = criteria.leaseTerm / (criteria.leaseTerm + 12); // heuristic only
  if (economicLifeCoverage >= 0.75) return true;
  
  // Present value covers substantially all of fair value
  const pvCoverage = criteria.presentValueOfPayments / criteria.fairValueOfAsset;
  if (pvCoverage >= 0.9) return true;
  
  // Specialized asset with no alternative use
  if (criteria.specializedAsset && !criteria.alternativeUse) return true;

  return false;
}

/**
 * Generate remeasurement journal entries
 * 
 * @param contract - Lease contract
 * @param adjustmentAmount - Adjustment amount
 * @param reason - Remeasurement reason
 * @returns Journal entries
 */
function generateRemeasurementJournalEntries(
  contract: LeaseContract,
  assetAdjustment: number,
  reason: RemeasurementReason,
  pnlImpact = 0
): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  if (assetAdjustment > 0) {
    // Increase in liability and asset
    const entry: JournalEntry = {
      id: `lease-remeasurement-${contract.contractId}-${Date.now()}`,
      date: new Date(),
      reference: `LR-${contract.contractId}`,
      description: `Lease remeasurement: ${reason}`,
      lines: [
        {
          id: `remeasurement-liability-${contract.contractId}`,
          accountCode: 'LEASE-LIABILITY',
          description: `Lease liability adjustment: ${reason}`,
          debit: 0,
          credit: assetAdjustment,
          currency: contract.currency
        },
        {
          id: `remeasurement-asset-${contract.contractId}`,
          accountCode: 'ROU-ASSET',
          description: `ROU asset adjustment: ${reason}`,
          debit: assetAdjustment,
          credit: 0,
          currency: contract.currency
        }
      ],
      totalDebits: assetAdjustment,
      totalCredits: assetAdjustment,
      currency: contract.currency,
      status: 'draft'
    };

    entries.push(entry);
  } else {
    // Decrease in liability and asset (and possibly P&L if excess)
    const baseAbs = Math.abs(assetAdjustment);
    const lines = [
      {
        id: `remeasurement-liability-${contract.contractId}`,
        accountCode: 'LEASE-LIABILITY',
        description: `Lease liability adjustment: ${reason}`,
        debit: baseAbs + pnlImpact,
        credit: 0,
        currency: contract.currency
      },
      {
        id: `remeasurement-asset-${contract.contractId}`,
        accountCode: 'ROU-ASSET',
        description: `ROU asset adjustment: ${reason}`,
        debit: 0,
        credit: baseAbs,
        currency: contract.currency
      }
    ] as const;
    if (pnlImpact > 0) {
      // Excess reduction to P&L
      (lines as unknown).push({
        id: `remeasurement-pnl-${contract.contractId}`,
        accountCode: 'P&L-LEASE-REMEASUREMENT',
        description: `Excess lease remeasurement to P&L: ${reason}`,
        debit: 0,
        credit: pnlImpact,
        currency: contract.currency
      });
    }
    const entry: JournalEntry = {
      id: `lease-remeasurement-${contract.contractId}-${Date.now()}`,
      date: new Date(),
      reference: `LR-${contract.contractId}`,
      description: `Lease remeasurement: ${reason}`,
      lines: lines as unknown as JournalEntry['lines'],
      totalDebits: baseAbs + pnlImpact,
      totalCredits: baseAbs + pnlImpact,
      currency: contract.currency,
      status: 'draft'
    };

    entries.push(entry);
  }

  return entries;
}

// --- Local date helpers ---
function monthsBetween(a: Date, b: Date): number {
  const asY = a.getUTCFullYear(), asM = a.getUTCMonth();
  const bsY = b.getUTCFullYear(), bsM = b.getUTCMonth();
  let m = (bsY - asY) * 12 + (bsM - asM);
  // If payment day precedes commencement day within the month, back up one month
  if (b.getUTCDate() < a.getUTCDate()) m -= 1;
  return Math.max(0, m);
}

// Simple ULID-like function for stable IDs
function ulid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${random}`;
}
