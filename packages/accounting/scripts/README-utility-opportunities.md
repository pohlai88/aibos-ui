# Utility Opportunity Finders

A comprehensive suite of tools to identify refactoring opportunities in your codebase by detecting manual implementations that can be replaced with standardized utility functions.

## Overview

The utility opportunity finders are organized into three phases, each focusing on different categories of utilities:

- **Phase 1**: Core utilities (Date, Collection, Object manipulation)
- **Phase 2**: Business utilities (Financial calculations, Validation, Formatting)  
- **Phase 3**: Advanced utilities (Async operations, Error handling, Performance monitoring)

## Quick Start

```bash
# Run all phases
node scripts/master-utility-opportunities.mjs .

# Run specific phases
node scripts/master-utility-opportunities.mjs . --phases=1,2

# Get JSON output for analysis
node scripts/master-utility-opportunities.mjs . --json > opportunities.json

# List all available patterns
node scripts/master-utility-opportunities.mjs --list
```

## Individual Phase Scripts

### Phase 1: Core Utilities
```bash
node scripts/phase-1-utility-opportunities.mjs .
```

**Detects opportunities for:**
- Date utilities (validation, manipulation, ranges)
- Collection utilities (filtering, grouping, sorting)
- Object utilities (path access, deep equality, manipulation)
- Basic rounding and money handling

### Phase 2: Business Utilities
```bash
node scripts/phase-2-utility-opportunities.mjs .
```

**Detects opportunities for:**
- Financial calculations (tax, discount, markup, margin, ROI, NPV, IRR)
- Validation utilities (email, phone, tax ID, bank accounts, credit cards)
- Formatting utilities (currency, percentage, numbers, addresses)

### Phase 3: Advanced Utilities
```bash
node scripts/phase-3-utility-opportunities.mjs .
```

**Detects opportunities for:**
- Async utilities (Promise handling, retry logic, rate limiting, debouncing)
- Error handling (structured errors, context, circuit breakers, recovery)
- Performance utilities (timing, caching, profiling, memory monitoring)

## Master Script

The master script (`master-utility-opportunities.mjs`) orchestrates all three phases and provides:

- **Unified reporting** across all phases
- **Cross-phase analysis** and recommendations
- **Summary statistics** and top patterns
- **Flexible phase selection**

### Master Script Usage

```bash
# Basic usage
node scripts/master-utility-opportunities.mjs [roots...] [options]

# Options:
--phases 1,2,3      # Run specific phases (default: all)
--include a,b       # Only paths containing these substrings
--exclude a,b       # Exclude paths containing these substrings
--ext ts,tsx,...    # File extensions to scan
--only names        # Only run specific pattern names
--skip names        # Skip specific pattern names
--json              # JSON output for programmatic use
--list              # List all available patterns
--summary           # Summary only (no detailed output)
--verbose           # Extra logging
```

## Common Usage Patterns

### 1. Scan Specific Directories
```bash
# Scan only source code
node scripts/master-utility-opportunities.mjs packages apps --include=src

# Exclude test files
node scripts/master-utility-opportunities.mjs . --exclude=.spec,.test
```

### 2. Focus on Specific Patterns
```bash
# Only look for async/error patterns
node scripts/master-utility-opportunities.mjs . --phases=3

# Only look for specific patterns
node scripts/master-utility-opportunities.mjs . --only="Manual Promise.all,Manual retry logic"
```

### 3. Generate Reports
```bash
# Generate comprehensive JSON report
node scripts/master-utility-opportunities.mjs . --json > report.json

# Generate summary for CI/CD
node scripts/master-utility-opportunities.mjs . --summary
```

### 4. Integration with CI/CD
```bash
# Check for opportunities and fail if too many found
OPPORTUNITIES=$(node scripts/master-utility-opportunities.mjs . --summary | grep "Total Opportunities" | grep -o '[0-9]*')
if [ "$OPPORTUNITIES" -gt 50 ]; then
  echo "Too many utility opportunities found: $OPPORTUNITIES"
  exit 1
fi
```

## Output Formats

### Console Output
```
📊 Found 23 utility opportunities:

• Manual Promise.all with error handling (8)
  ↳ Use: parallel
  ↳ Suggestion: Use parallel() with built-in error handling and concurrency control.
  - src/services/api.ts:45:12  Promise.all(requests).catch(error => { ... })
  - src/utils/helpers.ts:123:8  try { await Promise.all(promises) } catch (e) { ... }

• Manual tax calculation (5)
  ↳ Use: calculateTaxExclusive | calcTaxTupleMinorFromNet
  ↳ Suggestion: Use calculateTaxExclusive(), calcTaxTupleMinorFromNet(), or calcTaxTupleMinorFromGross().
  - src/calculations/tax.ts:67:15  amount * (1 + taxRate)
```

