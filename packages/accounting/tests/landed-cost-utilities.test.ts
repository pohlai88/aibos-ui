import { describe, it, expect } from 'vitest';
import {
  allocateLandedCosts,
  applyRoundingGovernance,
  distributeRoundingDifference,
  createInventoryReceipt,
  processReceipt,
  setLandedCostFX,
  setLandedCostComplianceGuards,
  toLayerCapitalizationEntries
} from '../src/utils/landed-cost-utilities';
import { RoundingMethod } from '../src/utils/policies/rounding-policy';

type Curr = any; // simplify for tests
const USD = 'USD' as Curr;
const EUR = 'EUR' as Curr;

const baseItems = [
  { id: 'i1', itemNumber: 'SKU-1', description: 'Widget A', quantity: 10, unitCost: 5, totalCost: 50, weight: 4, volume: 2, unitOfMeasure: 'ea', currency: USD },
  { id: 'i2', itemNumber: 'SKU-2', description: 'Widget B', quantity: 5, unitCost: 12, totalCost: 60, weight: 6, volume: 3, unitOfMeasure: 'ea', currency: USD },
  { id: 'i3', itemNumber: 'SKU-3', description: 'Widget C', quantity: 2, unitCost: 20, totalCost: 40, weight: 10, volume: 5, unitOfMeasure: 'ea', currency: USD },
];

