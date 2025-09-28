// Chart of Accounts Manager Organism Component
// Complex component for managing chart of accounts

import { useState, useCallback } from 'react';
import { LucideIcon, cn } from '@aibos/ui';
import type { Account } from '@aibos/accounting';
import { AccountHierarchy } from '../molecules/account-hierarchy';
import { BalanceSummary } from '../molecules/balance-summary';
import { useAccountHierarchyManagement, useAccountingData } from '../../hooks';

interface ChartOfAccountsManagerProperties {
  className?: string;
}

export function ChartOfAccountsManager({
  className,
}: ChartOfAccountsManagerProperties): JSX.Element {
  const { accounts, loading, error, refetch } = useAccountingData();
  const { accountHierarchy, expandedNodes, toggleNode, expandAll, collapseAll } =
    useAccountHierarchyManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const handleAccountSelect = useCallback((account: Account) => {
    setSelectedAccountId(account.accountCode);
  }, []);

  const handleCreateAccount = useCallback(() => {
    // This would open a create account modal
    console.log('Create account clicked');
  }, []);

  const handleExport = useCallback(() => {
    // This would export the chart of accounts
    console.log('Export clicked');
  }, []);

  const handleImport = useCallback(() => {
    // This would open an import dialog
    console.log('Import clicked');
  }, []);

  const handleSettings = useCallback(() => {
    // This would open settings
    console.log('Settings clicked');
  }, []);

  if (loading) {
    return (
      <div className={cn('flex h-64 items-center justify-center', className)}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading chart of accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex h-64 items-center justify-center', className)}>
        <div className="text-center">
          <div className="mb-4 text-red-600">
            <p className="text-lg font-medium">Error loading accounts</p>
            <p className="text-sm">{error.message}</p>
          </div>
          <button
            onClick={refetch}
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
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-600">Manage your chart of accounts and view account balances</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSettings}
            className="p-2 text-gray-400 transition-colors hover:text-gray-600"
            title="Settings"
          >
            <LucideIcon name="Settings" className="h-5 w-5" />
          </button>
          <button
            onClick={handleImport}
            className="p-2 text-gray-400 transition-colors hover:text-gray-600"
            title="Import"
          >
            <LucideIcon name="Upload" className="h-5 w-5" />
          </button>
          <button
            onClick={handleExport}
            className="p-2 text-gray-400 transition-colors hover:text-gray-600"
            title="Export"
          >
            <LucideIcon name="Download" className="h-5 w-5" />
          </button>
          <button
            onClick={handleCreateAccount}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <LucideIcon name="Plus" className="h-4 w-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="max-w-md flex-1">
          <div className="relative">
            <LucideIcon
              name="Search"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search accounts..."
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <LucideIcon name="Filter" className="h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="ASSET">Assets</option>
            <option value="LIABILITY">Liabilities</option>
            <option value="EQUITY">Equity</option>
            <option value="REVENUE">Revenue</option>
            <option value="EXPENSE">Expenses</option>
          </select>
        </div>

        {/* View Options */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showBalances}
              onChange={(e) => setShowBalances(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show Balances</span>
          </label>
        </div>

        {/* Hierarchy Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-sm text-blue-600 transition-colors hover:text-blue-800"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-sm text-blue-600 transition-colors hover:text-blue-800"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Account Hierarchy */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-lg font-medium text-gray-900">Account Hierarchy</h2>
            </div>

            <div className="p-4">
              {accountHierarchy ? (
                <AccountHierarchy
                  nodes={accountHierarchy.rootNodes}
                  expandedNodes={expandedNodes}
                  onToggleNode={toggleNode}
                  onSelectAccount={handleAccountSelect}
                  selectedAccountId={selectedAccountId || ''}
                  showBalances={showBalances}
                />
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p>No accounts found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-lg font-medium text-gray-900">Balance Summary</h2>
            </div>

            <div className="p-4">
              <BalanceSummary
                balances={accounts.map((account) => ({
                  accountId: account.accountCode,
                  accountCode: account.accountCode,
                  accountName: account.accountName,
                  accountType: account.accountType,
                  debitBalance: account.balance > 0 ? account.balance : 0,
                  creditBalance: account.balance < 0 ? Math.abs(account.balance) : 0,
                  netBalance: account.balance,
                  currency: 'MYR',
                }))}
                currency="MYR"
                showDetails={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Account Details */}
      {selectedAccountId && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-medium text-gray-900">Account Details</h2>
          </div>

          <div className="p-4">
            <div className="py-8 text-center text-gray-500">
              <p>Account details will be displayed here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
