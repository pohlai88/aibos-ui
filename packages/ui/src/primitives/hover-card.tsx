/**
 * Hover Card Component - Enterprise Production Ready
 *
 * Hover card component with semantic tokens, CVA variants,
 * and comprehensive accessibility features for rich hover content.
 */

import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const hoverCardVariants = cva(
  'bg-semantic-background text-semantic-foreground border-semantic-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 rounded-md border p-4 shadow-md outline-none',
  {
    variants: {
      size: {
        sm: 'w-48 p-3 text-xs',
        md: 'w-64 p-4 text-sm',
        lg: 'w-80 p-6 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const hoverCardTriggerVariants = cva(
  'text-semantic-foreground hover:text-semantic-accent-foreground focus:ring-semantic-ring focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const hoverCardContentVariants = cva(
  'bg-semantic-background text-semantic-foreground border-semantic-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 rounded-md border p-4 shadow-md outline-none',
  {
    variants: {
      size: {
        sm: 'w-48 p-3 text-xs',
        md: 'w-64 p-4 text-sm',
        lg: 'w-80 p-6 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface HoverCardProperties
  extends React.ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof hoverCardVariants> {}

export interface HoverCardTriggerProperties
  extends React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Trigger>,
    VariantProps<typeof hoverCardTriggerVariants> {}

export interface HoverCardContentProperties
  extends React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>,
    VariantProps<typeof hoverCardContentVariants> {}

const HoverCard = React.memo(
  React.forwardRef<HTMLDivElement, HoverCardProperties>(
    ({ className, size, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <HoverCardPrimitive.Root
        {...props}
      />
    );
  }),
);

HoverCard.displayName = 'HoverCard';

const HoverCardTrigger = React.memo(
  React.forwardRef<HTMLAnchorElement, HoverCardTriggerProperties>(
    ({ className, size, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <a
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {props.children || 'Hover trigger'}
        </a>
      );
    }

    return (
      <HoverCardPrimitive.Trigger
        ref={reference}
        className={cn(hoverCardTriggerVariants({ size }), className)}
        {...props}
      />
    );
  }),
);

HoverCardTrigger.displayName = 'HoverCardTrigger';

const HoverCardContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof HoverCardPrimitive.Content>,
    HoverCardContentProperties
  >(({ className, size, align = 'center', sideOffset = 4, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <HoverCardPrimitive.Content
        ref={reference}
        align={align}
        sideOffset={sideOffset}
        className={cn(hoverCardContentVariants({ size }), className)}
        {...props}
      />
    );
  }),
);

HoverCardContent.displayName = 'HoverCardContent';

export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  hoverCardVariants,
  hoverCardTriggerVariants,
  hoverCardContentVariants,
};
