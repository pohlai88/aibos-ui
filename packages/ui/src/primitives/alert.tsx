/**
 * Alert Component - Enterprise Production Ready
 *
 * Alert component for status messages and notifications with semantic tokens,
 * CVA variants, and comprehensive accessibility features.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { AlertCircleIcon, AlertTriangleIcon, InfoIcon, CheckCircleIcon, CloseIcon } from '../icons';

const alertVariants = cva(
  '[&>svg]:text-foreground relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-semantic-background text-semantic-foreground border-semantic-border',
        destructive: 'border-semantic-destructive/50 text-semantic-destructive dark:border-semantic-destructive [&>svg]:text-semantic-destructive',
        warning: 'border-semantic-warning/50 text-semantic-warning dark:border-semantic-warning [&>svg]:text-semantic-warning',
        info: 'border-semantic-info/50 text-semantic-info dark:border-semantic-info [&>svg]:text-semantic-info',
        success: 'border-semantic-success/50 text-semantic-success dark:border-semantic-success [&>svg]:text-semantic-success',
      },
      size: {
        sm: 'p-3 text-sm',
        md: 'p-4 text-sm',
        lg: 'p-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const alertTitleVariants = cva(
  'mb-1 font-medium leading-none tracking-tight',
);

const alertDescriptionVariants = cva(
  'text-sm [&_p]:leading-relaxed',
);

const alertCloseVariants = cva(
  'ring-offset-semantic-background focus:ring-semantic-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none',
);

export interface AlertProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
}

export interface AlertTitleProperties
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface AlertDescriptionProperties
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface AlertCloseProperties
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProperties>(
  ({ className, variant, size, icon, closable, onClose, children, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={['alert', 'perf-static', className].filter(Boolean).join(' ')}
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
          return <AlertCircle className="h-4 w-4" />;
        case 'warning':
          return <AlertTriangle className="h-4 w-4" />;
        case 'info':
          return <Info className="h-4 w-4" />;
        case 'success':
          return <CheckCircle className="h-4 w-4" />;
        default:
          return <Info className="h-4 w-4" />;
      }
    };

    return (
      <div
        ref={reference}
        role="alert"
        className={cn(alertVariants({ variant, size }), className)}
        {...props}
      >
        {getIcon()}
        <div className="flex-1">
          {children}
        </div>
        {closable && (
          <AlertClose onClick={onClose}>
            <CloseIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </AlertClose>
        )}
      </div>
    );
  },
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProperties>(
  ({ className, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <h5
          ref={reference}
          className={['alert-title', 'perf-static', className].filter(Boolean).join(' ')}
          {...varianceAttributes()}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
          {...(props as any)}
        >
          {props.children || 'Alert Title'}
        </h5>
      );
    }

    return (
      <h5
        ref={reference}
        className={cn(alertTitleVariants({ className }))}
        {...props}
      >
        {props.children || 'Alert Title'}
      </h5>
    );
  },
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLDivElement, AlertDescriptionProperties>(
  ({ className, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={['alert-description', 'perf-static', className].filter(Boolean).join(' ')}
          {...varianceAttributes()}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
          {...(props as any)}
        />
      );
    }

    return (
      <div
        ref={reference}
        className={cn(alertDescriptionVariants({ className }))}
        {...props}
      />
    );
  },
);
AlertDescription.displayName = 'AlertDescription';

const AlertClose = React.forwardRef<HTMLButtonElement, AlertCloseProperties>(
  ({ className, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <button
          ref={reference}
          className={['alert-close', 'perf-static', className].filter(Boolean).join(' ')}
          {...varianceAttributes()}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for performance mode props compatibility
          {...(props as any)}
        />
      );
    }

    return (
      <button
        ref={reference}
        className={cn(alertCloseVariants({ className }))}
        {...props}
      />
    );
  },
);
AlertClose.displayName = 'AlertClose';

export {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertClose,
  alertVariants,
  alertTitleVariants,
  alertDescriptionVariants,
  alertCloseVariants,
};
