/**
 * Navigation Menu Component - Enterprise Production Ready
 *
 * Navigation menu component with semantic tokens, CVA variants,
 * and comprehensive accessibility features for complex navigation patterns.
 */

import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { ChevronDown } from 'lucide-react';

const navigationMenuVariants = cva(
  'relative z-10 flex max-w-max flex-1 items-center justify-center',
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

const navigationMenuListVariants = cva(
  'group flex flex-1 list-none items-center justify-center space-x-1',
  {
    variants: {
      size: {
        sm: 'space-x-0.5',
        md: 'space-x-1',
        lg: 'space-x-2',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const navigationMenuItemVariants = cva(
  'relative',
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

const navigationMenuTriggerVariants = cva(
  'bg-semantic-background hover:bg-semantic-accent hover:text-semantic-accent-foreground focus:bg-semantic-accent focus:text-semantic-accent-foreground data-[active]:bg-semantic-accent/50 data-[state=open]:bg-semantic-accent/50 group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const navigationMenuContentVariants = cva(
  'data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 left-0 top-0 w-full md:absolute md:w-auto',
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

const navigationMenuLinkVariants = cva(
  'hover:bg-semantic-accent hover:text-semantic-accent-foreground focus:bg-semantic-accent focus:text-semantic-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
  {
    variants: {
      size: {
        sm: 'p-2 text-xs',
        md: 'p-3 text-sm',
        lg: 'p-4 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface NavigationMenuProperties
  extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>,
    VariantProps<typeof navigationMenuVariants> {}

export interface NavigationMenuListProperties
  extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>,
    VariantProps<typeof navigationMenuListVariants> {}

export interface NavigationMenuItemProperties
  extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Item>,
    VariantProps<typeof navigationMenuItemVariants> {}

export interface NavigationMenuTriggerProperties
  extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>,
    VariantProps<typeof navigationMenuTriggerVariants> {}

export interface NavigationMenuContentProperties
  extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>,
    VariantProps<typeof navigationMenuContentVariants> {}

export interface NavigationMenuLinkProperties
  extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>,
    VariantProps<typeof navigationMenuLinkVariants> {}

const NavigationMenu = React.memo(
  React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Root>,
    NavigationMenuProperties
  >(({ className, size, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <nav
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <NavigationMenuPrimitive.Root
        ref={reference}
        className={cn(navigationMenuVariants({ size }), className)}
        {...props}
      />
    );
  }),
);

NavigationMenu.displayName = 'NavigationMenu';

const NavigationMenuList = React.memo(
  React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.List>,
    NavigationMenuListProperties
  >(({ className, size, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <ul
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <NavigationMenuPrimitive.List
        ref={reference}
        className={cn(navigationMenuListVariants({ size }), className)}
        {...props}
      />
    );
  }),
);

NavigationMenuList.displayName = 'NavigationMenuList';

const NavigationMenuItem = React.memo(
  React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Item>,
    NavigationMenuItemProperties
  >(({ className, size, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <li
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <NavigationMenuPrimitive.Item
        ref={reference}
        className={cn(navigationMenuItemVariants({ size }), className)}
        {...props}
      />
    );
  }),
);

NavigationMenuItem.displayName = 'NavigationMenuItem';

const NavigationMenuTrigger = React.memo(
  React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
    NavigationMenuTriggerProperties
  >(({ className, size, children, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <button
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {children}
        </button>
      );
    }

    return (
      <NavigationMenuPrimitive.Trigger
        ref={reference}
        className={cn(navigationMenuTriggerVariants({ size }), className)}
        {...props}
      >
        {children}{' '}
        <ChevronDown
          className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </NavigationMenuPrimitive.Trigger>
    );
  }),
);

NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';

const NavigationMenuContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Content>,
    NavigationMenuContentProperties
  >(({ className, size, ...props }, reference) => {
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
      <NavigationMenuPrimitive.Content
        ref={reference}
        className={cn(navigationMenuContentVariants({ size }), className)}
        {...props}
      />
    );
  }),
);

NavigationMenuContent.displayName = 'NavigationMenuContent';

const NavigationMenuLink = React.memo(
  React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Link>,
    NavigationMenuLinkProperties
  >(({ className, size, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <a
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {props.children}
        </a>
      );
    }

    return (
      <NavigationMenuPrimitive.Link
        ref={reference}
        className={cn(navigationMenuLinkVariants({ size }), className)}
        {...props}
      >
        {props.children}
      </NavigationMenuPrimitive.Link>
    );
  }),
);

NavigationMenuLink.displayName = 'NavigationMenuLink';

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuVariants,
  navigationMenuListVariants,
  navigationMenuItemVariants,
  navigationMenuTriggerVariants,
  navigationMenuContentVariants,
  navigationMenuLinkVariants,
};
