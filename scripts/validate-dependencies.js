#!/usr/bin/env node

/**
 * Enhanced Dependency Validation Script
 *
 * Runs dependency-cruiser with UI ecosystem specific rules
 * Provides detailed reporting for UI layer violations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Safe get utility function (inline to avoid workspace dependency issues)
function safeGet(obj, path, defaultValue = undefined) {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current;
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  console.log(`${colors[color] || colors.white}${message}${colors.reset}`);
}

function runDependencyCruiser() {
  log('🚀 Running Enhanced Dependency Validation...', 'blue');
  log('Checking UI ecosystem layer boundaries...', 'cyan');

  try {
    // Run dependency cruiser with JSON output
    const result = execSync(
      'npx dependency-cruiser --config .dependency-cruiser.js --output-type json packages/ui packages/ui-business apps',
      {
        encoding: 'utf8',
        stdio: 'pipe',
      },
    );

    const violations = JSON.parse(result);
    return violations;
  } catch (error) {
    // Try to parse error output as JSON (dependency-cruiser returns JSON even on violations)
    try {
      const errorOutput = error.stdout || error.stderr;
      if (errorOutput && errorOutput.trim()) {
        const violations = JSON.parse(errorOutput);
        return violations;
      }
    } catch (parseError) {
      log('❌ Failed to parse dependency cruiser output', 'red');
      log(`Parse error: ${parseError.message}`, 'red');
      log(`Raw output: ${error.stdout || error.stderr}`, 'red');
      return { violations: [] };
    }

    log('❌ Failed to run dependency validation', 'red');
    log(`Error: ${error.message}`, 'red');
    return { violations: [] };
  }
}

function categorizeViolations(violations) {
  const categories = {
    uiLayerBoundaries: [],
    polymorphicIssues: [],
    designTokenViolations: [],
    importPatternIssues: [],
    other: [],
  };

  violations.forEach((violation) => {
    const ruleName = violation.rule.name;

    if (
      ruleName.includes('ui-primitives-no-business') ||
      ruleName.includes('apps-no-direct-ui') ||
      ruleName.includes('ui-business-no-cross-business')
    ) {
      categories.uiLayerBoundaries.push(violation);
    } else if (ruleName.includes('forwardref') || ruleName.includes('polymorphic')) {
      categories.polymorphicIssues.push(violation);
    } else if (
      ruleName.includes('design-token') ||
      ruleName.includes('ui-business-no-design-tokens')
    ) {
      categories.designTokenViolations.push(violation);
    } else if (ruleName.includes('import') || ruleName.includes('deep-imports')) {
      categories.importPatternIssues.push(violation);
    } else {
      categories.other.push(violation);
    }
  });

  return categories;
}

function generateDetailedReport(categories) {
  log('\n📊 DEPENDENCY VALIDATION REPORT', 'magenta');
  log('='.repeat(60), 'magenta');

  const totalViolations = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);

  // UI Layer Boundaries
  if (categories.uiLayerBoundaries.length > 0) {
    log(`\n❌ UI Layer Boundary Violations: ${categories.uiLayerBoundaries.length}`, 'red');
    categories.uiLayerBoundaries.forEach((violation) => {
      log(`  ${violation.rule.name}: ${violation.from} → ${violation.to}`, 'red');
      log(`    ${violation.rule.comment}`, 'yellow');
    });
  } else {
    log('\n✅ UI Layer Boundaries: Clean', 'green');
  }

  // Polymorphic Issues
  if (categories.polymorphicIssues.length > 0) {
    log(`\n❌ Polymorphic Component Issues: ${categories.polymorphicIssues.length}`, 'red');
    categories.polymorphicIssues.forEach((violation) => {
      log(`  ${violation.rule.name}: ${violation.from} → ${violation.to}`, 'red');
      log(`    ${violation.rule.comment}`, 'yellow');
    });
  } else {
    log('\n✅ Polymorphic Components: Clean', 'green');
  }

  // Design Token Violations
  if (categories.designTokenViolations.length > 0) {
    log(`\n❌ Design Token Violations: ${categories.designTokenViolations.length}`, 'red');
    categories.designTokenViolations.forEach((violation) => {
      log(`  ${violation.rule.name}: ${violation.from} → ${violation.to}`, 'red');
      log(`    ${violation.rule.comment}`, 'yellow');
    });
  } else {
    log('\n✅ Design Tokens: Clean', 'green');
  }

  // Import Pattern Issues
  if (categories.importPatternIssues.length > 0) {
    log(`\n❌ Import Pattern Issues: ${categories.importPatternIssues.length}`, 'red');
    categories.importPatternIssues.forEach((violation) => {
      log(`  ${violation.rule.name}: ${violation.from} → ${violation.to}`, 'red');
      log(`    ${violation.rule.comment}`, 'yellow');
    });
  } else {
    log('\n✅ Import Patterns: Clean', 'green');
  }

  // Other Issues
  if (categories.other.length > 0) {
    log(`\n⚠️  Other Issues: ${categories.other.length}`, 'yellow');
    categories.other.forEach((violation) => {
      log(`  ${violation.rule.name}: ${violation.from} → ${violation.to}`, 'yellow');
      log(`    ${violation.rule.comment}`, 'yellow');
    });
  }

  // Summary
  log('\n' + '='.repeat(60), 'magenta');

  if (totalViolations === 0) {
    log('🎉 ALL DEPENDENCY VALIDATIONS PASSED!', 'green');
    log('Your UI ecosystem dependencies are properly structured.', 'green');
  } else {
    log(`⚠️  Found ${totalViolations} dependency violations`, 'yellow');
    log('Please review the UI/UX Guidelines for proper layer separation.', 'yellow');
  }

  return totalViolations;
}

function generateDependencyGraph() {
  log('\n📈 Generating Dependency Graph...', 'cyan');

  try {
    execSync(
      'npx dependency-cruiser --config .dependency-cruiser.js --output-type dot packages/ui packages/ui-business apps | dot -T svg -o dependency-graph.svg',
      {
        stdio: 'pipe',
      },
    );
    log('✅ Dependency graph saved to dependency-graph.svg', 'green');
  } catch (error) {
    log('⚠️  Could not generate dependency graph (dot not installed)', 'yellow');
    log('Install Graphviz to generate visual dependency graphs', 'yellow');
  }
}

function checkDependencyCruiserInstallation() {
  try {
    execSync('npx dependency-cruiser --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    log('❌ Dependency Cruiser not found', 'red');
    log('Installing dependency-cruiser...', 'yellow');

    try {
      execSync('npm install -g dependency-cruiser', { stdio: 'inherit' });
      log('✅ Dependency Cruiser installed successfully', 'green');
      return true;
    } catch (installError) {
      log('❌ Failed to install dependency-cruiser', 'red');
      log('Please install manually: npm install -g dependency-cruiser', 'red');
      return false;
    }
  }
}

function main() {
  log('🔍 AIBOS UI Ecosystem Dependency Validation', 'blue');
  log('Enhanced with UI-specific layer boundary rules', 'blue');

  // Check if dependency-cruiser is installed
  if (!checkDependencyCruiserInstallation()) {
    process.exit(1);
  }

  // Run dependency validation
  const violations = runDependencyCruiser();

  if (!violations || !violations.summary || !violations.summary.violations) {
    log('❌ Failed to run dependency validation', 'red');
    process.exit(1);
  }

  // Categorize and report violations
  const categories = categorizeViolations(violations.summary.violations);
  const totalViolations = generateDetailedReport(categories);

  // Generate dependency graph
  generateDependencyGraph();

  // Exit with error code if violations found
  if (totalViolations > 0) {
    log('\n💡 Next Steps:', 'cyan');
    log('1. Review the UI/UX Guidelines: docs/development/UI_UX_GUIDELINES.md', 'cyan');
    log('2. Follow the Refactoring Plan: docs/development/REFACTORING_PLAN.md', 'cyan');
    log('3. Fix violations starting with highest severity (error > warn)', 'cyan');
    process.exit(1);
  }
}

// Run validation
main();
