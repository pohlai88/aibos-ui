/**
 * Ownership Changes Utilities - Enterprise Production Ready
 * 
 * Comprehensive utilities for ownership changes, NCI calculations,
 * step-acquisitions, and goodwill remeasurements per MFRS 10.
 * 
 * Features:
 * - Non-Controlling Interest (NCI) calculations
 * - Step-acquisition and disposal processing
 * - Goodwill and NCI remeasurements
 * - Partial acquisition/disposal handling
 * - Integration with consolidation utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   calculateNCI,
 *   processStepAcquisition,
 *   remeasureGoodwill,
 *   calculateOwnershipChange
 * } from './ownership-changes-utilities';
 * 
 * // Calculate NCI
 * const nci = calculateNCI(subsidiary, ownershipPercentage);
 * 
 * // Process step acquisition
 * const stepResult = processStepAcquisition(acquisition, existingOwnership);
 * ```
 */

import type { SupportedCurrency } from './accounting-utilities';
import { roundToCurrency } from './money-helpers-utilities';
import type { 
  JournalEntry,
  JournalLine
} from './journal-entry-utilities';
import type { 
  ConsolidationEntity
} from './consolidation-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Ownership change transaction
 */
export interface OwnershipChange {
  readonly changeId: string;
  readonly entityId: string;
  readonly parentId: string;
  readonly changeType: OwnershipChangeType;
  readonly transactionDate: Date;
  readonly previousOwnership: number;
  readonly newOwnership: number;
  readonly changeAmount: number;
  readonly currency: SupportedCurrency;
  readonly consideration: ConsiderationDetails;
  readonly goodwill: GoodwillCalculation;
  readonly nci: NCICalculation;
}

/**
 * Non-Controlling Interest calculation
 */
export interface NCICalculation {
  readonly nciId: string;
  readonly entityId: string;
  readonly ownershipPercentage: number;
  readonly netAssets: number;
  readonly nciAmount: number;
  readonly currency: SupportedCurrency;
  readonly calculationDate: Date;
  readonly fairValueAdjustments: readonly FairValueAdjustment[];
}

/**
 * Step acquisition details
 */
export interface StepAcquisition {
  readonly acquisitionId: string;
  readonly entityId: string;
  readonly parentId: string;
  readonly acquisitionDate: Date;
  readonly previousOwnership: number;
  readonly additionalOwnership: number;
  readonly totalOwnership: number;
  readonly consideration: ConsiderationDetails;
  readonly fairValue: FairValueAssessment;
  readonly goodwill: GoodwillCalculation;
  readonly nci: NCICalculation;
}

/**
 * Goodwill calculation
 */
export interface GoodwillCalculation {
  readonly goodwillId: string;
  readonly entityId: string;
  readonly parentId: string;
  readonly consideration: number; // consideration for the acquisition step
  readonly fairValueOfNetAssets: number; // FV of identifiable net assets at acquisition date
  readonly ownershipPercentage: number; // acquirer ownership % after the transaction (0..1)
  readonly nciMeasurement: 'fair_value' | 'proportionate';
  readonly nciFairValue?: number; // required if nciMeasurement = 'fair_value'
  readonly previouslyHeldInterestFairValue?: number; // FV of PHE at acquisition date (if step acquisition)
  readonly goodwillAmount: number;
  readonly currency: SupportedCurrency;
  readonly calculationDate: Date;
  readonly goodwillType: GoodwillType;
}

/**
 * Consideration details
 */
export interface ConsiderationDetails {
  readonly cashConsideration: number;
  readonly shareConsideration: number;
  readonly debtConsideration: number;
  readonly otherConsideration: number;
  readonly totalConsideration: number;
  readonly currency: SupportedCurrency;
  readonly fairValueAdjustments: readonly FairValueAdjustment[];
}

/**
 * Fair value assessment
 */
export interface FairValueAssessment {
  readonly assessmentId: string;
  readonly entityId: string;
  readonly assessmentDate: Date;
  readonly netAssets: number;
  readonly identifiableAssets: readonly IdentifiableAsset[];
  readonly identifiableLiabilities: readonly IdentifiableLiability[];
  readonly fairValueOfNetAssets: number;
  readonly currency: SupportedCurrency;
}

