#!/usr/bin/env node
/**
 * Utility Opportunity Finder — v2 (detect-only, zero deps)
 * Extends detection to collection/date/object utilities.
 *
 * Usage:
 *   node scripts/find-utility-opportunities.mjs . --json > opps.json
 *   node scripts/find-utility-opportunities.mjs apps packages --include=src --exclude=.spec
 *   node scripts/find-utility-opportunities.mjs --list
 *
 * Notes:
 * - Pure regex heuristics (fast, monorepo-friendly).
 * - Tune RULES to match your code idioms over time.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, sep } from 'path';

/* ------------------------- args & filters ------------------------- */
function parseArgs(argv){const out={_:[]};for(let i=2;i<argv.length;i++){const a=argv[i];if(a.startsWith('--')){const[k,v]=a.split('=',2);if(v!==undefined)out[k]=v;else if(i+1<argv.length&&!argv[i+1].startsWith('-'))out[k]=argv[++i];else out[k]=true;}else out._.push(a);}return out;}
const ARGS = parseArgs(process.argv);
function csv(x, def=[]) { if(!x||typeof x!=='string') return def; return x.split(',').map(s=>s.trim()).filter(Boolean); }

const DEFAULT_IGNORES = ['node_modules','dist','build','.next','.turbo','coverage','.git','.cache','.eslintcache','.husky','.vscode','.idea'];
const ROOTS   = ARGS._.length ? ARGS._ : ['.'];
const INCLUDE = csv(ARGS['--include']);
const EXCLUDE = csv(ARGS['--exclude']);
const EXTS    = csv(ARGS['--ext'], ['.ts','.tsx','.js','.jsx','.mjs','.cjs']).map(s=>s.startsWith('.')?s.toLowerCase():'.'+s.toLowerCase());
const ONLY    = csv(ARGS['--only']);
const SKIP    = csv(ARGS['--skip']);
const JSON_OUTPUT = Boolean(ARGS['--json']);
const LIST_ONLY  = Boolean(ARGS['--list']);
const MAX_MATCHES_PER_FILE = Number(ARGS['--max-per-file'] ?? 100);
const MAX_FILE_SIZE_BYTES  = Number(ARGS['--max-file-bytes'] ?? 1024*1024);
const VERBOSE = Boolean(ARGS['--verbose']);

function help(){console.log(`Utility Opportunity Finder v2
Usage: node find-utility-opportunities.mjs [roots...] [options]
  --include a,b       Only paths containing ANY of these substrings
  --exclude a,b       Exclude paths containing ANY of these substrings
  --ext ts,tsx,...    Extensions (default: ts,tsx,js,jsx,mjs,cjs)
  --only names        Only run specific pattern names
  --skip names        Skip specific pattern names
  --json              JSON output
  --list              List pattern names and exit
  --verbose           Extra logs
`);}
if (ARGS['--help']||ARGS['-h']) { help(); process.exit(0); }

