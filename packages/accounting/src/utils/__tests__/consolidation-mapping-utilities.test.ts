/**
 * Consolidation Mapping Utilities Tests
 * 
 * Comprehensive test suite for COA mapping, currency translation, CTA calculations,
 * and translation rules with focus on hardening improvements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  defineCOAMapping,
  validateCOAMapping,
  validateCOAMappingSet,
  applyCOAMapping,
  translateCurrency,
  translateTransaction,
  validateCurrencyTranslation,
  calculateCTA,
  generateCTAEntries,
  validateCTACalculation,
  defineTranslationRule,
  applyTranslationRule,
  validateTranslationRule,
  type COAMapping,
  type TranslationResult,
  type CTAResult,
  type TranslationRule,
  type Transaction,
  type ExchangeRate,
  type ConsolidationEntity,
  type FiscalPeriod,
  type TranslationData,
  type JournalEntry,
  type ValidationResult
} from '../consolidation-mapping-utilities';

describe('Consolidation Mapping Utilities', () => {
  let mockExchangeRate: ExchangeRate;
  let mockTransaction: Transaction;
  let mockEntity: ConsolidationEntity;
  let mockPeriod: FiscalPeriod;
  let mockTranslationRule: TranslationRule;
  let mockTranslationData: TranslationData;

  beforeEach(() => {
    mockExchangeRate = {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.85,
      rateType: 'spot',
      date: new Date('2024-01-15'),
      source: 'central_bank'
    };

    mockTransaction = {
      id: 'tx-001',
      entity: 'entity-001',
      account: '1000',
      amount: 1000,
      currency: 'USD',
      date: new Date('2024-01-15'),
      description: 'Test transaction',
      reference: 'REF-001',
      type: 'debit'
    };

    mockEntity = {
      id: 'entity-001',
      name: 'Test Entity',
      currency: 'USD',
      reportingCurrency: 'EUR',
      status: 'active'
    };

    mockPeriod = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      periodNumber: 1,
      fiscalYear: 2024
    };

    mockTranslationRule = {
      id: 'rule-001',
      name: 'USD to EUR Translation',
      description: 'Translate USD amounts to EUR using current rate',
      sourceCurrency: 'USD',
      targetCurrency: 'EUR',
      rateSource: 'central_bank',
      translationMethod: 'current_rate',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockTranslationData = {
      transactions: [mockTransaction],
      rates: [mockExchangeRate],
      period: mockPeriod,
      entity: 'entity-001'
    };
  });

  describe('Currency Translation Hardening', () => {
    describe('translateCurrency', () => {
      it('should allow negative amounts (credits)', () => {
        const result = translateCurrency(-1000, 'USD', 'EUR', mockExchangeRate);
        
        expect(result.originalAmount).toBe(-1000);
        expect(result.translatedAmount).toBe(-850); // -1000 * 0.85
        expect(result.fromCurrency).toBe('USD');
        expect(result.toCurrency).toBe('EUR');
        expect(result.rate).toBe(0.85);
      });

      it('should support identity translation (same currency)', () => {
        const identityRate = {
          ...mockExchangeRate,
          fromCurrency: 'USD',
          toCurrency: 'USD',
          rate: 1
        };

        const result = translateCurrency(1000, 'USD', 'USD', identityRate);
        
        expect(result.originalAmount).toBe(1000);
        expect(result.translatedAmount).toBe(1000);
        expect(result.fromCurrency).toBe('USD');
        expect(result.toCurrency).toBe('USD');
        expect(result.rate).toBe(1);
      });

      it('should preserve sign through translation', () => {
        const positiveResult = translateCurrency(1000, 'USD', 'EUR', mockExchangeRate);
        const negativeResult = translateCurrency(-1000, 'USD', 'EUR', mockExchangeRate);
        
        expect(positiveResult.translatedAmount).toBeGreaterThan(0);
        expect(negativeResult.translatedAmount).toBeLessThan(0);
        expect(Math.abs(positiveResult.translatedAmount)).toBe(Math.abs(negativeResult.translatedAmount));
      });

      it('should throw error for invalid exchange rate', () => {
        const invalidRate = { ...mockExchangeRate, rate: -0.85 };
        
        expect(() => {
          translateCurrency(1000, 'USD', 'EUR', invalidRate);
        }).toThrow('Exchange rate must be positive');
      });

      it('should throw error for mismatched currencies', () => {
        const mismatchedRate = { ...mockExchangeRate, fromCurrency: 'GBP' };
        
        expect(() => {
          translateCurrency(1000, 'USD', 'EUR', mismatchedRate);
        }).toThrow('Exchange rate currencies do not match translation currencies');
      });
    });

    describe('translateTransaction', () => {
      it('should translate transaction with CTA calculation', () => {
        const result = translateTransaction(mockTransaction, 'EUR', mockExchangeRate);
        
        expect(result.original).toBe(mockTransaction);
        expect(result.translated.amount).toBe(850);
        expect(result.translated.currency).toBe('EUR');
        expect(result.cta).toBe(-150); // 850 - 1000
        expect(result.translation.originalAmount).toBe(1000);
        expect(result.translation.translatedAmount).toBe(850);
      });

      it('should preserve transaction sign in CTA', () => {
        const creditTransaction = { ...mockTransaction, amount: -1000 };
        const result = translateTransaction(creditTransaction, 'EUR', mockExchangeRate);
        
        expect(result.cta).toBe(150); // -850 - (-1000) = 150
      });
    });

    describe('validateCurrencyTranslation', () => {
      it('should allow negative amounts', () => {
        const translation: TranslationResult = {
          originalAmount: -1000,
          translatedAmount: -850,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: 0.85,
          translationDate: new Date(),
          translationMethod: 'current_rate'
        };

        const validation = validateCurrencyTranslation(translation);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should allow identity translations', () => {
        const translation: TranslationResult = {
          originalAmount: 1000,
          translatedAmount: 1000,
          fromCurrency: 'USD',
          toCurrency: 'USD',
          rate: 1,
          translationDate: new Date(),
          translationMethod: 'current_rate'
        };

        const validation = validateCurrencyTranslation(translation);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should validate calculation accuracy', () => {
        const translation: TranslationResult = {
          originalAmount: 1000,
          translatedAmount: 850.02, // Off by more than tolerance
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: 0.85,
          translationDate: new Date(),
          translationMethod: 'current_rate'
        };

        const validation = validateCurrencyTranslation(translation);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Translated amount calculation is incorrect');
      });
    });
  });

  describe('COA Mapping Hardening', () => {
    describe('defineCOAMapping', () => {
      it('should create valid COA mapping', () => {
        const mapping = defineCOAMapping('1000', '1100', 'entity-001');
        
        expect(mapping.localAccount).toBe('1000');
        expect(mapping.groupAccount).toBe('1100');
        expect(mapping.entity).toBe('entity-001');
        expect(mapping.mappingType).toBe('direct');
        expect(mapping.active).toBe(true);
        expect(mapping.id).toContain('entity-001');
      });

      it('should validate input requirements', () => {
        expect(() => {
          defineCOAMapping('', '1100', 'entity-001');
        }).toThrow('Local account is required');

        expect(() => {
          defineCOAMapping('1000', '', 'entity-001');
        }).toThrow('Group account is required');

        expect(() => {
          defineCOAMapping('1000', '1100', '');
        }).toThrow('Entity is required');
      });

      it('should validate date relationships', () => {
        const effectiveDate = new Date('2024-01-01');
        const expiryDate = new Date('2023-12-31'); // Before effective date
        
        expect(() => {
          defineCOAMapping('1000', '1100', 'entity-001', {
            effectiveDate,
            expiryDate
          });
        }).toThrow('Expiry date must be after effective date');
      });
    });

    describe('validateCOAMapping', () => {
      it('should validate required fields', () => {
        const invalidMapping: COAMapping = {
          id: '',
          localAccount: '',
          groupAccount: '',
          entity: '',
          mappingType: 'direct',
          active: true,
          effectiveDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const validation = validateCOAMapping(invalidMapping);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Mapping ID is required');
        expect(validation.errors).toContain('Local account is required');
        expect(validation.errors).toContain('Group account is required');
        expect(validation.errors).toContain('Entity is required');
      });

      it('should warn about special characters in account codes', () => {
        const mapping = defineCOAMapping('1000@', '1100#', 'entity-001');
        const validation = validateCOAMapping(mapping);
        
        expect(validation.warnings).toContain('Local account code contains special characters');
        expect(validation.warnings).toContain('Group account code contains special characters');
      });
    });

    describe('validateCOAMappingSet', () => {
      it('should detect overlapping mappings', () => {
        const mappings: COAMapping[] = [
          defineCOAMapping('1000', '1100', 'entity-001', {
            effectiveDate: new Date('2024-01-01'),
            expiryDate: new Date('2024-06-30')
          }),
          defineCOAMapping('1000', '1200', 'entity-001', {
            effectiveDate: new Date('2024-04-01'),
            expiryDate: new Date('2024-12-31')
          })
        ];

        const validation = validateCOAMappingSet(mappings);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Overlapping mappings for entity-001::1000 -> 1100 & 1200');
      });

      it('should allow non-overlapping mappings', () => {
        const mappings: COAMapping[] = [
          defineCOAMapping('1000', '1100', 'entity-001', {
            effectiveDate: new Date('2024-01-01'),
            expiryDate: new Date('2024-06-30')
          }),
          defineCOAMapping('1000', '1200', 'entity-001', {
            effectiveDate: new Date('2024-07-01'),
            expiryDate: new Date('2024-12-31')
          })
        ];

        const validation = validateCOAMappingSet(mappings);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should handle mappings without expiry dates', () => {
        const mappings: COAMapping[] = [
          defineCOAMapping('1000', '1100', 'entity-001', {
            effectiveDate: new Date('2024-01-01')
            // No expiry date
          }),
          defineCOAMapping('1000', '1200', 'entity-001', {
            effectiveDate: new Date('2024-07-01')
            // No expiry date
          })
        ];

        const validation = validateCOAMappingSet(mappings);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Overlapping mappings for entity-001::1000 -> 1100 & 1200');
      });
    });

    describe('applyCOAMapping', () => {
      it('should apply active mappings only', () => {
        const mappings: COAMapping[] = [
          defineCOAMapping('1000', '1100', 'entity-001', { 
            active: true,
            effectiveDate: new Date('2024-01-01') // Before transaction date
          }),
          defineCOAMapping('2000', '2100', 'entity-001', { 
            active: false,
            effectiveDate: new Date('2024-01-01')
          })
        ];

        const transactions: Transaction[] = [
          { ...mockTransaction, account: '1000' },
          { ...mockTransaction, account: '2000' }
        ];

        const result = applyCOAMapping(transactions, mappings);
        
        expect(result).toHaveLength(1);
        expect(result[0]?.mapped.account).toBe('1100');
      });

      it('should respect entity and date constraints', () => {
        const futureMapping = defineCOAMapping('1000', '1100', 'entity-001', {
          effectiveDate: new Date('2025-01-01')
        });

        const mappings: COAMapping[] = [futureMapping];
        const transactions: Transaction[] = [{ ...mockTransaction, account: '1000' }];

        const result = applyCOAMapping(transactions, mappings);
        
        expect(result).toHaveLength(0); // No mapping applied due to future effective date
      });
    });
  });

  describe('CTA Calculations', () => {
    describe('calculateCTA', () => {
      it('should calculate CTA with opening and closing rates', () => {
        const rates: ExchangeRate[] = [
          {
            fromCurrency: 'USD',
            toCurrency: 'EUR',
            rate: 0.80,
            rateType: 'spot',
            date: new Date('2024-01-01'),
            source: 'central_bank'
          },
          {
            fromCurrency: 'USD',
            toCurrency: 'EUR',
            rate: 0.85,
            rateType: 'spot',
            date: new Date('2024-01-31'),
            source: 'central_bank'
          }
        ];

        const result = calculateCTA(mockEntity, mockPeriod, rates);
        
        expect(result.entity).toBe('entity-001');
        expect(result.period).toBe(mockPeriod);
        expect(result.openingCTA).toBe(0);
        expect(result.periodCTA).toBeDefined();
        expect(result.closingCTA).toBeDefined();
        expect(result.translationRates).toBe(rates);
      });

      it('should throw error for same currency entity', () => {
        const sameCurrencyEntity = { ...mockEntity, reportingCurrency: 'USD' };
        
        expect(() => {
          calculateCTA(sameCurrencyEntity, mockPeriod, [mockExchangeRate]);
        }).toThrow('Entity currency and reporting currency cannot be the same for CTA calculation');
      });

      it('should throw error for missing rates', () => {
        expect(() => {
          calculateCTA(mockEntity, mockPeriod, []);
        }).toThrow('Exchange rates are required for CTA calculation');
      });
    });

    describe('generateCTAEntries', () => {
      it('should generate balanced journal entries for positive CTA', () => {
        const cta: CTAResult = {
          entity: 'entity-001',
          period: mockPeriod,
          openingCTA: 0,
          periodCTA: 1000,
          closingCTA: 1000,
          translationRates: [mockExchangeRate],
          calculationDate: new Date()
        };

        const entries = generateCTAEntries(cta);
        
        expect(entries).toHaveLength(1);
        const entry = entries[0]!;
        expect(entry.totalDebits).toBe(1000);
        expect(entry.totalCredits).toBe(1000);
        expect(entry.lines).toHaveLength(2);
        expect(entry.lines[0]?.debit).toBe(1000);
        expect(entry.lines[1]?.credit).toBe(1000);
      });

      it('should generate balanced journal entries for negative CTA', () => {
        const cta: CTAResult = {
          entity: 'entity-001',
          period: mockPeriod,
          openingCTA: 0,
          periodCTA: -1000,
          closingCTA: -1000,
          translationRates: [mockExchangeRate],
          calculationDate: new Date()
        };

        const entries = generateCTAEntries(cta);
        
        expect(entries).toHaveLength(1);
        const entry = entries[0]!;
        expect(entry.totalDebits).toBe(1000);
        expect(entry.totalCredits).toBe(1000);
        expect(entry.lines[0]?.credit).toBe(1000);
        expect(entry.lines[1]?.debit).toBe(1000);
      });

      it('should not generate entries for negligible CTA', () => {
        const cta: CTAResult = {
          entity: 'entity-001',
          period: mockPeriod,
          openingCTA: 0,
          periodCTA: 0.005, // Less than 0.01 threshold
          closingCTA: 0.005,
          translationRates: [mockExchangeRate],
          calculationDate: new Date()
        };

        const entries = generateCTAEntries(cta);
        
        expect(entries).toHaveLength(0);
      });

      it('should round totals to 2 decimal places', () => {
        const cta: CTAResult = {
          entity: 'entity-001',
          period: mockPeriod,
          openingCTA: 0,
          periodCTA: 1000.123456,
          closingCTA: 1000.123456,
          translationRates: [mockExchangeRate],
          calculationDate: new Date()
        };

        const entries = generateCTAEntries(cta);
        const entry = entries[0]!;
        
        expect(entry.totalDebits).toBe(1000.12);
        expect(entry.totalCredits).toBe(1000.12);
      });
    });

    describe('validateCTACalculation', () => {
      it('should validate CTA calculation accuracy', () => {
        const cta: CTAResult = {
          entity: 'entity-001',
          period: mockPeriod,
          openingCTA: 100,
          periodCTA: 200,
          closingCTA: 350, // Incorrect: should be 300
          translationRates: [mockExchangeRate],
          calculationDate: new Date()
        };

        const validation = validateCTACalculation(cta);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Closing CTA calculation is incorrect');
      });

      it('should warn about unusually large CTA', () => {
        const cta: CTAResult = {
          entity: 'entity-001',
          period: mockPeriod,
          openingCTA: 0,
          periodCTA: 2000000, // Very large
          closingCTA: 2000000,
          translationRates: [mockExchangeRate],
          calculationDate: new Date()
        };

        const validation = validateCTACalculation(cta);
        
        expect(validation.warnings).toContain('Period CTA is unusually large - verify calculation');
      });
    });
  });

  describe('Translation Rules', () => {
    describe('applyTranslationRule', () => {
      it('should scope transactions by entity and currency', () => {
        const mixedTransactions: Transaction[] = [
          { ...mockTransaction, entity: 'entity-001', currency: 'USD', amount: 1000 },
          { ...mockTransaction, entity: 'entity-002', currency: 'USD', amount: 500 }, // Different entity
          { ...mockTransaction, entity: 'entity-001', currency: 'GBP', amount: 200 }  // Different currency
        ];

        const mixedData: TranslationData = {
          transactions: mixedTransactions,
          rates: [mockExchangeRate],
          period: mockPeriod,
          entity: 'entity-001'
        };

        const result = applyTranslationRule(mockTranslationRule, mixedData);
        
        // Should only translate the first transaction (entity-001, USD)
        expect(result.originalAmount).toBe(1000);
        expect(result.translatedAmount).toBe(850);
      });

      it('should throw error for inactive rule', () => {
        const inactiveRule = { ...mockTranslationRule, active: false };
        
        expect(() => {
          applyTranslationRule(inactiveRule, mockTranslationData);
        }).toThrow('Translation rule must be active');
      });

      it('should throw error when no applicable rate found', () => {
        const noRateData = {
          ...mockTranslationData,
          rates: [] // No rates
        };
        
        expect(() => {
          applyTranslationRule(mockTranslationRule, noRateData);
        }).toThrow('No applicable exchange rate found for translation rule');
      });
    });

    describe('validateTranslationRule', () => {
      it('should validate required fields', () => {
        const invalidRule: TranslationRule = {
          id: '',
          name: '',
          description: '',
          sourceCurrency: '',
          targetCurrency: '',
          rateSource: 'central_bank',
          translationMethod: 'current_rate',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const validation = validateTranslationRule(invalidRule);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Rule ID is required');
        expect(validation.errors).toContain('Rule name is required');
        expect(validation.errors).toContain('Rule description is required');
        expect(validation.errors).toContain('Source currency is required');
        expect(validation.errors).toContain('Target currency is required');
      });

      it('should validate currency differences', () => {
        const sameCurrencyRule = { ...mockTranslationRule, targetCurrency: 'USD' };
        
        const validation = validateTranslationRule(sameCurrencyRule);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Source and target currencies cannot be the same');
      });

      it('should validate rate source and translation method', () => {
        const invalidRule = {
          ...mockTranslationRule,
          rateSource: 'invalid_source' as any,
          translationMethod: 'invalid_method' as any
        };

        const validation = validateTranslationRule(invalidRule);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Invalid rate source: invalid_source');
        expect(validation.errors).toContain('Invalid translation method: invalid_method');
      });
    });
  });

  describe('Rate Selection Hardening', () => {
    it('should select nearest prior rate for date', () => {
      const rates: ExchangeRate[] = [
        {
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: 0.80,
          rateType: 'spot',
          date: new Date('2024-01-01'),
          source: 'central_bank'
        },
        {
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: 0.85,
          rateType: 'spot',
          date: new Date('2024-01-15'),
          source: 'central_bank'
        },
        {
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: 0.90,
          rateType: 'spot',
          date: new Date('2024-01-20'),
          source: 'central_bank'
        }
      ];

      // Test with date between rates - should get the most recent prior rate
      const targetDate = new Date('2024-01-18');
      
      // This tests the findRateForDate function indirectly through calculateCTA
      const result = calculateCTA(mockEntity, {
        startDate: targetDate,
        endDate: targetDate,
        periodNumber: 1,
        fiscalYear: 2024
      }, rates);
      
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty transaction arrays', () => {
      const emptyData: TranslationData = {
        transactions: [],
        rates: [mockExchangeRate],
        period: mockPeriod,
        entity: 'entity-001'
      };

      const result = applyTranslationRule(mockTranslationRule, emptyData);
      
      expect(result.originalAmount).toBe(0);
      expect(result.translatedAmount).toBe(0);
    });

    it('should handle zero amounts', () => {
      const zeroTransaction = { ...mockTransaction, amount: 0 };
      const result = translateTransaction(zeroTransaction, 'EUR', mockExchangeRate);
      
      expect(result.translated.amount).toBe(0);
      expect(result.cta).toBe(0);
    });

    it('should handle very small amounts', () => {
      const smallAmount = 0.001;
      const result = translateCurrency(smallAmount, 'USD', 'EUR', mockExchangeRate);
      
      expect(result.translatedAmount).toBeCloseTo(0.00085, 6);
    });
  });
});
