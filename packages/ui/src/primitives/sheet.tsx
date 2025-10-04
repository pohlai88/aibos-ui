/**
 * Sheet Component - Enterprise Production Ready
 *
 * Sheet component with semantic tokens, CVA variants,
 * and comprehensive accessibility features for slide-out panels and drawers.
 */

import * as SheetPrimitive from '@radix-ui/react-dialog';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { X } from 'lucide-react';

const sheetVariants = cva(
  'fixed inset-0 z-50',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b',
        bottom: 'inset-x-0 bottom-0 border-t',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

const sheetOverlayVariants = cva(
  'bg-semantic-background/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 backdrop-blur-sm',
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

const sheetContentVariants = cva(
  'bg-semantic-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 gap-4 p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 border-b',
        bottom: 'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 border-t',
        left: 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
        right: 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
      },
      size: {
        sm: 'p-4 text-xs',
        md: 'p-6 text-sm',
        lg: 'p-8 text-base',
      },
    },
    defaultVariants: {
      side: 'right',
      size: 'md',
    },
  },
);

const sheetHeaderVariants = cva(
  'flex flex-col space-y-2 text-center sm:text-left',
  {
    variants: {
      size: {
        sm: 'space-y-1',
        md: 'space-y-2',
        lg: 'space-y-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const sheetFooterVariants = cva(
  'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
  {
    variants: {
      size: {
        sm: 'space-y-1',
        md: 'space-y-2',
        lg: 'space-y-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const sheetTitleVariants = cva(
  'text-semantic-foreground text-lg font-semibold',
  {
    variants: {
      size: {
        sm: 'text-base',
        md: 'text-lg',
        lg: 'text-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const sheetDescriptionVariants = cva(
  'text-semantic-muted-foreground text-sm',
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

export interface SheetProperties
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>,
    VariantProps<typeof sheetVariants> {}

export interface SheetTriggerProperties
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger> {}

export interface SheetCloseProperties
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close> {}

export interface SheetContentProperties
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetContentVariants> {}

export interface SheetHeaderProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetHeaderVariants> {}

export interface SheetFooterProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetFooterVariants> {}

export interface SheetTitleProperties
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>,
    VariantProps<typeof sheetTitleVariants> {}

export interface SheetDescriptionProperties
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>,
    VariantProps<typeof sheetDescriptionVariants> {}

const Sheet = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Root>,
    SheetProperties
  >(({ className, side, ...props }, reference) => {
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
      <SheetPrimitive.Root
        ref={reference}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      />
    );
  }),
);

Sheet.displayName = 'Sheet';

const SheetTrigger = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Trigger>,
    SheetTriggerProperties
  >(({ className, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <button
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <SheetPrimitive.Trigger
        ref={reference}
        className={cn('perf-static', className)}
        {...props}
      />
    );
  }),
);

SheetTrigger.displayName = 'SheetTrigger';

const SheetClose = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Close>,
    SheetCloseProperties
  >(({ className, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <button
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <SheetPrimitive.Close
        ref={reference}
        className={cn('perf-static', className)}
        {...props}
      />
    );
  }),
);

SheetClose.displayName = 'SheetClose';

const SheetContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Content>,
    SheetContentProperties
  >(({ className, side, size, children, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className={cn(sheetOverlayVariants({ size }))} />
        <SheetPrimitive.Content
          ref={reference}
          className={cn(sheetContentVariants({ side, size }), className)}
          {...props}
        >
          {children}
          <SheetPrimitive.Close className="ring-offset-semantic-background focus:ring-semantic-ring data-[state=open]:bg-semantic-accent absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    );
  }),
);

SheetContent.displayName = 'SheetContent';

const SheetHeader = React.memo(
  React.forwardRef<HTMLDivElement, SheetHeaderProperties>(
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
        <div
          ref={reference}
          className={cn(sheetHeaderVariants({ size }), className)}
          {...props}
        />
      );
    },
  ),
);

SheetHeader.displayName = 'SheetHeader';

const SheetFooter = React.memo(
  React.forwardRef<HTMLDivElement, SheetFooterProperties>(
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
        <div
          ref={reference}
          className={cn(sheetFooterVariants({ size }), className)}
          {...props}
        />
      );
    },
  ),
);

SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Title>,
    SheetTitleProperties
  >(({ className, size, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <h2
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {props.children}
        </h2>
      );
    }

    return (
      <SheetPrimitive.Title
        ref={reference}
        className={cn(sheetTitleVariants({ size }), className)}
        {...props}
      >
        {props.children}
      </SheetPrimitive.Title>
    );
  }),
);

SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Description>,
    SheetDescriptionProperties
  >(({ className, size, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <p
          ref={reference}
          className={cn('perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <SheetPrimitive.Description
        ref={reference}
        className={cn(sheetDescriptionVariants({ size }), className)}
        {...props}
      />
    );
  }),
);

SheetDescription.displayName = 'SheetDescription';

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  sheetVariants,
  sheetOverlayVariants,
  sheetContentVariants,
  sheetHeaderVariants,
  sheetFooterVariants,
  sheetTitleVariants,
  sheetDescriptionVariants,
};
