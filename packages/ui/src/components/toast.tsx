/**
 * Toast Component - Enterprise Production Ready
 *
 * Toast component built from Radix primitives with semantic tokens
 * and comprehensive accessibility features.
 */

import { CloseIcon } from '@icons/internal';
import {
  Toast as ToastPrimitive,
  ToastViewport as ToastViewportPrimitive,
  ToastTitle as ToastTitlePrimitive,
  ToastDescription as ToastDescriptionPrimitive,
  ToastClose as ToastClosePrimitive,
  ToastAction as ToastActionPrimitive,
} from '@radix/toast';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastViewportPrimitive>,
  React.ComponentPropsWithoutRef<typeof ToastViewportPrimitive>
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={['toast-viewport', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      />
    );
  }

  return (
    <ToastViewportPrimitive
      ref={reference}
      className={cn(
        'fixed top-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-md',
        className,
      )}
      {...props}
    />
  );
});
ToastViewport.displayName = ToastViewportPrimitive.displayName;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive>
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={['toast', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      />
    );
  }

  return (
    <ToastPrimitive
      ref={reference}
      className={cn(
        'border-semantic-border state-open:animate-premium-fade state-closed:animate-premium-fade swipe-move:translate-x-toast-swipe-move swipe-move:transition-none swipe-end:translate-x-toast-swipe-end swipe-end:animate-premium-fade swipe-cancel:translate-x-0 group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        className,
      )}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitive.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastActionPrimitive>,
  React.ComponentPropsWithoutRef<typeof ToastActionPrimitive>
>(({ className, ...props }, reference) => (
  <ToastActionPrimitive
    ref={reference}
    className={cn(
      'border-semantic-border ring-offset-semantic-background hover:bg-semantic-accent focus:ring-semantic-ring group-destructive:border-semantic-muted/40 group-destructive:hover:border-semantic-destructive/30 group-destructive:hover:bg-semantic-destructive group-destructive:hover:text-semantic-destructive-foreground group-destructive:focus:ring-semantic-destructive inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastActionPrimitive.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastClosePrimitive>,
  React.ComponentPropsWithoutRef<typeof ToastClosePrimitive>
>(({ className, ...props }, reference) => (
  <ToastClosePrimitive
    ref={reference}
    className={cn(
      'text-semantic-foreground/50 hover:text-semantic-foreground group-destructive:text-semantic-destructive-foreground group-destructive:hover:text-semantic-destructive-foreground group-destructive:focus:ring-semantic-destructive group-destructive:focus:ring-offset-semantic-destructive absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
      className,
    )}
    toast-close=""
    {...props}
  >
    <CloseIcon className="h-4 w-4" />
  </ToastClosePrimitive>
));
ToastClose.displayName = ToastClosePrimitive.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastTitlePrimitive>,
  React.ComponentPropsWithoutRef<typeof ToastTitlePrimitive>
>(({ className, ...props }, reference) => (
  <ToastTitlePrimitive
    ref={reference}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastTitlePrimitive.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastDescriptionPrimitive>,
  React.ComponentPropsWithoutRef<typeof ToastDescriptionPrimitive>
>(({ className, ...props }, reference) => (
  <ToastDescriptionPrimitive
    ref={reference}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastDescriptionPrimitive.displayName;

export { Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, ToastViewport };
export type ToastProperties = React.ComponentPropsWithoutRef<typeof Toast>;
export type ToastActionElement = React.ReactElement<typeof ToastAction>;
