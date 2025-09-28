// Trial Balance Dashboard Organism Component
// Complex component for trial balance management and validation

import { useState, useCallback, useEffect } from 'react';
import { LucideIcon, cn } from '@aibos/ui';
import { BalanceSummary } from '../molecules/balance-summary';
import { useTrialBalanceManagement } from '../../hooks';
import type { AccountType } from '@aibos/accounting';

interface TrialBalanceDashboardProperties {
  className?: string;
}

export function TrialBalanceDashboard({ className }: TrialBalanceDashboardProperties): JSX.Element {
  const { trialBalance, loading, error, loadTrialBalance, exportTrialBalance } =
    useTrialBalanceManagement();

  const [filters, setFilters] = useState({
    period: new Date().toISOString().split('T')[0] || '',
    accountTypes: [] as AccountType[],
    includeZeroBalances: false,
    currency: 'MYR',
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleLoadTrialBalance = useCallback(async () => {
    await loadTrialBalance(filters);
  }, [loadTrialBalance, filters]);

  const handleExport = useCallback(
    async (format: 'PDF' | 'Excel' | 'CSV') => {
      setIsExporting(true);
      try {
        await exportTrialBalance(format);
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setIsExporting(false);
      }
    },
    [exportTrialBalance],
  );

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  }, []);

  const handleRefresh = useCallback(() => {
    handleLoadTrialBalance();
  }, [handleLoadTrialBalance]);

  useEffect(() => {
    handleLoadTrialBalance();
  }, [handleLoadTrialBalance]);

  if (loading) {
    return (
      <div className={cn('flex h-64 items-center justify-center', className)}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading trial balance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex h-64 items-center justify-center', className)}>
        <div className="text-center">
          <div className="mb-4 text-red-600">
            <p className="text-lg font-medium">Error loading trial balance</p>
            <p className="text-sm">{error.message}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
          <p className="text-gray-600">
            View and validate account balances for the selected period
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
              disabled={isExporting}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              PDF
            </button>
            <button
              onClick={() => handleExport('Excel')}
              disabled={isExporting}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Excel
            </button>
            <button
              onClick={() => handleExport('CSV')}
              disabled={isExporting}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              CSV
            </button>
          </div>

          <button
            onClick={() => handleExport('PDF')}
            disabled={isExporting}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <LucideIcon name="Download" className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Period */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Period</label>
              <div className="relative">
                <LucideIcon
                  name="Calendar"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
                />
                <input
                  type="date"
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Account Types */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Account Types</label>
              <div className="relative">
                <LucideIcon
                  name="Filter"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
                />
                <select
                  multiple
                  value={filters.accountTypes}
                  onChange={(e) =>
                    handleFilterChange(
                      'accountTypes',
                      Array.from(e.target.selectedOptions, (option) => option.value),
                    )
                  }
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ASSET">Assets</option>
                  <option value="LIABILITY">Liabilities</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expenses</option>
                </select>
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
              <select
                value={filters.currency}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MYR">MYR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="SGD">SGD</option>
              </select>
            </div>

            {/* Options */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Options</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.includeZeroBalances}
                    onChange={(e) => handleFilterChange('includeZeroBalances', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Include Zero Balances</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      {trialBalance && (
        <BalanceSummary
          balances={trialBalance.accounts}
          currency={filters.currency}
          showDetails={true}
        />
      )}

      {/* Trial Balance Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900">Trial Balance</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Account Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Debit Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Credit Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Net Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {trialBalance?.accounts.map((account) => (
                <tr key={account.accountId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {account.accountCode}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {account.accountName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                      {account.accountType}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    {account.debitBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    {account.creditBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    <span
                      className={cn(
                        'font-medium',
                        account.netBalance >= 0 ? 'text-green-600' : 'text-red-600',
                      )}
                    >
                      {account.netBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td
                  colSpan={3}
                  className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900"
                >
                  Total
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {trialBalance?.totalDebits.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {trialBalance?.totalCredits.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                  <span
                    className={cn(
                      'font-medium',
                      trialBalance?.isBalanced ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {trialBalance?.isBalanced ? (
                      <LucideIcon name="CheckCircle" className="mx-auto h-5 w-5" />
                    ) : (
                      <LucideIcon name="AlertTriangle" className="mx-auto h-5 w-5" />
                    )}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Validation Status */}
      {trialBalance && (
        <div
          className={cn(
            'flex items-center space-x-3 rounded-lg border p-4',
            trialBalance.isBalanced
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800',
          )}
        >
          {trialBalance.isBalanced ? (
            <LucideIcon name="CheckCircle" className="h-5 w-5 flex-shrink-0" />
          ) : (
            <LucideIcon name="AlertTriangle" className="h-5 w-5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {trialBalance.isBalanced
                ? 'Trial Balance is Balanced'
                : 'Trial Balance is Unbalanced'}
            </p>
            <p className="text-sm opacity-90">
              {trialBalance.isBalanced
                ? 'All debits equal credits for the selected period'
                : 'Debits and credits do not match. Please review the entries.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
