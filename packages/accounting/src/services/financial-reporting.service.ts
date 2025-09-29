import type { GeneralLedgerProjection } from '../projections/general-ledger.projection';

import { AccountType } from '../domain/account.domain';
import { addMonthsToDate, getEndOfMonth } from '../utils';

/**
 * Profit and Loss Statement
 */
export interface ProfitAndLossStatement {
  readonly tenantId: string;
  readonly period: string;
  readonly currencyCode: string;
  readonly generatedAt: Date;
  readonly revenue: {
    readonly grossRevenue: number;
    readonly netRevenue: number;
    readonly revenueAccounts: Array<{
      readonly accountCode: string;
      readonly accountName: string;
      readonly amount: number;
    }>;
  };
  readonly expenses: {
    readonly totalExpenses: number;
    readonly expenseAccounts: Array<{
      readonly accountCode: string;
      readonly accountName: string;
      readonly amount: number;
    }>;
  };
  readonly netIncome: number;
  readonly grossProfit: number;
  readonly operatingIncome: number;
}

/**
 * Balance Sheet
 */
export interface BalanceSheet {
  readonly tenantId: string;
  readonly asOfDate: Date;
  readonly currencyCode: string;
  readonly generatedAt: Date;
  readonly assets: {
    readonly currentAssets: Array<{
      readonly accountCode: string;
      readonly accountName: string;
      readonly amount: number;
    }>;
    readonly fixedAssets: Array<{
      readonly accountCode: string;
      readonly accountName: string;
      readonly amount: number;
    }>;
    readonly totalAssets: number;
  };
  readonly liabilities: {
    readonly currentLiabilities: Array<{
      readonly accountCode: string;
      readonly accountName: string;
      readonly amount: number;
    }>;
    readonly longTermLiabilities: Array<{
      readonly accountCode: string;
      readonly accountName: string;
      readonly amount: number;
    }>;
    readonly totalLiabilities: number;
  };
  readonly equity: {
    readonly equityAccounts: Array<{
      readonly accountCode: string;
      readonly accountName: string;
      readonly amount: number;
    }>;
    readonly totalEquity: number;
  };
  readonly totalLiabilitiesAndEquity: number;
  readonly isBalanced: boolean;
}

/**
 * Cash Flow Statement
 */
export interface CashFlowStatement {
  readonly tenantId: string;
  readonly period: string;
  readonly currencyCode: string;
  readonly generatedAt: Date;
  readonly operatingActivities: {
    readonly netIncome: number;
    readonly adjustments: Array<{
      readonly description: string;
      readonly amount: number;
    }>;
    readonly netCashFromOperations: number;
  };
  readonly investingActivities: {
    readonly activities: Array<{
      readonly description: string;
      readonly amount: number;
    }>;
    readonly netCashFromInvesting: number;
  };
  readonly financingActivities: {
    readonly activities: Array<{
      readonly description: string;
      readonly amount: number;
    }>;
    readonly netCashFromFinancing: number;
  };
  readonly netChangeInCash: number;
  readonly beginningCash: number;
  readonly endingCash: number;
}

/**
 * Financial ratios
 */
export interface FinancialRatios {
  readonly tenantId: string;
  readonly asOfDate: Date;
  readonly currencyCode: string;
  readonly generatedAt: Date;
  readonly liquidityRatios: {
    readonly currentRatio: number;
    readonly quickRatio: number;
    readonly cashRatio: number;
  };
  readonly profitabilityRatios: {
    readonly grossProfitMargin: number;
    readonly netProfitMargin: number;
    readonly returnOnAssets: number;
    readonly returnOnEquity: number;
  };
  readonly leverageRatios: {
    readonly debtToEquityRatio: number;
    readonly debtToAssetsRatio: number;
    readonly equityMultiplier: number;
  };
  readonly efficiencyRatios: {
    readonly assetTurnover: number;
    readonly inventoryTurnover: number;
    readonly receivablesTurnover: number;
  };
}