/**
 * Fair value adjustment
 */
export interface FairValueAdjustment {
  readonly adjustmentId: string;
  readonly assetLiabilityId: string;
  readonly carryingAmount: number;
  readonly fairValue: number;
  readonly adjustmentAmount: number;
  readonly adjustmentType: FairValueAdjustmentType;
  readonly currency: SupportedCurrency;
}

/**
 * Identifiable asset
 */
export interface IdentifiableAsset {
  readonly assetId: string;
  readonly assetType: AssetType;
  readonly carryingAmount: number;
  readonly fairValue: number;
  readonly usefulLife?: number;
  readonly currency: SupportedCurrency;
}

/**
 * Identifiable liability
 */
export interface IdentifiableLiability {
  readonly liabilityId: string;
  readonly liabilityType: LiabilityType;
  readonly carryingAmount: number;
  readonly fairValue: number;
  readonly currency: SupportedCurrency;
}

/**
 * Ownership change types
 */
export type OwnershipChangeType = 
  | 'step_acquisition'
  | 'partial_disposal'
  | 'full_disposal'
  | 'additional_investment'
  | 'dilution'
  | 'consolidation';

/**
 * Goodwill types
 */
export type GoodwillType = 
  | 'positive_goodwill'
  | 'negative_goodwill'
  | 'bargain_purchase';

/**
 * Fair value adjustment types
 */
export type FairValueAdjustmentType = 
  | 'asset_revaluation'
  | 'liability_revaluation'
  | 'intangible_asset'
  | 'contingent_liability'
  | 'deferred_tax';

/**
 * Asset types
 */
export type AssetType = 
  | 'tangible_asset'
  | 'intangible_asset'
  | 'financial_asset'
  | 'inventory'
  | 'receivable'
  | 'cash';

/**
 * Liability types
 */
export type LiabilityType = 
  | 'financial_liability'
  | 'provision'
  | 'deferred_tax_liability'
  | 'payable'
  | 'contingent_liability';

// ============================================================================
// NCI CALCULATIONS
// ============================================================================

/**
 * Calculate Non-Controlling Interest
 * 
 * @param entity - Consolidation entity
 * @param ownershipPercentage - Parent ownership percentage
 * @param netAssets - Net assets of subsidiary
 * @param fairValueAdjustments - Fair value adjustments
 * @returns NCI calculation
 * 
 * @example
 * ```typescript
 * const nci = calculateNCI(entity, 0.8, 1000000, fairValueAdjustments);
 * ```
 */
export function calculateNCI(
  entity: ConsolidationEntity,
  ownershipPercentage: number,
  netAssets: number,
  fairValueAdjustments: readonly FairValueAdjustment[]
): NCICalculation {
  // Validate ownership percentage
  if (ownershipPercentage < 0 || ownershipPercentage > 1) {
    throw new Error('Ownership percentage must be between 0 and 1');
  }

  // Calculate NCI percentage
  const nciPercentage = 1 - ownershipPercentage;

  // Apply fair value adjustments to net assets
  const adjustedNetAssets = netAssets + fairValueAdjustments.reduce(
    (sum, adjustment) => sum + adjustment.adjustmentAmount,
    0
  );

  // Calculate NCI amount
  const nciAmount = roundToCurrency(adjustedNetAssets * nciPercentage, entity.currency);

  return {
    nciId: `nci-${entity.id}-${Date.now()}`,
    entityId: entity.id,
    ownershipPercentage: nciPercentage,
    netAssets: adjustedNetAssets,
    nciAmount,
    currency: entity.currency,
    calculationDate: new Date(),
    fairValueAdjustments
  };
}

/**
 * Calculate ownership change impact
 * 
 * @param previousOwnership - Previous ownership percentage
 * @param newOwnership - New ownership percentage
 * @param netAssets - Net assets of entity
 * @param consideration - Consideration paid/received
 * @returns Ownership change calculation
 * 
 * @example
 * ```typescript
 * const change = calculateOwnershipChange(0.6, 0.8, 1000000, consideration);
 * ```
 */
