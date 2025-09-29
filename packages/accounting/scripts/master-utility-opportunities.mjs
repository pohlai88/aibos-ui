#!/usr/bin/env node
/**
 * Master Utility Opportunity Finder — v1
 * Runs all three phases of utility opportunity detection and provides unified reporting.
 *
 * Usage:
 *   node scripts/master-utility-opportunities.mjs . --json > all-opps.json
 *   node scripts/master-utility-opportunities.mjs apps packages --include=src --exclude=.spec
 *   node scripts/master-utility-opportunities.mjs --phases=1,2,3 --list
 *   node scripts/master-utility-opportunities.mjs --phases=3 --only="Manual Promise.all"
 *
 * Notes:
 * - Orchestrates Phase 1, 2, and 3 opportunity finders
 * - Provides unified reporting and analysis
 * - Supports running individual phases or combinations
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, sep } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ------------------------- args & filters ------------------------- */
function parseArgs(argv){const out={_:[]};for(let i=2;i<argv.length;i++){const a=argv[i];if(a.startsWith('--')){const[k,v]=a.split('=',2);if(v!==undefined)out[k]=v;else if(i+1<argv.length&&!argv[i+1].startsWith('-'))out[k]=argv[++i];else out[k]=true;}else out._.push(a);}return out;}
const ARGS = parseArgs(process.argv);
function csv(x, def=[]) { if(!x||typeof x!=='string') return def; return x.split(',').map(s=>s.trim()).filter(Boolean); }

const ROOTS   = ARGS._.length ? ARGS._ : ['.'];
const INCLUDE = csv(ARGS['--include']);
const EXCLUDE = csv(ARGS['--exclude']);
const EXTS    = csv(ARGS['--ext'], ['.ts','.tsx','.js','.jsx','.mjs','.cjs']).map(s=>s.startsWith('.')?s.toLowerCase():'.'+s.toLowerCase());
const ONLY    = csv(ARGS['--only']);
const SKIP    = csv(ARGS['--skip']);
const PHASES  = csv(ARGS['--phases'], ['1','2','3']);
const JSON_OUTPUT = Boolean(ARGS['--json']);
const LIST_ONLY  = Boolean(ARGS['--list']);
const MAX_MATCHES_PER_FILE = Number(ARGS['--max-per-file'] ?? 100);
const MAX_FILE_SIZE_BYTES  = Number(ARGS['--max-file-bytes'] ?? 1024*1024);
const VERBOSE = Boolean(ARGS['--verbose']);
const SUMMARY_ONLY = Boolean(ARGS['--summary']);

function help(){console.log(`Master Utility Opportunity Finder v1
Usage: node master-utility-opportunities.mjs [roots...] [options]
  --include a,b       Only paths containing ANY of these substrings
  --exclude a,b       Exclude paths containing ANY of these substrings
  --ext ts,tsx,...    Extensions (default: ts,tsx,js,jsx,mjs,cjs)
  --only names        Only run specific pattern names
  --skip names        Skip specific pattern names
  --phases 1,2,3      Run specific phases (default: 1,2,3)
  --json              JSON output
  --list              List pattern names and exit
  --summary           Summary only (no detailed output)
  --verbose           Extra logs
`);}
if (ARGS['--help']||ARGS['-h']) { help(); process.exit(0); }

/* ---------------------------- phase runners ---------------------------- */
const PHASE_SCRIPTS = {
  '1': join(__dirname, 'phase-1-utility-opportunities.mjs'),
  '2': join(__dirname, 'phase-2-utility-opportunities.mjs'),
  '3': join(__dirname, 'phase-3-utility-opportunities.mjs')
};

const PHASE_NAMES = {
  '1': 'Core Utilities (Date, Collection, Object)',
  '2': 'Business Utilities (Financial, Validation, Formatting)',
  '3': 'Advanced Utilities (Async, Error Handling, Performance)'
};

function buildArgs(phase) {
  const args = [PHASE_SCRIPTS[phase]];
  
  // Add root directories
  args.push(...ROOTS);
  
  // Add filters
  if (INCLUDE.length) args.push(`--include=${INCLUDE.join(',')}`);
  if (EXCLUDE.length) args.push(`--exclude=${EXCLUDE.join(',')}`);
  if (EXTS.length) args.push(`--ext=${EXTS.join(',')}`);
  if (ONLY.length) args.push(`--only=${ONLY.join(',')}`);
  if (SKIP.length) args.push(`--skip=${SKIP.join(',')}`);
  
  // Add limits
  args.push(`--max-per-file=${MAX_MATCHES_PER_FILE}`);
  args.push(`--max-file-bytes=${MAX_FILE_SIZE_BYTES}`);
  
  // Add flags
  if (JSON_OUTPUT) args.push('--json');
  if (LIST_ONLY) args.push('--list');
  if (VERBOSE) args.push('--verbose');
  
  return args;
}

