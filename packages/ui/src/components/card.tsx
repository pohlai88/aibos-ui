/**
 * Card Component - Enterprise Production Ready
 *
 * Card component with semantic tokens and comprehensive
 * accessibility features.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const CARD_CLASS_NAME = 'card';
const BORDER_CLASS_NAME = 'border';
const PERF_STATIC_CLASS_NAME = 'perf-static';

// Constants to avoid duplicate strings
const CARD_TITLE_CLASSES = 'text-2xl font-semibold leading-none tracking-tight';
const CARD_HEADER_CLASSES = 'flex flex-col space-y-1.5 p-6';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, reference) => {
    if (isPerfMode()) {
      // Perf path: no cn(), no inline style alloc; static class only
      return (
        <div
          ref={reference}
          className={[CARD_CLASS_NAME, BORDER_CLASS_NAME, PERF_STATIC_CLASS_NAME, className]
            .filter(Boolean)
            .join(' ')}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <div
        ref={reference}
        className={cn(
          'bg-semantic-card text-semantic-card-foreground rounded-lg border shadow-sm',
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={[CARD_HEADER_CLASSES.split(' '), PERF_STATIC_CLASS_NAME, className]
            .flat()
            .filter(Boolean)
            .join(' ')}
          {...varianceAttributes()}
          {...props}
        >
          {children}
        </div>
      );
    }
    return (
      <div ref={reference} className={cn(CARD_HEADER_CLASSES, className)} {...props}>
        {children}
      </div>
    );
  },
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <h3
          ref={reference}
          className={[CARD_TITLE_CLASSES.split(' '), PERF_STATIC_CLASS_NAME, className]
            .flat()
            .filter(Boolean)
            .join(' ')}
          {...varianceAttributes()}
          {...props}
        >
          {children}
        </h3>
      );
    }
    return (
      <h3 ref={reference} className={cn(CARD_TITLE_CLASSES, className)} {...props}>
        {children}
      </h3>
    );
  },
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <p
        ref={reference}
        className={['text-sm', 'text-semantic-muted-foreground', PERF_STATIC_CLASS_NAME, className]
          .filter(Boolean)
          .join(' ')}
        {...varianceAttributes()}
        {...props}
      />
    );
  }
  return (
    <p
      ref={reference}
      className={cn('text-semantic-muted-foreground text-sm', className)}
      {...props}
    />
  );
});
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={['p-6', 'pt-0', PERF_STATIC_CLASS_NAME, className].filter(Boolean).join(' ')}
          {...varianceAttributes()}
          {...props}
        />
      );
    }
    return <div ref={reference} className={cn('p-6 pt-0', className)} {...props} />;
  },
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={['flex', 'items-center', 'p-6', 'pt-0', PERF_STATIC_CLASS_NAME, className]
            .filter(Boolean)
            .join(' ')}
          {...varianceAttributes()}
          {...props}
        />
      );
    }
    return (
      <div ref={reference} className={cn('flex items-center p-6 pt-0', className)} {...props} />
    );
  },
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
export type CardProperties = React.HTMLAttributes<HTMLDivElement>;
export type CardReference = React.ElementRef<typeof Card>;
export type CardElement = React.ElementType;