export function calculateOwnershipChange(
  previousOwnership: number,
  newOwnership: number,
  netAssets: number,
  consideration: ConsiderationDetails
): OwnershipChange {
  // Validate ownership percentages
  if (previousOwnership < 0 || previousOwnership > 1) {
    throw new Error('Previous ownership percentage must be between 0 and 1');
  }
  if (newOwnership < 0 || newOwnership > 1) {
    throw new Error('New ownership percentage must be between 0 and 1');
  }

  const changeAmount = newOwnership - previousOwnership;
  const changeType = determineOwnershipChangeType(previousOwnership, newOwnership);

  // Default goodwill calc: only when control is obtained on this transaction
  const goodwill = calculateGoodwill({
    consideration: consideration.totalConsideration,
    fairValueOfNetAssets: netAssets,
    ownershipPercentage: newOwnership,
    nciMeasurement: 'proportionate',
    currency: consideration.currency
  });

  // Calculate NCI
  const nci = calculateNCI(
    { id: 'entity', name: 'Entity', type: 'subsidiary', ownership: { entity: 'parent', percentage: newOwnership * 100, effectiveDate: new Date(), status: 'active' }, currency: 'MYR', reportingCurrency: 'MYR', consolidationMethod: 'full_consolidation', status: 'active', createdAt: new Date(), updatedAt: new Date() } as unknown as ConsolidationEntity,
    newOwnership,
    netAssets,
    consideration.fairValueAdjustments
  );

  return {
    changeId: `ownership-change-${Date.now()}`,
    entityId: 'entity',
    parentId: 'parent',
    changeType,
    transactionDate: new Date(),
    previousOwnership,
    newOwnership,
    changeAmount,
    currency: consideration.currency,
    consideration,
    goodwill,
    nci
  };
}

// ============================================================================
// STEP ACQUISITIONS
// ============================================================================

/**
 * Process step acquisition
 * 
 * @param acquisition - Step acquisition details
 * @param existingOwnership - Existing ownership percentage
 * @returns Step acquisition result
 * 
 * @example
 * ```typescript
 * const result = processStepAcquisition(acquisition, 0.3);
 * ```
 */
export function processStepAcquisition(
  acquisition: StepAcquisition,
  existingOwnership: number
): StepAcquisition {
  // Validate existing ownership
  if (existingOwnership < 0 || existingOwnership > 1) {
    throw new Error('Existing ownership percentage must be between 0 and 1');
  }

  // Calculate total ownership after step acquisition
  const totalOwnership = existingOwnership + acquisition.additionalOwnership;

  if (totalOwnership > 1) {
    throw new Error('Total ownership cannot exceed 100%');
  }

  // If crossing to control on this step, remeasure PHE and compute goodwill using MFRS 3
  const pheRemeasurement = remeasurePreviouslyHeldInterest({
    previousOwnership: existingOwnership,
    totalOwnership,
    previouslyHeldInterestCarryingAmount: 0, // caller can thread carrying amount; 0 as safe default
    previouslyHeldInterestFairValue: acquisition.fairValue.fairValueOfNetAssets * existingOwnership,
    currency: acquisition.consideration.currency
  });

  const goodwillParams: Parameters<typeof calculateGoodwill>[0] = {
    consideration: acquisition.consideration.totalConsideration,
    fairValueOfNetAssets: acquisition.fairValue.fairValueOfNetAssets,
    ownershipPercentage: totalOwnership,
    nciMeasurement: 'proportionate',
    currency: acquisition.consideration.currency
  };
  
  if (pheRemeasurement?.previouslyHeldInterestFairValue) {
    goodwillParams.previouslyHeldInterestFairValue = pheRemeasurement.previouslyHeldInterestFairValue;
  }
  
  const goodwill = calculateGoodwill(goodwillParams);

  // Calculate NCI after step acquisition
  const nci = calculateNCI(
    { id: acquisition.entityId, name: 'Entity', type: 'subsidiary', ownership: { entity: acquisition.parentId, percentage: totalOwnership * 100, effectiveDate: new Date(), status: 'active' }, currency: acquisition.consideration.currency, reportingCurrency: acquisition.consideration.currency, consolidationMethod: 'full_consolidation', status: 'active', createdAt: new Date(), updatedAt: new Date() } as unknown as ConsolidationEntity,
    totalOwnership,
    acquisition.fairValue.fairValueOfNetAssets,
    acquisition.consideration.fairValueAdjustments
  );

  return {
    ...acquisition,
    previousOwnership: existingOwnership,
    totalOwnership,
    goodwill,
    nci
  };
}

