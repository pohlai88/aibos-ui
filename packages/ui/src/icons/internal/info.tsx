/**
 * Info Icon - Enterprise Production Ready
 *
 * Internal SVG icon component for information display.
 * Always-on icon with semantic tokens and polymorphic support.
 */

import { cn } from '../../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const infoIconVariants = cva('inline-block shrink-0', {
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

export interface InfoIconProperties
  extends Omit<React.SVGProps<SVGSVGElement>, 'color'>,
    VariantProps<typeof infoIconVariants> {
  asChild?: boolean;
}

const InfoIcon = React.forwardRef<SVGSVGElement, InfoIconProperties>(
  ({ className, size, color, asChild = false, ...props }, reference) => {
    const Comp = asChild ? 'svg' : 'svg';

    return (
      <Comp
        ref={reference}
        className={cn(infoIconVariants({ size, color }), className)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </Comp>
    );
  },
);

InfoIcon.displayName = 'InfoIcon';

export { InfoIcon };
