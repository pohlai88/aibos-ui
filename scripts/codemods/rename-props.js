#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const exts = new Set(['.ts', '.tsx']);
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (exts.has(path.extname(p))) acc.push(p);
  }
  return acc;
}

// rename "type Props =" or "interface Props" to "... Properties"
const RX = /\b(type|interface)\s+Props\b/g;

for (const file of walk('packages/ui/src')) {
  const src = fs.readFileSync(file, 'utf8');
  if (!RX.test(src)) continue;
  const out = src.replace(RX, (_, kw) => `${kw} Properties`);
  fs.writeFileSync(file, out);
}
console.log('Renamed Props → Properties in packages/ui/src');
