import { LoadingSpinner } from '@primitives/loading-spinner';
import { cn } from '../utils/cn.utility';
import React from 'react';

export interface AsyncLoadingProperties {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  spinnerSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AsyncLoading: React.FC<AsyncLoadingProperties> = ({
  loading,
  children,
  loadingText = 'Loading...',
  className,
  spinnerSize = 'md',
}) => {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size={spinnerSize} />
          <p className="text-muted-foreground text-sm">{loadingText}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
