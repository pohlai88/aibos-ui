// Financial Reports Generator Organism Component
// Complex component for generating financial reports

import { useState, useCallback } from 'react';
import { LucideIcon, cn } from '@aibos/ui';
import { useFinancialReports } from '../../hooks';

interface GeneratedReport {
  period: string;
  currency: string;
  generatedAt: string;
  data: unknown;
}

interface FinancialReportsGeneratorProperties {
  className?: string;
}

export function FinancialReportsGenerator({
  className,
}: FinancialReportsGeneratorProperties): JSX.Element {
  const {
    reportType,
    setReportType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    currency,
    setCurrency,
    loading,
    error,
    generateReport,
  } = useFinancialReports();

  const [isExporting, setIsExporting] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);

  const handleGenerateReport = useCallback(async () => {
    try {
      await generateReport();
      // In a real app, this would set the generated report data
      setGeneratedReport({
        period: `${startDate} to ${endDate}`,
        currency,
        generatedAt: new Date().toISOString(),
        data: null,
      });
    } catch (error) {
      console.error('Error generating report:', error);
    }
  }, [generateReport, reportType, startDate, endDate, currency]);

  const handleExport = useCallback(
    async (format: 'PDF' | 'Excel' | 'CSV') => {
      setIsExporting(true);
      try {
        // This would export the report
        console.log('Exporting report:', { format, reportType, startDate, endDate, currency });
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setIsExporting(false);
      }
    },
    [reportType, startDate, endDate, currency],
  );

  const handleRefresh = useCallback(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);

  const reportTypes = [
    {
      value: 'P&L',
      label: 'Profit & Loss',
      iconName: 'TrendingUp',
      description: 'Revenue, expenses, and net income',
    },
    {
      value: 'Balance Sheet',
      label: 'Balance Sheet',
      iconName: 'BarChart3',
      description: 'Assets, liabilities, and equity',
    },
    {
      value: 'Cash Flow',
      label: 'Cash Flow',
      iconName: 'FileText',
      description: 'Operating, investing, and financing activities',
    },
  ];

  const selectedReportType = reportTypes.find((type) => type.value === reportType);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">
            Generate comprehensive financial reports for your business
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 transition-colors hover:text-gray-600"
            title="Refresh"
          >
            <LucideIcon name="RefreshCw" className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleExport('PDF')}
              disabled={isExporting || !generatedReport}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              PDF
            </button>
            <button
              onClick={() => handleExport('Excel')}
              disabled={isExporting || !generatedReport}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Excel
            </button>
            <button
              onClick={() => handleExport('CSV')}
              disabled={isExporting || !generatedReport}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              CSV
            </button>
          </div>

          <button
            onClick={() => handleExport('PDF')}
            disabled={isExporting || !generatedReport}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <LucideIcon name="Download" className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900">Report Type</h2>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {reportTypes.map((type) => {
              const isSelected = reportType === type.value;

              return (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value as 'P&L' | 'Balance Sheet' | 'Cash Flow')}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-colors',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <LucideIcon name={type.iconName} className="h-6 w-6" />
                    <div>
                      <h3 className="font-medium">{type.label}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Report Parameters */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900">Report Parameters</h2>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Start Date */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
              <div className="relative">
                <LucideIcon
                  name="Calendar"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
                />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
              <div className="relative">
                <LucideIcon
                  name="Calendar"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MYR">MYR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="SGD">SGD</option>
              </select>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                disabled={loading || !startDate || !endDate}
                className="flex w-full items-center justify-center space-x-2 rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                ) : (
                  <LucideIcon name="FileText" className="h-4 w-4" />
                )}
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-red-800">Error generating report</p>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Preview */}
      {generatedReport && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-medium text-gray-900">Report Preview</h2>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedReportType?.label} Statement
              </h3>
              <p className="text-gray-600">
                Period: {generatedReport.period} | Currency: {generatedReport.currency}
              </p>
              <p className="text-sm text-gray-500">
                Generated: {new Date(generatedReport.generatedAt).toLocaleString()}
              </p>
            </div>

            {/* Report Content Placeholder */}
            <div className="rounded-lg bg-gray-50 p-8 text-center">
              <LucideIcon name="FileText" className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-gray-600">
                {selectedReportType?.label} report content will be displayed here
              </p>
              <p className="text-sm text-gray-500">This is a preview of the generated report</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Templates */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900">Quick Templates</h2>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setStartDate(firstDay.toISOString().split('T')[0] || '');
                setEndDate(lastDay.toISOString().split('T')[0] || '');
              }}
              className="rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <h3 className="font-medium text-gray-900">Current Month</h3>
              <p className="text-sm text-gray-600">This month's report</p>
            </button>

            <button
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), 0, 1);
                const lastDay = new Date(today.getFullYear(), 11, 31);
                setStartDate(firstDay.toISOString().split('T')[0] || '');
                setEndDate(lastDay.toISOString().split('T')[0] || '');
              }}
              className="rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <h3 className="font-medium text-gray-900">Current Year</h3>
              <p className="text-sm text-gray-600">Year-to-date report</p>
            </button>

            <button
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                setStartDate(lastMonth.toISOString().split('T')[0] || '');
                setEndDate(lastDay.toISOString().split('T')[0] || '');
              }}
              className="rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <h3 className="font-medium text-gray-900">Last Month</h3>
              <p className="text-sm text-gray-600">Previous month's report</p>
            </button>

            <button
              onClick={() => {
                const today = new Date();
                const lastYear = new Date(today.getFullYear() - 1, 0, 1);
                const lastDay = new Date(today.getFullYear() - 1, 11, 31);
                setStartDate(lastYear.toISOString().split('T')[0] || '');
                setEndDate(lastDay.toISOString().split('T')[0] || '');
              }}
              className="rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <h3 className="font-medium text-gray-900">Last Year</h3>
              <p className="text-sm text-gray-600">Previous year's report</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
