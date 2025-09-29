/**
 * Allocation Utilities Tests
 * 
 * Comprehensive test suite for allocation calculations, rule management,
 * rounding governance, and validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  defineAllocationRule,
  validateAllocationRule,
  executeAllocation,
  allocateByPercentage,
  allocateByDriver,
  allocateByFixedAmount,
  applyRoundingGovernance,
  distributeRoundingDifference,
  validateAllocationBalance,
  createPercentageAllocationRule,
  createDriverAllocationRule,
  createFixedAllocationRule,
  getAllocationSummary,
  createEmptyAllocationResult,
  type AllocationSource,
  type AllocationTarget,
  type AllocationRule,
  type AllocationContext,
  type AllocationResult,
  type RoundingDistributionMethod,
} from '../allocation-utilities';
import { DEFAULT_CURRENCY } from '../accounting-utilities';

describe('Allocation Utilities', () => {
  let mockSource: AllocationSource;
  let mockTargets: AllocationTarget[];
  let mockContext: AllocationContext;

  beforeEach(() => {
    mockSource = {
      accountCode: '4000',
      dimension: 'CostCenter',
      value: 'HQ',
    };

    mockTargets = [
      {
        accountCode: '5000',
        dimension: 'CostCenter',
        value: 'Sales',
        percentage: 60,
      },
      {
        accountCode: '5001',
        dimension: 'CostCenter',
        value: 'Marketing',
        percentage: 40,
      },
    ];

    mockContext = {
      period: '2024-01',
      currency: 'USD',
      dimensions: {
        CostCenter: 'HQ',
      },
    };
  });

  describe('Rule Management', () => {
    it('should define allocation rule correctly', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'percentage' }
      );

      expect(rule.id).toMatch(/^ALLOC-/);
      expect(rule.name).toBe('Allocation Rule for 4000');
      expect(rule.description).toBe('Allocation rule for 4000 to 2 targets');
      expect(rule.source).toEqual(mockSource);
      expect(rule.targets).toEqual(mockTargets);
      expect(rule.method.type).toBe('percentage');
      expect(rule.roundingMethod).toBeDefined();
      expect(rule.active).toBe(true);
    });

    it('should validate allocation rule successfully', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'percentage' }
      );

      const validation = validateAllocationRule(rule);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid percentage totals', () => {
      const invalidTargets = [
        { ...mockTargets[0]!, percentage: 70 },
        { ...mockTargets[1]!, percentage: 20 }, // Total = 90%, not 100%
      ];

      const rule = defineAllocationRule(
        mockSource,
        invalidTargets,
        { type: 'percentage' }
      );

      const validation = validateAllocationRule(rule);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Total percentage must equal 100%. Current total: 90%');
    });

    it('should detect missing driver values', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'driver' }
      );

      const validation = validateAllocationRule(rule);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('At least one target must have a driver for driver-based allocation');
    });

    it('should detect invalid fixed amounts', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'fixed' }
      );

      const validation = validateAllocationRule(rule);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Total fixed amount must be greater than 0');
    });

    it('should throw error for missing source', () => {
      expect(() => {
        defineAllocationRule(
          null as any,
          mockTargets,
          { type: 'percentage' }
        );
      }).toThrow('Allocation source is required');
    });

    it('should throw error for missing targets', () => {
      expect(() => {
        defineAllocationRule(
          mockSource,
          [],
          { type: 'percentage' }
        );
      }).toThrow('Allocation targets are required');
    });
  });

  describe('Allocation Execution', () => {
    it('should execute percentage allocation correctly', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'percentage' }
      );

      const result = executeAllocation(rule, 1000, mockContext);

      expect(result.sourceAmount).toBe(1000);
      expect(result.allocatedAmount).toBeCloseTo(1000, 2);
      expect(result.allocations).toHaveLength(2);
      expect(result.isBalanced).toBe(true);

      // Check individual allocations
      const salesAllocation = result.allocations.find(a => a.target.value === 'Sales');
      const marketingAllocation = result.allocations.find(a => a.target.value === 'Marketing');

      expect(salesAllocation?.percentage).toBe(60);
      expect(marketingAllocation?.percentage).toBe(40);
    });

    it('should execute driver allocation correctly', () => {
      const driverTargets = [
        {
          accountCode: '5000',
          dimension: 'CostCenter',
          value: 'Sales',
          driver: '100',
        },
        {
          accountCode: '5001',
          dimension: 'CostCenter',
          value: 'Marketing',
          driver: '50',
        },
      ];

      const rule = defineAllocationRule(
        mockSource,
        driverTargets,
        { type: 'driver' }
      );

      const result = executeAllocation(rule, 1000, mockContext);

      expect(result.sourceAmount).toBe(1000);
      expect(result.allocatedAmount).toBeCloseTo(1000, 2);
      expect(result.allocations).toHaveLength(2);

      // Check driver-based percentages (100/150 = 66.67%, 50/150 = 33.33%)
      const salesAllocation = result.allocations.find(a => a.target.value === 'Sales');
      const marketingAllocation = result.allocations.find(a => a.target.value === 'Marketing');

      expect(salesAllocation?.percentage).toBeCloseTo(66.67, 1);
      expect(marketingAllocation?.percentage).toBeCloseTo(33.33, 1);
    });

    it('should execute fixed amount allocation correctly', () => {
      const fixedTargets = [
        {
          accountCode: '5000',
          dimension: 'CostCenter',
          value: 'Sales',
          fixedAmount: 600,
        },
        {
          accountCode: '5001',
          dimension: 'CostCenter',
          value: 'Marketing',
          fixedAmount: 400,
        },
      ];

      const rule = defineAllocationRule(
        mockSource,
        fixedTargets,
        { type: 'fixed' }
      );

      const result = executeAllocation(rule, 1000, mockContext);

      expect(result.sourceAmount).toBe(1000);
      expect(result.allocatedAmount).toBe(1000); // Should sum to exactly 1000
      expect(result.allocations).toHaveLength(2);
      expect(result.isBalanced).toBe(true);

      // Check fixed amounts
      const salesAllocation = result.allocations.find(a => a.target.value === 'Sales');
      const marketingAllocation = result.allocations.find(a => a.target.value === 'Marketing');

      expect(salesAllocation?.amount).toBe(600);
      expect(marketingAllocation?.amount).toBe(400);
    });

    it('should execute proportional allocation correctly', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'proportional' }
      );

      const result = executeAllocation(rule, 1000, mockContext);

      expect(result.sourceAmount).toBe(1000);
      expect(result.allocatedAmount).toBeCloseTo(1000, 2);
      expect(result.allocations).toHaveLength(2);

      // Should be equal distribution (50% each)
      result.allocations.forEach(allocation => {
        expect(allocation.percentage).toBeCloseTo(50, 1);
      });
    });

    it('should use context currency for rounding', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'percentage' }
      );

      const usdContext = { ...mockContext, currency: 'USD' as const };
      const result = executeAllocation(rule, 1000, usdContext);

      expect(result.sourceAmount).toBe(1000);
      expect(result.allocatedAmount).toBeCloseTo(1000, 2);
    });

    it('should fallback to default currency when context currency is missing', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'percentage' }
      );

      const contextWithoutCurrency = { period: '2024-01' };
      const result = executeAllocation(rule, 1000, contextWithoutCurrency as AllocationContext);

      expect(result.sourceAmount).toBe(1000);
      expect(result.allocatedAmount).toBeCloseTo(1000, 2);
    });

    it('should throw error for inactive rule', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'percentage' }
      );
      rule.active = false;

      expect(() => {
        executeAllocation(rule, 1000, mockContext);
      }).toThrow('Allocation rule is not active');
    });

    it('should throw error for invalid amount', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'percentage' }
      );

      expect(() => {
        executeAllocation(rule, -100, mockContext);
      }).toThrow('Amount must be a positive number');
    });
  });

  describe('Allocation Engine', () => {
    it('should allocate by percentage with correct rounding', () => {
      const percentages = [
        { target: mockTargets[0]!, percentage: 33.33 },
        { target: mockTargets[1]!, percentage: 66.67 },
      ];

      const result = allocateByPercentage(1000, percentages, 'USD');

      expect(result.sourceAmount).toBe(1000);
      expect(result.allocatedAmount).toBeCloseTo(1000, 2);
      expect(result.allocations).toHaveLength(2);
      expect(result.isBalanced).toBe(true);
    });

    it('should allocate by driver with correct proportions', () => {
      const drivers = [
        { target: mockTargets[0]!, driverValue: 100 },
        { target: mockTargets[1]!, driverValue: 200 },
      ];

      const result = allocateByDriver(1000, drivers, 'USD');

      expect(result.sourceAmount).toBe(1000);
      expect(result.allocatedAmount).toBeCloseTo(1000, 2);
      expect(result.allocations).toHaveLength(2);

      // Check proportions (100/300 = 33.33%, 200/300 = 66.67%)
      const firstAllocation = result.allocations[0]!;
      const secondAllocation = result.allocations[1]!;

      expect(firstAllocation.percentage).toBeCloseTo(33.33, 1);
      expect(secondAllocation.percentage).toBeCloseTo(66.67, 1);
    });

    it('should allocate by fixed amount with proper rounding reconciliation', () => {
      const fixedAmounts = [
        { target: mockTargets[0]!, fixedAmount: 333.33 },
        { target: mockTargets[1]!, fixedAmount: 666.67 },
      ];

      const result = allocateByFixedAmount(1000, fixedAmounts, 'USD');

      expect(result.sourceAmount).toBe(1000);
      expect(result.allocatedAmount).toBeCloseTo(1000, 2);
      expect(result.allocations).toHaveLength(2);
      expect(result.isBalanced).toBe(true);

      // Check that amounts are properly rounded (USD has 2 decimal places)
      result.allocations.forEach(allocation => {
        expect(allocation.amount).toBeCloseTo(Math.round(allocation.amount * 100) / 100, 2);
      });
    });

    it('should handle zero driver values', () => {
      const drivers = [
        { target: { accountCode: '5000', dimension: 'CostCenter', value: 'Sales' }, driverValue: 0 },
        { target: { accountCode: '5001', dimension: 'CostCenter', value: 'Marketing' }, driverValue: 0 },
      ];

      expect(() => {
        allocateByDriver(1000, drivers, 'USD');
      }).toThrow('Total driver value must be greater than 0');
    });

    it('should handle fixed amounts exceeding source amount', () => {
      const fixedAmounts = [
        { target: mockTargets[0]!, fixedAmount: 600 },
        { target: mockTargets[1]!, fixedAmount: 500 }, // Total = 1100 > 1000
      ];

      expect(() => {
        allocateByFixedAmount(1000, fixedAmounts, 'USD');
      }).toThrow('Total fixed amount cannot exceed source amount');
    });
  });

  describe('Rounding Governance', () => {
    it('should apply rounding governance correctly', () => {
      const result = createEmptyAllocationResult(1000);
      result.allocations = [
        { target: mockTargets[0]!, amount: 333.33, percentage: 33.33 },
        { target: mockTargets[1]!, amount: 666.67, percentage: 66.67 },
      ];
      result.allocatedAmount = 1000;
      result.roundingDifference = 0;
      result.isBalanced = true;

      const governedResult = applyRoundingGovernance(result, 'HALF_EVEN' as any);
      expect(governedResult).toEqual(result); // Should return as-is when balanced
    });

    it('should distribute rounding difference to largest allocation', () => {
      const result = createEmptyAllocationResult(1000);
      result.allocations = [
        { target: mockTargets[0]!, amount: 333, percentage: 33.33 },
        { target: mockTargets[1]!, amount: 666, percentage: 66.67 },
      ];
      result.allocatedAmount = 999;
      result.roundingDifference = 1;
      result.isBalanced = false;

      const distributionMethod: RoundingDistributionMethod = { type: 'largest' };
      const distributedResult = distributeRoundingDifference(result, distributionMethod);

      expect(distributedResult.roundingDifference).toBe(0);
      expect(distributedResult.isBalanced).toBe(true);
      expect(distributedResult.allocatedAmount).toBe(1000);
    });

    it('should distribute rounding difference to smallest allocation', () => {
      const result = createEmptyAllocationResult(1000);
      result.allocations = [
        { target: mockTargets[0]!, amount: 333, percentage: 33.33 },
        { target: mockTargets[1]!, amount: 666, percentage: 66.67 },
      ];
      result.allocatedAmount = 999;
      result.roundingDifference = 1;
      result.isBalanced = false;

      const distributionMethod: RoundingDistributionMethod = { type: 'smallest' };
      const distributedResult = distributeRoundingDifference(result, distributionMethod);

      expect(distributedResult.roundingDifference).toBe(0);
      expect(distributedResult.isBalanced).toBe(true);
      expect(distributedResult.allocatedAmount).toBe(1000);
    });

    it('should distribute rounding difference proportionally', () => {
      const result = createEmptyAllocationResult(1000);
      result.allocations = [
        { target: mockTargets[0]!, amount: 333, percentage: 33.33 },
        { target: mockTargets[1]!, amount: 666, percentage: 66.67 },
      ];
      result.allocatedAmount = 999;
      result.roundingDifference = 1;
      result.isBalanced = false;

      const distributionMethod: RoundingDistributionMethod = { type: 'proportional' };
      const distributedResult = distributeRoundingDifference(result, distributionMethod);

      expect(distributedResult.roundingDifference).toBe(0);
      expect(distributedResult.isBalanced).toBe(true);
      expect(distributedResult.allocatedAmount).toBe(1000);
    });
  });

  describe('Validation', () => {
    it('should validate balanced allocation', () => {
      const result: AllocationResult = {
        sourceAmount: 1000,
        allocatedAmount: 1000,
        allocations: [
          { target: mockTargets[0]!, amount: 600, percentage: 60 },
          { target: mockTargets[1]!, amount: 400, percentage: 40 },
        ],
        roundingDifference: 0,
        isBalanced: true,
      };

      const validation = validateAllocationBalance(result);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect unbalanced allocation', () => {
      const result: AllocationResult = {
        sourceAmount: 1000,
        allocatedAmount: 950,
        allocations: [
          { target: mockTargets[0]!, amount: 600, percentage: 60 },
          { target: mockTargets[1]!, amount: 350, percentage: 40 },
        ],
        roundingDifference: 50,
        isBalanced: false,
      };

      const validation = validateAllocationBalance(result, 0.01);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Allocation is not balanced. Difference: 50');
    });

    it('should detect negative allocation amounts', () => {
      const result: AllocationResult = {
        sourceAmount: 1000,
        allocatedAmount: 1000,
        allocations: [
          { target: mockTargets[0]!, amount: -100, percentage: 60 },
          { target: mockTargets[1]!, amount: 1100, percentage: 40 },
        ],
        roundingDifference: 0,
        isBalanced: true,
      };

      const validation = validateAllocationBalance(result);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Allocation 1: Amount cannot be negative');
    });
  });

  describe('Utility Functions', () => {
    it('should create percentage allocation rule', () => {
      const rule = createPercentageAllocationRule(mockSource, mockTargets);
      expect(rule.method.type).toBe('percentage');
    });

    it('should create driver allocation rule', () => {
      const rule = createDriverAllocationRule(mockSource, mockTargets);
      expect(rule.method.type).toBe('driver');
    });

    it('should create fixed allocation rule', () => {
      const rule = createFixedAllocationRule(mockSource, mockTargets);
      expect(rule.method.type).toBe('fixed');
    });

    it('should get allocation summary', () => {
      const result: AllocationResult = {
        sourceAmount: 1000,
        allocatedAmount: 1000,
        allocations: [
          { target: mockTargets[0]!, amount: 600, percentage: 60 },
          { target: mockTargets[1]!, amount: 400, percentage: 40 },
        ],
        roundingDifference: 0,
        isBalanced: true,
      };

      const summary = getAllocationSummary(result);
      expect(summary.sourceAmount).toBe(1000);
      expect(summary.allocatedAmount).toBe(1000);
      expect(summary.totalAllocations).toBe(2);
      expect(summary.isBalanced).toBe(true);
      expect(summary.averageAllocation).toBe(500);
      expect(summary.largestAllocation).toBe(600);
      expect(summary.smallestAllocation).toBe(400);
    });

    it('should create empty allocation result', () => {
      const result = createEmptyAllocationResult(1000);
      expect(result.sourceAmount).toBe(1000);
      expect(result.allocatedAmount).toBe(0);
      expect(result.allocations).toHaveLength(0);
      expect(result.roundingDifference).toBe(1000);
      expect(result.isBalanced).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single target allocation', () => {
      const singleTarget = [{ ...mockTargets[0]!, percentage: 100 }];
      const rule = defineAllocationRule(
        mockSource,
        singleTarget,
        { type: 'percentage' }
      );

      const result = executeAllocation(rule, 1000, mockContext);
      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0]?.percentage).toBe(100);
    });

    it('should handle very small amounts', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'percentage' }
      );

      const result = executeAllocation(rule, 0.01, mockContext);
      expect(result.sourceAmount).toBe(0.01);
      expect(result.allocatedAmount).toBeCloseTo(0.01, 4);
    });

    it('should handle mixed currency contexts', () => {
      const rule = defineAllocationRule(
        mockSource,
        mockTargets,
        { type: 'percentage' }
      );

      const myrContext = { ...mockContext, currency: 'MYR' as const };
      const result = executeAllocation(rule, 1000, myrContext);
      expect(result.sourceAmount).toBe(1000);
      expect(result.allocatedAmount).toBeCloseTo(1000, 2);
    });
  });
});
