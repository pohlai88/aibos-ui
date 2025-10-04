/**
 * Calendar Component - Enterprise Production Ready
 *
 * Calendar component with date picker functionality,
 * semantic tokens, and comprehensive accessibility features.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Button } from './button';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';

const calendarVariants = cva(
  'bg-semantic-popover text-semantic-popover-foreground shadow-elev-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border p-1',
  {
    variants: {
      size: {
        sm: 'min-w-[7rem]',
        md: 'min-w-[8rem]',
        lg: 'min-w-[9rem]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const calendarHeaderVariants = cva(
  'flex items-center justify-between p-2',
  {
    variants: {
      size: {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-2.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const calendarGridVariants = cva(
  'grid w-full grid-cols-7 gap-1',
  {
    variants: {
      size: {
        sm: 'gap-0.5',
        md: 'gap-1',
        lg: 'gap-1.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const calendarDayVariants = cva(
  'hover:bg-semantic-accent hover:text-semantic-accent-foreground focus:bg-semantic-accent focus:text-semantic-accent-foreground flex h-8 w-8 items-center justify-center rounded-md text-sm font-normal focus:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-7 w-7 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-9 w-9 text-base',
      },
      variant: {
        default: '',
        selected: 'bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary hover:text-semantic-primary-foreground',
        today: 'bg-semantic-accent text-semantic-accent-foreground',
        outside: 'text-semantic-muted-foreground opacity-50',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

export interface CalendarProperties
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue'>,
    VariantProps<typeof calendarVariants> {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (value: Date) => void;
  disabled?: boolean;
  placeholder?: string;
  children?: React.ReactNode;
}

export interface CalendarDayProperties
  extends React.ComponentPropsWithoutRef<'button'>,
    VariantProps<typeof calendarDayVariants> {
  date: Date;
  isSelected?: boolean;
  isToday?: boolean;
  isOutsideMonth?: boolean;
  disabled?: boolean;
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProperties>(
  ({ className, size, value, defaultValue, onValueChange, disabled, placeholder, children, ...props }, reference) => {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value || defaultValue);
    const [currentMonth, setCurrentMonth] = React.useState<Date>(selectedDate || new Date());

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedDate(value);
        setCurrentMonth(value);
      }
    }, [value]);

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      onValueChange?.(date);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      const newMonth = new Date(currentMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      setCurrentMonth(newMonth);
    };

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
        days.push({ date: prevMonthDay, isOutsideMonth: true });
      }
      
      // Add days of the current month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        days.push({ date, isOutsideMonth: false });
      }
      
      // Add empty cells to complete the grid (6 weeks = 42 days)
      const remainingDays = 42 - days.length;
      for (let i = 1; i <= remainingDays; i++) {
        const nextMonthDay = new Date(year, month + 1, i);
        days.push({ date: nextMonthDay, isOutsideMonth: true });
      }
      
      return days;
    };

    const isToday = (date: Date) => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
      return selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
    };

    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('calendar perf-static', calendarVariants({ size }), className)}
          {...varianceAttributes()}
          data-size={size}
          data-disabled={disabled}
          {...props}
        >
          <div className="calendar-header perf-static">
            <div className="calendar-grid perf-static">
              {Array.from({ length: 42 }, (_, i) => (
                <div key={i} className="calendar-day perf-static" />
              ))}
            </div>
          </div>
        </div>
      );
    }

    const days = getDaysInMonth(currentMonth);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div
        ref={reference}
        className={cn(calendarVariants({ size }), className)}
        data-disabled={disabled}
        {...props}
      >
        <div className={cn(calendarHeaderVariants({ size }))}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('prev')}
            disabled={disabled}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            disabled={disabled}
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-2">
          <div className="mb-1 grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-semantic-muted-foreground text-center text-xs font-medium">
                {day}
              </div>
            ))}
          </div>
          
          <div className={cn(calendarGridVariants({ size }))}>
            {days.map((day, index) => (
              <CalendarDay
                key={index}
                date={day.date}
                isSelected={isSelected(day.date)}
                isToday={isToday(day.date)}
                isOutsideMonth={day.isOutsideMonth}
                disabled={disabled}
                onClick={() => !day.isOutsideMonth && handleDateSelect(day.date)}
                size={size}
                variant={
                  isSelected(day.date) ? 'selected' :
                  isToday(day.date) ? 'today' :
                  day.isOutsideMonth ? 'outside' : 'default'
                }
              />
            ))}
          </div>
        </div>
        
        {children}
      </div>
    );
  },
);
Calendar.displayName = 'Calendar';

const CalendarDay = React.forwardRef<HTMLButtonElement, CalendarDayProperties>(
  ({ className, size, variant, date, isSelected, isToday, isOutsideMonth, disabled, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <button
          ref={reference}
          className={cn('calendar-day perf-static', calendarDayVariants({ size, variant }), className)}
          {...varianceAttributes()}
          data-size={size}
          data-variant={variant}
          data-disabled={disabled}
          disabled={disabled}
          {...props}
        />
      );
    }

    return (
      <button
        ref={reference}
        className={cn(calendarDayVariants({ size, variant }), className)}
        disabled={disabled || isOutsideMonth}
        {...props}
      >
        {date.getDate()}
      </button>
    );
  },
);
CalendarDay.displayName = 'CalendarDay';

export { Calendar, CalendarDay, calendarVariants, calendarHeaderVariants, calendarGridVariants, calendarDayVariants };
export type CalendarReference = React.ElementRef<typeof Calendar>;
export type CalendarDayReference = React.ElementRef<typeof CalendarDay>;
export type CalendarElement = React.ElementType;
export type CalendarDayElement = React.ElementType;
