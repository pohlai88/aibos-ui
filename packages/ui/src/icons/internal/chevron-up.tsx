/**
 * Chevron Up Icon - Enterprise Production Ready
 *
 * SVG-in-JS chevron up icon with semantic tokens,
 * comprehensive accessibility features, and polymorphic support.
 */

import { type PolymorphicProperties } from '../../utils/polymorphic.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const chevronUpVariants = cva(
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

export type ChevronUpIconProperties = VariantProps<typeof chevronUpVariants>;

interface ChevronUpIconBaseProperties extends ChevronUpIconProperties {
  asChild?: boolean;
  className?: string;
}

const ChevronUpIconImpl = React.forwardRef<
  SVGSVGElement,
  PolymorphicProperties<'svg', ChevronUpIconBaseProperties>
>(({ className, size, variant, ...props }, reference) => {
  return (
    <svg
      ref={reference}
      className={chevronUpVariants({ size, variant, className })}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
  );
});
ChevronUpIconImpl.displayName = 'ChevronUpIcon';

export const ChevronUpIcon = ChevronUpIconImpl;

export type ChevronUpIconReference = React.ElementRef<typeof ChevronUpIcon>;
export type ChevronUpIconElement = React.ElementType;
