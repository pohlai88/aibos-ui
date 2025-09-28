#!/usr/bin/env node
/* eslint-env node */

/**
 * Import Guard Scanner - Enterprise Production Ready
 *
 * Guards against sneaky strings in non-TS files (mdx, json-based configs, etc.)
 * and prevents regression of .util imports after rename to .utility
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.argv[2] ?? '.';
const BAD_PATTERNS = [
  /\.util(['"]?)/g, // Legacy .util imports
  /from\s+['"]\.\.\/\.\.\//g, // Deep relative imports
  /import\s+.*['"]\.\.\/\.\.\//g, // Deep relative imports in import statements
];

const IGNORES = [/node_modules/, /\.git/, /dist|build|\.next/, /\.turbo/, /coverage/];

const TEXT_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.md',
  '.mdx',
  '.json',
  '.yml',
  '.yaml',
  '.css',
  '.scss',
  '.html',
  '.xml',
  '.txt',
  '.config.js',
  '.config.ts',
];

const files = [];
function walk(dir) {
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);

      if (IGNORES.some((rx) => rx.test(p))) continue;

      if (entry.isDirectory()) {
        walk(p);
      } else if (TEXT_EXTENSIONS.includes(extname(p))) {
        files.push(p);
      }
    }
  } catch (error) {
    // Skip directories we can't read
    if (error.code !== 'EACCES') {
      console.warn(`Warning: Could not read ${dir}: ${error.message}`);
    }
  }
}

walk(ROOT);

const offenders = [];
for (const f of files) {
  try {
    const txt = readFileSync(f, 'utf8');

    for (const pattern of BAD_PATTERNS) {
      const matches = txt.match(pattern);
      if (matches) {
        offenders.push({
          file: f,
          pattern: pattern.source,
          matches: matches.slice(0, 3), // Show first 3 matches
        });
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read ${f}: ${error.message}`);
  }
}

if (offenders.length) {
  console.error('❌ Found problematic imports:\n');
  offenders.forEach(({ file, pattern, matches }) => {
    console.error(`  ${file}`);
    console.error(`    Pattern: ${pattern}`);
    console.error(`    Matches: ${matches.join(', ')}${matches.length > 3 ? '...' : ''}`);
    console.error('');
  });

  console.error('💡 Fix suggestions:');
  console.error('  - Replace .util with .utility in import paths');
  console.error('  - Use path aliases instead of deep relative imports');
  console.error('  - Run: pnpm lint --fix');

  process.exit(1);
}

console.log('✅ No problematic imports detected');
console.log(`📊 Scanned ${files.length} files`);