/**
 * Financial Reporting Service
 *
 * Generates comprehensive financial reports including P&L, Balance Sheet,
 * Cash Flow Statement, and financial ratios. Implements modern accounting
 * standards with multi-currency support and automated calculations.
 *
 * Key Features:
 * - Profit & Loss statement generation
 * - Balance sheet reporting
 * - Cash flow statement
 * - Financial ratio calculations
 * - Multi-currency support
 * - Period-based reporting
 * - Automated validation
 */
export class FinancialReportingService {
  constructor(private readonly glProjection: GeneralLedgerProjection) {}

  /**
   * Generate Profit and Loss Statement
   */
  public async generateProfitAndLoss(
    tenantId: string,
    period: string,
    currencyCode: string = 'MYR',
  ): Promise<ProfitAndLossStatement> {
    const periodBalances = this.glProjection.getPeriodBalances(tenantId, period);

    // Separate revenue and expense accounts
    const revenueAccounts = periodBalances.filter(
      (balance) => balance.accountType === AccountType.REVENUE,
    );
    const expenseAccounts = periodBalances.filter(
      (balance) => balance.accountType === AccountType.EXPENSE,
    );

    // Calculate totals
    const grossRevenue = revenueAccounts.reduce((sum, accumulator) => sum + accumulator.balance, 0);
    const totalExpenses = expenseAccounts.reduce(
      (sum, accumulator) => sum + accumulator.balance,
      0,
    );
    const netIncome = grossRevenue - totalExpenses;

    return {
      tenantId,
      period,
      currencyCode,
      generatedAt: new Date(),
      revenue: {
        grossRevenue,
        netRevenue: grossRevenue, // Assuming no deductions for now
        revenueAccounts: revenueAccounts.map((accumulator) => ({
          accountCode: accumulator.accountCode,
          accountName: accumulator.accountName,
          amount: accumulator.balance,
        })),
      },
      expenses: {
        totalExpenses,
        expenseAccounts: expenseAccounts.map((accumulator) => ({
          accountCode: accumulator.accountCode,
          accountName: accumulator.accountName,
          amount: accumulator.balance,
        })),
      },
      netIncome,
      grossProfit: grossRevenue, // Same as gross revenue for now
      operatingIncome: netIncome, // Same as net income for now
    };
  }

