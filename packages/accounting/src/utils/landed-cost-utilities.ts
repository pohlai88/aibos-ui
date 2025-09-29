/**
 * Landed Cost Utilities
 * 
 * Freight/duty allocation to inventory receipts by weight/volume/value with rounding governance.
 * Provides comprehensive landed cost allocation, tracking, and validation operations.
 * 
 * @fileoverview Landed cost allocation, receipt management, and cost tracking
 */

import type {
  SupportedCurrency,
} from './accounting-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import type { DateRange } from './date-utilities';
import type { JournalEntry } from './journal-entry-utilities';
import { RoundingMethod } from './policies/rounding-policy';

// ============================================================================
// Types & Interfaces
// ============================================================================
const EPS = 1e-6;
const CENT = 0.01;

type PeriodGuard = (date: Date) => { allowed: boolean; reason?: string };
type SoDGuard = (action: string, ctx?: { receiptId?: string }) => { allowed: boolean; reason?: string };
let _periodGuard: PeriodGuard | undefined;
let _sodGuard: SoDGuard | undefined;
export function setLandedCostComplianceGuards(guards: { periodGuard?: PeriodGuard; sodGuard?: SoDGuard }) {
  _periodGuard = guards.periodGuard ?? _periodGuard;
  _sodGuard = guards.sodGuard ?? _sodGuard;
}
function ensureAllowed(action: string, date: Date, ctx?: { receiptId?: string }) {
  if (_periodGuard) {
    const r = _periodGuard(date);
    if (!r.allowed) throw new Error(`Period guard rejected ${action} on ${date.toISOString()}: ${r.reason ?? 'blocked'}`);
  }
  if (_sodGuard) {
    const r = _sodGuard(action, ctx);
    if (!r.allowed) throw new Error(`SoD guard rejected ${action}: ${r.reason ?? 'blocked'}`);
  }
}

// Optional FX converter for multi-currency landed costs
export type FXConverter = (amount: number, from: SupportedCurrency, to: SupportedCurrency, asOf: Date) => number;
let _fxc: FXConverter | undefined;
export function setLandedCostFX(converter: FXConverter) {
  _fxc = converter;
}

export interface InventoryReceipt {
  id: string;
  receiptNumber: string;
  receiptDate: Date;
  vendor: string;
  items: InventoryItem[];
  landedCosts: LandedCost[];
  totalCost: number;
  currency: SupportedCurrency;
  status: ReceiptStatus;
}

export interface LandedCost {
  id: string;
  type: CostType;
  description: string;
  amount: number;
  currency: SupportedCurrency;
  allocationMethod: AllocationMethod;
  allocated: boolean;
  allocationDate?: Date;
}

export interface AllocationResult {
  receipt: InventoryReceipt;
  method: AllocationMethod;
  items: AllocationItem[];
  totalAllocated: number;
  roundingDifference: number;
  isBalanced: boolean;
  calculationDate: Date;
  /**
   * Present when landed costs include foreign currencies and an FX converter is set.
   * Summarizes the conversion used to get to receipt currency totals.
   */
  fxSummary?: {
    receiptCurrency: SupportedCurrency;
    sources: Array<{
      currency: SupportedCurrency;
      amount: number;        // source-currency total across costs of this currency
      converted: number;     // converted to receipt currency (sum of individual conversions)
      // rates may differ per cost; we report a weighted implied rate for convenience
      impliedRate: number;   // converted / amount
    }>;
    totalConverted: number;  // sum of all converted
  };
}

export interface AllocationItem {
  item: InventoryItem;
  baseAmount: number;
  allocationFactor: number;
  allocatedCost: number;
  roundingAdjustment: number;
  finalCost: number;
  /**
   * Mirror of the amount in the RECEIPT currency after rounding & distribution.
   * Populated by applyRoundingGovernance()/distributeRoundingDifference.
   * Backward compatible (optional).
   */
  allocatedInReceiptCurrency?: number;
}

export interface WeightAllocation extends AllocationResult {
  method: 'weight';
  totalWeight: number;
  weightFactors: Map<string, number>;
}

export interface VolumeAllocation extends AllocationResult {
  method: 'volume';
  totalVolume: number;
  volumeFactors: Map<string, number>;
}

export interface ValueAllocation extends AllocationResult {
  method: 'value';
  totalValue: number;
  valueFactors: Map<string, number>;
}

