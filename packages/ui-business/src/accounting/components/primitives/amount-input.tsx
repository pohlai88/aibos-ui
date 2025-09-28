// Amount Input Primitive Component
// Enterprise-grade amount input with currency formatting and validation

import { useState, useCallback, useEffect } from 'react';
import { LucideIcon, cn } from '@aibos/ui';
import type { AmountInputProperties } from '../../types';
import { formatNumber, validateAmount } from '../../utils';

export function AmountInput({
  value,
  onChange,
  currency = 'MYR',
  placeholder = '0.00',
  disabled = false,
  className,
}: AmountInputProperties): JSX.Element {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format the value for display
  useEffect(() => {
    if (!isFocused) {
      if (value === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(formatNumber(value, 2, true));
      }
    }
  }, [value, isFocused]);

  // Validate the value
  useEffect(() => {
    const validation = validateAmount(value, 'amount');
    setError(validation ? validation.message : null);
  }, [value]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;

      // Remove any non-numeric characters except decimal point
      const cleanValue = inputValue.replace(/[^0-9.]/g, '');

      // Ensure only one decimal point
      const parts = cleanValue.split('.');
      const formattedValue =
        parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleanValue;

      setDisplayValue(formattedValue);

      // Convert to number and call onChange
      const numericValue = parseFloat(formattedValue) || 0;
      onChange(numericValue);
    },
    [onChange],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Show raw value when focused
    setDisplayValue(value === 0 ? '' : value.toString());
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Format the value when not focused
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatNumber(value, 2, true));
    }
  }, [value]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if (
      [8, 9, 27, 13, 46, 110, 190].indexOf(event.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.keyCode === 65 && event.ctrlKey === true) ||
      (event.keyCode === 67 && event.ctrlKey === true) ||
      (event.keyCode === 86 && event.ctrlKey === true) ||
      (event.keyCode === 88 && event.ctrlKey === true) ||
      // Allow: home, end, left, right, down, up
      (event.keyCode >= 35 && event.keyCode <= 40)
    ) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if (
      (event.shiftKey || event.keyCode < 48 || event.keyCode > 57) &&
      (event.keyCode < 96 || event.keyCode > 105)
    ) {
      event.preventDefault();
    }
  }, []);

  const handleClear = useCallback(() => {
    setDisplayValue('');
    onChange(0);
  }, [onChange]);

  return (
    <div className={cn('relative', className)}>
      {/* Currency Symbol */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <LucideIcon name="DollarSign" className="h-4 w-4 text-gray-400" />
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'block w-full rounded-md border py-2 pl-10 pr-10 text-sm',
          'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
          'transition-colors',
          error
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 text-gray-900 placeholder-gray-500',
          disabled && 'cursor-not-allowed bg-gray-50 text-gray-500',
        )}
        aria-invalid={!!error}
        aria-describedby={error ? 'amount-error' : undefined}
      />

      {/* Clear Button */}
      {value !== 0 && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Clear amount"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div id="amount-error" className="mt-1 flex items-center text-sm text-red-600">
          <LucideIcon name="AlertCircle" className="mr-1 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Currency Display */}
      {!isFocused && value !== 0 && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-xs font-medium text-gray-500">{currency}</span>
        </div>
      )}
    </div>
  );
}
