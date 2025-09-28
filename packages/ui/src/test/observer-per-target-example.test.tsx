/**
 * Per-Target Observer Testing Examples
 * 
 * Demonstrates how to use the per-target observer helpers
 * for precise testing of observer behavior when multiple
 * observers are watching different elements.
 */

import React, { useEffect, useState, useRef } from 'react';
import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createIntersectionEntry,
  createResizeEntry,
  triggerAllIntersections,
  triggerIntersectionsForTargets,
  triggerResizesForTargets,
} from './observer-helpers';

// Example components that use observers
const HeroSection: React.FC = () => {
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
    <div ref={ref} data-testid="hero-section" style={{ height: '500px' }}>
      {isVisible ? 'Hero Visible' : 'Hero Hidden'}
    </div>
  );
};

const Sidebar: React.FC = () => {
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
    <div ref={ref} data-testid="sidebar" style={{ width: '300px', height: '600px' }}>
      Sidebar: {dimensions.width}x{dimensions.height}
    </div>
  );
};

const Footer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries[0]?.isIntersecting ?? false);
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-testid="footer" style={{ height: '200px' }}>
      {isVisible ? 'Footer Visible' : 'Footer Hidden'}
    </div>
  );
};

describe('Per-Target Observer Testing', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Precise IntersectionObserver Targeting', () => {
    it('should only trigger observers watching specific targets', () => {
      render(
        <div>
          <HeroSection />
          <Footer />
        </div>
      );
      
      const hero = screen.getByTestId('hero-section');
      const footer = screen.getByTestId('footer');
      
      // Initially both should be hidden
      expect(hero).toHaveTextContent('Hero Hidden');
      expect(footer).toHaveTextContent('Footer Hidden');

      // Trigger intersection only for hero
      const heroEntry = createIntersectionEntry(hero, true, 0.8);
      act(() => {
        triggerIntersectionsForTargets([heroEntry]);
      });

      // Only hero should be visible
      expect(hero).toHaveTextContent('Hero Visible');
      expect(footer).toHaveTextContent('Footer Hidden');

      // Trigger intersection only for footer
      const footerEntry = createIntersectionEntry(footer, true, 0.2);
      act(() => {
        triggerIntersectionsForTargets([footerEntry]);
      });

      // Both should now be visible
      expect(hero).toHaveTextContent('Hero Visible');
      expect(footer).toHaveTextContent('Footer Visible');
    });

    it('should not trigger observers when using wrong targets', () => {
      render(
        <div>
          <HeroSection />
          <Footer />
        </div>
      );
      
      const hero = screen.getByTestId('hero-section');
      const footer = screen.getByTestId('footer');
      
      // Create a fake element that no observer is watching
      const fakeElement = document.createElement('div');
      
      // Try to trigger intersection for fake element
      const fakeEntry = createIntersectionEntry(fakeElement, true, 1.0);
      act(() => {
        triggerIntersectionsForTargets([fakeEntry]);
      });

      // Neither should be affected
      expect(hero).toHaveTextContent('Hero Hidden');
      expect(footer).toHaveTextContent('Footer Hidden');
    });

    it('should work with multiple targets in single call', () => {
      render(
        <div>
          <HeroSection />
          <Footer />
        </div>
      );
      
      const hero = screen.getByTestId('hero-section');
      const footer = screen.getByTestId('footer');
      
      // Trigger both at once
      const heroEntry = createIntersectionEntry(hero, true, 0.8);
      const footerEntry = createIntersectionEntry(footer, true, 0.2);
      
      act(() => {
        triggerIntersectionsForTargets([heroEntry, footerEntry]);
      });

      // Both should be visible
      expect(hero).toHaveTextContent('Hero Visible');
      expect(footer).toHaveTextContent('Footer Visible');
    });
  });

  describe('Precise ResizeObserver Targeting', () => {
    it('should only trigger observers watching specific targets', () => {
      render(<Sidebar />);
      
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveTextContent('Sidebar: 0x0');

      // Trigger resize for sidebar
      const sidebarEntry = createResizeEntry(sidebar, 320, 800);
      act(() => {
        triggerResizesForTargets([sidebarEntry]);
      });

      expect(sidebar).toHaveTextContent('Sidebar: 320x800');
    });

    it('should not trigger observers when using wrong targets', () => {
      render(<Sidebar />);
      
      const sidebar = screen.getByTestId('sidebar');
      
      // Create a fake element that no observer is watching
      const fakeElement = document.createElement('div');
      
      // Try to trigger resize for fake element
      const fakeEntry = createResizeEntry(fakeElement, 500, 300);
      act(() => {
        triggerResizesForTargets([fakeEntry]);
      });

      // Sidebar should remain unchanged
      expect(sidebar).toHaveTextContent('Sidebar: 0x0');
    });
  });

  describe('Mixed Observer Types', () => {
    it('should handle multiple observer types on different elements', () => {
      render(
        <div>
          <HeroSection />
          <Sidebar />
          <Footer />
        </div>
      );
      
      const hero = screen.getByTestId('hero-section');
      const sidebar = screen.getByTestId('sidebar');
      const footer = screen.getByTestId('footer');
      
      // Trigger intersection for hero and footer
      const heroEntry = createIntersectionEntry(hero, true, 0.8);
      const footerEntry = createIntersectionEntry(footer, true, 0.2);
      
      act(() => {
        triggerIntersectionsForTargets([heroEntry, footerEntry]);
      });

      expect(hero).toHaveTextContent('Hero Visible');
      expect(footer).toHaveTextContent('Footer Visible');
      expect(sidebar).toHaveTextContent('Sidebar: 0x0');

      // Trigger resize for sidebar
      const sidebarEntry = createResizeEntry(sidebar, 250, 700);
      act(() => {
        triggerResizesForTargets([sidebarEntry]);
      });

      expect(hero).toHaveTextContent('Hero Visible');
      expect(footer).toHaveTextContent('Footer Visible');
      expect(sidebar).toHaveTextContent('Sidebar: 250x700');
    });
  });

  describe('Comparison with triggerAll', () => {
    it('should demonstrate difference between triggerAll and triggerForTargets', () => {
      render(
        <div>
          <HeroSection />
          <Footer />
        </div>
      );
      
      const hero = screen.getByTestId('hero-section');
      const footer = screen.getByTestId('footer');
      
      // Create entries for both elements
      const heroEntry = createIntersectionEntry(hero, true, 0.8);
      const footerEntry = createIntersectionEntry(footer, true, 0.2);
      
      // Using triggerAll - both observers will fire
      act(() => {
        triggerAllIntersections([heroEntry, footerEntry]);
      });

      expect(hero).toHaveTextContent('Hero Visible');
      expect(footer).toHaveTextContent('Footer Visible');

      // Reset both to hidden
      act(() => {
        triggerAllIntersections([
          createIntersectionEntry(hero, false, 0.1),
          createIntersectionEntry(footer, false, 0.1),
        ]);
      });

      expect(hero).toHaveTextContent('Hero Hidden');
      expect(footer).toHaveTextContent('Footer Hidden');

      // Using triggerForTargets with only hero entry
      act(() => {
        triggerIntersectionsForTargets([heroEntry]);
      });

      // Only hero should be visible
      expect(hero).toHaveTextContent('Hero Visible');
      expect(footer).toHaveTextContent('Footer Hidden');
    });
  });

  describe('Observer Cleanup and Re-targeting', () => {
    it('should handle observers that stop watching elements', () => {
      const DynamicComponent: React.FC = () => {
        const [isObserving, setIsObserving] = useState(true);
        const [isVisible, setIsVisible] = useState(false);
        const ref = useRef<HTMLDivElement>(null);

        useEffect(() => {
          if (!isObserving) return;

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
        }, [isObserving]);

        return (
          <div>
            <div ref={ref} data-testid="dynamic-element">
              {isVisible ? 'Visible' : 'Hidden'}
            </div>
            <button 
              data-testid="toggle-observer"
              onClick={() => setIsObserving(!isObserving)}
            >
              Toggle Observer
            </button>
          </div>
        );
      };

      render(<DynamicComponent />);
      
      const element = screen.getByTestId('dynamic-element');
      const toggleButton = screen.getByTestId('toggle-observer');
      
      // Initially hidden
      expect(element).toHaveTextContent('Hidden');

      // Trigger intersection
      const entry = createIntersectionEntry(element, true, 0.8);
      act(() => {
        triggerIntersectionsForTargets([entry]);
      });
      expect(element).toHaveTextContent('Visible');

      // Stop observing
      act(() => {
        toggleButton.click();
      });

      // Trigger intersection again - should not affect the element
      act(() => {
        triggerIntersectionsForTargets([entry]);
      });
      expect(element).toHaveTextContent('Visible'); // Should remain visible
    });
  });
});
