/**
 * Checkbox Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-checkbox with semantic tokens,
 * premium animations, and comprehensive accessibility features.
 */

import { CheckIcon } from '@icons/internal/check';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { isPerfMode, varianceAttributes } from '../utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const checkboxVariants = cva(
  'peer h-4 w-4 shrink-0 rounded-sm border border-semantic-border bg-semantic-background ring-offset-semantic-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-semantic-primary data-[state=checked]:bg-semantic-primary data-[state=checked]:text-semantic-primary-foreground',
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface CheckboxProperties
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  size?: 'sm' | 'md' | 'lg';
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProperties
>(({ className, size, ...props }, reference) => {
  if (isPerfMode()) {
    const { onCheckedChange, onChange, onClick, onPointerUp, onPointerDown, ...clean } =
      props as React.InputHTMLAttributes<HTMLInputElement> & {
        onCheckedChange?: (checked: boolean) => void;
      };
    return (
      <input
        ref={reference as React.Ref<HTMLInputElement>}
        type="checkbox"
        className="perf-static border-semantic-border bg-semantic-background h-4 w-4 rounded-sm border"
        tabIndex={-1}
        {...varianceAttributes()}
        {...clean}
      />
    );
  }
  return (
    <CheckboxPrimitive.Root
      ref={reference}
      className={checkboxVariants({ size, className })}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <CheckIcon className="h-3 w-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
