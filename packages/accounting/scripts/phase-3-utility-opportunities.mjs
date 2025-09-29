#!/usr/bin/env node
/**
 * Phase 3 Utility Opportunity Finder — v1
 * Detects opportunities for async, error handling, and performance utilities.
 *
 * Usage:
 *   node scripts/phase-3-utility-opportunities.mjs . --json > phase3-opps.json
 *   node scripts/phase-3-utility-opportunities.mjs apps packages --include=src --exclude=.spec
 *   node scripts/phase-3-utility-opportunities.mjs --list
 *
 * Notes:
 * - Pure regex heuristics (fast, monorepo-friendly).
 * - Focused on Phase 3 utilities: async operations, error handling, performance monitoring.
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

function help(){console.log(`Phase 3 Utility Opportunity Finder v1
Usage: node phase-3-utility-opportunities.mjs [roots...] [options]
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

/* ---------------------------- Phase 3 Rules ---------------------------- */
/** Heuristics = "if you see manual X, suggest Phase 3 utility Y".  */
const RULES = [
  /* ===== Async & Promise Utilities ===== */
  {
    name: 'Manual Promise.all with error handling',
    re: [
      /\bPromise\.all\s*\([^)]*\)\.catch/gi,
      /\bPromise\.all\s*\([^)]*\)\.then.*\.catch/gi,
      /\btry.*Promise\.all/gi,
      /\bPromise\.all.*catch.*error/gi
    ],
    suggestion: 'Use parallel() with built-in error handling and concurrency control.',
    utility: 'parallel'
  },
  {
    name: 'Manual Promise.allSettled usage',
    re: [
      /\bPromise\.allSettled\s*\(/gi,
      /\bPromise\.allSettled.*then.*filter/gi,
      /\bPromise\.allSettled.*map.*status/gi
    ],
    suggestion: 'Use allSettled() helper for structured results.',
    utility: 'allSettled'
  },
  {
    name: 'Manual delay/timeout implementation',
    re: [
      /\bsetTimeout.*Promise/gi,
      /\bnew\s+Promise.*setTimeout/gi,
      /\bdelay.*function/gi,
      /\bwait.*milliseconds/gi
    ],
    suggestion: 'Use delay() or timeout() utilities for consistent async timing.',
    utility: 'delay | timeout'
  },
  {
    name: 'Manual retry logic',
    re: [
      /\bfor.*let.*i.*retry/gi,
      /\bwhile.*retry.*attempt/gi,
      /\bretry.*catch.*error/gi,
      /\battempt.*maxRetries/gi
    ],
    suggestion: 'Use retry() or retryWithBackoff() for robust retry mechanisms.',
    utility: 'retry | retryWithBackoff'
  },
  {
    name: 'Manual rate limiting',
    re: [
      /\brate.*limit.*requests/gi,
      /\bthrottle.*requests/gi,
      /\bmaxRequests.*window/gi,
      /\brequestQueue.*delay/gi
    ],
    suggestion: 'Use createRateLimiter() or processWithRateLimit() for API rate limiting.',
    utility: 'createRateLimiter | processWithRateLimit'
  },
  {
    name: 'Manual debouncing implementation',
    re: [
      /\bclearTimeout.*setTimeout/gi,
      /\bdebounce.*function/gi,
      /\btimeout.*clearTimeout/gi,
      /\bdelay.*clearTimeout/gi
    ],
    suggestion: 'Use debounce() or debounceWithMetrics() for input debouncing.',
    utility: 'debounce | debounceWithMetrics'
  },
  {
    name: 'Manual throttling implementation',
    re: [
      /\bthrottle.*function/gi,
      /\blastCall.*timestamp/gi,
      /\bthrottle.*delay/gi,
      /\bthrottle.*leading.*trailing/gi
    ],
    suggestion: 'Use throttle() or throttleWithMetrics() for function throttling.',
    utility: 'throttle | throttleWithMetrics'
  },
  {
    name: 'Manual memoization',
    re: [
      /\bcache.*Map.*get.*set/gi,
      /\bmemoize.*function/gi,
      /\bcache.*has.*return/gi,
      /\bif.*cache.*has/gi
    ],
    suggestion: 'Use memoize() with TTL and size limits for function memoization.',
    utility: 'memoize'
  },
  {
    name: 'Manual queue processing',
    re: [
      /\bqueue.*shift.*push/gi,
      /\bqueue.*process.*item/gi,
      /\bqueue.*length.*while/gi,
      /\bqueue.*FIFO/gi
    ],
    suggestion: 'Use createQueue() for efficient queue processing with concurrency control.',
    utility: 'createQueue'
  },
  {
    name: 'Manual pool management',
    re: [
      /\bpool.*available.*busy/gi,
      /\bpool.*acquire.*release/gi,
      /\bpool.*maxSize/gi,
      /\bpool.*waiting/gi
    ],
    suggestion: 'Use createPool() for resource pool management with automatic cleanup.',
    utility: 'createPool'
  },
  {
    name: 'Manual sequential chaining',
    re: [/\bfor\s*\(\s*(const|let)\s+\w+\s+of\s+\w+\s*\)\s*\{\s*await\s+/gi],
    suggestion: 'Use sequential() to process items one-by-one.',
    utility: 'sequential'
  },
  {
    name: 'Manual racing for first result',
    re: [/\bPromise\.race\s*\(/gi],
    suggestion: 'Use race() helper for clarity and typed results.',
    utility: 'race'
  },
  {
    name: 'Manual batch processing',
    re: [/\b(batch|chunk)s?\b.*\bprocess/gi],
    suggestion: 'Use batchProcess() to handle batches with concurrency.',
    utility: 'batchProcess'
  },

  /* ===== Error Handling Utilities ===== */
  {
    name: 'Manual try-catch with custom error creation',
    re: [
      /\btry.*catch.*new\s+Error/gi,
      /\bthrow\s+new\s+Error/gi,
      /\bcatch.*error.*message/gi,
      /\bthrow.*Error.*message/gi
    ],
    suggestion: 'Use AccountingError, ValidationError, BusinessRuleError, or AuthorizationError for structured error handling.',
    utility: 'AccountingError | ValidationError | BusinessRuleError | AuthorizationError'
  },
  {
    name: 'Manual error context creation',
    re: [
      /\berror.*context.*userId/gi,
      /\berror.*metadata.*timestamp/gi,
      /\berror.*operation.*data/gi,
      /\berror.*stack.*timestamp/gi
    ],
    suggestion: 'Use extractErrorContext() for structured error context.',
    utility: 'extractErrorContext'
  },
  {
    name: 'Manual retry with error rules',
    re: [
      /\bretry.*on.*(ECONN|ETIMEOUT|429|5\d{2})/gi,
      /\bif\s*\(\s*error\.?(code|status)/gi
    ],
    suggestion: 'Use retryOperation() to centralize retryable conditions.',
    utility: 'retryOperation'
  },
  {
    name: 'Manual circuit breaker pattern',
    re: [
      /\bcircuit.*breaker/gi,
      /\bfailure.*threshold/gi,
      /\bcircuit.*open.*closed/gi,
      /\bhalf.*open.*circuit/gi
    ],
    suggestion: 'Use createCircuitBreaker() for resilient service calls with automatic recovery.',
    utility: 'createCircuitBreaker'
  },
  {
    name: 'Manual timeout handling',
    re: [
      /\bsetTimeout.*reject/gi,
      /\btimeout.*Promise.*reject/gi,
      /\btimeout.*error.*message/gi,
      /\bPromise.*race.*timeout/gi
    ],
    suggestion: 'Use timeout() or TimeoutError for consistent timeout handling.',
    utility: 'timeout | TimeoutError'
  },
  {
    name: 'Manual error logging',
    re: [
      /\bconsole\.error\b/gi,
      /\blogger\.(error|fatal)\b/gi
    ],
    suggestion: 'Use handleAsyncError() or formatErrorForUser() to standardize logging & UX.',
    utility: 'handleAsyncError | formatErrorForUser'
  },
  {
    name: 'Manual error fallback/recovery',
    re: [
      /\bfallback\s*[:=]\s*/gi,
      /\bgraceful\s+degradation/gi,
      /\brecover(?:y)?\b.*\bdefault/gi
    ],
    suggestion: 'Use withFallback() to wrap operations with defaults.',
    utility: 'withFallback'
  },
  {
    name: 'Manual error-timeout wrapper',
    re: [
      /\bPromise\.race\s*\(\s*\[\s*[^,\]]+,\s*new\s+Promise\s*\(\s*[^)]*setTimeout/gi,
      /\btimeout\s*[:=]\s*\d{2,}/gi
    ],
    suggestion: 'Use withTimeout() or timeout() for consistent timeout handling.',
    utility: 'withTimeout | timeout'
  },

  /* ===== Performance Utilities ===== */
  {
    name: 'Manual performance timing',
    re: [
      /\bDate\.now\(\).*Date\.now\(\)/gi,
      /\bperformance\.now\(\).*performance\.now\(\)/gi,
      /\bconsole\.time.*console\.timeEnd/gi,
      /\btiming.*start.*end/gi
    ],
    suggestion: 'Use measureTime() / PerformanceTimer for accurate measurement.',
    utility: 'measureTime | PerformanceTimer'
  },
  {
    name: 'Manual async performance timing (wrapper missing)',
    re: [
      /\bconst\s+start\s*=\s*performance?\.?now?\(\)\s*;?\s*await\s+/gi,
      /\bconsole\.time\([^)]+\)\s*;?\s*await\s+.*\bconsole\.timeEnd\([^)]+\)/gi
    ],
    suggestion: 'Use measureAsyncTime() to measure awaited work.',
    utility: 'measureAsyncTime'
  },
  {
    name: 'Manual performance-aware rate limiting',
    re: [
      /\b(rate|throttle).*(perf|slow|heavy)/gi
    ],
    suggestion: 'Use processWithPerformanceRateLimit() for load-aware throttling.',
    utility: 'processWithPerformanceRateLimit'
  },
  {
    name: 'Manual async performance timing',
    re: [
      /\bconst\s+start.*Date\.now.*await.*const\s+end/gi,
      /\bperformance\.now.*await.*performance\.now/gi,
      /\btiming.*async.*function/gi,
      /\bmeasure.*async.*duration/gi
    ],
    suggestion: 'Use measureAsyncTime() for async operation performance measurement.',
    utility: 'measureAsyncTime'
  },
  {
    name: 'Manual caching implementation',
    re: [
      /\bcache.*Map.*get.*set.*delete/gi,
      /\bcache.*has.*return.*set/gi,
      /\bcache.*size.*limit/gi,
      /\bcache.*TTL.*expire/gi
    ],
    suggestion: 'Use Cache class or createCache() for efficient caching with TTL and size limits.',
    utility: 'Cache | createCache'
  },
  {
    name: 'Manual batch processing',
    re: [
      /\bfor.*let.*i.*batchSize/gi,
      /\bchunk.*array.*process/gi,
      /\bbatch.*process.*items/gi,
      /\bprocess.*in.*batches/gi
    ],
    suggestion: 'Use batchProcessItems() for efficient batch processing with concurrency control.',
    utility: 'batchProcessItems'
  },
  {
    name: 'Manual memory monitoring',
    re: [
      /\bprocess\.memoryUsage\(\)/gi,
      /\bmemory.*heap.*rss/gi,
      /\bmemory.*usage.*monitor/gi,
      /\bmemory.*leak.*detection/gi
    ],
    suggestion: 'Use getMemoryUsage(), MemoryMonitor, or createMemoryMonitor() for memory tracking.',
    utility: 'getMemoryUsage | MemoryMonitor | createMemoryMonitor'
  },
  {
    name: 'Manual performance profiling',
    re: [
      /\bprofile.*start.*stop/gi,
      /\bprofiling.*performance/gi,
      /\bprofile.*mark.*measure/gi,
      /\bperformance.*profile/gi
    ],
    suggestion: 'Use PerformanceProfiler or createProfiler() for application performance profiling.',
    utility: 'PerformanceProfiler | createProfiler'
  },
  {
    name: 'Manual garbage collection',
    re: [
      /\bgc\(\).*force/gi,
      /\bglobal\.gc\(\)/gi,
      /\bforce.*garbage.*collection/gi,
      /\bgc.*memory.*cleanup/gi
    ],
    suggestion: 'Use forceGC() for controlled garbage collection (Node.js only).',
    utility: 'forceGC'
  },
  {
    name: 'Manual performance metrics',
    re: [
      /\bmetrics.*duration.*count/gi,
      /\bperformance.*metrics.*collect/gi,
      /\bmetrics.*average.*min.*max/gi,
      /\bperformance.*statistics/gi
    ],
    suggestion: 'Use PerformanceProfiler.getStats() for comprehensive performance metrics.',
    utility: 'PerformanceProfiler.getStats'
  },

  /* ===== Legacy patterns from Phase 1 & 2 (kept for completeness) ===== */
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
if (JSON_OUTPUT){ console.log(JSON.stringify({version:3,count:results.length,opportunities:results},null,2)); process.exit(0); }

if (results.length===0){
  console.log('✅ No obvious Phase 3 utility opportunities found.');
  console.log('   Tips: try --include=packages,apps or widen --ext, or run --list.');
  process.exit(0);
}

console.log(`📊 Found ${results.length} Phase 3 utility opportunities:\n`);
const byName = results.reduce((a,x)=>((a[x.name]??=[]).push(x),a),{});
for(const name of Object.keys(byName).sort((a,b)=>byName[b].length-byName[a].length)){
  const group = byName[name];
  console.log(`• ${name} (${group.length})`);
  console.log(`  ↳ Use: ${group[0].utility}`);
  console.log(`  ↳ Suggestion: ${group[0].suggestion}`);
  for(const it of group) console.log(`  - ${it.file}:${it.line}:${it.column}  ${it.snippet}`);
  console.log('');
}
