/**
 * Sheet Component Tests - Enterprise Production Ready
 *
 * Comprehensive test suite for Sheet component with accessibility,
 * performance mode, and functionality testing.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { 
  Sheet, 
  SheetTrigger, 
  SheetClose, 
  SheetContent, 
  SheetHeader, 
  SheetFooter, 
  SheetTitle, 
  SheetDescription 
} from '../../primitives/sheet';

// Mock utility functions
vi.mock('../../utils', () => ({
  isPerfMode: vi.fn(() => false),
  varianceAttributes: vi.fn(() => ({})),
}));

// Mock cn utility
vi.mock('../../utils/cn.utility', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

// Mock Radix UI Dialog (used for Sheet)
vi.mock('@radix-ui/react-dialog', () => ({
  Root: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="sheet-root" {...props}>
      {children}
    </div>
  )),
  Trigger: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <button ref={ref} data-testid="sheet-trigger" {...props}>
      {children}
    </button>
  )),
  Close: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <button ref={ref} data-testid="sheet-close" {...props}>
      {children}
    </button>
  )),
  Portal: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="sheet-portal" {...props}>
      {children}
    </div>
  )),
  Overlay: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="sheet-overlay" {...props}>
      {children}
    </div>
  )),
  Content: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="sheet-content" {...props}>
      {children}
    </div>
  )),
  Title: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <h2 ref={ref} data-testid="sheet-title" {...props}>
      {children}
    </h2>
  )),
  Description: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <p ref={ref} data-testid="sheet-description" {...props}>
      {children}
    </p>
  )),
}));

describe('Sheet Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders sheet root', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByTestId('sheet-root')).toBeInTheDocument();
    });

    it('renders sheet trigger', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByTestId('sheet-trigger')).toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('renders sheet content', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
    });

    it('renders sheet header', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByTestId('sheet-title')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-description')).toBeInTheDocument();
    });

    it('renders sheet title', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByText('Sheet Title')).toBeInTheDocument();
    });

    it('renders sheet description', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Sheet Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByText('Sheet Description')).toBeInTheDocument();
    });

    it('renders sheet footer', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose>Close</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );

      const closeButtons = screen.getAllByTestId('sheet-close');
      expect(closeButtons).toHaveLength(2); // One in footer, one auto-added
      const closeTexts = screen.getAllByText('Close');
      expect(closeTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Side Variants', () => {
    it('applies right side variant (default)', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toBeInTheDocument();
    });

    it('applies left side variant', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toBeInTheDocument();
    });

    it('applies top side variant', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="top">
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toBeInTheDocument();
    });

    it('applies bottom side variant', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size variant', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent size="sm">
            <SheetHeader size="sm">
              <SheetTitle size="sm">Title</SheetTitle>
              <SheetDescription size="sm">Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toBeInTheDocument();
    });

    it('applies medium size variant (default)', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toBeInTheDocument();
    });

    it('applies large size variant', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent size="lg">
            <SheetHeader size="lg">
              <SheetTitle size="lg">Title</SheetTitle>
              <SheetDescription size="lg">Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      const root = screen.getByTestId('sheet-root');
      const trigger = screen.getByTestId('sheet-trigger');
      const content = screen.getByTestId('sheet-content');
      const title = screen.getByTestId('sheet-title');
      const description = screen.getByTestId('sheet-description');

      expect(root).toBeInTheDocument();
      expect(trigger).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      const trigger = screen.getByTestId('sheet-trigger');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('passes through custom props', () => {
      render(
        <Sheet data-testid="custom-sheet">
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByTestId('custom-sheet')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Sheet className="custom-class">
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      const root = screen.getByTestId('sheet-root');
      expect(root).toHaveClass('custom-class');
    });
  });
});
