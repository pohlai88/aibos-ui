/**
 * Budget Variance Utilities Tests
 * 
 * Comprehensive test suite for budget variance calculations,
 * trend analysis, reporting, and cost center tracking.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateVariance,
  analyzeVarianceTrends,
  generateVarianceReport,
  trackCostCenterVariance,
  type Budget,
  type Forecast,
  type Variance,
  type VarianceTrend,
  type VarianceReport,
  type CostCenterVariance,
  type FiscalPeriod,
} from '../budget-variance-utilities';

describe('Budget Variance Utilities', () => {
  let mockFiscalPeriod: FiscalPeriod;
  let mockBudgets: Budget[];
  let mockForecasts: Forecast[];
  let mockVariances: Variance[];

  beforeEach(() => {
    mockFiscalPeriod = {
      periodId: '2024-Q1',
      periodName: 'Q1 2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      fiscalYear: 2024,
      quarter: 1,
      month: 0,
      isClosed: false,
    };

    mockBudgets = [
      {
        budgetId: 'budget-1',
        budgetName: 'Sales Budget',
        budgetType: 'annual_budget',
        fiscalPeriod: mockFiscalPeriod,
        costCenter: 'CC001',
        accountCode: '4000',
        budgetAmount: 100000,
        currency: 'USD',
        budgetDate: new Date('2024-01-01'),
        approvedBy: 'manager1',
        approvedDate: new Date('2024-01-01'),
        status: 'approved',
      },
    ];

    mockForecasts = [
      {
        forecastId: 'forecast-1',
        forecastName: 'Sales Forecast',
        forecastType: 'revenue_forecast',
        fiscalPeriod: mockFiscalPeriod,
        costCenter: 'CC001',
        accountCode: '4000',
        forecastAmount: 95000,
        currency: 'USD',
        forecastDate: new Date('2024-01-15'),
        forecastMethod: 'trend_analysis',
        confidenceLevel: 'high',
        status: 'approved',
      },
    ];

    mockVariances = [
      {
        varianceId: 'variance-1',
        budgetId: 'budget-1',
        actualAmount: 95000,
        budgetAmount: 100000,
        varianceAmount: -5000,
        variancePercentage: -5.0,
        varianceType: 'budget_vs_actual',
        currency: 'USD',
        calculationDate: new Date('2024-03-31'),
        fiscalPeriod: mockFiscalPeriod,
        costCenter: 'CC001',
        accountCode: '4000',
      },
      {
        varianceId: 'variance-2',
        forecastId: 'forecast-1',
        actualAmount: 95000,
        forecastAmount: 95000,
        varianceAmount: 0,
        variancePercentage: 0.0,
        varianceType: 'forecast_vs_actual',
        currency: 'USD',
        calculationDate: new Date('2024-03-31'),
        fiscalPeriod: mockFiscalPeriod,
        costCenter: 'CC001',
        accountCode: '4000',
      },
    ];
  });

  describe('Variance Calculations', () => {
    it('should calculate budget variance correctly', () => {
      const variance = calculateVariance(
        95000, // actual
        100000, // budget
        undefined, // forecast
        '4000',
        mockFiscalPeriod,
        'USD',
        'CC001'
      );

      expect(variance.actualAmount).toBe(95000);
      expect(variance.budgetAmount).toBe(100000);
      expect(variance.varianceAmount).toBe(-5000);
      expect(variance.variancePercentage).toBe(-5.0);
      expect(variance.varianceType).toBe('budget_vs_actual');
      expect(variance.currency).toBe('USD');
      expect(variance.accountCode).toBe('4000');
      expect(variance.costCenter).toBe('CC001');
    });

    it('should calculate forecast variance correctly', () => {
      const variance = calculateVariance(
        95000, // actual
        undefined, // budget
        95000, // forecast
        '4000',
        mockFiscalPeriod,
        'USD'
      );

      expect(variance.actualAmount).toBe(95000);
      expect(variance.forecastAmount).toBe(95000);
      expect(variance.varianceAmount).toBe(0);
      expect(variance.variancePercentage).toBe(0.0);
      expect(variance.varianceType).toBe('forecast_vs_actual');
    });

    it('should handle zero budget amounts', () => {
      const variance = calculateVariance(
        1000, // actual
        0, // budget
        undefined, // forecast
        '4000',
        mockFiscalPeriod,
        'USD'
      );

      expect(variance.actualAmount).toBe(1000);
      expect(variance.budgetAmount).toBe(0);
      expect(variance.varianceAmount).toBe(1000);
      expect(variance.variancePercentage).toBe(0); // Should be 0 when budget is 0
    });

    it('should throw error when neither budget nor forecast provided', () => {
      expect(() => {
        calculateVariance(
          1000, // actual
          undefined, // budget
          undefined, // forecast
          '4000',
          mockFiscalPeriod,
          'USD'
        );
      }).toThrow('Either budget amount or forecast amount must be provided');
    });

    it('should handle JPY currency correctly (zero-decimal currency)', () => {
      const variance = calculateVariance(
        95000, // actual
        100000, // budget
        undefined, // forecast
        '4000',
        mockFiscalPeriod,
        'JPY'
      );

      expect(variance.actualAmount).toBe(95000);
      expect(variance.budgetAmount).toBe(100000);
      expect(variance.varianceAmount).toBe(-5000);
      expect(variance.variancePercentage).toBe(-5.0); // Should be properly rounded to 2 decimals
      expect(variance.currency).toBe('JPY');
    });

    it('should handle VND currency correctly (zero-decimal currency)', () => {
      const variance = calculateVariance(
        95000000, // actual (VND)
        100000000, // budget (VND)
        undefined, // forecast
        '4000',
        mockFiscalPeriod,
        'VND'
      );

      expect(variance.actualAmount).toBe(95000000);
      expect(variance.budgetAmount).toBe(100000000);
      expect(variance.varianceAmount).toBe(-5000000);
      expect(variance.variancePercentage).toBe(-5.0); // Should be properly rounded to 2 decimals
      expect(variance.currency).toBe('VND');
    });

    it('should handle fractional percentages correctly', () => {
      const variance = calculateVariance(
        100333, // actual
        100000, // budget
        undefined, // forecast
        '4000',
        mockFiscalPeriod,
        'USD'
      );

      expect(variance.varianceAmount).toBe(333);
      expect(variance.variancePercentage).toBeCloseTo(0.33, 2); // Should be rounded to 2 decimals
    });
  });

  describe('Variance Trend Analysis', () => {
    it('should analyze variance trends correctly', () => {
      const varianceHistory: Variance[] = [
        {
          varianceId: 'v1',
          actualAmount: 95000,
          budgetAmount: 100000,
          varianceAmount: -5000,
          variancePercentage: -5.0,
          varianceType: 'budget_vs_actual',
          currency: 'USD',
          calculationDate: new Date('2024-01-31'),
          fiscalPeriod: mockFiscalPeriod,
          accountCode: '4000',
        },
        {
          varianceId: 'v2',
          actualAmount: 98000,
          budgetAmount: 100000,
          varianceAmount: -2000,
          variancePercentage: -2.0,
          varianceType: 'budget_vs_actual',
          currency: 'USD',
          calculationDate: new Date('2024-02-28'),
          fiscalPeriod: mockFiscalPeriod,
          accountCode: '4000',
        },
        {
          varianceId: 'v3',
          actualAmount: 102000,
          budgetAmount: 100000,
          varianceAmount: 2000,
          variancePercentage: 2.0,
          varianceType: 'budget_vs_actual',
          currency: 'USD',
          calculationDate: new Date('2024-03-31'),
          fiscalPeriod: mockFiscalPeriod,
          accountCode: '4000',
        },
      ];

      const trend = analyzeVarianceTrends(varianceHistory, '4000', 'CC001', 'USD');

      expect(trend.accountCode).toBe('4000');
      expect(trend.costCenter).toBe('CC001');
      expect(trend.trendPeriod).toBe(3);
      expect(trend.averageVariance).toBeCloseTo(-1666.67, 2);
      expect(trend.varianceVolatility).toBeGreaterThan(0);
      expect(trend.currency).toBe('USD');
    });

    it('should throw error for insufficient variance history', () => {
      const singleVariance: Variance[] = [mockVariances[0]!];

      expect(() => {
        analyzeVarianceTrends(singleVariance, '4000', 'CC001', 'USD');
      }).toThrow('At least 2 variance records required for trend analysis');
    });

    it('should determine improving trend direction', () => {
      const improvingHistory: Variance[] = [
        { ...mockVariances[0]!, varianceAmount: 0, variancePercentage: 0 },
        { ...mockVariances[0]!, varianceAmount: -5000, variancePercentage: -5 },
        { ...mockVariances[0]!, varianceAmount: -10000, variancePercentage: -10 },
      ];

      const trend = analyzeVarianceTrends(improvingHistory, '4000', 'CC001', 'USD');
      expect(trend.trendDirection).toBe('improving');
    });

    it('should determine deteriorating trend direction', () => {
      const deterioratingHistory: Variance[] = [
        { ...mockVariances[0]!, varianceAmount: 0, variancePercentage: 0 },
        { ...mockVariances[0]!, varianceAmount: 5000, variancePercentage: 5 },
        { ...mockVariances[0]!, varianceAmount: 10000, variancePercentage: 10 },
      ];

      const trend = analyzeVarianceTrends(deterioratingHistory, '4000', 'CC001', 'USD');
      expect(trend.trendDirection).toBe('deteriorating');
    });
  });

  describe('Variance Reporting', () => {
    it('should generate variance report correctly', () => {
      const report = generateVarianceReport(
        mockVariances,
        'Monthly Variance Report',
        'monthly_variance_report',
        mockFiscalPeriod,
        'USD'
      );

      expect(report.reportName).toBe('Monthly Variance Report');
      expect(report.reportType).toBe('monthly_variance_report');
      expect(report.variances).toHaveLength(2);
      expect(report.summary).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.currency).toBe('USD');
    });

    it('should calculate variance summary correctly', () => {
      const report = generateVarianceReport(
        mockVariances,
        'Test Report',
        'monthly_variance_report',
        mockFiscalPeriod,
        'USD'
      );

      const summary = report.summary;
      expect(summary.totalBudgetVariance).toBe(-5000);
      expect(summary.totalForecastVariance).toBe(0);
      expect(summary.favorableVarianceCount).toBe(1);
      expect(summary.unfavorableVarianceCount).toBe(0);
      expect(summary.significantVarianceCount).toBe(0); // No variances > 10%
      expect(summary.averageVariancePercentage).toBeCloseTo(2.5, 2); // Average of 5% and 0%
    });

    it('should generate appropriate recommendations', () => {
      const highVarianceData: Variance[] = [
        {
          ...mockVariances[0]!,
          variancePercentage: 25.0, // High variance
        },
      ];

      const report = generateVarianceReport(
        highVarianceData,
        'Test Report',
        'monthly_variance_report',
        mockFiscalPeriod,
        'USD'
      );

      expect(report.recommendations).toContain('Address 1 significant variances (>10%)');
      expect(report.recommendations).toContain('Review high-variance accounts: 4000');
      expect(report.recommendations).toContain('Implement regular variance monitoring');
    });
  });

  describe('Cost Center Variance Tracking', () => {
    it('should track cost center variance correctly', () => {
      const ccVariance = trackCostCenterVariance(
        'CC001',
        'Sales Department',
        mockVariances,
        mockFiscalPeriod,
        'USD'
      );

      expect(ccVariance.costCenterId).toBe('CC001');
      expect(ccVariance.costCenterName).toBe('Sales Department');
      expect(ccVariance.totalBudget).toBe(100000);
      expect(ccVariance.totalActual).toBe(190000); // Sum of both variances
      expect(ccVariance.totalVariance).toBe(90000);
      expect(ccVariance.variancePercentage).toBeCloseTo(90.0, 2);
      expect(ccVariance.accountVariances).toHaveLength(2);
    });

    it('should handle zero budget totals', () => {
      const zeroBudgetVariances: Variance[] = [
        {
          ...mockVariances[0]!,
          budgetAmount: 0,
          varianceAmount: 1000,
        },
      ];

      const ccVariance = trackCostCenterVariance(
        'CC001',
        'Sales Department',
        zeroBudgetVariances,
        mockFiscalPeriod,
        'USD'
      );

      expect(ccVariance.totalBudget).toBe(0);
      expect(ccVariance.variancePercentage).toBe(0); // Should be 0 when budget is 0
    });

    it('should handle JPY currency correctly for cost center variance', () => {
      const jpyVariances: Variance[] = [
        {
          ...mockVariances[0]!,
          currency: 'JPY',
          actualAmount: 95000,
          budgetAmount: 100000,
          varianceAmount: -5000,
          variancePercentage: -5.0,
        },
      ];

      const ccVariance = trackCostCenterVariance(
        'CC001',
        'Sales Department',
        jpyVariances,
        mockFiscalPeriod,
        'JPY'
      );

      expect(ccVariance.totalBudget).toBe(100000);
      expect(ccVariance.totalActual).toBe(95000);
      expect(ccVariance.totalVariance).toBe(-5000);
      expect(ccVariance.variancePercentage).toBe(-5.0); // Should be properly rounded
      expect(ccVariance.currency).toBe('JPY');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty variance arrays', () => {
      const report = generateVarianceReport(
        [],
        'Empty Report',
        'monthly_variance_report',
        mockFiscalPeriod,
        'USD'
      );

      expect(report.variances).toHaveLength(0);
      expect(report.summary.totalBudgetVariance).toBe(0);
      expect(report.summary.averageVariancePercentage).toBe(0);
    });

    it('should handle very large variance percentages', () => {
      const largeVariance = calculateVariance(
        200000, // actual
        100000, // budget
        undefined, // forecast
        '4000',
        mockFiscalPeriod,
        'USD'
      );

      expect(largeVariance.varianceAmount).toBe(100000);
      expect(largeVariance.variancePercentage).toBe(100.0);
    });

    it('should handle negative actual amounts', () => {
      const negativeVariance = calculateVariance(
        -5000, // actual (negative)
        10000, // budget
        undefined, // forecast
        '4000',
        mockFiscalPeriod,
        'USD'
      );

      expect(negativeVariance.varianceAmount).toBe(-15000);
      expect(negativeVariance.variancePercentage).toBe(-150.0);
    });

    it('should handle mixed currency scenarios', () => {
      const usdVariance = calculateVariance(1000, 1000, undefined, '4000', mockFiscalPeriod, 'USD');
      const eurVariance = calculateVariance(1000, 1000, undefined, '4000', mockFiscalPeriod, 'EUR');
      const jpyVariance = calculateVariance(1000, 1000, undefined, '4000', mockFiscalPeriod, 'JPY');

      // All should have 0% variance regardless of currency
      expect(usdVariance.variancePercentage).toBe(0.0);
      expect(eurVariance.variancePercentage).toBe(0.0);
      expect(jpyVariance.variancePercentage).toBe(0.0);
    });
  });
});
