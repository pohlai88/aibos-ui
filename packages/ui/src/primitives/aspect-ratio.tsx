/**
 * Aspect Ratio Component - Enterprise Production Ready
 *
 * Aspect ratio component with semantic tokens, CVA variants,
 * and comprehensive accessibility features for maintaining consistent aspect ratios.
 */

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const aspectRatioVariants = cva(
  'overflow-hidden',
  {
    variants: {
      size: {
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        none: '',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface AspectRatioProperties
  extends React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>,
    VariantProps<typeof aspectRatioVariants> {
  /**
   * The aspect ratio (width / height)
   * @default 16/9
   */
  ratio?: number;
  /**
   * Additional CSS class name
   */
  className?: string;
}

const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  AspectRatioProperties
>(({ className, ratio = 16 / 9, size = 'md', ...props }, reference) => {
  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <div
        ref={reference as React.LegacyRef<HTMLDivElement>}
        className={cn('aspect-ratio perf-static', className)}
        style={{ aspectRatio: `${ratio}` }}
        {...varianceAttributes()}
        {...props}
      />
    );
  }

  return (
    <AspectRatioPrimitive.Root
      ref={reference}
      ratio={ratio}
      className={cn(aspectRatioVariants({ size }), className)}
      {...props}
    />
  );
});

AspectRatio.displayName = 'AspectRatio';

export { AspectRatio, aspectRatioVariants };
export type AspectRatioReference = React.ElementRef<typeof AspectRatio>;
export type AspectRatioElement = React.ElementType;
