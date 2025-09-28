// find-utility-opportunities.cli.test.mjs
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT = join(__dirname, 'find-utility-opportunities.mjs');

let tmpRoot;

beforeAll(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'opp-cli-'));
  // create a file that triggers at least a couple of patterns
  writeFileSync(
    join(tmpRoot, 'demo.ts'),
    `
      // Manual Rounding
      const a = 12.345; const b = Math.round(a * 100) / 100;
      // Manual Currency Constants
      const SUP = ["USD","EUR","JPY","GBP","CAD"];
    `,
    'utf8'
  );
});

afterAll(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

describe('CLI integration', () => {
  it('outputs valid JSON with --json', () => {
    const res = spawnSync(process.execPath, [SCRIPT, tmpRoot, '--json'], {
      encoding: 'utf8'
    });
    expect(res.status).toBe(0);
    const parsed = JSON.parse(res.stdout);
    expect(parsed).toHaveProperty('version', 1);
    expect(parsed).toHaveProperty('count');
    expect(Array.isArray(parsed.opportunities)).toBe(true);
    expect(parsed.count).toBe(parsed.opportunities.length);
    // basic shape check
    const first = parsed.opportunities[0];
    expect(first).toHaveProperty('file');
    expect(first).toHaveProperty('line');
    expect(first).toHaveProperty('column');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('suggestion');
    expect(first).toHaveProperty('utility');
    expect(first).toHaveProperty('snippet');
    expect(first).toHaveProperty('type', 'pattern');
  });

  it('lists pattern names with --list', () => {
    const res = spawnSync(process.execPath, [SCRIPT, '--list'], {
      encoding: 'utf8'
    });
    expect(res.status).toBe(0);
    const lines = res.stdout.trim().split('\n');
    expect(lines.length).toBeGreaterThan(10);
    expect(lines).toContain('Manual Rounding');
    expect(lines).toContain('Manual Currency Constants');
  });
});