export interface QuantityAllocation extends AllocationResult {
  method: 'quantity';
  totalQuantity: number;
  quantityFactors: Map<string, number>;
}

export interface CostTracking {
  item: InventoryItem;
  originalCost: number;
  allocatedCosts: number;
  totalCost: number;
  adjustments: CostAdjustment[];
  lastUpdated: Date;
}

export interface CostAdjustment {
  id: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  date: Date;
  approvedBy: string;
  journalEntry?: JournalEntry;
}

export interface InventoryItem {
  id: string;
  itemNumber: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  weight: number;
  volume: number;
  unitOfMeasure: string;
  currency: SupportedCurrency;
}

export interface ReceiptData {
  receiptNumber: string;
  receiptDate: Date;
  vendor: string;
  items: InventoryItem[];
  landedCosts: LandedCost[];
  currency: SupportedCurrency;
}

export interface ProcessedReceipt {
  receipt: InventoryReceipt;
  allocations: AllocationResult[];
  journalEntries: JournalEntry[];
  status: ReceiptStatus;
  processedAt: Date;
}

export interface RoundingAdjustment {
  item: InventoryItem;
  originalAmount: number;
  adjustedAmount: number;
  difference: number;
  method: RoundingMethod;
  reason: string;
}

export interface CostReport {
  id: string;
  receipts: InventoryReceipt[];
  period: DateRange;
  totalLandedCosts: number;
  totalAllocatedCosts: number;
  unallocatedCosts: number;
  roundingDifferences: number;
  generatedAt: Date;
}

export interface LayerCapitalizationEntry {
  itemId: string;
  itemNumber: string;
  description: string;
  landedCostAmount: number;
  currency: SupportedCurrency;
  allocationMethod: AllocationMethod;
  allocationFactor: number;
  baseAmount: number;
  roundingAdjustment: number;
  receiptId: string;
  receiptNumber: string;
  receiptDate: Date;
  vendor: string;
  fxSummary?: AllocationResult['fxSummary'];
  processedAt: Date;
}

export type CostType = 'freight' | 'duty' | 'insurance' | 'handling' | 'storage' | 'other';
export type AllocationMethod = 'weight' | 'volume' | 'value' | 'quantity' | 'equal' | 'custom';
export type ReceiptStatus = 'draft' | 'received' | 'allocated' | 'posted' | 'cancelled';
export type AdjustmentType = 'allocation' | 'rounding' | 'correction' | 'write_off' | 'other';

// ============================================================================
// Cost Allocation
// ============================================================================

/**
 * Allocate landed costs to inventory items
 */