function runPhase(phase) {
  return new Promise((resolve, reject) => {
    const args = buildArgs(phase);
    const child = spawn('node', args, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Phase ${phase} failed with code ${code}: ${stderr}`));
      } else {
        resolve({ phase, stdout, stderr });
      }
    });
  });
}

/* ---------------------------- analysis ---------------------------- */
function analyzeResults(results) {
  const analysis = {
    totalOpportunities: 0,
    byPhase: {},
    byCategory: {},
    topPatterns: [],
    filesAffected: new Set(),
    recommendations: []
  };
  
  for (const result of results) {
    const data = JSON.parse(result.stdout);
    const phase = result.phase;
    
    analysis.byPhase[phase] = {
      name: PHASE_NAMES[phase],
      count: data.count,
      opportunities: data.opportunities || []
    };
    
    analysis.totalOpportunities += data.count;
    
    // Group by pattern name
    const byPattern = {};
    for (const opp of data.opportunities || []) {
      byPattern[opp.name] = (byPattern[opp.name] || 0) + 1;
      analysis.filesAffected.add(opp.file);
    }
    
    // Add to top patterns
    for (const [pattern, count] of Object.entries(byPattern)) {
      analysis.topPatterns.push({ pattern, count, phase });
    }
  }
  
  // Sort top patterns by count
  analysis.topPatterns.sort((a, b) => b.count - a.count);
  
  // Generate recommendations
  if (analysis.totalOpportunities > 0) {
    const topPhase = Object.entries(analysis.byPhase)
      .sort(([,a], [,b]) => b.count - a.count)[0];
    
    analysis.recommendations.push(
      `Focus on ${topPhase[1].name} - ${topPhase[1].count} opportunities found`
    );
    
    if (analysis.topPatterns.length > 0) {
      const topPattern = analysis.topPatterns[0];
      analysis.recommendations.push(
        `Most common pattern: "${topPattern.pattern}" (${topPattern.count} occurrences)`
      );
    }
    
    analysis.recommendations.push(
      `${analysis.filesAffected.size} files have refactoring opportunities`
    );
  }
  
  return analysis;
}

/* ---------------------------- output ---------------------------- */
function printSummary(analysis) {
  console.log('🔍 Master Utility Opportunity Analysis\n');
  
  console.log(`📊 Total Opportunities: ${analysis.totalOpportunities}`);
  console.log(`📁 Files Affected: ${analysis.filesAffected.size}\n`);
  
  console.log('📈 By Phase:');
  for (const [phase, data] of Object.entries(analysis.byPhase)) {
    const percentage = analysis.totalOpportunities > 0 
      ? ((data.count / analysis.totalOpportunities) * 100).toFixed(1)
      : '0';
    console.log(`  Phase ${phase}: ${data.name} - ${data.count} opportunities (${percentage}%)`);
  }
  
  if (analysis.topPatterns.length > 0) {
    console.log('\n🎯 Top Patterns:');
    for (let i = 0; i < Math.min(5, analysis.topPatterns.length); i++) {
      const pattern = analysis.topPatterns[i];
      console.log(`  ${i + 1}. ${pattern.pattern} (${pattern.count}) - Phase ${pattern.phase}`);
    }
  }
  
  if (analysis.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    for (const rec of analysis.recommendations) {
      console.log(`  • ${rec}`);
    }
  }
}

function printDetailedResults(results) {
  for (const result of results) {
    const phase = result.phase;
    const data = JSON.parse(result.stdout);
    
    if (data.count > 0) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Phase ${phase}: ${PHASE_NAMES[phase]}`);
      console.log(`${'='.repeat(60)}`);
      
      // Parse and display results
      const lines = result.stdout.split('\n');
      let inResults = false;
      
      for (const line of lines) {
        if (line.includes('Found') && line.includes('opportunities')) {
          console.log(line);
          inResults = true;
        } else if (inResults && line.trim()) {
          console.log(line);
        }
      }
    }
  }
}

/* ------------------------------ main ------------------------------ */
async function main() {
  try {
    if (LIST_ONLY) {
      console.log('Available patterns by phase:\n');
      for (const phase of PHASES) {
        console.log(`Phase ${phase}: ${PHASE_NAMES[phase]}`);
        const result = await runPhase(phase);
        const lines = result.stdout.split('\n');
        for (const line of lines) {
          if (line.trim() && !line.includes('Available patterns')) {
            console.log(`  ${line}`);
          }
        }
        console.log('');
      }
      return;
    }
    
    if (VERBOSE) {
      console.log(`Running phases: ${PHASES.join(', ')}`);
      console.log(`Roots: ${ROOTS.join(', ')}`);
      console.log(`Include: ${INCLUDE.join(', ') || 'all'}`);
      console.log(`Exclude: ${EXCLUDE.join(', ') || 'none'}`);
      console.log('');
    }
    
    // Run all phases
    const results = [];
    for (const phase of PHASES) {
      if (VERBOSE) console.log(`Running Phase ${phase}...`);
      const result = await runPhase(phase);
      results.push(result);
    }
    
    // Analyze results
    const analysis = analyzeResults(results);
    
    if (JSON_OUTPUT) {
      const output = {
        version: 'master-v1',
        summary: {
          totalOpportunities: analysis.totalOpportunities,
          filesAffected: analysis.filesAffected.size,
          phasesRun: PHASES,
          byPhase: analysis.byPhase,
          topPatterns: analysis.topPatterns.slice(0, 10),
          recommendations: analysis.recommendations
        },
        detailedResults: results.map(r => ({
          phase: r.phase,
          name: PHASE_NAMES[r.phase],
          data: JSON.parse(r.stdout)
        }))
      };
      console.log(JSON.stringify(output, null, 2));
      return;
    }
    
    if (analysis.totalOpportunities === 0) {
      console.log('✅ No utility opportunities found across all phases.');
      console.log('   Tips: try --include=packages,apps or widen --ext, or run --list.');
      return;
    }
    
    // Print summary
    printSummary(analysis);
    
    // Print detailed results if not summary-only
    if (!SUMMARY_ONLY) {
      printDetailedResults(results);
    }
    
  } catch (error) {
    console.error('❌ Error running utility opportunity finder:', error.message);
    if (VERBOSE) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
