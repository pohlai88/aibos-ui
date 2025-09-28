#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'jsonc-parser';

function* walk(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory() && d.name !== 'node_modules') yield* walk(p);
    else yield p;
  }
}

for (const file of walk(process.cwd())) {
  if (!file.endsWith('.jsonc')) continue;
  const jsonc = fs.readFileSync(file, 'utf8');
  const obj = parse(jsonc);
  const out = file.replace(/\.jsonc$/, '.json');
  fs.writeFileSync(out, JSON.stringify(obj, null, 2) + '\n');
  console.log(`➡️  ${file} → ${path.relative(process.cwd(), out)}`);
}