export function allocateLandedCosts(receipt: InventoryReceipt, costs: LandedCost[]): AllocationResult {
  ensureAllowed('allocate_landed_costs', new Date(), { receiptId: receipt.id });
  if (!receipt || receipt.items.length === 0) {
    throw new Error('Cannot allocate costs to empty receipt');
  }
  
  if (costs.length === 0) {
    throw new Error('No costs to allocate');
  }

  // Currency guard (simple: enforce same as receipt; integrate FX later)
  for (const c of costs) {
    if (c.amount < 0) throw new Error('Landed cost amount cannot be negative');
  }
  
  // Use the first cost's allocation method for the entire allocation
  const firstCost = costs[0];
  if (!firstCost) {
    throw new Error('No costs to allocate');
  }
  const method = firstCost.allocationMethod;
  // Convert to receipt currency if needed via FX hook; otherwise enforce same-currency.
  // Also build fxSummary per currency bucket.
  const fxBuckets = new Map<SupportedCurrency, { amount: number; converted: number }>();
  let totalCost = 0;
  for (const cost of costs) {
    if (cost.currency === receipt.currency) {
      totalCost += cost.amount;
      const b = fxBuckets.get(cost.currency) ?? { amount: 0, converted: 0 };
      b.amount += cost.amount;
      b.converted += cost.amount;
      fxBuckets.set(cost.currency, b);
    } else {
      if (!_fxc) {
        throw new Error(`Currency mismatch: cost ${cost.id} in ${cost.currency} ≠ receipt currency ${receipt.currency} (no FX converter set)`);
      }
      const converted = _fxc(cost.amount, cost.currency, receipt.currency, receipt.receiptDate);
      totalCost += converted;
      const b = fxBuckets.get(cost.currency) ?? { amount: 0, converted: 0 };
      b.amount += cost.amount;
      b.converted += converted;
      fxBuckets.set(cost.currency, b);
    }
  }
  if (totalCost <= 0) throw new Error('Total landed cost must be positive');
  
  let allocationResult: AllocationResult;
  
  switch (method) {
    case 'weight':
      allocationResult = calculateAllocationByWeight(receipt.items, totalCost);
      break;
    case 'volume':
      allocationResult = calculateAllocationByVolume(receipt.items, totalCost);
      break;
    case 'value':
      allocationResult = calculateAllocationByValue(receipt.items, totalCost);
      break;
    case 'quantity':
      allocationResult = calculateAllocationByQuantity(receipt.items, totalCost);
      break;
    case 'equal':
      allocationResult = calculateEqualAllocation(receipt.items, totalCost);
      break;
    default:
      throw new Error(`Unsupported allocation method: ${method}`);
  }
  
  // Update receipt with allocated costs
  receipt.landedCosts = costs.map(cost => ({
    ...cost,
    allocated: true,
    allocationDate: new Date(),
  }));

  // Compose fx summary if any source currency != receipt currency
  let fxSummary: AllocationResult['fxSummary'] | undefined;
  if ([...fxBuckets.keys()].some(c => c !== receipt.currency)) {
    fxSummary = {
      receiptCurrency: receipt.currency,
      sources: [...fxBuckets.entries()].map(([currency, v]) => ({
        currency,
        amount: v.amount,
        converted: v.converted,
        impliedRate: v.amount > 0 ? v.converted / v.amount : 0
      })),
      totalConverted: totalCost
    };
  }

  // Inject the real receipt into the result (without changing calc signatures)
  const result = { ...allocationResult, receipt };
  if (fxSummary) {
    result.fxSummary = fxSummary;
  }
  return result;
}

/**
 * Calculate allocation by weight
 */
export function calculateAllocationByWeight(items: InventoryItem[], totalCost: number): WeightAllocation {
  if (items.length === 0) throw new Error('No items to allocate');
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
  
  if (totalWeight === 0) {
    throw new Error('Total weight cannot be zero for weight-based allocation');
  }
  
  const weightFactors = new Map<string, number>();
  const allocationItems: AllocationItem[] = [];
  let totalAllocated = 0;
  
  items.forEach(item => {
    const weightFactor = (item.weight || 0) / totalWeight;
    const allocatedCost = totalCost * weightFactor;
    
    weightFactors.set(item.id, weightFactor);
    allocationItems.push({
      item,
      baseAmount: item.weight,
      allocationFactor: weightFactor,
      allocatedCost,
      roundingAdjustment: 0,
      finalCost: allocatedCost,
    });
    
    totalAllocated += allocatedCost;
  });
  
  const roundingDifference = totalCost - totalAllocated;
  
  return {
    receipt: {} as InventoryReceipt,
    method: 'weight',
    items: allocationItems,
    totalAllocated,
    roundingDifference,
    isBalanced: Math.abs(roundingDifference) < 0.01,
    calculationDate: new Date(),
    totalWeight,
    weightFactors,
  };
}

/**
 * Calculate allocation by volume
 */
export function calculateAllocationByVolume(items: InventoryItem[], totalCost: number): VolumeAllocation {
  if (items.length === 0) throw new Error('No items to allocate');
  const totalVolume = items.reduce((sum, item) => sum + (item.volume || 0), 0);
  
  if (totalVolume === 0) {
    throw new Error('Total volume cannot be zero for volume-based allocation');
  }
  
  const volumeFactors = new Map<string, number>();
  const allocationItems: AllocationItem[] = [];
  let totalAllocated = 0;
  
  items.forEach(item => {
    const volumeFactor = (item.volume || 0) / totalVolume;
    const allocatedCost = totalCost * volumeFactor;
    
    volumeFactors.set(item.id, volumeFactor);
    allocationItems.push({
      item,
      baseAmount: item.volume,
      allocationFactor: volumeFactor,
      allocatedCost,
      roundingAdjustment: 0,
      finalCost: allocatedCost,
    });
    
    totalAllocated += allocatedCost;
  });
  
  const roundingDifference = totalCost - totalAllocated;
  
  return {
    receipt: {} as InventoryReceipt,
    method: 'volume',
    items: allocationItems,
    totalAllocated,
    roundingDifference,
    isBalanced: Math.abs(roundingDifference) < 0.01,
    calculationDate: new Date(),
    totalVolume,
    volumeFactors,
  };
}

