/**
 * Hedge Accounting Utilities - Enterprise Production Ready
 *
 * Comprehensive hedge accounting utilities per MFRS 9 Financial Instruments
 * with effectiveness testing, OCI management, and risk management integration.
 * 
 * Features:
 * - Hedge designation and documentation
 * - Effectiveness testing (prospective/retrospective) aligned to MFRS 9 principles
 * - OCI reclassification logic
 * - Fair value hedge accounting
 * - Cash flow hedge accounting
 * - Net investment hedge accounting
 * 
 * @example
 * ```typescript
 * import { 
 *   designateHedge,
 *   testHedgeEffectiveness,
 *   reclassifyOCI,
 *   calculateHedgeAccounting
 * } from './hedge-accounting-utilities';
 * 
 * // Designate hedge
 * const designation = designateHedge(hedgeInstrument, hedgedItem);
 * 
 * // Test effectiveness
 * const effectiveness = testHedgeEffectiveness(designation);
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';
import type { 
  JournalEntry,
  JournalLine
} from './journal-entry-utilities';
import type { 
  FiscalPeriod
} from './fiscal-period-utilities';
import { 
  roundToCurrency
} from './accounting-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Optional qualitative assessment inputs per MFRS 9:
 * 1) economic relationship exists,
 * 2) credit risk does not dominate value changes,
 * 3) hedge ratio reflects risk management objective.
 */
export interface QualitativeHedgeAssessment {
  readonly economicRelationship: boolean;
  readonly creditRiskDominates: boolean; // true means FAIL
  /** Actual hedge ratio used for designation (e.g., notional_hedge_instrument : exposure_hedged_item) */
  readonly hedgeRatio: number;
  /** Risk management hedge ratio target (if different; defaults to hedgeRatio when omitted) */
  readonly riskManagementHedgeRatio?: number;
}

/** Optional categorization for Cost of Hedging tracking (OCI). */
export type CostOfHedgingType =
  | 'time_value_options'
  | 'forward_points'
  | 'currency_basis_spread';

/**
 * Hedge designation
 */
export interface HedgeDesignation {
  readonly designationId: string;
  readonly hedgeInstrument: HedgeInstrument;
  readonly hedgedItem: HedgedItem;
  readonly hedgeType: HedgeType;
  readonly designationDate: Date;
  readonly effectivenessMethod: EffectivenessMethod;
  readonly documentation: HedgeDocumentation;
  readonly status: HedgeStatus;
  /** Optional policy for Cost of Hedging presentation (reserved for future use) */
  readonly costOfHedgingType?: CostOfHedgingType;
  /** Current hedge ratio (instrument notional : exposure). For MFRS 9 rebalancing. */
  readonly hedgeRatio?: number;
  /** Optional account codes for advanced postings (override defaults if provided) */
  readonly accountsOverride?: {
    ociHedgeReserve?: string;           // default 'OCI-HEDGE-RESERVE'
    ociCostOfHedgingReserve?: string;   // default 'OCI-COST-OF-HEDGING-RESERVE'
    ineffectivenessPL?: string;         // default 'HEDGE-INEFFECTIVENESS-P&L'
    hedgedItemAccount?: string;         // default 'HEDGED-ITEM'
    hedgeInstrumentAccount?: string;    // default 'HEDGE-INSTRUMENT'
  };
}

/**
 * Hedge instrument
 */
export interface HedgeInstrument {
  readonly instrumentId: string;
  readonly instrumentType: HedgeInstrumentType;
  readonly notionalAmount: number;
  readonly currency: SupportedCurrency;
  readonly maturityDate: Date;
  readonly fairValue: number;
  readonly instrumentDescription: string;
  readonly pricingModel: PricingModel;
  readonly riskExposure: RiskExposure;
}

/**
 * Hedged item
 */
export interface HedgedItem {
  readonly itemId: string;
  readonly itemType: HedgedItemType;
  readonly exposureAmount: number;
  readonly currency: SupportedCurrency;
  readonly expectedDate: Date;
  readonly itemDescription: string;
  readonly riskExposure: RiskExposure;
}

/**
 * Hedge effectiveness test result
 */
export interface EffectivenessTestResult {
  readonly testId: string;
  readonly designationId: string;
  readonly testDate: Date;
  readonly testMethod: EffectivenessMethod;
  readonly effectivenessRatio: number;
  readonly isEffective: boolean;
  /** Indicates if qualitative MFRS 9 criteria were satisfied */
  readonly qualitativePassed: boolean;
  /** Hedge ratio used vs risk mgmt hedge ratio */
  readonly hedgeRatio?: number | undefined;
  readonly riskManagementHedgeRatio?: number | undefined;
  readonly hedgeGainLoss: number;
  readonly hedgedItemGainLoss: number;
  readonly ineffectivenessAmount: number;
  readonly currency: SupportedCurrency;
  readonly testPeriod: FiscalPeriod;
  /** If provided, a reference to the journal id created for P&L ineffectiveness (cash-flow hedge) */
  readonly ineffectivenessJournalId?: string;
  /** Optional: cost-of-hedging amount (effective portion to OCI per policy) */
  readonly costOfHedgingAmount?: number;
  /** Optional: explicit CoH category for this test (overrides designation.costOfHedgingType if set) */
  readonly costOfHedgingType?: CostOfHedgingType;
}

/**
 * Result of rebalancing a hedge under MFRS 9 (no discontinuation).
 */
