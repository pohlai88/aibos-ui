import {
  FinancialIntelligenceDashboard,
  ProfitLossChart,
  BalanceSheetChart,
  CashFlowChart,
  TrendAnalysisChart,
  VarianceAnalysisChart,
} from '@aibos/ui-business';
import * as React from 'react';

interface FinancialDashboardProperties {
  tenantId: string;
  companyId?: string;
  period?: string;
  showCharts?: boolean;
  showVarianceAnalysis?: boolean;
}

export function FinancialDashboard({
  tenantId,
  companyId,
  period = '2024-Q4',
  showCharts = true,
  showVarianceAnalysis = true,
}: FinancialDashboardProperties): JSX.Element {
  const mockCompanies = [
    {
      id: 'company-001',
      name: 'AIBOS Holdings Sdn Bhd',
      code: 'AH',
      currency: 'MYR',
      status: 'active' as const,
      eliminations: false,
    },
    {
      id: 'company-002',
      name: 'AIBOS Technologies Sdn Bhd',
      code: 'AT',
      currency: 'MYR',
      status: 'active' as const,
      eliminations: false,
    },
    {
      id: 'company-003',
      name: 'AIBOS International Pte Ltd',
      code: 'AI',
      currency: 'SGD',
      status: 'active' as const,
      eliminations: true,
    },
  ];

  const handleOpenDrill = React.useCallback((params: { metricId: string; companyId: string }) => {
    console.log('Opening drill-down for:', params);
    // In production, this would navigate to drill-down view
  }, []);

  const handleExportBoardPack = React.useCallback(
    (params: { companyIds: string[]; period: string }) => {
      console.log('Exporting board pack for:', params);
      // In production, this would trigger board pack generation
    },
    [],
  );

  const handleToggleEliminations = React.useCallback((enabled: boolean) => {
    console.log('Toggling eliminations:', enabled);
    // In production, this would update the data view
  }, []);

  const handleVarianceClick = React.useCallback((metricId: string) => {
    console.log('Opening variance storyline for:', metricId);
    // In production, this would show variance analysis modal
  }, []);

  // Mock data for financial charts
  const mockProfitLossData = React.useMemo(
    () => [
      {
        period: '2024-Q3',
        revenue: 2100000,
        costOfGoodsSold: 1200000,
        grossProfit: 900000,
        operatingExpenses: 600000,
        operatingIncome: 300000,
        netIncome: 250000,
      },
      {
        period: '2024-Q4',
        revenue: 2450000,
        costOfGoodsSold: 1400000,
        grossProfit: 1050000,
        operatingExpenses: 700000,
        operatingIncome: 350000,
        netIncome: 300000,
      },
    ],
    [],
  );

  const mockBalanceSheetData = React.useMemo(
    () => [
      {
        period: '2024-Q3',
        assets: {
          currentAssets: 800000,
          fixedAssets: 1200000,
          totalAssets: 2000000,
        },
        liabilities: {
          currentLiabilities: 400000,
          longTermDebt: 600000,
          totalLiabilities: 1000000,
        },
        equity: {
          retainedEarnings: 700000,
          shareCapital: 300000,
          totalEquity: 1000000,
        },
      },
      {
        period: '2024-Q4',
        assets: {
          currentAssets: 900000,
          fixedAssets: 1300000,
          totalAssets: 2200000,
        },
        liabilities: {
          currentLiabilities: 450000,
          longTermDebt: 650000,
          totalLiabilities: 1100000,
        },
        equity: {
          retainedEarnings: 800000,
          shareCapital: 300000,
          totalEquity: 1100000,
        },
      },
    ],
    [],
  );

  const mockCashFlowData = React.useMemo(
    () => [
      {
        period: '2024-Q3',
        operating: {
          netIncome: 250000,
          depreciation: 50000,
          workingCapitalChanges: -30000,
          operatingCashFlow: 270000,
        },
        investing: {
          capex: -80000,
          assetSales: 20000,
          investingCashFlow: -60000,
        },
        financing: {
          debtIssuance: 100000,
          debtRepayment: -50000,
          dividends: -30000,
          financingCashFlow: 20000,
        },
        netCashFlow: 230000,
        beginningCash: 500000,
        endingCash: 730000,
      },
      {
        period: '2024-Q4',
        operating: {
          netIncome: 300000,
          depreciation: 55000,
          workingCapitalChanges: -40000,
          operatingCashFlow: 315000,
        },
        investing: {
          capex: -100000,
          assetSales: 15000,
          investingCashFlow: -85000,
        },
        financing: {
          debtIssuance: 120000,
          debtRepayment: -60000,
          dividends: -40000,
          financingCashFlow: 20000,
        },
        netCashFlow: 250000,
        beginningCash: 730000,
        endingCash: 980000,
      },
    ],
    [],
  );

  const mockTrendData = React.useMemo(
    () => [
      {
        period: '2024-Q1',
        metrics: {
          revenue: 1800000,
          grossProfit: 720000,
          operatingIncome: 200000,
          netIncome: 150000,
        },
      },
      {
        period: '2024-Q2',
        metrics: {
          revenue: 1950000,
          grossProfit: 780000,
          operatingIncome: 250000,
          netIncome: 200000,
        },
      },
      {
        period: '2024-Q3',
        metrics: {
          revenue: 2100000,
          grossProfit: 900000,
          operatingIncome: 300000,
          netIncome: 250000,
        },
      },
      {
        period: '2024-Q4',
        metrics: {
          revenue: 2450000,
          grossProfit: 1050000,
          operatingIncome: 350000,
          netIncome: 300000,
        },
      },
    ],
    [],
  );

  const mockVarianceData = React.useMemo(
    () => [
      {
        period: '2024-Q3',
        budget: 2200000,
        actual: 2100000,
        variance: -100000,
        variancePercentage: -4.5,
      },
      {
        period: '2024-Q4',
        budget: 2400000,
        actual: 2450000,
        variance: 50000,
        variancePercentage: 2.1,
      },
    ],
    [],
  );

  const handleChartDrillDown = React.useCallback((account: string, period: string) => {
    console.log('Drilling down into:', account, 'for period:', period);
    // In production, this would navigate to detailed account view
  }, []);

  return (
    <div className="space-y-8">
      {/* CFO Dashboard */}
      <FinancialIntelligenceDashboard
        tenantId={tenantId}
        period="monthly"
        companies={mockCompanies}
        onOpenDrill={handleOpenDrill}
        onExportBoardPack={handleExportBoardPack}
        onToggleEliminations={handleToggleEliminations}
        onVarianceClick={handleVarianceClick}
        className="w-full"
      />

      {/* Financial Charts Section */}
      {showCharts && (
        <div className="space-y-6">
          <div className="border-semantic-border border-t pt-8">
            <h2 className="text-semantic-foreground mb-6 text-2xl font-bold">
              Financial Reports & Analysis
            </h2>

            {/* Financial Statements */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ProfitLossChart
                data={mockProfitLossData}
                period={period}
                companyId={companyId}
                onDrillDown={handleChartDrillDown}
                className="w-full"
              />

              <BalanceSheetChart
                data={mockBalanceSheetData}
                period={period}
                companyId={companyId}
                onDrillDown={handleChartDrillDown}
                className="w-full"
              />
            </div>

            {/* Cash Flow Statement */}
            <div className="mt-6">
              <CashFlowChart
                data={mockCashFlowData}
                period={period}
                companyId={companyId}
                onDrillDown={handleChartDrillDown}
                className="w-full"
              />
            </div>

            {/* Trend Analysis */}
            <div className="mt-6">
              <TrendAnalysisChart
                data={mockTrendData}
                metrics={['revenue', 'grossProfit', 'operatingIncome', 'netIncome']}
                period={period}
                companyId={companyId}
                onDrillDown={handleChartDrillDown}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Variance Analysis Section */}
      {showVarianceAnalysis && (
        <div className="border-semantic-border border-t pt-8">
          <h2 className="text-semantic-foreground mb-6 text-2xl font-bold">
            Budget vs Actual Analysis
          </h2>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <VarianceAnalysisChart
              data={mockVarianceData}
              metric="revenue"
              period={period}
              companyId={companyId}
              onDrillDown={handleChartDrillDown}
              className="w-full"
            />

            <VarianceAnalysisChart
              data={mockVarianceData.map((d) => ({
                ...d,
                budget: d.budget * 0.6, // Mock for operating income
                actual: d.actual * 0.6,
                variance: d.actual * 0.6 - d.budget * 0.6,
                variancePercentage: ((d.actual * 0.6 - d.budget * 0.6) / (d.budget * 0.6)) * 100,
              }))}
              metric="operatingIncome"
              period={period}
              companyId={companyId}
              onDrillDown={handleChartDrillDown}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