// ============================================================================
// GOODWILL CALCULATIONS
// ============================================================================

/**
 * Calculate goodwill
 * 
 * @param consideration - Total consideration paid
 * @param netAssets - Fair value of net assets
 * @param ownershipPercentage - Ownership percentage
 * @param changeType - Type of ownership change
 * @returns Goodwill calculation
 * 
 * @example
 * ```typescript
 * const goodwill = calculateGoodwill(1000000, 800000, 0.8, 'step_acquisition');
 * ```
 */
export function calculateGoodwill(
  params:
    | {
        consideration: number;
        fairValueOfNetAssets: number;
        ownershipPercentage: number; // acquirer % after transaction (0..1)
        nciMeasurement: 'fair_value';
        nciFairValue: number;
        previouslyHeldInterestFairValue?: number;
        currency: SupportedCurrency;
      }
    | {
        consideration: number;
        fairValueOfNetAssets: number;
        ownershipPercentage: number;
        nciMeasurement: 'proportionate';
        nciFairValue?: number;
        previouslyHeldInterestFairValue?: number;
        currency: SupportedCurrency;
      }
): GoodwillCalculation {
  const {
    consideration,
    fairValueOfNetAssets,
    ownershipPercentage,
    nciMeasurement,
    currency
  } = params as unknown;

  const pheFV = 'previouslyHeldInterestFairValue' in params && params.previouslyHeldInterestFairValue
    ? params.previouslyHeldInterestFairValue!
    : 0;

  const nciFV =
    nciMeasurement === 'fair_value'
      ? (params as unknown).nciFairValue
      : fairValueOfNetAssets * (1 - ownershipPercentage);

  const rawGoodwill =
    consideration +
    (pheFV || 0) +
    nciFV -
    fairValueOfNetAssets;

  const goodwillAmount = roundToCurrency(rawGoodwill, currency);
  const goodwillType: GoodwillType =
    goodwillAmount > 0 ? 'positive_goodwill' : goodwillAmount < 0 ? 'bargain_purchase' : 'negative_goodwill';
  // Note: per MFRS 3, a bargain purchase results in a gain in P/L, not negative goodwill on the balance sheet.

  return {
    goodwillId: `goodwill-${Date.now()}`,
    entityId: 'entity',
    parentId: 'parent',
    consideration,
    fairValueOfNetAssets,
    ownershipPercentage,
    nciMeasurement,
    nciFairValue: nciMeasurement === 'fair_value' ? (params as unknown).nciFairValue : undefined,
    previouslyHeldInterestFairValue: pheFV > 0 ? pheFV : undefined,
    goodwillAmount,
    currency,
    calculationDate: new Date(),
    goodwillType
  } as GoodwillCalculation;
}

/**
 * Remeasure goodwill
 * 
 * @param existingGoodwill - Existing goodwill amount
 * @param newFairValue - New fair value assessment
 * @param ownershipPercentage - Ownership percentage
 * @returns Remeasured goodwill
 * 
 * @example
 * ```typescript
 * const remeasured = remeasureGoodwill(100000, newFairValue, 0.8);
 * ```
 */
/**
 * @deprecated Goodwill is not remeasured this way under MFRS 3.
 * Prefer remeasurePreviouslyHeldInterest when obtaining control.
 */
