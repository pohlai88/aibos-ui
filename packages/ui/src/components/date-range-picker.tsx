/**
 * Date Range Picker Component - Enterprise Production Ready
 *
 * Advanced date range picker component with calendar integration,
 * keyboard navigation, and comprehensive accessibility features.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Button } from '../primitives/button';
import { Calendar } from '../primitives/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { CalendarIcon, CloseIcon } from '../icons';
import { format, addDays, subDays, startOfDay, endOfDay, isWithinInterval, isSameDay, type Locale } from 'date-fns';

const dateRangePickerVariants = cva(
  'inline-flex items-center justify-center gap-2',
  {
    variants: {
      size: {
        sm: 'h-8 px-2 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      variant: {
        default: 'bg-semantic-background border border-semantic-border hover:bg-semantic-accent hover:text-semantic-accent-foreground',
        outline: 'border border-semantic-border bg-transparent hover:bg-semantic-accent hover:text-semantic-accent-foreground',
        ghost: 'hover:bg-semantic-accent hover:text-semantic-accent-foreground',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

const dateRangePickerTriggerVariants = cva(
  'flex h-full w-full items-center justify-between rounded-md border border-semantic-border bg-semantic-background px-3 py-2 text-sm ring-offset-background placeholder:text-semantic-muted-foreground focus:outline-none focus:ring-2 focus:ring-semantic-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-2 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const dateRangePickerContentVariants = cva(
  'bg-semantic-popover text-semantic-popover-foreground shadow-elev-2 z-50 w-auto p-0 rounded-md border',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const dateRangePickerCalendarVariants = cva(
  'rounded-md border',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DateRangePickerProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dateRangePickerVariants> {
  value?: DateRange;
  onValueChange?: (range: DateRange) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  numberOfMonths?: number;
  showOutsideDays?: boolean;
  fixedWeeks?: boolean;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  locale?: Locale;
  dateFormat?: string;
  separator?: string;
  allowSingleDateRange?: boolean;
  allowPastDates?: boolean;
  allowFutureDates?: boolean;
  presets?: DateRangePreset[];
  showPresets?: boolean;
  showClearButton?: boolean;
  showTodayButton?: boolean;
  className?: string;
}

export interface DateRangePreset {
  label: string;
  value: DateRange;
}

export interface DateRangePickerTriggerProperties
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'>,
    VariantProps<typeof dateRangePickerTriggerVariants> {
  value?: DateRange;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  dateFormat?: string;
  separator?: string;
}

export interface DateRangePickerContentProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dateRangePickerContentVariants> {
  value?: DateRange;
  onValueChange?: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  numberOfMonths?: number;
  showOutsideDays?: boolean;
  fixedWeeks?: boolean;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  locale?: Locale;
  presets?: DateRangePreset[];
  showPresets?: boolean;
  showClearButton?: boolean;
  showTodayButton?: boolean;
  allowSingleDateRange?: boolean;
  allowPastDates?: boolean;
  allowFutureDates?: boolean;
}

// Default presets
const defaultPresets: DateRangePreset[] = [
  {
    label: 'Today',
    value: {
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    },
  },
  {
    label: 'Yesterday',
    value: {
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    },
  },
  {
    label: 'Last 7 days',
    value: {
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    },
  },
  {
    label: 'Last 30 days',
    value: {
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    },
  },
  {
    label: 'This month',
    value: {
      from: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      to: endOfDay(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
    },
  },
  {
    label: 'Last month',
    value: {
      from: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)),
      to: endOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 0)),
    },
  },
];

const DateRangePickerTrigger = React.forwardRef<
  HTMLButtonElement,
  DateRangePickerTriggerProperties
>(({
  className,
  size = 'md',
  placeholder = 'Pick a date range',
  value,
  disabled = false,
  readOnly = false,
  dateFormat = 'MMM dd, yyyy',
  separator = ' - ',
  ...props
}, reference) => {
  if (isPerfMode()) {
    return (
      <button
        ref={reference}
        className={['date-range-picker-trigger', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        disabled={disabled}
        {...props}
      />
    );
  }

  const formatDateRange = (range: DateRange | undefined): string => {
    if (!range?.from) return placeholder;
    
    if (!range.to) {
      return format(range.from, dateFormat);
    }
    
    return `${format(range.from, dateFormat)}${separator}${format(range.to, dateFormat)}`;
  };

  return (
    <button
      ref={reference}
      className={cn(dateRangePickerTriggerVariants({ size }), className)}
      disabled={disabled || readOnly}
      {...props}
    >
      <span className="flex-1 text-left">
        {formatDateRange(value)}
      </span>
      <CalendarIcon 
        className="h-4 w-4 opacity-50" 
        context="dashboards"
        semanticColor="text-blue-500"
        enableAnimations={true}
        enableAdaptiveStyling={true}
        enableSemanticColors={true}
      />
    </button>
  );
});
DateRangePickerTrigger.displayName = 'DateRangePickerTrigger';

const DateRangePickerContent = React.forwardRef<
  HTMLDivElement,
  DateRangePickerContentProperties
>(({
  className,
  size = 'md',
  value,
  onValueChange,
  minDate,
  maxDate,
  numberOfMonths: _numberOfMonths = 2,
  showOutsideDays: _showOutsideDays = true,
  fixedWeeks: _fixedWeeks = false,
  weekStartsOn: _weekStartsOn = 1,
  locale,
  presets = defaultPresets,
  showPresets = true,
  showClearButton = true,
  showTodayButton = true,
  allowSingleDateRange: _allowSingleDateRange = false,
  allowPastDates = true,
  allowFutureDates = true,
  ...props
}, reference) => {
  const [selectedRange, setSelectedRange] = React.useState<DateRange>(value || { from: undefined, to: undefined });
  const [hoveredDate, _setHoveredDate] = React.useState<Date | undefined>();

  React.useEffect(() => {
    setSelectedRange(value || { from: undefined, to: undefined });
  }, [value]);

  if (isPerfMode()) {
    return (
      <div
        ref={reference}
        className={['date-range-picker-content', 'perf-static', className].filter(Boolean).join(' ')}
        {...varianceAttributes()}
        {...props}
      />
    );
  }

  const handleDateSelect = (date: Date) => {
    if (!allowPastDates && date < startOfDay(new Date())) return;
    if (!allowFutureDates && date > endOfDay(new Date())) return;
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;

    if (!selectedRange.from || (selectedRange.from && selectedRange.to)) {
      // Start new range
      setSelectedRange({ from: date, to: undefined });
    } else if (selectedRange.from && !selectedRange.to) {
      // Complete range
      if (date < selectedRange.from) {
        setSelectedRange({ from: date, to: selectedRange.from });
      } else {
        setSelectedRange({ from: selectedRange.from, to: date });
      }
    }
  };

  const handlePresetSelect = (preset: DateRangePreset) => {
    setSelectedRange(preset.value);
    onValueChange?.(preset.value);
  };

  const handleClear = () => {
    setSelectedRange({ from: undefined, to: undefined });
    onValueChange?.({ from: undefined, to: undefined });
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedRange({ from: today, to: today });
    onValueChange?.({ from: today, to: today });
  };

  const _isDateInRange = (date: Date): boolean => {
    if (!selectedRange.from) return false;
    if (!selectedRange.to) return isSameDay(date, selectedRange.from);
    return isWithinInterval(date, { start: selectedRange.from, end: selectedRange.to });
  };

  const _isDateSelected = (date: Date): boolean => {
    return Boolean((selectedRange.from && isSameDay(date, selectedRange.from)) ||
           (selectedRange.to && isSameDay(date, selectedRange.to)));
  };

  const _isDateHovered = (date: Date): boolean => {
    if (!hoveredDate || !selectedRange.from || selectedRange.to) return false;
    return isWithinInterval(date, { 
      start: selectedRange.from < hoveredDate ? selectedRange.from : hoveredDate,
      end: selectedRange.from < hoveredDate ? hoveredDate : selectedRange.from
    });
  };

  return (
    <div
      ref={reference}
      className={cn(dateRangePickerContentVariants({ size }), className)}
      {...props}
    >
      <div className="flex">
        {showPresets && presets.length > 0 && (
          <div className="border-r border-semantic-border p-3">
            <div className="space-y-1">
              {presets.map((preset, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="p-3">
          <Calendar
            value={selectedRange.from}
            onValueChange={(date) => {
              if (date) {
                handleDateSelect(date);
              }
            }}
            className={dateRangePickerCalendarVariants({ size })}
          />
          
          {(showClearButton || showTodayButton) && (
            <div className="flex justify-between pt-3 border-t border-semantic-border">
              {showClearButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={!selectedRange.from && !selectedRange.to}
                >
                  <CloseIcon 
                    className="h-4 w-4 mr-2" 
                    context="dashboards"
                    semanticColor="text-red-500"
                    enableAnimations={true}
                    enableAdaptiveStyling={true}
                    enableSemanticColors={true}
                  />
                  Clear
                </Button>
              )}
              {showTodayButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                >
                  Today
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
DateRangePickerContent.displayName = 'DateRangePickerContent';

const DateRangePicker = React.forwardRef<HTMLDivElement, DateRangePickerProperties>(
  ({
    className,
    size = 'md',
    variant = 'default',
    value,
    onValueChange,
    placeholder = 'Pick a date range',
    disabled = false,
    readOnly = false,
    required = false,
    minDate,
    maxDate,
    numberOfMonths = 2,
    showOutsideDays = true,
    fixedWeeks = false,
    weekStartsOn = 1,
    locale,
    dateFormat = 'MMM dd, yyyy',
    separator = ' - ',
    allowSingleDateRange = false,
    allowPastDates = true,
    allowFutureDates = true,
    presets = defaultPresets,
    showPresets = true,
    showClearButton = true,
    showTodayButton = true,
    ...props
  }, reference) => {
    const [open, setOpen] = React.useState(false);

    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={['date-range-picker', 'perf-static', className].filter(Boolean).join(' ')}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <div
        ref={reference}
        className={cn(dateRangePickerVariants({ size, variant }), className)}
        {...props}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <DateRangePickerTrigger
              size={size}
              placeholder={placeholder}
              value={value}
              disabled={disabled}
              readOnly={readOnly}
              dateFormat={dateFormat}
              separator={separator}
              aria-required={required}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DateRangePickerContent
              size={size}
              value={value}
              onValueChange={onValueChange}
              minDate={minDate}
              maxDate={maxDate}
              numberOfMonths={numberOfMonths}
              showOutsideDays={showOutsideDays}
              fixedWeeks={fixedWeeks}
              weekStartsOn={weekStartsOn}
              locale={locale}
              presets={presets}
              showPresets={showPresets}
              showClearButton={showClearButton}
              showTodayButton={showTodayButton}
              allowSingleDateRange={allowSingleDateRange}
              allowPastDates={allowPastDates}
              allowFutureDates={allowFutureDates}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);
DateRangePicker.displayName = 'DateRangePicker';

export {
  DateRangePicker,
  DateRangePickerTrigger,
  DateRangePickerContent,
  dateRangePickerVariants,
  dateRangePickerTriggerVariants,
  dateRangePickerContentVariants,
  dateRangePickerCalendarVariants,
  defaultPresets,
};
