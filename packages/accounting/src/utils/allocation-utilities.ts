/**
 * Allocation Utilities - Phase 1 Implementation
 * 
 * Handle cost center and dimension allocations with rounding governance.
 * Provides comprehensive allocation management and validation.
 * 
 * Features:
 * - Allocation rules for cost centers and dimensions
 * - Allocation engine with multiple methods
 * - Rounding governance and difference handling
 * - Allocation validation
 * - Multi-dimension support
 */

import {
  type SupportedCurrency,
  roundToCurrency,
  RoundingMethod,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AllocationSource {
  accountCode: string;
  dimension: string;
  value: string;
}

export interface AllocationTarget {
  accountCode: string;
  dimension: string;
  value: string;
  percentage?: number;
  driver?: string;
  fixedAmount?: number;
}

export interface AllocationRule {
  id: string;
  name: string;
  description: string;
  source: AllocationSource;
  targets: AllocationTarget[];
  method: AllocationMethod;
  roundingMethod: RoundingMethod;
  active: boolean;
}

export interface AllocationMethod {
  type: 'percentage' | 'driver' | 'fixed' | 'proportional';
  parameters?: Record<string, any>;
}

export interface AllocationContext {
  period: string;
  currency: SupportedCurrency;
  dimensions?: Record<string, string>;
  [key: string]: any;
}

export interface AllocationResult {
  sourceAmount: number;
  allocatedAmount: number;
  allocations: Allocation[];
  roundingDifference: number;
  isBalanced: boolean;
}

export interface Allocation {
  target: AllocationTarget;
  amount: number;
  percentage: number;
  driverValue?: number;
}

export interface AllocationPercentage {
  target: AllocationTarget;
  percentage: number;
}

export interface AllocationDriver {
  target: AllocationTarget;
  driverValue: number;
}

export interface AllocationFixed {
  target: AllocationTarget;
  fixedAmount: number;
}

export interface RoundingDistributionMethod {
  type: 'largest' | 'smallest' | 'first' | 'last' | 'proportional';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// RULE MANAGEMENT
// ============================================================================

/**
 * Define an allocation rule
 */
export function defineAllocationRule(
  source: AllocationSource,
  targets: AllocationTarget[],
  method: AllocationMethod
): AllocationRule {
  if (!source) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Allocation source is required',
      source,
      { operation: 'define-allocation-rule' }
    );
  }

  if (!targets || targets.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Allocation targets are required',
      targets,
      { operation: 'define-allocation-rule' }
    );
  }

  if (!method) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Allocation method is required',
      method,
      { operation: 'define-allocation-rule' }
    );
  }

  const rule: AllocationRule = {
    id: `ALLOC-${Date.now()}`,
    name: `Allocation Rule for ${source.accountCode}`,
    description: `Allocation rule for ${source.accountCode} to ${targets.length} targets`,
    source,
    targets,
    method,
    roundingMethod: RoundingMethod.HALF_EVEN,
    active: true,
  };

  return rule;
}

/**
 * Validate an allocation rule
 */
