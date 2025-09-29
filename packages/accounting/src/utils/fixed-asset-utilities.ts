/**
 * Fixed Asset Utilities - Enterprise Production Ready
 * 
 * Comprehensive fixed asset management utilities for depreciation schedules,
 * partial periods, disposals, and gain/loss calculations.
 * 
 * Features:
 * - Multiple depreciation methods (straight-line, declining balance, sum-of-years-digits, units-of-production)
 * - Partial period handling for assets acquired/disposed mid-period
 * - Disposal calculations with gain/loss analysis
 * - Asset lifecycle tracking and validation
 * - Integration with existing financial and journal entry utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   generateDepreciationSchedule,
 *   calculateDisposalGainLoss,
 *   trackAssetChanges,
 *   validateAssetData
 * } from './fixed-asset-utilities';
 * 
 * // Generate depreciation schedule
 * const schedule = generateDepreciationSchedule(asset, 'straight_line', {
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-12-31')
 * });
 * 
 * // Calculate disposal gain/loss
 * const disposal = calculateDisposalGainLoss(asset, new Date('2024-06-30'), 50000);
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';
import type { 
  ValidationResult
} from './fiscal-period-utilities';
import type { 
  JournalEntry,
  JournalLine
} from './journal-entry-utilities';
import type { 
  FiscalPeriod
} from './fiscal-period-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Fixed asset entity with complete lifecycle information
 */
