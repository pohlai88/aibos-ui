/**
 * Check Icon - Enterprise Production Ready
 *
 * SVG-in-JS checkmark icon with semantic tokens,
 * comprehensive accessibility features, and polymorphic support.
 */

import { Slot } from '@radix/slot';
import { cn } from '../../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const checkVariants = cva(
  'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
      },
      variant: {
        default: 'text-semantic-foreground',
        muted: 'text-semantic-muted-foreground',
        primary: 'text-semantic-primary',
        secondary: 'text-semantic-secondary',
        destructive: 'text-semantic-destructive',
        success: 'text-semantic-success',
        warning: 'text-semantic-warning',
        info: 'text-semantic-info',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

export interface CheckIconProperties
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof checkVariants> {
  asChild?: boolean;
}

const CheckIcon = React.forwardRef<SVGSVGElement, CheckIconProperties>(
  ({ className, size, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'svg';

    return (
      <Comp
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for Radix UI Slot ref compatibility
        ref={asChild ? undefined : (ref as any)}
        className={cn(checkVariants({ size, variant }), className)}
        {...(asChild
          ? {}
          : {
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 2,
              viewBox: '0 0 24 24',
              xmlns: 'http://www.w3.org/2000/svg',
              'aria-hidden': true,
            })}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for Radix UI Slot props compatibility
        {...(props as any)}
      >
        {!asChild && (
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        )}
      </Comp>
    );
  },
);
CheckIcon.displayName = 'CheckIcon';

export { CheckIcon };
export type CheckIconReference = React.ElementRef<typeof CheckIcon>;
export type CheckIconElement = React.ElementType;
