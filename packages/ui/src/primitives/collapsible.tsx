/**
 * Collapsible Component - Enterprise Production Ready
 *
 * Collapsible component with semantic tokens, CVA variants,
 * and comprehensive accessibility features for expandable content areas.
 */

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const collapsibleVariants = cva(
  'bg-semantic-background text-semantic-foreground',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const collapsibleContentVariants = cva(
  'overflow-hidden transition-all duration-200 ease-in-out',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const collapsibleTriggerVariants = cva(
  'hover:bg-semantic-accent hover:text-semantic-accent-foreground focus:ring-semantic-ring flex w-full items-center justify-between rounded-md px-4 py-2 text-left font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface CollapsibleProperties
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>,
    VariantProps<typeof collapsibleVariants> {
  /**
   * Whether the collapsible is open
   */
  open?: boolean;
  /**
   * Whether the collapsible is disabled
   */
  disabled?: boolean;
  /**
   * Callback when the open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Additional CSS class name
   */
  className?: string;
}

export interface CollapsibleTriggerProperties
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>,
    VariantProps<typeof collapsibleTriggerVariants> {
  /**
   * Additional CSS class name
   */
  className?: string;
}

export interface CollapsibleContentProperties
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>,
    VariantProps<typeof collapsibleContentVariants> {
  /**
   * Additional CSS class name
   */
  className?: string;
}

const Collapsible = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  CollapsibleProperties
>(({ className, size = 'md', ...props }, reference) => {
  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <div
        ref={reference as React.LegacyRef<HTMLDivElement>}
        className={cn('collapsible perf-static', className)}
        {...varianceAttributes()}
        {...props}
      />
    );
  }

  return (
    <CollapsiblePrimitive.Root
      ref={reference}
      className={cn(collapsibleVariants({ size }), className)}
      {...props}
    />
  );
});

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  CollapsibleTriggerProperties
>(({ className, size = 'md', ...props }, reference) => {
  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <button
        ref={reference as React.LegacyRef<HTMLButtonElement>}
        className={cn('collapsible-trigger perf-static', className)}
        {...varianceAttributes()}
        {...props}
      />
    );
  }

  return (
    <CollapsiblePrimitive.Trigger
      ref={reference}
      className={cn(collapsibleTriggerVariants({ size }), className)}
      {...props}
    />
  );
});

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProperties
>(({ className, size = 'md', ...props }, reference) => {
  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <div
        ref={reference as React.LegacyRef<HTMLDivElement>}
        className={cn('collapsible-content perf-static', className)}
        {...varianceAttributes()}
        {...props}
      />
    );
  }

  return (
    <CollapsiblePrimitive.Content
      ref={reference}
      className={cn(collapsibleContentVariants({ size }), className)}
      {...props}
    />
  );
});

Collapsible.displayName = 'Collapsible';
CollapsibleTrigger.displayName = 'CollapsibleTrigger';
CollapsibleContent.displayName = 'CollapsibleContent';

export { 
  Collapsible, 
  CollapsibleTrigger, 
  CollapsibleContent,
  collapsibleVariants,
  collapsibleTriggerVariants,
  collapsibleContentVariants,
};
export type CollapsibleReference = React.ElementRef<typeof Collapsible>;
export type CollapsibleTriggerReference = React.ElementRef<typeof CollapsibleTrigger>;
export type CollapsibleContentReference = React.ElementRef<typeof CollapsibleContent>;
export type CollapsibleElement = React.ElementType;
export type CollapsibleTriggerElement = React.ElementType;
export type CollapsibleContentElement = React.ElementType;