export function remeasureGoodwill(
  existingGoodwill: number,
  newFairValue: FairValueAssessment,
  ownershipPercentage: number
): GoodwillCalculation {
  return {
    goodwillId: `goodwill-remeasurement-${Date.now()}`,
    entityId: newFairValue.entityId,
    parentId: 'parent',
    consideration: existingGoodwill,
    fairValueOfNetAssets: newFairValue.fairValueOfNetAssets,
    ownershipPercentage,
    nciMeasurement: 'proportionate',
    goodwillAmount: roundToCurrency(existingGoodwill, newFairValue.currency),
    currency: newFairValue.currency,
    calculationDate: new Date(),
    goodwillType: existingGoodwill > 0 ? 'positive_goodwill' : 'bargain_purchase'
  };
}

// New: Previously Held Interest remeasurement (step acquisitions to control)
function remeasurePreviouslyHeldInterest(args: {
  previousOwnership: number;
  totalOwnership: number;
  previouslyHeldInterestCarryingAmount: number;
  previouslyHeldInterestFairValue: number;
  currency: SupportedCurrency;
}): { gainOrLoss: number; previouslyHeldInterestFairValue: number } | undefined {
  const { previousOwnership, totalOwnership } = args;
  const crossedToControl = previousOwnership < 0.5 && totalOwnership >= 0.5;
  if (!crossedToControl) return undefined;
  const gainOrLoss = roundToCurrency(
    args.previouslyHeldInterestFairValue - args.previouslyHeldInterestCarryingAmount,
    args.currency
  );
  // Caller should record this in P/L.
  return { gainOrLoss, previouslyHeldInterestFairValue: args.previouslyHeldInterestFairValue };
}

// ============================================================================
// JOURNAL ENTRY GENERATION
// ============================================================================

/**
 * Generate ownership change journal entries
 * 
 * @param ownershipChange - Ownership change details
 * @returns Journal entries
 * 
 * @example
 * ```typescript
 * const entries = generateOwnershipChangeJournalEntries(ownershipChange);
 * ```
 */
export function generateOwnershipChangeJournalEntries(
  ownershipChange: OwnershipChange
): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  // Generate goodwill journal entry
  const goodwillEntry = generateGoodwillJournalEntry(ownershipChange.goodwill);
  entries.push(goodwillEntry);

  // Generate NCI journal entry
  const nciEntry = generateNCIJournalEntry(ownershipChange.nci);
  entries.push(nciEntry);

  // Generate consideration journal entry
  const considerationEntry = generateConsiderationJournalEntry(ownershipChange.consideration);
  entries.push(considerationEntry);

  return entries;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine ownership change type
 * 
 * @param changeAmount - Change in ownership percentage
 * @returns Ownership change type
 */
function determineOwnershipChangeType(prev: number, next: number): OwnershipChangeType {
  if (prev < 0.5 && next >= 0.5) return 'step_acquisition'; // obtain control
  if (prev >= 0.5 && next >= 0.5) return 'additional_investment'; // within control (equity transaction)
  if (prev >= 0.5 && next < 0.5) return 'partial_disposal'; // loss of control (disposal logic elsewhere)
  if (prev === next) return 'consolidation';
  return next > prev ? 'dilution' : 'partial_disposal';
}

/**
 * Generate goodwill journal entry
 * 
 * @param goodwill - Goodwill calculation
 * @returns Journal entry
 */