  /**
   * Generate Balance Sheet
   */
  public async generateBalanceSheet(
    tenantId: string,
    asOfDate: Date,
    currencyCode: string = 'MYR',
  ): Promise<BalanceSheet> {
    const balances = this.glProjection.getAllAccountBalances(tenantId);

    // Separate by account type
    const assetAccounts = balances.filter((b) => b.accountType === AccountType.ASSET);
    const liabilityAccounts = balances.filter((b) => b.accountType === AccountType.LIABILITY);
    const equityAccounts = balances.filter((b) => b.accountType === AccountType.EQUITY);

    // Categorize assets (simplified - in real implementation, use account codes or metadata)
    const currentAssets = assetAccounts.filter(
      (accumulator) =>
        accumulator.accountCode.includes('CASH') ||
        accumulator.accountCode.includes('AR') ||
        accumulator.accountCode.includes('INVENTORY'),
    );
    const fixedAssets = assetAccounts.filter(
      (accumulator) =>
        accumulator.accountCode.includes('EQUIPMENT') ||
        accumulator.accountCode.includes('BUILDING') ||
        accumulator.accountCode.includes('VEHICLE'),
    );

    // Categorize liabilities (simplified)
    const currentLiabilities = liabilityAccounts.filter(
      (accumulator) =>
        accumulator.accountCode.includes('AP') || accumulator.accountCode.includes('ACCRUED'),
    );
    const longTermLiabilities = liabilityAccounts.filter(
      (accumulator) =>
        accumulator.accountCode.includes('LOAN') || accumulator.accountCode.includes('MORTGAGE'),
    );

    // Calculate totals
    const totalAssets = assetAccounts.reduce((sum, accumulator) => sum + accumulator.balance, 0);
    const totalLiabilities = liabilityAccounts.reduce(
      (sum, accumulator) => sum + accumulator.balance,
      0,
    );
    const totalEquity = equityAccounts.reduce((sum, accumulator) => sum + accumulator.balance, 0);
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      tenantId,
      asOfDate,
      currencyCode,
      generatedAt: new Date(),
      assets: {
        currentAssets: currentAssets.map((accumulator) => ({
          accountCode: accumulator.accountCode,
          accountName: accumulator.accountName,
          amount: accumulator.balance,
        })),
        fixedAssets: fixedAssets.map((accumulator) => ({
          accountCode: accumulator.accountCode,
          accountName: accumulator.accountName,
          amount: accumulator.balance,
        })),
        totalAssets,
      },
      liabilities: {
        currentLiabilities: currentLiabilities.map((accumulator) => ({
          accountCode: accumulator.accountCode,
          accountName: accumulator.accountName,
          amount: accumulator.balance,
        })),
        longTermLiabilities: longTermLiabilities.map((accumulator) => ({
          accountCode: accumulator.accountCode,
          accountName: accumulator.accountName,
          amount: accumulator.balance,
        })),
        totalLiabilities,
      },
      equity: {
        equityAccounts: equityAccounts.map((accumulator) => ({
          accountCode: accumulator.accountCode,
          accountName: accumulator.accountName,
          amount: accumulator.balance,
        })),
        totalEquity,
      },
      totalLiabilitiesAndEquity,
      isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
    };
  }

  /**
   * Generate Cash Flow Statement
   */
  public async generateCashFlowStatement(
    tenantId: string,
    period: string,
    currencyCode: string = 'MYR',
  ): Promise<CashFlowStatement> {
    // Get P&L for the period
    const pnl = await this.generateProfitAndLoss(tenantId, period, currencyCode);

    // Get balance sheet for beginning and end of period
    const periodStart = new Date(period + '-01'); // Assuming period format like "2024-01"
    const periodEnd = getEndOfMonth(addMonthsToDate(periodStart, 1));

    const beginningBalanceSheet = await this.generateBalanceSheet(
      tenantId,
      periodStart,
      currencyCode,
    );
    const endingBalanceSheet = await this.generateBalanceSheet(tenantId, periodEnd, currencyCode);

    // Calculate cash changes
    const beginningCash = this.getCashBalance(beginningBalanceSheet);
    const endingCash = this.getCashBalance(endingBalanceSheet);
    const netChangeInCash = endingCash - beginningCash;

    // Operating activities (simplified)
    const operatingActivities = {
      netIncome: pnl.netIncome,
      adjustments: [
        { description: 'Depreciation', amount: 0 }, // Would need to calculate from journal entries
        { description: 'Changes in Working Capital', amount: 0 }, // Would need detailed analysis
      ],
      netCashFromOperations: pnl.netIncome, // Simplified
    };

    // Investing activities (simplified)
    const investingActivities = {
      activities: [
        { description: 'Purchase of Fixed Assets', amount: 0 }, // Would need to calculate
        { description: 'Sale of Fixed Assets', amount: 0 }, // Would need to calculate
      ],
      netCashFromInvesting: 0, // Simplified
    };

    // Financing activities (simplified)
    const financingActivities = {
      activities: [
        { description: 'Borrowings', amount: 0 }, // Would need to calculate
        { description: 'Repayments', amount: 0 }, // Would need to calculate
        { description: 'Equity Contributions', amount: 0 }, // Would need to calculate
      ],
      netCashFromFinancing: 0, // Simplified
    };

    return {
      tenantId,
      period,
      currencyCode,
      generatedAt: new Date(),
      operatingActivities,
      investingActivities,
      financingActivities,
      netChangeInCash,
      beginningCash,
      endingCash,
    };
  }

  /**
   * Calculate financial ratios
   */
  public async calculateFinancialRatios(
    tenantId: string,
    asOfDate: Date,
    currencyCode: string = 'MYR',
  ): Promise<FinancialRatios> {
    const balanceSheet = await this.generateBalanceSheet(tenantId, asOfDate, currencyCode);

    // Get specific account balances for ratio calculations
    const currentAssets = balanceSheet.assets.currentAssets.reduce(
      (sum, accumulator) => sum + accumulator.amount,
      0,
    );
    const currentLiabilities = balanceSheet.liabilities.currentLiabilities.reduce(
      (sum, accumulator) => sum + accumulator.amount,
      0,
    );
    const totalAssets = balanceSheet.assets.totalAssets;
    const totalLiabilities = balanceSheet.liabilities.totalLiabilities;
    const totalEquity = balanceSheet.equity.totalEquity;

    // Calculate liquidity ratios
    const liquidityRatios = {
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      quickRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0, // Simplified
      cashRatio:
        currentLiabilities > 0 ? this.getCashBalance(balanceSheet) / currentLiabilities : 0,
    };

    // Calculate profitability ratios (would need P&L data)
    const profitabilityRatios = {
      grossProfitMargin: 0, // Would need P&L data
      netProfitMargin: 0, // Would need P&L data
      returnOnAssets: totalAssets > 0 ? 0 : 0, // Would need net income
      returnOnEquity: totalEquity > 0 ? 0 : 0, // Would need net income
    };

    // Calculate leverage ratios
    const leverageRatios = {
      debtToEquityRatio: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
      debtToAssetsRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
      equityMultiplier: totalEquity > 0 ? totalAssets / totalEquity : 0,
    };

    // Calculate efficiency ratios (simplified)
    const efficiencyRatios = {
      assetTurnover: 0, // Would need revenue data
      inventoryTurnover: 0, // Would need COGS and inventory data
      receivablesTurnover: 0, // Would need revenue and AR data
    };

    return {
      tenantId,
      asOfDate,
      currencyCode,
      generatedAt: new Date(),
      liquidityRatios,
      profitabilityRatios,
      leverageRatios,
      efficiencyRatios,
    };
  }

  /**
   * Generate comprehensive financial report
   */
  public async generateComprehensiveReport(
    tenantId: string,
    period: string,
    asOfDate: Date,
    currencyCode: string = 'MYR',
  ): Promise<ComprehensiveFinancialReport> {
    const [pnl, balanceSheet, cashFlow, ratios] = await Promise.all([
      this.generateProfitAndLoss(tenantId, period, currencyCode),
      this.generateBalanceSheet(tenantId, asOfDate, currencyCode),
      this.generateCashFlowStatement(tenantId, period, currencyCode),
      this.calculateFinancialRatios(tenantId, asOfDate, currencyCode),
    ]);

    return {
      tenantId,
      period,
      asOfDate,
      currencyCode,
      generatedAt: new Date(),
      profitAndLoss: pnl,
      balanceSheet,
      cashFlowStatement: cashFlow,
      financialRatios: ratios,
      summary: {
        totalRevenue: pnl.revenue.grossRevenue,
        totalExpenses: pnl.expenses.totalExpenses,
        netIncome: pnl.netIncome,
        totalAssets: balanceSheet.assets.totalAssets,
        totalLiabilities: balanceSheet.liabilities.totalLiabilities,
        totalEquity: balanceSheet.equity.totalEquity,
        currentRatio: ratios.liquidityRatios.currentRatio,
        debtToEquityRatio: ratios.leverageRatios.debtToEquityRatio,
      },
    };
  }

  private getCashBalance(balanceSheet: BalanceSheet): number {
    const cashAccount = balanceSheet.assets.currentAssets.find((accumulator) =>
      accumulator.accountCode.includes('CASH'),
    );
    return cashAccount?.amount ?? 0;
  }
}

/**
 * Comprehensive financial report combining all statements
 */
export interface ComprehensiveFinancialReport {
  readonly tenantId: string;
  readonly period: string;
  readonly asOfDate: Date;
  readonly currencyCode: string;
  readonly generatedAt: Date;
  readonly profitAndLoss: ProfitAndLossStatement;
  readonly balanceSheet: BalanceSheet;
  readonly cashFlowStatement: CashFlowStatement;
  readonly financialRatios: FinancialRatios;
  readonly summary: {
    readonly totalRevenue: number;
    readonly totalExpenses: number;
    readonly netIncome: number;
    readonly totalAssets: number;
    readonly totalLiabilities: number;
    readonly totalEquity: number;
    readonly currentRatio: number;
    readonly debtToEquityRatio: number;
  };
}
