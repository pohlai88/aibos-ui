/**
 * Separator Component - Enterprise Production Ready
 *
 * Separator component with semantic tokens, CVA variants,
 * and comprehensive accessibility features.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const separatorVariants = cva(
  'bg-semantic-border shrink-0',
  {
    variants: {
      orientation: {
        horizontal: 'h-px w-full',
        vertical: 'h-full w-px',
      },
      decorative: {
        true: '',
        false: 'not-sr-only',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      decorative: true,
    },
  },
);

export interface SeparatorProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof separatorVariants> {
  /**
   * Whether the separator is decorative (hidden from screen readers)
   */
  decorative?: boolean;
  /**
   * Additional CSS class name
   */
  className?: string;
}

const Separator = React.forwardRef<
  HTMLDivElement,
  SeparatorProperties
>(({ className, orientation = 'horizontal', decorative = true, ...props }, reference) => {
  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <div
        ref={reference}
        className={cn('separator perf-static', className)}
        {...varianceAttributes()}
        {...props}
      />
    );
  }

  return (
    <div
      ref={reference}
      className={cn(separatorVariants({ orientation, decorative }), className)}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation || 'horizontal'}
      {...props}
    />
  );
});

Separator.displayName = 'Separator';

export { Separator, separatorVariants };
export type SeparatorReference = React.ElementRef<typeof Separator>;
export type SeparatorElement = React.ElementType;
