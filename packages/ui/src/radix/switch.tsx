/**
 * Switch Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-switch with semantic tokens,
 * premium animations, and comprehensive accessibility features.
 */

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const switchVariants = cva(
  'focus-visible:ring-semantic-ring focus-visible:ring-offset-semantic-background data-[state=checked]:bg-semantic-primary data-[state=unchecked]:bg-semantic-input peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-4 w-7',
        md: 'h-6 w-11',
        lg: 'h-8 w-14',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const switchThumbVariants = cva(
  'bg-semantic-background pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
  {
    variants: {
      size: {
        sm: 'h-3 w-3 data-[state=checked]:translate-x-3',
        md: 'h-5 w-5 data-[state=checked]:translate-x-5',
        lg: 'h-7 w-7 data-[state=checked]:translate-x-7',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface SwitchProperties
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {
  size?: 'sm' | 'md' | 'lg';
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProperties>(
  ({ className, size, ...props }, reference) => (
    <SwitchPrimitive.Root
      className={switchVariants({ size, className })}
      {...props}
      ref={reference}
    >
      <SwitchPrimitive.Thumb className={switchThumbVariants({ size })} />
    </SwitchPrimitive.Root>
  ),
);
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