export interface RebalanceResult {
  readonly previousHedgeRatio?: number | undefined;
  readonly newHedgeRatio: number;
  /** Shallow-cloned, updated designation with the new hedge ratio (immutable) */
  readonly updatedDesignation: HedgeDesignation;
  /** Optional note for audit trail / disclosure */
  readonly note?: string | undefined;
}

/**
 * Discontinuation outcome
 */
export interface DiscontinuationResult {
  readonly updatedDesignation: HedgeDesignation;
  /** Any immediate reclassification entries (e.g., CFH when forecast no longer expected) */
  readonly journalEntries: readonly JournalEntry[];
  readonly reason: DiscontinuationReason;
}

/**
 * Discontinuation reasons (subset + explicit "not expected" case)
 */
export type DiscontinuationReason =
  | 'hedge_terminated'
  | 'hedge_expired'
  | 'ineffective'
  | 'voluntary_termination'
  | 'forecast_transaction_no_longer_expected';

// ============================================================================
// OCI BALANCE TRACKER (roll-forward of OCI reserves)
// ============================================================================
type OCIBalanceKey = string; // designationId + '|' + accountCode

export interface OCIRollforwardRow {
  accountCode: string;
  opening: number;
  movements: number;
  closing: number;
  currency: SupportedCurrency;
}

export interface OCIRollforward {
  designationId: string;
  rows: readonly OCIRollforwardRow[];
  asOf: Date;
}

export interface OCITracker {
  /** Apply a single JE to the tracker (only OCI reserve accounts affect balances). */
  apply(entry: JournalEntry, designation?: HedgeDesignation): void;
  /** Apply many JEs at once. */
  applyAll(entries: readonly JournalEntry[], designation?: HedgeDesignation): void;
  /** Current balance for hedge OCI reserve. */
  getHedgeOCIBalance(designation: HedgeDesignation): number;
  /** Current balance for cost-of-hedging OCI reserve. */
  getCoHOCIBalance(designation: HedgeDesignation): number;
  /** Roll-forward snapshot of tracked OCI accounts for a designation. */
  rollforward(designation: HedgeDesignation): OCIRollforward;
}

function getAccountCodes(designation: HedgeDesignation) {
  const acc = designation.accountsOverride ?? {};
  return {
    ACC_OCI: acc.ociHedgeReserve ?? 'OCI-HEDGE-RESERVE',
    ACC_OCI_COH: acc.ociCostOfHedgingReserve ?? 'OCI-COST-OF-HEDGING-RESERVE',
  };
}

/** Factory for an in-memory OCI tracker (lightweight, dependency-free). */
export function createOCITracker(): OCITracker {
  // balances: key -> { opening, movement, currency }
  const openings = new Map<OCIBalanceKey, number>();
  const movements = new Map<OCIBalanceKey, number>();
  const currencies = new Map<OCIBalanceKey, SupportedCurrency>();

  function key(designationId: string, accountCode: string): OCIBalanceKey {
    return `${designationId}|${accountCode}`;
  }

  function applyLine(designation: HedgeDesignation, line: JournalLine) {
    const { ACC_OCI, ACC_OCI_COH } = getAccountCodes(designation);
    if (line.accountCode !== ACC_OCI && line.accountCode !== ACC_OCI_COH) return;
    const k = key(designation.designationId, line.accountCode);
    // By construction in earlier entries: debits increase reserve, credits decrease.
    const delta = (line.debit ?? 0) - (line.credit ?? 0);
    movements.set(k, (movements.get(k) ?? 0) + delta);
    if (!currencies.has(k)) currencies.set(k, line.currency as SupportedCurrency);
  }

  function apply(entry: JournalEntry, designation?: HedgeDesignation) {
    if (!designation) return;
    for (const ln of entry.lines) applyLine(designation, ln);
  }

  function applyAll(entries: readonly JournalEntry[], designation?: HedgeDesignation) {
    if (!designation) return;
    for (const e of entries) apply(e, designation);
  }

  function current(designation: HedgeDesignation, accountCode: string): number {
    const k = key(designation.designationId, accountCode);
    const open = openings.get(k) ?? 0;
    const move = movements.get(k) ?? 0;
    return open + move;
    // Note: callers can seed 'openings' from GL if desired.
  }

  function getHedgeOCIBalance(designation: HedgeDesignation): number {
    const { ACC_OCI } = getAccountCodes(designation);
    return current(designation, ACC_OCI);
  }

  function getCoHOCIBalance(designation: HedgeDesignation): number {
    const { ACC_OCI_COH } = getAccountCodes(designation);
    return current(designation, ACC_OCI_COH);
  }

  function rollforward(designation: HedgeDesignation): OCIRollforward {
    const { ACC_OCI, ACC_OCI_COH } = getAccountCodes(designation);
    const dId = designation.designationId;
    const kh = `${dId}|${ACC_OCI}`;
    const kc = `${dId}|${ACC_OCI_COH}`;
    const rows: OCIRollforwardRow[] = [];
    const openH = openings.get(kh) ?? 0;
    const movH = movements.get(kh) ?? 0;
    if (openH !== 0 || movH !== 0) {
      rows.push({
        accountCode: ACC_OCI,
        opening: openH,
        movements: movH,
        closing: openH + movH,
        currency: currencies.get(kh)!,
      });
    }
    const openC = openings.get(kc) ?? 0;
    const movC = movements.get(kc) ?? 0;
    if (openC !== 0 || movC !== 0) {
      rows.push({
        accountCode: ACC_OCI_COH,
        opening: openC,
        movements: movC,
        closing: openC + movC,
        currency: currencies.get(kc)!,
      });
    }
    return { designationId: dId, rows, asOf: new Date() };
  }

  return { apply, applyAll, getHedgeOCIBalance, getCoHOCIBalance, rollforward };
}