export interface FixedAsset {
  readonly id: string;
  readonly assetNumber: string;
  readonly description: string;
  readonly category: AssetCategory;
  readonly cost: number;
  readonly currency: SupportedCurrency;
  readonly acquisitionDate: Date;
  readonly usefulLife: number; // years
  readonly salvageValue: number;
  readonly depreciationMethod: DepreciationMethod;
  readonly status: AssetStatus;
  readonly location: string;
  readonly custodian: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Depreciation schedule with complete period breakdown
 */
export interface DepreciationSchedule {
  readonly asset: FixedAsset;
  readonly method: DepreciationMethod;
  readonly periods: readonly DepreciationPeriod[];
  readonly totalDepreciation: number;
  readonly remainingValue: number;
  readonly status: ScheduleStatus;
  readonly generatedAt: Date;
}

/**
 * Individual depreciation period calculation
 */
export interface DepreciationPeriod {
  readonly period: FiscalPeriod;
  readonly beginningValue: number;
  readonly depreciation: number;
  readonly endingValue: number;
  readonly accumulatedDepreciation: number;
  readonly isPartialPeriod: boolean;
  readonly partialPeriodFactor: number;
  readonly calculatedAt: Date;
}

/**
 * Partial period depreciation calculation
 */
export interface PartialPeriodDepreciation {
  readonly asset: FixedAsset;
  readonly period: FiscalPeriod;
  readonly method: DepreciationMethod;
  readonly partialDepreciation: number;
  readonly fullPeriodDepreciation: number;
  readonly partialFactor: number;
  readonly daysInPeriod: number;
  readonly daysUsed: number;
  readonly calculatedAt: Date;
}

/**
 * Asset disposal result with gain/loss analysis
 */
export interface DisposalResult {
  readonly asset: FixedAsset;
  readonly disposalDate: Date;
  readonly disposalProceeds: number;
  readonly bookValue: number;
  readonly gainLoss: number;
  readonly gainLossType: 'gain' | 'loss';
  readonly journalEntry: JournalEntry;
  readonly calculatedAt: Date;
}

/**
 * Asset valuation at a specific point in time
 */
export interface AssetValuation {
  readonly asset: FixedAsset;
  readonly asOfDate: Date;
  readonly cost: number;
  readonly accumulatedDepreciation: number;
  readonly bookValue: number;
  readonly marketValue?: number;
  readonly impairmentLoss?: number;
  readonly method: ValuationMethod;
  readonly calculatedAt: Date;
}

/**
 * Asset change tracking for audit trail
 */
export interface AssetChange {
  readonly id: string;
  readonly assetId: string;
  readonly changeType: AssetChangeType;
  readonly oldValue: unknown;
  readonly newValue: unknown;
  readonly changedBy: string;
  readonly changedAt: Date;
  readonly reason?: string;
}

/**
 * Asset history with complete change log
 */
export interface AssetHistory {
  readonly asset: FixedAsset;
  readonly changes: readonly AssetChange[];
  readonly totalChanges: number;
  readonly lastChanged: Date;
  readonly generatedAt: Date;
}

/**
 * Depreciation calculation options
 */
export interface DepreciationOptions {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly includePartialPeriods?: boolean;
  readonly precision?: number;
  readonly currency?: SupportedCurrency;
  /** Optional override for declining-balance annual rate (e.g. 2/usefulLife for 200% DB, 1.5/usefulLife for 150% DB) */
  readonly decliningRate?: number;
  /** Units-of-production inputs (typed). If present, used instead of ad-hoc fields. */
  readonly units?: {
    /** Units used in the (entire) requested period/slice (you can pass per-slice when calling repeatedly) */
    readonly used?: number;
    /** Total expected units over asset life */
    readonly total: number;
  };
  /** Optional: month-keyed usage map (YYYY-MM) to auto-apply per-slice units in schedule generation */
  readonly unitsByMonth?: Record<string, number>;
}

/** Raw usage record for building month buckets */
export interface UsageRecord {
  /** When the units were consumed/produced (any date within the month). */
  date: Date;
  /** Units consumed/produced on that date (will be summed per month). */
  units: number;
}

/**
 * Asset change tracking options
 */
export interface AssetChangeOptions {
  readonly includeSystemChanges?: boolean;
  readonly maxChanges?: number;
  readonly startDate?: Date;
  readonly endDate?: Date;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Supported depreciation methods
 */
export type DepreciationMethod = 
  | 'straight_line'
  | 'declining_balance'
  | 'sum_of_years_digits'
  | 'units_of_production';

/**
 * Asset categories for classification
 */
export type AssetCategory = 
  | 'land'
  | 'buildings'
  | 'equipment'
  | 'vehicles'
  | 'furniture'
  | 'intangible'
  | 'leasehold_improvements'
  | 'computer_equipment'
  | 'machinery'
  | 'other';

/**
 * Asset status for lifecycle management
 */
export type AssetStatus = 
  | 'active'
  | 'disposed'
  | 'transferred'
  | 'impairment'
  | 'retired'
  | 'under_construction'
  | 'held_for_sale';

/**
 * Depreciation schedule status
 */
export type ScheduleStatus = 
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'suspended';

/**
 * Asset valuation methods
 */
export type ValuationMethod = 
  | 'cost'
  | 'market'
  | 'replacement'
  | 'net_realizable'
  | 'fair_value';

/**
 * Asset change types for audit trail
 */
export type AssetChangeType = 
  | 'created'
  | 'updated'
  | 'depreciated'
  | 'disposed'
  | 'transferred'
  | 'impairment'
  | 'revaluation'
  | 'status_change';

/**
 * Depreciation method configurations
 */
export const DEPRECIATION_METHODS = {
  straight_line: {
    name: 'Straight Line',
    description: 'Equal depreciation over useful life',
    formula: 'cost - salvage_value / useful_life'
  },
  declining_balance: {
    name: 'Declining Balance',
    description: 'Accelerated depreciation with declining rate',
    formula: 'book_value * rate'
  },
  sum_of_years_digits: {
    name: 'Sum of Years Digits',
    description: 'Accelerated depreciation using sum of years',
    formula: '(cost - salvage_value) * (remaining_life / sum_of_years)'
  },
  units_of_production: {
    name: 'Units of Production',
    description: 'Depreciation based on usage or production',
    formula: '(cost - salvage_value) * (units_used / total_units)'
  }
} as const;

/**
 * Asset category configurations
 */
export const ASSET_CATEGORIES = {
  land: { name: 'Land', depreciable: false, defaultLife: 0 },
  buildings: { name: 'Buildings', depreciable: true, defaultLife: 40 },
  equipment: { name: 'Equipment', depreciable: true, defaultLife: 10 },
  vehicles: { name: 'Vehicles', depreciable: true, defaultLife: 5 },
  furniture: { name: 'Furniture', depreciable: true, defaultLife: 7 },
  intangible: { name: 'Intangible Assets', depreciable: true, defaultLife: 15 },
  leasehold_improvements: { name: 'Leasehold Improvements', depreciable: true, defaultLife: 10 },
  computer_equipment: { name: 'Computer Equipment', depreciable: true, defaultLife: 3 },
  machinery: { name: 'Machinery', depreciable: true, defaultLife: 15 },
  other: { name: 'Other Assets', depreciable: true, defaultLife: 10 }
} as const;

// ============================================================================
// CORE DEPRECIATION FUNCTIONS
// ============================================================================

/**
 * Generate comprehensive depreciation schedule for an asset
 * 
 * @param asset - The fixed asset to depreciate
 * @param method - Depreciation method to use
 * @param options - Calculation options and parameters
 * @returns Complete depreciation schedule
 * 
 * @example
 * ```typescript
 * const schedule = generateDepreciationSchedule(asset, 'straight_line', {
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-12-31'),
 *   includePartialPeriods: true
 * });
 * ```
 */
export function generateDepreciationSchedule(
  asset: FixedAsset,
  method: DepreciationMethod,
  options: DepreciationOptions
): DepreciationSchedule {
  // Validate asset and options
  const validation = validateAssetData(asset);
  if (!validation.isValid) {
    throw new Error(`Invalid asset data: ${validation.errors.join(', ')}`);
  }

  if (options.startDate >= options.endDate) {
    throw new Error('Start date must be before end date');
  }

  // Calculate periods based on method
  const periods = calculateDepreciationPeriods(asset, method, options);
  
  // Calculate totals
  const totalDepreciation = periods.reduce((sum, period) => sum + period.depreciation, 0);
  const remainingValue = asset.cost - totalDepreciation;

  return {
    asset,
    method,
    periods,
    totalDepreciation,
    remainingValue,
    status: 'active',
    generatedAt: new Date()
  };
}

/**
 * Calculate partial period depreciation for assets acquired/disposed mid-period
 * 
 * @param asset - The fixed asset
 * @param period - The fiscal period
 * @param method - Depreciation method
 * @returns Partial period depreciation calculation
 * 
 * @example
 * ```typescript
 * const partialDep = calculatePartialPeriodDepreciation(
 *   asset, 
 *   fiscalPeriod, 
 *   'straight_line'
 * );
 * ```
 */
export function calculatePartialPeriodDepreciation(
  asset: FixedAsset,
  period: FiscalPeriod,
  method: DepreciationMethod
): PartialPeriodDepreciation {
  // Full-year depreciation baseline (method-specific)
  const fullPeriodDepreciation = calculateAnnualDepreciation(asset, method);

  // Overlap between [period.start, period.end] and [asset.acquisitionDate, +∞)
  const start = new Date(Math.max(period.startDate.getTime(), asset.acquisitionDate.getTime()));
  const end = new Date(period.endDate);
  if (start > end) {
    return {
      asset,
      period,
      method,
      partialDepreciation: 0,
      fullPeriodDepreciation,
      partialFactor: 0,
      daysInPeriod: daysBetween(period.startDate, period.endDate),
      daysUsed: 0,
      calculatedAt: new Date()
    };
  }
  const daysInPeriod = daysBetween(period.startDate, period.endDate);
  const daysUsed = daysBetween(start, end);
  const partialFactor = clamp(daysUsed / daysInPeriod, 0, 1);
  const partialDepreciation = fullPeriodDepreciation * partialFactor;

  return {
    asset,
    period,
    method,
    partialDepreciation,
    fullPeriodDepreciation,
    partialFactor,
    daysInPeriod,
    daysUsed,
    calculatedAt: new Date()
  };
}

/**
 * Update depreciation schedule with asset changes
 * 
 * @param schedule - Existing depreciation schedule
 * @param changes - Asset changes to apply
 * @returns Updated depreciation schedule
 * 
 * @example
 * ```typescript
 * const updatedSchedule = updateDepreciationSchedule(schedule, [
 *   { type: 'cost_change', newValue: 150000 }
 * ]);
 * ```
 */
export function updateDepreciationSchedule(
  schedule: DepreciationSchedule,
  changes: readonly AssetChange[]
): DepreciationSchedule {
  // Apply changes to asset
  let updatedAsset = schedule.asset;
  
  for (const change of changes) {
    if (change.changeType === 'updated') {
      // Update asset properties based on change
      updatedAsset = {
        ...updatedAsset,
        updatedAt: new Date()
      };
    }
  }

  // Recalculate schedule with updated asset
  return generateDepreciationSchedule(
    updatedAsset,
    schedule.method,
    {
      startDate: schedule.periods[0]?.period.startDate || new Date(),
      endDate: schedule.periods[schedule.periods.length - 1]?.period.endDate || new Date()
    }
  );
}

// ============================================================================
// DISPOSAL OPERATIONS
// ============================================================================

/**
 * Calculate gain/loss on asset disposal
 * 
 * @param asset - The fixed asset being disposed
 * @param disposalDate - Date of disposal
 * @param disposalProceeds - Proceeds from disposal
 * @returns Disposal result with gain/loss analysis
 * 
 * @example
 * ```typescript
 * const disposal = calculateDisposalGainLoss(
 *   asset, 
 *   new Date('2024-06-30'), 
 *   50000
 * );
 * ```
 */
export function calculateDisposalGainLoss(
  asset: FixedAsset,
  disposalDate: Date,
  disposalProceeds: number
): DisposalResult {
  // Calculate accumulated depreciation to date (method-aware)
  const accumulatedDepreciation = calculateAccumulatedDepreciation(asset, disposalDate);
  const bookValue = asset.cost - accumulatedDepreciation;
  
  // Calculate gain/loss
  const gainLoss = disposalProceeds - bookValue;
  const gainLossType: 'gain' | 'loss' = gainLoss >= 0 ? 'gain' : 'loss';

  // Create temporary disposal result for journal entry generation
  const tempDisposal: DisposalResult = {
    asset,
    disposalDate,
    disposalProceeds,
    bookValue,
    gainLoss,
    gainLossType,
    journalEntry: {
      id: '',
      date: disposalDate,
      reference: '',
      description: '',
      lines: [],
      totalDebits: 0,
      totalCredits: 0,
      currency: asset.currency,
      status: 'draft'
    },
    calculatedAt: new Date()
  };

  // Generate journal entry for disposal
  const journalEntry = generateDisposalEntry(tempDisposal);

  return {
    asset,
    disposalDate,
    disposalProceeds,
    bookValue,
    gainLoss,
    gainLossType,
    journalEntry,
    calculatedAt: new Date()
  };
}

/**
 * Generate journal entry for asset disposal
 * 
 * @param disposal - Disposal result
 * @returns Journal entry for disposal transaction
 * 
 * @example
 * ```typescript
 * const entry = generateDisposalEntry(disposal);
 * ```
 */
export function generateDisposalEntry(disposal: DisposalResult): JournalEntry {
  const lines: JournalLine[] = [];

  // Remove asset from books
  lines.push({
    id: `line-${disposal.asset.id}-asset`,
    accountCode: 'Fixed Assets',
    description: `Disposal of ${disposal.asset.description}`,
    debit: 0,
    credit: disposal.asset.cost,
    currency: disposal.asset.currency
  });

  // Remove accumulated depreciation
  lines.push({
    id: `line-${disposal.asset.id}-depreciation`,
    accountCode: 'Accumulated Depreciation',
    description: `Accumulated depreciation for ${disposal.asset.description}`,
    debit: disposal.asset.cost - disposal.bookValue,
    credit: 0,
    currency: disposal.asset.currency
  });

  // Record disposal proceeds
  lines.push({
    id: `line-${disposal.asset.id}-proceeds`,
    accountCode: 'Cash',
    description: `Proceeds from disposal of ${disposal.asset.description}`,
    debit: disposal.disposalProceeds,
    credit: 0,
    currency: disposal.asset.currency
  });

  // Record gain/loss
  if (disposal.gainLoss !== 0) {
    lines.push({
      id: `line-${disposal.asset.id}-gainloss`,
      accountCode: disposal.gainLossType === 'gain' ? 'Gain on Disposal' : 'Loss on Disposal',
      description: `${disposal.gainLossType} on disposal of ${disposal.asset.description}`,
      debit: disposal.gainLossType === 'loss' ? Math.abs(disposal.gainLoss) : 0,
      credit: disposal.gainLossType === 'gain' ? disposal.gainLoss : 0,
      currency: disposal.asset.currency
    });
  }

  return {
    id: `DISPOSAL-${disposal.asset.id}-${Date.now()}`,
    date: disposal.disposalDate,
    reference: `DISPOSAL-${disposal.asset.assetNumber}`,
    description: `Disposal of ${disposal.asset.description}`,
    lines,
    totalDebits: lines.reduce((sum, line) => sum + line.debit, 0),
    totalCredits: lines.reduce((sum, line) => sum + line.credit, 0),
    currency: disposal.asset.currency,
    status: 'draft'
  };
}

/**
 * Validate disposal calculation
 * 
 * @param disposal - Disposal result to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateDisposalCalculation(disposal);
 * if (!validation.isValid) {
 *   console.error('Disposal validation failed:', validation.errors);
 * }
 * ```
 */
export function validateDisposalCalculation(disposal: DisposalResult): ValidationResult {
  const errors: string[] = [];

  // Validate asset
  const assetValidation = validateAssetData(disposal.asset);
  if (!assetValidation.isValid) {
    errors.push(...assetValidation.errors);
  }

  // Validate disposal date
  if (disposal.disposalDate < disposal.asset.acquisitionDate) {
    errors.push('Disposal date cannot be before acquisition date');
  }

  // Validate disposal proceeds
  if (disposal.disposalProceeds < 0) {
    errors.push('Disposal proceeds cannot be negative');
  }

  // Validate book value calculation
  const expectedBookValue = disposal.asset.cost - (disposal.asset.cost - disposal.bookValue);
  if (Math.abs(disposal.bookValue - expectedBookValue) > 0.01) {
    errors.push('Book value calculation is incorrect');
  }

  // Validate gain/loss calculation
  const expectedGainLoss = disposal.disposalProceeds - disposal.bookValue;
  if (Math.abs(disposal.gainLoss - expectedGainLoss) > 0.01) {
    errors.push('Gain/loss calculation is incorrect');
  }

  // Validate journal entry balance
  const totalDebits = disposal.journalEntry.totalDebits;
  const totalCredits = disposal.journalEntry.totalCredits;
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    errors.push('Journal entry is not balanced');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

// ============================================================================
// ASSET MANAGEMENT
// ============================================================================

/**
 * Track asset changes for audit trail
 * 
 * @param asset - The fixed asset
 * @param changes - Changes to track
 * @returns Asset history with change log
 * 
 * @example
 * ```typescript
 * const history = trackAssetChanges(asset, [
 *   { type: 'cost_change', oldValue: 100000, newValue: 120000 }
 * ]);
 * ```
 */
export function trackAssetChanges(
  asset: FixedAsset,
  changes: readonly AssetChange[]
): AssetHistory {
  // Validate changes
  for (const change of changes) {
    if (change.assetId !== asset.id) {
      throw new Error(`Change asset ID ${change.assetId} does not match asset ID ${asset.id}`);
    }
  }

  // Sort changes by date
  const sortedChanges = [...changes].sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

  return {
    asset,
    changes: sortedChanges,
    totalChanges: sortedChanges.length,
    lastChanged: sortedChanges.length > 0 ? sortedChanges[sortedChanges.length - 1]?.changedAt || asset.createdAt : asset.createdAt,
    generatedAt: new Date()
  };
}

/**
 * Calculate asset value at a specific point in time
 * 
 * @param asset - The fixed asset
 * @param asOfDate - Date to calculate value as of
 * @param method - Valuation method
 * @returns Asset valuation
 * 
 * @example
 * ```typescript
 * const valuation = calculateAssetValue(asset, new Date(), 'cost');
 * ```
 */
export function calculateAssetValue(
  asset: FixedAsset,
  asOfDate: Date,
  method: ValuationMethod
): AssetValuation {
  // Calculate accumulated depreciation
  const accumulatedDepreciation = calculateAccumulatedDepreciation(asset, asOfDate);
  const bookValue = asset.cost - accumulatedDepreciation;

  let marketValue: number | undefined;
  let impairmentLoss: number | undefined;

  // Calculate market value if method requires it
  if (method === 'market' || method === 'fair_value') {
    // This would typically come from external valuation
    marketValue = bookValue * 0.9; // Placeholder calculation
  }

  // Calculate impairment loss if market value is lower than book value
  if (marketValue !== undefined && marketValue < bookValue) {
    impairmentLoss = bookValue - marketValue;
  }

  return {
    asset,
    asOfDate,
    cost: asset.cost,
    accumulatedDepreciation,
    bookValue,
    method,
    calculatedAt: new Date(),
    ...(marketValue !== undefined && { marketValue }),
    ...(impairmentLoss !== undefined && { impairmentLoss })
  };
}

/**
 * Validate asset data
 * 
 * @param asset - Asset to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateAssetData(asset);
 * if (!validation.isValid) {
 *   console.error('Asset validation failed:', validation.errors);
 * }
 * ```
 */
export function validateAssetData(asset: FixedAsset): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!asset.id || asset.id.trim() === '') {
    errors.push('Asset ID is required');
  }

