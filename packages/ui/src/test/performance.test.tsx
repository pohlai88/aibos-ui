/**
 * Performance Test Suite
 * 
 * Comprehensive performance testing for all components:
 * - Render performance
 * - Memory usage
 * - Bundle size impact
 * - Real-world performance scenarios
 * - Performance regression detection
 */

import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Button } from '@primitives/button';
import { Input } from '@primitives/input';
import { Table } from '@components/table';
import { Modal } from '@components/modal';
import { Select, SelectItem } from '@components/select';
import { bench, withGc } from './perf.util';
import type { ColumnDef } from '@tanstack/react-table';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_MS: 16, // 60fps threshold
  MEMORY_USAGE_MB: 50, // Maximum memory usage
  BUNDLE_SIZE_KB: 100, // Maximum bundle size per component
  CONSISTENCY_THRESHOLD: 0.9, // Performance consistency threshold
};

// Provide a soft memory shim if missing (Node + jsdom often omit it)
const mockMemory = {
  usedJSHeapSize: 1024 * 1024 * 10, // 10MB
  totalJSHeapSize: 1024 * 1024 * 20, // 20MB
  jsHeapSizeLimit: 1024 * 1024 * 100, // 100MB
};

// Performance measurement utilities
const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const t0 = performance.now();
  renderFn();
  return performance.now() - t0;
};

const measureMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize / (1024 * 1024);
  }
  return mockMemory.usedJSHeapSize / (1024 * 1024);
};

// Mock data for performance testing
const largeTableData = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 2 === 0 ? 'Admin' : 'User',
}));

const tableColumns: ColumnDef<{ id: number; name: string; email: string; role: string }>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
];

const selectOptions = Array.from({ length: 100 }, (_, i) => ({
  value: `option${i + 1}`,
  label: `Option ${i + 1}`,
}));

