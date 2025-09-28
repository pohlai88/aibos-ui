/**
 * Tooltip Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-tooltip with semantic tokens.
 * Provides accessible tooltip components with proper positioning.
 */

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <span
        ref={reference}
        className="perf-static shadow-elev-1 px-3 py-1.5 text-xs"
        {...varianceAttributes()}
        {...props}
      />
    );
  }
  return (
    <TooltipPrimitive.Content
      ref={reference}
      sideOffset={sideOffset}
      className={cn(
        'animate-premium-fade bg-semantic-popover text-semantic-popover-foreground shadow-elev-1 z-50 overflow-hidden rounded-md border px-3 py-1.5 text-xs',
        'data-[state=delayed-open]:animate-premium-fade',
        className,
      )}
      {...props}
    />
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
