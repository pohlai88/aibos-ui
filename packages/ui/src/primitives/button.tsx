/**
 * Button Component - Enterprise Production Ready
 *
 * Button component with semantic tokens and comprehensive
 * accessibility features.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
  'ring-offset-semantic-background focus-visible:ring-semantic-ring inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90',
        primary:
          'bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90',
        destructive:
          'bg-semantic-destructive text-semantic-destructive-foreground hover:bg-semantic-destructive/90',
        outline:
          'border-semantic-input bg-semantic-background hover:bg-semantic-accent hover:text-semantic-accent-foreground border',
        secondary: 'bg-semantic-muted text-semantic-muted-foreground hover:bg-semantic-muted/80',
        ghost: 'hover:bg-semantic-accent hover:text-semantic-accent-foreground',
        link: 'text-semantic-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProperties
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProperties>(
  ({ className, variant, size, ...props }, reference) => {
    if (isPerfMode()) {
      // No React state toggles; rely on :active/:focus-visible CSS only
      const { onMouseDown, onMouseUp, onFocus, onBlur, children, ...restNoHandlers } = props;
      return (
        <button
          // keep styling static for perf, but still accept external className
          className={['btn', 'perf-static', className].filter(Boolean).join(' ')}
          ref={reference}
          type="button"
          {...varianceAttributes()}
          {...restNoHandlers}
        >
          {children}
        </button>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={reference}
        type="button"
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export type ButtonReference = React.ElementRef<typeof Button>;
export type ButtonElement = React.ElementType;
