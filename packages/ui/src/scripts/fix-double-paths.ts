#!/usr/bin/env tsx

/**
 * Fix Double Path Aliases - Enterprise Production Ready
 *
 * Fixes incorrect alias imports that have double paths like:
 * @utils/cn.utility -> @utils/cn.utility
 */

import { safeJoin } from '@aibos/utils';
import fs from 'node:fs';
import { join as _join, dirname as _dirname } from 'node:path';

// Patterns to match double path aliases
const DOUBLE_PATH_PATTERNS = [
  /@([^/]+)\/\.\.\/\.\.\/([^'"]+)/g, // @utils/cn.utility
  /@([^/]+)\/([^/]+)\/([^'"]+)/g, // @utils/cn.utility
];

/**
 * Fix double path aliases in a file
 */
function fixFileDoublePaths(filePath: string): { conversions: number; errors: string[] } {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const result = { conversions: 0, errors: [] };

  const convertedLines = lines.map((line, _index) => {
    let convertedLine = line;

    // Handle @utils/cn.utility pattern
    const pattern1Matches = DOUBLE_PATH_PATTERNS[0]
      ? [...line.matchAll(DOUBLE_PATH_PATTERNS[0])]
      : [];
    for (const match of pattern1Matches) {
      const [, alias, restPath] = match;
      const correctPath = `@${alias}/${restPath}`;
      convertedLine = convertedLine.replace(match[0], correctPath);
      result.conversions++;
    }

    // Handle @utils/cn.utility pattern (where the first part after alias is the same as alias)
    const pattern2Matches = DOUBLE_PATH_PATTERNS[1]
      ? [...line.matchAll(DOUBLE_PATH_PATTERNS[1])]
      : [];
    for (const match of pattern2Matches) {
      const [, alias, duplicatePart, restPath] = match;
      // Only fix if the duplicate part matches the alias
      if (alias === duplicatePart) {
        const correctPath = `@${alias}/${restPath}`;
        convertedLine = convertedLine.replace(match[0], correctPath);
        result.conversions++;
      }
    }

    return convertedLine;
  });

  // Write back if there were conversions
  if (result.conversions > 0) {
    fs.writeFileSync(filePath, convertedLines.join('\n'));
  }

  return result;
}

/**
 * Recursively find all TypeScript/TSX files
 */
function findTsFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = safeJoin(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, dist, .git, etc.
        if (!['node_modules', 'dist', '.git', '.turbo', 'coverage'].includes(entry.name)) {
          files.push(...findTsFiles(fullPath));
        }
      } else if (
        entry.isFile() &&
        /\.(ts|tsx)$/.test(entry.name) &&
        !entry.name.endsWith('.d.ts')
      ) {
        files.push(fullPath);
      }
    }
  } catch (_error) {
    // Skip directories we can't read
  }

  return files;
}

/**
 * Main fix function
 */
async function fixAllDoublePaths(): Promise<void> {
  console.log('🔧 Fixing double path aliases...\n');

  // Find all TypeScript/TSX files
  const files = findTsFiles(safeJoin(process.cwd(), 'src'));

  console.log(`📁 Found ${files.length} TypeScript/TSX files to process`);

  let totalConversions = 0;
  let totalErrors = 0;

  for (const file of files) {
    const result = fixFileDoublePaths(file);
    totalConversions += result.conversions;
    totalErrors += result.errors.length;

    if (result.conversions > 0) {
      console.log(`✅ ${file}: ${result.conversions} conversions`);
    }

    if (result.errors.length > 0) {
      console.log(`❌ ${file}: ${result.errors.length} errors`);
      result.errors.forEach((error) => console.log(`   ${error}`));
    }
  }

  console.log(`\n📊 Fix Summary:`);
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Total conversions: ${totalConversions}`);
  console.log(`   Total errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.log(`\n⚠️  Some files had errors. Please review manually.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All double path aliases fixed!`);
  }
}

// Run the fix
console.log('🚀 Starting double path fix script...');
fixAllDoublePaths().catch(console.error);
