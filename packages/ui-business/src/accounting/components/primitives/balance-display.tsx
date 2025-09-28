// Balance Display Primitive Component
// Enterprise-grade balance display with proper formatting and account type styling

import { useMemo } from 'react';
import { LucideIcon, cn } from '@aibos/ui';
import type { BalanceDisplayProperties } from '../../types';
import { formatAccountBalance, getAccountTypeColor, getAccountTypeIcon } from '../../utils';

export function BalanceDisplay({
  balance,
  currency = 'MYR',
  accountType,
  showSign = false,
  className,
}: BalanceDisplayProperties): JSX.Element {
  const formattedBalance = useMemo(
    () => formatAccountBalance(balance, currency),
    [balance, currency],
  );

  const accountTypeColor = useMemo(() => getAccountTypeColor(accountType), [accountType]);

  const accountTypeIcon = useMemo(() => getAccountTypeIcon(accountType), [accountType]);

  const iconComponent = useMemo(() => {
    const iconProperties = { className: 'h-4 w-4' };

    switch (accountTypeIcon) {
      case 'trending-up':
        return <LucideIcon name="TrendingUp" {...iconProperties} />;
      case 'trending-down':
        return <LucideIcon name="TrendingDown" {...iconProperties} />;
      case 'shield':
        return <LucideIcon name="Shield" {...iconProperties} />;
      case 'dollar-sign':
        return <LucideIcon name="DollarSign" {...iconProperties} />;
      case 'minus-circle':
        return <LucideIcon name="MinusCircle" {...iconProperties} />;
      default:
        return <LucideIcon name="DollarSign" {...iconProperties} />;
    }
  }, [accountTypeIcon]);

  const balanceColor = useMemo(() => {
    if (balance === 0) return 'text-gray-600';

    // For liability, equity, and revenue accounts, reverse the color logic
    if (['LIABILITY', 'EQUITY', 'REVENUE'].includes(accountType)) {
      return balance > 0 ? 'text-green-600' : 'text-red-600';
    }

    // For asset and expense accounts, normal color logic
    return balance > 0 ? 'text-green-600' : 'text-red-600';
  }, [balance, accountType]);

  const balanceSign = useMemo(() => {
    if (balance === 0) return '';
    if (showSign) {
      return balance > 0 ? '+' : '';
    }
    return '';
  }, [balance, showSign]);

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* Account Type Icon */}
      <div
        className={cn('flex h-8 w-8 items-center justify-center rounded-full', accountTypeColor)}
      >
        {iconComponent}
      </div>

      {/* Balance Information */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center space-x-2">
          <span className={cn('text-sm font-medium', balanceColor)}>
            {balanceSign}
            {formattedBalance}
          </span>
          <span className="text-xs font-medium text-gray-500">{currency}</span>
        </div>

        <div className="text-xs capitalize text-gray-500">
          {accountType.toLowerCase().replace('_', ' ')}
        </div>
      </div>

      {/* Balance Indicator */}
      {balance !== 0 && (
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
            balance > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
          )}
        >
          {balance > 0 ? 'C' : 'D'}
        </div>
      )}
    </div>
  );
}
