#!/usr/bin/env node
/**
 * Utility Opportunity Finder (detect-only, zero deps)
 * - Finds manual patterns that should use your accounting utilities
 * - Robust arg parsing: supports --k v and --k=v
 * - Scans "." by default (monorepo-friendly)
 */

import { readFileSync, readdirSync, lstatSync, statSync } from 'fs';
import { join, extname, sep } from 'path';
import { execSync } from 'child_process';

/* ------------------------- Args & configuration ------------------------- */

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, vMaybe] = a.split('=', 2);
      if (vMaybe !== undefined) out[k] = vMaybe;
      else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) out[k] = argv[++i];
      else out[k] = true;
    } else {
      out._.push(a);
    }
  }
  return out;
}
const ARGS = parseArgs(process.argv);

function csv(x, def = []) {
  if (!x || typeof x !== 'string') return def;
  return x.split(',').map(s => s.trim()).filter(Boolean);
}

const DEFAULT_IGNORES = [
  'node_modules','dist','build','.next','.turbo','coverage','.git','.cache','.eslintcache','.husky','.vscode','.idea'
];

const ROOTS = ARGS._.length ? ARGS._ : ['.']; // default: monorepo root
const INCLUDE = csv(ARGS['--include']);       // substring match
const EXCLUDE = csv(ARGS['--exclude']);
const EXTRA_IGNORES = csv(ARGS['--ignore']);
const EXTS = csv(ARGS['--ext'], ['.ts','.tsx','.js','.jsx','.mjs','.cjs']).map(s => s.startsWith('.') ? s.toLowerCase() : `.${s.toLowerCase()}`);
const JSON_OUTPUT = Boolean(ARGS['--json']);
const LIST_ONLY = Boolean(ARGS['--list']);
const ONLY = csv(ARGS['--only']);
const SKIP = csv(ARGS['--skip']);
const GIT_SINCE = ARGS['--since'];            // e.g. 2025-09-01
const MAX_MATCHES_PER_FILE = Number(ARGS['--max-per-file'] ?? process.env.MAX_MATCHES_PER_FILE ?? 80);
const MAX_FILE_SIZE_BYTES = Number(ARGS['--max-file-bytes'] ?? process.env.MAX_FILE_SIZE_BYTES ?? 512*1024);
const VERBOSE = Boolean(ARGS['--verbose']);

function help() {
  console.log(`
Utility Opportunity Finder (detect-only)

Usage:
  node find-utility-opportunities.mjs [roots...] [options]

Common:
  --include a,b          Only paths containing ANY of these substrings
  --exclude a,b          Exclude paths containing ANY of these substrings
  --ignore a,b           Extra ignores (dir/file segments)
  --ext ts,tsx,js,jsx    Extensions (default: ts,tsx,js,jsx,mjs,cjs)
  --since YYYY-MM-DD     Only files changed since this date (git)
  --only names           Only run specific pattern names
  --skip names           Skip specific pattern names
  --json                 JSON output
  --list                 List pattern names and exit
  --verbose              Print debug info
`);
}
if (ARGS['--help'] || ARGS['-h']) { help(); process.exit(0); }

