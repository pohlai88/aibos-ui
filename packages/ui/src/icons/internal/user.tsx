/**
 * User Icon - Enterprise Production Ready
 *
 * Internal SVG icon component for user display.
 * Always-on icon with semantic tokens and polymorphic support.
 */

import { cn } from '../../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const userIconVariants = cva('inline-block shrink-0', {
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

export interface UserIconProperties
  extends Omit<React.SVGProps<SVGSVGElement>, 'color'>,
    VariantProps<typeof userIconVariants> {
  asChild?: boolean;
}

const UserIcon = React.forwardRef<SVGSVGElement, UserIconProperties>(
  ({ className, size, color, asChild = false, ...props }, reference) => {
    const Comp = asChild ? 'svg' : 'svg';

    return (
      <Comp
        ref={reference}
        className={cn(userIconVariants({ size, color }), className)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </Comp>
    );
  },
);

UserIcon.displayName = 'UserIcon';

export { UserIcon };