export function validateAllocationRule(rule: AllocationRule): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rule) {
    errors.push('Allocation rule is required');
    return { isValid: false, errors, warnings };
  }

  // Validate rule structure
  if (!rule.id) {
    errors.push('Rule ID is required');
  }

  if (!rule.name) {
    errors.push('Rule name is required');
  }

  if (!rule.source) {
    errors.push('Allocation source is required');
  }

  if (!rule.targets || rule.targets.length === 0) {
    errors.push('Allocation targets are required');
  }

  if (!rule.method) {
    errors.push('Allocation method is required');
  }

  // Validate source
  if (rule.source) {
    if (!rule.source.accountCode) {
      errors.push('Source account code is required');
    }
    if (!rule.source.dimension) {
      errors.push('Source dimension is required');
    }
    if (!rule.source.value) {
      errors.push('Source value is required');
    }
  }

  // Validate targets
  if (rule.targets) {
    for (let i = 0; i < rule.targets.length; i++) {
      const target = rule.targets[i]!;
      
      if (!target.accountCode) {
        errors.push(`Target ${i + 1}: Account code is required`);
      }
      if (!target.dimension) {
        errors.push(`Target ${i + 1}: Dimension is required`);
      }
      if (!target.value) {
        errors.push(`Target ${i + 1}: Value is required`);
      }
    }
  }

  // Validate method
  if (rule.method) {
    const validMethods = ['percentage', 'driver', 'fixed', 'proportional'];
    if (!validMethods.includes(rule.method.type)) {
      errors.push(`Invalid allocation method: ${rule.method.type}`);
    }

    // Validate method-specific requirements
    if (rule.method.type === 'percentage') {
      const totalPercentage = rule.targets.reduce((sum, target) => sum + (target.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.push(`Total percentage must equal 100%. Current total: ${totalPercentage}%`);
      }
    }

    if (rule.method.type === 'fixed') {
      const totalFixed = rule.targets.reduce((sum, target) => sum + (target.fixedAmount || 0), 0);
      if (totalFixed <= 0) {
        errors.push('Total fixed amount must be greater than 0');
      }
    }

    if (rule.method.type === 'driver') {
      const targetsWithDrivers = rule.targets.filter(target => target.driver);
      if (targetsWithDrivers.length === 0) {
        errors.push('At least one target must have a driver for driver-based allocation');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Execute an allocation rule
 */
export function executeAllocation(
  rule: AllocationRule,
  amount: number,
  context: AllocationContext
): AllocationResult {
  if (!rule) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Allocation rule is required',
      rule,
      { operation: 'execute-allocation' }
    );
  }

  if (typeof amount !== 'number' || amount <= 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Amount must be a positive number',
      amount,
      { operation: 'execute-allocation' }
    );
  }

  if (!context) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Allocation context is required',
      context,
      { operation: 'execute-allocation' }
    );
  }

  // Validate rule
  const ruleValidation = validateAllocationRule(rule);
  if (!ruleValidation.isValid) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `Invalid allocation rule: ${ruleValidation.errors.join(', ')}`,
      rule,
      { operation: 'execute-allocation' }
    );
  }

  // Check if rule is active
  if (!rule.active) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Allocation rule is not active',
      rule,
      { operation: 'execute-allocation' }
    );
  }

  // Execute allocation based on method
  let result: AllocationResult;
  
  switch (rule.method.type) {
    case 'percentage':
      result = allocateByPercentage(amount, rule.targets.map(target => ({
        target,
        percentage: target.percentage || 0,
      })));
      break;
    case 'driver':
      result = allocateByDriver(amount, rule.targets.map(target => ({
        target,
        driverValue: parseFloat(target.driver || '0'),
      })));
      break;
    case 'fixed':
      result = allocateByFixedAmount(amount, rule.targets.map(target => ({
        target,
        fixedAmount: target.fixedAmount || 0,
      })));
      break;
    case 'proportional':
      result = allocateByPercentage(amount, rule.targets.map(target => ({
        target,
        percentage: 100 / rule.targets.length, // Equal distribution
      })));
      break;
    default:
      throw createValidationError(
        'INVALID_ACCOUNTING_INPUT',
        `Unsupported allocation method: ${rule.method.type}`,
        rule.method,
        { operation: 'execute-allocation' }
      );
  }

  // Apply rounding governance
  result = applyRoundingGovernance(result, rule.roundingMethod);

  return result;
}

// ============================================================================
// ALLOCATION ENGINE
// ============================================================================

/**
 * Allocate by percentage
 */
export function allocateByPercentage(
  amount: number,
  percentages: AllocationPercentage[]
): AllocationResult {
  if (typeof amount !== 'number' || amount <= 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Amount must be a positive number',
      amount,
      { operation: 'allocate-by-percentage' }
    );
  }

  if (!percentages || percentages.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Percentages are required',
      percentages,
      { operation: 'allocate-by-percentage' }
    );
  }

  // Validate total percentage
  const totalPercentage = percentages.reduce((sum, p) => sum + p.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `Total percentage must equal 100%. Current total: ${totalPercentage}%`,
      { totalPercentage, percentages },
      { operation: 'allocate-by-percentage' }
    );
  }

  const allocations: Allocation[] = [];
  let allocatedAmount = 0;

  for (const percentage of percentages) {
    const allocationAmount = (amount * percentage.percentage) / 100;
    const roundedAmount = roundToCurrency(allocationAmount, 'MYR'); // Default currency
    
    allocations.push({
      target: percentage.target,
      amount: roundedAmount,
      percentage: percentage.percentage,
    });
    
    allocatedAmount += roundedAmount;
  }

  const roundingDifference = amount - allocatedAmount;

  return {
    sourceAmount: amount,
    allocatedAmount,
    allocations,
    roundingDifference,
    isBalanced: Math.abs(roundingDifference) <= 0.01,
  };
}

/**
 * Allocate by driver
 */
