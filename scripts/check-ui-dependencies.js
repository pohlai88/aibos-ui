#!/usr/bin/env node

/**
 * Simple UI Dependency Checker
 *
 * Checks for UI ecosystem violations using dependency-cruiser
 * Provides clear reporting for layer boundary issues
 */

import { execSync } from 'child_process';
import { safeGet } from '@aibos/utils';

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

function checkDependencies() {
  log('🔍 AIBOS UI Ecosystem Dependency Check', 'blue');
  log('Checking layer boundaries and import patterns...', 'cyan');

  try {
    // Run dependency cruiser
    const result = execSync(
      'npx dependency-cruiser --config .dependency-cruiser.js packages/ui packages/ui-business apps',
      {
        encoding: 'utf8',
        stdio: 'inherit',
      },
    );

    log('\n✅ Dependency check completed successfully!', 'green');
    return true;
  } catch (error) {
    log('\n❌ Dependency violations found!', 'red');
    log('Review the violations above and fix them according to UI/UX Guidelines.', 'yellow');
    return false;
  }
}

function main() {
  const success = checkDependencies();

  if (!success) {
    log('\n💡 Next Steps:', 'cyan');
    log('1. Review UI/UX Guidelines: docs/development/UI_UX_GUIDELINES.md', 'cyan');
    log('2. Follow Refactoring Plan: docs/development/REFACTORING_PLAN.md', 'cyan');
    log('3. Fix violations starting with highest severity (error > warn)', 'cyan');
    process.exit(1);
  }

  log('\n🎉 All dependency checks passed!', 'green');
  log('Your UI ecosystem dependencies are properly structured.', 'green');
}

main();
