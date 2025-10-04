import { LoadingSpinner } from '@primitives/loading-spinner';
import { RefreshCwIcon } from '../icons';
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
          <RefreshCwIcon 
            className={`animate-spin ${spinnerSize === 'sm' ? 'h-4 w-4' : spinnerSize === 'md' ? 'h-6 w-6' : spinnerSize === 'lg' ? 'h-8 w-8' : 'h-10 w-10'}`}
            context="dashboards"
            semanticColor="text-blue-500"
            enableAnimations={true}
            enableAdaptiveStyling={true}
            enableSemanticColors={true}
          />
          <p className="text-muted-foreground text-sm">{loadingText}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
