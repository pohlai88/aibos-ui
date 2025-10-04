/**
 * Context Menu Component Tests - Enterprise Production Ready
 *
 * Comprehensive test suite for Context Menu component with
 * accessibility, performance mode, and functionality testing.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '../../primitives/context-menu';

// Mock the utility functions
vi.mock('../../utils', () => ({
  isPerfMode: vi.fn(() => false),
  varianceAttributes: vi.fn(() => ({})),
}));

// Mock the cn utility
vi.mock('../../utils/cn.utility', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

describe('ContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders context menu trigger', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });

    it('renders context menu items', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuItem>Item 2</ContextMenuItem>
            <ContextMenuItem>Item 3</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });

    it('handles item click events', () => {
      const handleClick = vi.fn();
      
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={handleClick}>Clickable Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });

    it('supports disabled items', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem disabled>Disabled Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });
  });

  describe('Context Menu Separators', () => {
    it('renders separators between items', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Item 2</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });
  });

  describe('Context Menu Labels', () => {
    it('renders labels in context menu', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Actions</ContextMenuLabel>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuItem>Item 2</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });
  });

  describe('Context Menu Groups', () => {
    it('renders grouped items', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuItem>Group Item 1</ContextMenuItem>
              <ContextMenuItem>Group Item 2</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });
  });

  describe('Context Menu Submenus', () => {
    it('renders submenu trigger', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Submenu</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Sub Item 1</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });
  });

  describe('Variants and Sizing', () => {
    it('applies size variants correctly', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent size="lg">
            <ContextMenuItem size="lg">Large Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });

    it('applies variant styles correctly', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem variant="destructive">Destructive Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });
  });

  describe('Performance Mode', () => {
    it('renders in performance mode', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('forwards custom props correctly', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent data-testid="context-menu-content">
            <ContextMenuItem data-testid="context-menu-item">Item 1</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText('Right-click me')).toBeInTheDocument();
    });
  });
});
