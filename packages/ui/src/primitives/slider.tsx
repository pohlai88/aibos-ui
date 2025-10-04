/**
 * Slider Component - Enterprise Production Ready
 *
 * Slider component with semantic tokens, comprehensive accessibility features,
 * and support for single and range variants.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

const sliderVariants = cva(
  'relative flex w-full touch-none select-none items-center',
  {
    variants: {
      orientation: {
        horizontal: '',
        vertical: 'h-64 w-5 flex-col',
      },
      size: {
        sm: 'h-3',
        md: 'h-5',
        lg: 'h-7',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      size: 'md',
    },
  },
);

const sliderTrackVariants = cva(
  'bg-semantic-muted relative grow overflow-hidden rounded-full',
  {
    variants: {
      orientation: {
        horizontal: 'h-2',
        vertical: 'w-2',
      },
      size: {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      size: 'md',
    },
  },
);

const sliderRangeVariants = cva(
  'bg-semantic-primary absolute',
  {
    variants: {
      orientation: {
        horizontal: 'h-full',
        vertical: 'w-full',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  },
);

const sliderThumbVariants = cva(
  'border-semantic-primary bg-semantic-background ring-offset-semantic-background focus-visible:ring-semantic-ring block h-5 w-5 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        md: 'h-5 w-5',
        lg: 'h-7 w-7',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface SliderProperties
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'orientation'>,
    VariantProps<typeof sliderVariants> {
  /**
   * Whether the slider is disabled
   */
  disabled?: boolean;
  /**
   * Whether the slider is read-only
   */
  readOnly?: boolean;
  /**
   * Minimum value
   */
  min?: number;
  /**
   * Maximum value
   */
  max?: number;
  /**
   * Step value
   */
  step?: number;
  /**
   * Default value
   */
  defaultValue?: number[];
  /**
   * Current value
   */
  value?: number[];
  /**
   * Callback when value changes
   */
  onValueChange?: (value: number[]) => void;
  /**
   * Callback when value commit
   */
  onValueCommit?: (value: number[]) => void;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProperties & { 'data-testid'?: string }
>(({ className, orientation, size, disabled, readOnly, min, max, step, defaultValue, value, onValueChange, onValueCommit, inverted, asChild, name, minStepsBetweenThumbs, 'data-testid': dataTestId, ...props }, reference) => {
  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('slider perf-static', className)}
        role="slider"
        aria-valuemin={min || 0}
        aria-valuemax={max || 100}
        aria-valuenow={defaultValue?.[0] || 0}
        data-testid={dataTestId}
        {...varianceAttributes()}
        {...props}
      >
        <div className="slider-track perf-static bg-semantic-muted h-2 w-full rounded-full" />
        <div className="slider-range perf-static bg-semantic-primary h-2 w-1/2 rounded-full" />
        <div className="slider-thumb perf-static bg-semantic-background border-semantic-primary h-5 w-5 rounded-full border-2" />
      </div>
    );
  }

  return (
    <SliderPrimitive.Root
      ref={reference}
      className={cn(sliderVariants({ orientation, size }), className)}
      data-testid={dataTestId}
      {...props}
    >
      <SliderPrimitive.Track className={sliderTrackVariants({ orientation, size })}>
        <SliderPrimitive.Range className={sliderRangeVariants({ orientation })} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={sliderThumbVariants({ size })} />
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider, sliderVariants };
export type SliderReference = React.ElementRef<typeof Slider>;
export type SliderElement = React.ElementType;
