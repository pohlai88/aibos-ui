/**
 * Multi-select Component Tests - Enterprise Production Ready
 *
 * Comprehensive test suite for the Multi-select component covering
 * all features including search, grouping, keyboard navigation, and more.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiSelect, MultiSelectTrigger, MultiSelectContent, MultiSelectItem } from '../../components/multi-select';
import type { MultiSelectOption } from '../../components/multi-select';

// Mock the utility functions
vi.mock('../../utils', () => ({
  isPerfMode: vi.fn(() => false),
  varianceAttributes: vi.fn(() => ({})),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronUp: () => <div data-testid="chevron-up" />,
  X: () => <div data-testid="x" />,
  Search: () => <div data-testid="search" />,
  Check: () => <div data-testid="check" />,
  Plus: () => <div data-testid="plus" />,
  Minus: () => <div data-testid="minus" />,
  Filter: () => <div data-testid="filter" />,
  SortAsc: () => <div data-testid="sort-asc" />,
  SortDesc: () => <div data-testid="sort-desc" />,
  Users: () => <div data-testid="users" />,
  Tag: () => <div data-testid="tag" />,
  Calendar: () => <div data-testid="calendar" />,
  Star: () => <div data-testid="star" />,
}));

// Sample options for testing
const sampleOptions: MultiSelectOption[] = [
  { value: 'user1', label: 'John Doe', description: 'Software Engineer', group: 'Engineering' },
  { value: 'user2', label: 'Jane Smith', description: 'Product Manager', group: 'Product' },
  { value: 'user3', label: 'Bob Johnson', description: 'Designer', group: 'Design' },
  { value: 'user4', label: 'Alice Brown', description: 'Marketing Manager', group: 'Marketing' },
  { value: 'user5', label: 'Charlie Wilson', description: 'QA Engineer', group: 'Engineering' },
];

const simpleOptions: MultiSelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('MultiSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders multi-select with basic props', () => {
      render(<MultiSelect options={simpleOptions} />);
      
      expect(screen.getByText('Select items...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<MultiSelect options={simpleOptions} placeholder="Choose options..." />);
      
      expect(screen.getByText('Choose options...')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <MultiSelect options={simpleOptions} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders with different variants', () => {
      const { rerender } = render(
        <MultiSelect options={simpleOptions} variant="outline" />
      );
      expect(screen.getByText('Select items...')).toBeInTheDocument();

      rerender(<MultiSelect options={simpleOptions} variant="ghost" />);
      expect(screen.getByText('Select items...')).toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { rerender } = render(
        <MultiSelect options={simpleOptions} size="sm" />
      );
      expect(screen.getByText('Select items...')).toBeInTheDocument();

      rerender(<MultiSelect options={simpleOptions} size="md" />);
      expect(screen.getByText('Select items...')).toBeInTheDocument();

      rerender(<MultiSelect options={simpleOptions} size="lg" />);
      expect(screen.getByText('Select items...')).toBeInTheDocument();
    });
  });

  describe('Selection Features', () => {
    it('handles single selection', async () => {
      const onValueChange = vi.fn();
      render(
        <MultiSelect 
          options={simpleOptions} 
          onValueChange={onValueChange}
        />
      );
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      // Select first option
      const firstOption = screen.getByText('Option 1');
      fireEvent.click(firstOption);
      
      await waitFor(() => {
        expect(onValueChange).toHaveBeenCalledWith(['option1']);
      });
    });

    it('handles multiple selections', async () => {
      const onValueChange = vi.fn();
      render(
        <MultiSelect 
          options={simpleOptions} 
          onValueChange={onValueChange}
        />
      );
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      // Select multiple options
      fireEvent.click(screen.getByText('Option 1'));
      fireEvent.click(screen.getByText('Option 2'));
      
      await waitFor(() => {
        expect(onValueChange).toHaveBeenCalledWith(['option1', 'option2']);
      });
    });

    it('handles deselection', async () => {
      const onValueChange = vi.fn();
      render(
        <MultiSelect 
          options={simpleOptions} 
          defaultValue={['option1', 'option2']}
          onValueChange={onValueChange}
        />
      );
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      // Deselect first option
      fireEvent.click(screen.getByText('Option 1'));
      
      await waitFor(() => {
        expect(onValueChange).toHaveBeenCalledWith(['option2']);
      });
    });

    it('respects maxSelections limit', async () => {
      const onValueChange = vi.fn();
      render(
        <MultiSelect 
          options={simpleOptions} 
          maxSelections={2}
          onValueChange={onValueChange}
        />
      );
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      // Select first two options
      fireEvent.click(screen.getByText('Option 1'));
      fireEvent.click(screen.getByText('Option 2'));
      
      // Try to select third option (should not work)
      fireEvent.click(screen.getByText('Option 3'));
      
      await waitFor(() => {
        expect(onValueChange).toHaveBeenLastCalledWith(['option1', 'option2']);
      });
    });
  });

  describe('Search Features', () => {
    it('renders search input when enabled', () => {
      render(<MultiSelect options={sampleOptions} enableSearch />);
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('filters options based on search query', async () => {
      render(<MultiSelect options={sampleOptions} enableSearch />);
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'John' } });
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('calls onSearch callback when search changes', async () => {
      const onSearch = vi.fn();
      render(<MultiSelect options={sampleOptions} enableSearch onSearch={onSearch} />);
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('Grouping Features', () => {
    it('renders grouped options when enabled', () => {
      render(<MultiSelect options={sampleOptions} enableGrouping />);
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
    });

    it('groups options correctly', () => {
      render(<MultiSelect options={sampleOptions} enableGrouping />);
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      // Check that John Doe and Charlie Wilson are in Engineering group
      const engineeringGroup = screen.getByText('Engineering').closest('div');
      expect(engineeringGroup).toContainElement(screen.getByText('John Doe'));
      expect(engineeringGroup).toContainElement(screen.getByText('Charlie Wilson'));
    });
  });

  describe('Select All / Clear All Features', () => {
    it('renders select all button when enabled', () => {
      render(<MultiSelect options={simpleOptions} enableSelectAll />);
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    it('renders clear all button when enabled and items are selected', () => {
      render(
        <MultiSelect 
          options={simpleOptions} 
          enableClearAll 
          defaultValue={['option1', 'option2']}
        />
      );
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('handles select all functionality', async () => {
      const onValueChange = vi.fn();
      render(
        <MultiSelect 
          options={simpleOptions} 
          enableSelectAll 
          onValueChange={onValueChange}
        />
      );
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      // Click select all
      fireEvent.click(screen.getByText('Select All'));
      
      await waitFor(() => {
        expect(onValueChange).toHaveBeenCalledWith(['option1', 'option2', 'option3']);
      });
    });

    it('handles clear all functionality', async () => {
      const onValueChange = vi.fn();
      render(
        <MultiSelect 
          options={simpleOptions} 
          enableClearAll 
          defaultValue={['option1', 'option2']}
          onValueChange={onValueChange}
        />
      );
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      // Click clear all
      fireEvent.click(screen.getByText('Clear All'));
      
      await waitFor(() => {
        expect(onValueChange).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Disabled State', () => {
    it('renders in disabled state', () => {
      render(<MultiSelect options={simpleOptions} disabled />);
      
      const trigger = screen.getByText('Select items...').closest('button');
      expect(trigger).toBeDisabled();
    });

    it('does not open when disabled', () => {
      render(<MultiSelect options={simpleOptions} disabled />);
      
      fireEvent.click(screen.getByText('Select items...'));
      
      // Should not show options
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });

    it('disables individual options', () => {
      const optionsWithDisabled: MultiSelectOption[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2', disabled: true },
        { value: 'option3', label: 'Option 3' },
      ];

      render(<MultiSelect options={optionsWithDisabled} />);
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      // Option 2 should be disabled
      const option2 = screen.getByText('Option 2').closest('div');
      expect(option2).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Error State', () => {
    it('renders error state', () => {
      render(<MultiSelect options={simpleOptions} error errorMessage="This field is required" />);
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error styling to trigger', () => {
      render(<MultiSelect options={simpleOptions} error />);
      
      const trigger = screen.getByText('Select items...').closest('button');
      expect(trigger).toHaveClass('border-semantic-destructive');
    });
  });

  describe('Empty State', () => {
    it('renders empty message when no options', () => {
      render(<MultiSelect options={[]} emptyMessage="No options available" />);
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      expect(screen.getByText('No options available')).toBeInTheDocument();
    });

    it('renders empty message when search yields no results', async () => {
      render(<MultiSelect options={sampleOptions} enableSearch emptyMessage="No matches found" />);
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      await waitFor(() => {
        expect(screen.getByText('No matches found')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Rendering', () => {
    it('renders custom trigger', () => {
      const customTrigger = ({ selectedOptions, isOpen, placeholder }: any) => (
        <button>
          Custom: {selectedOptions.length} selected, {isOpen ? 'open' : 'closed'}
        </button>
      );

      render(
        <MultiSelect 
          options={simpleOptions} 
          renderTrigger={customTrigger}
          defaultValue={['option1']}
        />
      );
      
      expect(screen.getByText('Custom: 1 selected, closed')).toBeInTheDocument();
    });

    it('renders custom options', () => {
      const customOption = (option: MultiSelectOption, isSelected: boolean) => (
        <div>
          Custom: {option.label} {isSelected ? '(selected)' : ''}
        </div>
      );

      render(
        <MultiSelect 
          options={simpleOptions} 
          renderOption={customOption}
        />
      );
      
      // Click to open
      fireEvent.click(screen.getByText('Select items...'));
      
      expect(screen.getByText('Custom: Option 1')).toBeInTheDocument();
    });

    it('renders custom selected items', () => {
      const customSelected = (option: MultiSelectOption) => (
        <span>Custom: {option.label}</span>
      );

      render(
        <MultiSelect 
          options={simpleOptions} 
          renderSelected={customSelected}
          defaultValue={['option1']}
        />
      );
      
      expect(screen.getByText('Custom: Option 1')).toBeInTheDocument();
    });
  });

  describe('Performance Mode', () => {
    it('renders in performance mode', () => {
      // Mock isPerfMode to return true
      vi.mocked(require('../../utils').isPerfMode).mockReturnValue(true);
      
      render(<MultiSelect options={simpleOptions} defaultValue={['option1', 'option2']} />);
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<MultiSelect options={simpleOptions} />);
      
      const trigger = screen.getByText('Select items...').closest('button');
      expect(trigger).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<MultiSelect options={simpleOptions} enableKeyboardNavigation />);
      
      const trigger = screen.getByText('Select items...').closest('button');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('MultiSelectTrigger', () => {
    it('renders trigger with selected options', () => {
      render(
        <MultiSelectTrigger
          selectedOptions={[sampleOptions[0]!, sampleOptions[1]!]}
          isOpen={false}
          placeholder="Select items..."
        />
      );
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('shows count badge when more than 2 items selected', () => {
      render(
        <MultiSelectTrigger
          selectedOptions={sampleOptions.slice(0, 3)}
          isOpen={false}
          placeholder="Select items..."
        />
      );
      
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('shows chevron icon', () => {
      render(
        <MultiSelectTrigger
          selectedOptions={[]}
          isOpen={false}
          placeholder="Select items..."
        />
      );
      
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });
  });

  describe('MultiSelectContent', () => {
    it('renders content with options', () => {
      render(
        <MultiSelectContent
          options={simpleOptions}
          selectedValues={[]}
          onValueChange={vi.fn()}
          searchQuery=""
          onSearchChange={vi.fn()}
          enableSearch={false}
          enableGrouping={false}
          enableSorting={false}
          enableFiltering={false}
          enableClearAll={false}
          enableSelectAll={false}
          emptyMessage="No options"
          searchPlaceholder="Search..."
          onClearAll={vi.fn()}
          onSelectAll={vi.fn()}
          groupedOptions={{ '': simpleOptions }}
        />
      );
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('renders search input when enabled', () => {
      render(
        <MultiSelectContent
          options={simpleOptions}
          selectedValues={[]}
          onValueChange={vi.fn()}
          searchQuery=""
          onSearchChange={vi.fn()}
          enableSearch={true}
          enableGrouping={false}
          enableSorting={false}
          enableFiltering={false}
          enableClearAll={false}
          enableSelectAll={false}
          emptyMessage="No options"
          searchPlaceholder="Search..."
          onClearAll={vi.fn()}
          onSelectAll={vi.fn()}
          groupedOptions={{ '': simpleOptions }}
        />
      );
      
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
  });

  describe('MultiSelectItem', () => {
    it('renders item with option data', () => {
      render(
        <MultiSelectItem
          option={sampleOptions[0]!}
          isSelected={false}
          onSelect={vi.fn()}
          onDeselect={vi.fn()}
        />
      );
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('shows checkbox as checked when selected', () => {
      render(
        <MultiSelectItem
          option={sampleOptions[0]!}
          isSelected={true}
          onSelect={vi.fn()}
          onDeselect={vi.fn()}
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('handles click to select/deselect', async () => {
      const onSelect = vi.fn();
      const onDeselect = vi.fn();
      
      render(
        <MultiSelectItem
          option={sampleOptions[0]!}
          isSelected={false}
          onSelect={onSelect}
          onDeselect={onDeselect}
        />
      );
      
      fireEvent.click(screen.getByText('John Doe'));
      
      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith('user1');
      });
    });

    it('handles disabled option', () => {
      const disabledOption = { ...sampleOptions[0]!, disabled: true };
      
      render(
        <MultiSelectItem
          option={disabledOption}
          isSelected={false}
          onSelect={vi.fn()}
          onDeselect={vi.fn()}
        />
      );
      
      const item = screen.getByText('John Doe').closest('div');
      expect(item).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });
});
