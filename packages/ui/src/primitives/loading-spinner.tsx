import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

const loadingSpinnerVariants = cva(
  'animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      variant: {
        default: 'text-semantic-muted-foreground',
        primary: 'text-semantic-primary',
        secondary: 'text-semantic-secondary',
        success: 'text-semantic-success',
        warning: 'text-semantic-warning',
        error: 'text-semantic-destructive',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

export interface LoadingSpinnerProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingSpinnerVariants> {
  /**
   * Whether the spinner should be visible
   */
  visible?: boolean;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProperties>(
  ({ className, size, variant, visible = true, ...props }, ref) => {
    if (!visible) return null;

    if (isPerfMode()) {
      return (
        <div
          ref={ref}
          className={['loading-spinner', 'perf-static', className].filter(Boolean).join(' ')}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn(loadingSpinnerVariants({ size, variant }), className)}
        role="status"
        aria-label="Loading"
        {...props}
      />
    );
  },
);

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner, loadingSpinnerVariants };
export type LoadingSpinnerReference = React.ElementRef<typeof LoadingSpinner>;
export type LoadingSpinnerElement = React.ElementType;
