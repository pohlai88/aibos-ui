/**
 * Toast Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-toast with semantic tokens,
 * premium animations, and comprehensive accessibility features.
 */

import { CloseIcon } from '../icons';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const toastVariants = cva(
  'border-semantic-border bg-semantic-background shadow-elev-3 data-[state=closed]:animate-premium-fade data-[state=open]:animate-premium-fade data-[swipe=end]:animate-premium-fade group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
  {
    variants: {
      variant: {
        default: 'border-semantic-border bg-semantic-background',
        destructive:
          'border-semantic-destructive bg-semantic-destructive text-semantic-destructive-foreground group',
        success: 'bg-semantic-success text-semantic-success-foreground border-semantic-success',
        warning: 'bg-semantic-warning text-semantic-warning-foreground border-semantic-warning',
        info: 'bg-semantic-info text-semantic-info-foreground border-semantic-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const toastActionVariants = cva(
  'border-semantic-border ring-offset-semantic-background hover:bg-semantic-secondary focus:ring-semantic-ring group-[.destructive]:border-semantic-destructive/40 group-[.destructive]:hover:border-semantic-destructive/30 group-[.destructive]:hover:bg-semantic-destructive group-[.destructive]:hover:text-semantic-destructive-foreground group-[.destructive]:focus:ring-semantic-destructive inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        destructive:
          'group-[.destructive]:border-semantic-destructive/40 group-[.destructive]:hover:border-semantic-destructive/30 group-[.destructive]:hover:bg-semantic-destructive group-[.destructive]:hover:text-semantic-destructive-foreground group-[.destructive]:focus:ring-semantic-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const toastCloseVariants = cva(
  'text-semantic-foreground/50 hover:text-semantic-foreground group-[.destructive]:text-semantic-destructive-foreground group-[.destructive]:hover:text-semantic-destructive-foreground absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
  {
    variants: {
      variant: {
        default: '',
        destructive:
          'group-[.destructive]:text-semantic-destructive-foreground group-[.destructive]:hover:text-semantic-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface ToastProperties
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof toastVariants> {}

export interface ToastActionProperties
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>,
    VariantProps<typeof toastActionVariants> {}

export interface ToastCloseProperties
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>,
    VariantProps<typeof toastCloseVariants> {}

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, ToastProperties>(
  ({ className, variant, ...props }, reference) => {
    return (
      <ToastPrimitives.Root
        ref={reference}
        className={toastVariants({ variant, className })}
        {...props}
      />
    );
  },
);
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  ToastActionProperties
>(({ className, variant, ...props }, reference) => (
  <ToastPrimitives.Action
    ref={reference}
    className={toastActionVariants({ variant, className })}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  ToastCloseProperties
>(({ className, variant, ...props }, reference) => (
  <ToastPrimitives.Close
    ref={reference}
    className={toastCloseVariants({ variant, className })}
    toast-close=""
    {...props}
  >
    <CloseIcon className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, reference) => (
  <ToastPrimitives.Title
    ref={reference}
    className={`text-sm font-semibold ${className || ''}`}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, reference) => (
  <ToastPrimitives.Description
    ref={reference}
    className={`text-sm opacity-90 ${className || ''}`}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastViewportProperties = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  ToastViewportProperties
>(({ className, ...props }, reference) => (
  <ToastPrimitives.Viewport
    ref={reference}
    className={`z-toast md:max-w-xs-md fixed top-0 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col ${className || ''}`}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

export { Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, ToastViewport };
