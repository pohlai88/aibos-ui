// scripts/verify-structure.mjs

import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['packages/accounting/src'];
const mustNotBeEmpty = [
  'domain',
  'events',
  'services',
  'infrastructure/database/entities',
  'infrastructure/database/repositories',
];

function isEmptyDir(path) {
  try {
    const entries = readdirSync(path);
    return entries.length === 0;
  } catch {
    return false;
  }
}

function fail(msg) {
  console.error(`\n⛔ ${msg}\n`);
  process.exitCode = 1;
}

for (const dir of mustNotBeEmpty) {
  const p = join(roots[0], dir);
  if (isEmptyDir(p)) fail(`Empty directory detected: ${p}`);
}

// Duplicate event class names across files
const eventNames = new Map();
function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (e.endsWith('.ts')) {
      const src = readFileSync(p, 'utf8');
      const m = src.match(/export\s+class\s+([A-Za-z0-9_]+Event)\s/g);
      if (m) {
        for (const t of m) {
          const name = t.replace(/export\s+class\s+/, '').replace(/\s/g, '');
          const arr = eventNames.get(name) || [];
          arr.push(p);
          eventNames.set(name, arr);
        }
      }
    }
  }
}
walk(join(roots[0], 'events'));

for (const [name, files] of eventNames) {
  if (files.length > 1) fail(`Duplicate event "${name}" in:\n- ${files.join('\n- ')}`);
}

// Check for service naming consistency
function checkServiceNaming(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) {
      checkServiceNaming(p);
    } else if (e.endsWith('-service.ts')) {
      fail(`Service file should end with .service.ts, not -service.ts: ${p}`);
    }
  }
}
checkServiceNaming(join(roots[0], 'services'));

console.log('✅ Structure verification passed!');