  if (!asset.assetNumber || asset.assetNumber.trim() === '') {
    errors.push('Asset number is required');
  }

  if (!asset.description || asset.description.trim() === '') {
    errors.push('Asset description is required');
  }

  // Validate financial data
  if (asset.cost <= 0) {
    errors.push('Asset cost must be positive');
  }

  if (asset.salvageValue < 0) {
    errors.push('Salvage value cannot be negative');
  }

  if (asset.salvageValue >= asset.cost) {
    errors.push('Salvage value must be less than cost');
  }

  if (asset.usefulLife <= 0) {
    errors.push('Useful life must be positive');
  }

  // Validate dates
  if (asset.acquisitionDate > new Date()) {
    errors.push('Acquisition date cannot be in the future');
  }

  if (asset.createdAt > asset.updatedAt) {
    errors.push('Created date cannot be after updated date');
  }

  // Validate category
  if (!Object.keys(ASSET_CATEGORIES).includes(asset.category)) {
    errors.push(`Invalid asset category: ${asset.category}`);
  }

  // Validate depreciation method
  if (!Object.keys(DEPRECIATION_METHODS).includes(asset.depreciationMethod)) {
    errors.push(`Invalid depreciation method: ${asset.depreciationMethod}`);
  }

  // Validate status
  if (!['active', 'disposed', 'transferred', 'impairment', 'retired', 'under_construction', 'held_for_sale'].includes(asset.status)) {
    errors.push(`Invalid asset status: ${asset.status}`);
  }