### JSON Output
```json
{
  "version": "master-v1",
  "summary": {
    "totalOpportunities": 23,
    "filesAffected": 12,
    "phasesRun": ["1", "2", "3"],
    "byPhase": {
      "1": { "name": "Core Utilities", "count": 8 },
      "2": { "name": "Business Utilities", "count": 10 },
      "3": { "name": "Advanced Utilities", "count": 5 }
    },
    "topPatterns": [
      { "pattern": "Manual Promise.all with error handling", "count": 8, "phase": "3" }
    ],
    "recommendations": [
      "Focus on Business Utilities - 10 opportunities found",
      "Most common pattern: Manual Promise.all with error handling (8 occurrences)"
    ]
  }
}
```

## Pattern Detection

The tools use regex-based heuristics to detect common patterns. Each pattern includes:

- **Name**: Descriptive name of the pattern
- **Regex**: Regular expressions to match the pattern
- **Suggestion**: Recommended utility function(s) to use
- **Utility**: Specific utility functions available

### Example Pattern
```javascript
{
  name: 'Manual Promise.all with error handling',
  re: [
    /\bPromise\.all\s*\([^)]*\)\.catch/gi,
    /\bPromise\.all\s*\([^)]*\)\.then.*\.catch/gi,
    /\btry.*Promise\.all/gi
  ],
  suggestion: 'Use parallel() with built-in error handling and concurrency control.',
  utility: 'parallel'
}
```

## Customization

### Adding New Patterns

To add new patterns, edit the `RULES` array in the appropriate phase script:

```javascript
const RULES = [
  // ... existing rules
  {
    name: 'Your custom pattern',
    re: [/\byour.*regex.*pattern/gi],
    suggestion: 'Use yourUtilityFunction() for better handling.',
    utility: 'yourUtilityFunction'
  }
];
```

### Tuning Detection

- **Adjust regex patterns** to match your code idioms
- **Add/remove patterns** based on your utility library
- **Modify suggestions** to match your specific utility functions
- **Use `--only` and `--skip`** to focus on specific patterns during development

## Performance

- **Fast scanning**: Pure regex-based detection (no AST parsing)
- **Monorepo-friendly**: Efficiently handles large codebases
- **Configurable limits**: Control file size and match limits
- **Parallel processing**: Master script runs phases concurrently

## Integration Examples

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
OPPORTUNITIES=$(node scripts/master-utility-opportunities.mjs . --summary | grep "Total Opportunities" | grep -o '[0-9]*')
if [ "$OPPORTUNITIES" -gt 10 ]; then
  echo "⚠️  $OPPORTUNITIES utility opportunities found. Consider refactoring."
  node scripts/master-utility-opportunities.mjs . --summary
fi
```

### Package.json Scripts
```json
{
  "scripts": {
    "find-opportunities": "node scripts/master-utility-opportunities.mjs .",
    "find-opportunities:json": "node scripts/master-utility-opportunities.mjs . --json",
    "find-opportunities:async": "node scripts/master-utility-opportunities.mjs . --phases=3",
    "find-opportunities:summary": "node scripts/master-utility-opportunities.mjs . --summary"
  }
}
```

## Troubleshooting

### Common Issues

1. **No opportunities found**
   - Try widening the scope with `--include=packages,apps`
   - Check file extensions with `--ext ts,tsx,js,jsx`
   - Use `--verbose` for debugging

2. **Too many false positives**
   - Use `--skip` to exclude specific patterns
   - Tune regex patterns in the scripts
   - Use `--only` to focus on specific patterns

3. **Performance issues**
   - Increase `--max-file-bytes` limit
   - Use `--max-per-file` to limit matches per file
   - Exclude large directories with `--exclude`

### Debug Mode
```bash
# Enable verbose logging
node scripts/master-utility-opportunities.mjs . --verbose

# Test specific patterns
node scripts/master-utility-opportunities.mjs . --only="Manual Promise.all" --verbose
```

## Contributing

When adding new patterns:

1. **Test thoroughly** with real code examples
2. **Avoid false positives** by being specific with regex patterns
3. **Provide clear suggestions** that match actual utility functions
4. **Update documentation** with new patterns
5. **Consider performance** impact of complex regex patterns

## License

Part of the AIBOS ERP project utility ecosystem.
