#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx)$/.test(p)) files.push(p);
  }
})('packages/ui/src');

const RE_UI_SRC = /from\s+['"](?:\.\.\/)+src\/(.*)['"]/g;
const RE_UTILS = /from\s+['"](?:\.\.\/)+packages\/utils\/src\/(.*)['"]/g;

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const s1 = s.replace(RE_UI_SRC, (_m, g1) => `from '@ui/${g1}'`);
  const s2 = s1.replace(RE_UTILS, (_m, g1) => `from '@aibos/utils/${g1}'`);
  if (s2 !== s) fs.writeFileSync(f, s2);
}
console.log('Rewrote relative imports → aliases in packages/ui/src');