/**
 * OCI reclassification
 */
export interface OCIReclassification {
  readonly reclassificationId: string;
  readonly designationId: string;
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
  readonly attachments: readonly string[];
  readonly reviewDate: Date;
  readonly nextReviewDate: Date;
  readonly approvedBy: string;
  readonly approvedDate: Date;
}

/**
 * Pricing model
 */
export interface PricingModel {
  readonly modelId: string;
  readonly modelType: PricingModelType;
  readonly parameters: readonly PricingParameter[];
  readonly validationDate: Date;
  readonly nextValidationDate: Date;
}

/**
 * Pricing parameter
 */
export interface PricingParameter {
  readonly parameterId: string;
  readonly parameterName: string;
  readonly parameterValue: number;
  readonly parameterType: ParameterType;
  readonly currency: SupportedCurrency;
}

/**
 * Risk exposure
 */
export interface RiskExposure {
  readonly exposureId: string;
  readonly riskType: RiskType;
  readonly exposureAmount: number;
  readonly currency: SupportedCurrency;
  readonly exposureDate: Date;
  readonly sensitivity: number;
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
  | 'currency_swap'
  | 'interest_rate_swap'
  | 'commodity_swap';

/**
 * Hedged item types
 */
export type HedgedItemType = 
  | 'foreign_currency_exposure'
  | 'forecast_transaction'
  | 'recognized_asset'
  | 'recognized_liability'
  | 'net_investment'
  | 'interest_rate_exposure'
  | 'commodity_exposure';

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
 * Hedge status
 */
export type HedgeStatus = 
  | 'designated'
  | 'effective'
  | 'ineffective'
  | 'discontinued'
  | 'expired';

/**
 * Hedge documentation types
 */
export type HedgeDocumentationType = 
  | 'hedge_documentation'
  | 'effectiveness_assessment'
  | 'risk_management_objective'
  | 'hedge_strategy'
  | 'pricing_model_validation';

/**
 * Pricing model types
 */
export type PricingModelType = 
  | 'black_scholes'
  | 'binomial_model'
  | 'monte_carlo'
  | 'discounted_cash_flow'
  | 'market_quoted';

/**
 * Parameter types
 */
export type ParameterType = 
  | 'volatility'
  | 'interest_rate'
  | 'dividend_yield'
  | 'time_to_maturity'
  | 'strike_price'
  | 'spot_price';

/**
 * Risk types
 */
export type RiskType = 
  | 'foreign_exchange_risk'
  | 'interest_rate_risk'
  | 'commodity_price_risk'
  | 'credit_risk'
  | 'liquidity_risk';

/**
 * Reclassification reasons
 */
export type ReclassificationReason = 
  | 'hedge_ineffective'
  | 'hedge_expired'
  | 'hedge_terminated'
  | 'forecast_transaction_occurred'
  | 'net_investment_disposed'
  | 'cash_flow_hedge_ineffective';

// ============================================================================
// HEDGE DESIGNATION
// ============================================================================

/**
 * Designate hedge relationship
 * 
 * @param hedgeInstrument - Hedge instrument
 * @param hedgedItem - Hedged item
 * @param hedgeType - Type of hedge
 * @param effectivenessMethod - Effectiveness testing method
 * @returns Hedge designation
 * 
 * @example
 * ```typescript
 * const designation = designateHedge(hedgeInstrument, hedgedItem, 'cash_flow_hedge', 'dollar_offset_method');
 * ```
 */
export function designateHedge(
  hedgeInstrument: HedgeInstrument,
  hedgedItem: HedgedItem,
  hedgeType: HedgeType,
  effectivenessMethod: EffectivenessMethod
): HedgeDesignation {
  // Validate hedge instrument and hedged item
  validateHedgeDesignation(hedgeInstrument, hedgedItem);

  // Create hedge documentation
  const documentation = createHedgeDocumentation(
    hedgeInstrument,
    hedgedItem,
    hedgeType,
    effectivenessMethod
  );

  return {
    designationId: `hedge-designation-${Date.now()}`,
    hedgeInstrument,
    hedgedItem,
    hedgeType,
    designationDate: new Date(),
    effectivenessMethod,
    documentation,
    status: 'designated',
    hedgeRatio: 1 // default 1:1 unless caller overrides later via rebalancing
  };
}

/**
 * Test hedge effectiveness
 * 
 * @param designation - Hedge designation
 * @param hedgeGainLoss - Hedge instrument gain/loss
 * @param hedgedItemGainLoss - Hedged item gain/loss
 * @param testPeriod - Test period
 * @param qualitative - Optional qualitative assessment per MFRS 9
 * @returns Effectiveness test result
 * 
 * @example
 * const effectiveness = testHedgeEffectiveness(designation, 10000, 9500, testPeriod, {
 *   economicRelationship: true,
 *   creditRiskDominates: false,
 *   hedgeRatio: 1,
 *   riskManagementHedgeRatio: 1
 * });
 */
export function testHedgeEffectiveness(
  designation: HedgeDesignation,
  hedgeGainLoss: number,
  hedgedItemGainLoss: number,
  testPeriod: FiscalPeriod,
  qualitative?: QualitativeHedgeAssessment
): EffectivenessTestResult {
  // Calculate a monitoring ratio based on chosen method (not a pass/fail bright-line under MFRS 9)
  let effectivenessRatio: number;
  
  switch (designation.effectivenessMethod) {
    case 'dollar_offset_method':
      effectivenessRatio = calculateDollarOffsetEffectiveness(hedgeGainLoss, hedgedItemGainLoss);
      break;
    case 'regression_analysis':
      effectivenessRatio = calculateRegressionEffectiveness(hedgeGainLoss, hedgedItemGainLoss);
      break;
    case 'critical_terms_match':
      effectivenessRatio = calculateCriticalTermsEffectiveness(designation);
      break;
    default:
      effectivenessRatio = calculateDollarOffsetEffectiveness(hedgeGainLoss, hedgedItemGainLoss);
  }

  // MFRS 9 effectiveness is principles-based:
  // 1) Economic relationship,
  // 2) Credit risk does not dominate,
  // 3) Hedge ratio reflects risk management objective (rebalance if not).
  const qm = qualitative;
  const hedgeRatioUsed = qm?.hedgeRatio;
  const rmHedgeRatio = qm?.riskManagementHedgeRatio ?? hedgeRatioUsed;
  const qualitativePassed =
    qm ? (qm.economicRelationship === true && qm.creditRiskDominates === false && (hedgeRatioUsed == null || rmHedgeRatio == null || hedgeRatioUsed === rmHedgeRatio))
       : true; // if not supplied, treat as passed by policy & documentation (caller responsibility)

  const isEffective = qualitativePassed;

  // Calculate ineffectiveness amount
  const ineffectivenessAmount = Math.abs(hedgeGainLoss - hedgedItemGainLoss);

  return {
    testId: `effectiveness-test-${designation.designationId}-${Date.now()}`,
    designationId: designation.designationId,
    testDate: new Date(),
    testMethod: designation.effectivenessMethod,
    effectivenessRatio: roundToCurrency(effectivenessRatio, designation.hedgeInstrument.currency),
    isEffective,
    qualitativePassed,
    hedgeRatio: hedgeRatioUsed,
    riskManagementHedgeRatio: rmHedgeRatio,
    hedgeGainLoss: roundToCurrency(hedgeGainLoss, designation.hedgeInstrument.currency),
    hedgedItemGainLoss: roundToCurrency(hedgedItemGainLoss, designation.hedgedItem.currency),
    ineffectivenessAmount: roundToCurrency(ineffectivenessAmount, designation.hedgeInstrument.currency),
    currency: designation.hedgeInstrument.currency,
    testPeriod
  };
}

// ============================================================================
// REBALANCING (MFRS 9)
// ============================================================================
/**
 * Rebalance a hedge (adjust hedge ratio) without discontinuation (MFRS 9).
 * Returns a shallow-cloned designation with updated hedgeRatio.
 *
 * Caller should persist this update and keep documentation aligned.
 */
export function rebalanceHedge(
  designation: HedgeDesignation,
  newHedgeRatio: number,
  note?: string
): RebalanceResult {
  if (!(newHedgeRatio > 0)) {
    throw new Error('newHedgeRatio must be a positive number');
  }
  const prev = designation.hedgeRatio;
  const updated: HedgeDesignation = {
    ...designation,
    hedgeRatio: newHedgeRatio,
    documentation: {
      ...designation.documentation,
      // nudge next review date to today + 1 day to force re-review if desired
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  };
  return {
    previousHedgeRatio: prev,
    newHedgeRatio,
    updatedDesignation: updated,
    note
  };
}

// ============================================================================
// OCI RECLASSIFICATION
// ============================================================================

/**
 * Reclassify OCI for cash flow hedge
 * 
 * @param designation - Hedge designation
 * @param ociAmount - OCI amount to reclassify
 * @param reason - Reclassification reason
 * @returns OCI reclassification
 * 
 * @example
 * ```typescript
 * const reclassification = reclassifyOCI(designation, 5000, 'forecast_transaction_occurred');
 * ```
 */
export function reclassifyOCI(
  designation: HedgeDesignation,
  ociAmount: number,
  reason: ReclassificationReason
): OCIReclassification {
  // Generate journal entry for OCI reclassification
  const journalEntry = generateOCIReclassificationJournalEntry(
    designation,
    ociAmount,
    reason
  );

  return {
    reclassificationId: `oci-reclass-${designation.designationId}-${Date.now()}`,
    designationId: designation.designationId,
    reclassificationDate: new Date(),
    ociAmount: roundToCurrency(ociAmount, designation.hedgeInstrument.currency),
    currency: designation.hedgeInstrument.currency,
    reclassificationReason: reason,
    journalEntry
  };
}

// ============================================================================
// HEDGE ACCOUNTING CALCULATIONS
// ============================================================================

/**
 * Calculate hedge accounting entries
 * 
 * @param designation - Hedge designation
 * @param effectivenessResult - Effectiveness test result
 * @returns Hedge accounting journal entries
 * 
 * @example
 * ```typescript
 * const entries = calculateHedgeAccounting(designation, effectivenessResult);
 * ```
 */
export function calculateHedgeAccounting(
  designation: HedgeDesignation,
  effectivenessResult: EffectivenessTestResult
): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  switch (designation.hedgeType) {
    case 'fair_value_hedge':
      entries.push(...generateFairValueHedgeEntries(designation, effectivenessResult));
      break;
    case 'cash_flow_hedge':
      entries.push(...generateCashFlowHedgeEntries(designation, effectivenessResult));
      break;
    case 'net_investment_hedge':
      entries.push(...generateNetInvestmentHedgeEntries(designation, effectivenessResult));
      break;
  }

  return entries;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate hedge designation
 * 
 * @param hedgeInstrument - Hedge instrument
 * @param hedgedItem - Hedged item
 */
function validateHedgeDesignation(
  hedgeInstrument: HedgeInstrument,
  hedgedItem: HedgedItem
): void {
  // Validate currencies match
  if (hedgeInstrument.currency !== hedgedItem.currency) {
    throw new Error('Hedge instrument and hedged item currencies must match');
  }

  // Validate amounts are positive
  if (hedgeInstrument.notionalAmount <= 0) {
    throw new Error('Hedge instrument notional amount must be positive');
  }

  if (hedgedItem.exposureAmount <= 0) {
    throw new Error('Hedged item exposure amount must be positive');
  }

  // Validate dates
  if (hedgeInstrument.maturityDate <= new Date()) {
    throw new Error('Hedge instrument maturity date must be in the future');
  }

  if (hedgedItem.expectedDate <= new Date()) {
    throw new Error('Hedged item expected date must be in the future');
  }
}

/**
 * Create hedge documentation
 * 
 * @param hedgeInstrument - Hedge instrument
 * @param hedgedItem - Hedged item
 * @param hedgeType - Hedge type
 * @param effectivenessMethod - Effectiveness method
 * @returns Hedge documentation
 */
function createHedgeDocumentation(
  hedgeInstrument: HedgeInstrument,
  hedgedItem: HedgedItem,
  hedgeType: HedgeType,
  effectivenessMethod: EffectivenessMethod
): HedgeDocumentation {
  return {
    documentationId: `hedge-doc-${Date.now()}`,
    designationId: `hedge-designation-${Date.now()}`,
    documentationType: 'hedge_documentation',
    content: `Hedge documentation for ${hedgeInstrument.instrumentType} hedging ${hedgedItem.itemType} using ${hedgeType} with ${effectivenessMethod} method`,
    attachments: ['Risk management policy', 'Hedge strategy document'],
    reviewDate: new Date(),
    nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    approvedBy: 'Risk Manager',
    approvedDate: new Date()
  };
}

/**
 * Calculate dollar offset effectiveness
 * 
 * @param hedgeGainLoss - Hedge instrument gain/loss
 * @param hedgedItemGainLoss - Hedged item gain/loss
 * @returns Effectiveness ratio
 */
function calculateDollarOffsetEffectiveness(
  hedgeGainLoss: number,
  hedgedItemGainLoss: number
): number {
  if (hedgedItemGainLoss === 0) {
    return hedgeGainLoss === 0 ? 1 : 0;
  }
  
  return Math.abs(hedgeGainLoss / hedgedItemGainLoss);
}

/**
 * Calculate regression effectiveness
 * 
 * @param hedgeGainLoss - Hedge instrument gain/loss
 * @param hedgedItemGainLoss - Hedged item gain/loss
 * @returns Effectiveness ratio
 */
function calculateRegressionEffectiveness(
  hedgeGainLoss: number,
  hedgedItemGainLoss: number
): number {
  // Simplified regression calculation
  // In practice, this would use historical data points
  return calculateDollarOffsetEffectiveness(hedgeGainLoss, hedgedItemGainLoss);
}

/**
 * Calculate critical terms effectiveness
 * 
 * @param designation - Hedge designation
 * @returns Effectiveness ratio
 */
function calculateCriticalTermsEffectiveness(
  designation: HedgeDesignation
): number {
  // Critical terms match – treat as highly effective indicator for monitoring.
  const instrumentMaturity = designation.hedgeInstrument.maturityDate;
  const itemExpectedDate = designation.hedgedItem.expectedDate;
  
  const timeDifference = Math.abs(instrumentMaturity.getTime() - itemExpectedDate.getTime());
  const maxTimeDifference = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  return timeDifference <= maxTimeDifference ? 1.0 : 0.5;
}

/**
 * Generate OCI reclassification journal entry
 * 
 * @param designation - Hedge designation
 * @param ociAmount - OCI amount
 * @param reason - Reclassification reason
 * @returns Journal entry
 */
function generateOCIReclassificationJournalEntry(
  designation: HedgeDesignation,
  ociAmount: number,
  reason: ReclassificationReason
): JournalEntry {
  const lines: JournalLine[] = [];

  if (ociAmount > 0) {
    lines.push({
      id: `oci-reclass-line-1-${designation.designationId}`,
      accountCode: 'OCI-HEDGE-RESERVE',
      description: `OCI reclassification: ${reason}`,
      debit: ociAmount,
      credit: 0,
      currency: designation.hedgeInstrument.currency
    });

    lines.push({
      id: `oci-reclass-line-2-${designation.designationId}`,
      accountCode: 'HEDGED-ITEM',
      description: `OCI reclassification offset`,
      debit: 0,
      credit: ociAmount,
      currency: designation.hedgeInstrument.currency
    });
  } else {
    lines.push({
      id: `oci-reclass-line-1-${designation.designationId}`,
      accountCode: 'HEDGED-ITEM',
      description: `OCI reclassification: ${reason}`,
      debit: Math.abs(ociAmount),
      credit: 0,
      currency: designation.hedgeInstrument.currency
    });

    lines.push({
      id: `oci-reclass-line-2-${designation.designationId}`,
      accountCode: 'OCI-HEDGE-RESERVE',
      description: `OCI reclassification offset`,
      debit: 0,
      credit: Math.abs(ociAmount),
      currency: designation.hedgeInstrument.currency
    });
  }

  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: `oci-reclassification-entry-${designation.designationId}`,
    date: new Date(),
    reference: `OCI-${designation.designationId}`,
    description: `OCI reclassification: ${reason}`,
    lines,
    totalDebits,
    totalCredits,
    currency: designation.hedgeInstrument.currency,
    status: 'draft'
  };
}

/**
 * Generate fair value hedge entries
 * 
 * @param designation - Hedge designation
 * @param effectivenessResult - Effectiveness test result
 * @returns Journal entries
 */
function generateFairValueHedgeEntries(
  designation: HedgeDesignation,
  effectivenessResult: EffectivenessTestResult
): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  // Generate hedge instrument fair value adjustment entry
  const hedgeEntry: JournalEntry = {
    id: `fair-value-hedge-entry-${designation.designationId}`,
    date: new Date(),
    reference: `FVH-${designation.designationId}`,
    description: `Fair value hedge: ${designation.hedgeInstrument.instrumentDescription}`,
    lines: [
      {
        id: `hedge-fv-line-1-${designation.designationId}`,
        accountCode: 'HEDGE-INSTRUMENT',
        description: `Hedge instrument fair value adjustment`,
        debit: effectivenessResult.hedgeGainLoss > 0 ? effectivenessResult.hedgeGainLoss : 0,
        credit: effectivenessResult.hedgeGainLoss < 0 ? Math.abs(effectivenessResult.hedgeGainLoss) : 0,
        currency: designation.hedgeInstrument.currency
      },
      {
        id: `hedge-fv-line-2-${designation.designationId}`,
        accountCode: 'HEDGE-GAIN-LOSS',
        description: `Hedge instrument gain/loss`,
        debit: effectivenessResult.hedgeGainLoss < 0 ? Math.abs(effectivenessResult.hedgeGainLoss) : 0,
        credit: effectivenessResult.hedgeGainLoss > 0 ? effectivenessResult.hedgeGainLoss : 0,
        currency: designation.hedgeInstrument.currency
      }
    ],
    totalDebits: Math.abs(effectivenessResult.hedgeGainLoss),
    totalCredits: Math.abs(effectivenessResult.hedgeGainLoss),
    currency: designation.hedgeInstrument.currency,
    status: 'draft'
  };

