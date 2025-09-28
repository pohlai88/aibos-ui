/**
 * Chevron Right Icon - Enterprise Production Ready
 *
 * Chevron pointing right icon component with semantic tokens
 * and comprehensive accessibility features.
 */

import { cn } from '../../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const chevronRightIconVariants = cva('inline-flex items-center justify-center', {
  variants: {
    size: {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
    },
    iconColor: {
      default: 'text-semantic-foreground',
      muted: 'text-semantic-muted-foreground',
      primary: 'text-semantic-primary',
      secondary: 'text-semantic-muted',
      destructive: 'text-semantic-destructive',
      success: 'text-semantic-success',
      warning: 'text-semantic-warning',
      info: 'text-semantic-info',
    },
  },
  defaultVariants: {
    size: 'md',
    iconColor: 'default',
  },
});

export interface ChevronRightIconProperties
  extends Omit<React.SVGProps<SVGSVGElement>, 'color'>,
    VariantProps<typeof chevronRightIconVariants> {}

const ChevronRightIcon = React.forwardRef<SVGSVGElement, ChevronRightIconProperties>(
  ({ className, size, iconColor, ...props }, reference) => (
    <svg
      ref={reference}
      className={cn(chevronRightIconVariants({ size, iconColor }), className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
);

ChevronRightIcon.displayName = 'ChevronRightIcon';

export { ChevronRightIcon, chevronRightIconVariants };
export type ChevronRightIconReference = React.ElementRef<typeof ChevronRightIcon>;
export type ChevronRightIconElement = React.ElementType;
