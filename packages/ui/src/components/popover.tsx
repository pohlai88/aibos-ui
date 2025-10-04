/**
 * Popover Component - Enterprise Production Ready
 *
 * Popover component built from Radix primitives with semantic tokens
 * and comprehensive accessibility features.
 */

import {
  Popover as PopoverPrimitive,
  PopoverTrigger as PopoverTriggerPrimitive,
  PopoverContent as PopoverContentPrimitive,
} from '@radix/popover';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const Popover = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive>
>(({ ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference}
        className="popover perf-static"
        {...varianceAttributes()}
        data-testid="popover"
        {...props}
      />
    );
  }

  return (
    <PopoverPrimitive
      ref={reference}
      data-testid="popover"
      {...props}
    />
  );
});
Popover.displayName = 'Popover';

const PopoverTrigger = PopoverTriggerPrimitive;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof PopoverContentPrimitive>
>(({ className, align = 'center', sideOffset = 4, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference}
        className={['popover-content', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        {...props}
      />
    );
  }

  return (
    <PopoverContentPrimitive
      ref={reference}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'bg-semantic-popover text-semantic-popover-foreground state-open:animate-premium-fade state-closed:animate-premium-fade z-50 w-72 rounded-md border p-4 shadow-md outline-none',
        className,
      )}
      data-testid="popover-content"
      {...props}
    />
  );
});
PopoverContent.displayName = PopoverContentPrimitive.displayName;

export { Popover, PopoverTrigger, PopoverContent };