/* ---------------------------- rules ---------------------------- */
/** Heuristics = “if you see manual X, suggest utility Y”.  */
const RULES = [
  /* ===== Date utilities ===== */
  {
    name: 'Manual date validity check',
    re: [ /\binstanceof\s+Date\b\s*&&\s*isFinite\(/g, /\btypeof\s+[^)]+===\s*['"]string['"]\s*&&\s*new\s+Date\(/gi ],
    suggestion: 'Use isValidDate(value) and normalizeDate(date).',
    utility: 'isValidDate | normalizeDate'
  },
  {
    name: 'Manual add/subtract days',
    re: [ /\bnew\s+Date\s*\(\s*[^)]+\s*\+\s*(24\s*\*\s*60\s*\*\s*60\s*\*\s*1000)\s*\*\s*[-+]?\d+\s*\)/g ],
    suggestion: 'Use addDaysToDate()/subtractDaysFromDate().',
    utility: 'addDaysToDate | subtractDaysFromDate'
  },
  {
    name: 'Manual month math (setMonth / +/- 1)',
    re: [ /\.\s*setMonth\s*\(/g, /\bnew\s+Date\s*\([^)]*\)\s*;\s*[^;]*\.\s*setMonth\s*\(/g ],
    suggestion: 'Use addMonthsToDate()/subtractMonthsFromDate() and getStart/EndOfMonth().',
    utility: 'addMonthsToDate | subtractMonthsFromDate | getStartOfMonth | getEndOfMonth'
  },
  {
    name: 'Manual date range check',
    re: [ /\bdate\s*>=\s*start\s*&&\s*date\s*<=\s*end\b/gi ],
    suggestion: 'Use isDateInRange(date, start, end).',
    utility: 'isDateInRange'
  },

  /* ===== Collection utilities ===== */
  {
    name: 'Filter empty values (manual)',
    re: [ /\.filter\s*\(\s*\w+\s*=>\s*\w+\s*!=\s*null\s*\)/gi, /\.filter\s*\(\s*\w+\s*=>\s*\w+\s*!==\s*undefined\s*\)/g ],
    suggestion: 'Use filterEmpty()/filterNonNull().',
    utility: 'filterEmpty | filterNonNull'
  },
  {
    name: 'Filter by property predicate (inline)',
    re: [ /\.filter\s*\(\s*\w+\s*=>\s*\w+\.[A-Za-z_$][\w$]*\s*===?\s*[^)]+\)/g ],
    suggestion: 'Use filterByProperty(array, key, value).',
    utility: 'filterByProperty'
  },
  {
    name: 'Multiple predicates chained',
    re: [ /\.filter\([^)]*\)\.filter\([^)]*\)/g ],
    suggestion: 'Use filterByMultiple([...predicates]).',
    utility: 'filterByMultiple'
  },
  {
    name: 'Manual groupBy with reduce',
    re: [ /\.reduce\s*\(\s*\(\s*\w+,\s*\w+\s*\)\s*=>\s*\{\s*([^}]|}\s*else\s*\{)*\}\s*,\s*\{\}\s*\)/g ],
    suggestion: 'Use groupBy(array, keyFn).',
    utility: 'groupBy'
  },
  {
    name: 'Manual “top N” via sort+slice',
    re: [ /\.sort\s*\([^)]*\)\.slice\s*\(\s*0\s*,\s*\w+\s*\)/g ],
    suggestion: 'Use getTopByField() or topKBy().',
    utility: 'getTopByField | topKBy'
  },
  {
    name: 'Manual length/emptiness checks',
    re: [ /\.length\s*===\s*0\b/g, /\.length\s*>\s*0\b/g ],
    suggestion: 'Use isEmpty()/hasItems()/getLength().',
    utility: 'isEmpty | hasItems | getLength'
  },

  /* ===== Object utilities ===== */
  {
    name: 'Manual path get (split . / checks)',
    re: [ /(['"][^'"]+['"])\s*\.split\(['"]\.[^)]*\)\s*\.reduce/g, /(\w+)\s*&&\s*\1\[[^\]]+\](?:\s*&&\s*\1\[[^\]]+\])+/g ],
    suggestion: 'Use getPath(obj, "a.b[0].c", def).',
    utility: 'getPath'
  },
  {
    name: 'Manual path set with guards',
    re: [ /\bif\s*\(\s*!?\w+\s*\)\s*\w+\s*=\s*\{\}\s*;[^;]+(\.\w+|\[\d+\])\s*=/g ],
    suggestion: 'Use setPath()/updatePath().',
    utility: 'setPath | updatePath'
  },
  {
    name: 'Manual deep equality',
    re: [ /\bJSON\.stringify\(\s*\w+\s*\)\s*===\s*JSON\.stringify\(\s*\w+\s*\)/g ],
    suggestion: 'Use isEqual(a,b) for deep equality (handles edge cases).',
    utility: 'isEqual'
  },
  {
    name: 'Manual empty object check',
    re: [ /\bObject\.keys\(\s*\w+\s*\)\.length\s*===\s*0\b/g ],
    suggestion: 'Use isObjectEmpty(obj).',
    utility: 'isObjectEmpty'
  },
  {
    name: 'Manual fromPairs/toPairs/invert',
    re: [ /\bObject\.entries\(/g, /\bObject\.fromEntries\(/g ],
    suggestion: 'Use toPairs()/mapEntries()/invert()/fromKeys().',
    utility: 'toPairs | mapEntries | invert | fromKeys'
  },

  /* ===== Your earlier money/tax detectors (kept) ===== */
  {
    name: 'Manual Rounding (basic)',
    re: [
      /Math\.round\s*\(\s*[^()]+?\s*\*\s*100\s*\)\s*\/\s*100\b/g,
      /Math\.round\s*\(\s*\(\s*[^()]+?\s*\+\s*Number\.EPSILON\s*\)\s*\*\s*100\s*\)\s*\/\s*100\b/g,
    ],
    suggestion: 'Use round2(), round2HalfUp(), or round2Bankers().',
    utility: 'round2 | round2HalfUp | round2Bankers'
  },
  {
    name: 'toFixed for Money',
    re: [ /\.toFixed\s*\(\s*(2|3)\s*\)/g ],
    suggestion: 'Avoid toFixed() for money. Use roundCurrency()/roundAmount().',
    utility: 'roundCurrency | roundAmount'
  },
].map(x => ({ ...x, type: 'pattern' }));

if (LIST_ONLY) { console.log(RULES.map(r=>r.name).join('\n')); process.exit(0); }

/* --------------------------- scanning core --------------------------- */
function pathHasAnySegment(p, segs){return segs.some(s=>p.includes(s));}
function shouldIgnore(full){ return full.split(sep).some(p=>DEFAULT_IGNORES.includes(p)); }
function shouldInclude(full){ return INCLUDE.length? pathHasAnySegment(full, INCLUDE) : true; }
function shouldExclude(full){ return EXCLUDE.length && pathHasAnySegment(full, EXCLUDE); }

function* walk(dir){
  let ents=[]; try{ ents = readdirSync(dir,{withFileTypes:true}); } catch { return; }
  for(const e of ents){
    const full = join(dir, e.name);
    if (shouldIgnore(full) || shouldExclude(full)) continue;
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && EXTS.includes(extname(e.name).toLowerCase())) yield full;
  }
}

function lineIndex(s){const a=[0];for(let i=0;i<s.length;i++) if(s.charCodeAt(i)===10) a.push(i+1); return a;}
function idxToLineCol(idx,pos){let lo=0,hi=idx.length-1;while(lo<=hi){const m=(lo+hi)>>1;if(idx[m]<=pos)lo=m+1;else hi=m-1;}const line=hi+1;const col=pos-(idx[hi]??0)+1;return{line,column:col};}
function snippet(s,st,en,max=180){const S=Math.max(0,st-40),E=Math.min(s.length,en+40);const raw=s.slice(S,E).replace(/\s+/g,' ').trim();return raw.length>max?raw.slice(0,max-1)+'…':raw;}

function scanFile(file){
  let txt,st; try{ st = statSync(file); if(st.size>MAX_FILE_SIZE_BYTES) return []; txt = readFileSync(file,'utf8'); } catch { return []; }
  if (!txt || /\x00/.test(txt)) return [];
  const idx = lineIndex(txt);
  const finds = [];
  for(const rule of RULES){
    if (ONLY.length && !ONLY.includes(rule.name)) continue;
    if (SKIP.length &&  SKIP.includes(rule.name)) continue;

    for(const re0 of rule.re){
      const re = new RegExp(re0.source, re0.flags.includes('g')?re0.flags:re0.flags+'g');
      let m, c=0;
      while((m=re.exec(txt)) && c<MAX_MATCHES_PER_FILE){
        const { line, column } = idxToLineCol(idx, m.index);
        finds.push({ file, line, column, type: rule.type, name: rule.name, suggestion: rule.suggestion, utility: rule.utility, snippet: snippet(txt, m.index, m.index+m[0].length) });
        c++; if (re.lastIndex === m.index) re.lastIndex++;
      }
    }
  }
  return finds;
}

/* ------------------------------ run ------------------------------ */
let results = [];
for(const root of ROOTS) for(const f of walk(root)) if(shouldInclude(f)) results.push(...scanFile(f));
results.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line||a.column-b.column);

if (LIST_ONLY){ console.log(RULES.map(r=>r.name).join('\n')); process.exit(0); }
if (JSON_OUTPUT){ console.log(JSON.stringify({version:2,count:results.length,opportunities:results},null,2)); process.exit(0); }

if (results.length===0){
  console.log('✅ No obvious opportunities found.');
  console.log('   Tips: try --include=packages,apps or widen --ext, or run --list.');
  process.exit(0);
}

console.log(`📊 Found ${results.length} opportunities:\n`);
const byName = results.reduce((a,x)=>((a[x.name]??=[]).push(x),a),{});
for(const name of Object.keys(byName).sort((a,b)=>byName[b].length-byName[a].length)){
  const group = byName[name];
  console.log(`• ${name} (${group.length})`);
  console.log(`  ↳ Use: ${group[0].utility}`);
  console.log(`  ↳ Suggestion: ${group[0].suggestion}`);
  for(const it of group) console.log(`  - ${it.file}:${it.line}:${it.column}  ${it.snippet}`);
  console.log('');
}
