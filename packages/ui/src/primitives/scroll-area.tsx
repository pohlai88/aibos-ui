/**
 * Scroll Area Component - Enterprise Production Ready
 *
 * Scroll area component with semantic tokens, CVA variants,
 * and comprehensive accessibility features for custom scrollbars.
 */

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const scrollAreaVariants = cva(
  'relative overflow-hidden',
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

const scrollAreaViewportVariants = cva(
  'h-full w-full rounded-[inherit]',
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

const scrollAreaScrollbarVariants = cva(
  'flex touch-none select-none transition-colors',
  {
    variants: {
      orientation: {
        vertical: 'h-full w-2.5 border-l border-l-transparent p-[1px]',
        horizontal: 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      },
      size: {
        sm: 'w-2',
        md: 'w-2.5',
        lg: 'w-3',
      },
    },
    defaultVariants: {
      orientation: 'vertical',
      size: 'md',
    },
  },
);

const scrollAreaThumbVariants = cva(
  'bg-semantic-border relative flex-1 rounded-full',
  {
    variants: {
      size: {
        sm: 'rounded-sm',
        md: 'rounded-full',
        lg: 'rounded-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const scrollAreaCornerVariants = cva(
  'bg-semantic-border',
  {
    variants: {
      size: {
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface ScrollAreaProperties
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>,
    VariantProps<typeof scrollAreaVariants> {}

export interface ScrollAreaViewportProperties
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Viewport>,
    VariantProps<typeof scrollAreaViewportVariants> {}

export interface ScrollAreaScrollbarProperties
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>,
    VariantProps<typeof scrollAreaScrollbarVariants> {}

export interface ScrollAreaThumbProperties
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Thumb>,
    VariantProps<typeof scrollAreaThumbVariants> {}

export interface ScrollAreaCornerProperties
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Corner>,
    VariantProps<typeof scrollAreaCornerVariants> {}

const ScrollArea = React.memo(
  React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Root>,
    ScrollAreaProperties
  >(({ className, size, children, ...props }, reference) => {
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
      <ScrollAreaPrimitive.Root
        ref={reference}
        className={cn(scrollAreaVariants({ size }), className)}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport className={cn(scrollAreaViewportVariants({ size }))}>
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.Scrollbar
          orientation="vertical"
          className={cn(scrollAreaScrollbarVariants({ orientation: 'vertical', size }))}
        >
          <ScrollAreaPrimitive.Thumb className={cn(scrollAreaThumbVariants({ size }))} />
        </ScrollAreaPrimitive.Scrollbar>
        <ScrollAreaPrimitive.Scrollbar
          orientation="horizontal"
          className={cn(scrollAreaScrollbarVariants({ orientation: 'horizontal', size }))}
        >
          <ScrollAreaPrimitive.Thumb className={cn(scrollAreaThumbVariants({ size }))} />
        </ScrollAreaPrimitive.Scrollbar>
        <ScrollAreaPrimitive.Corner className={cn(scrollAreaCornerVariants({ size }))} />
      </ScrollAreaPrimitive.Root>
    );
  }),
);

ScrollArea.displayName = 'ScrollArea';

const ScrollAreaViewport = React.memo(
  React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Viewport>,
    ScrollAreaViewportProperties
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
      <ScrollAreaPrimitive.Viewport
        ref={reference}
        className={cn(scrollAreaViewportVariants({ size }), className)}
        {...props}
      />
    );
  }),
);

ScrollAreaViewport.displayName = 'ScrollAreaViewport';

const ScrollAreaScrollbar = React.memo(
  React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
    ScrollAreaScrollbarProperties
  >(({ className, orientation, size, ...props }, reference) => {
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
      <ScrollAreaPrimitive.Scrollbar
        ref={reference}
        orientation={orientation}
        className={cn(scrollAreaScrollbarVariants({ orientation, size }), className)}
        {...props}
      />
    );
  }),
);

ScrollAreaScrollbar.displayName = 'ScrollAreaScrollbar';

const ScrollAreaThumb = React.memo(
  React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Thumb>,
    ScrollAreaThumbProperties
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
      <ScrollAreaPrimitive.Thumb
        ref={reference}
        className={cn(scrollAreaThumbVariants({ size }), className)}
        {...props}
      />
    );
  }),
);

ScrollAreaThumb.displayName = 'ScrollAreaThumb';

const ScrollAreaCorner = React.memo(
  React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Corner>,
    ScrollAreaCornerProperties
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
      <ScrollAreaPrimitive.Corner
        ref={reference}
        className={cn(scrollAreaCornerVariants({ size }), className)}
        {...props}
      />
    );
  }),
);

ScrollAreaCorner.displayName = 'ScrollAreaCorner';

export {
  ScrollArea,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
  scrollAreaVariants,
  scrollAreaViewportVariants,
  scrollAreaScrollbarVariants,
  scrollAreaThumbVariants,
  scrollAreaCornerVariants,
};