export function allocateByDriver(
  amount: number,
  drivers: AllocationDriver[]
): AllocationResult {
  if (typeof amount !== 'number' || amount <= 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Amount must be a positive number',
      amount,
      { operation: 'allocate-by-driver' }
    );
  }

  if (!drivers || drivers.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Drivers are required',
      drivers,
      { operation: 'allocate-by-driver' }
    );
  }

  // Calculate total driver value
  const totalDriverValue = drivers.reduce((sum, d) => sum + d.driverValue, 0);
  if (totalDriverValue <= 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Total driver value must be greater than 0',
      { totalDriverValue, drivers },
      { operation: 'allocate-by-driver' }
    );
  }

  const allocations: Allocation[] = [];
  let allocatedAmount = 0;

  for (const driver of drivers) {
    const percentage = (driver.driverValue / totalDriverValue) * 100;
    const allocationAmount = (amount * percentage) / 100;
    const roundedAmount = roundToCurrency(allocationAmount, 'MYR'); // Default currency
    
    allocations.push({
      target: driver.target,
      amount: roundedAmount,
      percentage,
      driverValue: driver.driverValue,
    });
    
    allocatedAmount += roundedAmount;
  }

  const roundingDifference = amount - allocatedAmount;

  return {
    sourceAmount: amount,
    allocatedAmount,
    allocations,
    roundingDifference,
    isBalanced: Math.abs(roundingDifference) <= 0.01,
  };
}

/**
 * Allocate by fixed amount
 */
export function allocateByFixedAmount(
  amount: number,
  fixedAmounts: AllocationFixed[]
): AllocationResult {
  if (typeof amount !== 'number' || amount <= 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Amount must be a positive number',
      amount,
      { operation: 'allocate-by-fixed-amount' }
    );
  }

  if (!fixedAmounts || fixedAmounts.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fixed amounts are required',
      fixedAmounts,
      { operation: 'allocate-by-fixed-amount' }
    );
  }

  // Calculate total fixed amount
  const totalFixedAmount = fixedAmounts.reduce((sum, f) => sum + f.fixedAmount, 0);
  if (totalFixedAmount <= 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Total fixed amount must be greater than 0',
      { totalFixedAmount, fixedAmounts },
      { operation: 'allocate-by-fixed-amount' }
    );
  }

  if (totalFixedAmount > amount) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Total fixed amount cannot exceed source amount',
      { totalFixedAmount, amount, fixedAmounts },
      { operation: 'allocate-by-fixed-amount' }
    );
  }

  const allocations: Allocation[] = [];
  let allocatedAmount = 0;

  for (const fixed of fixedAmounts) {
    const percentage = (fixed.fixedAmount / amount) * 100;
    
    allocations.push({
      target: fixed.target,
      amount: roundToCurrency(fixed.fixedAmount, 'MYR'), // Default currency
      percentage,
    });
    
    allocatedAmount += fixed.fixedAmount;
  }

  const roundingDifference = amount - allocatedAmount;

  return {
    sourceAmount: amount,
    allocatedAmount,
    allocations,
    roundingDifference,
    isBalanced: Math.abs(roundingDifference) <= 0.01,
  };
}

// ============================================================================
// ROUNDING GOVERNANCE
// ============================================================================

/**
 * Apply rounding governance to allocation result
 */
export function applyRoundingGovernance(
  result: AllocationResult,
  _method: RoundingMethod
): AllocationResult {
  if (!result) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Allocation result is required',
      result,
      { operation: 'apply-rounding-governance' }
    );
  }

  // If already balanced, return as-is
  if (result.isBalanced) {
    return result;
  }

  // Apply rounding difference distribution
  const distributionMethod: RoundingDistributionMethod = { type: 'largest' };
  const updatedResult = distributeRoundingDifference(result, distributionMethod);

  return updatedResult;
}

/**
 * Distribute rounding difference
 */
