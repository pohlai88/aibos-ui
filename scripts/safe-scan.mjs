#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const PATTERNS = [
  { name: 'object-injection', rx: /\[\s*([^\]'"]+)\s*\]/g }, // obj[dynamic]
  { name: 'non-literal-fs', rx: /\bfs\.(read|write|stat|exists|readdir)[A-Za-z]*\(\s*[^'"][^)]+/g },
  { name: 'non-literal-regexp', rx: /new\s+RegExp\(\s*[^'"][^)]+/g },
];

function* walk(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory() && d.name !== 'node_modules') yield* walk(p);
    else if (/\.(t|j)sx?$/.test(p)) yield p;
  }
}

let hits = 0;
for (const file of walk(process.cwd())) {
  const src = fs.readFileSync(file, 'utf8').split('\n');
  src.forEach((line, i) => {
    for (const p of PATTERNS) {
      if (p.rx.test(line)) {
        hits++;
        console.log(`${file}:${i + 1}: ${p.name} → ${line.trim()}`);
      }
    }
  });
}
if (hits) process.exit(2);
console.log('✅ No obvious dynamic sink patterns found');
