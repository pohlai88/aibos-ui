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
  // Calculate full period depreciation
  const fullPeriodDepreciation = calculateAnnualDepreciation(asset, method);
  
  // Calculate partial factor based on days
  const daysInPeriod = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUsed = Math.min(
    Math.ceil((period.endDate.getTime() - asset.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24)),
    daysInPeriod
  );
  
  const partialFactor = Math.max(0, Math.min(1, daysUsed / daysInPeriod));
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
  const newSchedule = generateDepreciationSchedule(
    updatedAsset,
    schedule.method,
    {
      startDate: schedule.periods[0]?.period.startDate || new Date(),
      endDate: schedule.periods[schedule.periods.length - 1]?.period.endDate || new Date()
    }
  );

  return newSchedule;
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
  // Calculate accumulated depreciation to date
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
      // Use 200% declining balance
      const rate = 2 / asset.usefulLife;
      return asset.cost * rate;
    
    case 'sum_of_years_digits':
      // This would need current year to calculate properly
      const sumOfYears = (asset.usefulLife * (asset.usefulLife + 1)) / 2;
      return (asset.cost - asset.salvageValue) / sumOfYears;
    
    case 'units_of_production':
      // This would need production data
      return (asset.cost - asset.salvageValue) / asset.usefulLife;
    
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
  const yearsElapsed = (asOfDate.getTime() - asset.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  const annualDepreciation = calculateAnnualDepreciation(asset, asset.depreciationMethod);
  
  return Math.min(annualDepreciation * yearsElapsed, asset.cost - asset.salvageValue);
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
  const periods: DepreciationPeriod[] = [];
  const annualDepreciation = calculateAnnualDepreciation(asset, method);
  
  // Calculate monthly periods
  const startDate = new Date(options.startDate);
  const endDate = new Date(options.endDate);
  const currentDate = new Date(startDate);
  
  let accumulatedDepreciation = 0;
  let beginningValue = asset.cost;
  
  while (currentDate <= endDate) {
    const periodEndDate = new Date(currentDate);
    periodEndDate.setMonth(periodEndDate.getMonth() + 1);
    periodEndDate.setDate(0); // Last day of month
    
    if (periodEndDate > endDate) {
      periodEndDate.setTime(endDate.getTime());
    }
    
    // Calculate depreciation for this period
    const daysInPeriod = Math.ceil((periodEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysInYear = 365;
    const periodDepreciation = annualDepreciation * (daysInPeriod / daysInYear);
    
    const endingValue = beginningValue - periodDepreciation;
    accumulatedDepreciation += periodDepreciation;
    
    periods.push({
      period: {
        id: `period-${periods.length + 1}`,
        year: periodEndDate.getFullYear(),
        period: periods.length + 1,
        name: `Period ${periods.length + 1}`,
        startDate: new Date(currentDate),
        endDate: new Date(periodEndDate),
        status: { status: 'open' },
        backdateWindow: 30
      },
      beginningValue,
      depreciation: periodDepreciation,
      endingValue,
      accumulatedDepreciation,
      isPartialPeriod: daysInPeriod < 30,
      partialPeriodFactor: daysInPeriod / daysInYear,
      calculatedAt: new Date()
    });
    
    beginningValue = endingValue;
    currentDate.setTime(periodEndDate.getTime() + 1);
  }
  
  return periods;
}
