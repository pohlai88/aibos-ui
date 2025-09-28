/**
 * Chevron Down Icon - Enterprise Production Ready
 *
 * SVG-in-JS chevron down icon with semantic tokens,
 * comprehensive accessibility features, and polymorphic support.
 */

import { polymorphic } from '../../utils/polymorphic.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const chevronDownVariants = cva(
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

export type ChevronDownIconProperties = VariantProps<typeof chevronDownVariants> & {
  asChild?: boolean;
  className?: string;
};

export const ChevronDownIcon = polymorphic<'svg', ChevronDownIconProperties>(
  'svg',
  ({ as: As = 'svg', className, size, variant, ...props }, reference) => {
    return (
      <As
        ref={reference as React.Ref<SVGSVGElement>}
        className={chevronDownVariants({ size, variant, className })}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        {...props}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </As>
    );
  },
  {
    displayName: 'ChevronDownIcon',
    slot: true,
  },
);

export type ChevronDownIconReference = React.ElementRef<typeof ChevronDownIcon>;
export type ChevronDownIconElement = React.ElementType;
