/**
 * Bank Reconciliation Utilities Tests
 * 
 * Comprehensive test suite for bank reconciliation matching,
 * tolerance rules, adjustments, and exception handling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  matchBankTransactions,
  validateMatching,
  autoMatchTransactions,
  defineToleranceRule,
  applyToleranceRule,
  validateToleranceRule,
  createReconciliationAdjustment,
  postReconciliationAdjustments,
  validateReconciliationAdjustments,
  identifyReconciliationExceptions,
  resolveReconciliationException,
  trackExceptionHistory,
  type BankTransaction,
  type GLEntry,
  type MatchingRule,
  type ToleranceRule,
  type ReconciliationAdjustment,
  type BankReconciliation,
  type ReconciliationException,
  type ExceptionResolution,
} from '../bank-reconciliation-utilities';

describe('Bank Reconciliation Utilities', () => {
  let mockBankTransactions: BankTransaction[];
  let mockGLEntries: GLEntry[];
  let mockMatchingRules: MatchingRule[];
  let mockToleranceRule: ToleranceRule;
  let mockReconciliation: BankReconciliation;

  beforeEach(() => {
    mockBankTransactions = [
      {
        id: 'bank-1',
        bankAccount: 'BANK-001',
        transactionDate: new Date('2024-01-15'),
        valueDate: new Date('2024-01-15'),
        description: 'Payment from Customer A',
        amount: 1000,
        currency: 'USD',
        reference: 'PAY-001',
        type: 'credit',
        status: 'cleared',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'bank-2',
        bankAccount: 'BANK-001',
        transactionDate: new Date('2024-01-16'),
        valueDate: new Date('2024-01-16'),
        description: 'Bank Fee',
        amount: -25,
        currency: 'USD',
        reference: 'FEE-001',
        type: 'fee',
        status: 'cleared',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
      },
    ];

    mockGLEntries = [
      {
        id: 'gl-1',
        account: '1200',
        date: new Date('2024-01-15'),
        description: 'Payment from Customer A',
        debit: 0,
        credit: 1000,
        currency: 'USD',
        reference: 'PAY-001',
        status: 'posted',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'gl-2',
        account: '5000',
        date: new Date('2024-01-16'),
        description: 'Bank Fee',
        debit: 25,
        credit: 0,
        currency: 'USD',
        reference: 'FEE-001',
        status: 'posted',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
      },
    ];

    mockMatchingRules = [
      {
        id: 'rule-1',
        name: 'Amount Match',
        description: 'Match by amount within tolerance',
        ruleType: 'amount',
        conditions: [
          {
            field: 'amount',
            operator: 'less_than',
            value: 0.01,
            weight: 1.0,
          },
        ],
        tolerance: 0.01,
        active: true,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockToleranceRule = {
      id: 'tolerance-1',
      name: 'Standard Tolerance',
      description: 'Standard tolerance for amount matching',
      toleranceType: 'absolute',
      amount: 0.01,
      percentage: 0,
      currency: 'USD',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReconciliation = {
      id: 'recon-1',
      bankAccount: 'BANK-001',
      period: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      },
      openingBalance: 5000,
      closingBalance: 5975,
      bankStatementBalance: 5975,
      glBalance: 5975,
      adjustments: [],
      exceptions: [],
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('Transaction Matching', () => {
    it('should match bank transactions with GL entries correctly', () => {
      const matches = matchBankTransactions(mockBankTransactions, mockGLEntries, mockMatchingRules);

      expect(matches).toHaveLength(2);
      
      // Check first match (credit transaction)
      const creditMatch = matches.find(m => m.bankTransaction.id === 'bank-1');
      expect(creditMatch).toBeDefined();
      expect(creditMatch?.glEntry.id).toBe('gl-1');
      expect(creditMatch?.matchType).toBe('exact');
      expect(creditMatch?.confidence).toBeGreaterThan(0.7);

      // Check second match (debit transaction)
      const debitMatch = matches.find(m => m.bankTransaction.id === 'bank-2');
      expect(debitMatch).toBeDefined();
      expect(debitMatch?.glEntry.id).toBe('gl-2');
      expect(debitMatch?.matchType).toBe('exact');
      expect(debitMatch?.confidence).toBeGreaterThan(0.7);
    });

    it('should respect polarity matching (debit vs credit)', () => {
      const bankDebit: BankTransaction = {
        id: 'bank-debit',
        bankAccount: 'BANK-001',
        transactionDate: new Date('2024-01-15'),
        valueDate: new Date('2024-01-15'),
        description: 'Payment to Vendor',
        amount: -500,
        currency: 'USD',
        reference: 'PAY-VENDOR',
        type: 'debit',
        status: 'cleared',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const glDebit: GLEntry = {
        id: 'gl-debit',
        account: '2000',
        date: new Date('2024-01-15'),
        description: 'Payment to Vendor',
        debit: 500,
        credit: 0,
        currency: 'USD',
        reference: 'PAY-VENDOR',
        status: 'posted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const glCredit: GLEntry = {
        id: 'gl-credit',
        account: '2000',
        date: new Date('2024-01-15'),
        description: 'Payment to Vendor',
        debit: 0,
        credit: 500,
        currency: 'USD',
        reference: 'PAY-VENDOR',
        status: 'posted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const matches = matchBankTransactions([bankDebit], [glDebit, glCredit], mockMatchingRules);

      // Should match with GL debit entry, not credit entry
      expect(matches).toHaveLength(1);
      expect(matches[0]?.glEntry.id).toBe('gl-debit');
    });

    it('should handle tolerance-based matching', () => {
      const bankTransaction: BankTransaction = {
        id: 'bank-tolerance',
        bankAccount: 'BANK-001',
        transactionDate: new Date('2024-01-15'),
        valueDate: new Date('2024-01-15'),
        description: 'Payment with rounding',
        amount: 100.02,
        currency: 'USD',
        reference: 'PAY-ROUND',
        type: 'credit',
        status: 'cleared',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const glEntry: GLEntry = {
        id: 'gl-tolerance',
        account: '1200',
        date: new Date('2024-01-15'),
        description: 'Payment with rounding',
        debit: 0,
        credit: 100.00,
        currency: 'USD',
        reference: 'PAY-ROUND',
        status: 'posted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const toleranceRule: MatchingRule = {
        id: 'tolerance-rule',
        name: 'Tolerance Match',
        description: 'Match within tolerance',
        ruleType: 'amount',
        conditions: [
          {
            field: 'amount',
            operator: 'less_than',
            value: 0.05,
            weight: 1.0,
          },
        ],
        tolerance: 0.05,
        active: true,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const matches = matchBankTransactions([bankTransaction], [glEntry], [toleranceRule]);

      expect(matches).toHaveLength(1);
      expect(matches[0]?.matchType).toBe('tolerance');
    });

    it('should validate matching results correctly', () => {
      const matches = matchBankTransactions(mockBankTransactions, mockGLEntries, mockMatchingRules);
      const match = matches[0]!;

      const validation = validateMatching(match);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid matching results', () => {
      const invalidMatch = {
        bankTransaction: mockBankTransactions[0]!, // Amount: 1000
        glEntry: {
          ...mockGLEntries[0]!,
          debit: 0,
          credit: 500, // Different amount - should fail validation
        },
        matchType: 'exact' as const,
        confidence: 0.8,
        tolerance: 0.01,
        matchDate: new Date(),
      };

      const validation = validateMatching(invalidMatch);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Amount difference exceeds tolerance');
    });

    it('should perform auto-matching with tolerance', () => {
      const autoMatch = autoMatchTransactions(mockBankTransactions, mockGLEntries, 0.01);

      expect(autoMatch.matches).toHaveLength(2);
      expect(autoMatch.unmatchedBankTransactions).toHaveLength(0);
      expect(autoMatch.unmatchedGLEntries).toHaveLength(0);
      expect(autoMatch.totalMatches).toBe(2);
      expect(autoMatch.averageConfidence).toBeGreaterThan(0.5);
    });
  });

  describe('Tolerance Management', () => {
    it('should define tolerance rule correctly', () => {
      expect(() => {
        defineToleranceRule(mockToleranceRule);
      }).not.toThrow();
    });

    it('should apply tolerance rule correctly', () => {
      const result = applyToleranceRule(100.00, 100.01, mockToleranceRule);

      expect(result.amount1).toBe(100.00);
      expect(result.amount2).toBe(100.01);
      expect(result.difference).toBeCloseTo(0.01, 2);
      expect(result.isWithinTolerance).toBe(true);
      expect(result.toleranceAmount).toBe(0.01);
    });

    it('should detect amounts outside tolerance', () => {
      const result = applyToleranceRule(100.00, 100.05, mockToleranceRule);

      expect(result.difference).toBeCloseTo(0.05, 2);
      expect(result.isWithinTolerance).toBe(false);
    });

    it('should validate tolerance rule', () => {
      const validation = validateToleranceRule(mockToleranceRule);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid tolerance rule', () => {
      const invalidRule = {
        ...mockToleranceRule,
        amount: -0.01, // Negative amount
      };

      const validation = validateToleranceRule(invalidRule);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Tolerance amount cannot be negative');
    });

    it('should handle percentage-based tolerance', () => {
      const percentageRule: ToleranceRule = {
        id: 'percentage-tolerance',
        name: 'Percentage Tolerance',
        description: 'Percentage-based tolerance',
        toleranceType: 'percentage',
        amount: 0,
        percentage: 1, // 1%
        currency: 'USD',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = applyToleranceRule(100.00, 100.50, percentageRule);

      expect(result.toleranceAmount).toBeCloseTo(1.00, 1); // 1% of 100
      expect(result.isWithinTolerance).toBe(true);
    });
  });

  describe('Adjustment Management', () => {
    it('should create reconciliation adjustment', () => {
      const adjustment: ReconciliationAdjustment = {
        id: 'adj-1',
        type: 'bank_fee',
        amount: 25.00,
        currency: 'USD',
        description: 'Monthly maintenance fee',
        account: '5000',
        date: new Date('2024-01-31'),
        reason: 'fee',
        reference: 'FEE-MONTHLY',
        createdAt: new Date(),
      };

      expect(() => {
        createReconciliationAdjustment(adjustment);
      }).not.toThrow();
    });

    it('should post reconciliation adjustments as journal entries', () => {
      const adjustment: ReconciliationAdjustment = {
        id: 'adj-1',
        type: 'bank_fee',
        amount: 25.00,
        currency: 'USD',
        description: 'Monthly maintenance fee',
        account: '5000',
        date: new Date('2024-01-31'),
        reason: 'fee',
        reference: 'FEE-MONTHLY',
        createdAt: new Date(),
      };

      const entries = postReconciliationAdjustments([adjustment]);

      expect(entries).toHaveLength(1);
      expect(entries[0]?.lines).toHaveLength(2);
      expect(entries[0]?.totalDebits).toBe(25.00);
      expect(entries[0]?.totalCredits).toBe(25.00);
    });

    it('should validate reconciliation adjustments', () => {
      const adjustment: ReconciliationAdjustment = {
        id: 'adj-1',
        type: 'bank_fee',
        amount: 25.00,
        currency: 'USD',
        description: 'Monthly maintenance fee',
        account: '5000',
        date: new Date('2024-01-31'),
        reason: 'fee',
        reference: 'FEE-MONTHLY',
        createdAt: new Date(),
      };

      const validation = validateReconciliationAdjustments([adjustment]);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid adjustments', () => {
      const invalidAdjustment: ReconciliationAdjustment = {
        id: '',
        type: 'bank_fee',
        amount: 0, // Zero amount
        currency: 'USD',
        description: '',
        account: '',
        date: new Date('2024-01-31'),
        reason: 'fee',
        createdAt: new Date(),
      };

      const validation = validateReconciliationAdjustments([invalidAdjustment]);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Exception Handling', () => {
    it('should identify reconciliation exceptions', () => {
      const reconciliationWithDifference: BankReconciliation = {
        ...mockReconciliation,
        bankStatementBalance: 6000, // Different from GL balance
        glBalance: 5975,
        exceptions: [], // Ensure no existing exceptions
      };

      const exceptions = identifyReconciliationExceptions(reconciliationWithDifference);

      expect(exceptions.length).toBeGreaterThanOrEqual(1);
      const balanceException = exceptions.find(e => e.exceptionType === 'amount_mismatch');
      expect(balanceException).toBeDefined();
      expect(balanceException?.amount).toBe(25);
    });

    it('should resolve reconciliation exceptions', () => {
      const exception: ReconciliationException = {
        id: 'exception-1',
        reconciliation: mockReconciliation,
        exceptionType: 'amount_mismatch',
        description: 'Balance difference',
        amount: 25,
        currency: 'USD',
        date: new Date(),
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const resolution: ExceptionResolution = {
        resolutionType: 'adjustment',
        description: 'Created adjustment for bank fee',
        resolvedBy: 'user123',
        resolvedAt: new Date(),
      };

      expect(() => {
        resolveReconciliationException(exception, resolution);
      }).not.toThrow();
    });

    it('should track exception history', () => {
      const exception: ReconciliationException = {
        id: 'exception-1',
        reconciliation: mockReconciliation,
        exceptionType: 'amount_mismatch',
        description: 'Balance difference',
        amount: 25,
        currency: 'USD',
        date: new Date(),
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => {
        trackExceptionHistory(exception);
      }).not.toThrow();
    });

    it('should handle exceptions with currency from adjustments', () => {
      const reconciliationWithAdjustments: BankReconciliation = {
        ...mockReconciliation,
        adjustments: [
          {
            id: 'adj-1',
            type: 'bank_fee',
            amount: 25.00,
            currency: 'EUR',
            description: 'Bank fee',
            account: '5000',
            date: new Date(),
            reason: 'fee',
            createdAt: new Date(),
          },
        ],
      };

      const exceptions = identifyReconciliationExceptions(reconciliationWithAdjustments);

      expect(exceptions).toHaveLength(1);
      expect(exceptions[0]?.currency).toBe('EUR');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty transaction lists', () => {
      const matches = matchBankTransactions([], [], mockMatchingRules);
      expect(matches).toHaveLength(0);
    });

    it('should handle transactions with no matching GL entries', () => {
      const unmatchedBankTransaction: BankTransaction = {
        id: 'bank-unmatched',
        bankAccount: 'BANK-001',
        transactionDate: new Date('2024-01-15'),
        valueDate: new Date('2024-01-15'),
        description: 'Unmatched transaction',
        amount: 100,
        currency: 'USD',
        reference: 'UNMATCHED',
        type: 'credit',
        status: 'cleared',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const matches = matchBankTransactions([unmatchedBankTransaction], [], mockMatchingRules);
      expect(matches).toHaveLength(0);
    });

    it('should handle date-based matching rules', () => {
      const dateRule: MatchingRule = {
        id: 'date-rule',
        name: 'Date Match',
        description: 'Match by date within 2 days',
        ruleType: 'date',
        conditions: [
          {
            field: 'date',
            operator: 'less_than',
            value: 2,
            weight: 1.0,
          },
        ],
        tolerance: 0.01,
        active: true,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bankTransaction: BankTransaction = {
        id: 'bank-date',
        bankAccount: 'BANK-001',
        transactionDate: new Date('2024-01-15'),
        valueDate: new Date('2024-01-15'),
        description: 'Date test',
        amount: 100,
        currency: 'USD',
        reference: 'DATE-TEST',
        type: 'credit',
        status: 'cleared',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const glEntry: GLEntry = {
        id: 'gl-date',
        account: '1200',
        date: new Date('2024-01-16'), // 1 day difference
        description: 'Date test',
        debit: 0,
        credit: 100,
        currency: 'USD',
        reference: 'DATE-TEST',
        status: 'posted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const matches = matchBankTransactions([bankTransaction], [glEntry], [dateRule]);
      expect(matches).toHaveLength(1);
    });

    it('should handle reference-based matching rules', () => {
      const referenceRule: MatchingRule = {
        id: 'reference-rule',
        name: 'Reference Match',
        description: 'Match by reference contains',
        ruleType: 'reference',
        conditions: [
          {
            field: 'reference',
            operator: 'contains',
            value: 'PAY-001', // Specific reference
            weight: 1.0,
          },
        ],
        tolerance: 0.01,
        active: true,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Test with only the first transaction and its corresponding GL entry
      const singleTransaction = [mockBankTransactions[0]!];
      const singleGLEntry = [mockGLEntries[0]!];
      
      const matches = matchBankTransactions(singleTransaction, singleGLEntry, [referenceRule]);
      expect(matches).toHaveLength(1); // Should match because reference contains 'PAY-001'
    });
  });
});
