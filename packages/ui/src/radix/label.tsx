/**
 * Radix Label Wrapper - Enterprise Production Ready
 *
 * Radix UI Label primitive wrapper with semantic tokens and
 * comprehensive accessibility features.
 */

// Note: @radix-ui/react-label doesn't exist, using HTML label instead
import { cn } from '../utils/cn.utility';
import { isPerfMode, varianceAttributes } from '../utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const radixLabelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-semantic-foreground',
        muted: 'text-semantic-muted-foreground',
        destructive: 'text-semantic-destructive',
        success: 'text-semantic-success',
        warning: 'text-semantic-warning',
        info: 'text-semantic-info',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface RadixLabelProperties
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof radixLabelVariants> {
  /**
   * Whether the label is required (shows asterisk)
   */
  required?: boolean;
  /**
   * Optional help text to display below the label
   */
  helpText?: string;
  /**
   * Error message to display below the label
   */
  error?: string;
}

const RadixLabel = React.forwardRef<
  HTMLLabelElement,
  RadixLabelProperties
>(({ className, variant, size, required, helpText, error, children, ...props }, ref) => {
  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <label
        ref={ref}
        className={[
          'radix-label',
          'perf-static',
          required ? 'required' : '',
          error ? 'error' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...varianceAttributes()}
        {...props}
      >
        {children}
        {required && <span className="perf-static text-semantic-destructive ml-1">*</span>}
        {helpText && <span className="perf-static text-semantic-muted-foreground mt-1 block text-xs">{helpText}</span>}
        {error && <span className="perf-static text-semantic-destructive mt-1 block text-xs">{error}</span>}
      </label>
    );
  }

    return (
      <div className="space-y-1">
        <label
          ref={ref}
          className={cn(radixLabelVariants({ variant, size }), className)}
          {...props}
        >
          {children}
          {required && (
            <span className="text-semantic-destructive ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      
      {helpText && (
        <p className="text-semantic-muted-foreground text-xs">
          {helpText}
        </p>
      )}
      
      {error && (
        <p 
          className="text-semantic-destructive text-xs" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
});

RadixLabel.displayName = 'RadixLabel';

export { RadixLabel, radixLabelVariants };
