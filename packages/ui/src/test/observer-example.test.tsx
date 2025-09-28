/**
 * Observer Testing Examples
 * 
 * Demonstrates how to use the deterministic observer helpers
 * for testing components that rely on IntersectionObserver,
 * ResizeObserver, and media queries.
 */

import React, { useEffect, useState, useRef } from 'react';
import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createIntersectionEntry,
  createResizeEntry,
  triggerAllIntersections,
  triggerAllResizes,
  triggerIntersectionsForTargets,
  simulateViewportChange,
} from './observer-helpers';

// Example components that use observers
const IntersectionComponent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries[0]?.isIntersecting ?? false);
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-testid="intersection-target">
      {isVisible ? 'Visible' : 'Hidden'}
    </div>
  );
};

const ResizeComponent: React.FC = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-testid="resize-target">
      {dimensions.width} x {dimensions.height}
    </div>
  );
};

const MediaQueryComponent: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return (
    <div data-testid="media-target">
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
};

describe('Observer Testing Examples', () => {
  beforeEach(() => {
    cleanup();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('IntersectionObserver Testing', () => {
    it('should detect when element becomes visible', () => {
      render(<IntersectionComponent />);
      
      const target = screen.getByTestId('intersection-target');
      expect(target).toHaveTextContent('Hidden');

      // Create intersection entry for visibility
      const entry = createIntersectionEntry(target, true, 0.8);
      
      // Trigger all intersection observers
      act(() => {
        triggerAllIntersections([entry]);
      });

      expect(target).toHaveTextContent('Visible');
    });

    it('should detect when element becomes hidden', () => {
      render(<IntersectionComponent />);
      
      const target = screen.getByTestId('intersection-target');
      
      // First make it visible
      const visibleEntry = createIntersectionEntry(target, true, 0.8);
      act(() => {
        triggerAllIntersections([visibleEntry]);
      });
      expect(target).toHaveTextContent('Visible');

      // Then make it hidden
      const hiddenEntry = createIntersectionEntry(target, false, 0.2);
      act(() => {
        triggerAllIntersections([hiddenEntry]);
      });
      expect(target).toHaveTextContent('Hidden');
    });

    it('should handle custom intersection ratios', () => {
      render(<IntersectionComponent />);
      
      const target = screen.getByTestId('intersection-target');
      
      // Test with custom intersection ratio below threshold
      const entry = createIntersectionEntry(target, false, 0.3);
      
      act(() => {
        triggerAllIntersections([entry]);
      });
      expect(target).toHaveTextContent('Hidden'); // Below threshold of 0.5
    });
  });

  describe('ResizeObserver Testing', () => {
    it('should detect element resize', () => {
      render(<ResizeComponent />);
      
      const target = screen.getByTestId('resize-target');
      expect(target).toHaveTextContent('0 x 0');

      // Create resize entry
      const entry = createResizeEntry(target, 300, 200);
      
      // Trigger all resize observers
      act(() => {
        triggerAllResizes([entry]);
      });

      expect(target).toHaveTextContent('300 x 200');
    });

    it('should handle multiple resize events', () => {
      render(<ResizeComponent />);
      
      const target = screen.getByTestId('resize-target');
      
      // First resize
      const entry1 = createResizeEntry(target, 200, 150);
      act(() => {
        triggerAllResizes([entry1]);
      });
      expect(target).toHaveTextContent('200 x 150');

      // Second resize
      const entry2 = createResizeEntry(target, 400, 300);
      act(() => {
        triggerAllResizes([entry2]);
      });
      expect(target).toHaveTextContent('400 x 300');
    });
  });

  describe('Media Query Testing', () => {
    let mockMatchMedia: any;

    beforeEach(() => {
      // Mock matchMedia with proper state management
      mockMatchMedia = vi.fn().mockImplementation((query) => {
        const listeners = new Set<(e: MediaQueryListEvent) => void>();
        let matches = false;

        return {
          matches,
          media: query,
          onchange: null,
          addListener: vi.fn(), // deprecated
          removeListener: vi.fn(), // deprecated
          addEventListener: vi.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
            if (type === 'change') listeners.add(listener);
          }),
          removeEventListener: vi.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
            if (type === 'change') listeners.delete(listener);
          }),
          dispatchEvent: vi.fn((e: Event) => {
            const event = e as MediaQueryListEvent;
            listeners.forEach(listener => listener(event));
            return true;
          }),
          // Helper to update matches and trigger change
          _updateMatches: (newMatches: boolean) => {
            if (matches !== newMatches) {
              matches = newMatches;
              const event = new Event('change') as MediaQueryListEvent;
              Object.defineProperty(event, 'matches', { value: newMatches });
              listeners.forEach(listener => listener(event));
            }
          }
        };
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });
    });

    it('should respond to mobile breakpoint changes', () => {
      render(<MediaQueryComponent />);
      
      const target = screen.getByTestId('media-target');
      
      // Initially desktop (default)
      expect(target).toHaveTextContent('Desktop View');

      // Get the mock MQL instance and update it
      const mockMql = mockMatchMedia.mock.results[0].value;
      
      // Simulate mobile breakpoint
      act(() => {
        mockMql._updateMatches(true);
      });
      expect(target).toHaveTextContent('Mobile View');

      // Simulate desktop breakpoint
      act(() => {
        mockMql._updateMatches(false);
      });
      expect(target).toHaveTextContent('Desktop View');
    });

    it('should handle viewport size changes', () => {
      render(<MediaQueryComponent />);
      
      const target = screen.getByTestId('media-target');
      
      // Get the mock MQL instance
      const mockMql = mockMatchMedia.mock.results[0].value;
      
      // Simulate mobile viewport
      act(() => {
        simulateViewportChange(375, 667);
        mockMql._updateMatches(true);
      });
      expect(target).toHaveTextContent('Mobile View');

      // Simulate desktop viewport
      act(() => {
        simulateViewportChange(1024, 768);
        mockMql._updateMatches(false);
      });
      expect(target).toHaveTextContent('Desktop View');
    });
  });

  describe('Complex Observer Scenarios', () => {
    it('should handle multiple observers on same element', () => {
      const MultiObserverComponent: React.FC = () => {
        const [intersectionState, setIntersectionState] = useState(false);
        const [resizeState, setResizeState] = useState({ width: 0, height: 0 });
        const ref = useRef<HTMLDivElement>(null);

        useEffect(() => {
          const io = new IntersectionObserver((entries) => {
            setIntersectionState(entries[0]?.isIntersecting ?? false);
          });

          const ro = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
              setResizeState({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
              });
            }
          });

          if (ref.current) {
            io.observe(ref.current);
            ro.observe(ref.current);
          }

          return () => {
            io.disconnect();
            ro.disconnect();
          };
        }, []);

        return (
          <div ref={ref} data-testid="multi-target">
            {intersectionState ? 'Visible' : 'Hidden'} - {resizeState.width}x{resizeState.height}
          </div>
        );
      };

      render(<MultiObserverComponent />);
      
      const target = screen.getByTestId('multi-target');
      expect(target).toHaveTextContent('Hidden - 0x0');

      // Trigger intersection
      const intersectionEntry = createIntersectionEntry(target, true, 1.0);
      act(() => {
        triggerAllIntersections([intersectionEntry]);
      });
      expect(target).toHaveTextContent('Visible - 0x0');

      // Trigger resize
      const resizeEntry = createResizeEntry(target, 250, 180);
      act(() => {
        triggerAllResizes([resizeEntry]);
      });
      expect(target).toHaveTextContent('Visible - 250x180');
    });

    it('should handle observer cleanup', () => {
      const CleanupComponent: React.FC = () => {
        const [count, setCount] = useState(0);
        const [isObserving, setIsObserving] = useState(true);
        const ref = useRef<HTMLDivElement>(null);

        useEffect(() => {
          if (!isObserving) return;

          const observer = new IntersectionObserver(() => {
            setCount(prev => prev + 1);
          });

          if (ref.current) {
            observer.observe(ref.current);
          }

          // Cleanup after 100ms
          const timeout = setTimeout(() => {
            observer.disconnect();
            setIsObserving(false);
          }, 100);

          return () => {
            clearTimeout(timeout);
            observer.disconnect();
          };
        }, [isObserving]);

        return (
          <div>
            <div ref={ref} data-testid="cleanup-target">
              Count: {count}
            </div>
            <button 
              data-testid="cleanup-button"
              onClick={() => setIsObserving(false)}
            >
              Stop Observing
            </button>
          </div>
        );
      };

      render(<CleanupComponent />);
      
      const target = screen.getByTestId('cleanup-target');
      expect(target).toHaveTextContent('Count: 0');

      // Trigger intersection before cleanup
      const entry1 = createIntersectionEntry(target, true, 1.0);
      act(() => {
        triggerAllIntersections([entry1]);
      });
      expect(target).toHaveTextContent('Count: 1');

      // Wait for cleanup
      vi.advanceTimersByTime(150);

      // Trigger intersection after cleanup (should not increment)
      const entry2 = createIntersectionEntry(target, true, 1.0);
      act(() => {
        // Use per-target triggering - since observer is disconnected, this should not affect the count
        triggerIntersectionsForTargets([entry2]);
      });
      expect(target).toHaveTextContent('Count: 1'); // Should remain 1
    });
  });
});