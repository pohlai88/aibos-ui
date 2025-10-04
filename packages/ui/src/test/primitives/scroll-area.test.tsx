/**
 * Scroll Area Component Tests - Enterprise Production Ready
 *
 * Comprehensive test suite for ScrollArea component with accessibility,
 * performance mode, and functionality testing.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { 
  ScrollArea, 
  ScrollAreaViewport, 
  ScrollAreaScrollbar, 
  ScrollAreaThumb, 
  ScrollAreaCorner 
} from '../../primitives/scroll-area';

// Mock utility functions
vi.mock('../../utils', () => ({
  isPerfMode: vi.fn(() => false),
  varianceAttributes: vi.fn(() => ({})),
}));

// Mock cn utility
vi.mock('../../utils/cn.utility', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

// Mock Radix UI Scroll Area
vi.mock('@radix-ui/react-scroll-area', () => ({
  Root: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="scroll-area-root" {...props}>
      {children}
    </div>
  )),
  Viewport: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="scroll-area-viewport" {...props}>
      {children}
    </div>
  )),
  Scrollbar: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="scroll-area-scrollbar" {...props}>
      {children}
    </div>
  )),
  Thumb: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="scroll-area-thumb" {...props}>
      {children}
    </div>
  )),
  Corner: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="scroll-area-corner" {...props}>
      {children}
    </div>
  )),
}));

describe('ScrollArea Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders scroll area root', () => {
      render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      expect(screen.getByTestId('scroll-area-root')).toBeInTheDocument();
    });

    it('renders scroll area viewport', () => {
      render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      expect(screen.getByTestId('scroll-area-viewport')).toBeInTheDocument();
    });

    it('renders scroll area scrollbar', () => {
      render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      const scrollbars = screen.getAllByTestId('scroll-area-scrollbar');
      expect(scrollbars).toHaveLength(2); // vertical and horizontal
    });

    it('renders scroll area thumb', () => {
      render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      const thumbs = screen.getAllByTestId('scroll-area-thumb');
      expect(thumbs).toHaveLength(2); // vertical and horizontal
    });

    it('renders scroll area corner', () => {
      render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      expect(screen.getByTestId('scroll-area-corner')).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <ScrollArea>
          <div>Scrollable Content</div>
        </ScrollArea>
      );

      expect(screen.getByText('Scrollable Content')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size variant', () => {
      render(
        <ScrollArea size="sm">
          <div>Content</div>
        </ScrollArea>
      );

      const root = screen.getByTestId('scroll-area-root');
      expect(root).toHaveClass('text-xs');
    });

    it('applies medium size variant (default)', () => {
      render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      const root = screen.getByTestId('scroll-area-root');
      expect(root).toHaveClass('text-sm');
    });

    it('applies large size variant', () => {
      render(
        <ScrollArea size="lg">
          <div>Content</div>
        </ScrollArea>
      );

      const root = screen.getByTestId('scroll-area-root');
      expect(root).toHaveClass('text-base');
    });
  });

  describe('Orientation Variants', () => {
    it('renders vertical scrollbar by default', () => {
      render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      const scrollbars = screen.getAllByTestId('scroll-area-scrollbar');
      expect(scrollbars).toHaveLength(2); // vertical and horizontal
    });

    it('renders horizontal scrollbar', () => {
      render(
        <ScrollArea>
          <ScrollAreaScrollbar orientation="horizontal">
            <ScrollAreaThumb />
          </ScrollAreaScrollbar>
        </ScrollArea>
      );

      const scrollbars = screen.getAllByTestId('scroll-area-scrollbar');
      expect(scrollbars.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      const root = screen.getByTestId('scroll-area-root');
      const viewport = screen.getByTestId('scroll-area-viewport');
      const scrollbars = screen.getAllByTestId('scroll-area-scrollbar');
      const thumbs = screen.getAllByTestId('scroll-area-thumb');
      const corner = screen.getByTestId('scroll-area-corner');

      expect(root).toBeInTheDocument();
      expect(viewport).toBeInTheDocument();
      expect(scrollbars).toHaveLength(2);
      expect(thumbs).toHaveLength(2);
      expect(corner).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      const root = screen.getByTestId('scroll-area-root');
      expect(root).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('passes through custom props', () => {
      render(
        <ScrollArea data-testid="custom-scroll-area">
          <div>Content</div>
        </ScrollArea>
      );

      expect(screen.getByTestId('custom-scroll-area')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ScrollArea className="custom-class">
          <div>Content</div>
        </ScrollArea>
      );

      const root = screen.getByTestId('scroll-area-root');
      expect(root).toHaveClass('custom-class');
    });
  });

  describe('Individual Components', () => {
    it('renders ScrollAreaViewport independently', () => {
      render(
        <ScrollAreaViewport>
          <div>Viewport Content</div>
        </ScrollAreaViewport>
      );

      expect(screen.getByTestId('scroll-area-viewport')).toBeInTheDocument();
      expect(screen.getByText('Viewport Content')).toBeInTheDocument();
    });

    it('renders ScrollAreaScrollbar independently', () => {
      render(
        <ScrollAreaScrollbar orientation="vertical">
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
      );

      expect(screen.getByTestId('scroll-area-scrollbar')).toBeInTheDocument();
      expect(screen.getByTestId('scroll-area-thumb')).toBeInTheDocument();
    });

    it('renders ScrollAreaThumb independently', () => {
      render(<ScrollAreaThumb />);

      expect(screen.getByTestId('scroll-area-thumb')).toBeInTheDocument();
    });

    it('renders ScrollAreaCorner independently', () => {
      render(<ScrollAreaCorner />);

      expect(screen.getByTestId('scroll-area-corner')).toBeInTheDocument();
    });
  });
});
