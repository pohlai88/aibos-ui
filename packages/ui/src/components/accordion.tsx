/**
 * Accordion Component - Enterprise Production Ready
 *
 * Accordion component built from Radix primitives with semantic tokens
 * and comprehensive accessibility features.
 */

import { ChevronDownIcon } from '@icons/internal';
import {
  Accordion as AccordionPrimitive,
  AccordionItem as AccordionItemPrimitive,
  AccordionTrigger as AccordionTriggerPrimitive,
  AccordionContent as AccordionContentPrimitive,
} from '@radix/accordion';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const Accordion = AccordionPrimitive;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof AccordionItemPrimitive> & {
    open?: boolean;
    header?: React.ReactNode;
  }
>(({ className, open, header, children, ...props }, reference) => {
  if (isPerfMode()) {
    // Zero-layout path with <details>
    // Filter out Radix-specific props that aren't compatible with HTMLDetailsElement
    const { value, defaultValue, placeholder, dir, disabled, onValueChange, ...detailsProperties } =
      props as Record<string, unknown>;
    return (
      <details open={!!open} {...varianceAttributes()} {...detailsProperties}>
        <summary className="perf-static select-none list-none">{header}</summary>
        <div className="perf-static">{children}</div>
      </details>
    );
  }

  return (
    <AccordionItemPrimitive ref={reference} className={cn('border-b', className)} {...props} />
  );
});
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionTriggerPrimitive>,
  React.ComponentPropsWithoutRef<typeof AccordionTriggerPrimitive>
>(({ className, children, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <button
        ref={reference}
        className="flex flex-1 items-center justify-between py-4 font-medium"
        {...props}
      >
        {children}
        <span className="h-4 w-4 shrink-0">▼</span>
      </button>
    );
  }

  return (
    <AccordionTriggerPrimitive
      ref={reference}
      className={cn(
        'accordion-caret state-open:animate-premium-fade state-closed:animate-premium-fade flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionTriggerPrimitive>
  );
});
AccordionTrigger.displayName = AccordionTriggerPrimitive.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof AccordionContentPrimitive>
>(({ className, children, ...props }, reference) => {
  if (isPerfMode()) {
    // Stable path: no layout reads; rely on CSS overflow
    return (
      <div
        ref={reference}
        className="perf-static overflow-hidden text-sm"
        {...varianceAttributes()}
        {...props}
      >
        <div className="pb-4 pt-0">{children}</div>
      </div>
    );
  }

  return (
    <AccordionContentPrimitive
      ref={reference}
      className="state-open:animate-premium-fade state-closed:animate-premium-fade overflow-hidden text-sm transition-all"
      {...props}
    >
      <div className={cn('pb-4 pt-0', className)}>{children}</div>
    </AccordionContentPrimitive>
  );
});
AccordionContent.displayName = AccordionContentPrimitive.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
export type AccordionProperties = React.ComponentPropsWithoutRef<typeof Accordion>;
export type AccordionItemProperties = React.ComponentPropsWithoutRef<typeof AccordionItem>;
export type AccordionTriggerProperties = React.ComponentPropsWithoutRef<typeof AccordionTrigger>;
export type AccordionContentProperties = React.ComponentPropsWithoutRef<typeof AccordionContent>;