export function distributeRoundingDifference(
  result: AllocationResult,
  method: RoundingDistributionMethod
): AllocationResult {
  if (!result) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Allocation result is required',
      result,
      { operation: 'distribute-rounding-difference' }
    );
  }

  if (Math.abs(result.roundingDifference) <= 0.01) {
    return result;
  }

  const updatedAllocations = [...result.allocations];
  const difference = result.roundingDifference;

  switch (method.type) {
    case 'largest':
      // Add difference to the largest allocation
      const largestIndex = updatedAllocations.reduce((maxIndex, allocation, index) => 
        allocation.amount > updatedAllocations[maxIndex]!.amount ? index : maxIndex, 0
      );
      updatedAllocations[largestIndex]!.amount += difference;
      break;

    case 'smallest':
      // Add difference to the smallest allocation
      const smallestIndex = updatedAllocations.reduce((minIndex, allocation, index) => 
        allocation.amount < updatedAllocations[minIndex]!.amount ? index : minIndex, 0
      );
      updatedAllocations[smallestIndex]!.amount += difference;
      break;

    case 'first':
      // Add difference to the first allocation
      updatedAllocations[0]!.amount += difference;
      break;

    case 'last':
      // Add difference to the last allocation
      updatedAllocations[updatedAllocations.length - 1]!.amount += difference;
      break;

    case 'proportional':
      // Distribute difference proportionally
      const totalAllocated = updatedAllocations.reduce((sum, a) => sum + a.amount, 0);
      for (const allocation of updatedAllocations) {
        const proportion = allocation.amount / totalAllocated;
        allocation.amount += difference * proportion;
      }
      break;

    default:
      throw createValidationError(
        'INVALID_ACCOUNTING_INPUT',
        `Unsupported rounding distribution method: ${method.type}`,
        method,
        { operation: 'distribute-rounding-difference' }
      );
  }

  const newAllocatedAmount = updatedAllocations.reduce((sum, a) => sum + a.amount, 0);

  return {
    ...result,
    allocations: updatedAllocations,
    allocatedAmount: newAllocatedAmount,
    roundingDifference: 0,
    isBalanced: true,
  };
}

/**
 * Validate allocation balance
 */
export function validateAllocationBalance(
  result: AllocationResult,
  tolerance: number = 0.01
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!result) {
    errors.push('Allocation result is required');
    return { isValid: false, errors, warnings };
  }

  // Check balance
  const difference = Math.abs(result.sourceAmount - result.allocatedAmount);
  if (difference > tolerance) {
    errors.push(`Allocation is not balanced. Difference: ${difference}`);
  }

  // Check individual allocations
  for (let i = 0; i < result.allocations.length; i++) {
    const allocation = result.allocations[i]!;
    
    if (allocation.amount < 0) {
      errors.push(`Allocation ${i + 1}: Amount cannot be negative`);
    }
    
    if (allocation.percentage < 0 || allocation.percentage > 100) {
      warnings.push(`Allocation ${i + 1}: Percentage seems unusual: ${allocation.percentage}%`);
    }
  }

  // Check rounding difference
  if (Math.abs(result.roundingDifference) > tolerance) {
    warnings.push(`Significant rounding difference: ${result.roundingDifference}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a simple percentage allocation rule
 */
export function createPercentageAllocationRule(
  source: AllocationSource,
  targets: AllocationTarget[]
): AllocationRule {
  return defineAllocationRule(source, targets, { type: 'percentage' });
}

/**
 * Create a simple driver allocation rule
 */
export function createDriverAllocationRule(
  source: AllocationSource,
  targets: AllocationTarget[]
): AllocationRule {
  return defineAllocationRule(source, targets, { type: 'driver' });
}

/**
 * Create a simple fixed amount allocation rule
 */
export function createFixedAllocationRule(
  source: AllocationSource,
  targets: AllocationTarget[]
): AllocationRule {
  return defineAllocationRule(source, targets, { type: 'fixed' });
}

/**
 * Get allocation summary
 */
export function getAllocationSummary(result: AllocationResult): {
  sourceAmount: number;
  allocatedAmount: number;
  totalAllocations: number;
  roundingDifference: number;
  isBalanced: boolean;
  averageAllocation: number;
  largestAllocation: number;
  smallestAllocation: number;
} {
  if (!result) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Allocation result is required',
      result,
      { operation: 'get-allocation-summary' }
    );
  }

  const amounts = result.allocations.map(a => a.amount);
  const averageAllocation = amounts.length > 0 ? amounts.reduce((sum, a) => sum + a, 0) / amounts.length : 0;
  const largestAllocation = amounts.length > 0 ? Math.max(...amounts) : 0;
  const smallestAllocation = amounts.length > 0 ? Math.min(...amounts) : 0;

  return {
    sourceAmount: result.sourceAmount,
    allocatedAmount: result.allocatedAmount,
    totalAllocations: result.allocations.length,
    roundingDifference: result.roundingDifference,
    isBalanced: result.isBalanced,
    averageAllocation: roundToCurrency(averageAllocation, 'MYR'),
    largestAllocation: roundToCurrency(largestAllocation, 'MYR'),
    smallestAllocation: roundToCurrency(smallestAllocation, 'MYR'),
  };
}

/**
 * Create an empty allocation result
 */
export function createEmptyAllocationResult(amount: number): AllocationResult {
  return {
    sourceAmount: amount,
    allocatedAmount: 0,
    allocations: [],
    roundingDifference: amount,
    isBalanced: false,
  };
}
