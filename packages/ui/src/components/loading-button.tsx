import { LoadingSpinner } from '@primitives/loading-spinner';
import { RefreshCwIcon } from '../icons';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

const loadingButtonVariants = cva(
  'focus-visible:ring-ring ring-offset-background inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border-input hover:bg-accent hover:text-accent-foreground border',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface LoadingButtonProperties
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof loadingButtonVariants> {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProperties>(
  (
    { className, variant, size, loading = false, loadingText, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        className={cn(loadingButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <RefreshCwIcon 
            className="mr-2 h-4 w-4 animate-spin" 
            context="dashboards"
            semanticColor="text-current"
            enableAnimations={true}
            enableAdaptiveStyling={true}
            enableSemanticColors={true}
          />
        )}
        {loading ? loadingText || 'Loading...' : children}
      </button>
    );
  },
);

LoadingButton.displayName = 'LoadingButton';
