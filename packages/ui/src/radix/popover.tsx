/**
 * Popover Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-popover with semantic tokens.
 * Provides accessible popover components with proper positioning.
 */

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, reference) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={reference}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'bg-semantic-popover text-semantic-popover-foreground shadow-elev-2 z-50 w-72 rounded-md border p-4 outline-none',
        'data-[state=open]:animate-premium-fade',
        'data-[state=closed]:animate-premium-fade',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
