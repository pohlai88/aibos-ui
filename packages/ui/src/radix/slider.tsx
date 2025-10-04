/**
 * Slider Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-slider with semantic tokens.
 * Provides accessible slider components with proper keyboard navigation.
 */

import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const Slider = SliderPrimitive.Root;

const SliderTrack = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Track>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Track>
>(({ className, ...props }, reference) => (
  <SliderPrimitive.Track
    ref={reference}
    className={cn(
      'bg-semantic-muted relative h-2 w-full grow overflow-hidden rounded-full',
      className,
    )}
    {...props}
  />
));
SliderTrack.displayName = SliderPrimitive.Track.displayName;

const SliderRange = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Range>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Range>
>(({ className, ...props }, reference) => (
  <SliderPrimitive.Range
    ref={reference}
    className={cn('bg-semantic-primary absolute h-full', className)}
    {...props}
  />
));
SliderRange.displayName = SliderPrimitive.Range.displayName;

const SliderThumb = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Thumb>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Thumb>
>(({ className, ...props }, reference) => (
  <SliderPrimitive.Thumb
    ref={reference}
    className={cn(
      'border-semantic-primary bg-semantic-background ring-offset-semantic-background focus-visible:ring-semantic-ring block h-5 w-5 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
SliderThumb.displayName = SliderPrimitive.Thumb.displayName;

export { Slider, SliderTrack, SliderRange, SliderThumb };