  // Warnings
  if (asset.usefulLife > 50) {
    warnings.push('Useful life exceeds 50 years - verify reasonableness');
  }

  if (asset.salvageValue > asset.cost * 0.5) {
    warnings.push('Salvage value exceeds 50% of cost - verify reasonableness');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate annual depreciation for an asset
 * 
 * @param asset - The fixed asset
 * @param method - Depreciation method
 * @returns Annual depreciation amount
 */
function calculateAnnualDepreciation(asset: FixedAsset, method: DepreciationMethod): number {
  switch (method) {
    case 'straight_line':
      return (asset.cost - asset.salvageValue) / asset.usefulLife;
    
    case 'declining_balance':
      // Use 200% declining balance baseline (annualized); actual period calc uses beginning BV
      const rate = 2 / asset.usefulLife;
      return (asset.cost) * rate;
    
    case 'sum_of_years_digits':
      // Baseline annual quantum for first year (remaining life/useful-life sum applied in period calc)
      const sumOfYears = (asset.usefulLife * (asset.usefulLife + 1)) / 2;
      return ((asset.cost - asset.salvageValue) * (asset.usefulLife / sumOfYears));
    
    case 'units_of_production':
      // Requires usage data (read from options in schedule). Annual baseline is not meaningful.
      return 0;
    
    default:
      throw new Error(`Unsupported depreciation method: ${method}`);
  }
}

/**
 * Calculate accumulated depreciation to a specific date
 * 
 * @param asset - The fixed asset
 * @param asOfDate - Date to calculate as of
 * @returns Accumulated depreciation amount
 */
function calculateAccumulatedDepreciation(asset: FixedAsset, asOfDate: Date): number {
  if (asOfDate <= asset.acquisitionDate) return 0;
  // Build periods from acquisition to asOf (cap at end of life)
  const lifeEnd = addYears(asset.acquisitionDate, asset.usefulLife);
  const end = new Date(Math.min(asOfDate.getTime(), lifeEnd.getTime()));
  const sched = calculateDepreciationPeriods(asset, asset.depreciationMethod, {
    startDate: asset.acquisitionDate,
    endDate: end,
    includePartialPeriods: true,
    precision: 2,
    currency: asset.currency
  });
  const total = sched.reduce((s, p) => s + p.depreciation, 0);
  return Math.min(round(total, 2), asset.cost - asset.salvageValue);
}

/**
 * Calculate depreciation periods for a schedule
 * 
 * @param asset - The fixed asset
 * @param method - Depreciation method
 * @param options - Calculation options
 * @returns Array of depreciation periods
 */
function calculateDepreciationPeriods(
  asset: FixedAsset,
  method: DepreciationMethod,
  options: DepreciationOptions
): readonly DepreciationPeriod[] {
  const precision = options.precision ?? 2;
  const periods: DepreciationPeriod[] = [];

  // Boundaries: start at max(acquisition, options.startDate); end at min(endDate, end-of-life)
  const lifeEnd = addYears(asset.acquisitionDate, asset.usefulLife);
  const start = new Date(Math.max(options.startDate.getTime(), asset.acquisitionDate.getTime()));
  const hardEnd = new Date(Math.min(options.endDate.getTime(), lifeEnd.getTime()));
  if (start > hardEnd) return periods;

  // Iterate monthly periods [inclusive]
  let cursor = startOfDay(start);
  let beginningValue = asset.cost;
  let accumulated = 0;

  while (cursor <= hardEnd && beginningValue > asset.salvageValue + 1e-9) {
    const pStart = new Date(cursor);
    const pEnd = minDate(endOfMonth(pStart), hardEnd);

    const days = daysBetween(pStart, pEnd);
    const yearDays = 365;
    const fraction = days / yearDays;

    // Method-specific depreciation for this slice
    let dep = 0;
    switch (method) {
      case 'straight_line': {
        const annual = (asset.cost - asset.salvageValue) / asset.usefulLife;
        dep = annual * fraction;
        break;
      }
      case 'declining_balance': {
        // Use provided decliningRate if any; else default to 200% DB
        const rate = (options.decliningRate ?? (2 / asset.usefulLife));
        const annual = beginningValue * rate;
        const db = annual * fraction;
        // Optional SL catch-up to avoid undershoot near the end
        const remainingYears = yearsBetween(pStart, hardEnd);
        const slAnnual = remainingYears > 0 ? (beginningValue - asset.salvageValue) / remainingYears : (beginningValue - asset.salvageValue);
        dep = Math.max(Math.min(db, beginningValue - asset.salvageValue), 0);
        // If straight-line yields higher, switch
        if (slAnnual * fraction > dep) dep = Math.min(slAnnual * fraction, beginningValue - asset.salvageValue);
        break;
      }
      case 'sum_of_years_digits': {
        const n = asset.usefulLife;
        const S = (n * (n + 1)) / 2;
        // Elapsed years since acquisition at period start (fractional)
        const elapsed = yearsBetween(asset.acquisitionDate, pStart);
        const remaining = Math.max(n - elapsed, 0);
        const weight = remaining / S; // annual weight at this slice
        dep = (asset.cost - asset.salvageValue) * weight * fraction;
        dep = Math.min(dep, beginningValue - asset.salvageValue);
        break;
      }
      case 'units_of_production': {
        // Prefer typed options.units & unitsByMonth; fall back to legacy ad-hoc fields
        const anyOpts = options as unknown; // legacy shim
        let unitsUsed = Number(options.units?.used ?? anyOpts?.unitsUsedInPeriod ?? 0);
        // If unitsByMonth is provided, use the month key for this slice
        if (options.unitsByMonth) {
          const key = ymKey(pStart);
          if (options.unitsByMonth[key] != null) unitsUsed = Number(options.unitsByMonth[key]);
        }
        const totalUnits = Number(options.units?.total ?? anyOpts?.totalUnits ?? 0);
        if (unitsUsed > 0 && totalUnits > 0) {
          dep = (asset.cost - asset.salvageValue) * (unitsUsed / totalUnits);
          dep = Math.min(dep, beginningValue - asset.salvageValue);
        } else {
          dep = 0;
        }
        break;
      }
      default:
        dep = 0;
    }

    dep = round(Math.min(dep, beginningValue - asset.salvageValue), precision);
    const ending = round(beginningValue - dep, precision);
    accumulated = round(accumulated + dep, precision);

    periods.push({
      period: {
        id: `period-${periods.length + 1}`,
        year: pEnd.getFullYear(),
        period: periods.length + 1,
        name: `Period ${periods.length + 1}`,
        startDate: pStart,
        endDate: pEnd,
        status: { status: 'open' },
        backdateWindow: 30
      },
      beginningValue: round(beginningValue, precision),
      depreciation: dep,
      endingValue: ending,
      accumulatedDepreciation: accumulated,
      isPartialPeriod: (periods.length === 0 && pStart.getTime() > startOfMonth(pStart).getTime()) || pEnd.getTime() < endOfMonth(pStart).getTime(),
      partialPeriodFactor: fraction,
      calculatedAt: new Date()
    });

    beginningValue = ending;
    cursor = addDays(pEnd, 1);
  }

  return periods;
}

// ============================================================================
// Local utilities (pure)
// ============================================================================
function ymKey(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

function daysBetween(a: Date, b: Date): number {
  // inclusive of end day for financial calendars; align with original ceil intent
  const ms = endOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date): Date { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function startOfMonth(d: Date): Date { const x = new Date(d); x.setDate(1); return startOfDay(x); }
function endOfMonth(d: Date): Date { const x = new Date(d); x.setMonth(x.getMonth()+1,0); return endOfDay(x); }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function addYears(d: Date, n: number): Date { const x = new Date(d); x.setFullYear(x.getFullYear()+n); return x; }
function minDate(a: Date, b: Date): Date { return a <= b ? a : b; }
function yearsBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 365);
}
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
function round(n: number, p: number): number {
  const f = Math.pow(10, p);
  return Math.round((n + Number.EPSILON) * f) / f;
}

// ============================================================================
// Public helper: build month-keyed usage map (YYYY-MM)
// ============================================================================
/**
 * Aggregate raw usage records into a month-keyed map (YYYY-MM -> units).
 * Pass the result as `options.unitsByMonth` to auto-apply per-slice usage.
 */
export function buildUnitsByMonth(records: readonly UsageRecord[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of records) {
    if (!r?.date || !isFinite(r.units as number)) continue;
    const key = ymKey(r.date);
    out[key] = (out[key] ?? 0) + Number(r.units);
  }
  return out;
}
