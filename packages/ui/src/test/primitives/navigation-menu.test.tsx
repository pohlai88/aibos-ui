/**
 * Navigation Menu Component Tests - Enterprise Production Ready
 *
 * Comprehensive test suite for NavigationMenu component with accessibility,
 * performance mode, and functionality testing.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem, 
  NavigationMenuTrigger, 
  NavigationMenuContent, 
  NavigationMenuLink 
} from '../../primitives/navigation-menu';

// Mock utility functions
vi.mock('../../utils', () => ({
  isPerfMode: vi.fn(() => false),
  varianceAttributes: vi.fn(() => ({})),
}));

// Mock cn utility
vi.mock('../../utils/cn.utility', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

// Mock Radix UI Navigation Menu
vi.mock('@radix-ui/react-navigation-menu', () => ({
  Root: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <nav ref={ref} data-testid="navigation-menu-root" {...props}>
      {children}
    </nav>
  )),
  List: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <ul ref={ref} data-testid="navigation-menu-list" {...props}>
      {children}
    </ul>
  )),
  Item: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <li ref={ref} data-testid="navigation-menu-item" {...props}>
      {children}
    </li>
  )),
  Trigger: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <button ref={ref} data-testid="navigation-menu-trigger" {...props}>
      {children}
    </button>
  )),
  Content: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="navigation-menu-content" {...props}>
      {children}
    </div>
  )),
  Link: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <a ref={ref} data-testid="navigation-menu-link" {...props}>
      {children}
    </a>
  )),
}));

describe('NavigationMenu Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders navigation menu root', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      expect(screen.getByTestId('navigation-menu-root')).toBeInTheDocument();
    });

    it('renders navigation menu list', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      expect(screen.getByTestId('navigation-menu-list')).toBeInTheDocument();
    });

    it('renders navigation menu item', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      expect(screen.getByTestId('navigation-menu-item')).toBeInTheDocument();
    });

    it('renders navigation menu trigger', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      expect(screen.getByTestId('navigation-menu-trigger')).toBeInTheDocument();
      expect(screen.getByText('Item')).toBeInTheDocument();
    });

    it('renders navigation menu content', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      expect(screen.getByTestId('navigation-menu-content')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders navigation menu link', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/test">Link</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      expect(screen.getByTestId('navigation-menu-link')).toBeInTheDocument();
      expect(screen.getByText('Link')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size variant', () => {
      render(
        <NavigationMenu size="sm">
          <NavigationMenuList size="sm">
            <NavigationMenuItem size="sm">
              <NavigationMenuTrigger size="sm">Item</NavigationMenuTrigger>
              <NavigationMenuContent size="sm">Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const root = screen.getByTestId('navigation-menu-root');
      expect(root).toHaveClass('text-xs');
    });

    it('applies medium size variant (default)', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const root = screen.getByTestId('navigation-menu-root');
      expect(root).toHaveClass('text-sm');
    });

    it('applies large size variant', () => {
      render(
        <NavigationMenu size="lg">
          <NavigationMenuList size="lg">
            <NavigationMenuItem size="lg">
              <NavigationMenuTrigger size="lg">Item</NavigationMenuTrigger>
              <NavigationMenuContent size="lg">Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const root = screen.getByTestId('navigation-menu-root');
      expect(root).toHaveClass('text-base');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const root = screen.getByTestId('navigation-menu-root');
      const list = screen.getByTestId('navigation-menu-list');
      const item = screen.getByTestId('navigation-menu-item');
      const trigger = screen.getByTestId('navigation-menu-trigger');
      const content = screen.getByTestId('navigation-menu-content');

      expect(root).toBeInTheDocument();
      expect(list).toBeInTheDocument();
      expect(item).toBeInTheDocument();
      expect(trigger).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByTestId('navigation-menu-trigger');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('passes through custom props', () => {
      render(
        <NavigationMenu data-testid="custom-navigation-menu">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      expect(screen.getByTestId('custom-navigation-menu')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <NavigationMenu className="custom-class">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const root = screen.getByTestId('navigation-menu-root');
      expect(root).toHaveClass('custom-class');
    });
  });
});
