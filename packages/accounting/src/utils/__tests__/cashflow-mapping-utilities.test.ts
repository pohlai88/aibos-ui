/**
 * Cash Flow Mapping Utilities Tests
 * 
 * Comprehensive test suite for cash flow mapping utilities,
 * indirect method generation, classification rules, and analysis.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  defineCashFlowMapping,
  validateCashFlowMapping,
  applyCashFlowMapping,
  generateIndirectCashFlow,
  calculateOperatingCashFlow,
  validateIndirectCashFlow,
  defineClassificationRule,
  applyClassificationRule,
  validateClassificationRule,
  analyzeCashFlowPatterns,
  calculateCashFlowRatios,
  identifyCashFlowTrends,
  type CashFlowMapping,
  type IndirectCashFlow,
  type OperatingCashFlow,
  type InvestingCashFlow,
  type FinancingCashFlow,
  type ClassificationRule,
  type ClassificationResult,
  type CashFlowAnalysis,
  type CashFlowRatios,
  type CashFlowTrend,
  type Transaction,
  type GLData,
  type DateRange,
  type AccountBalance,
  type MappedCashFlowTransaction,
  type CashFlowTransaction,
  type ValidationResult,
} from '../cashflow-mapping-utilities';

describe('Cash Flow Mapping Utilities', () => {
  let mockMappings: CashFlowMapping[];
  let mockTransactions: Transaction[];
  let mockGLData: GLData;
  let mockPeriod: DateRange;
  let mockClassificationRule: ClassificationRule;

  beforeEach(() => {
    mockPeriod = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31')
    };

    mockMappings = [
      defineCashFlowMapping('1000', 'operating', 'cash_receipts', {
        mappingType: 'direct',
        effectiveDate: new Date('2024-01-01')
      }),
      defineCashFlowMapping('1500', 'investing', 'capital_expenditures', {
        mappingType: 'direct',
        effectiveDate: new Date('2024-01-01')
      }),
      defineCashFlowMapping('2000', 'financing', 'debt_issuance', {
        mappingType: 'direct',
        effectiveDate: new Date('2024-01-01')
      })
    ];

    mockTransactions = [
      {
        id: 'tx-1',
        account: '1000',
        amount: 1000,
        currency: 'USD',
        date: new Date('2024-01-15'),
        description: 'Cash receipt from customer',
        reference: 'INV-001',
        type: 'credit'
      },
      {
        id: 'tx-2',
        account: '1500',
        amount: -5000,
        currency: 'USD',
        date: new Date('2024-02-01'),
        description: 'Equipment purchase',
        reference: 'EQ-001',
        type: 'debit'
      },
      {
        id: 'tx-3',
        account: '2000',
        amount: 10000,
        currency: 'USD',
        date: new Date('2024-02-15'),
        description: 'Loan proceeds',
        reference: 'LOAN-001',
        type: 'credit'
      }
    ];

    const mockBalances: AccountBalance[] = [
      {
        account: '1000',
        beginningBalance: 50000,
        endingBalance: 60000,
        netChange: 10000,
        currency: 'USD'
      },
      {
        account: '1500',
        beginningBalance: 200000,
        endingBalance: 195000,
        netChange: -5000,
        currency: 'USD'
      }
    ];

    mockGLData = {
      period: mockPeriod,
      transactions: mockTransactions,
      balances: mockBalances,
      currency: 'USD'
    };

    mockClassificationRule = {
      id: 'rule-001',
      name: 'Equipment Purchases',
      description: 'Classify equipment purchases as investing',
      conditions: [
        { field: 'account', operator: 'starts_with', value: '15' },
        { field: 'amount', operator: 'less_than', value: 0 }
      ],
      category: 'investing',
      subcategory: 'capital_expenditures',
      priority: 100,
      active: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };
  });

  describe('Cash Flow Mapping', () => {
    describe('defineCashFlowMapping', () => {
      it('should create a valid cash flow mapping', () => {
        const mapping = defineCashFlowMapping('1000', 'operating', 'cash_receipts');
        
        expect(mapping.id).toBe('mapping-1000-operating-cash_receipts');
        expect(mapping.account).toBe('1000');
        expect(mapping.category).toBe('operating');
        expect(mapping.subcategory).toBe('cash_receipts');
        expect(mapping.mappingType).toBe('direct');
        expect(mapping.active).toBe(true);
        expect(mapping.effectiveDate).toBeInstanceOf(Date);
        expect(mapping.createdAt).toBeInstanceOf(Date);
        expect(mapping.updatedAt).toBeInstanceOf(Date);
      });

      it('should create mapping with custom options', () => {
        const effectiveDate = new Date('2024-01-01');
        const expiryDate = new Date('2024-12-31');
        
        const mapping = defineCashFlowMapping('1000', 'operating', 'cash_receipts', {
          mappingType: 'calculated',
          effectiveDate,
          expiryDate,
          active: false
        });
        
        expect(mapping.mappingType).toBe('calculated');
        expect(mapping.effectiveDate).toBe(effectiveDate);
        expect(mapping.expiryDate).toBe(expiryDate);
        expect(mapping.active).toBe(false);
      });

      it('should throw error for invalid account', () => {
        expect(() => {
          defineCashFlowMapping('', 'operating', 'cash_receipts');
        }).toThrow('Account is required');
      });

      it('should throw error for invalid category', () => {
        expect(() => {
          defineCashFlowMapping('1000', 'invalid' as any, 'cash_receipts');
        }).toThrow('Invalid cash flow category: invalid');
      });

      it('should throw error for invalid subcategory', () => {
        expect(() => {
          defineCashFlowMapping('1000', 'operating', '');
        }).toThrow('Subcategory is required');
      });

      it('should throw error for invalid date range', () => {
        const effectiveDate = new Date('2024-12-31');
        const expiryDate = new Date('2024-01-01');
        
        expect(() => {
          defineCashFlowMapping('1000', 'operating', 'cash_receipts', {
            effectiveDate,
            expiryDate
          });
        }).toThrow('Expiry date must be after effective date');
      });
    });

    describe('validateCashFlowMapping', () => {
      it('should validate correct mapping', () => {
        const mapping = defineCashFlowMapping('1000', 'operating', 'cash_receipts');
        const validation = validateCashFlowMapping(mapping);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should detect missing ID', () => {
        const mapping = { ...mockMappings[0], id: '' };
        const validation = validateCashFlowMapping(mapping);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Mapping ID is required');
      });

      it('should detect invalid category', () => {
        const mapping = { ...mockMappings[0], category: 'invalid' as any };
        const validation = validateCashFlowMapping(mapping);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Invalid cash flow category: invalid');
      });

      it('should detect invalid mapping type', () => {
        const mapping = { ...mockMappings[0], mappingType: 'invalid' as any };
        const validation = validateCashFlowMapping(mapping);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Invalid mapping type: invalid');
      });

      it('should warn about future effective date', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        
        const mapping = defineCashFlowMapping('1000', 'operating', 'cash_receipts', {
          effectiveDate: futureDate
        });
        const validation = validateCashFlowMapping(mapping);
        
        expect(validation.warnings).toContain('Effective date is in the future');
      });
    });

    describe('applyCashFlowMapping', () => {
      it('should apply mappings to transactions', () => {
        const mappedTransactions = applyCashFlowMapping(mockTransactions, mockMappings);
        
        expect(mappedTransactions).toHaveLength(3);
        
        const operatingTx = mappedTransactions.find(tx => tx.mapped.category === 'operating');
        expect(operatingTx).toBeDefined();
        expect(operatingTx?.mapped.subcategory).toBe('cash_receipts');
        
        const investingTx = mappedTransactions.find(tx => tx.mapped.category === 'investing');
        expect(investingTx).toBeDefined();
        expect(investingTx?.mapped.subcategory).toBe('capital_expenditures');
        
        const financingTx = mappedTransactions.find(tx => tx.mapped.category === 'financing');
        expect(financingTx).toBeDefined();
        expect(financingTx?.mapped.subcategory).toBe('debt_issuance');
      });

      it('should exclude transactions with excluded mapping type', () => {
        const excludedMapping = defineCashFlowMapping('9999', 'operating', 'excluded', {
          mappingType: 'excluded'
        });
        
        const excludedTransaction: Transaction = {
          id: 'tx-excluded',
          account: '9999',
          amount: 100,
          currency: 'USD',
          date: new Date('2024-01-15'),
          description: 'Excluded transaction',
          type: 'credit'
        };
        
        const mappedTransactions = applyCashFlowMapping(
          [excludedTransaction], 
          [excludedMapping]
        );
        
        expect(mappedTransactions).toHaveLength(0);
      });

      it('should handle transactions without applicable mapping', () => {
        const unmappedTransaction: Transaction = {
          id: 'tx-unmapped',
          account: '9999',
          amount: 100,
          currency: 'USD',
          date: new Date('2024-01-15'),
          description: 'Unmapped transaction',
          type: 'credit'
        };
        
        const mappedTransactions = applyCashFlowMapping(
          [unmappedTransaction], 
          mockMappings
        );
        
        expect(mappedTransactions).toHaveLength(0);
      });

      it('should respect mapping effective dates', () => {
        const futureMapping = defineCashFlowMapping('1000', 'operating', 'cash_receipts', {
          effectiveDate: new Date('2025-01-01')
        });
        
        const mappedTransactions = applyCashFlowMapping(
          mockTransactions, 
          [futureMapping]
        );
        
        expect(mappedTransactions).toHaveLength(0);
      });
    });
  });

  describe('Indirect Cash Flow Generation', () => {
    describe('generateIndirectCashFlow', () => {
      it('should generate indirect cash flow statement', () => {
        const cashFlow = generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings);
        
        expect(cashFlow.period).toBe(mockPeriod);
        expect(cashFlow.currency).toBe('USD');
        expect(cashFlow.generatedAt).toBeInstanceOf(Date);
        expect(typeof cashFlow.netCashFlow).toBe('number');
        expect(typeof cashFlow.openingCash).toBe('number');
        expect(typeof cashFlow.closingCash).toBe('number');
        expect(cashFlow.operating).toBeDefined();
        expect(cashFlow.investing).toBeDefined();
        expect(cashFlow.financing).toBeDefined();
      });

      it('should calculate net cash flow correctly', () => {
        const cashFlow = generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings);
        
        const expectedNetCashFlow = 
          cashFlow.operating.operatingCashFlow + 
          cashFlow.investing.investingCashFlow + 
          cashFlow.financing.financingCashFlow;
        
        expect(Math.abs(cashFlow.netCashFlow - expectedNetCashFlow)).toBeLessThan(0.01);
      });

      it('should calculate closing cash correctly', () => {
        const cashFlow = generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings);
        
        const expectedClosingCash = cashFlow.openingCash + cashFlow.netCashFlow;
        expect(Math.abs(cashFlow.closingCash - expectedClosingCash)).toBeLessThan(0.01);
      });

      it('should throw error for invalid period', () => {
        const invalidPeriod: DateRange = {
          startDate: new Date('2024-03-31'),
          endDate: new Date('2024-01-01')
        };
        
        expect(() => {
          generateIndirectCashFlow(mockGLData, invalidPeriod, mockMappings);
        }).toThrow('Period start date must be before end date');
      });

      it('should throw error for empty transactions', () => {
        const emptyGLData = { ...mockGLData, transactions: [] };
        
        expect(() => {
          generateIndirectCashFlow(emptyGLData, mockPeriod, mockMappings);
        }).toThrow('No transactions provided for cash flow calculation');
      });
    });

    describe('calculateOperatingCashFlow', () => {
      it('should calculate operating cash flow', () => {
        const operating = calculateOperatingCashFlow(mockGLData, mockPeriod);
        
        expect(operating.netIncome).toBeDefined();
        expect(operating.adjustments).toBeDefined();
        expect(operating.workingCapitalChanges).toBeDefined();
        expect(typeof operating.operatingCashFlow).toBe('number');
      });

      it('should include adjustments in calculation', () => {
        const operating = calculateOperatingCashFlow(mockGLData, mockPeriod);
        
        const adjustmentsTotal = operating.adjustments.reduce((sum, adj) => sum + adj.amount, 0);
        const workingCapitalTotal = operating.workingCapitalChanges.reduce((sum, change) => sum + change.change, 0);
        
        const expectedOperatingCashFlow = operating.netIncome + adjustmentsTotal + workingCapitalTotal;
        expect(Math.abs(operating.operatingCashFlow - expectedOperatingCashFlow)).toBeLessThan(0.01);
      });
    });

    describe('validateIndirectCashFlow', () => {
      it('should validate correct cash flow statement', () => {
        const cashFlow = generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings);
        const validation = validateIndirectCashFlow(cashFlow);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should detect invalid period', () => {
        const invalidCashFlow = {
          ...generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings),
          period: {
            startDate: new Date('2024-03-31'),
            endDate: new Date('2024-01-01')
          }
        };
        
        const validation = validateIndirectCashFlow(invalidCashFlow);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Period start date must be before end date');
      });

      it('should detect missing currency', () => {
        const invalidCashFlow = {
          ...generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings),
          currency: '' as any
        };
        
        const validation = validateIndirectCashFlow(invalidCashFlow);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Currency is required');
      });

      it('should detect calculation errors', () => {
        const invalidCashFlow = {
          ...generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings),
          netCashFlow: 999999 // Wrong value
        };
        
        const validation = validateIndirectCashFlow(invalidCashFlow);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Net cash flow calculation is incorrect');
      });

      it('should warn about negative operating cash flow', () => {
        const negativeOperatingCashFlow = {
          ...generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings),
          operating: {
            ...generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings).operating,
            operatingCashFlow: -1000
          }
        };
        
        const validation = validateIndirectCashFlow(negativeOperatingCashFlow);
        
        expect(validation.warnings).toContain('Negative operating cash flow - investigate');
      });
    });
  });

  describe('Classification Rules', () => {
    describe('defineClassificationRule', () => {
      it('should define valid classification rule', () => {
        expect(() => {
          defineClassificationRule(mockClassificationRule);
        }).not.toThrow();
      });

      it('should throw error for invalid rule', () => {
        const invalidRule = { ...mockClassificationRule, id: '' };
        
        expect(() => {
          defineClassificationRule(invalidRule);
        }).toThrow('Invalid classification rule');
      });
    });

    describe('applyClassificationRule', () => {
      it('should apply classification rule to transaction', () => {
        const transaction: Transaction = {
          id: 'tx-1',
          account: '1500',
          amount: -1000,
          currency: 'USD',
          date: new Date('2024-01-15'),
          description: 'Equipment purchase',
          type: 'debit'
        };
        
        const result = applyClassificationRule(mockClassificationRule, transaction);
        
        expect(result.category).toBe('investing');
        expect(result.subcategory).toBe('capital_expenditures');
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.matchedConditions).toBeGreaterThan(0);
        expect(result.totalConditions).toBe(2);
        expect(result.classifiedAt).toBeInstanceOf(Date);
      });

      it('should handle partial condition matches', () => {
        const transaction: Transaction = {
          id: 'tx-1',
          account: '1500',
          amount: 1000, // Positive amount, doesn't match second condition
          currency: 'USD',
          date: new Date('2024-01-15'),
          description: 'Equipment sale',
          type: 'credit'
        };
        
        const result = applyClassificationRule(mockClassificationRule, transaction);
        
        expect(result.confidence).toBe(0.5); // 1 out of 2 conditions matched
        expect(result.matchedConditions).toBe(1);
        expect(result.totalConditions).toBe(2);
      });

      it('should throw error for inactive rule', () => {
        const inactiveRule = { ...mockClassificationRule, active: false };
        
        expect(() => {
          applyClassificationRule(inactiveRule, mockTransactions[0]);
        }).toThrow('Classification rule must be active');
      });
    });

    describe('validateClassificationRule', () => {
      it('should validate correct rule', () => {
        const validation = validateClassificationRule(mockClassificationRule);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should detect missing ID', () => {
        const invalidRule = { ...mockClassificationRule, id: '' };
        const validation = validateClassificationRule(invalidRule);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Rule ID is required');
      });

      it('should detect missing name', () => {
        const invalidRule = { ...mockClassificationRule, name: '' };
        const validation = validateClassificationRule(invalidRule);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Rule name is required');
      });

      it('should detect invalid category', () => {
        const invalidRule = { ...mockClassificationRule, category: 'invalid' as any };
        const validation = validateClassificationRule(invalidRule);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Invalid cash flow category: invalid');
      });

      it('should detect missing conditions', () => {
        const invalidRule = { ...mockClassificationRule, conditions: [] };
        const validation = validateClassificationRule(invalidRule);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('At least one condition is required');
      });

      it('should warn about many conditions', () => {
        const manyConditions = Array.from({ length: 15 }, (_, i) => ({
          field: 'account',
          operator: 'equals',
          value: `account-${i}`
        }));
        
        const ruleWithManyConditions = { ...mockClassificationRule, conditions: manyConditions };
        const validation = validateClassificationRule(ruleWithManyConditions);
        
        expect(validation.warnings).toContain('Large number of conditions may impact performance');
      });
    });
  });

  describe('Analysis and Ratios', () => {
    describe('analyzeCashFlowPatterns', () => {
      it('should analyze cash flow patterns', () => {
        const cashFlow = generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings);
        const analysis = analyzeCashFlowPatterns(cashFlow, [mockPeriod]);
        
        expect(analysis.period).toBe(mockPeriod);
        expect(typeof analysis.operatingMargin).toBe('number');
        expect(typeof analysis.cashConversionCycle).toBe('number');
        expect(typeof analysis.freeCashFlow).toBe('number');
        expect(typeof analysis.cashFlowQuality).toBe('number');
        expect(analysis.trends).toBeDefined();
        expect(analysis.calculatedAt).toBeInstanceOf(Date);
      });

      it('should handle zero net cash flow in operating margin', () => {
        const zeroNetCashFlow = {
          ...generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings),
          netCashFlow: 0
        };
        
        const analysis = analyzeCashFlowPatterns(zeroNetCashFlow, [mockPeriod]);
        
        expect(analysis.operatingMargin).toBe(0);
        expect(Number.isFinite(analysis.operatingMargin)).toBe(true);
      });
    });

    describe('calculateCashFlowRatios', () => {
      it('should calculate cash flow ratios', () => {
        const cashFlow = generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings);
        const ratios = calculateCashFlowRatios(cashFlow);
        
        expect(typeof ratios.operatingCashFlowRatio).toBe('number');
        expect(typeof ratios.cashFlowCoverageRatio).toBe('number');
        expect(typeof ratios.freeCashFlowYield).toBe('number');
        expect(typeof ratios.cashFlowToSalesRatio).toBe('number');
        expect(typeof ratios.cashFlowToDebtRatio).toBe('number');
        expect(ratios.calculatedAt).toBeInstanceOf(Date);
      });

      it('should handle zero net cash flow in operating ratio', () => {
        const zeroNetCashFlow = {
          ...generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings),
          netCashFlow: 0
        };
        
        const ratios = calculateCashFlowRatios(zeroNetCashFlow);
        
        expect(ratios.operatingCashFlowRatio).toBe(0);
        expect(Number.isFinite(ratios.operatingCashFlowRatio)).toBe(true);
      });

      it('should calculate all ratios as finite numbers', () => {
        const cashFlow = generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings);
        const ratios = calculateCashFlowRatios(cashFlow);
        
        expect(Number.isFinite(ratios.operatingCashFlowRatio)).toBe(true);
        expect(Number.isFinite(ratios.cashFlowCoverageRatio)).toBe(true);
        expect(Number.isFinite(ratios.freeCashFlowYield)).toBe(true);
        expect(Number.isFinite(ratios.cashFlowToSalesRatio)).toBe(true);
        expect(Number.isFinite(ratios.cashFlowToDebtRatio)).toBe(true);
      });
    });

    describe('identifyCashFlowTrends', () => {
      it('should identify cash flow trends', () => {
        const cashFlow = generateIndirectCashFlow(mockGLData, mockPeriod, mockMappings);
        const trends = identifyCashFlowTrends(cashFlow, mockPeriod);
        
        expect(Array.isArray(trends)).toBe(true);
        expect(trends.length).toBeGreaterThan(0);
        
        trends.forEach(trend => {
          expect(trend.metric).toBeDefined();
          expect(typeof trend.currentPeriod).toBe('number');
          expect(typeof trend.previousPeriod).toBe('number');
          expect(typeof trend.change).toBe('number');
          expect(typeof trend.changePercentage).toBe('number');
          expect(['improving', 'declining', 'stable']).toContain(trend.trend);
        });
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty mappings array', () => {
      const mappedTransactions = applyCashFlowMapping(mockTransactions, []);
      expect(mappedTransactions).toHaveLength(0);
    });

    it('should handle empty transactions array', () => {
      const mappedTransactions = applyCashFlowMapping([], mockMappings);
      expect(mappedTransactions).toHaveLength(0);
    });

    it('should handle transactions with different currencies', () => {
      const multiCurrencyTransaction: Transaction = {
        id: 'tx-multi',
        account: '1000',
        amount: 1000,
        currency: 'EUR',
        date: new Date('2024-01-15'),
        description: 'Multi-currency transaction',
        type: 'credit'
      };
      
      const mappedTransactions = applyCashFlowMapping(
        [multiCurrencyTransaction], 
        mockMappings
      );
      
      expect(mappedTransactions).toHaveLength(1);
      expect(mappedTransactions[0].mapped.currency).toBe('EUR');
    });

    it('should handle expired mappings', () => {
      const expiredMapping = defineCashFlowMapping('1000', 'operating', 'cash_receipts', {
        effectiveDate: new Date('2023-01-01'),
        expiryDate: new Date('2023-12-31')
      });
      
      const mappedTransactions = applyCashFlowMapping(
        mockTransactions, 
        [expiredMapping]
      );
      
      expect(mappedTransactions).toHaveLength(0);
    });

    it('should handle very large amounts', () => {
      const largeTransaction: Transaction = {
        id: 'tx-large',
        account: '1000',
        amount: 999999999,
        currency: 'USD',
        date: new Date('2024-01-15'),
        description: 'Large transaction',
        type: 'credit'
      };
      
      const mappedTransactions = applyCashFlowMapping(
        [largeTransaction], 
        mockMappings
      );
      
      expect(mappedTransactions).toHaveLength(1);
      expect(mappedTransactions[0].mapped.amount).toBe(999999999);
    });

    it('should handle negative amounts', () => {
      const negativeTransaction: Transaction = {
        id: 'tx-negative',
        account: '1000',
        amount: -1000,
        currency: 'USD',
        date: new Date('2024-01-15'),
        description: 'Negative transaction',
        type: 'debit'
      };
      
      const mappedTransactions = applyCashFlowMapping(
        [negativeTransaction], 
        mockMappings
      );
      
      expect(mappedTransactions).toHaveLength(1);
      expect(mappedTransactions[0].mapped.amount).toBe(-1000);
    });
  });
});
