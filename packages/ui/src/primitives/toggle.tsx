/**
 * Toggle Component - Enterprise Production Ready
 *
 * Toggle component with semantic tokens, comprehensive accessibility features,
 * and support for single and group variants.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';

const toggleVariants = cva(
  'ring-offset-semantic-background hover:bg-semantic-muted hover:text-semantic-muted-foreground focus-visible:ring-semantic-ring data-[state=on]:bg-semantic-primary data-[state=on]:text-semantic-primary-foreground inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-semantic-background',
        outline: 'border-semantic-input bg-semantic-background hover:bg-semantic-accent hover:text-semantic-accent-foreground border',
        ghost: 'hover:bg-semantic-accent hover:text-semantic-accent-foreground',
        primary: 'bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90',
        secondary: 'bg-semantic-muted text-semantic-muted-foreground hover:bg-semantic-muted/80',
        destructive: 'bg-semantic-destructive text-semantic-destructive-foreground hover:bg-semantic-destructive/90',
      },
      size: {
        default: 'h-10 px-3',
        sm: 'h-9 px-2.5',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ToggleProperties
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {
  /**
   * Whether the toggle is pressed
   */
  pressed?: boolean;
  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean;
  /**
   * Callback when pressed state changes
   */
  onPressedChange?: (pressed: boolean) => void;
  /**
   * ARIA label for accessibility
   */
  'aria-label'?: string;
  /**
   * ARIA described by for accessibility
   */
  'aria-describedby'?: string;
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProperties
>(({ className, variant, size, ...props }, reference) => {
  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <button
        ref={reference as React.Ref<HTMLButtonElement>}
        type="button"
        className={cn('toggle perf-static', className)}
        {...varianceAttributes()}
        {...props}
      >
        {props.children}
      </button>
    );
  }

  return (
    <TogglePrimitive.Root
      ref={reference}
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  );
});
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
export type ToggleReference = React.ElementRef<typeof Toggle>;
export type ToggleElement = React.ElementType;
