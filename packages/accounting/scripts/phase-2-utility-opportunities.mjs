#!/usr/bin/env node
/**
 * Phase 2 Utility Opportunity Finder — v1
 * Detects opportunities for financial, validation, and formatting utilities.
 *
 * Usage:
 *   node scripts/phase-2-utility-opportunities.mjs . --json > phase2-opps.json
 *   node scripts/phase-2-utility-opportunities.mjs apps packages --include=src --exclude=.spec
 *   node scripts/phase-2-utility-opportunities.mjs --list
 *
 * Notes:
 * - Pure regex heuristics (fast, monorepo-friendly).
 * - Focused on Phase 2 utilities: financial calculations, validation, formatting.
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

function help(){console.log(`Phase 2 Utility Opportunity Finder v1
Usage: node phase-2-utility-opportunities.mjs [roots...] [options]
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

/* ---------------------------- Phase 2 Rules ---------------------------- */
/** Heuristics = "if you see manual X, suggest Phase 2 utility Y".  */
const RULES = [
  /* ===== Financial Calculation Utilities ===== */
  {
    name: 'Manual tax calculation (inclusive/exclusive)',
    re: [
      /\bamount\s*\*\s*\(\s*1\s*\+\s*taxRate\s*\)/gi,
      /\bamount\s*\/\s*\(\s*1\s*\+\s*taxRate\s*\)/gi,
      /\btaxAmount\s*=\s*amount\s*\*\s*taxRate/gi,
      /\bgrossAmount\s*-\s*taxAmount/gi
    ],
    suggestion: 'Use calculateTaxExclusive(), calcTaxTupleMinorFromNet(), or calcTaxTupleMinorFromGross().',
    utility: 'calculateTaxExclusive | calcTaxTupleMinorFromNet | calcTaxTupleMinorFromGross'
  },
  {
    name: 'Manual discount calculation',
    re: [
      /\bamount\s*\*\s*discountRate/gi,
      /\boriginalPrice\s*-\s*discountAmount/gi,
      /\bdiscountAmount\s*=\s*price\s*\*\s*discount/gi
    ],
    suggestion: 'Use calculateDiscount() or calculateDiscountRate().',
    utility: 'calculateDiscount | calculateDiscountRate'
  },
  {
    name: 'Manual markup calculation',
    re: [
      /\bcost\s*\*\s*markupRate/gi,
      /\bcost\s*\+\s*markupAmount/gi,
      /\bmarkupAmount\s*=\s*cost\s*\*\s*markup/gi
    ],
    suggestion: 'Use calculateMarkup() or calculateMarkupRate().',
    utility: 'calculateMarkup | calculateMarkupRate'
  },
  {
    name: 'Manual margin calculation',
    re: [
      /\b\(sellingPrice\s*-\s*cost\)\s*\/\s*sellingPrice/gi,
      /\bmarginAmount\s*=\s*sellingPrice\s*-\s*cost/gi,
      /\bmarginPercentage\s*=\s*\(.*?\)\s*\/\s*sellingPrice/gi
    ],
    suggestion: 'Use calculateMargin() or calculateSellingPriceFromMargin().',
    utility: 'calculateMargin | calculateSellingPriceFromMargin'
  },
  {
    name: 'Manual ROI calculation',
    re: [
      /\b\(return\s*-\s*investment\)\s*\/\s*investment/gi,
      /\bROI\s*=\s*\(.*?\)\s*\/\s*investment/gi,
      /\breturnOnInvestment\s*=\s*\(.*?\)\s*\/\s*investment/gi
    ],
    suggestion: 'Use calculateROI() or calculateAnnualizedROI().',
    utility: 'calculateROI | calculateAnnualizedROI'
  },
  {
    name: 'Manual NPV calculation',
    re: [
      /\bcashFlow\s*\/\s*Math\.pow\s*\(\s*1\s*\+\s*discountRate/gi,
      /\bpresentValue\s*\+=\s*cashFlow\s*\/\s*Math\.pow/gi,
      /\bNPV\s*=\s*.*?Math\.pow\s*\(\s*1\s*\+\s*discountRate/gi
    ],
    suggestion: 'Use calculateNPV() or generateNPVSchedule().',
    utility: 'calculateNPV | generateNPVSchedule'
  },
  {
    name: 'Manual IRR calculation (Newton-Raphson)',
    re: [
      /\bNewton.*Raphson/gi,
      /\bIRR.*iteration/gi,
      /\bconvergence.*tolerance/gi
    ],
    suggestion: 'Use calculateIRR() or generateIRRSchedule().',
    utility: 'calculateIRR | generateIRRSchedule'
  },
  {
    name: 'Manual payback period calculation',
    re: [
      /\binvestment\s*\/\s*annualCashFlow/gi,
      /\bpaybackPeriod\s*=\s*investment\s*\/\s*cashFlow/gi,
      /\bcumulativeCashFlow\s*>=\s*investment/gi
    ],
    suggestion: 'Use calculatePaybackPeriod() or calculatePaybackPeriodVariable().',
    utility: 'calculatePaybackPeriod | calculatePaybackPeriodVariable'
  },
  {
    name: 'Manual depreciation calculation',
    re: [
      /\b\(cost\s*-\s*salvageValue\)\s*\/\s*usefulLife/gi,
      /\bdepreciation\s*=\s*\(cost\s*-\s*salvageValue\)/gi,
      /\bsumOfYears.*depreciation/gi
    ],
    suggestion: 'Use calculateSumOfYearsDepreciation() or other depreciation methods.',
    utility: 'calculateSumOfYearsDepreciation'
  },
  {
    name: 'Effective Annual Rate (EAR) manual',
    re: [
      /Math\.pow\s*\(\s*1\s*\+\s*([a-zA-Z_][\w]*)\s*\/\s*([a-zA-Z_][\w]*)\s*,\s*\2\s*\)\s*-\s*1\b/g,
      /\(\s*1\s*\+\s*([a-zA-Z_][\w]*)\s*\/\s*([a-zA-Z_][\w]*)\s*\)\s*\*\*\s*\2\s*-\s*1\b/g
    ],
    suggestion: 'Use calculateEffectiveAnnualRate(nominalRate, periodsPerYear).',
    utility: 'calculateEffectiveAnnualRate'
  },
  {
    name: 'Present Value Annuity manual',
    re: [
      /([a-zA-Z_][\w]*)\s*\*\s*\(\s*1\s*-\s*(Math\.pow\s*\(\s*1\s*\+\s*([a-zA-Z_][\w]*)\s*,\s*-\s*([a-zA-Z_][\w]*)\s*\)|\(\s*1\s*\+\s*\3\s*\)\s*\*\*\s*-\s*\4)\s*\)\s*\/\s*\3\b/g,
      /([a-zA-Z_][\w]*)\s*\*\s*\(\s*1\s*-\s*\(\s*1\s*\+\s*([a-zA-Z_][\w]*)\s*\)\s*\*\*\s*-\s*([a-zA-Z_][\w]*)\s*\)\s*\/\s*\2\b/g
    ],
    suggestion: 'Use calculatePresentValueAnnuity(payment, rate, periods).',
    utility: 'calculatePresentValueAnnuity'
  },
  {
    name: 'Future Value Annuity manual',
    re: [
      /([a-zA-Z_][\w]*)\s*\*\s*\(\s*(Math\.pow\s*\(\s*1\s*\+\s*([a-zA-Z_][\w]*)\s*,\s*([a-zA-Z_][\w]*)\s*\)|\(\s*1\s*\+\s*\3\s*\)\s*\*\*\s*\4)\s*-\s*1\s*\)\s*\/\s*\3\b/g,
      /([a-zA-Z_][\w]*)\s*\*\s*\(\s*\(\s*1\s*\+\s*([a-zA-Z_][\w]*)\s*\)\s*\*\*\s*([a-zA-Z_][\w]*)\s*-\s*1\s*\)\s*\/\s*\2\b/g
    ],
    suggestion: 'Use calculateFutureValueAnnuity(payment, rate, periods).',
    utility: 'calculateFutureValueAnnuity'
  },
  {
    name: 'Selling price from margin manual',
    re: [
      /\bprice\s*=\s*cost\s*\/\s*\(\s*1\s*-\s*margin\s*\)\b/gi,
      /\b(?:sellingPrice|sp)\s*=\s*(?:cost|c)\s*\/\s*\(\s*1\s*-\s*(?:margin|m)\s*\)\b/gi
    ],
    suggestion: 'Use calculateSellingPriceFromMargin(cost, margin).',
    utility: 'calculateSellingPriceFromMargin'
  },
  {
    name: 'Minor-units tax tuple (net/gross)',
    re: [
      /\b(tax|vat).*?\b(amount|cents)\b.*=\s*Math\.round\(/gi,
      /\b(net|gross).*?\b(cents|minor)\b.*=\s*Math\.round\(/gi
    ],
    suggestion: 'Use calcTaxTupleMinorFromNet()/calcTaxTupleMinorFromGross() for (net, tax, gross, rate).',
    utility: 'calcTaxTupleMinorFromNet | calcTaxTupleMinorFromGross'
  },
  {
    name: 'Minor-units proportional tax allocation',
    re: [
      /\bfor\s*\(\s*const\s+[a-zA-Z_][\w]*\s+of\s+[a-zA-Z_][\w]*\s*\)\s*\{[^}]*?\b(line|item)[\w]*\.(amount|cents)\b[^}]*?\=\s*Math\.round\(\s*\1?[\w\.]*\s*\/\s*(total|sum)[\w\.]*\s*\*\s*(tax|vat)[\w\.]*\s*\)[^}]*?\}/gis
    ],
    suggestion: 'Use allocateTaxAcrossLinesMinor(lines, taxTotalMinor) with consistent rounding.',
    utility: 'allocateTaxAcrossLinesMinor'
  },
  {
    name: 'Currency decimals hard-coded',
    re: [
      /\b(JPY|KRW|VND)\b\s*[:=]\s*0\b/gi,
      /\b(MYR|USD|EUR|GBP|AUD|CAD|SGD)\b\s*[:=]\s*2\b/gi,
      /\bdecimals?\s*[:=]\s*(0|2)\b/gi
    ],
    suggestion: 'Use getCurrencyDecimalsStrict(code) to resolve decimals per currency.',
    utility: 'getCurrencyDecimalsStrict'
  },

  /* ===== Validation Utilities ===== */
  {
    name: 'Manual email validation',
    re: [
      /\bemail.*@.*\./gi,
      /\bemailRegex.*test/gi,
      /\bemail.*includes.*@/gi,
      /\bemail.*match.*@/gi
    ],
    suggestion: 'Use validateEmail() with proper validation options.',
    utility: 'validateEmail'
  },
  {
    name: 'Manual phone validation',
    re: [
      /\bphone.*match.*\d/gi,
      /\bphoneRegex.*test/gi,
      /\bphone.*length.*\d/gi,
      /\bphone.*replace.*\D/gi
    ],
    suggestion: 'Use validatePhone() with country-specific validation.',
    utility: 'validatePhone'
  },
  {
    name: 'Manual tax ID validation',
    re: [
      /\btaxId.*match.*\d/gi,
      /\btaxIdRegex.*test/gi,
      /\btaxId.*length.*\d/gi,
      /\bNRIC.*validation/gi
    ],
    suggestion: 'Use validateTaxId() with country-specific validation.',
    utility: 'validateTaxId'
  },
  {
    name: 'Manual bank account validation',
    re: [
      /\bbankAccount.*match.*\d/gi,
      /\baccountNumber.*test/gi,
      /\bbankAccount.*length.*\d/gi,
      /\baccountNumber.*replace.*\s/gi
    ],
    suggestion: 'Use validateBankAccount() with country-specific validation.',
    utility: 'validateBankAccount'
  },
  {
    name: 'Manual credit card validation',
    re: [
      /\bcardNumber.*test/gi,
      /\bLuhn.*algorithm/gi,
      /\bcreditCard.*validation/gi,
      /\bcardNumber.*length.*\d/gi
    ],
    suggestion: 'Use validateCreditCard() with Luhn algorithm validation.',
    utility: 'validateCreditCard'
  },
  {
    name: 'Manual amount validation',
    re: [
      /\bamount.*>=.*0/gi,
      /\bamount.*<.*max/gi,
      /\bamount.*>.*min/gi,
      /\bamount.*isNaN/gi
    ],
    suggestion: 'Use validateAmount() with min/max constraints.',
    utility: 'validateAmount'
  },
  {
    name: 'Manual percentage validation',
    re: [
      /\bpercentage.*>=.*0/gi,
      /\bpercentage.*<=.*100/gi,
      /\bpercentage.*isNaN/gi,
      /\brate.*>=.*0.*&&.*rate.*<=.*1/gi
    ],
    suggestion: 'Use validatePercentage() with proper range validation.',
    utility: 'validatePercentage'
  },
  {
    name: 'Manual currency code validation',
    re: [
      /\bcurrency.*toUpperCase/gi,
      /\bcurrencyCode.*test/gi,
      /\bcurrency.*match.*[A-Z]{3}/gi,
      /\bcurrency.*length.*===.*3/gi
    ],
    suggestion: 'Use validateCurrencyCode() with supported currency validation.',
    utility: 'validateCurrencyCode'
  },
  {
    name: 'Manual business entity validation',
    re: [
      /\bjournal.*validation/gi,
      /\binvoice.*validation/gi,
      /\bcustomer.*validation/gi,
      /\bvendor.*validation/gi,
      /\btransaction.*validation/gi
    ],
    suggestion: 'Use validateJournalEntry(), validateInvoice(), validateCustomer(), validateVendor(), or validateTransaction().',
    utility: 'validateJournalEntry | validateInvoice | validateCustomer | validateVendor | validateTransaction'
  },
  {
    name: 'IBAN manual validation',
    re: [
      /IBAN/i,
      /\/\^\s*[A-Z]{2}\s*\d{2}\s*[A-Z0-9]{1,30}\s*\$?\/[gimuy]*/g
    ],
    suggestion: 'Use validateIBAN(iban).',
    utility: 'validateIBAN'
  },
  {
    name: 'Card expiry manual validation',
    re: [
      /\/\^\s*(0[1-9]|1[0-2])\s*\/?\s*(\d{2}|\d{4})\s*\$?\/[gimuy]*/g,
      /\b(MM\s*\/\s*YY|MM\s*\/\s*YYYY)\b/i
    ],
    suggestion: 'Use validateCardExpiry(expiry).',
    utility: 'validateCardExpiry'
  },
  {
    name: 'Card CVC manual validation',
    re: [
      /\/\^\s*\d{3,4}\s*\$?\/[gimuy]*/g,
      /\bCVC\b|\bCVV\b|\bCID\b/i
    ],
    suggestion: 'Use validateCardCVC(cvc, cardType?).',
    utility: 'validateCardCVC'
  },
  {
    name: 'Account type manual whitelist',
    re: [
      /\baccountType\b[^;\n]*(['"]asset['"]|['"]liability['"]|['"]equity['"]|['"]revenue['"]|['"]expense['"])/gi,
      /\btype\s*===\s*['"](asset|liability|equity|revenue|expense)['"]/gi
    ],
    suggestion: 'Use validateAccountType(type).',
    utility: 'validateAccountType'
  },

  /* ===== Formatting Utilities ===== */
  {
    name: 'Manual currency formatting',
    re: [
      /\btoLocaleString.*currency/gi,
      /\bIntl\.NumberFormat.*currency/gi,
      /\bcurrency.*format/gi,
      /\bamount.*toFixed.*currency/gi
    ],
    suggestion: 'Use formatCurrency(), formatCurrencyAccounting(), formatCurrencyWithSymbol(), or formatCurrencyWithCode().',
    utility: 'formatCurrency | formatCurrencyAccounting | formatCurrencyWithSymbol | formatCurrencyWithCode'
  },
  {
    name: 'Manual percentage formatting',
    re: [
      /\btoLocaleString.*percent/gi,
      /\bIntl\.NumberFormat.*percent/gi,
      /\bpercentage.*format/gi,
      /\bvalue.*toFixed.*%/gi
    ],
    suggestion: 'Use formatPercentage() or formatPercentageNumber().',
    utility: 'formatPercentage | formatPercentageNumber'
  },
  {
    name: 'Manual number formatting',
    re: [
      /\btoLocaleString.*number/gi,
      /\bIntl\.NumberFormat.*number/gi,
      /\bnumber.*format/gi,
      /\bvalue.*toFixed.*locale/gi
    ],
    suggestion: 'Use formatNumber(), formatInteger(), or formatNumberWithSeparator().',
    utility: 'formatNumber | formatInteger | formatNumberWithSeparator'
  },
  {
    name: 'Manual account code formatting',
    re: [
      /\baccountCode.*replace.*\D/gi,
      /\baccountCode.*slice.*separator/gi,
      /\baccountCode.*join.*separator/gi,
      /\bcode.*format.*separator/gi
    ],
    suggestion: 'Use formatAccountCode() or formatAccountCodeStandard().',
    utility: 'formatAccountCode | formatAccountCodeStandard'
  },
  {
    name: 'Manual tax ID formatting',
    re: [
      /\btaxId.*replace.*\D/gi,
      /\btaxId.*slice.*-/gi,
      /\btaxId.*join.*-/gi,
      /\btaxId.*format.*country/gi
    ],
    suggestion: 'Use formatTaxId() with country-specific formatting.',
    utility: 'formatTaxId'
  },
  {
    name: 'Manual phone number formatting',
    re: [
      /\bphone.*replace.*\D/gi,
      /\bphone.*slice.*-/gi,
      /\bphone.*join.*-/gi,
      /\bphone.*format.*country/gi
    ],
    suggestion: 'Use formatPhoneNumber() with country-specific formatting.',
    utility: 'formatPhoneNumber'
  },
  {
    name: 'Manual address formatting',
    re: [
      /\baddress.*join.*,/gi,
      /\baddress.*join.*\n/gi,
      /\baddress.*format/gi,
      /\bstreet.*city.*state/gi
    ],
    suggestion: 'Use formatAddress() or formatAddressMultiline().',
    utility: 'formatAddress | formatAddressMultiline'
  },
  {
    name: 'Manual name formatting',
    re: [
      /\bname.*join.*\s/gi,
      /\bfirstName.*lastName/gi,
      /\bname.*format/gi,
      /\btitle.*firstName.*lastName/gi
    ],
    suggestion: 'Use formatName(), formatNameLastFirst(), or formatCompanyName().',
    utility: 'formatName | formatNameLastFirst | formatCompanyName'
  },
  {
    name: 'Manual invoice/reference number formatting',
    re: [
      /\binvoiceNumber.*padStart/gi,
      /\breferenceNumber.*padStart/gi,
      /\bnumber.*toString.*padStart/gi,
      /\bprefix.*year.*number/gi
    ],
    suggestion: 'Use formatInvoiceNumber(), formatReferenceNumber(), formatPurchaseOrderNumber(), or formatReceiptNumber().',
    utility: 'formatInvoiceNumber | formatReferenceNumber | formatPurchaseOrderNumber | formatReceiptNumber'
  },
  {
    name: 'Manual file size formatting',
    re: [
      /\bfileSize.*Bytes.*KB.*MB/gi,
      /\bfileSize.*format/gi,
      /\bbytes.*Math\.log.*1024/gi,
      /\bfileSize.*toFixed.*sizes/gi
    ],
    suggestion: 'Use formatFileSize().',
    utility: 'formatFileSize'
  },
  {
    name: 'Manual duration formatting',
    re: [
      /\bduration.*milliseconds/gi,
      /\bduration.*format/gi,
      /\bmilliseconds.*seconds.*minutes/gi,
      /\bduration.*days.*hours.*minutes/gi
    ],
    suggestion: 'Use formatDuration() or formatRelativeTime().',
    utility: 'formatDuration | formatRelativeTime'
  },

  /* ===== Legacy patterns from Phase 1 (kept for completeness) ===== */
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
  console.log('✅ No obvious Phase 2 utility opportunities found.');
  console.log('   Tips: try --include=packages,apps or widen --ext, or run --list.');
  process.exit(0);
}

console.log(`📊 Found ${results.length} Phase 2 utility opportunities:\n`);
const byName = results.reduce((a,x)=>((a[x.name]??=[]).push(x),a),{});
for(const name of Object.keys(byName).sort((a,b)=>byName[b].length-byName[a].length)){
  const group = byName[name];
  console.log(`• ${name} (${group.length})`);
  console.log(`  ↳ Use: ${group[0].utility}`);
  console.log(`  ↳ Suggestion: ${group[0].suggestion}`);
  for(const it of group) console.log(`  - ${it.file}:${it.line}:${it.column}  ${it.snippet}`);
  console.log('');
}
