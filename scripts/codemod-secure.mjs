#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const targets = [
  // Add folders where you saw most warnings, adjust as needed
  'packages/accounting',
  'packages/accounting-web',
  'apps/bff',
  'scripts',
];

const fileRx = /\.(t|j)sx?$/;

function* walk(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory() && d.name !== 'node_modules' && d.name !== 'dist') yield* walk(p);
    else if (fileRx.test(p)) yield p;
  }
}

// Replace new RegExp(userInput, flags) → safeRegExpFromUser(userInput, flags)
// Replace fs.readFileSync(pathVar...) → fs.readFileSync(safeJoin(BASE, pathVar)...)
// Replace obj[userKey] (very naive heuristic) → safeGet(obj, userKey, /*TODO allow-list*/)
const transforms = [
  {
    name: 'regex',
    rx: /new\s+RegExp\(\s*([^\),]+)\s*(,\s*['"][igmuy]*['"])?\s*\)/g,
    to: (m, a, b = '') => `safeRegExpFromUser(${a.trim()}${b || ''})`,
    import: `import { safeRegExpFromUser } from '@aibos/utils';\n`,
  },
  {
    name: 'fs',
    rx: /\bfs\.(readFileSync|writeFileSync|readdirSync|statSync|existsSync)\(\s*([^\),]+)\)/g,
    to: (m, method, pth) =>
      `fs.${method}(${pth.includes('safeJoin(') ? pth : `safeJoin(BASE_DIR, ${pth.trim()})`})`,
    import: `import { safeJoin } from '@aibos/utils';\nconst BASE_DIR = process.cwd();\n`,
  },
  // NOTE: object indexing is context sensitive; we only flag & leave a TODO allow-list.
  {
    name: 'obj-index',
    rx: /([a-zA-Z0-9_]+)\s*\[\s*([a-zA-Z0-9_]+)\s*\]/g,
    to: (m, obj, key) => `/* TODO: allow-list */ safeGet(${obj}, ${key}, [] as const)`,
    import: `import { safeGet } from '@aibos/utils';\n`,
  },
];

function ensureImports(src, imp) {
  if (src.includes(imp.trim())) return src;
  // place after first import
  const lines = src.split('\n');
  let idx = lines.findIndex((l) => l.startsWith('import '));
  idx = idx === -1 ? 0 : idx + 1;
  lines.splice(idx, 0, imp.trim());
  return lines.join('\n');
}

let changes = 0;
for (const root of targets) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    let s = fs.readFileSync(f, 'utf8');
    let before = s;

    for (const t of transforms) {
      if (!t.rx.test(s)) continue;
      s = s.replace(t.rx, t.to);
      s = ensureImports(s, t.import);
    }

    if (s !== before) {
      fs.writeFileSync(f, s);
      console.log('✳️  codemodded', path.relative(process.cwd(), f));
      changes++;
    }
  }
}
console.log(changes ? `✅ Codemod updated ${changes} files` : '✅ No codemods applied');
