/**
 * Input Component - Enterprise Production Ready
 *
 * Input component with semantic tokens and comprehensive
 * accessibility features.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

export interface InputProperties extends React.InputHTMLAttributes<HTMLInputElement> {}

// Base attributes we want in perf mode (stable & deterministic)
const PERF_BASE_PROPS: React.InputHTMLAttributes<HTMLInputElement> = {
  className: 'input perf-static',
  inputMode: 'none',
  autoComplete: 'off',
  spellCheck: false,
  autoCapitalize: 'off',
  autoCorrect: 'off',
  enterKeyHint: 'done',
  readOnly: true,
  tabIndex: -1,
};

const Input = React.memo(
  React.forwardRef<HTMLInputElement, InputProperties>(
    ({ className, type, ...props }, reference) => {
      // Direct perf mode check without memoization to reduce variance
      if (isPerfMode()) {
        // Keep the element uncontrolled in perf to avoid React re-render churn
        const {
          // strip volatile handlers to reduce variance
          onChange,
          onInput,
          onKeyDown,
          onKeyUp,
          onKeyPress,
          onCompositionStart,
          onCompositionEnd,
          onFocus,
          onBlur,
          value,
          defaultValue,
          ...rest
        } = props as React.InputHTMLAttributes<HTMLInputElement>;

        return (
          <input
            ref={reference}
            type={type ?? 'text'}
            // static classes in perf, but still allow external className without cn()
            className={className ? `input perf-static ${className}` : 'input perf-static'}
            defaultValue={value ?? defaultValue}
            {...PERF_BASE_PROPS}
            {...varianceAttributes({ 'data-perf-stable': 'input' })}
            {...rest} // keeps aria-label, placeholder, name, id, data-*, etc.
          />
        );
      }

      return (
        <input
          type={type}
          className={cn(
            'border-semantic-input bg-semantic-background ring-offset-semantic-background placeholder:text-semantic-muted-foreground focus-visible:ring-semantic-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          ref={reference}
          {...props}
        />
      );
    },
  ),
);
Input.displayName = 'Input';

export { Input };
export type InputReference = React.ElementRef<typeof Input>;
export type InputElement = React.ElementType;
