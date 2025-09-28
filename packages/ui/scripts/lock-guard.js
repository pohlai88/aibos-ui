#!/usr/bin/env node

/**
 * AIBOS UI Package Lock Guard
 *
 * This script prevents unauthorized modifications to the ui package
 * by checking for proper approval before allowing changes.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..');

// Protected files that require approval
const PROTECTED_FILES = [
  'src/index.ts',
  'src/core.ts',
  'src/components/index.ts',
  'src/primitives/index.ts',
  'src/radix/index.ts',
  'src/icons/index.ts',
  'src/utils/index.ts',
  'src/tokens/index.ts',
  'src/types/index.ts',
  'src/hooks/index.ts',
  'src/performance/index.ts',
  'package.json',
  'tsconfig.json',
  'tsconfig.types.json',
  'tsup.config.ts',
  'vitest.config.ts',
  'playwright.config.ts',
];

// Lock file path
const LOCK_FILE = join(PACKAGE_ROOT, '.lockfile');

/**
 * Generate hash for file content
 */
function generateFileHash(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf8');
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Check if lock is active
 */
function isLockActive() {
  if (!existsSync(LOCK_FILE)) return false;

  const lockContent = readFileSync(LOCK_FILE, 'utf8');
  return lockContent.includes('LOCK STATUS: ACTIVE');
}

/**
 * Verify file integrity
 */
function verifyFileIntegrity() {
  const lockContent = readFileSync(LOCK_FILE, 'utf8');
  const expectedHashes = {};

  // Extract expected hashes from lock file
  const hashRegex = /HASH_([^:]+):\s*([a-f0-9]{64})/g;
  let match;
  while ((match = hashRegex.exec(lockContent)) !== null) {
    expectedHashes[match[1]] = match[2];
  }

  // Verify each protected file
  for (const file of PROTECTED_FILES) {
    const filePath = join(PACKAGE_ROOT, file);
    const currentHash = generateFileHash(filePath);
    const expectedHash = expectedHashes[file.replace(/\//g, '_')];

    if (expectedHash && currentHash !== expectedHash) {
      console.error(`❌ File integrity violation detected: ${file}`);
      console.error(`Expected: ${expectedHash}`);
      console.error(`Current:  ${currentHash}`);
      return false;
    }
  }

  return true;
}

/**
 * Update lock file with current file hashes
 */
function updateLockHashes() {
  if (!existsSync(LOCK_FILE)) {
    console.error('❌ Lock file not found. Cannot update hashes.');
    return false;
  }

  let lockContent = readFileSync(LOCK_FILE, 'utf8');

  // Remove old hashes
  lockContent = lockContent.replace(/HASH_[^:]+:\s*[a-f0-9]{64}\n/g, '');

  // Add current hashes
  const hashSection = '\n# FILE INTEGRITY HASHES:\n';
  let newHashes = hashSection;

  for (const file of PROTECTED_FILES) {
    const filePath = join(PACKAGE_ROOT, file);
    const hash = generateFileHash(filePath);
    if (hash) {
      newHashes += `HASH_${file.replace(/\//g, '_')}: ${hash}\n`;
    }
  }

  // Insert hashes before the warning
  const warningIndex = lockContent.indexOf('⚠️  WARNING:');
  if (warningIndex !== -1) {
    lockContent =
      lockContent.slice(0, warningIndex) + newHashes + '\n' + lockContent.slice(warningIndex);
  } else {
    lockContent += newHashes;
  }

  writeFileSync(LOCK_FILE, lockContent);
  console.log('✅ Lock file updated with current file hashes');
  return true;
}

/**
 * Main lock guard function
 */
function guardPackage() {
  console.log('🔒 AIBOS UI Package Lock Guard');
  console.log('==============================');

  if (!isLockActive()) {
    console.log('⚠️  Lock is not active. Package is not protected.');
    return true;
  }

  console.log('✅ Lock is active. Verifying file integrity...');

  if (!verifyFileIntegrity()) {
    console.error('❌ File integrity check failed!');
    console.error('Unauthorized modifications detected.');
    console.error('Please contact package maintainer for approval.');
    process.exit(1);
  }

  console.log('✅ File integrity verified. Package is secure.');
  return true;
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'check':
    guardPackage();
    break;
  case 'update-hashes':
    updateLockHashes();
    break;
  case 'status':
    console.log(`Lock Status: ${isLockActive() ? 'ACTIVE' : 'INACTIVE'}`);
    break;
  default:
    console.log('Usage: node lock-guard.js [check|update-hashes|status]');
    console.log('  check         - Verify package integrity');
    console.log('  update-hashes - Update lock file with current hashes');
    console.log('  status        - Show lock status');
    process.exit(1);
}

export { guardPackage, updateLockHashes, isLockActive };