/**
 * Calculate allocation by value
 */
export function calculateAllocationByValue(items: InventoryItem[], totalCost: number): ValueAllocation {
  if (items.length === 0) throw new Error('No items to allocate');
  const totalValue = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  
  if (totalValue === 0) {
    throw new Error('Total value cannot be zero for value-based allocation');
  }
  
  const valueFactors = new Map<string, number>();
  const allocationItems: AllocationItem[] = [];
  let totalAllocated = 0;
  
  items.forEach(item => {
    const valueFactor = (item.totalCost || 0) / totalValue;
    const allocatedCost = totalCost * valueFactor;
    
    valueFactors.set(item.id, valueFactor);
    allocationItems.push({
      item,
      baseAmount: item.totalCost,
      allocationFactor: valueFactor,
      allocatedCost,
      roundingAdjustment: 0,
      finalCost: allocatedCost,
    });
    
    totalAllocated += allocatedCost;
  });
  
  const roundingDifference = totalCost - totalAllocated;
  
  return {
    receipt: {} as InventoryReceipt,
    method: 'value',
    items: allocationItems,
    totalAllocated,
    roundingDifference,
    isBalanced: Math.abs(roundingDifference) < 0.01,
    calculationDate: new Date(),
    totalValue,
    valueFactors,
  };
}

/**
 * Calculate allocation by quantity
 */
export function calculateAllocationByQuantity(items: InventoryItem[], totalCost: number): QuantityAllocation {
  if (items.length === 0) throw new Error('No items to allocate');
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  if (totalQuantity === 0) {
    throw new Error('Total quantity cannot be zero for quantity-based allocation');
  }
  
  const quantityFactors = new Map<string, number>();
  const allocationItems: AllocationItem[] = [];
  let totalAllocated = 0;
  
  items.forEach(item => {
    const quantityFactor = (item.quantity || 0) / totalQuantity;
    const allocatedCost = totalCost * quantityFactor;
    
    quantityFactors.set(item.id, quantityFactor);
    allocationItems.push({
      item,
      baseAmount: item.quantity,
      allocationFactor: quantityFactor,
      allocatedCost,
      roundingAdjustment: 0,
      finalCost: allocatedCost,
    });
    
    totalAllocated += allocatedCost;
  });
  
  const roundingDifference = totalCost - totalAllocated;
  
  return {
    receipt: {} as InventoryReceipt,
    method: 'quantity',
    items: allocationItems,
    totalAllocated,
    roundingDifference,
    isBalanced: Math.abs(roundingDifference) < 0.01,
    calculationDate: new Date(),
    totalQuantity,
    quantityFactors,
  };
}

/**
 * Calculate equal allocation
 */
export function calculateEqualAllocation(items: InventoryItem[], totalCost: number): AllocationResult {
  if (items.length === 0) throw new Error('No items to allocate');
  const equalAmount = totalCost / items.length;
  const allocationItems: AllocationItem[] = [];
  let totalAllocated = 0;
  
  items.forEach(item => {
    const allocationFactor = 1 / items.length;
    
    allocationItems.push({
      item,
      baseAmount: 1,
      allocationFactor,
      allocatedCost: equalAmount,
      roundingAdjustment: 0,
      finalCost: equalAmount,
    });
    
    totalAllocated += equalAmount;
  });
  
  const roundingDifference = totalCost - totalAllocated;
  
  return {
    receipt: {} as InventoryReceipt,
    method: 'equal',
    items: allocationItems,
    totalAllocated,
    roundingDifference,
    isBalanced: Math.abs(roundingDifference) < 0.01,
    calculationDate: new Date(),
  };
}

// ============================================================================
// Receipt Management
// ============================================================================

/**
 * Create inventory receipt
 */
export function createInventoryReceipt(receipt: ReceiptData): InventoryReceipt {
  ensureAllowed('create_receipt', receipt.receiptDate, undefined);
  const totalCost = receipt.items.reduce((sum, item) => sum + item.totalCost, 0);
  
  return {
    id: `receipt_${receipt.receiptNumber}_${Date.now()}`,
    receiptNumber: receipt.receiptNumber,
    receiptDate: receipt.receiptDate,
    vendor: receipt.vendor,
    items: receipt.items,
    landedCosts: receipt.landedCosts,
    totalCost,
    currency: receipt.currency,
    status: 'draft',
  };
}

