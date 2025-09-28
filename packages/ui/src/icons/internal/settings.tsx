/**
 * Settings Icon - Enterprise Production Ready
 *
 * Internal SVG icon component for settings display.
 * Always-on icon with semantic tokens and polymorphic support.
 */

import { cn } from '../../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const settingsIconVariants = cva('inline-block shrink-0', {
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

export interface SettingsIconProperties
  extends Omit<React.SVGProps<SVGSVGElement>, 'color'>,
    VariantProps<typeof settingsIconVariants> {
  asChild?: boolean;
}

const SettingsIcon = React.forwardRef<SVGSVGElement, SettingsIconProperties>(
  ({ className, size, color, asChild = false, ...props }, reference) => {
    const Comp = asChild ? 'svg' : 'svg';

    return (
      <Comp
        ref={reference}
        className={cn(settingsIconVariants({ size, color }), className)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </Comp>
    );
  },
);

SettingsIcon.displayName = 'SettingsIcon';

export { SettingsIcon };
