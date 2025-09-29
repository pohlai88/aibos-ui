// find-utility-opportunities.dir.test.mjs
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let tmpRoot;

// helper: import module with specific argv flags (cache-busted)
async function importWithFlags(flags = []) {
  const prevArgv = process.argv.slice();
  try {
    // keep node + vitest args, append ours
    process.argv = [...prevArgv.filter(a => !a.startsWith('--include') && !a.startsWith('--exclude') && !a.startsWith('--ignore') && !a.startsWith('--ext')), ...flags];
    const url = pathToFileURL(join(__dirname, '../find-utility-opportunities.mjs')).href + `?t=${Date.now()}`;
    return await import(url);
  } finally {
    process.argv = prevArgv;
  }
}

// simple source that triggers "Manual Rounding"
const SRC = `const x = 12.345; const y = round2(x);`;

beforeAll(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'opp-dir-'));
  // layout:
  // tmpRoot/
  //   a/keep.ts
  //   b/exclude.ts
  //   c/ignoredDir/nested.ts
  //   node_modules/pkg/index.ts
  mkdirSync(join(tmpRoot, 'a'), { recursive: true });
  mkdirSync(join(tmpRoot, 'b'), { recursive: true });
  mkdirSync(join(tmpRoot, 'c', 'ignoredDir'), { recursive: true });
  mkdirSync(join(tmpRoot, 'node_modules', 'pkg'), { recursive: true });

  writeFileSync(join(tmpRoot, 'a', 'keep.ts'), SRC, 'utf8');
  writeFileSync(join(tmpRoot, 'b', 'exclude.ts'), SRC, 'utf8');
  writeFileSync(join(tmpRoot, 'c', 'ignoredDir', 'nested.ts'), SRC, 'utf8');
  writeFileSync(join(tmpRoot, 'node_modules', 'pkg', 'index.ts'), SRC, 'utf8');
});

afterAll(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

describe('scanDirectory include/exclude/ignore/ext behavior', () => {
  it('scans default tree (respects DEFAULT_IGNORES like node_modules)', async () => {
    const mod = await importWithFlags([]);
    const results = mod.scanDirectory(tmpRoot);
    const files = results.map(r => r.file);

    expect(files.some(f => f.endsWith('a/keep.ts'))).toBe(true);
    expect(files.some(f => f.endsWith('b/exclude.ts'))).toBe(true);
    // node_modules should be ignored by default
    expect(files.some(f => f.includes('node_modules'))).toBe(false);
  });

  it('applies --exclude to remove matching paths', async () => {
    const mod = await importWithFlags(['--exclude', 'b' ]);
    const results = mod.scanDirectory(tmpRoot);
    const files = results.map(r => r.file);

    expect(files.some(f => f.endsWith('a/keep.ts'))).toBe(true);
    expect(files.some(f => f.endsWith('b/exclude.ts'))).toBe(false);
  });

  it('applies --include to require at least one matching substring', async () => {
    const mod = await importWithFlags(['--include', 'a' ]);
    const results = mod.scanDirectory(tmpRoot);
    const files = results.map(r => r.file);

    expect(files.length).toBeGreaterThan(0);
    expect(files.every(f => f.includes(`${tmpRoot}${require('path').sep}a`))).toBe(true);
  });

  it('applies --ignore to skip specific folders (in addition to defaults)', async () => {
    const mod = await importWithFlags(['--ignore', 'ignoredDir' ]);
    const results = mod.scanDirectory(tmpRoot);
    const files = results.map(r => r.file);

    expect(files.some(f => f.endsWith('a/keep.ts'))).toBe(true);
    expect(files.some(f => f.endsWith('c/ignoredDir/nested.ts'))).toBe(false);
  });

  it('filters by extensions via --ext', async () => {
    // Create a .jsx file that would match if JSX were allowed
    writeFileSync(join(tmpRoot, 'a', 'also.jsx'), SRC, 'utf8');

    // Only allow .ts to ensure .jsx is ignored
    const mod = await importWithFlags(['--ext', 'ts']);
    const results = mod.scanDirectory(tmpRoot);
    const files = results.map(r => r.file);

    expect(files.some(f => f.endsWith('a/keep.ts'))).toBe(true);
    expect(files.some(f => f.endsWith('a/also.jsx'))).toBe(false);
  });
});
