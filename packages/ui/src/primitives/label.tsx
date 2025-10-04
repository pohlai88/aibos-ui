/**
 * Label Component - Enterprise Production Ready
 *
 * Label component with full accessibility support, form association,
 * and comprehensive semantic token integration.
 */

import { cn } from '../utils/cn.utility';
import { isPerfMode, varianceAttributes } from '../utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const labelVariants = cva(
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
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      weight: 'medium',
    },
  },
);

// Pre-allocated perf mode label element to eliminate variance
// const PERF_LABEL_ELEMENT = React.createElement('label', {
//   className: 'label perf-static',
//   'data-perf-stable': 'label',
// });

export interface LabelProperties
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
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
  /**
   * ID of the form control this label is associated with
   */
  htmlFor?: string;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProperties>(
  ({ className, variant, size, weight, required, helpText, error, children, ...props }, ref) => {
    if (isPerfMode()) {
      // Performance mode: minimal DOM, static classes
      return (
        <label
          ref={ref}
          className={[
            'label',
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
          className={cn(labelVariants({ variant, size, weight }), className)}
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
          <p className="text-semantic-muted-foreground text-xs" id={`${props.htmlFor}-help`}>
            {helpText}
          </p>
        )}
        
        {error && (
          <p 
            className="text-semantic-destructive text-xs" 
            id={`${props.htmlFor}-error`}
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Label.displayName = 'Label';

export { Label, labelVariants };
