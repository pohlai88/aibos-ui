/**
 * Radio Group Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-radio-group with semantic tokens,
 * premium animations, and comprehensive accessibility features.
 */

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { isPerfMode, varianceAttributes } from '../utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const radioGroupVariants = cva('grid gap-2');

const radioItemVariants = cva(
  'aspect-square h-4 w-4 rounded-full border border-semantic-border bg-semantic-background text-semantic-primary ring-offset-semantic-background transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-semantic-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-semantic-primary data-[state=checked]:text-semantic-primary-foreground',
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

export interface RadioGroupProperties
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
    VariantProps<typeof radioGroupVariants> {}

export interface RadioGroupItemProperties
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioItemVariants> {
  size?: 'sm' | 'md' | 'lg';
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProperties
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference}
        role="radiogroup"
        className={['grid', 'gap-2', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        {...props}
      />
    );
  }
  return (
    <RadioGroupPrimitive.Root
      className={radioGroupVariants({ className })}
      {...props}
      ref={reference}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProperties
>(({ className, size, ...props }, reference) => {
  if (isPerfMode()) {
    const { value, name } = props as { value?: string; name?: string };
    return (
      <label className="perf-static inline-flex items-center gap-2" {...varianceAttributes()}>
        <input type="radio" name={name ?? 'rg'} value={value} tabIndex={-1} readOnly />
        {/* consumers pass label text as siblings; they remain visible */}
      </label>
    );
  }
  return (
    <RadioGroupPrimitive.Item
      ref={reference}
      className={radioItemVariants({ size, className })}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