  entries.push(hedgeEntry);

  // Generate hedged item fair value adjustment entry
  const hedgedItemEntry: JournalEntry = {
    id: `hedged-item-fv-entry-${designation.designationId}`,
    date: new Date(),
    reference: `HEDGED-${designation.designationId}`,
    description: `Hedged item fair value adjustment`,
    lines: [
      {
        id: `hedged-item-fv-line-1-${designation.designationId}`,
        accountCode: 'HEDGED-ITEM',
        description: `Hedged item fair value adjustment`,
        debit: effectivenessResult.hedgedItemGainLoss > 0 ? effectivenessResult.hedgedItemGainLoss : 0,
        credit: effectivenessResult.hedgedItemGainLoss < 0 ? Math.abs(effectivenessResult.hedgedItemGainLoss) : 0,
        currency: designation.hedgedItem.currency
      },
      {
        id: `hedged-item-fv-line-2-${designation.designationId}`,
        accountCode: 'HEDGED-ITEM-GAIN-LOSS',
        description: `Hedged item gain/loss`,
        debit: effectivenessResult.hedgedItemGainLoss < 0 ? Math.abs(effectivenessResult.hedgedItemGainLoss) : 0,
        credit: effectivenessResult.hedgedItemGainLoss > 0 ? effectivenessResult.hedgedItemGainLoss : 0,
        currency: designation.hedgedItem.currency
      }
    ],
    totalDebits: Math.abs(effectivenessResult.hedgedItemGainLoss),
    totalCredits: Math.abs(effectivenessResult.hedgedItemGainLoss),
    currency: designation.hedgedItem.currency,
    status: 'draft'
  };

