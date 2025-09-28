#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const GLOBS = [/package\.json$/, /tsconfig\.json$/];

function* walk(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory() && d.name !== 'node_modules') yield* walk(p);
    else yield p;
  }
}

let bad = 0;
for (const file of walk(process.cwd())) {
  if (!GLOBS.some((g) => g.test(file))) continue;
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    bad++;
    console.error(`❌ ${file}\n   ${e.message}`);
  }
}
if (bad) process.exit(1);
console.log('✅ All JSON parsed cleanly');
