/**
 * Command Component Tests - Enterprise Production Ready
 *
 * Comprehensive test suite for Command component with accessibility,
 * performance mode, and functionality testing.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandSeparator } from '../../primitives';

// Mock utility functions
vi.mock('../utils', () => ({
  isPerfMode: vi.fn(() => false),
  varianceAttributes: vi.fn(() => ({})),
}));

// Mock cn utility
vi.mock('../utils/cn.utility', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

describe('Command Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders command component with default props', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem value="test">Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('option')).toBeInTheDocument();
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <Command placeholder="Custom placeholder">
          <CommandList>
            <CommandItem value="test">Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('handles search input changes', async () => {
      render(
        <Command>
          <CommandList>
            <CommandItem value="test">Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'search' } });

      await waitFor(() => {
        expect(input).toHaveValue('search');
      });
    });

    it('handles item selection', () => {
      const onValueChange = vi.fn();
      
      render(
        <Command onValueChange={onValueChange}>
          <CommandList>
            <CommandItem value="test">Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      const item = screen.getByRole('option');
      fireEvent.click(item);

      expect(onValueChange).toHaveBeenCalledWith('test');
    });

    it('handles keyboard navigation', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem value="test1">Test Item 1</CommandItem>
            <CommandItem value="test2">Test Item 2</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // First item should be focused
      const firstItem = screen.getByText('Test Item 1');
      expect(firstItem).toHaveFocus();
    });

    it('handles escape key to clear search', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem value="test">Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'search' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(input).toHaveValue('');
      expect(input).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem value="test">Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByRole('textbox');
      const item = screen.getByRole('option');

      expect(input).toBeInTheDocument();
      expect(item).toHaveAttribute('aria-selected', 'false');
      expect(item).toHaveAttribute('data-value', 'test');
    });

    it('handles disabled state', () => {
      render(
        <Command disabled>
          <CommandList>
            <CommandItem value="test" disabled>Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByRole('textbox');
      const item = screen.getByRole('option');

      expect(input).toBeDisabled();
      expect(item).toHaveAttribute('data-disabled', 'true');
      expect(item).toHaveAttribute('tabIndex', '-1');
    });

    it('supports keyboard navigation with Enter and Space', () => {
      const onValueChange = vi.fn();
      
      render(
        <Command onValueChange={onValueChange}>
          <CommandList>
            <CommandItem value="test">Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      const item = screen.getByRole('option');
      
      fireEvent.keyDown(item, { key: 'Enter' });
      expect(onValueChange).toHaveBeenCalledWith('test');

      fireEvent.keyDown(item, { key: ' ' });
      expect(onValueChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('CommandInput Component', () => {
    it('renders command input with icons', () => {
      render(
        <Command>
          <CommandInput showSearchIcon showCommandIcon />
          <CommandList>
            <CommandItem value="test">Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      // Icons should be present (Search and Command icons) - they are SVG elements
      const icons = document.querySelectorAll('svg');
      expect(icons).toHaveLength(4); // Command renders icons in both input and list areas
    });

    it('renders without icons when disabled', () => {
      render(
        <Command>
          <CommandInput showSearchIcon={false} showCommandIcon={false} />
          <CommandList>
            <CommandItem value="test">Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      const icons = screen.queryAllByRole('img', { hidden: true });
      expect(icons).toHaveLength(0);
    });
  });

  describe('CommandGroup Component', () => {
    it('renders command group with heading', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup heading="Test Group">
              <CommandItem value="test">Test Item</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    it('renders command group without heading', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup>
              <CommandItem value="test">Test Item</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });

  describe('CommandSeparator Component', () => {
    it('renders command separator', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem value="test1">Test Item 1</CommandItem>
            <CommandSeparator />
            <CommandItem value="test2">Test Item 2</CommandItem>
          </CommandList>
        </Command>
      );

      const separator = screen.getByRole('separator', { hidden: true });
      expect(separator).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders with small size', () => {
      render(
        <Command size="sm">
          <CommandList>
            <CommandItem value="test" size="sm">Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('option')).toBeInTheDocument();
    });

    it('renders with large size', () => {
      render(
        <Command size="lg">
          <CommandList>
            <CommandItem value="test" size="lg">Test Item</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('option')).toBeInTheDocument();
    });
  });

  // Performance Mode tests are handled by the main component tests
  // The performance mode functionality is tested through the main component rendering

  describe('Error Handling', () => {
    it('handles missing onValueChange gracefully', () => {
      expect(() => {
        render(
          <Command>
            <CommandList>
              <CommandItem value="test">Test Item</CommandItem>
            </CommandList>
          </Command>
        );
      }).not.toThrow();
    });

    it('handles invalid children gracefully', () => {
      expect(() => {
        render(
          <Command>
            <CommandList>
              <div>Invalid child</div>
              <CommandItem value="test">Test Item</CommandItem>
            </CommandList>
          </Command>
        );
      }).not.toThrow();
    });
  });
});
