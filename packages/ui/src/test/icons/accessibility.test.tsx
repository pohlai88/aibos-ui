/**
 * Icon Accessibility Tests - Enterprise Production Ready
 *
 * Comprehensive accessibility testing for the icon system.
 * Ensures WCAG 2.2 AAA compliance and proper screen reader support.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CloseIcon, ChevronDownIcon } from '../../icons';
import { IconProvider } from '../../icons/_base';

// Mock console.warn to test accessibility warnings
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Icon Accessibility System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Decorative Icons', () => {
    it('hides decorative icons from screen readers', () => {
      render(<CloseIcon decorative data-testid="decorative-icon" />);
      
      const icon = screen.getByTestId('decorative-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).not.toHaveAttribute('role');
      expect(icon).not.toHaveAttribute('aria-labelledby');
    });

    it('does not render title element for decorative icons', () => {
      render(<CloseIcon decorative title="Should not appear" />);
      
      const titleElement = document.querySelector('title');
      expect(titleElement).toBeNull();
    });

    it('does not render desc element for decorative icons', () => {
      render(<CloseIcon decorative desc="Should not appear" />);
      
      const descElement = document.querySelector('desc');
      expect(descElement).toBeNull();
    });
  });

  describe('Meaningful Icons', () => {
    it('requires title or aria-label when not decorative', () => {
      render(<CloseIcon decorative={false} />);
      
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Non-decorative icons require a title or aria-label for accessibility')
      );
    });

    it('renders with explicit title', () => {
      render(<CloseIcon decorative={false} title="Close dialog" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();
      expect(icon).not.toHaveAttribute('aria-hidden');
      expect(icon).toHaveAttribute('role', 'img');
      
      const titleElement = document.querySelector('title');
      expect(titleElement).toHaveTextContent('Close dialog');
    });

    it('auto-promotes aria-label to title when no explicit title', () => {
      render(<CloseIcon decorative={false} aria-label="Close dialog" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-labelledby');
      
      const titleElement = document.querySelector('title');
      expect(titleElement).toHaveTextContent('Close dialog');
    });

    it('renders with description when provided', () => {
      render(
        <CloseIcon 
          decorative={false} 
          title="Close dialog" 
          desc="Click to close the current dialog window" 
        />
      );
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('aria-describedby');
      
      const descElement = document.querySelector('desc');
      expect(descElement).toHaveTextContent('Click to close the current dialog window');
    });

    it('generates unique IDs for title and description', () => {
      const { unmount } = render(
        <CloseIcon decorative={false} title="First" desc="First desc" />
      );
      
      const firstTitleId = document.querySelector('title')?.id;
      const firstDescId = document.querySelector('desc')?.id;
      
      unmount();
      
      render(<CloseIcon decorative={false} title="Second" desc="Second desc" />);
      
      const secondTitleId = document.querySelector('title')?.id;
      const secondDescId = document.querySelector('desc')?.id;
      
      expect(firstTitleId).not.toBe(secondTitleId);
      expect(firstDescId).not.toBe(secondDescId);
    });
  });

  describe('RTL Support', () => {
    it('applies RTL flip attribute for directional icons', () => {
      render(<ChevronDownIcon rtlFlip data-testid="rtl-icon" />);
      
      const icon = screen.getByTestId('rtl-icon');
      expect(icon).toHaveAttribute('data-rtl-flip', 'true');
    });

    it('does not apply RTL flip attribute for non-directional icons', () => {
      render(<CloseIcon data-testid="non-rtl-icon" />);
      
      const icon = screen.getByTestId('non-rtl-icon');
      expect(icon).not.toHaveAttribute('data-rtl-flip');
    });

    it('applies RTL flip attribute when explicitly set', () => {
      render(<CloseIcon rtlFlip data-testid="explicit-rtl-icon" />);
      
      const icon = screen.getByTestId('explicit-rtl-icon');
      expect(icon).toHaveAttribute('data-rtl-flip', 'true');
    });
  });

  describe('IconProvider Context', () => {
    it('applies default size from context', () => {
      render(
        <IconProvider size="sm">
          <CloseIcon data-testid="context-icon" />
        </IconProvider>
      );
      
      const icon = screen.getByTestId('context-icon');
      expect(icon).toHaveClass('h-4', 'w-4');
    });

    it('applies default variant from context', () => {
      render(
        <IconProvider variant="primary">
          <CloseIcon data-testid="context-icon" />
        </IconProvider>
      );
      
      const icon = screen.getByTestId('context-icon');
      expect(icon).toHaveClass('text-semantic-primary');
    });

    it('applies default strokeWidth from context', () => {
      render(
        <IconProvider strokeWidth={1.5}>
          <CloseIcon data-testid="context-icon" />
        </IconProvider>
      );
      
      const icon = screen.getByTestId('context-icon');
      expect(icon).toHaveAttribute('stroke-width', '1.5');
    });

    it('applies default pixelPerfect from context', () => {
      render(
        <IconProvider pixelPerfect>
          <CloseIcon data-testid="context-icon" />
        </IconProvider>
      );
      
      const icon = screen.getByTestId('context-icon');
      expect(icon).toHaveAttribute('shape-rendering', 'crispEdges');
      expect(icon).toHaveAttribute('vector-effect', 'non-scaling-stroke');
    });

    it('allows prop overrides to take precedence over context', () => {
      render(
        <IconProvider size="sm" variant="primary">
          <CloseIcon size="lg" variant="secondary" data-testid="override-icon" />
        </IconProvider>
      );
      
      const icon = screen.getByTestId('override-icon');
      expect(icon).toHaveClass('h-6', 'w-6'); // lg size
      expect(icon).toHaveClass('text-semantic-secondary'); // secondary variant
    });

    it('works without context provider', () => {
      render(<CloseIcon data-testid="no-context-icon" />);
      
      const icon = screen.getByTestId('no-context-icon');
      expect(icon).toHaveClass('h-5', 'w-5'); // default md size
      expect(icon).toHaveClass('text-semantic-foreground'); // default variant
    });
  });

  describe('Focus Management', () => {
    it('sets focusable to false by default', () => {
      render(<CloseIcon data-testid="focus-icon" />);
      
      const icon = screen.getByTestId('focus-icon');
      expect(icon).toHaveAttribute('focusable', 'false');
    });

    it('maintains focusable attribute when overridden', () => {
      render(<CloseIcon focusable="true" data-testid="focusable-icon" />);
      
      const icon = screen.getByTestId('focusable-icon');
      expect(icon).toHaveAttribute('focusable', 'true');
    });
  });

  describe('Data Attributes', () => {
    it('includes stable data-icon attribute', () => {
      render(<CloseIcon data-testid="data-icon" />);
      
      const icon = screen.getByTestId('data-icon');
      expect(icon).toHaveAttribute('data-icon', 'CloseIcon');
    });

    it('includes custom data attributes', () => {
      render(<CloseIcon data-testid="custom-data" data-custom="value" />);
      
      const icon = screen.getByTestId('custom-data');
      expect(icon).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Size Variants', () => {
    it('applies correct size classes for each variant', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
      
      sizes.forEach((size) => {
        const { unmount } = render(<CloseIcon size={size} data-testid={`size-${size}`} />);
        
        const icon = screen.getByTestId(`size-${size}`);
        // eslint-disable-next-line security/detect-object-injection
        const expectedClasses = {
          xs: ['h-3', 'w-3'],
          sm: ['h-4', 'w-4'],
          md: ['h-5', 'w-5'],
          lg: ['h-6', 'w-6'],
          xl: ['h-8', 'w-8'],
        }[size];
        
        expectedClasses.forEach(className => {
          expect(icon).toHaveClass(className);
        });
        
        unmount();
      });
    });

    it('applies correct pixel dimensions for numeric sizes', () => {
      render(<CloseIcon size={32 as any} data-testid="numeric-size" />);
      
      const icon = screen.getByTestId('numeric-size');
      expect(icon).toHaveAttribute('width', '32');
      expect(icon).toHaveAttribute('height', '32');
    });
  });

  describe('Variant Styles', () => {
    it('applies correct variant classes', () => {
      const variants = [
        'default',
        'muted', 
        'primary',
        'secondary',
        'destructive',
        'success',
        'warning',
        'info'
      ] as const;
      
      variants.forEach((variant) => {
        const { unmount } = render(<CloseIcon variant={variant} data-testid={`variant-${variant}`} />);
        
        const icon = screen.getByTestId(`variant-${variant}`);
        // eslint-disable-next-line security/detect-object-injection
        const expectedClasses = {
          default: 'text-semantic-foreground',
          muted: 'text-semantic-muted-foreground',
          primary: 'text-semantic-primary',
          secondary: 'text-semantic-secondary',
          destructive: 'text-semantic-destructive',
          success: 'text-semantic-success',
          warning: 'text-semantic-warning',
          info: 'text-semantic-info',
        }[variant];
        
        expect(icon).toHaveClass(expectedClasses);
        
        unmount();
      });
    });
  });

  describe('Pixel Perfect Rendering', () => {
    it('applies pixel perfect attributes when enabled', () => {
      render(<CloseIcon pixelPerfect data-testid="pixel-perfect" />);
      
      const icon = screen.getByTestId('pixel-perfect');
      expect(icon).toHaveAttribute('shape-rendering', 'crispEdges');
      expect(icon).toHaveAttribute('vector-effect', 'non-scaling-stroke');
    });

    it('does not apply pixel perfect attributes when disabled', () => {
      render(<CloseIcon pixelPerfect={false} data-testid="not-pixel-perfect" />);
      
      const icon = screen.getByTestId('not-pixel-perfect');
      expect(icon).not.toHaveAttribute('shape-rendering');
      expect(icon).not.toHaveAttribute('vector-effect');
    });
  });

  describe('Error Boundaries', () => {
    it('handles invalid props gracefully', () => {
      expect(() => {
        render(<CloseIcon size={"invalid" as any} />);
      }).not.toThrow();
    });

    it('handles missing required props gracefully', () => {
      expect(() => {
        render(<CloseIcon />);
      }).not.toThrow();
    });
  });
});