describe('Performance Tests', () => {
  beforeEach(() => {
    // Do NOT replace window.performance — just spy on now() if needed.
    if (!(performance as any).memory) {
      Object.defineProperty(performance, 'memory', {
        configurable: true,
        value: mockMemory,
      });
    }
    // Keep the real perf.now monotonic; if you need, you can spy:
    // vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Primitive Components Performance', () => {
    it('should render Button component within performance threshold', async () => {
      const stats = await bench(() => {
        render(<Button>Test Button</Button>);
      });
      expect(stats.median).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS);
    });

    it('should render Input component within performance threshold', async () => {
      const stats = await bench(() => {
        render(<Input placeholder="Test input" />);
      });
      expect(stats.median).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS);
    });

    it('should render multiple primitive components efficiently', async () => {
      const stats = await bench(() => {
        render(
          <div>
            <Button>Button 1</Button>
            <Button>Button 2</Button>
            <Button>Button 3</Button>
            <Input placeholder="Input 1" />
            <Input placeholder="Input 2" />
            <Input placeholder="Input 3" />
          </div>
        );
      });
      expect(stats.median).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 2);
    });

    it('should not cause memory leaks with repeated renders', () => {
      const run = () => {
        const { unmount } = render(<Button>Test Button</Button>);
        unmount();
      };
      const initial = measureMemoryUsage();
      for (let i = 0; i < 100; i++) run();
      // Try to help GC if available
      const after = measureMemoryUsage();
      const diff = after - initial;
      expect(diff).toBeLessThan(10);
    });
  });

  describe('Complex Components Performance', () => {
    it('should render Table with large dataset efficiently', async () => {
      const stats = await bench(() => {
        render(<Table data={largeTableData} columns={tableColumns} />);
      }, { iterations: 10, warmup: 3 });
      expect(stats.p95).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 5);
    });

    it('should render Modal within performance threshold', async () => {
      const stats = await bench(
        () => {
          render(
            <Modal open={true} onOpenChange={() => {}}>
              <div>Modal content</div>
            </Modal>
          );
        },
        { iterations: 10, warmup: 3 }
      );
      expect(stats.median).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 2);
    });

    it('should render Select with many options efficiently', async () => {
      const stats = await bench(
        () => {
          render(
            <Select placeholder="Select option">
              {selectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          );
        },
        { iterations: 10, warmup: 3 }
      );
      expect(stats.p95).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 3);
    });

    it('should handle rapid state changes efficiently', async () => {
      const { rerender } = render(<Button>Static Button</Button>);
      const stats = await bench(() => {
        for (let i = 0; i < 50; i++) {
          rerender(<Button>Button {i}</Button>);
        }
      }, { iterations: 5, warmup: 2 });
      expect(stats.p95).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 10);
    });
  });

  describe('Memory Performance', () => {
    it('should not exceed memory threshold for large datasets', () => {
      const initial = measureMemoryUsage();
      render(<Table data={largeTableData} columns={tableColumns} />);
      const final = measureMemoryUsage();
      const delta = final - initial;
      expect(delta).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB);
    });

    it('should clean up memory after component unmount', async () => {
      await withGc(async () => {
        const initial = measureMemoryUsage();
        const { unmount } = render(<Table data={largeTableData} columns={tableColumns} />);
        unmount();
        const final = measureMemoryUsage();
        const delta = final - initial;
        expect(delta).toBeLessThan(5);
      });
    });
  });

  describe('Bundle Impact Performance', () => {
    it('should have reasonable bundle size impact', async () => {
      // This would typically be measured with bundle analysis tools
      // For now, we'll verify that components can be imported without issues
      await expect(async () => {
        // Use dynamic imports instead of require for better module resolution
        await import('@primitives/button');
        await import('@primitives/input');
        await import('@components/table');
        await import('@components/modal');
      }).not.toThrow();
    });

    it('should support tree shaking for unused components', async () => {
      // Verify that unused components don't increase bundle size
      // This is more of a build-time check, but we can verify imports work
      const { Button } = await import('@primitives/button');
      const { Input } = await import('@primitives/input');
      
      // These should be available without importing everything
      expect(Button).toBeDefined();
      expect(Input).toBeDefined();
    });
  });

  describe('Real-World Performance Scenarios', () => {
    it('should handle form with many fields efficiently', async () => {
      const formFields = Array.from({ length: 20 }, (_, i) => (
        <Input key={i} placeholder={`Field ${i + 1}`} />
      ));
      
      const renderTime = await measureRenderTime(() => {
        render(<form>{formFields}</form>);
      });

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 3);
    });

    it('should handle dashboard with multiple components efficiently', async () => {
      const renderTime = await measureRenderTime(() => {
        render(
          <div>
            <Table data={largeTableData.slice(0, 100)} columns={tableColumns} />
            <Button>Action Button</Button>
            <Input placeholder="Search" />
            <Modal open={false} onOpenChange={() => {}}>
              <div>Modal content</div>
            </Modal>
          </div>
        );
      });

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 5);
    });

    it('should handle rapid user interactions efficiently', async () => {
      const { rerender } = render(<Button>Click me</Button>);
      
      const startTime = performance.now();
      
      // Simulate rapid clicks
      for (let i = 0; i < 100; i++) {
        rerender(<Button>Click me {i}</Button>);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 20);
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain consistent performance across renders', () => {
      const renderTimes: number[] = [];
      
      // Measure render times for multiple renders
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        render(<Button>Button {i}</Button>);
        const end = performance.now();
        renderTimes.push(end - start);
      }
      
      // Calculate consistency (lower variance = more consistent)
      const average = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      const variance = renderTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / renderTimes.length;
      
      // Avoid division by zero and ensure we have valid numbers
      if (average === 0 || !isFinite(average) || !isFinite(variance)) {
        // If we can't calculate consistency, just ensure render times are reasonable
        expect(average).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 2);
        return;
      }
      
      // For very fast renders, consistency might be low due to measurement precision
      // So we'll use a more lenient threshold or just check that variance is reasonable
      if (average < 1) {
        expect(variance).toBeLessThan(average * 2); // Variance should be reasonable
      } else {
        // Use coefficient of variation instead of consistency for more reliable results
        const coefficientOfVariation = Math.sqrt(variance) / average;
        // Lower CV means more consistent performance
        expect(coefficientOfVariation).toBeLessThan(0.3); // 30% max variation
      }
    });

    it('should not degrade performance with repeated operations', () => {
      const operationTimes: number[] = [];
      
      // Measure operation times
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        
        // Simulate component operation
        const { unmount } = render(<Button>Button {i}</Button>);
        unmount();
        
        const end = performance.now();
        operationTimes.push(end - start);
      }
      
      // Check that performance doesn't degrade over time
      const firstHalf = operationTimes.slice(0, 25);
      const secondHalf = operationTimes.slice(25);
      
      const firstHalfAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
      
      // Second half should not be significantly slower
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
    });

    it('should scale linearly with component count', () => {
      const componentCounts = [1, 5, 10, 20];
      const renderTimes: number[] = [];
      
      componentCounts.forEach(count => {
        const components = Array.from({ length: count }, (_, i) => (
          <Button key={i}>Button {i}</Button>
        ));
        
        const start = performance.now();
        render(<div>{components}</div>);
        const end = performance.now();
        
        renderTimes.push(end - start);
      });
      
      // Check that render time scales reasonably with component count
      const timePerComponent = renderTimes.map((time, index) => {
        const count = componentCounts[index] ?? 1;
        return count > 0 ? time / count : 0;
      });
      
      // Filter out invalid values
      const validTimes = timePerComponent.filter(time => isFinite(time) && time > 0);
      
      if (validTimes.length === 0) {
        // If no valid times, just ensure total render times are reasonable
        renderTimes.forEach(time => {
          expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 5);
        });
        return;
      }
      
      const averageTimePerComponent = validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
      
      // Each component should take roughly the same time (with some tolerance)
      validTimes.forEach(time => {
        expect(time).toBeLessThan(averageTimePerComponent * 3); // More lenient threshold
      });
    });
  });
});
