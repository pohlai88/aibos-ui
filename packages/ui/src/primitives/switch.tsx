/**
 * Switch Component - Enterprise Production Ready
 *
 * Switch component with Radix primitives, semantic tokens,
 * and comprehensive accessibility features.
 */

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';
// import { varianceAttrs } from '../utils'; // TODO: Remove if not used

const Switch = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SwitchPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
  >(({ className, onCheckedChange, ...props }, reference) => {
    const handleCheckedChange = React.useCallback<NonNullable<typeof onCheckedChange>>(
      (checked) => {
        onCheckedChange?.(checked); // no computed layout, no sync style writes
      },
      [onCheckedChange],
    );

    if (isPerfMode()) {
      // Pure native checkbox; no handlers at all
      const { onChange, onClick, onPointerUp, onPointerDown, id, ...restProperties } =
        props as React.InputHTMLAttributes<HTMLInputElement> & { id?: string };
      return (
        <input
          ref={reference as React.LegacyRef<HTMLInputElement>}
          className="perf-static"
          type="checkbox"
          role="switch"
          id={id}
          {...restProperties}
          {...varianceAttributes()}
        />
      );
    }

    return (
      <SwitchPrimitive.Root
        className={cn(
          'focus-visible:ring-semantic-ring focus-visible:ring-offset-semantic-background state-checked:bg-semantic-primary state-unchecked:bg-semantic-input peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        onCheckedChange={handleCheckedChange}
        {...props}
        ref={reference}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'bg-semantic-background state-checked:translate-x-5 state-unchecked:translate-x-0 pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform',
          )}
        />
      </SwitchPrimitive.Root>
    );
  }),
);
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
export type SwitchProperties = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;
export type SwitchReference = React.ElementRef<typeof Switch>;
export type SwitchElement = React.ElementType;