function generateGoodwillJournalEntry(goodwill: GoodwillCalculation): JournalEntry {
  const lines: JournalLine[] = [];

  if (goodwill.goodwillAmount > 0) {
    lines.push({
      id: `goodwill-line-1-${goodwill.goodwillId}`,
      accountCode: 'GOODWILL',
      description: `Goodwill: ${goodwill.goodwillType}`,
      debit: goodwill.goodwillAmount,
      credit: 0,
      currency: goodwill.currency
    });

    lines.push({
      id: `goodwill-line-2-${goodwill.goodwillId}`,
      accountCode: 'INVESTMENT-IN-SUBSIDIARY',
      description: `Investment in subsidiary`,
      debit: 0,
      credit: goodwill.goodwillAmount,
      currency: goodwill.currency
    });
  } else if (goodwill.goodwillAmount < 0) {
    // Bargain purchase: recognize gain in P/L (credit) instead of negative goodwill asset
    const gain = Math.abs(goodwill.goodwillAmount);
    lines.push({
      id: `goodwill-bargain-${goodwill.goodwillId}`,
      accountCode: 'BARGAIN-PURCHASE-GAIN',
      description: 'Gain on bargain purchase (MFRS 3)',
      debit: 0,
      credit: gain,
      currency: goodwill.currency
    });
    lines.push({
      id: `goodwill-offset-${goodwill.goodwillId}`,
      accountCode: 'INVESTMENT-IN-SUBSIDIARY',
      description: `Investment in subsidiary`,
      debit: gain,
      credit: 0,
      currency: goodwill.currency
    });
  }

  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: `goodwill-entry-${goodwill.goodwillId}`,
    date: goodwill.calculationDate,
    reference: `GW-${goodwill.entityId}`,
    description: `Goodwill: ${goodwill.goodwillType}`,
    lines,
    totalDebits,
    totalCredits,
    currency: goodwill.currency,
    status: 'draft'
  };
}

/**
 * Generate NCI journal entry
 * 
 * @param nci - NCI calculation
 * @returns Journal entry
 */
function generateNCIJournalEntry(nci: NCICalculation): JournalEntry {
  const lines: JournalLine[] = [];

  lines.push({
    id: `nci-line-1-${nci.nciId}`,
    accountCode: 'NET-ASSETS',
    description: `Net assets: ${nci.entityId}`,
    debit: 0,
    credit: nci.netAssets,
    currency: nci.currency
  });

  lines.push({
    id: `nci-line-2-${nci.nciId}`,
    accountCode: 'NON-CONTROLLING-INTEREST',
    description: `NCI: ${nci.entityId}`,
    debit: nci.nciAmount,
    credit: 0,
    currency: nci.currency
  });

  lines.push({
    id: `nci-line-3-${nci.nciId}`,
    accountCode: 'PARENT-EQUITY',
    description: `Parent equity: ${nci.entityId}`,
    debit: nci.netAssets - nci.nciAmount,
    credit: 0,
    currency: nci.currency
  });

  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: `nci-entry-${nci.nciId}`,
    date: nci.calculationDate,
    reference: `NCI-${nci.entityId}`,
    description: `NCI calculation: ${nci.entityId}`,
    lines,
    totalDebits,
    totalCredits,
    currency: nci.currency,
    status: 'draft'
  };
}

/**
 * Generate consideration journal entry
 * 
 * @param consideration - Consideration details
 * @returns Journal entry
 */
function generateConsiderationJournalEntry(consideration: ConsiderationDetails): JournalEntry {
  const lines: JournalLine[] = [];

  if (consideration.cashConsideration > 0) {
    lines.push({
      id: `consideration-cash-${Date.now()}`,
      accountCode: 'CASH',
      description: 'Cash consideration',
      debit: 0,
      credit: roundToCurrency(consideration.cashConsideration, consideration.currency),
      currency: consideration.currency
    });
  }

  if (consideration.shareConsideration > 0) {
    lines.push({
      id: `consideration-shares-${Date.now()}`,
      accountCode: 'SHARE-CAPITAL',
      description: 'Share consideration',
      debit: 0,
      credit: consideration.shareConsideration,
      currency: consideration.currency
    });
  }

  lines.push({
    id: `consideration-investment-${Date.now()}`,
    accountCode: 'INVESTMENT-IN-SUBSIDIARY',
    description: 'Investment in subsidiary',
    debit: roundToCurrency(consideration.totalConsideration, consideration.currency),
    credit: 0,
    currency: consideration.currency
  });

  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: `consideration-entry-${Date.now()}`,
    date: new Date(),
    reference: 'CONSIDERATION',
    description: 'Consideration for acquisition',
    lines,
    totalDebits,
    totalCredits,
    currency: consideration.currency,
    status: 'draft'
  };
}
