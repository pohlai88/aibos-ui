// find-utility-opportunities.test.mjs
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mod;
let tmpDir;
let tmpFile1;
let tmpFile2;

beforeAll(async () => {
  // Import AFTER vitest starts so envs/flags are stable
  mod = await import('../find-utility-opportunities.mjs');
  tmpDir = mkdtempSync(join(tmpdir(), 'opp-test-'));
  tmpFile1 = join(tmpDir, 'rounding-and-currency.ts');
  tmpFile2 = join(tmpDir, 'mixed-patterns.ts');

  // This file should trigger:
  // - Manual Rounding
  // - Manual Currency Normalization
  // - Manual Currency Constants
  writeFileSync(
    tmpFile1,
    `
      const amount = 123.456;
      const rounded = round2(amount); // Manual Rounding

      const currency = " usd ".toUpperCase().trim();  // Manual Currency Normalization
      const supported = ["USD","EUR","JPY","GBP","CAD"]; // Manual Currency Constants
    `,
    'utf8'
  );

  // This file should trigger:
  // - Manual Object Type Checking (isRecord)
  // - Manual Property Existence Checking (hasKey)
  // - Manual Period Parsing
  // - Manual Minor Units Conversion
  writeFileSync(
    tmpFile2,
    `
      import { hasKey } from '../utils/safe-object';
      
      const maybe = { a: 1 };
      if (isRecord(maybe)) { /* Manual Object Type Checking */ }

      if (hasKey(maybe, 'a')) { /* Manual Property Existence Checking */ }

      const period = "2025-09"; const [y, m] = period.split('-').map(Number); // Manual Period Parsing

      const cents = 10_00; const dollars = cents / 100; // Manual Minor Units Conversion
    `,
    'utf8'
  );
});

afterAll(() => {
  // Clean up the temp dir (recursive)
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('find-utility-opportunities.mjs', () => {
  it('exposes the expected API surface', () => {
    expect(typeof mod.scanFile).toBe('function');
    expect(Array.isArray(mod.patterns)).toBe(true);
    // patterns must have a stable shape
    expect(mod.patterns[0]).toHaveProperty('name');
    expect(mod.patterns[0]).toHaveProperty('suggestion');
    expect(mod.patterns[0]).toHaveProperty('utility');
  });

  it('detects Manual Rounding & currency-related patterns in tmpFile1', () => {
    const results = mod.scanFile(tmpFile1);
    const names = results.map(r => r.name);

    expect(results.length).toBeGreaterThanOrEqual(3);
    expect(names).toContain('Manual Rounding');
    expect(names).toContain('Manual Currency Normalization');
    expect(names).toContain('Manual Currency Constants');

    // basic JSON shape assertions
    for (const r of results) {
      expect(r).toHaveProperty('file', tmpFile1);
      expect(r).toHaveProperty('line');
      expect(r).toHaveProperty('column');
      expect(r).toHaveProperty('name');
      expect(r).toHaveProperty('suggestion');
      expect(r).toHaveProperty('utility');
      expect(r).toHaveProperty('snippet');
      expect(r).toHaveProperty('type', 'pattern'); // added by our patch
      expect(typeof r.line).toBe('number');
      expect(typeof r.column).toBe('number');
      expect(r.snippet.length).toBeLessThanOrEqual(180);
    }
  });

  it('detects object/period/minor-units patterns in tmpFile2', () => {
    const results = mod.scanFile(tmpFile2);
    const names = results.map(r => r.name);

    expect(names).toContain('Manual Object Type Checking');
    expect(names).toContain('Manual Property Existence Checking');
    expect(names).toContain('Manual Period Parsing');
    expect(names).toContain('Manual Minor Units Conversion');
  });
});
