#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function* files() {
  for (const d of fs.readdirSync(process.cwd(), { withFileTypes: true })) {
    const p = path.join(process.cwd(), d.name);
    if (d.isDirectory() && d.name !== 'node_modules') yield* filesIn(p);
  }
}
function* filesIn(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory() && d.name !== 'node_modules') yield* filesIn(p);
    else if (/\.(t|j)sx?$/.test(p)) yield p;
  }
}

let changed = 0;
for (const f of files()) {
  let s = fs.readFileSync(f, 'utf8');
  const before = s;

  // substr → slice
  s = s.replace(/(\.\s*substr\s*)\(/g, '.slice(');

  // clickable div without role/tabIndex → add role + key handler stub
  s = s.replace(/<div([^>]*?)onClick=({[^}]+}|{[^}]+}|\{[^\}]+\})/g, (m, attrs, handler) => {
    if (/role=|tabIndex=/.test(attrs)) return m;
    return `<div${attrs} role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' ') ${handler.replace(/^{|}$/g, '')}(e); }} onClick=${handler}`;
  });

  if (s !== before) {
    fs.writeFileSync(f, s);
    changed++;
    console.log(`✳️  updated ${path.relative(process.cwd(), f)}`);
  }
}
console.log(changed ? `✅ Modified ${changed} files` : '✅ No changes necessary');
