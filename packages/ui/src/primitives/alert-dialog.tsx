/**
 * Alert Dialog Component - Enterprise Production Ready
 *
 * Alert Dialog component built from @radix-ui/react-dialog with semantic tokens,
 * CVA variants, and comprehensive accessibility features for confirmation dialogs.
 */

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { AlertCircleIcon, AlertTriangleIcon, InfoIcon, CheckCircleIcon } from '../icons';

const alertDialogVariants = cva(
  'bg-semantic-card shadow-elev-3 fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 duration-200 sm:rounded-lg',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
      },
      variant: {
        default: '',
        destructive: 'border-semantic-destructive',
        warning: 'border-semantic-warning',
        info: 'border-semantic-info',
        success: 'border-semantic-success',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

const alertDialogOverlayVariants = cva(
  'data-[state=open]:animate-premium-fade data-[state=closed]:animate-premium-fade fixed inset-0 z-50 bg-black/80 backdrop-blur-sm',
);

const alertDialogContentVariants = cva(
  'bg-semantic-background text-semantic-foreground',
);

const alertDialogHeaderVariants = cva(
  'flex flex-col space-y-2 text-center sm:text-left',
);

const alertDialogTitleVariants = cva(
  'text-lg font-semibold',
);

const alertDialogDescriptionVariants = cva(
  'text-semantic-muted-foreground text-sm',
);

const alertDialogFooterVariants = cva(
  'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
);

const alertDialogActionVariants = cva(
  'ring-offset-semantic-background focus-visible:ring-semantic-ring bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90 inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90',
        destructive: 'bg-semantic-destructive text-semantic-destructive-foreground hover:bg-semantic-destructive/90',
        warning: 'bg-semantic-warning text-semantic-warning-foreground hover:bg-semantic-warning/90',
        info: 'bg-semantic-info text-semantic-info-foreground hover:bg-semantic-info/90',
        success: 'bg-semantic-success text-semantic-success-foreground hover:bg-semantic-success/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const alertDialogCancelVariants = cva(
  'ring-offset-semantic-background focus-visible:ring-semantic-ring border-semantic-input bg-semantic-background hover:bg-semantic-accent hover:text-semantic-accent-foreground mt-2 inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:mt-0',
);

export interface AlertDialogProperties
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Root>,
    VariantProps<typeof alertDialogVariants> {
  className?: string;
}

export interface AlertDialogTriggerProperties
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Trigger> {}

export interface AlertDialogContentProperties
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>,
    VariantProps<typeof alertDialogVariants> {
  icon?: React.ReactNode;
}

export interface AlertDialogHeaderProperties
  extends React.ComponentPropsWithoutRef<'div'> {}

export interface AlertDialogTitleProperties
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> {}

export interface AlertDialogDescriptionProperties
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> {}

export interface AlertDialogFooterProperties
  extends React.ComponentPropsWithoutRef<'div'> {}

export interface AlertDialogActionProperties
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>,
    VariantProps<typeof alertDialogActionVariants> {}

export interface AlertDialogCancelProperties
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> {}

const AlertDialog = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Root>,
  AlertDialogProperties
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={['alert-dialog', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      />
    );
  }

  return (
    <AlertDialogPrimitive.Root
      className={cn(alertDialogVariants({ className }))}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for prop spreading compatibility
      {...(props as any)}
    />
  );
});
AlertDialog.displayName = 'AlertDialog';

const AlertDialogTrigger = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Trigger>,
  AlertDialogTriggerProperties
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <button
        ref={reference as React.Ref<HTMLButtonElement>}
        className={['alert-dialog-trigger', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      />
    );
  }

  return (
    <AlertDialogPrimitive.Trigger
      ref={reference}
      className={cn(className)}
      {...props}
    />
  );
});
AlertDialogTrigger.displayName = 'AlertDialogTrigger';

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={['alert-dialog-overlay', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      />
    );
  }

  return (
    <AlertDialogPrimitive.Overlay
      ref={reference}
      className={cn(alertDialogOverlayVariants({ className }))}
      {...props}
    />
  );
});
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProperties
>(({ className, size, variant, icon, children, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={['alert-dialog-content', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      >
        {children}
      </div>
    );
  }

  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'destructive':
        return <AlertCircleIcon className="text-semantic-destructive h-6 w-6" />;
      case 'warning':
        return <AlertTriangleIcon className="text-semantic-warning h-6 w-6" />;
      case 'info':
        return <InfoIcon className="text-semantic-info h-6 w-6" />;
      case 'success':
        return <CheckCircleIcon className="text-semantic-success h-6 w-6" />;
      default:
        return <AlertCircleIcon className="text-semantic-muted-foreground h-6 w-6" />;
    }
  };

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={reference}
        className={cn(alertDialogVariants({ size, variant }), alertDialogContentVariants(), className)}
        aria-modal="true"
        {...props}
      >
        <div className="flex items-start space-x-4">
          {getIcon()}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
});
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = React.forwardRef<
  HTMLDivElement,
  AlertDialogHeaderProperties
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference}
        className={['alert-dialog-header', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      />
    );
  }

  return (
    <div
      ref={reference}
      className={cn(alertDialogHeaderVariants({ className }))}
      {...props}
    />
  );
});
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  AlertDialogTitleProperties
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <h2
        ref={reference as React.Ref<HTMLHeadingElement>}
        className={['alert-dialog-title', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      >
        {props.children || 'Alert Dialog Title'}
      </h2>
    );
  }

  return (
    <AlertDialogPrimitive.Title
      ref={reference}
      className={cn(alertDialogTitleVariants({ className }))}
      {...props}
    />
  );
});
AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  AlertDialogDescriptionProperties
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <p
        ref={reference as React.Ref<HTMLParagraphElement>}
        className={['alert-dialog-description', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      />
    );
  }

  return (
    <AlertDialogPrimitive.Description
      ref={reference}
      className={cn(alertDialogDescriptionVariants({ className }))}
      {...props}
    />
  );
});
AlertDialogDescription.displayName = 'AlertDialogDescription';

const AlertDialogFooter = React.forwardRef<
  HTMLDivElement,
  AlertDialogFooterProperties
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference}
        className={['alert-dialog-footer', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      />
    );
  }

  return (
    <div
      ref={reference}
      className={cn(alertDialogFooterVariants({ className }))}
      {...props}
    />
  );
});
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  AlertDialogActionProperties
>(({ className, variant, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <button
        ref={reference as React.Ref<HTMLButtonElement>}
        className={['alert-dialog-action', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      />
    );
  }

  return (
    <AlertDialogPrimitive.Action
      ref={reference}
      className={cn(alertDialogActionVariants({ variant, className }))}
      {...props}
    />
  );
});
AlertDialogAction.displayName = 'AlertDialogAction';

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  AlertDialogCancelProperties
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <button
        ref={reference as React.Ref<HTMLButtonElement>}
        className={['alert-dialog-cancel', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
        {...(props as any)}
      />
    );
  }

  return (
    <AlertDialogPrimitive.Cancel
      ref={reference}
      className={cn(alertDialogCancelVariants({ className }))}
      {...props}
    />
  );
});
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  alertDialogVariants,
  alertDialogOverlayVariants,
  alertDialogContentVariants,
  alertDialogHeaderVariants,
  alertDialogTitleVariants,
  alertDialogDescriptionVariants,
  alertDialogFooterVariants,
  alertDialogActionVariants,
  alertDialogCancelVariants,
};
