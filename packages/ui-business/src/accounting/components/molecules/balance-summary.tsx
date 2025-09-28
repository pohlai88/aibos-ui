// Balance Summary Molecule Component
// Composite component for displaying account balance summaries

import { useMemo } from 'react';
import { LucideIcon } from '@aibos/ui';
import type { AccountBalanceSummary } from '../../types';
import { formatCurrency } from '../../utils';
import { cn } from '@aibos/ui';

interface BalanceSummaryProperties {
  balances: AccountBalanceSummary[];
  currency?: string;
  showDetails?: boolean;
  className?: string;
}

export function BalanceSummary({
  balances,
  currency = 'MYR',
  showDetails = true,
  className,
}: BalanceSummaryProperties): JSX.Element {
  const summary = useMemo(() => {
    const totalDebits = balances.reduce((sum, balance) => sum + balance.debitBalance, 0);
    const totalCredits = balances.reduce((sum, balance) => sum + balance.creditBalance, 0);
    const totalNet = balances.reduce((sum, balance) => sum + balance.netBalance, 0);

    const accountCount = balances.length;
    const positiveBalances = balances.filter((b) => b.netBalance > 0).length;
    const negativeBalances = balances.filter((b) => b.netBalance < 0).length;
    const zeroBalances = balances.filter((b) => b.netBalance === 0).length;

    return {
      totalDebits,
      totalCredits,
      totalNet,
      accountCount,
      positiveBalances,
      negativeBalances,
      zeroBalances,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    };
  }, [balances]);

  const balanceStatus = useMemo(() => {
    if (summary.isBalanced) {
      return {
        color: 'text-green-600 bg-green-50',
        icon: 'DollarSign',
        label: 'Balanced',
        description: 'Total debits equal total credits',
      };
    } else {
      return {
        color: 'text-red-600 bg-red-50',
        icon: 'AlertTriangle',
        label: 'Unbalanced',
        description: 'Total debits do not equal total credits',
      };
    }
  }, [summary.isBalanced]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Total Debits */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Debits</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalDebits, currency)}
              </p>
            </div>
            <LucideIcon name="TrendingUp" className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* Total Credits */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credits</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalCredits, currency)}
              </p>
            </div>
            <LucideIcon name="TrendingDown" className="h-8 w-8 text-red-600" />
          </div>
        </div>

        {/* Net Balance */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  summary.totalNet >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {formatCurrency(summary.totalNet, currency, true)}
              </p>
            </div>
            <LucideIcon
              name={balanceStatus.icon}
              className={cn('h-8 w-8', summary.isBalanced ? 'text-green-600' : 'text-red-600')}
            />
          </div>
        </div>

        {/* Account Count */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{summary.accountCount}</p>
            </div>
            <LucideIcon name="DollarSign" className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Balance Status */}
      <div className={cn('flex items-center space-x-3 rounded-lg border p-4', balanceStatus.color)}>
        <LucideIcon name={balanceStatus.icon} className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">{balanceStatus.label}</p>
          <p className="text-sm opacity-90">{balanceStatus.description}</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h3 className="text-lg font-medium text-gray-900">Balance Breakdown</h3>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Positive Balances */}
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.positiveBalances}</div>
                <div className="text-sm text-gray-600">Positive Balances</div>
              </div>

              {/* Negative Balances */}
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.negativeBalances}</div>
                <div className="text-sm text-gray-600">Negative Balances</div>
              </div>

              {/* Zero Balances */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{summary.zeroBalances}</div>
                <div className="text-sm text-gray-600">Zero Balances</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Difference */}
      {!summary.isBalanced && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center space-x-2">
            <LucideIcon name="AlertTriangle" className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Balance Difference</p>
              <p className="text-sm text-red-700">
                Difference:{' '}
                {formatCurrency(Math.abs(summary.totalDebits - summary.totalCredits), currency)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