  entries.push(hedgedItemEntry);

  return entries;
}

/**
 * Generate cash flow hedge entries
 * 
 * @param designation - Hedge designation
 * @param effectivenessResult - Effectiveness test result
 * @returns Journal entries
 */
function generateCashFlowHedgeEntries(
  designation: HedgeDesignation,
  effectivenessResult: EffectivenessTestResult
): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];
  const acc = designation.accountsOverride ?? {};
  const ACC_OCI = acc.ociHedgeReserve ?? 'OCI-HEDGE-RESERVE';
  const ACC_OCI_COH = acc.ociCostOfHedgingReserve ?? 'OCI-COST-OF-HEDGING-RESERVE';
  const ACC_HEDGE = acc.hedgeInstrumentAccount ?? 'HEDGE-INSTRUMENT';
  const ACC_INEFF_PL = acc.ineffectivenessPL ?? 'HEDGE-INEFFECTIVENESS-P&L';

  // Generate OCI entry for effective portion (ineffectiveness remains in P&L)
  const ociEntry: JournalEntry = {
    id: `cash-flow-hedge-oci-entry-${designation.designationId}`,
    date: new Date(),
    reference: `CFH-OCI-${designation.designationId}`,
    description: `Cash flow hedge (MFRS 9) OCI: ${designation.hedgeInstrument.instrumentDescription}`,
    lines: [
      {
        id: `cfh-oci-line-1-${designation.designationId}`,
        accountCode: ACC_OCI,
        description: `OCI hedge reserve`,
        debit: effectivenessResult.hedgeGainLoss > 0 ? effectivenessResult.hedgeGainLoss : 0,
        credit: effectivenessResult.hedgeGainLoss < 0 ? Math.abs(effectivenessResult.hedgeGainLoss) : 0,
        currency: designation.hedgeInstrument.currency
      },
      {
        id: `cfh-oci-line-2-${designation.designationId}`,
        accountCode: ACC_HEDGE,
        description: `Hedge instrument fair value`,
        debit: effectivenessResult.hedgeGainLoss < 0 ? Math.abs(effectivenessResult.hedgeGainLoss) : 0,
        credit: effectivenessResult.hedgeGainLoss > 0 ? effectivenessResult.hedgeGainLoss : 0,
        currency: designation.hedgeInstrument.currency
      }
    ],
    totalDebits: Math.abs(effectivenessResult.hedgeGainLoss),
    totalCredits: Math.abs(effectivenessResult.hedgeGainLoss),
    currency: designation.hedgeInstrument.currency,
    status: 'draft'
  };

  entries.push(ociEntry);

  // Record ineffectiveness directly in P&L (per MFRS 9)
  if (effectivenessResult.ineffectivenessAmount && effectivenessResult.ineffectivenessAmount !== 0) {
    const ineffectiveness = Math.abs(effectivenessResult.ineffectivenessAmount);
    const plEntry: JournalEntry = {
      id: `cfh-ineffectiveness-pl-${designation.designationId}`,
      date: new Date(),
      reference: `CFH-INEFF-${designation.designationId}`,
      description: `Cash flow hedge ineffectiveness (MFRS 9)`,
      lines: [
        // If hedgeGainLoss > hedgedItemGainLoss -> net loss to P&L; else net gain
        {
          id: `cfh-ineff-line-1-${designation.designationId}`,
          accountCode: ACC_INEFF_PL,
          description: 'Recognize hedge ineffectiveness in profit or loss',
          debit: effectivenessResult.hedgeGainLoss > effectivenessResult.hedgedItemGainLoss ? ineffectiveness : 0,
          credit: effectivenessResult.hedgeGainLoss > effectivenessResult.hedgedItemGainLoss ? 0 : ineffectiveness,
          currency: designation.hedgeInstrument.currency
        },
        {
          id: `cfh-ineff-line-2-${designation.designationId}`,
          accountCode: ACC_HEDGE,
          description: 'Offset for ineffectiveness recognition',
          debit: effectivenessResult.hedgeGainLoss > effectivenessResult.hedgedItemGainLoss ? 0 : ineffectiveness,
          credit: effectivenessResult.hedgeGainLoss > effectivenessResult.hedgedItemGainLoss ? ineffectiveness : 0,
          currency: designation.hedgeInstrument.currency
        }
      ],
      totalDebits: ineffectiveness,
      totalCredits: ineffectiveness,
      currency: designation.hedgeInstrument.currency,
      status: 'draft'
    };
    entries.push(plEntry);
  }

  // Optional: Cost-of-Hedging reserve (effective portion) to OCI
  const cohType = effectivenessResult.costOfHedgingType ?? designation.costOfHedgingType;
  if (cohType && effectivenessResult.costOfHedgingAmount && effectivenessResult.costOfHedgingAmount !== 0) {
    const amt = Math.abs(effectivenessResult.costOfHedgingAmount);
    const cohEntry: JournalEntry = {
      id: `cfh-coh-oci-${designation.designationId}`,
      date: new Date(),
      reference: `CFH-COH-${designation.designationId}`,
      description: `Cost of Hedging (${cohType}) – OCI`,
      lines: [
        {
          id: `cfh-coh-line-1-${designation.designationId}`,
          accountCode: ACC_OCI_COH,
          description: 'Recognize cost of hedging in OCI',
          debit: amt,
          credit: 0,
          currency: designation.hedgeInstrument.currency
        },
        {
          id: `cfh-coh-line-2-${designation.designationId}`,
          accountCode: ACC_HEDGE,
          description: 'Offset for CoH recognition',
          debit: 0,
          credit: amt,
          currency: designation.hedgeInstrument.currency
        }
      ],
      totalDebits: amt,
      totalCredits: amt,
      currency: designation.hedgeInstrument.currency,
      status: 'draft'
    };
    entries.push(cohEntry);
  }

  return entries;
}

