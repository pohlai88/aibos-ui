/**
 * Aging Utilities Tests
 * 
 * Comprehensive test suite for aging calculations, bucket management, 
 * credit limit operations, and collection tracking.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateAging,
  calculateCustomerAging,
  calculateVendorAging,
  defineAgingBuckets,
  validateAgingBuckets,
  updateAgingBuckets,
  checkCreditLimit,
  updateCreditLimit,
  validateCreditLimit,
  calculateCreditUtilization,
  trackCollectionActivity,
  calculateCollectionEfficiency,
  generateCollectionReport,
  getDefaultAgingBuckets,
  getAgingSummary,
  type AgingTransaction,
  type AgingBucket,
  type CreditLimit,
  type CollectionActivity,
  type DateRange,
} from '../aging-utilities';
import { DEFAULT_CURRENCY } from '../accounting-utilities';

describe('Aging Utilities', () => {
  let mockTransactions: AgingTransaction[];
  let mockBuckets: AgingBucket[];
  let asOfDate: Date;

  beforeEach(() => {
    asOfDate = new Date('2024-01-15');
    
    mockBuckets = [
      {
        id: 'current',
        name: 'Current',
        minDays: 0,
        maxDays: 30,
        description: '0-30 days',
        color: '#28a745',
      },
      {
        id: '31-60',
        name: '31-60 Days',
        minDays: 31,
        maxDays: 60,
        description: '31-60 days',
        color: '#ffc107',
      },
      {
        id: '61-90',
        name: '61-90 Days',
        minDays: 61,
        maxDays: 90,
        description: '61-90 days',
        color: '#fd7e14',
      },
      {
        id: 'over-90',
        name: 'Over 90 Days',
        minDays: 91,
        maxDays: Number.MAX_SAFE_INTEGER,
        description: 'Over 90 days',
        color: '#dc3545',
      },
    ];

    mockTransactions = [
      {
        id: 'txn-1',
        customer: 'Customer A',
        invoiceDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-10'),
        amount: 1000,
        currency: 'USD' as const,
        status: 'open' as const,
        paidAmount: 0,
        remainingAmount: 1000,
      },
      {
        id: 'txn-2',
        customer: 'Customer A',
        invoiceDate: new Date('2023-12-01'),
        dueDate: new Date('2023-12-15'),
        amount: 2000,
        currency: 'USD' as const,
        status: 'open' as const,
        paidAmount: 500,
        remainingAmount: 1500,
      },
      {
        id: 'txn-3',
        customer: 'Customer A',
        invoiceDate: new Date('2023-11-01'),
        dueDate: new Date('2023-11-15'),
        amount: 3000,
        currency: 'USD' as const,
        status: 'open' as const,
        paidAmount: 0,
        remainingAmount: 3000,
      },
      {
        id: 'txn-4',
        customer: 'Customer A',
        invoiceDate: new Date('2023-10-01'),
        dueDate: new Date('2023-10-15'),
        amount: 1000,
        currency: 'USD' as const,
        status: 'paid' as const,
        paidAmount: 1000,
        remainingAmount: 0,
      },
      {
        id: 'txn-5',
        customer: 'Customer A',
        invoiceDate: new Date('2023-09-01'),
        dueDate: new Date('2023-09-15'),
        amount: 500,
        currency: 'USD' as const,
        status: 'cancelled' as const,
        paidAmount: 0,
        remainingAmount: 0,
      },
    ];
  });

  describe('calculateAging', () => {
    it('should calculate aging with correct bucket distribution', () => {
      const result = calculateAging(mockTransactions, asOfDate, mockBuckets);
      
      expect(result.customer).toBe('Customer A');
      expect(result.asOfDate).toBe(asOfDate);
      expect(result.buckets).toHaveLength(4);
      
      // Check that percentages sum to 100%
      const totalPercentage = result.buckets.reduce((sum, bucket) => sum + bucket.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 2);
    });

    it('should exclude fully paid and cancelled transactions', () => {
      const result = calculateAging(mockTransactions, asOfDate, mockBuckets);
      
      // Should only include transactions with remainingAmount > 0 and status not 'paid' or 'cancelled'
      const totalTransactionCount = result.buckets.reduce((sum, bucket) => sum + bucket.transactionCount, 0);
      expect(totalTransactionCount).toBe(3); // Only txn-1, txn-2, txn-3
    });

    it('should calculate correct percentages', () => {
      const result = calculateAging(mockTransactions, asOfDate, mockBuckets);
      
      // Total amount should be 1000 + 1500 + 3000 = 5500
      expect(result.totalAmount).toBe(5500);
      
      // Check individual bucket percentages
      const currentBucket = result.buckets.find(b => b.bucket.id === 'current');
      const overdueBucket = result.buckets.find(b => b.bucket.id === '31-60');
      
      if (currentBucket) {
        expect(currentBucket.percentage).toBeCloseTo((1000 / 5500) * 100, 2);
      }
      
      if (overdueBucket) {
        expect(overdueBucket.percentage).toBeCloseTo((1500 / 5500) * 100, 2);
      }
    });

    it('should handle empty transaction list', () => {
      const result = calculateAging([], asOfDate, mockBuckets);
      
      expect(result.totalAmount).toBe(0);
      expect(result.totalOverdue).toBe(0);
      expect(result.averageDays).toBe(0);
      expect(result.customer).toBe('UNKNOWN');
    });

    it('should handle transactions with zero remaining amount', () => {
      const transactionsWithZero = [
        ...mockTransactions,
        {
          id: 'txn-zero',
          customer: 'Customer A',
          invoiceDate: new Date('2024-01-01'),
          dueDate: new Date('2024-01-10'),
          amount: 500,
          currency: 'USD' as const,
          status: 'open' as const,
          paidAmount: 500,
          remainingAmount: 0,
        },
      ];
      
      const result = calculateAging(transactionsWithZero, asOfDate, mockBuckets);
      
      // Should exclude the zero-remaining transaction
      const totalTransactionCount = result.buckets.reduce((sum, bucket) => sum + bucket.transactionCount, 0);
      expect(totalTransactionCount).toBe(3);
    });

    it('should throw error for invalid as-of date', () => {
      expect(() => {
        calculateAging(mockTransactions, new Date('invalid'), mockBuckets);
      }).toThrow('As-of date must be valid');
    });

    it('should throw error for empty buckets', () => {
      expect(() => {
        calculateAging(mockTransactions, asOfDate, []);
      }).toThrow('Aging buckets are required');
    });
  });

  describe('Bucket Management', () => {
    it('should define aging buckets correctly', () => {
      const definition = {
        buckets: mockBuckets,
        overdueThreshold: 30,
      };
      
      const result = defineAgingBuckets(definition);
      expect(result).toEqual(mockBuckets);
    });

    it('should validate aging buckets', () => {
      const validation = validateAgingBuckets(mockBuckets);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect overlapping buckets', () => {
      const overlappingBuckets = [
        {
          id: 'bucket1',
          name: 'Bucket 1',
          minDays: 0,
          maxDays: 30,
          description: '0-30 days',
        },
        {
          id: 'bucket2',
          name: 'Bucket 2',
          minDays: 25,
          maxDays: 60,
          description: '25-60 days',
        },
      ];
      
      const validation = validateAgingBuckets(overlappingBuckets);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Buckets Bucket 1 and Bucket 2 overlap');
    });

    it('should update aging buckets', () => {
      const newBucket = {
        id: 'new-bucket',
        name: 'New Bucket',
        minDays: 0,
        maxDays: 15,
        description: '0-15 days',
      };
      
      const updates = {
        addBucket: newBucket,
      };
      
      const result = updateAgingBuckets(mockBuckets, updates);
      expect(result).toHaveLength(mockBuckets.length + 1);
      expect(result).toContain(newBucket);
    });

    it('should get default aging buckets', () => {
      const defaultBuckets = getDefaultAgingBuckets();
      expect(defaultBuckets).toHaveLength(4);
      expect(defaultBuckets[0].id).toBe('current');
      expect(defaultBuckets[3].id).toBe('over-90');
    });
  });

  describe('Credit Limit Operations', () => {
    it('should check credit limit correctly', () => {
      const result = checkCreditLimit('Customer A', 1000, 5000);
      
      expect(result.customer).toBe('Customer A');
      expect(result.currentBalance).toBe(5000);
      expect(result.creditLimit).toBe(10000); // Default placeholder
      expect(result.availableCredit).toBe(5000);
      expect(result.utilizationPercentage).toBe(50);
      expect(result.isWithinLimit).toBe(true);
      expect(result.excessAmount).toBe(0);
    });

    it('should detect credit limit exceeded', () => {
      const result = checkCreditLimit('Customer A', 2000, 9000);
      
      expect(result.isWithinLimit).toBe(false);
      expect(result.excessAmount).toBe(1000);
    });

    it('should update credit limit with default currency', () => {
      const result = updateCreditLimit('Customer A', 15000, new Date('2024-01-01'));
      
      expect(result.customer).toBe('Customer A');
      expect(result.limit).toBe(15000);
      expect(result.currency).toBe(DEFAULT_CURRENCY);
      expect(result.status).toBe('active');
    });

    it('should validate credit limit', () => {
      const creditLimit: CreditLimit = {
        customer: 'Customer A',
        limit: 10000,
        currency: 'USD' as const,
        effectiveDate: new Date('2024-01-01'),
        status: 'active',
        lastUpdated: new Date(),
      };
      
      const validation = validateCreditLimit(creditLimit);
      expect(validation.isValid).toBe(true);
    });

    it('should calculate credit utilization', () => {
      const result = calculateCreditUtilization('Customer A', asOfDate);
      
      expect(result.customer).toBe('Customer A');
      expect(result.asOfDate).toBe(asOfDate);
      expect(result.creditLimit).toBe(10000); // Default placeholder
      expect(result.trend).toBe('stable');
    });
  });

  describe('Collection Management', () => {
    it('should track collection activity', () => {
      const activity: CollectionActivity = {
        id: 'activity-1',
        customer: 'Customer A',
        date: new Date('2024-01-15'),
        type: 'call',
        description: 'Follow-up call',
        amount: 0,
        currency: 'USD' as const,
        status: 'completed',
      };
      
      // Should not throw
      expect(() => {
        trackCollectionActivity('Customer A', activity);
      }).not.toThrow();
    });

    it('should calculate collection efficiency', () => {
      const period: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      
      const result = calculateCollectionEfficiency('Customer A', period);
      
      expect(result.customer).toBe('Customer A');
      expect(result.period).toEqual(period);
      expect(result.collectionRate).toBe(0); // Default placeholder
    });

    it('should generate collection report', () => {
      const customers = ['Customer A', 'Customer B'];
      const period: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      
      const result = generateCollectionReport(customers, period);
      
      expect(result.customers).toEqual(customers);
      expect(result.period).toEqual(period);
      expect(result.efficiency).toHaveLength(2);
    });
  });

  describe('Utility Functions', () => {
    it('should get aging summary', () => {
      const agingResults = [
        calculateAging(mockTransactions, asOfDate, mockBuckets),
      ];
      
      const summary = getAgingSummary(agingResults);
      
      expect(summary.totalCustomers).toBe(1);
      expect(summary.totalAmount).toBeGreaterThan(0);
      expect(summary.bucketSummary).toBeDefined();
    });

    it('should handle multiple customers in aging summary', () => {
      const customerBTransactions = mockTransactions.map(t => ({
        ...t,
        customer: 'Customer B',
      }));
      
      const agingResults = [
        calculateAging(mockTransactions, asOfDate, mockBuckets),
        calculateAging(customerBTransactions, asOfDate, mockBuckets),
      ];
      
      const summary = getAgingSummary(agingResults);
      
      expect(summary.totalCustomers).toBe(2);
      expect(summary.totalAmount).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative days past due (not yet due)', () => {
      const futureTransaction: AgingTransaction = {
        id: 'future-txn',
        customer: 'Customer A',
        invoiceDate: new Date('2024-01-20'),
        dueDate: new Date('2024-01-25'), // Due in 10 days (negative days past due)
        amount: 1000,
        currency: 'USD' as const,
        status: 'open' as const,
        paidAmount: 0,
        remainingAmount: 1000,
      };
      
      const result = calculateAging([futureTransaction], asOfDate, mockBuckets);
      
      // Future transactions should not be in any aging bucket
      const totalTransactionCount = result.buckets.reduce((sum, bucket) => sum + bucket.transactionCount, 0);
      expect(totalTransactionCount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it('should handle transactions exactly at bucket boundaries', () => {
      const boundaryTransaction: AgingTransaction = {
        id: 'boundary-txn',
        customer: 'Customer A',
        invoiceDate: new Date('2023-12-15'),
        dueDate: new Date('2023-12-15'),
        amount: 1000,
        currency: 'USD' as const,
        status: 'open' as const,
        paidAmount: 0,
        remainingAmount: 1000,
      };
      
      const result = calculateAging([boundaryTransaction], asOfDate, mockBuckets);
      
      // Should be in 31-60 bucket (31 days past due)
      const bucket31_60 = result.buckets.find(b => b.bucket.id === '31-60');
      expect(bucket31_60?.transactionCount).toBe(1);
    });
  });
});