describe('Landed Cost Utilities - rounding and FX', () => {
  it('HALF_EVEN vs HALF_DOWN behavior yields expected totals after governance+distribution', () => {
    const receipt = createInventoryReceipt({
      receiptNumber: 'R-100',
      receiptDate: new Date('2025-04-01'),
      vendor: 'ACME',
      items: baseItems,
      landedCosts: [],
      currency: USD,
    });

    const result = allocateLandedCosts(receipt, [
      { id: 'LC1', type: 'freight', description: 'Ocean', amount: 100.0, currency: USD, allocationMethod: 'value', allocated: false }
    ]);

    const halfEven = applyRoundingGovernance(result, RoundingMethod.HALF_EVEN);
    expect(Math.abs(halfEven.totalAllocated - 100)).toBeLessThanOrEqual(0.01);
    const balancedEven = distributeRoundingDifference(halfEven);
    expect(balancedEven.isBalanced).toBe(true);
    expect(balancedEven.roundingDifference).toBe(0);
    // Mirror field should be present and sum to total
    const sumMirrorEven = balancedEven.items.reduce((s, it) => s + (it.allocatedInReceiptCurrency ?? 0), 0);
    expect(Math.abs(sumMirrorEven - balancedEven.totalAllocated)).toBeLessThanOrEqual(0.000001);

    const halfDown = applyRoundingGovernance(result, RoundingMethod.HALF_DOWN);
    const balancedDown = distributeRoundingDifference(halfDown);
    expect(balancedDown.isBalanced).toBe(true);
    expect(balancedDown.roundingDifference).toBe(0);
    const sumMirrorDown = balancedDown.items.reduce((s, it) => s + (it.allocatedInReceiptCurrency ?? 0), 0);
    expect(Math.abs(sumMirrorDown - balancedDown.totalAllocated)).toBeLessThanOrEqual(0.000001);
  });

  it('Largest-remainders distribution zeroes residual pennies exactly', () => {
    const receipt = createInventoryReceipt({
      receiptNumber: 'R-101',
      receiptDate: new Date('2025-04-02'),
      vendor: 'ACME',
      items: baseItems,
      landedCosts: [],
      currency: USD,
    });
    const result = allocateLandedCosts(receipt, [
      { id: 'LC2', type: 'duty', description: 'Import duty', amount: 123.45, currency: USD, allocationMethod: 'quantity', allocated: false }
    ]);
    // raw allocation has minor fractional leftovers
    const governed = applyRoundingGovernance(result, RoundingMethod.HALF_UP);
    const distributed = distributeRoundingDifference(governed);
    expect(distributed.isBalanced).toBe(true);
    expect(distributed.roundingDifference).toBe(0);
    // sum of final costs equals total allocated to the cent
    const sum = distributed.items.reduce((s, it) => s + it.finalCost, 0);
    expect(Math.abs(sum - distributed.totalAllocated)).toBeLessThanOrEqual(0.000001);
  });

  it('FX converter allows multi-currency landed costs and journals balance', () => {
    // Simple deterministic converter: 1 EUR = 1.1 USD on 2025-04-03
    setLandedCostFX((amount, from, to, date) => {
      if (from === EUR && to === USD) return amount * 1.1;
      if (from === USD && to === USD) return amount;
      throw new Error('rate not configured');
    });
    // Disable period guard for test
    setLandedCostComplianceGuards({ periodGuard: () => ({ allowed: true }) });

    const receipt = createInventoryReceipt({
      receiptNumber: 'R-102',
      receiptDate: new Date('2025-04-03'),
      vendor: 'Global Freight',
      items: baseItems,
      landedCosts: [
        { id: 'FX1', type: 'freight', description: 'EU Freight', amount: 100.00, currency: EUR, allocationMethod: 'weight', allocated: false }
      ],
      currency: USD,
    });

    const processed = processReceipt(receipt);
    // Find the allocation journal (last entry)
    const allocJE = processed.journalEntries[processed.journalEntries.length - 1];
    // Total debits should equal converted amount (100 EUR * 1.1 = 110 USD)
    expect(Math.abs(allocJE.totalDebits - 110)).toBeLessThanOrEqual(0.000001);
    expect(allocJE.totalDebits).toBeCloseTo(allocJE.totalCredits, 6);
    // Ensure credit account is the clearing/AP (2105) per capitalization policy
    const credit = allocJE.lines.find(l => l.credit > 0)!;
    expect(credit.accountCode).toBe('2105');

    // FX summary present and coherent
    const fxAlloc = processed.allocations[0];
    expect(fxAlloc.fxSummary?.receiptCurrency).toBe(USD);
    const eurRow = fxAlloc.fxSummary?.sources.find(s => s.currency === EUR)!;
    expect(eurRow.amount).toBeCloseTo(100, 6);
    expect(eurRow.converted).toBeCloseTo(110, 6);
    expect(eurRow.impliedRate).toBeCloseTo(1.1, 6);
  });

  it('toLayerCapitalizationEntries produces correct capitalization deltas', () => {
    const receipt = createInventoryReceipt({
      receiptNumber: 'R-103',
      receiptDate: new Date('2025-04-04'),
      vendor: 'Test Vendor',
      items: baseItems,
      landedCosts: [],
      currency: USD,
    });

    const result = allocateLandedCosts(receipt, [
      { id: 'LC3', type: 'freight', description: 'Test Freight', amount: 75.00, currency: USD, allocationMethod: 'weight', allocated: false }
    ]);

    const governed = applyRoundingGovernance(result, RoundingMethod.HALF_UP);
    const distributed = distributeRoundingDifference(governed);

    const capitalizationEntries = toLayerCapitalizationEntries(distributed);

    // Should have one entry per item
    expect(capitalizationEntries).toHaveLength(baseItems.length);

    // Verify entry structure and totals
    const totalCapitalized = capitalizationEntries.reduce((sum, entry) => sum + entry.landedCostAmount, 0);
    expect(Math.abs(totalCapitalized - distributed.totalAllocated)).toBeLessThanOrEqual(0.000001);

    // Check first entry details
    const firstEntry = capitalizationEntries[0];
    expect(firstEntry.itemId).toBe(baseItems[0].id);
    expect(firstEntry.itemNumber).toBe(baseItems[0].itemNumber);
    expect(firstEntry.currency).toBe(USD);
    expect(firstEntry.allocationMethod).toBe('weight');
    expect(firstEntry.receiptId).toBe(receipt.id);
    expect(firstEntry.receiptNumber).toBe(receipt.receiptNumber);
    expect(firstEntry.vendor).toBe(receipt.vendor);
    expect(firstEntry.fxSummary).toBeUndefined(); // No FX conversion in this test

    // Verify allocation factors sum to 1.0
    const totalFactor = capitalizationEntries.reduce((sum, entry) => sum + entry.allocationFactor, 0);
    expect(Math.abs(totalFactor - 1.0)).toBeLessThanOrEqual(0.000001);
  });
});
