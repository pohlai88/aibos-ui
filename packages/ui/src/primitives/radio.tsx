/**
 * Radio Component - Enterprise Production Ready
 *
 * Radio component with Radix primitives, semantic tokens,
 * and comprehensive accessibility features.
 */

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    const { onValueChange, value, defaultValue, ...divProperties } = props;
    return (
      <div
        ref={reference}
        role="radiogroup"
        className="perf-static grid gap-2"
        {...varianceAttributes()}
        {...divProperties}
      />
    );
  }

  return (
    <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={reference} />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.memo(
  React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & { children?: React.ReactNode }
  >(({ className, children, ...props }, reference) => {
    // Use stable ID in normal mode
    const id = React.useId();

    if (isPerfMode()) {
      // Minimal: input + text; accessible name preserved; no focus/IME/layout churn
      const name = String((props as Record<string, unknown>).name ?? 'rg');
      const value = String((props as Record<string, unknown>).value ?? '');
      return (
        <label className="perf-static inline-flex items-center gap-2" {...varianceAttributes()}>
          <input type="radio" name={name} value={value} tabIndex={-1} readOnly />
          {children ? <span>{children}</span> : undefined}
        </label>
      );
    }

    return (
      <div className="inline-flex items-center gap-2">
        <RadioGroupPrimitive.Item
          ref={reference}
          id={id}
          className={cn(
            'border-semantic-primary text-semantic-primary ring-offset-semantic-background focus-visible:ring-semantic-ring aspect-square h-4 w-4 rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        >
          <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
            <div className="bg-semantic-primary h-2.5 w-2.5 rounded-full" />
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
        {children && <label htmlFor={id}>{children}</label>}
      </div>
    );
  }),
);
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
export type RadioGroupProperties = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;
export type RadioGroupReference = React.ElementRef<typeof RadioGroup>;
export type RadioGroupElement = React.ElementType;