// ============================================================================
// COST-OF-HEDGING UTILITIES (OCI recognition & amortization)
// ============================================================================
/**
 * Record Cost-of-Hedging to OCI reserve (standalone utility if you post outside calculateHedgeAccounting).
 */
export function recordCostOfHedgingOCI(
  designation: HedgeDesignation,
  amount: number,
  type?: CostOfHedgingType
): JournalEntry {
  if (!(amount && amount !== 0)) {
    throw new Error('Cost-of-hedging amount must be non-zero');
  }
  const acc = designation.accountsOverride ?? {};
  const ACC_OCI_COH = acc.ociCostOfHedgingReserve ?? 'OCI-COST-OF-HEDGING-RESERVE';
  const ACC_HEDGE = acc.hedgeInstrumentAccount ?? 'HEDGE-INSTRUMENT';
  const amt = Math.abs(amount);
  return {
    id: `coh-oci-${designation.designationId}-${Date.now()}`,
    date: new Date(),
    reference: `COH-OCI-${designation.designationId}`,
    description: `Record Cost of Hedging${type ? ` (${type})` : ''} to OCI`,
    lines: [
      { id: `coh-oci-dr-${designation.designationId}`, accountCode: ACC_OCI_COH, description: 'CoH OCI', debit: amt, credit: 0, currency: designation.hedgeInstrument.currency },
      { id: `coh-oci-cr-${designation.designationId}`, accountCode: ACC_HEDGE, description: 'Offset', debit: 0, credit: amt, currency: designation.hedgeInstrument.currency }
    ],
    totalDebits: amt,
    totalCredits: amt,
    currency: designation.hedgeInstrument.currency,
    status: 'draft'
  };
}

