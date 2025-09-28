#!/usr/bin/env node

/**
 * NPM Blocker Script - Monorepo Safety Guard
 *
 * This script prevents npm usage in the monorepo to avoid
 * dependency conflicts and ensure consistent package management.
 */

import fs from 'fs';
import path from 'path';

// Simple safeJoin implementation to avoid dependency issues
function safeJoin(baseDirectory, userPath) {
  const base = path.resolve(baseDirectory);
  const full = path.resolve(base, userPath);

  // Check if the resolved path is within the base directory
  if (!full.startsWith(base + path.sep) && full !== base) {
    throw new Error(`Path traversal blocked: ${userPath} would escape ${baseDirectory}`);
  }

  return full;
}

const BASE_DIR = process.cwd();

// ANSI color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function logError(message) {
  console.error(
    `${colors.red}${colors.bold}❌ ERROR:${colors.reset} ${colors.red}${message}${colors.reset}`,
  );
}

function logWarning(message) {
  console.warn(
    `${colors.yellow}${colors.bold}⚠️  WARNING:${colors.reset} ${colors.yellow}${message}${colors.reset}`,
  );
}

function logInfo(message) {
  console.log(
    `${colors.blue}${colors.bold}ℹ️  INFO:${colors.reset} ${colors.blue}${message}${colors.reset}`,
  );
}

function logSuccess(message) {
  console.log(
    `${colors.green}${colors.bold}✅ SUCCESS:${colors.reset} ${colors.green}${message}${colors.reset}`,
  );
}

function checkNpmUsage() {
  const rootDir = process.cwd();
  const packageJsonPath = path.join(rootDir, 'package.json');

  // Check if we're in a monorepo with pnpm
  if (!fs.existsSync(safeJoin(BASE_DIR, packageJsonPath))) {
    logError('No package.json found in current directory');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Check if packageManager is set to pnpm
  if (packageJson.packageManager && !packageJson.packageManager.startsWith('pnpm')) {
    logError(
      `Package manager is set to '${packageJson.packageManager}' but this monorepo requires pnpm`,
    );
    process.exit(1);
  }

  // Check for npm lock files
  const npmLockFiles = ['package-lock.json', 'npm-shrinkwrap.json'];
  const foundNpmFiles = npmLockFiles.filter((file) => fs.existsSync(path.join(rootDir, file)));

  if (foundNpmFiles.length > 0) {
    logError(`Found npm lock files: ${foundNpmFiles.join(', ')}`);
    logError(
      'This monorepo uses pnpm exclusively. Please remove npm lock files and use pnpm instead.',
    );
    logInfo('Run: rm -f package-lock.json npm-shrinkwrap.json');
    process.exit(1);
  }

  // Check for yarn lock files
  if (fs.existsSync(path.join(rootDir, 'yarn.lock'))) {
    logError('Found yarn.lock file');
    logError('This monorepo uses pnpm exclusively. Please remove yarn.lock and use pnpm instead.');
    logInfo('Run: rm -f yarn.lock');
    process.exit(1);
  }

  // Check if pnpm-lock.yaml exists
  if (!fs.existsSync(path.join(rootDir, 'pnpm-lock.yaml'))) {
    logWarning('No pnpm-lock.yaml found. Run "pnpm install" to generate it.');
  }

  // Check for npm usage in scripts (but not pnpm)
  const scripts = packageJson.scripts || {};
  const npmScripts = Object.entries(scripts).filter(
    ([name, script]) =>
      typeof script === 'string' &&
      (script.includes('npm ') || script.includes('npm@') || script.includes('npm-')) &&
      !script.includes('pnpm'),
  );

  if (npmScripts.length > 0) {
    logError('Found npm usage in scripts:');
    npmScripts.forEach(([name, script]) => {
      logError(`  ${name}: ${script}`);
    });
    logError('Please replace npm commands with pnpm equivalents.');
    process.exit(1);
  }

  // Check for npm usage in CI/CD files
  const ciFiles = [
    '.github/workflows',
    '.gitlab-ci.yml',
    'azure-pipelines.yml',
    'Jenkinsfile',
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.dev.yml',
  ];

  let foundNpmInCI = false;

  ciFiles.forEach((file) => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(safeJoin(BASE_DIR, filePath))) {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('npm ') && !content.includes('pnpm')) {
          logError(`Found npm usage in ${file}`);
          foundNpmInCI = true;
        }
      }
    }
  });

  if (foundNpmInCI) {
    logError('Please replace npm commands with pnpm in CI/CD files.');
    process.exit(1);
  }

  // Check for npm in README files
  const readmeFiles = ['README.md', 'README.txt', 'readme.md'];
  readmeFiles.forEach((file) => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(safeJoin(BASE_DIR, filePath))) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('npm ') && !content.includes('pnpm')) {
        logWarning(`Found npm usage in ${file}. Consider updating to use pnpm.`);
      }
    }
  });

  logSuccess('NPM usage check passed! This monorepo is properly configured for pnpm.');
}

function main() {
  logInfo('🔒 Checking for npm usage in monorepo...');

  try {
    checkNpmUsage();
  } catch (error) {
    logError(`Failed to check npm usage: ${error.message}`);
    process.exit(1);
  }
}

// Run the check
main();
