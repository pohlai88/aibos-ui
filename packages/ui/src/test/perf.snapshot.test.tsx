/**
 * Performance Snapshot Suite
 * - Benchmarks representative operations and writes JSON for CI trending.
 * - Set PERF_SNAPSHOT_PATH to write to disk; otherwise logs to stdout.
 */
import { render } from '@testing-library/react';
import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { bench } from './perf.util';

import { Button } from '@primitives/button';
import { Input } from '@primitives/input';
import { Table } from '@components/table';
import { Modal } from '@components/modal';

// Small but meaningful fixtures
const tableData = Array.from({ length: 500 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 2 ? 'User' : 'Admin',
}));
const tableCols = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
];

type Metric = { median: number; p95: number; mean: number };
type Snapshot = Record<string, Metric | number>;
const SNAP: Snapshot = {};

const memMB = () =>
  'memory' in performance
    ? ((performance as any).memory.usedJSHeapSize / 1024 / 1024)
    : NaN;

describe('Performance Snapshot', () => {
  it('button.render', async () => {
    const stats = await bench(() => {
      render(<Button>Click</Button>);
    }, { warmup: 5, iterations: 20 });
    SNAP['button.render'] = { median: stats.median, p95: stats.p95, mean: stats.mean };
    expect(stats.median).toBeGreaterThanOrEqual(0); // smoke, real gating happens elsewhere
  });

  it('input.render', async () => {
    const stats = await bench(() => {
      render(<Input placeholder="Email" />);
    }, { warmup: 5, iterations: 20 });
    SNAP['input.render'] = { median: stats.median, p95: stats.p95, mean: stats.mean };
  });

  it('modal.open', async () => {
    const stats = await bench(
      () => {
        render(
          <Modal open={true} onOpenChange={() => {}}>
            <div>Content</div>
          </Modal>
        );
      },
      { warmup: 3, iterations: 12 }
    );
    SNAP['modal.open'] = { median: stats.median, p95: stats.p95, mean: stats.mean };
  });

  it('table.500rows.render', async () => {
    const stats = await bench(() => {
      render(<Table data={tableData} columns={tableCols} />);
    }, {
      warmup: 3,
      iterations: 8,
    });
    SNAP['table.500rows.render'] = { median: stats.median, p95: stats.p95, mean: stats.mean };
  });

  it('memory.delta.table.500rows', async () => {
    const before = memMB();
    render(<Table data={tableData} columns={tableCols} />);
    const after = memMB();
    const memoryDelta = Number.isFinite(after - before) ? +(after - before).toFixed(2) : NaN;
    SNAP['memory.delta.table.500rows'] = memoryDelta;
  });
});

afterAll(() => {
  const payload = {
    generatedAt: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
    },
    metrics: SNAP,
  };
  const json = JSON.stringify(payload, null, 2);
  const out = process.env.PERF_SNAPSHOT_PATH;
  if (out) {
    const p = path.resolve(out);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, json, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`[perf] snapshot written: ${p}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[perf] snapshot:\n${json}`);
  }
});
