/**
 * Checkbox Component - Enterprise Production Ready
 *
 * Checkbox component with Radix primitives, semantic tokens,
 * and comprehensive accessibility features.
 */

import { CheckIcon } from '../icons';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const Checkbox = React.memo(
  React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
  >(({ className, onCheckedChange, ...props }, reference) => {
    const handleCheckedChange = React.useCallback<NonNullable<typeof onCheckedChange>>(
      (checked) => {
        onCheckedChange?.(checked);
      },
      [onCheckedChange],
    );

    if (isPerfMode()) {
      const {
        onChange,
        onClick,
        onPointerUp,
        onPointerDown,
        onKeyDown,
        onKeyUp,
        onFocus,
        onBlur,
        children,
        ...clean
      } = props as React.InputHTMLAttributes<HTMLInputElement> & { children?: React.ReactNode };
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
        className={cn(
          'border-semantic-primary ring-offset-semantic-background focus-visible:ring-semantic-ring state-checked:bg-semantic-primary state-checked:text-semantic-primary-foreground peer h-4 w-4 shrink-0 rounded-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        onCheckedChange={handleCheckedChange}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn('flex items-center justify-center text-current')}
        >
          <CheckIcon className="h-4 w-4" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }),
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
export type CheckboxProperties = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;
export type CheckboxReference = React.ElementRef<typeof Checkbox>;
export type CheckboxElement = React.ElementType;
