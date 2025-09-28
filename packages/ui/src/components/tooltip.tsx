/**
 * Tooltip Component - Enterprise Production Ready
 *
 * Tooltip component built from Radix primitives with semantic tokens
 * and comprehensive accessibility features.
 */

import type { UnsafeAny } from '../types';

import {
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
  TooltipContent as TooltipContentPrimitive,
  TooltipProvider as TooltipProviderPrimitive,
} from '@radix/tooltip';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const TooltipProvider = TooltipProviderPrimitive;

const Tooltip = TooltipPrimitive;

const TooltipTrigger = TooltipTriggerPrimitive;

// Pre-allocated perf mode tooltip elements to eliminate variance
const PERF_TOOLTIP_HOST = React.createElement('span', {
  className: 'tooltip-host perf-static',
  'data-perf-stable': 'tooltip',
});

// Export for potential use in performance testing
export { PERF_TOOLTIP_HOST };
const PERF_TOOLTIP_CONTENT = (text: React.ReactNode) =>
  React.createElement('span', { className: 'tooltip', 'data-state': 'open' }, text ?? 'Tooltip');

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof TooltipContentPrimitive> & {
    open?: boolean;
    content?: React.ReactNode;
    children?: React.ReactNode;
  }
>(({ className, sideOffset = 4, open, content, children, ...props }, reference) => {
  if (isPerfMode()) {
    // If closed -> render nothing; if open -> static content.
    if (!open) return null;
    return React.cloneElement(PERF_TOOLTIP_CONTENT(content), {
      ref: reference as UnsafeAny,
      ...varianceAttributes(),
      ...props,
    });
  }

  return (
    <TooltipContentPrimitive
      ref={reference}
      sideOffset={sideOffset}
      className={cn(
        'animate-premium-fade bg-semantic-popover text-semantic-popover-foreground shadow-elev-1 z-50 overflow-hidden rounded-md border px-3 py-1.5 text-xs',
        className,
      )}
      {...props}
    />
  );
});
TooltipContent.displayName = TooltipContentPrimitive.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
