#!/usr/bin/env node
/**
 * Test Strip: Utility Opportunities Finder
 * - Finds manual patterns that should use Phase 1 utilities
 * - Focuses on date, collection, and object utilities
 * - Provides actionable refactoring suggestions
 */

import { readFileSync, readdirSync, lstatSync, statSync } from 'fs';
import { join, extname, sep } from 'path';

/* ------------------------- Configuration ------------------------- */

const ROOT_DIR = 'src';
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '__tests__', 'utils'];
const INCLUDE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

/* ------------------------- Phase 1 Utility Patterns ------------------------- */

const PHASE1_PATTERNS = [
  // Date Utilities Patterns
  {
    category: 'Date Utilities',
    name: 'Manual Date Formatting',
    patterns: [
      /new Date\([^)]+\)\.toISOString\(\)/g,
      /\.toLocaleDateString\(/g,
      /\.toLocaleString\(/g,
      /moment\(/g,
      /dayjs\(/g,
      /date-fns/g
    ],
    suggestion: 'Use formatDate(), parseDate(), or isValidDate() from date-utilities',
    utilities: ['formatDate', 'parseDate', 'isValidDate']
  },
  {
    category: 'Date Utilities',
    name: 'Manual Fiscal Year Calculations',
    patterns: [
      /fiscal.*year/gi,
      /quarter.*calculation/gi,
      /period.*bucket/gi,
      /year.*end/gi
    ],
    suggestion: 'Use getFiscalYear(), getFiscalQuarter(), or getFiscalPeriod()',
    utilities: ['getFiscalYear', 'getFiscalQuarter', 'getFiscalPeriod']
  },
  {
    category: 'Date Utilities',
    name: 'Manual Date Comparisons',
    patterns: [
      /\.getTime\(\)\s*[<>=]/g,
      /Date\.now\(\)\s*[<>=]/g,
      /new Date\(\)\s*[<>=]/g
    ],
    suggestion: 'Use compareDates(), isDateInRange(), or getDateDifference()',
    utilities: ['compareDates', 'isDateInRange', 'getDateDifference']
  },

  // Collection Utilities Patterns
  {
    category: 'Collection Utilities',
    name: 'Manual Array Grouping',
    patterns: [
      /\.reduce\([^)]*group/gi,
      /\.filter\([^)]*\.includes/gi,
      /Object\.groupBy/gi
    ],
    suggestion: 'Use groupBy(), groupByProperty(), or groupByKey() from collection-utilities',
    utilities: ['groupBy', 'groupByProperty', 'groupByKey']
  },
  {
    category: 'Collection Utilities',
    name: 'Manual Array Filtering',
    patterns: [
      /\.filter\([^)]*undefined/gi,
      /\.filter\([^)]*null/gi,
      /\.filter\([^)]*\.length/gi
    ],
    suggestion: 'Use filterByProperty(), filterByValue(), or filterByPredicate()',
    utilities: ['filterByProperty', 'filterByValue', 'filterByPredicate']
  },
  {
    category: 'Collection Utilities',
    name: 'Manual Array Sorting',
    patterns: [
      /\.sort\([^)]*localeCompare/gi,
      /\.sort\([^)]*[<>=]/gi,
      /\.sort\([^)]*\.length/gi
    ],
    suggestion: 'Use sortBy(), sortByProperty(), or sortByMultiple()',
    utilities: ['sortBy', 'sortByProperty', 'sortByMultiple']
  },
  {
    category: 'Collection Utilities',
    name: 'Manual Array Deduplication',
    patterns: [
      /Array\.from\([^)]*Set/gi,
      /\.filter\([^)]*indexOf/gi,
      /\.filter\([^)]*findIndex/gi
    ],
    suggestion: 'Use unique(), uniqueBy(), or uniqueByProperty()',
    utilities: ['unique', 'uniqueBy', 'uniqueByProperty']
  },

  // Object Utilities Patterns
  {
    category: 'Object Utilities',
    name: 'Manual Object Cloning',
    patterns: [
      /JSON\.parse\(JSON\.stringify/gi,
      /\.\.\.[^}]+}/g,
      /Object\.assign\(/gi
    ],
    suggestion: 'Use deepClone(), shallowClone(), or cloneWithTransform()',
    utilities: ['deepClone', 'shallowClone', 'cloneWithTransform']
  },
  {
    category: 'Object Utilities',
    name: 'Manual Object Merging',
    patterns: [
      /Object\.assign\([^)]*Object\.assign/gi,
      /\.\.\.[^}]+\.\.\.[^}]+}/g,
      /lodash\.merge/gi
    ],
    suggestion: 'Use deepMerge(), shallowMerge(), or mergeWithStrategy()',
    utilities: ['deepMerge', 'shallowMerge', 'mergeWithStrategy']
  },
  {
    category: 'Object Utilities',
    name: 'Manual Object Property Selection',
    patterns: [
      /Object\.fromEntries\([^)]*Object\.entries/gi,
      /\.map\([^)]*\[/gi,
      /lodash\.pick/gi,
      /lodash\.omit/gi
    ],
    suggestion: 'Use pick(), omit(), pickBy(), or omitBy()',
    utilities: ['pick', 'omit', 'pickBy', 'omitBy']
  },
  {
    category: 'Object Utilities',
    name: 'Manual Object Type Checking',
    patterns: [
      /typeof\s+[^)]+===\s*['"]object['"]/gi,
      /\.hasOwnProperty\(/gi,
      /Object\.hasOwn\(/gi,
      /in\s+[A-Za-z_$]/gi
    ],
    suggestion: 'Use isRecord(), hasKey(), or isPlainObject()',
    utilities: ['isRecord', 'hasKey', 'isPlainObject']
  },
  {
    category: 'Object Utilities',
    name: 'Manual Object Property Access',
    patterns: [
      /\[[^]]+\]\.\?/g,
      /\.\?\[/g,
      /\.\?\./g
    ],
    suggestion: 'Use safeGet(), safeSet(), or getNestedValue()',
    utilities: ['safeGet', 'safeSet', 'getNestedValue']
  },

  // Core Utilities Patterns
  {
    category: 'Core Utilities',
    name: 'Manual Undefined Filtering',
    patterns: [
      /Object\.fromEntries\([^)]*filter[^)]*undefined/gi,
      /\.filter\([^)]*!==\s*undefined/gi
    ],
    suggestion: 'Use omitUndefined(), omitNull(), or omitFalsy()',
    utilities: ['omitUndefined', 'omitNull', 'omitFalsy']
  },
  {
    category: 'Core Utilities',
    name: 'Manual String Validation',
    patterns: [
      /typeof\s+[^)]+===\s*['"]string['"]\s*&&/gi,
      /\.trim\(\)\.length\s*[<>=]/gi
    ],
    suggestion: 'Use isNonEmpty(), isEmpty(), or isValidString()',
    utilities: ['isNonEmpty', 'isEmpty', 'isValidString']
  },

  // Accounting-Specific Patterns
  {
    category: 'Accounting Patterns',
    name: 'Manual Account Code Processing',
    patterns: [
      /accountCode.*\.trim\(\)\.toUpperCase\(\)/gi,
      /account.*code.*split\(/gi,
      /account.*number.*padStart/gi
    ],
    suggestion: 'Use normalizeAccountCode(), parseHierarchicalAccountCode(), or formatAccountCode()',
    utilities: ['normalizeAccountCode', 'parseHierarchicalAccountCode', 'formatAccountCode']
  },
  {
    category: 'Accounting Patterns',
    name: 'Manual Journal Entry Processing',
    patterns: [
      /journal.*entry.*reduce/gi,
      /debit.*credit.*balance/gi,
      /\.filter\([^)]*amount/gi
    ],
    suggestion: 'Use groupBy(), filterByProperty(), or calculateBalances()',
    utilities: ['groupBy', 'filterByProperty', 'calculateBalances']
  },
  {
    category: 'Accounting Patterns',
    name: 'Manual Financial Calculations',
    patterns: [
      /Math\.round\([^)]*\*[^)]*100[^)]*\)/gi,
      /\.toFixed\(2\)/gi,
      /BigInt\([^)]*100[^)]*\)/gi
    ],
    suggestion: 'Use round2(), toMinorUnits(), or fromMinorUnits()',
    utilities: ['round2', 'toMinorUnits', 'fromMinorUnits']
  },
  {
    category: 'Accounting Patterns',
    name: 'Manual Currency Handling',
    patterns: [
      /currency.*decimals/gi,
      /USD.*EUR.*JPY/gi,
      /currency.*map/gi
    ],
    suggestion: 'Use getCurrencyDecimalsStrict(), CURRENCY_DECIMALS, or formatCurrency()',
    utilities: ['getCurrencyDecimalsStrict', 'CURRENCY_DECIMALS', 'formatCurrency']
  },
  {
    category: 'Accounting Patterns',
    name: 'Manual Tax Calculations',
    patterns: [
      /tax.*rate.*\*/gi,
      /vat.*gst.*calculation/gi,
      /tax.*inclusive/gi
    ],
    suggestion: 'Use calculateTax(), calculateTaxInclusive(), or calculateTaxExclusive()',
    utilities: ['calculateTax', 'calculateTaxInclusive', 'calculateTaxExclusive']
  }
];

