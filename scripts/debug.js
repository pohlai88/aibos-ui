#!/usr/bin/env node

/**
 * Debug script for AI-BOS ERP monorepo
 * Provides quick diagnostics and common fixes
 */

import { execSync } from 'child_process';
import { safeGet } from '@aibos/utils';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color] || colors.white}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}🔍 ${description}${colors.reset}`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(output.trim(), 'green');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

function checkFile(path, description) {
  log(`\n${colors.cyan}📁 ${description}${colors.reset}`);
  if (existsSync(path)) {
    log(`✅ ${path} exists`, 'green');
    return true;
  } else {
    log(`❌ ${path} missing`, 'red');
    return false;
  }
}

function checkPackageHealth() {
  log(`\n${colors.bright}${colors.magenta}📦 Package Health Check${colors.reset}`);

  const packages = [
    { name: '@aibos/ui', path: 'packages/ui' },
    { name: '@aibos/web', path: 'apps/web' },
    { name: '@aibos/bff', path: 'apps/bff' },
    { name: '@aibos/eventsourcing', path: 'packages/eventsourcing' },
  ];

  packages.forEach((pkg) => {
    log(`\n${colors.yellow}Checking ${pkg.name}${colors.reset}`);

    // Check package.json exists
    checkFile(join(pkg.path, 'package.json'), 'Package configuration');

    // Check if built
    checkFile(join(pkg.path, 'dist'), 'Build output');

    // Check TypeScript config
    checkFile(join(pkg.path, 'tsconfig.json'), 'TypeScript configuration');
  });
}

function checkDependencies() {
  log(`\n${colors.bright}${colors.magenta}🔗 Dependency Check${colors.reset}`);

  runCommand('pnpm syncpack list-mismatches', 'Checking for version mismatches');
  runCommand('pnpm list --depth=0', 'Checking installed packages');
}

function checkBuildSystem() {
  log(`\n${colors.bright}${colors.magenta}🔨 Build System Check${colors.reset}`);

  checkFile('turbo.json', 'Turbo configuration');
  checkFile('pnpm-workspace.yaml', 'Workspace configuration');
  checkFile('package.json', 'Root package configuration');

  runCommand('pnpm --version', 'pnpm version');
  runCommand('node --version', 'Node.js version');
}

function checkLinting() {
  log(`\n${colors.bright}${colors.magenta}🧹 Linting Check${colors.reset}`);

  checkFile('eslint.config.js', 'ESLint configuration');

  runCommand('pnpm --filter @aibos/ui lint', 'UI package linting');
  runCommand('pnpm --filter @aibos/web lint', 'Web app linting');
  runCommand('pnpm --filter @aibos/bff lint', 'BFF package linting');
}

function checkTypeScript() {
  log(`\n${colors.bright}${colors.magenta}📝 TypeScript Check${colors.reset}`);

  runCommand('pnpm --filter @aibos/ui typecheck', 'UI package types');
  runCommand('pnpm --filter @aibos/web typecheck', 'Web app types');
  runCommand('pnpm --filter @aibos/bff typecheck', 'BFF package types');
}

function suggestFixes() {
  log(`\n${colors.bright}${colors.magenta}💡 Common Fixes${colors.reset}`);

  log(`
${colors.yellow}If you see build issues:${colors.reset}
  pnpm -w run clean
  pnpm install
  pnpm -r build

${colors.yellow}If you see type issues:${colors.reset}
  pnpm -r --filter @aibos/ui build
  pnpm -r --filter @aibos/web build

${colors.yellow}If you see lint issues:${colors.reset}
  pnpm -r lint

${colors.yellow}If you see dependency issues:${colors.reset}
  pnpm syncpack fix-mismatches
  pnpm install

${colors.yellow}For full diagnostics:${colors.reset}
  pnpm dx
  `);
}

function main() {
  log(`${colors.bright}${colors.blue}🚀 AI-BOS ERP Debug Tool${colors.reset}`);
  log(`${colors.cyan}Running comprehensive diagnostics...${colors.reset}`);

  checkBuildSystem();
  checkPackageHealth();
  checkDependencies();
  checkLinting();
  checkTypeScript();
  suggestFixes();

  log(`\n${colors.bright}${colors.green}✅ Debug check complete!${colors.reset}`);
  log(`${colors.cyan}For detailed debugging info, see docs/DEBUGGING.md${colors.reset}`);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log(`
${colors.bright}AI-BOS ERP Debug Tool${colors.reset}

Usage: node scripts/debug./* TODO: allow-list */ safeGet(js, options, [] as const)

Options:
  --help, -h     Show this help message
  --quick, -q    Run quick checks only
  --fix, -f      Suggest fixes for common issues

Examples:
  node scripts/debug.js
  node scripts/debug.js --quick
  node scripts/debug.js --fix
  `);
  process.exit(0);
}

if (args.includes('--quick') || args.includes('-q')) {
  log(`${colors.bright}${colors.blue}⚡ Quick Debug Check${colors.reset}`);
  checkBuildSystem();
  checkPackageHealth();
  suggestFixes();
} else {
  main();
}