/* ------------------------------ Pattern set ------------------------------ */
/* Tweak freely as your code evolves. All run as global regexes. */
const RULES = [
  // Rounding
  {
    name: 'Manual Rounding (basic)',
    re: [
      /Math\.round\s*\(\s*[^()]+?\s*\*\s*100\s*\)\s*\/\s*100\b/g,
      /Math\.round\s*\(\s*\(\s*[^()]+?\s*\+\s*Number\.EPSILON\s*\)\s*\*\s*100\s*\)\s*\/\s*100\b/g,
    ],
    suggestion: 'Use round2(), round2HalfUp(), or round2Bankers()',
    utility: 'round2 | round2HalfUp | round2Bankers'
  },
  {
    name: 'Custom Rounders (round2/toCents)',
    re: [
      /\bfunction\s+round2\s*\(\s*\w+\s*:\s*number\s*\)/gi,
      /\bconst\s+round2\s*=\s*\(\s*\w+\s*:\s*number\s*\)\s*=>/gi,
      /\bfunction\s+toCents\s*\(\s*\w+\s*:\s*number\s*\)/gi,
      /\bconst\s+toCents\s*=\s*\(\s*\w+\s*:\s*number\s*\)\s*=>/gi,
    ],
    suggestion: 'Use round2()/toMinorUnits() from utilities',
    utility: 'round2 | toMinorUnits'
  },
  { // Money rounding by toFixed
    name: 'toFixed for Money',
    re: [/\.toFixed\s*\(\s*(2|3)\s*\)/g],
    suggestion: 'Avoid toFixed() for money. Use roundCurrency()/roundAmount().',
    utility: 'roundCurrency | roundAmount'
  },

  // Minor units
  {
    name: 'Manual Minor Units Conversion',
    re: [
      /BigInt\s*\(\s*Math\.round\s*\(\s*[^()]+?\s*\*\s*100\s*\)\s*\)/g,
      /\bMath\.round\s*\(\s*[^()]+?\s*\*\s*100\s*\)\b/g,
      /\b\*\s*100n\b/g,
    ],
    suggestion: 'Use toMinorUnits()/fromMinorUnits()',
    utility: 'toMinorUnits | fromMinorUnits'
  },

  // Currency decimals duplication
  {
    name: 'Manual Currency Decimals',
    re: [
      /\bnew\s+Map\s*\(\s*\[\s*\[\s*['"`][A-Z]{3}['"`]\s*,\s*\d+\s*\]/g,
      /\b(?:CURRENCY_?DECIMALS|DECIMALS)\s*[:=][\s\S]{0,200}?(USD|EUR|JPY|MYR|SGD)[\s\S]{0,50}?(0|2)\b/gi,
    ],
    suggestion: 'Use getCurrencyDecimalsStrict() or CURRENCY_DECIMALS',
    utility: 'getCurrencyDecimalsStrict | CURRENCY_DECIMALS'
  },

  // Inline tax
  {
    name: 'Manual Tax Calculations',
    re: [
      /reduce\s*\(\s*\(\s*\w+\s*,\s*\w+\s*\)\s*=>\s*\w+\s*\+\s*[^)+;]*\b(tax|taxRate|vat|gst)\b[^)]*\)\s*,\s*0\s*\)/gi,
      /\b(lineTotal|amount|subtotal)\s*\*\s*(tax|taxRate|vat|gst)\b/gi,
    ],
    suggestion: 'Use calculateTax()/calculateTaxInclusive()',
    utility: 'calculateTax | calculateTaxInclusive'
  },

  // AccountType enum misuse
  {
    name: 'AccountType Enum Misuse',
    re: [
      /import\s+type\s*{\s*AccountType\s*}\s*from\s*['"][^'"]+accounting-utilities[^'"]*['"][^]*?AccountType\.[A-Z_]+/g,
    ],
    suggestion: 'Import value shim: `import { AccountType as AccountTypeValue } ...`',
    utility: 'AccountType (value shim)'
  },

  // Object utils
  {
    name: 'Unsafe Object Access',
    re: [ /[A-Za-z_$][\w$]*\s*\[\s*[^]\n]+\s*\]\s*(?:\.\??|\[\??)/g ],
    suggestion: 'Consider safeGet() for unknown shapes',
    utility: 'safeGet'
  },
  {
    name: 'Manual Object Filtering (undefined)',
    re: [ /Object\.fromEntries\([^)]*filter[^)]*undefined/gi ],
    suggestion: 'Use omitUndefined()',
    utility: 'omitUndefined'
  },
  {
    name: 'Manual Object Type Check',
    re: [ /typeof\s+[^)]+===\s*['"]object['"]\s*&&\s*!Array\.isArray/gi ],
    suggestion: 'Use isRecord()',
    utility: 'isRecord'
  },
  {
    name: 'Manual Property Existence',
    re: [ 
      /\.hasOwnProperty\s*\(/g,
      /Object\.hasOwn\s*\(/g,
      /if\s*\(\s*[A-Za-z_$][\w$]*\s+in\s+[A-Za-z_$][\w$]*\s*\)/g
    ],
    suggestion: 'Use hasKey() for type-safe checks',
    utility: 'hasKey'
  },
  {
    name: 'Manual Non-Empty String',
    re: [ /typeof\s+[^)]+===\s*['"]string['"]\s*&&\s*[^)]+\.trim\(\)\.length\s*>\s*0/gi ],
    suggestion: 'Use isNonEmpty()',
    utility: 'isNonEmpty'
  },

  // Account code / period helpers (lightweight detectors)
  {
    name: 'Manual Account Code Normalize',
    re: [ /\.trim\(\)\.toUpperCase\(\)/g ],
    suggestion: 'Use normalizeAccountCode()',
    utility: 'normalizeAccountCode'
  },
  {
    name: 'Manual Hierarchical Code Parsing',
    re: [ /split\s*\(\s*['"`]-['"`]\s*\)\s*\.\s*length/gi ],
    suggestion: 'Use parseHierarchicalAccountCode()',
    utility: 'parseHierarchicalAccountCode'
  },
  {
    name: 'Manual Period Parsing',
    re: [ /\b(period|acctPeriod|accountPeriod|monthStr)\b[^;\n]{0,60}\.split\(['"-]\)[^;\n]{0,60}\bmap\b[^;\n]{0,60}\bNumber\b/gi ],
    suggestion: 'Use parseAccountingPeriod()',
    utility: 'parseAccountingPeriod'
  },
].map(x => ({ ...x, type: 'pattern' }));

if (LIST_ONLY) {
  console.log(RULES.map(r => r.name).join('\n'));
  process.exit(0);
}

/* ------------------------------ Scan helpers ------------------------------ */

function pathHasAnySegment(p, segs) { return segs.some(s => p.includes(s)); }

function shouldIgnore(fullPath) {
  const parts = fullPath.split(sep);
  return parts.some(p => DEFAULT_IGNORES.includes(p) || EXTRA_IGNORES.includes(p));
}

function shouldInclude(fullPath) {
  if (!INCLUDE.length) return true;
  return pathHasAnySegment(fullPath, INCLUDE);
}

function shouldExclude(fullPath) {
  return EXCLUDE.length && pathHasAnySegment(fullPath, EXCLUDE);
}

function* walk(dir) {
  if (shouldIgnore(dir) || shouldExclude(dir)) return;
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (shouldIgnore(full) || shouldExclude(full)) continue;
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && EXTS.includes(extname(e.name).toLowerCase())) yield full;
  }
}

function lineIndex(content) {
  const idx = [0];
  for (let i = 0; i < content.length; i++) if (content.charCodeAt(i) === 10) idx.push(i + 1);
  return idx;
}
function idxToLineCol(idxArr, pos) {
  let lo = 0, hi = idxArr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (idxArr[mid] <= pos) lo = mid + 1; else hi = mid - 1;
  }
  const line = hi + 1;
  const col = pos - (idxArr[hi] ?? 0) + 1;
  return { line, column: col };
}
function snippet(content, start, end, max = 180) {
  const s = Math.max(0, start - 40);
  const e = Math.min(content.length, end + 40);
  const raw = content.slice(s, e).replace(/\s+/g, ' ').trim();
  return raw.length > max ? raw.slice(0, max - 1) + '…' : raw;
}

function scanFile(file) {
  let content;
  try {
    const st = statSync(file);
    if (st.size > MAX_FILE_SIZE_BYTES) return [];
    content = readFileSync(file, 'utf8');
  } catch { return []; }
  if (!content || /\x00/.test(content)) return [];

  const idx = lineIndex(content);
  const finds = [];

  for (const rule of RULES) {
    if (ONLY.length && !ONLY.includes(rule.name)) continue;
    if (SKIP.length && SKIP.includes(rule.name)) continue;

    let count = 0;
    for (const re0 of rule.re) {
      const re = new RegExp(re0.source, re0.flags.includes('g') ? re0.flags : re0.flags + 'g');
      let m;
      while ((m = re.exec(content)) && count < MAX_MATCHES_PER_FILE) {
        const { line, column } = idxToLineCol(idx, m.index);
        finds.push({
          file, line, column,
          type: rule.type,
          name: rule.name,
          suggestion: rule.suggestion,
          utility: rule.utility,
          snippet: snippet(content, m.index, m.index + m[0].length),
        });
        count++;
        if (re.lastIndex === m.index) re.lastIndex++; // avoid zero-width loops
      }
    }
  }
  return finds;
}

/* --------------------------------- Runner -------------------------------- */

function expandRoots(roots) {
  if (!GIT_SINCE) return roots;
  try {
    const out = execSync(`git log --since="${GIT_SINCE}" --name-only --pretty=format:`).toString();
    const files = Array.from(new Set(out.split('\n').map(s => s.trim()).filter(Boolean)));
    const dirs = Array.from(new Set(files.map(p => p.split(sep).slice(0, -1).join(sep) || '.')));
    return dirs;
  } catch {
    return roots;
  }
}

const roots = expandRoots(ROOTS);
if (VERBOSE) {
  console.log('Roots:', roots);
  console.log('Include:', INCLUDE, 'Exclude:', EXCLUDE, 'Exts:', EXTS);
}

let results = [];
for (const r of roots) for (const f of walk(r)) results.push(...scanFile(f));
results.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);

if (LIST_ONLY) {
  console.log(RULES.map(r => r.name).join('\n')); process.exit(0);
}

if (JSON_OUTPUT) {
  console.log(JSON.stringify({ version: 1, count: results.length, opportunities: results }, null, 2));
  process.exit(0);
}

if (results.length === 0) {
  console.log('✅ No obvious opportunities found.');
  console.log('   Tips:');
  console.log('   • Pass explicit roots: `node find-utility-opportunities.mjs packages apps`');
  console.log('   • Or use filters: `--include=packages,apps` (now both --k v and --k=v work)');
  console.log('   • Widen extensions: `--ext=ts,tsx,js,jsx,mjs,cjs`');
  console.log('   • Show patterns: `--list`');
  process.exit(0);
}

console.log(`📊 Found ${results.length} opportunities:\n`);
const byName = results.reduce((a, x) => ((a[x.name] ||= []).push(x), a), {});
for (const name of Object.keys(byName).sort((a,b)=>byName[b].length-byName[a].length)) {
  const group = byName[name];
  console.log(`• ${name} (${group.length})`);
  console.log(`  ↳ Use: ${group[0].utility}`);
  console.log(`  ↳ Suggestion: ${group[0].suggestion}`);
  for (const it of group) console.log(`  - ${it.file}:${it.line}:${it.column}  ${it.snippet}`);
  console.log('');
}