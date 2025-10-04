/**
 * Dialog Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-dialog with semantic tokens.
 * Provides accessible modal dialogs with proper focus management.
 */

import { CloseIcon } from '../icons';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, reference) => (
  <DialogPrimitive.Overlay
    ref={reference}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm',
      'data-[state=open]:animate-premium-fade',
      'data-[state=closed]:animate-premium-fade',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /**
     * Optional portal container.
     * Defaults to #portal-root if present, else document.body.
     */
    container?: HTMLElement | undefined;
  }
>(({ className, children, container, ...props }, reference) => {
  const target =
    container ??
    (typeof document !== 'undefined'
      ? (document.querySelector('#portal-root') ?? document.body)
      : undefined);

  return (
    <DialogPortal container={target as HTMLElement}>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={reference}
        className={cn(
          'bg-semantic-card shadow-elev-3 fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 duration-200',
          'data-[state=open]:animate-premium-scale',
          'data-[state=closed]:animate-premium-scale',
          'sm:rounded-xl',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-semantic-background focus:ring-semantic-ring data-[state=open]:bg-semantic-muted data-[state=open]:text-semantic-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
          <CloseIcon 
            className="h-4 w-4" 
            context="dashboards"
            semanticColor="text-gray-500"
            enableAnimations={true}
            enableAdaptiveStyling={true}
            enableSemanticColors={true}
          />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, reference) => (
  <DialogPrimitive.Title
    ref={reference}
    className={cn(
      'text-semantic-foreground text-lg font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, reference) => (
  <DialogPrimitive.Description
    ref={reference}
    className={cn('text-semantic-muted-foreground text-sm', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
