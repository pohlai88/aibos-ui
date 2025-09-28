// Status Indicator Primitive Component
// Enterprise-grade status indicator for journal entry statuses

import { useMemo } from 'react';
import { LucideIcon, cn } from '@aibos/ui';
import type { StatusIndicatorProperties } from '../../types';
import { safeGet } from '../../../utils';

export function StatusIndicator({
  status,
  size = 'md',
  showLabel = true,
  className,
}: StatusIndicatorProperties): JSX.Element {
  const statusConfig = useMemo(() => {
    const configs = {
      Draft: {
        label: 'Draft',
        color: 'text-gray-600 bg-gray-100',
        iconName: 'Edit',
        description: 'Entry is being prepared',
      },
      Approved: {
        label: 'Approved',
        color: 'text-yellow-700 bg-yellow-100',
        iconName: 'CheckCircle',
        description: 'Entry has been approved',
      },
      Posted: {
        label: 'Posted',
        color: 'text-green-700 bg-green-100',
        iconName: 'Check',
        description: 'Entry has been posted to ledger',
      },
      Adjusted: {
        label: 'Adjusted',
        color: 'text-blue-700 bg-blue-100',
        iconName: 'Edit',
        description: 'Entry has been adjusted',
      },
      Voided: {
        label: 'Voided',
        color: 'text-red-700 bg-red-100',
        iconName: 'X',
        description: 'Entry has been voided',
      },
      Reversed: {
        label: 'Reversed',
        color: 'text-red-700 bg-red-100',
        iconName: 'RotateCcw',
        description: 'Entry has been reversed',
      },
    };

    return safeGet(configs, status, configs.Draft) as typeof configs.Draft;
  }, [status]);

  const sizeClasses = useMemo(() => {
    const sizes = {
      sm: {
        container: 'px-2 py-1 text-xs',
        icon: 'h-3 w-3',
        label: 'text-xs',
      },
      md: {
        container: 'px-3 py-1.5 text-sm',
        icon: 'h-4 w-4',
        label: 'text-sm',
      },
      lg: {
        container: 'px-4 py-2 text-base',
        icon: 'h-5 w-5',
        label: 'text-base',
      },
    };

    return safeGet(sizes, size, sizes.md) as typeof sizes.md;
  }, [size]);

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-2 rounded-full font-medium',
        statusConfig.color,
        sizeClasses.container,
        className,
      )}
      title={statusConfig.description}
      role="status"
      aria-label={`Status: ${statusConfig.label}`}
    >
      {/* Status Icon */}
      <LucideIcon name={statusConfig.iconName} className={cn('flex-shrink-0', sizeClasses.icon)} />

      {/* Status Label */}
      {showLabel && (
        <span className={cn('font-medium', sizeClasses.label)}>{statusConfig.label}</span>
      )}
    </div>
  );
}