/**
 * Add landed costs to receipt
 */
export function addLandedCosts(receipt: InventoryReceipt, costs: LandedCost[]): InventoryReceipt {
  ensureAllowed('add_landed_costs', new Date(), { receiptId: receipt.id });
  for (const c of costs) {
    if (c.amount < 0) throw new Error('Landed cost amount cannot be negative');
  }
  // Keep receipt.totalCost in receipt currency; if costs are foreign and FX hook exists, convert for total
  const addendum = costs.reduce((sum, cost) => {
    if (cost.currency === receipt.currency) return sum + cost.amount;
    if (_fxc) return sum + _fxc(cost.amount, cost.currency, receipt.currency, receipt.receiptDate);
    throw new Error(`Currency mismatch: cost ${cost.id} in ${cost.currency} ≠ receipt currency ${receipt.currency} (no FX converter set)`);
  }, 0);
  const newTotalCost = receipt.totalCost + addendum;
  
  return {
    ...receipt,
    landedCosts: [...receipt.landedCosts, ...costs],
    totalCost: newTotalCost,
  };
}

/**
 * Validate receipt
 */
export function validateReceipt(receipt: InventoryReceipt): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Validate receipt number
  if (!receipt.receiptNumber || receipt.receiptNumber.trim() === '') {
    issues.push({
      path: 'receiptNumber',
      message: 'Receipt number is required',
      severity: 'error',
      code: 'REQUIRED',
    });
  }
  
  // Validate vendor
  if (!receipt.vendor || receipt.vendor.trim() === '') {
    issues.push({
      path: 'vendor',
      message: 'Vendor is required',
      severity: 'error',
      code: 'REQUIRED',
    });
  }
  
  // Validate items
  if (receipt.items.length === 0) {
    issues.push({
      path: 'items',
      message: 'Receipt must have at least one item',
      severity: 'error',
      code: 'FORMAT',
    });
  }
  
  // Validate item data
  receipt.items.forEach((item, index) => {
    if (item.quantity <= 0) {
      issues.push({
        path: `items[${index}].quantity`,
        message: 'Item quantity must be greater than zero',
        severity: 'error',
        code: 'RANGE',
      });
    }
    
    if (item.unitCost < 0) {
      issues.push({
        path: `items[${index}].unitCost`,
        message: 'Item unit cost cannot be negative',
        severity: 'error',
        code: 'RANGE',
      });
    }
    
    if (item.weight < 0) {
      issues.push({
        path: `items[${index}].weight`,
        message: 'Item weight cannot be negative',
        severity: 'error',
        code: 'RANGE',
      });
    }
    
    if (item.volume < 0) {
      issues.push({
        path: `items[${index}].volume`,
        message: 'Item volume cannot be negative',
        severity: 'error',
        code: 'RANGE',
      });
    }
  });
  
  // Validate landed costs
  receipt.landedCosts.forEach((cost, index) => {
    if (cost.amount < 0) {
      issues.push({
        path: `landedCosts[${index}].amount`,
        message: 'Landed cost amount cannot be negative',
        severity: 'error',
        code: 'RANGE',
      });
    }
  });
  
  // Validate total cost calculation
  const calculatedTotal = receipt.items.reduce((sum, item) => sum + item.totalCost, 0);
  if (Math.abs(receipt.totalCost - calculatedTotal) > 0.01) {
    issues.push({
      path: 'totalCost',
      message: `Total cost ${receipt.totalCost} does not match calculated total ${calculatedTotal}`,
      severity: 'error',
      code: 'BALANCE',
    });
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Process receipt
 */
export function processReceipt(receipt: InventoryReceipt): ProcessedReceipt {
  // Validate receipt first
  const validation = validateReceipt(receipt);
  if (!validation.isValid) {
    throw new Error(`Receipt validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Allocate landed costs
  const allocations = receipt.landedCosts.map(cost => 
    allocateLandedCosts(receipt, [cost])
  );
  
  // Create journal entries
  const journalEntries = createJournalEntries(receipt, allocations);
  
  return {
    receipt: {
      ...receipt,
      status: 'allocated',
    },
    allocations,
    journalEntries,
    status: 'allocated',
    processedAt: new Date(),
  };
}

// ============================================================================
// Rounding Governance
// ============================================================================

/**
 * Apply rounding governance to allocation
 */
export function applyRoundingGovernance(allocation: AllocationResult, method: RoundingMethod): AllocationResult {
  const adjustedItems: AllocationItem[] = [];
  let totalAdjusted = 0;
  
  allocation.items.forEach(item => {
    const roundedAmount = applyRoundingMethod(item.allocatedCost, method, 2);
    const roundingAdjustment = roundedAmount - item.allocatedCost;
    
    adjustedItems.push({
      ...item,
      roundingAdjustment,
      finalCost: roundedAmount,
      allocatedInReceiptCurrency: roundedAmount,
    });
    
    totalAdjusted += roundedAmount;
  });
  
  const newRoundingDifference = allocation.totalAllocated - totalAdjusted;
  
  return {
    ...allocation,
    items: adjustedItems,
    totalAllocated: totalAdjusted,
    roundingDifference: newRoundingDifference,
    isBalanced: Math.abs(newRoundingDifference) < 0.01,
  };
}

/**
 * Distribute rounding difference
 */
export function distributeRoundingDifference(allocation: AllocationResult): AllocationResult {
  if (Math.abs(allocation.roundingDifference) < 0.01) {
    return allocation; // No significant difference to distribute
  }
  
  // Largest remainders: assign ±0.01 to items with biggest fractional parts
  const sign = allocation.roundingDifference > 0 ? 1 : -1;
  let pennies = Math.round(Math.abs(allocation.roundingDifference) / CENT);
  if (pennies === 0) return { ...allocation, isBalanced: true, roundingDifference: 0 };

  const ranked = allocation.items
    .map((it, idx) => {
      const frac = Math.abs(it.finalCost / CENT - Math.trunc(it.finalCost / CENT));
      return { idx, frac };
    })
    .sort((a, b) => b.frac - a.frac);

  const adjusted = allocation.items.map(i => ({ ...i }));
  let i = 0;
  while (pennies > 0 && ranked.length > 0) {
    const t = ranked[i % ranked.length]!;
    if (t.idx >= 0 && t.idx < adjusted.length) {
      adjusted[t.idx]!.roundingAdjustment += sign * CENT;
      adjusted[t.idx]!.finalCost = round2(adjusted[t.idx]!.finalCost + sign * CENT);
      adjusted[t.idx]!.allocatedInReceiptCurrency = adjusted[t.idx]!.finalCost;
    }
    pennies--;
    i++;
  }
  const newTotal = adjusted.reduce((s, it) => s + it.finalCost, 0);
  return { ...allocation, items: adjusted, totalAllocated: newTotal, roundingDifference: 0, isBalanced: true };
}

/**
 * Validate allocation balance
 */
export function validateAllocationBalance(allocation: AllocationResult, tolerance: number): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check if allocation is balanced
  if (!allocation.isBalanced && Math.abs(allocation.roundingDifference) > tolerance) {
    issues.push({
      path: 'roundingDifference',
      message: `Allocation is not balanced. Difference: ${allocation.roundingDifference}`,
      severity: 'error',
      code: 'BALANCE',
    });
  }
  
  // Check if total allocated matches expected
  const actualTotal = allocation.items.reduce((sum, item) => sum + item.finalCost, 0);
  
  if (Math.abs(actualTotal - allocation.totalAllocated) > tolerance) {
    issues.push({
      path: 'totalAllocated',
      message: `Total allocated ${allocation.totalAllocated} does not match sum of items ${actualTotal}`,
      severity: 'error',
      code: 'BALANCE',
    });
  }
  
  // Check for negative allocations
  const negativeItems = allocation.items.filter(item => item.finalCost < 0);
  if (negativeItems.length > 0) {
    issues.push({
      path: 'items',
      message: `${negativeItems.length} items have negative final costs`,
      severity: 'error',
      code: 'RANGE',
    });
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Calculate rounding adjustment
 */
export function calculateRoundingAdjustment(allocation: AllocationResult): RoundingAdjustment[] {
  return allocation.items.map(item => ({
    item: item.item,
    originalAmount: item.allocatedCost,
    adjustedAmount: item.finalCost,
    difference: item.roundingAdjustment,
    method: RoundingMethod.HALF_UP,
    reason: 'Rounding governance applied',
  }));
}

// ============================================================================
// Cost Tracking
// ============================================================================

/**
 * Track allocated costs for an item
 */
export function trackAllocatedCosts(item: InventoryItem, allocation: AllocationResult): CostTracking {
  const itemAllocation = allocation.items.find(ai => ai.item.id === item.id);
  if (!itemAllocation) {
    throw new Error(`Item ${item.id} not found in allocation`);
  }
  
  return {
    item,
    originalCost: item.unitCost,
    allocatedCosts: itemAllocation.finalCost,
    totalCost: item.unitCost + itemAllocation.finalCost,
    adjustments: [],
    lastUpdated: new Date(),
  };
}

/**
 * Update cost tracking with adjustment
 */
export function updateCostTracking(tracking: CostTracking, adjustment: CostAdjustment): CostTracking {
  const newAdjustments = [...tracking.adjustments, adjustment];
  const totalAdjustments = newAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
  
  return {
    ...tracking,
    adjustments: newAdjustments,
    totalCost: tracking.originalCost + tracking.allocatedCosts + totalAdjustments,
    lastUpdated: new Date(),
  };
}

/**
 * Validate cost tracking
 */
export function validateCostTracking(tracking: CostTracking): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check if total cost is reasonable
  if (tracking.totalCost < 0) {
    issues.push({
      path: 'totalCost',
      message: 'Total cost cannot be negative',
      severity: 'error',
      code: 'RANGE',
    });
  }
  
  // Check if adjustments are reasonable
  const totalAdjustments = tracking.adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  if (Math.abs(totalAdjustments) > tracking.originalCost * 0.5) {
    issues.push({
      path: 'adjustments',
      message: 'Total adjustments exceed 50% of original cost',
      severity: 'warning',
      code: 'RANGE',
    });
  }
  
  // Validate adjustment data
  tracking.adjustments.forEach((adjustment, index) => {
    if (!adjustment.reason || adjustment.reason.trim() === '') {
      issues.push({
        path: `adjustments[${index}].reason`,
        message: 'Adjustment reason is required',
        severity: 'error',
        code: 'REQUIRED',
      });
    }
    
    if (!adjustment.approvedBy || adjustment.approvedBy.trim() === '') {
      issues.push({
        path: `adjustments[${index}].approvedBy`,
        message: 'Approval is required for adjustments',
        severity: 'error',
        code: 'REQUIRED',
      });
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Generate cost report
 */
export function generateCostReport(receipts: InventoryReceipt[], period: DateRange): CostReport {
  const totalLandedCosts = receipts.reduce((sum, receipt) => 
    sum + receipt.landedCosts.reduce((costSum, cost) => costSum + cost.amount, 0), 0
  );
  
  const totalAllocatedCosts = receipts.reduce((sum, receipt) => {
    // In practice, you'd calculate actual allocated costs
    return sum + receipt.landedCosts.reduce((costSum, cost) => costSum + cost.amount, 0);
  }, 0);
  
  const unallocatedCosts = totalLandedCosts - totalAllocatedCosts;
  const roundingDifferences = 0; // TODO: sum from actual allocations when persisted
  
  return {
    id: `cost_report_${period.start.getFullYear()}_${period.start.getMonth() + 1}`,
    receipts,
    period,
    totalLandedCosts,
    totalAllocatedCosts,
    unallocatedCosts,
    roundingDifferences,
    generatedAt: new Date(),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function applyRoundingMethod(amount: number, method: RoundingMethod, precision: number): number {
  const factor = Math.pow(10, precision);
  const scaled = amount * factor;
  
  switch (method) {
    case RoundingMethod.HALF_UP:
      return Math.round(scaled) / factor; // ties away from zero
    case RoundingMethod.HALF_DOWN:
      // ties go down: e.g., 1.5 -> 1, -1.5 -> -1
      const n = Math.trunc(scaled);
      const frac = Math.abs(scaled - n);
      if (Math.abs(frac - 0.5) < EPS) return n / factor;
      return Math.round(scaled) / factor;
    case RoundingMethod.HALF_EVEN:
      // banker's rounding: ties to even
      const floor = Math.floor(scaled);
      const diff = scaled - floor;
      if (Math.abs(diff - 0.5) < EPS) {
        return ((floor % 2 === 0 ? floor : floor + 1) / factor);
      }
      return Math.round(scaled) / factor;
    case RoundingMethod.CEILING:
      return Math.ceil(scaled) / factor;
    case RoundingMethod.FLOOR:
      return Math.floor(scaled) / factor;
    case RoundingMethod.TRUNCATE:
      return Math.trunc(scaled) / factor;
    default:
      return Math.round(scaled) / factor;
  }
}

function createJournalEntries(receipt: InventoryReceipt, allocations: AllocationResult[]): JournalEntry[] {
  const journalEntries: JournalEntry[] = [];
  
  // Create journal entry for inventory receipt
  const receiptEntry: JournalEntry = {
    id: `receipt_${receipt.id}_${Date.now()}`,
    date: receipt.receiptDate,
    reference: receipt.receiptNumber,
    description: `Inventory receipt from ${receipt.vendor}`,
    lines: receipt.items.map(item => ({
      id: `line_${item.id}_${Date.now()}`,
      accountCode: '1300', // Inventory account
      description: `Received ${item.description}`,
      debit: item.totalCost,
      credit: 0,
      currency: receipt.currency,
    })),
    totalDebits: receipt.items.reduce((sum, item) => sum + item.totalCost, 0),
    totalCredits: 0,
    currency: receipt.currency,
    status: 'draft',
  };
  
  // Add credit line for accounts payable
  receiptEntry.lines.push({
    id: `line_payable_${Date.now()}`,
    accountCode: '2100', // Accounts payable
    description: `Payable to ${receipt.vendor}`,
    debit: 0,
    credit: receiptEntry.totalDebits,
    currency: receipt.currency,
  });
  
  receiptEntry.totalCredits = receiptEntry.totalDebits;
  journalEntries.push(receiptEntry);
  
  // Create journal entries for landed cost allocations
  allocations.forEach(allocation => {
    const allocationEntry: JournalEntry = {
      id: `allocation_${allocation.receipt.id || receipt.id}_${Date.now()}`,
      date: new Date(),
      reference: `ALLOC-${allocation.receipt.id || receipt.id}`,
      description: `Landed cost allocation - ${allocation.method}`,
      lines: allocation.items.map(item => ({
        id: `line_${item.item.id}_${Date.now()}`,
        accountCode: '1300', // Inventory
        description: `Landed cost for ${item.item.description}`,
        debit: item.finalCost,
        credit: 0,
        currency: receipt.currency,
      })),
      totalDebits: allocation.totalAllocated,
      totalCredits: 0,
      currency: receipt.currency,
      status: 'draft',
    };
    
    // Credit a clearing/AP account to capitalize costs (not expense)
    allocationEntry.lines.push({
      id: `line_landed_cost_${Date.now()}`,
      accountCode: '2105', // Freight & duty clearing / AP
      description: 'Landed cost clearing',
      debit: 0,
      credit: allocation.totalAllocated,
      currency: receipt.currency,
    });
    
    allocationEntry.totalCredits = allocationEntry.totalDebits;
    journalEntries.push(allocationEntry);
  });
  
  return journalEntries;
}

/**
 * Convert allocation result to inventory layer capitalization entries
 * 
 * Returns item-level capitalization deltas that can be posted to your inventory layer engine.
 * Each entry represents the landed cost amount to be capitalized into the item's cost basis.
 * 
 * @param allocation - The allocation result with rounded and distributed amounts
 * @returns Array of capitalization entries ready for inventory layer processing
 */
export function toLayerCapitalizationEntries(allocation: AllocationResult): LayerCapitalizationEntry[] {
  return allocation.items.map(item => ({
    itemId: item.item.id,
    itemNumber: item.item.itemNumber,
    description: item.item.description,
    landedCostAmount: item.allocatedInReceiptCurrency ?? item.finalCost,
    currency: allocation.receipt.currency,
    allocationMethod: allocation.method,
    allocationFactor: item.allocationFactor,
    baseAmount: item.baseAmount,
    roundingAdjustment: item.roundingAdjustment,
    receiptId: allocation.receipt.id,
    receiptNumber: allocation.receipt.receiptNumber,
    receiptDate: allocation.receipt.receiptDate,
    vendor: allocation.receipt.vendor,
    fxSummary: allocation.fxSummary,
    processedAt: new Date(),
  }));
}

// small helpers
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
