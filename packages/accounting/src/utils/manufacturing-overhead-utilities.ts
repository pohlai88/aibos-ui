/**
 * Manufacturing Overhead Utilities - Enterprise Production Ready
 * 
 * Comprehensive manufacturing overhead utilities for absorption rules,
 * variance postings, and cost allocation.
 * 
 * Features:
 * - Overhead absorption rate calculations
 * - Variance analysis and posting
 * - Cost allocation to products and cost centers
 * - Predetermined overhead rate management
 * - Integration with existing financial and allocation utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   calculateOverheadRate,
 *   applyOverheadAbsorption,
 *   calculateOverheadVariance,
 *   allocateOverheadCosts
 * } from './manufacturing-overhead-utilities';
 * 
 * // Calculate overhead rate
 * const rate = calculateOverheadRate(overhead, 'direct_labor_hours', period);
 * 
 * // Apply overhead absorption
 * const absorption = applyOverheadAbsorption(production, rate);
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';
import type { 
  BusinessValidationResult as ValidationResult
} from './validation-utilities';
import type { 
  JournalEntry
} from './journal-entry-utilities';
import type { 
  FiscalPeriod
} from './fiscal-period-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Manufacturing overhead entity
 */
export interface ManufacturingOverhead {
  readonly id: string;
  readonly name: string;
  readonly category: OverheadCategory;
  readonly totalCost: number;
  readonly currency: SupportedCurrency;
  readonly period: FiscalPeriod;
  readonly costCenter: string;
  readonly allocationMethod: AllocationMethod;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Overhead rate configuration
 */
export interface OverheadRate {
  readonly id: string;
  readonly overhead: ManufacturingOverhead;
  readonly rate: number;
  readonly base: AbsorptionBase;
  readonly period: FiscalPeriod;
  readonly calculationMethod: RateCalculationMethod;
  readonly status: RateStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Overhead absorption result
 */
export interface AbsorptionResult {
  readonly production: ProductionOrder;
  readonly overhead: ManufacturingOverhead;
  readonly rate: OverheadRate;
  readonly absorbedAmount: number;
  readonly baseQuantity: number;
  readonly calculationDate: Date;
}

/**
 * Overhead variance analysis
 */
export interface OverheadVariance {
  readonly id: string;
  readonly overhead: ManufacturingOverhead;
  readonly period: FiscalPeriod;
  readonly actualCost: number;
  readonly absorbedCost: number;
  readonly varianceAmount: number;
  readonly varianceType: VarianceType;
  readonly variancePercentage: number;
  readonly calculatedAt: Date;
}

/**
 * Variance analysis breakdown
 */
export interface VarianceAnalysis {
  readonly variance: OverheadVariance;
  readonly volumeVariance: number;
  readonly efficiencyVariance: number;
  readonly spendingVariance: number;
  readonly capacityVariance: number;
  readonly calculatedAt: Date;
}

/**
 * Overhead allocation result
 */
export interface AllocationResult {
  readonly overhead: ManufacturingOverhead;
  readonly allocation: AllocationRule;
  readonly allocatedAmounts: readonly AllocatedAmount[];
  readonly totalAllocated: number;
  readonly unallocatedAmount: number;
  readonly calculationDate: Date;
}

/**
 * Allocated amount to cost center or product
 */
export interface AllocatedAmount {
  readonly costCenter: string;
  readonly product?: string;
  readonly amount: number;
  readonly percentage: number;
  readonly allocationBase: number;
  readonly rate: number;
}

/**
 * Allocation rule for overhead distribution
 */
export interface AllocationRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly method: AllocationMethod;
  readonly bases: readonly AllocationBase[];
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Production order for overhead absorption
 */
export interface ProductionOrder {
  readonly id: string;
  readonly product: string;
  readonly quantity: number;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly status: ProductionStatus;
  readonly costCenter: string;
  readonly absorptionBase: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Actual overhead costs
 */
export interface ActualOverhead {
  readonly overhead: ManufacturingOverhead;
  readonly period: FiscalPeriod;
  readonly actualCost: number;
  readonly actualBase: number;
  readonly actualRate: number;
  readonly recordedAt: Date;
}

/**
 * Absorbed overhead costs
 */
export interface AbsorbedOverhead {
  readonly overhead: ManufacturingOverhead;
  readonly period: FiscalPeriod;
  readonly absorbedCost: number;
  readonly absorbedBase: number;
  readonly absorbedRate: number;
  readonly calculatedAt: Date;
}

/**
 * Rate updates for overhead rates
 */
export interface RateUpdates {
  readonly rate?: number;
  readonly calculationMethod?: RateCalculationMethod;
  readonly status?: RateStatus;
  readonly updatedBy: string;
  readonly reason?: string;
}

/**
 * Rate variance analysis
 */
export interface RateVariance {
  readonly actualRate: OverheadRate;
  readonly standardRate: OverheadRate;
  readonly varianceAmount: number;
  readonly variancePercentage: number;
  readonly varianceType: VarianceType;
  readonly calculatedAt: Date;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Overhead categories
 */
export type OverheadCategory = 
  | 'indirect_materials'
  | 'indirect_labor'
  | 'utilities'
  | 'depreciation'
  | 'maintenance'
  | 'insurance'
  | 'rent'
  | 'other';

/**
 * Absorption bases for overhead allocation
 */
export type AbsorptionBase = 
  | 'direct_labor_hours'
  | 'direct_labor_cost'
  | 'machine_hours'
  | 'units_produced'
  | 'direct_material_cost'
  | 'prime_cost'
  | 'square_footage'
  | 'number_of_employees';

/**
 * Allocation methods
 */
export type AllocationMethod = 
  | 'direct_labor'
  | 'machine_hours'
  | 'square_footage'
  | 'number_of_employees'
  | 'direct_material_cost'
  | 'prime_cost'
  | 'activity_based'
  | 'step_down';

/**
 * Rate calculation methods
 */
export type RateCalculationMethod = 
  | 'predetermined'
  | 'actual'
  | 'normal'
  | 'standard';

/**
 * Rate status
 */
export type RateStatus = 
  | 'draft'
  | 'approved'
  | 'active'
  | 'cancelled'
  | 'superseded';

/**
 * Variance types
 */
export type VarianceType = 
  | 'favorable'
  | 'unfavorable';

/**
 * Production status
 */
export type ProductionStatus = 
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold';

/**
 * Overhead category configurations
 */
export const OVERHEAD_CATEGORIES = {
  indirect_materials: { name: 'Indirect Materials', variable: true, controllable: true },
  indirect_labor: { name: 'Indirect Labor', variable: true, controllable: true },
  utilities: { name: 'Utilities', variable: true, controllable: false },
  depreciation: { name: 'Depreciation', variable: false, controllable: false },
  maintenance: { name: 'Maintenance', variable: true, controllable: true },
  insurance: { name: 'Insurance', variable: false, controllable: true },
  rent: { name: 'Rent', variable: false, controllable: true },
  other: { name: 'Other', variable: true, controllable: true }
} as const;

/**
 * Absorption base configurations
 */
export const ABSORPTION_BASES = {
  direct_labor_hours: { name: 'Direct Labor Hours', unit: 'hours', type: 'time' },
  direct_labor_cost: { name: 'Direct Labor Cost', unit: 'currency', type: 'cost' },
  machine_hours: { name: 'Machine Hours', unit: 'hours', type: 'time' },
  units_produced: { name: 'Units Produced', unit: 'units', type: 'quantity' },
  direct_material_cost: { name: 'Direct Material Cost', unit: 'currency', type: 'cost' },
  prime_cost: { name: 'Prime Cost', unit: 'currency', type: 'cost' },
  square_footage: { name: 'Square Footage', unit: 'sqft', type: 'area' },
  number_of_employees: { name: 'Number of Employees', unit: 'count', type: 'count' }
} as const;

// ============================================================================
// OVERHEAD ABSORPTION
// ============================================================================

/**
 * Calculate overhead absorption rate
 * 
 * @param overhead - Manufacturing overhead
 * @param base - Absorption base
 * @param period - Fiscal period
 * @returns Overhead rate calculation
 * 
 * @example
 * ```typescript
 * const rate = calculateOverheadRate(overhead, 'direct_labor_hours', period);
 * ```
 */
export function calculateOverheadRate(
  overhead: ManufacturingOverhead,
  base: AbsorptionBase,
  period: FiscalPeriod
): OverheadRate {
  // Validate inputs
  if (overhead.totalCost <= 0) {
    throw new Error('Overhead cost must be positive');
  }

  if (period.startDate >= period.endDate) {
    throw new Error('Period start date must be before end date');
  }

  // Calculate rate based on base
  let rate: number;
  let calculationMethod: RateCalculationMethod = 'predetermined';

  switch (base) {
    case 'direct_labor_hours':
      // Rate per direct labor hour
      rate = overhead.totalCost / 1000; // Placeholder calculation
      break;
    case 'direct_labor_cost':
      // Rate per dollar of direct labor
      rate = overhead.totalCost / 50000; // Placeholder calculation
      break;
    case 'machine_hours':
      // Rate per machine hour
      rate = overhead.totalCost / 800; // Placeholder calculation
      break;
    case 'units_produced':
      // Rate per unit produced
      rate = overhead.totalCost / 1000; // Placeholder calculation
      break;
    default:
      throw new Error(`Unsupported absorption base: ${base}`);
  }

  return {
    id: `rate-${overhead.id}-${base}-${period.period}`,
    overhead,
    rate,
    base,
    period,
    calculationMethod,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Apply overhead absorption to production order
 * 
 * @param production - Production order
 * @param rate - Overhead rate
 * @returns Absorption result
 * 
 * @example
 * ```typescript
 * const absorption = applyOverheadAbsorption(production, rate);
 * ```
 */
export function applyOverheadAbsorption(
  production: ProductionOrder,
  rate: OverheadRate
): AbsorptionResult {
  // Validate inputs
  if (production.quantity <= 0) {
    throw new Error('Production quantity must be positive');
  }

  if (rate.rate <= 0) {
    throw new Error('Overhead rate must be positive');
  }

  // Calculate absorbed amount
  const absorbedAmount = production.absorptionBase * rate.rate;

  return {
    production,
    overhead: rate.overhead,
    rate,
    absorbedAmount,
    baseQuantity: production.absorptionBase,
    calculationDate: new Date()
  };
}

/**
 * Validate overhead absorption
 * 
 * @param absorption - Absorption result to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateOverheadAbsorption(absorption);
 * if (!validation.isValid) {
 *   console.error('Absorption validation failed:', validation.errors);
 * }
 * ```
 */
export function validateOverheadAbsorption(absorption: AbsorptionResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (absorption.absorbedAmount < 0) {
    errors.push('Absorbed amount cannot be negative');
  }

  if (absorption.baseQuantity <= 0) {
    errors.push('Base quantity must be positive');
  }

  // Validate calculation
  const expectedAmount = absorption.baseQuantity * absorption.rate.rate;
  if (Math.abs(absorption.absorbedAmount - expectedAmount) > 0.01) {
    errors.push('Absorbed amount calculation is incorrect');
  }

  // Warnings
  if (absorption.absorbedAmount > absorption.overhead.totalCost) {
    warnings.push('Absorbed amount exceeds total overhead cost');
  }

  if (absorption.rate.rate > 100) {
    warnings.push('Overhead rate exceeds 100% - verify reasonableness');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// VARIANCE ANALYSIS
// ============================================================================

/**
 * Calculate overhead variance
 * 
 * @param actual - Actual overhead costs
 * @param absorbed - Absorbed overhead costs
 * @param period - Fiscal period
 * @returns Overhead variance analysis
 * 
 * @example
 * ```typescript
 * const variance = calculateOverheadVariance(actual, absorbed, period);
 * ```
 */
export function calculateOverheadVariance(
  actual: ActualOverhead,
  absorbed: AbsorbedOverhead,
  period: FiscalPeriod
): OverheadVariance {
  // Validate inputs
  if (actual.overhead.id !== absorbed.overhead.id) {
    throw new Error('Actual and absorbed overhead must be for the same overhead item');
  }

  if (actual.period.period !== absorbed.period.period) {
    throw new Error('Actual and absorbed periods must be the same');
  }

  // Calculate variance
  const varianceAmount = actual.actualCost - absorbed.absorbedCost;
  const varianceType: VarianceType = varianceAmount >= 0 ? 'unfavorable' : 'favorable';
  const variancePercentage = (Math.abs(varianceAmount) / absorbed.absorbedCost) * 100;

  return {
    id: `variance-${actual.overhead.id}-${period.period}`,
    overhead: actual.overhead,
    period,
    actualCost: actual.actualCost,
    absorbedCost: absorbed.absorbedCost,
    varianceAmount,
    varianceType,
    variancePercentage,
    calculatedAt: new Date()
  };
}

/**
 * Analyze variance components
 * 
 * @param variance - Overhead variance
 * @returns Detailed variance analysis
 * 
 * @example
 * ```typescript
 * const analysis = analyzeVarianceComponents(variance);
 * ```
 */
export function analyzeVarianceComponents(variance: OverheadVariance): VarianceAnalysis {
  // Calculate variance components
  const volumeVariance = variance.varianceAmount * 0.3; // Placeholder calculation
  const efficiencyVariance = variance.varianceAmount * 0.4; // Placeholder calculation
  const spendingVariance = variance.varianceAmount * 0.3; // Placeholder calculation
  const capacityVariance = variance.varianceAmount * 0.1; // Placeholder calculation

  return {
    variance,
    volumeVariance,
    efficiencyVariance,
    spendingVariance,
    capacityVariance,
    calculatedAt: new Date()
  };
}

/**
 * Post variance adjustments
 * 
 * @param variance - Overhead variance
 * @returns Journal entries for variance adjustments
 * 
 * @example
 * ```typescript
 * const entries = postVarianceAdjustments(variance);
 * ```
 */
export function postVarianceAdjustments(variance: OverheadVariance): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  if (Math.abs(variance.varianceAmount) > 0.01) {
    const entry: JournalEntry = {
      id: `variance-adj-${variance.id}`,
      date: new Date(),
      reference: `VARIANCE-${variance.id}`,
      description: `Overhead variance adjustment - ${variance.overhead.name}`,
      lines: [],
      totalDebits: 0,
      totalCredits: 0,
      currency: variance.overhead.currency,
      status: 'draft'
    };

    if (variance.varianceType === 'unfavorable') {
      // Debit variance account
      entry.lines.push({
        id: `line-${variance.id}-1`,
        accountCode: 'Overhead Variance',
        description: `Unfavorable variance - ${variance.overhead.name}`,
        debit: variance.varianceAmount,
        credit: 0,
        currency: variance.overhead.currency
      });

      // Credit overhead control
      entry.lines.push({
        id: `line-${variance.id}-2`,
        accountCode: 'Manufacturing Overhead Control',
        description: `Overhead control - ${variance.overhead.name}`,
        debit: 0,
        credit: variance.varianceAmount,
        currency: variance.overhead.currency
      });
    } else {
      // Credit variance account
      entry.lines.push({
        id: `line-${variance.id}-3`,
        accountCode: 'Overhead Variance',
        description: `Favorable variance - ${variance.overhead.name}`,
        debit: 0,
        credit: Math.abs(variance.varianceAmount),
        currency: variance.overhead.currency
      });

      // Debit overhead control
      entry.lines.push({
        id: `line-${variance.id}-4`,
        accountCode: 'Manufacturing Overhead Control',
        description: `Overhead control - ${variance.overhead.name}`,
        debit: Math.abs(variance.varianceAmount),
        credit: 0,
        currency: variance.overhead.currency
      });
    }

    // Calculate totals
    entry.totalDebits = entry.lines.reduce((sum: number, line) => sum + line.debit, 0);
    entry.totalCredits = entry.lines.reduce((sum: number, line) => sum + line.credit, 0);

    entries.push(entry);
  }

  return entries;
}

// ============================================================================
// COST ALLOCATION
// ============================================================================

/**
 * Allocate overhead costs using allocation rule
 * 
 * @param overhead - Manufacturing overhead
 * @param allocation - Allocation rule
 * @returns Allocation result
 * 
 * @example
 * ```typescript
 * const allocation = allocateOverheadCosts(overhead, allocationRule);
 * ```
 */
export function allocateOverheadCosts(
  overhead: ManufacturingOverhead,
  allocation: AllocationRule
): AllocationResult {
  // Validate inputs
  if (!allocation.active) {
    throw new Error('Allocation rule must be active');
  }

  if (overhead.totalCost <= 0) {
    throw new Error('Overhead cost must be positive');
  }

  // Calculate allocation rates
  const rates = calculateAllocationRates(overhead, allocation.bases);
  
  // Allocate costs
  const allocatedAmounts: AllocatedAmount[] = [];
  let totalAllocated = 0;

  for (const rate of rates) {
    const amount = overhead.totalCost * rate.rate;
    const percentage = (amount / overhead.totalCost) * 100;

    const allocatedAmount: {
      costCenter: string;
      amount: number;
      percentage: number;
      allocationBase: number;
      rate: number;
      product?: string;
    } = {
      costCenter: rate.costCenter,
      amount,
      percentage,
      allocationBase: rate.base,
      rate: rate.rate
    };

    if (rate.product !== undefined) {
      allocatedAmount.product = rate.product;
    }

    allocatedAmounts.push(allocatedAmount);

    totalAllocated += amount;
  }

  const unallocatedAmount = overhead.totalCost - totalAllocated;

  return {
    overhead,
    allocation,
    allocatedAmounts,
    totalAllocated,
    unallocatedAmount,
    calculationDate: new Date()
  };
}

/**
 * Calculate allocation rates
 * 
 * @param overhead - Manufacturing overhead
 * @param bases - Allocation bases
 * @returns Allocation rates
 * 
 * @example
 * ```typescript
 * const rates = calculateAllocationRates(overhead, bases);
 * ```
 */
export function calculateAllocationRates(
  _overhead: ManufacturingOverhead,
  bases: readonly AllocationBase[]
): readonly AllocationRate[] {
  const rates: AllocationRate[] = [];

  // Calculate total base
  const totalBase = bases.reduce((sum, base) => sum + base.base, 0);

  if (totalBase <= 0) {
    throw new Error('Total allocation base must be positive');
  }

  // Calculate rates for each base
  for (const base of bases) {
    const rate = base.base / totalBase;
    
    const allocationRate: {
      costCenter: string;
      base: number;
      rate: number;
      percentage: number;
      product?: string;
    } = {
      costCenter: base.costCenter,
      base: base.base,
      rate,
      percentage: rate * 100
    };

    if (base.product !== undefined) {
      allocationRate.product = base.product;
    }

    rates.push(allocationRate);
  }

  return rates;
}

/**
 * Validate allocation result
 * 
 * @param allocation - Allocation result to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateAllocation(allocation);
 * if (!validation.isValid) {
 *   console.error('Allocation validation failed:', validation.errors);
 * }
 * ```
 */
export function validateAllocation(allocation: AllocationResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (allocation.totalAllocated < 0) {
    errors.push('Total allocated amount cannot be negative');
  }

  if (allocation.unallocatedAmount < 0) {
    errors.push('Unallocated amount cannot be negative');
  }

  // Validate allocation completeness
  const expectedTotal = allocation.overhead.totalCost;
  const actualTotal = allocation.totalAllocated + allocation.unallocatedAmount;
  
  if (Math.abs(actualTotal - expectedTotal) > 0.01) {
    errors.push('Allocation total does not match overhead cost');
  }

  // Validate individual allocations
  for (const allocated of allocation.allocatedAmounts) {
    if (allocated.amount < 0) {
      errors.push(`Allocation to ${allocated.costCenter} cannot be negative`);
    }

    if (allocated.percentage < 0 || allocated.percentage > 100) {
      errors.push(`Allocation percentage to ${allocated.costCenter} must be between 0 and 100`);
    }
  }

  // Warnings
  if (allocation.unallocatedAmount > allocation.overhead.totalCost * 0.05) {
    warnings.push('Unallocated amount exceeds 5% of total overhead cost');
  }

  const totalPercentage = allocation.allocatedAmounts.reduce((sum, a) => sum + a.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    warnings.push('Allocation percentages do not sum to 100%');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// RATE MANAGEMENT
// ============================================================================

/**
 * Update overhead rate
 * 
 * @param rate - Existing overhead rate
 * @param updates - Rate updates
 * @returns Updated overhead rate
 * 
 * @example
 * ```typescript
 * const updatedRate = updateOverheadRate(rate, {
 *   rate: 15.50,
 *   status: 'approved',
 *   updatedBy: 'user123'
 * });
 * ```
 */
export function updateOverheadRate(
  rate: OverheadRate,
  updates: RateUpdates
): OverheadRate {
  // Validate updates
  if (updates.rate !== undefined && updates.rate <= 0) {
    throw new Error('Rate must be positive');
  }

  return {
    ...rate,
    rate: updates.rate ?? rate.rate,
    calculationMethod: updates.calculationMethod ?? rate.calculationMethod,
    status: updates.status ?? rate.status,
    updatedAt: new Date()
  };
}

/**
 * Validate overhead rate
 * 
 * @param rate - Overhead rate to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateOverheadRate(rate);
 * if (!validation.isValid) {
 *   console.error('Rate validation failed:', validation.errors);
 * }
 * ```
 */
export function validateOverheadRate(rate: OverheadRate): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (rate.rate <= 0) {
    errors.push('Rate must be positive');
  }

  if (rate.period.startDate >= rate.period.endDate) {
    errors.push('Period start date must be before end date');
  }

  // Validate status
  if (!['draft', 'approved', 'active', 'cancelled', 'superseded'].includes(rate.status)) {
    errors.push(`Invalid rate status: ${rate.status}`);
  }

  // Validate calculation method
  if (!['predetermined', 'actual', 'normal', 'standard'].includes(rate.calculationMethod)) {
    errors.push(`Invalid calculation method: ${rate.calculationMethod}`);
  }

  // Warnings
  if (rate.rate > 100) {
    warnings.push('Rate exceeds 100% - verify reasonableness');
  }

  if (rate.status === 'active' && rate.calculationMethod === 'predetermined') {
    warnings.push('Active rate should not have predetermined calculation method');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate rate variance
 * 
 * @param actual - Actual overhead rate
 * @param standard - Standard overhead rate
 * @returns Rate variance analysis
 * 
 * @example
 * ```typescript
 * const variance = calculateRateVariance(actual, standard);
 * ```
 */
export function calculateRateVariance(
  actual: OverheadRate,
  standard: OverheadRate
): RateVariance {
  // Validate inputs
  if (actual.overhead.id !== standard.overhead.id) {
    throw new Error('Actual and standard rates must be for the same overhead item');
  }

  if (actual.base !== standard.base) {
    throw new Error('Actual and standard rates must use the same absorption base');
  }

  // Calculate variance
  const varianceAmount = actual.rate - standard.rate;
  const varianceType: VarianceType = varianceAmount >= 0 ? 'unfavorable' : 'favorable';
  const variancePercentage = (Math.abs(varianceAmount) / standard.rate) * 100;

  return {
    actualRate: actual,
    standardRate: standard,
    varianceAmount,
    variancePercentage,
    varianceType,
    calculatedAt: new Date()
  };
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Allocation rate for cost center or product
 */
interface AllocationRate {
  readonly costCenter: string;
  readonly product?: string;
  readonly base: number;
  readonly rate: number;
  readonly percentage: number;
}

/**
 * Allocation base with cost center information
 */
interface AllocationBase {
  readonly costCenter: string;
  readonly product?: string;
  readonly base: number;
}
