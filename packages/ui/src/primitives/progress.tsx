/**
 * Progress Component - Enterprise Production Ready
 *
 * Progress component with semantic tokens, CVA variants,
 * and comprehensive accessibility features.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const progressVariants = cva(
  'bg-semantic-muted relative h-4 w-full overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'h-2',
        md: 'h-4',
        lg: 'h-6',
      },
      variant: {
        default: 'bg-semantic-muted',
        success: 'bg-semantic-success/20',
        warning: 'bg-semantic-warning/20',
        destructive: 'bg-semantic-destructive/20',
        info: 'bg-semantic-info/20',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

const progressIndicatorVariants = cva(
  'bg-semantic-primary h-full w-full flex-1 transition-all',
  {
    variants: {
      variant: {
        default: 'bg-semantic-primary',
        success: 'bg-semantic-success',
        warning: 'bg-semantic-warning',
        destructive: 'bg-semantic-destructive',
        info: 'bg-semantic-info',
      },
      indeterminate: {
        true: 'animate-pulse',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      indeterminate: false,
    },
  },
);

const circularProgressVariants = cva(
  'relative inline-flex items-center justify-center',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
        xl: 'h-20 w-20',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const circularProgressSvgVariants = cva(
  '-rotate-90 transform',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
        xl: 'h-20 w-20',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const circularProgressCircleVariants = cva(
  'stroke-semantic-primary transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'stroke-semantic-primary',
        success: 'stroke-semantic-success',
        warning: 'stroke-semantic-warning',
        destructive: 'stroke-semantic-destructive',
        info: 'stroke-semantic-info',
      },
      size: {
        sm: 'stroke-1',
        md: 'stroke-2',
        lg: 'stroke-2',
        xl: 'stroke-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface ProgressProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  /**
   * Progress value (0-100)
   */
  value?: number;
  /**
   * Maximum value (default: 100)
   */
  max?: number;
  /**
   * Whether the progress is indeterminate
   */
  indeterminate?: boolean;
  /**
   * Additional CSS class name
   */
  className?: string;
}

export interface CircularProgressProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof circularProgressVariants> {
  /**
   * Progress value (0-100)
   */
  value?: number;
  /**
   * Maximum value (default: 100)
   */
  max?: number;
  /**
   * Whether the progress is indeterminate
   */
  indeterminate?: boolean;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Show percentage text
   */
  showPercentage?: boolean;
  /**
   * Progress variant
   */
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
}

const Progress = React.forwardRef<
  HTMLDivElement,
  ProgressProperties
>(({ className, value = 0, max = 100, indeterminate = false, size = 'md', variant = 'default', ...props }, reference) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <div
        ref={reference}
        className={cn('progress perf-static', className)}
        {...varianceAttributes()}
        {...props}
      >
        <div className="progress-indicator perf-static" />
      </div>
    );
  }

  return (
    <div
      ref={reference}
      className={cn(progressVariants({ size, variant }), className)}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={indeterminate ? 'Loading...' : `${percentage}% complete`}
      {...props}
    >
      <div
        className={cn(progressIndicatorVariants({ variant, indeterminate }))}
        style={{
          transform: indeterminate ? undefined : `translateX(-${100 - percentage}%)`,
        }}
      />
    </div>
  );
});

Progress.displayName = 'Progress';

const CircularProgress = React.forwardRef<
  HTMLDivElement,
  CircularProgressProperties
>(({ className, value = 0, max = 100, indeterminate = false, size = 'md', showPercentage = false, ...props }, reference) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <div
        ref={reference}
        className={cn('circular-progress perf-static', className)}
        {...varianceAttributes()}
        {...props}
      >
        {showPercentage && <span className="progress-text perf-static">0%</span>}
      </div>
    );
  }

  return (
    <div
      ref={reference}
      className={cn(circularProgressVariants({ size }), className)}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={indeterminate ? 'Loading...' : `${percentage}% complete`}
      {...props}
    >
      <div
        className={cn(circularProgressSvgVariants({ size }))}
        style={{
          background: `conic-gradient(from 0deg, currentColor ${percentage}%, transparent ${percentage}%)`,
          borderRadius: '50%',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="bg-semantic-background rounded-full"
          style={{
            width: 'calc(100% - 4px)',
            height: 'calc(100% - 4px)',
          }}
        />
      </div>
      {showPercentage && (
        <span className="text-semantic-foreground absolute text-sm font-medium">
          {indeterminate ? '...' : `${Math.round(percentage)}%`}
        </span>
      )}
    </div>
  );
});

CircularProgress.displayName = 'CircularProgress';

export { Progress, CircularProgress, progressVariants, progressIndicatorVariants, circularProgressVariants, circularProgressSvgVariants, circularProgressCircleVariants };
export type ProgressReference = React.ElementRef<typeof Progress>;
export type CircularProgressReference = React.ElementRef<typeof CircularProgress>;
export type ProgressElement = React.ElementType;
export type CircularProgressElement = React.ElementType;
