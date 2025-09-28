/**
 * Tabs Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-tabs with semantic tokens,
 * premium animations, and comprehensive accessibility features.
 */

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const tabsListVariants = cva(
  'inline-flex h-10 items-center justify-center rounded-md bg-semantic-muted p-1 text-semantic-muted-foreground',
  {
    variants: {
      variant: {
        default: '',
        card: 'border border-semantic-border bg-semantic-card',
        underline: 'rounded-none border-b border-semantic-border bg-transparent p-0',
      },
      size: {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-semantic-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-semantic-background data-[state=active]:text-semantic-foreground data-[state=active]:shadow-sm',
  {
    variants: {
      variant: {
        default: '',
        card: 'data-[state=active]:bg-semantic-card data-[state=active]:shadow-elev-1',
        underline:
          'rounded-none border-b-2 border-transparent data-[state=active]:border-semantic-primary data-[state=active]:shadow-none',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const tabsContentVariants = cva(
  'mt-2 ring-offset-semantic-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: '',
        card: 'rounded-md border border-semantic-border bg-semantic-card p-4 shadow-elev-1',
        underline: 'border-t border-semantic-border pt-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface TabsProperties extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {}

export interface TabsListProperties
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

export interface TabsTriggerProperties
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

export interface TabsContentProperties
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
    VariantProps<typeof tabsContentVariants> {}

const Tabs = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsProperties>(
  ({ className, ...props }, reference) => (
    <TabsPrimitive.Root ref={reference} className={className} {...props} />
  ),
);
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProperties>(
  ({ className, variant, size, ...props }, reference) => (
    <TabsPrimitive.List
      ref={reference}
      className={tabsListVariants({ variant, size, className })}
      {...props}
    />
  ),
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProperties
>(({ className, variant, ...props }, reference) => (
  <TabsPrimitive.Trigger
    ref={reference}
    className={tabsTriggerVariants({ variant, className })}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProperties
>(({ className, variant, ...props }, reference) => (
  <TabsPrimitive.Content
    ref={reference}
    className={tabsContentVariants({ variant, className })}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
