/**
 * Badge Component - Enterprise Production Ready
 *
 * Badge component with semantic tokens and comprehensive
 * accessibility features.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-semantic-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/80',
        secondary:
          'border-transparent bg-semantic-muted text-semantic-muted-foreground hover:bg-semantic-muted/80',
        destructive:
          'border-transparent bg-semantic-destructive text-semantic-destructive-foreground hover:bg-semantic-destructive/80',
        success:
          'border-transparent bg-semantic-success text-semantic-success-foreground hover:bg-semantic-success/80',
        warning:
          'border-transparent bg-semantic-warning text-semantic-warning-foreground hover:bg-semantic-warning/80',
        info: 'border-transparent bg-semantic-info text-semantic-info-foreground hover:bg-semantic-info/80',
        outline: 'text-semantic-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProperties): React.ReactElement {
  if (isPerfMode()) {
    // Keep the same element as prod (DIV), avoid cn()/variant churn,
    // and make styling static + perf-pinned.
    return (
      <div
        className={[
          'badge',
          'inline-flex',
          'items-center',
          'rounded',
          'px-1.5',
          'py-0.5',
          'text-xs',
          'font-medium',
          'perf-static',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...varianceAttributes()}
        {...props}
      />
    );
  }
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
export type BadgeReference = React.ElementRef<typeof Badge>;
export type BadgeElement = React.ElementType;
