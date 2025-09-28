#!/usr/bin/env node

/**
 * UI Ecosystem Validation Script
 *
 * Validates the current state against UI/UX guidelines
 * Checks for layer boundary violations, dependency issues, and build problems
 */

import fs from 'fs';
import { safeGet } from '@aibos/utils';
import { safeJoin } from '@aibos/utils';
const BASE_DIR = process.cwd();
import path from 'path';
import { execSync } from 'child_process';

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

function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(safeJoin(BASE_DIR, currentDir));

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(safeJoin(BASE_DIR, fullPath));

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

function checkLayerBoundaries() {
  log('\n🔍 Checking Layer Boundaries...', 'cyan');

  const violations = [];

  // Check UI primitives for business imports
  const uiFiles = getAllFiles('packages/ui/src');
  for (const file of uiFiles) {
    const content = readFileContent(file);
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (
        line.includes('@aibos/ui-business') ||
        line.includes('@aibos/accounting-contracts') ||
        line.includes('@aibos/accounting-web')
      ) {
        violations.push({
          type: 'UI_BUSINESS_IMPORT',
          file,
          line: index + 1,
          content: line.trim(),
        });
      }
    });
  }

  // Check apps for direct UI imports
  const appFiles = getAllFiles('apps');
  for (const file of appFiles) {
    const content = readFileContent(file);
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (
        line.includes('@aibos/ui/primitives') ||
        line.includes('@aibos/ui/components') ||
        line.includes('@aibos/ui/hooks')
      ) {
        violations.push({
          type: 'DIRECT_UI_IMPORT',
          file,
          line: index + 1,
          content: line.trim(),
        });
      }
    });
  }

  return violations;
}

function checkPolymorphicComponents() {
  log('\n🔧 Checking Polymorphic Components...', 'cyan');

  const issues = [];
  const uiFiles = getAllFiles('packages/ui/src');

  for (const file of uiFiles) {
    const content = readFileContent(file);

    // Check if component uses createPolymorphic
    if (content.includes('export const') && content.includes('createPolymorphic')) {
      // Check for proper as prop
      if (!content.includes('as?: ElementType')) {
        issues.push({
          type: 'MISSING_AS_PROP',
          file,
          issue: 'Component uses createPolymorphic but missing as prop in interface',
        });
      }

      // Check for ref forwarding
      if (!content.includes('ref: PolymorphicReference')) {
        issues.push({
          type: 'MISSING_REF_FORWARDING',
          file,
          issue: 'Component uses createPolymorphic but missing proper ref typing',
        });
      }
    }
  }

  return issues;
}

function checkPackageDependencies() {
  log('\n📦 Checking Package Dependencies...', 'cyan');

  const issues = [];

  // Check UI package dependencies
  const uiPackagePath = 'packages/ui/package.json';
  if (fs.existsSync(safeJoin(BASE_DIR, uiPackagePath))) {
    const uiPackage = JSON.parse(fs.readFileSync(uiPackagePath, 'utf8'));

    // UI should not have business dependencies
    const businessDeps = Object.keys(uiPackage.dependencies || {}).filter(
      (dep) =>
        dep.includes('ui-business') ||
        dep.includes('accounting-contracts') ||
        dep.includes('accounting-web'),
    );

    if (businessDeps.length > 0) {
      issues.push({
        type: 'UI_BUSINESS_DEPENDENCY',
        package: 'ui',
        dependencies: businessDeps,
      });
    }
  }

  // Check UI-Business package dependencies
  const uiBusinessPackagePath = 'packages/ui-business/package.json';
  if (fs.existsSync(safeJoin(BASE_DIR, uiBusinessPackagePath))) {
    const uiBusinessPackage = JSON.parse(fs.readFileSync(uiBusinessPackagePath, 'utf8'));

    // UI-Business should have UI dependency
    if (!uiBusinessPackage.dependencies?.['@aibos/ui']) {
      issues.push({
        type: 'MISSING_UI_DEPENDENCY',
        package: 'ui-business',
        issue: 'Missing @aibos/ui dependency',
      });
    }
  }

  return issues;
}

function checkBuildSystem() {
  log('\n🔨 Checking Build System...', 'cyan');

  const issues = [];

  try {
    // Test if packages can build independently
    log('Testing UI package build...', 'yellow');
    execSync('pnpm build --filter=@aibos/ui', { stdio: 'pipe' });
    log('✅ UI package builds successfully', 'green');
  } catch (error) {
    issues.push({
      type: 'UI_BUILD_FAILURE',
      error: error.message,
    });
  }

  try {
    log('Testing UI-Business package build...', 'yellow');
    execSync('pnpm build --filter=@aibos/ui-business', { stdio: 'pipe' });
    log('✅ UI-Business package builds successfully', 'green');
  } catch (error) {
    issues.push({
      type: 'UI_BUSINESS_BUILD_FAILURE',
      error: error.message,
    });
  }

  return issues;
}

