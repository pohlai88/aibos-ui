/**
 * Accordion Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-accordion with semantic tokens,
 * premium animations, and comprehensive accessibility features.
 */

import { ChevronDownIcon } from '@icons/internal/chevron-down';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { isPerfMode, varianceAttributes, cn } from '../utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const ACCORDION_SPACING = 'space-y-2';
const ACCORDION_PERF_STATIC = 'perf-static';
const accordionVariants = cva(ACCORDION_SPACING);

const accordionItemVariants = cva('border-semantic-border border-b', {
  variants: {
    variant: {
      default: '',
      card: 'border-semantic-border bg-semantic-card shadow-elev-1 rounded-lg border',
      ghost: 'border-none',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const accordionTriggerVariants = cva(
  'hover:text-semantic-foreground flex flex-1 items-center justify-between py-4 font-medium transition-all [&[data-state=open]>svg]:rotate-180',
  {
    variants: {
      variant: {
        default: '',
        card: 'px-4',
        ghost: 'px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const accordionContentVariants = cva(
  'data-[state=closed]:animate-premium-fade data-[state=open]:animate-premium-fade overflow-hidden text-sm transition-all',
  {
    variants: {
      variant: {
        default: '',
        card: 'px-4 pb-4',
        ghost: 'px-0 pb-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface AccordionProperties {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  children?: React.ReactNode;
}

export interface AccordionItemProperties
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
    VariantProps<typeof accordionItemVariants> {}

export interface AccordionTriggerProperties
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
    VariantProps<typeof accordionTriggerVariants> {}

export interface AccordionContentProperties
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>,
    VariantProps<typeof accordionContentVariants> {}

const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  AccordionProperties
>(({ className, type = 'single', ...props }, reference) => {
  if (isPerfMode()) {
    // Static class; skip cva/animations in perf
    return (
      <AccordionPrimitive.Root
        ref={reference}
        {...({ type, ...props } as React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>)}
        className={cn(ACCORDION_SPACING, ACCORDION_PERF_STATIC, className)}
        {...varianceAttributes()}
      />
    );
  }
  return (
    <AccordionPrimitive.Root
      ref={reference}
      {...({ type, ...props } as React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>)}
      className={cn(accordionVariants(), className)}
    />
  );
});
Accordion.displayName = AccordionPrimitive.Root.displayName;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProperties
>(({ className, variant, ...props }, reference) => (
  <AccordionPrimitive.Item
    ref={reference}
    className={cn(accordionItemVariants({ variant }), className)}
    {...props}
  />
));
AccordionItem.displayName = AccordionPrimitive.Item.displayName;

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProperties
>(({ className, variant, children, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          ref={reference}
          className={cn(
            'flex flex-1 items-center justify-between py-4 font-medium',
            ACCORDION_PERF_STATIC,
            className,
          )}
          {...varianceAttributes()}
          {...props}
        >
          {children}
          {/* No rotation/transition in perf */}
          <ChevronDownIcon className="h-4 w-4 shrink-0" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
    );
  }
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={reference}
        className={cn(accordionTriggerVariants({ variant }), className)}
        {...props}
      >
        {children}
        <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProperties
>(({ className, variant, ...props }, reference) => {
  if (isPerfMode()) {
    // Keep Radix Content for correct typing; just drop transitions via class
    return (
      <AccordionPrimitive.Content
        ref={reference}
        className={cn('overflow-hidden text-sm', ACCORDION_PERF_STATIC, className)}
        {...varianceAttributes()}
        {...props}
      />
    );
  }
  return (
    <AccordionPrimitive.Content
      ref={reference}
      className={cn(accordionContentVariants({ variant }), className)}
      {...props}
    />
  );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
