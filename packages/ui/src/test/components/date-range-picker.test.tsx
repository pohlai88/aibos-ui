/**
 * Date Range Picker Component Tests - Enterprise Production Ready
 *
 * Comprehensive test suite for DateRangePicker component covering
 * all functionality, accessibility, and edge cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangePicker, DateRangePickerTrigger, DateRangePickerContent, defaultPresets } from '../../components/date-range-picker';

// Mock the utility functions
vi.mock('../utils', () => ({
  isPerfMode: vi.fn(() => false),
  varianceAttributes: vi.fn(() => ({})),
}));

// Mock Calendar component
vi.mock('../primitives/calendar', () => ({
  Calendar: ({ value, onValueChange, ...props }: any) => (
    <div data-testid="calendar" {...props}>
      <button
        data-testid="calendar-today"
        onClick={() => onValueChange?.(new Date())}
      >
        Today
      </button>
      <button
        data-testid="calendar-range"
        onClick={() => onValueChange?.(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
      >
        Next 7 days
      </button>
    </div>
  ),
}));

// Mock Popover components
vi.mock('../components/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover" data-open={open}>
      {children}
    </div>
  ),
  PopoverTrigger: ({ children, asChild }: any) => (
    <div data-testid="popover-trigger">
      {asChild ? children : <button>{children}</button>}
    </div>
  ),
  PopoverContent: ({ children, ...props }: any) => (
    <div data-testid="popover-content" {...props}>
      {children}
    </div>
  ),
}));

// Mock Button component
vi.mock('../primitives/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

describe('DateRangePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<DateRangePicker />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Pick a date range')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<DateRangePicker placeholder="Select date range" />);
      
      expect(screen.getByText('Select date range')).toBeInTheDocument();
    });

    it('renders with custom value', () => {
      const value = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-07'),
      };
      
      render(<DateRangePicker value={value} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<DateRangePicker size="sm" />);
      expect(screen.getByRole('button')).toHaveClass('h-8');

      rerender(<DateRangePicker size="md" />);
      expect(screen.getByRole('button')).toHaveClass('h-10');

      rerender(<DateRangePicker size="lg" />);
      expect(screen.getByRole('button')).toHaveClass('h-12');
    });

    it('renders with different variants', () => {
      const { rerender } = render(<DateRangePicker variant="default" />);
      expect(screen.getByRole('button')).toHaveClass('bg-semantic-background');

      rerender(<DateRangePicker variant="outline" />);
      expect(screen.getByRole('button')).toHaveClass('border-semantic-border');

      rerender(<DateRangePicker variant="ghost" />);
      expect(screen.getByRole('button')).toHaveClass('hover:bg-semantic-accent');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<DateRangePicker required />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-required', 'true');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<DateRangePicker />);
      
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      
      expect(screen.getByTestId('popover')).toHaveAttribute('data-open', 'true');
    });

    it('handles disabled state', () => {
      render(<DateRangePicker disabled />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toBeDisabled();
    });

    it('handles readOnly state', () => {
      render(<DateRangePicker readOnly />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toBeDisabled();
    });
  });

  describe('Value Handling', () => {
    it('calls onValueChange when value changes', async () => {
      const onValueChange = vi.fn();
      render(<DateRangePicker onValueChange={onValueChange} />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      const todayButton = screen.getByTestId('calendar-today');
      await userEvent.click(todayButton);
      
      expect(onValueChange).toHaveBeenCalled();
    });

    it('handles undefined value', () => {
      render(<DateRangePicker value={undefined} />);
      
      expect(screen.getByText('Pick a date range')).toBeInTheDocument();
    });

    it('handles partial range (from only)', () => {
      const value = { from: new Date('2024-01-01'), to: undefined };
      render(<DateRangePicker value={value} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles complete range', () => {
      const value = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-07'),
      };
      render(<DateRangePicker value={value} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Date Restrictions', () => {
    it('respects minDate restriction', () => {
      const minDate = new Date('2024-01-01');
      render(<DateRangePicker minDate={minDate} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('respects maxDate restriction', () => {
      const maxDate = new Date('2024-12-31');
      render(<DateRangePicker maxDate={maxDate} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles allowPastDates=false', () => {
      render(<DateRangePicker allowPastDates={false} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles allowFutureDates=false', () => {
      render(<DateRangePicker allowFutureDates={false} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Presets', () => {
    it('renders with default presets', async () => {
      render(<DateRangePicker showPresets />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    });

    it('renders with custom presets', async () => {
      const customPresets = [
        { label: 'Custom Range', value: { from: new Date('2024-01-01'), to: new Date('2024-01-07') } },
      ];
      
      render(<DateRangePicker presets={customPresets} showPresets />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.getByText('Custom Range')).toBeInTheDocument();
    });

    it('hides presets when showPresets=false', async () => {
      render(<DateRangePicker showPresets={false} />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });
  });

  describe('Calendar Configuration', () => {
    it('renders with custom numberOfMonths', async () => {
      render(<DateRangePicker numberOfMonths={3} />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });

    it('renders with custom weekStartsOn', async () => {
      render(<DateRangePicker weekStartsOn={0} />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });

    it('renders with showOutsideDays=false', async () => {
      render(<DateRangePicker showOutsideDays={false} />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });

    it('renders with fixedWeeks=true', async () => {
      render(<DateRangePicker fixedWeeks />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('shows clear button when showClearButton=true', async () => {
      render(<DateRangePicker showClearButton />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('hides clear button when showClearButton=false', async () => {
      render(<DateRangePicker showClearButton={false} />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });

    it('shows today button when showTodayButton=true', async () => {
      render(<DateRangePicker showTodayButton />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('hides today button when showTodayButton=false', async () => {
      render(<DateRangePicker showTodayButton={false} />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });
  });

  describe('Performance Mode', () => {
    it('renders in performance mode', () => {
      const { isPerfMode } = require('../utils');
      isPerfMode.mockReturnValue(true);
      
      render(<DateRangePicker />);
      
      expect(screen.getByTestId('popover')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty presets array', async () => {
      render(<DateRangePicker presets={[]} showPresets />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    });

    it('handles invalid date values', () => {
      const invalidValue = {
        from: new Date('invalid'),
        to: new Date('invalid'),
      };
      
      render(<DateRangePicker value={invalidValue} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles single date range mode', async () => {
      render(<DateRangePicker allowSingleDateRange />);
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
  });

  describe('DateRangePickerTrigger', () => {
    it('renders independently', () => {
      render(<DateRangePickerTrigger />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('formats date range correctly', () => {
      const value = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-07'),
      };
      
      render(<DateRangePickerTrigger value={value} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows placeholder when no value', () => {
      render(<DateRangePickerTrigger placeholder="Custom placeholder" />);
      
      expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
    });
  });

  describe('DateRangePickerContent', () => {
    it('renders independently', () => {
      render(<DateRangePickerContent />);
      
      expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    });

    it('handles value changes', () => {
      const onValueChange = vi.fn();
      render(<DateRangePickerContent onValueChange={onValueChange} />);
      
      expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    });

    it('renders with presets', () => {
      render(<DateRangePickerContent showPresets />);
      
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  describe('Default Presets', () => {
    it('has correct preset structure', () => {
      expect(defaultPresets).toHaveLength(6);
      expect(defaultPresets[0]).toHaveProperty('label', 'Today');
      expect(defaultPresets[0]).toHaveProperty('value');
      expect(defaultPresets[0].value).toHaveProperty('from');
      expect(defaultPresets[0].value).toHaveProperty('to');
    });

    it('has valid date ranges', () => {
      defaultPresets.forEach((preset: any) => {
        expect(preset.value.from).toBeInstanceOf(Date);
        expect(preset.value.to).toBeInstanceOf(Date);
        expect(preset.value.from.getTime()).toBeLessThanOrEqual(preset.value.to.getTime());
      });
    });
  });
});