function checkTypeScript() {
  log('\n📝 Checking TypeScript...', 'cyan');

  const issues = [];

  try {
    log('Running type check...', 'yellow');
    execSync('pnpm typecheck', { stdio: 'pipe' });
    log('✅ TypeScript check passed', 'green');
  } catch (error) {
    issues.push({
      type: 'TYPESCRIPT_ERRORS',
      error: error.message,
    });
  }

  return issues;
}

function generateReport(violations, issues) {
  log('\n📊 VALIDATION REPORT', 'magenta');
  log('='.repeat(50), 'magenta');

  // Layer Boundary Violations
  if (violations.length > 0) {
    log(`\n❌ Layer Boundary Violations: ${violations.length}`, 'red');
    violations.forEach((violation) => {
      log(`  ${violation.type}: ${violation.file}:${violation.line}`, 'red');
      log(`    ${violation.content}`, 'yellow');
    });
  } else {
    log('\n✅ No Layer Boundary Violations Found', 'green');
  }

  // Polymorphic Component Issues
  const polyIssues = issues.filter(
    (issue) =>
      issue.type.includes('POLYMORPHIC') ||
      issue.type.includes('MISSING_AS_PROP') ||
      issue.type.includes('MISSING_REF_FORWARDING'),
  );

  if (polyIssues.length > 0) {
    log(`\n❌ Polymorphic Component Issues: ${polyIssues.length}`, 'red');
    polyIssues.forEach((issue) => {
      log(`  ${issue.type}: ${issue.file}`, 'red');
      log(`    ${issue.issue}`, 'yellow');
    });
  } else {
    log('\n✅ All Components Properly Polymorphic', 'green');
  }

  // Package Dependency Issues
  const depIssues = issues.filter(
    (issue) => issue.type.includes('DEPENDENCY') || issue.type.includes('PACKAGE'),
  );

  if (depIssues.length > 0) {
    log(`\n❌ Package Dependency Issues: ${depIssues.length}`, 'red');
    depIssues.forEach((issue) => {
      log(`  ${issue.type}: ${issue.package || 'Unknown'}`, 'red');
      if (issue.dependencies) {
        log(`    Dependencies: ${issue.dependencies.join(', ')}`, 'yellow');
      }
      if (issue.issue) {
        log(`    ${issue.issue}`, 'yellow');
      }
    });
  } else {
    log('\n✅ Package Dependencies Correct', 'green');
  }

  // Build System Issues
  const buildIssues = issues.filter(
    (issue) => issue.type.includes('BUILD') || issue.type.includes('TYPESCRIPT'),
  );

  if (buildIssues.length > 0) {
    log(`\n❌ Build System Issues: ${buildIssues.length}`, 'red');
    buildIssues.forEach((issue) => {
      log(`  ${issue.type}`, 'red');
      log(`    ${issue.error}`, 'yellow');
    });
  } else {
    log('\n✅ Build System Working Correctly', 'green');
  }

  // Summary
  const totalIssues = violations.length + issues.length;
  log('\n' + '='.repeat(50), 'magenta');

  if (totalIssues === 0) {
    log('🎉 ALL VALIDATIONS PASSED!', 'green');
    log('Your UI ecosystem is properly structured and ready for production.', 'green');
  } else {
    log(`⚠️  Found ${totalIssues} issues that need attention`, 'yellow');
    log('Please review the UI/UX Guidelines and Refactoring Plan for solutions.', 'yellow');
  }

  return totalIssues;
}

function main() {
  log('🚀 AIBOS UI Ecosystem Validation', 'blue');
  log('Validating against UI/UX Guidelines...', 'blue');

  const violations = checkLayerBoundaries();
  const polyIssues = checkPolymorphicComponents();
  const depIssues = checkPackageDependencies();
  const buildIssues = checkBuildSystem();
  const tsIssues = checkTypeScript();

  const allIssues = [...polyIssues, ...depIssues, ...buildIssues, ...tsIssues];
  const totalIssues = generateReport(violations, allIssues);

  // Exit with error code if issues found
  if (totalIssues > 0) {
    process.exit(1);
  }
}

// Run validation
main();
