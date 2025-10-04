/**
 * Dropdown Menu Component Tests - Enterprise Production Ready
 *
 * Comprehensive test suite for DropdownMenu component with accessibility,
 * performance mode, and functionality testing.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../../primitives/dropdown-menu';

// Mock utility functions
vi.mock('../../utils', () => ({
  isPerfMode: vi.fn(() => false),
  varianceAttributes: vi.fn(() => ({})),
}));

// Mock cn utility
vi.mock('../../utils/cn.utility', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

describe('DropdownMenu Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders dropdown menu with trigger and content', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Open Menu')).toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { rerender } = render(
        <DropdownMenu size="sm">
          <DropdownMenuTrigger size="sm">Small</DropdownMenuTrigger>
          <DropdownMenuContent size="sm">
            <DropdownMenuItem size="sm">Small Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Small')).toBeInTheDocument();

      rerender(
        <DropdownMenu size="lg">
          <DropdownMenuTrigger size="lg">Large</DropdownMenuTrigger>
          <DropdownMenuContent size="lg">
            <DropdownMenuItem size="lg">Large Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Large')).toBeInTheDocument();
    });

    it('renders with different trigger variants', () => {
      const { rerender } = render(
        <DropdownMenuTrigger variant="default">Default</DropdownMenuTrigger>
      );
      expect(screen.getByText('Default')).toBeInTheDocument();

      rerender(
        <DropdownMenuTrigger variant="ghost">Ghost</DropdownMenuTrigger>
      );
      expect(screen.getByText('Ghost')).toBeInTheDocument();

      rerender(
        <DropdownMenuTrigger variant="outline">Outline</DropdownMenuTrigger>
      );
      expect(screen.getByText('Outline')).toBeInTheDocument();
    });
  });

  describe('Menu Items', () => {
    it('renders menu items with click handlers', () => {
      const handleSelect = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleSelect}>Clickable Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.click(trigger);

      const menuItem = screen.getByText('Clickable Item');
      fireEvent.click(menuItem);

      expect(handleSelect).toHaveBeenCalled();
    });

    it('handles disabled menu items', () => {
      const handleSelect = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled onSelect={handleSelect}>
              Disabled Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.click(trigger);

      const menuItem = screen.getByText('Disabled Item');
      fireEvent.click(menuItem);

      expect(handleSelect).not.toHaveBeenCalled();
    });

    it('renders checkbox items', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>Checkbox Item</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.click(trigger);

      expect(screen.getByText('Checkbox Item')).toBeInTheDocument();
    });
  });

  describe('Menu Structure', () => {
    it('renders menu with separator', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.click(trigger);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('renders menu with label', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Section Label</DropdownMenuLabel>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.click(trigger);

      expect(screen.getByText('Section Label')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('renders submenu structure', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSubTrigger>Submenu Trigger</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.click(trigger);

      expect(screen.getByText('Submenu Trigger')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.click(trigger);

      const menuItem = screen.getByText('Item 1');
      expect(menuItem).toHaveAttribute('role', 'menuitem');
    });

    it('supports keyboard navigation', () => {
      const handleSelect = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleSelect}>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.click(trigger);

      const menuItem = screen.getByText('Item 1');
      fireEvent.keyDown(menuItem, { key: 'Enter' });

      expect(handleSelect).toHaveBeenCalled();
    });

    it('handles disabled state accessibility', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.click(trigger);

      const menuItem = screen.getByText('Disabled Item');
      expect(menuItem).toHaveAttribute('data-disabled', 'true');
      expect(menuItem).toHaveAttribute('tabIndex', '-1');
    });
  });


  describe('Content Positioning', () => {
    it('renders with custom alignment and side', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" sideOffset={8} alignOffset={4}>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.click(trigger);

      // Content positioning attributes should be set
      const content = screen.getByText('Item 1').closest('[data-side]');
      expect(content).toHaveAttribute('data-side', 'right');
      expect(content).toHaveAttribute('data-align', 'start');
      expect(content).toHaveAttribute('data-side-offset', '8');
      expect(content).toHaveAttribute('data-align-offset', '4');
    });
  });

  describe('Event Handling', () => {
    it('handles click events properly', () => {
      const handleClick = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger onClick={handleClick}>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.click(trigger);

      expect(handleClick).toHaveBeenCalled();
    });

    it('handles keyboard events properly', () => {
      const handleKeyDown = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger onKeyDown={handleKeyDown}>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      fireEvent.keyDown(trigger, { key: 'Enter' });

      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(
        <DropdownMenu className="custom-dropdown">
          <DropdownMenuTrigger className="custom-trigger">Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-content">
            <DropdownMenuItem className="custom-item">Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('merges classes properly', () => {
      render(
        <DropdownMenuTrigger className="additional-class">
          Open Menu
        </DropdownMenuTrigger>
      );

      const trigger = screen.getByText('Open Menu');
      expect(trigger).toHaveClass('additional-class');
    });
  });
});