/**
 * Amortize Cost-of-Hedging from OCI either to P&L or to basis of hedged item.
 * @param target 'pnl' posts to P&L; 'basis' posts to hedged item account.
 */
export function amortizeCostOfHedging(
  designation: HedgeDesignation,
  amount: number,
  target: 'pnl' | 'basis'
): JournalEntry {
  if (!(amount && amount !== 0)) {
    throw new Error('Amortization amount must be non-zero');
  }
  const acc = designation.accountsOverride ?? {};
  const ACC_OCI_COH = acc.ociCostOfHedgingReserve ?? 'OCI-COST-OF-HEDGING-RESERVE';
  const ACC_PL = acc.ineffectivenessPL ?? 'HEDGE-INEFFECTIVENESS-P&L';
  const ACC_ITEM = acc.hedgedItemAccount ?? 'HEDGED-ITEM';
  const amt = Math.abs(amount);
  const toAccount = target === 'pnl' ? ACC_PL : ACC_ITEM;
  return {
    id: `coh-amort-${designation.designationId}-${Date.now()}`,
    date: new Date(),
    reference: `COH-AMORT-${designation.designationId}`,
    description: `Amortize CoH from OCI to ${target.toUpperCase()}`,
    lines: [
      { id: `coh-amort-cr-oci-${designation.designationId}`, accountCode: ACC_OCI_COH, description: 'Release CoH from OCI', debit: 0, credit: amt, currency: designation.hedgeInstrument.currency },
      { id: `coh-amort-dr-to-${designation.designationId}`, accountCode: toAccount, description: 'CoH amortization target', debit: amt, credit: 0, currency: designation.hedgeInstrument.currency }
    ],
    totalDebits: amt,
    totalCredits: amt,
    currency: designation.hedgeInstrument.currency,
    status: 'draft'
  };
}

