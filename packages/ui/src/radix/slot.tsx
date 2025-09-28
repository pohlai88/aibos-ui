import { Slot as RadixSlot } from '@radix-ui/react-slot';
import * as React from 'react';

/**
 * Slot component wrapper for Radix UI
 *
 * This wrapper provides a clean interface to Radix's Slot component
 * while maintaining compliance with our architecture standards.
 *
 * @example
 * ```tsx
 * import { Slot } from '@aibos/ui/radix/slot';
 *
 * <Slot asChild>
 *   <button>Click me</button>
 * </Slot>
 * ```
 */
export const Slot = React.forwardRef<
  React.ElementRef<typeof RadixSlot>,
  React.ComponentPropsWithoutRef<typeof RadixSlot>
>((props, reference) => {
  return <RadixSlot ref={reference} {...props} />;
});

Slot.displayName = 'Slot';
