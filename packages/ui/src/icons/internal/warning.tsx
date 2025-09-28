/**
 * Warning Icon - Enterprise Production Ready
 *
 * Internal SVG icon component for warning display.
 * Always-on icon with semantic tokens and polymorphic support.
 */

import { cn } from '../../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const warningIconVariants = cva('inline-block shrink-0', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
    },
    color: {
      default: 'text-semantic-foreground',
      muted: 'text-semantic-muted-foreground',
      primary: 'text-semantic-primary',
      secondary: 'text-semantic-secondary',
      success: 'text-semantic-success',
      warning: 'text-semantic-warning',
      error: 'text-semantic-error',
      info: 'text-semantic-info',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'default',
  },
});

export interface WarningIconProperties
  extends Omit<React.SVGProps<SVGSVGElement>, 'color'>,
    VariantProps<typeof warningIconVariants> {
  asChild?: boolean;
}

const WarningIcon = React.forwardRef<SVGSVGElement, WarningIconProperties>(
  ({ className, size, color, asChild = false, ...props }, reference) => {
    const Comp = asChild ? 'svg' : 'svg';

    return (
      <Comp
        ref={reference}
        className={cn(warningIconVariants({ size, color }), className)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </Comp>
    );
  },
);

WarningIcon.displayName = 'WarningIcon';

export { WarningIcon };