// ============================================================================
// DISCONTINUATION (MFRS 9)
// ============================================================================
/**
 * Discontinue hedge relationship. For CFH + forecast no longer expected,
 * immediately reclassify related OCI to P&L.
 * Note: This function does not search historical balances; caller should pass amounts if needed.
 */
export function discontinueHedge(
  designation: HedgeDesignation,
  reason: DiscontinuationReason,
  ociBalanceToReclassify?: number,
  tracker?: OCITracker
): DiscontinuationResult {
  const updated: HedgeDesignation = { ...designation, status: 'discontinued' };
  const journalEntries: JournalEntry[] = [];

  if (
    designation.hedgeType === 'cash_flow_hedge' &&
    reason === 'forecast_transaction_no_longer_expected' &&
    (
      (ociBalanceToReclassify && ociBalanceToReclassify !== 0) ||
      (tracker && (tracker.getHedgeOCIBalance(updated) !== 0 || tracker.getCoHOCIBalance(updated) !== 0))
    )
  ) {
    // 1) Hedge reserve balance
    const hedgeOCI =
      ociBalanceToReclassify !== undefined
        ? ociBalanceToReclassify
        : (tracker?.getHedgeOCIBalance(updated) ?? 0);
    if (hedgeOCI && hedgeOCI !== 0) {
      journalEntries.push(
        reclassifyOCI(updated, hedgeOCI, 'forecast_transaction_occurred' /* reuse label for routing to P&L */).journalEntry
      );
    }
    // 2) Cost-of-Hedging reserve balance → send to P&L as well
    const cohOCI = tracker?.getCoHOCIBalance(updated) ?? 0;
    if (cohOCI && cohOCI !== 0) {
      journalEntries.push(
        amortizeCostOfHedging(updated, Math.abs(cohOCI), 'pnl')
      );
    }
  }

  return { updatedDesignation: updated, journalEntries, reason };
}

/**
 * Generate net investment hedge entries
 * 
 * @param designation - Hedge designation
 * @param effectivenessResult - Effectiveness test result
 * @returns Journal entries
 */
function generateNetInvestmentHedgeEntries(
  designation: HedgeDesignation,
  effectivenessResult: EffectivenessTestResult
): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  // Generate OCI entry for net investment hedge
  const ociEntry: JournalEntry = {
    id: `net-investment-hedge-oci-entry-${designation.designationId}`,
    date: new Date(),
    reference: `NIH-OCI-${designation.designationId}`,
    description: `Net investment hedge OCI: ${designation.hedgeInstrument.instrumentDescription}`,
    lines: [
      {
        id: `nih-oci-line-1-${designation.designationId}`,
        accountCode: 'OCI-NET-INVESTMENT',
        description: `OCI net investment hedge`,
        debit: effectivenessResult.hedgeGainLoss > 0 ? effectivenessResult.hedgeGainLoss : 0,
        credit: effectivenessResult.hedgeGainLoss < 0 ? Math.abs(effectivenessResult.hedgeGainLoss) : 0,
        currency: designation.hedgeInstrument.currency
      },
      {
        id: `nih-oci-line-2-${designation.designationId}`,
        accountCode: 'HEDGE-INSTRUMENT',
        description: `Hedge instrument fair value`,
        debit: effectivenessResult.hedgeGainLoss < 0 ? Math.abs(effectivenessResult.hedgeGainLoss) : 0,
        credit: effectivenessResult.hedgeGainLoss > 0 ? effectivenessResult.hedgeGainLoss : 0,
        currency: designation.hedgeInstrument.currency
      }
    ],
    totalDebits: Math.abs(effectivenessResult.hedgeGainLoss),
    totalCredits: Math.abs(effectivenessResult.hedgeGainLoss),
    currency: designation.hedgeInstrument.currency,
    status: 'draft'
  };

  entries.push(ociEntry);

  return entries;
}