/* ------------------------- File Scanning ------------------------- */

function shouldIgnorePath(path) {
  return EXCLUDE_DIRS.some(dir => path.includes(dir));
}

function* walkDirectory(dir) {
  if (shouldIgnorePath(dir)) return;
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (shouldIgnorePath(fullPath)) continue;
      
      if (entry.isDirectory()) {
        yield* walkDirectory(fullPath);
      } else if (entry.isFile() && INCLUDE_EXTENSIONS.includes(extname(entry.name))) {
        yield fullPath;
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
}

function scanFile(filePath) {
  try {
    const stats = statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) return [];
    
    const content = readFileSync(filePath, 'utf8');
    if (!content || content.includes('\x00')) return [];
    
    const opportunities = [];
    
    for (const pattern of PHASE1_PATTERNS) {
      for (const regex of pattern.patterns) {
        let match;
        const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
        
        while ((match = globalRegex.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const lineContent = content.split('\n')[lineNumber - 1] || '';
          
          opportunities.push({
            file: filePath,
            line: lineNumber,
            category: pattern.category,
            name: pattern.name,
            suggestion: pattern.suggestion,
            utilities: pattern.utilities,
            match: match[0],
            lineContent: lineContent.trim()
          });
          
          if (globalRegex.lastIndex === match.index) {
            globalRegex.lastIndex++;
          }
        }
      }
    }
    
    return opportunities;
  } catch (error) {
    return [];
  }
}

/* ------------------------- Main Execution ------------------------- */

function main() {
  console.log('🔍 Phase 1 Utility Opportunities Test Strip\n');
  console.log('Scanning:', ROOT_DIR);
  console.log('Looking for patterns that can use Phase 1 utilities...\n');
  
  const allOpportunities = [];
  const scannedFiles = [];
  
  for (const filePath of walkDirectory(ROOT_DIR)) {
    scannedFiles.push(filePath);
    const opportunities = scanFile(filePath);
    allOpportunities.push(...opportunities);
  }
  
  console.log(`📁 Scanned ${scannedFiles.length} files:`);
  scannedFiles.slice(0, 10).forEach(file => console.log(`  - ${file}`));
  if (scannedFiles.length > 10) {
    console.log(`  ... and ${scannedFiles.length - 10} more files`);
  }
  console.log('');
  
  if (allOpportunities.length === 0) {
    console.log('✅ No obvious utility opportunities found!');
    console.log('   This could mean:');
    console.log('   • The codebase is already well-refactored');
    console.log('   • Patterns are more complex than detected');
    console.log('   • Need to adjust pattern detection\n');
    return;
  }
  
  // Group by category
  const byCategory = allOpportunities.reduce((acc, opp) => {
    if (!acc[opp.category]) acc[opp.category] = [];
    acc[opp.category].push(opp);
    return acc;
  }, {});
  
  console.log(`📊 Found ${allOpportunities.length} utility opportunities:\n`);
  
  // Display by category
  for (const [category, opportunities] of Object.entries(byCategory)) {
    console.log(`## ${category} (${opportunities.length} opportunities)`);
    
    // Group by pattern name within category
    const byPattern = opportunities.reduce((acc, opp) => {
      if (!acc[opp.name]) acc[opp.name] = [];
      acc[opp.name].push(opp);
      return acc;
    }, {});
    
    for (const [patternName, patternOpportunities] of Object.entries(byPattern)) {
      console.log(`\n### ${patternName} (${patternOpportunities.length} instances)`);
      console.log(`**Suggestion:** ${patternOpportunities[0].suggestion}`);
      console.log(`**Utilities:** ${patternOpportunities[0].utilities.join(', ')}`);
      
      // Show first few examples
      const examples = patternOpportunities.slice(0, 3);
      for (const example of examples) {
        const relativePath = example.file.replace(ROOT_DIR + '/', '');
        console.log(`  - ${relativePath}:${example.line}`);
        console.log(`    ${example.lineContent}`);
      }
      
      if (patternOpportunities.length > 3) {
        console.log(`  ... and ${patternOpportunities.length - 3} more instances`);
      }
    }
    
    console.log('');
  }
  
  // Summary
  console.log('## Summary');
  console.log('Total opportunities:', allOpportunities.length);
  console.log('Categories:', Object.keys(byCategory).length);
  console.log('Files affected:', new Set(allOpportunities.map(o => o.file)).size);
  
  console.log('\n## Next Steps');
  console.log('1. Review the opportunities above');
  console.log('2. Prioritize by frequency and impact');
  console.log('3. Start refactoring with the most common patterns');
  console.log('4. Use the suggested utilities from Phase 1');
  console.log('5. Run tests after each refactoring');
}

// Run the test strip
main();
