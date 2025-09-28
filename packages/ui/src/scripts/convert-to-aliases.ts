#!/usr/bin/env tsx

/**
 * Import Alias Converter - Enterprise Production Ready
 *
 * Automatically converts all relative imports to alias imports
 * following the standardized alias pattern.
 */

import { safeJoin } from '@aibos/utils';
import fs from 'node:fs';
import path from 'node:path';

// Alias mapping configuration
const ALIAS_MAPPINGS = {
  // Internal package aliases
  '@utils': 'src/utils',
  '@icons': 'src/icons',
  '@components': 'src/components',
  '@primitives': 'src/primitives',
  '@radix': 'src/radix',
  '@hooks': 'src/hooks',
  '@tokens': 'src/tokens',
  '@performance': 'src/performance',
  '@test': 'src/test',
  '@scripts': 'src/scripts',
  '@examples': 'src/examples',
  '@types': 'src/types',
} as const;

interface ConversionResult {
  file: string;
  conversions: number;
  errors: string[];
}

/**
 * Convert relative imports to alias imports in a file
 */
function convertFileImports(filePath: string): ConversionResult {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const result: ConversionResult = {
    file: filePath,
    conversions: 0,
    errors: [],
  };

  const convertedLines = lines.map((line, index) => {
    // Match import statements with relative paths
    const importMatch = line.match(/^(\s*import\s+.*?\s+from\s+['"])(\.\.?\/[^'"]+)(['"])/);

    if (!importMatch) {
      return line;
    }

    const [, prefix, relativePath, suffix] = importMatch;

    if (!relativePath) {
      return line; // Skip if no relative path found
    }

    try {
      // Resolve the relative path to absolute
      const fileDirectory = path.dirname(filePath);
      const absolutePath = path.resolve(fileDirectory, relativePath);

      // Find the best alias match
      const alias = findBestAlias(absolutePath, filePath);

      if (alias) {
        const aliasPath = convertToAliasPath(absolutePath, alias);
        result.conversions++;
        return `${prefix}${aliasPath}${suffix}`;
      } else {
        result.errors.push(`Line ${index + 1}: Could not find alias for ${relativePath}`);
        return line;
      }
    } catch (_error) {
      result.errors.push(`Line ${index + 1}: Error processing ${relativePath}: ${_error}`);
      return line;
    }
  });

  // Write back if there were conversions
  if (result.conversions > 0) {
    fs.writeFileSync(filePath, convertedLines.join('\n'));
  }

  return result;
}

/**
 * Find the best alias for a given absolute path
 */
function findBestAlias(absolutePath: string, _currentFile: string): string | undefined {
  const sourcePath = path.resolve(process.cwd(), 'src');

  // Check if the path is within src directory
  if (!absolutePath.startsWith(sourcePath)) {
    return undefined;
  }

  const relativeToSource = path.relative(sourcePath, absolutePath);

  // Find the best matching alias
  for (const [alias, aliasPath] of Object.entries(ALIAS_MAPPINGS)) {
    if (relativeToSource.startsWith(aliasPath.replace('src/', ''))) {
      return alias;
    }
  }

  return undefined;
}

/**
 * Convert absolute path to alias path
 */
function convertToAliasPath(absolutePath: string, alias: string): string {
  const sourcePath = path.resolve(process.cwd(), 'src');
  const aliasPath = path.resolve(sourcePath, ALIAS_MAPPINGS[alias as keyof typeof ALIAS_MAPPINGS]);

  const relativeToAlias = path.relative(aliasPath, absolutePath);

  if (relativeToAlias === '') {
    return alias;
  }

  return `${alias}/${relativeToAlias.replace(/\\/g, '/')}`;
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
 * Main conversion function
 */
async function convertAllFiles(): Promise<void> {
  console.log('🔄 Converting relative imports to alias imports...\n');

  // Find all TypeScript/TSX files
  const files = findTsFiles(safeJoin(process.cwd(), 'src'));

  console.log(`📁 Found ${files.length} TypeScript/TSX files to process`);

  let totalConversions = 0;
  let totalErrors = 0;

  for (const file of files) {
    const result = convertFileImports(file);
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

  console.log(`\n📊 Conversion Summary:`);
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Total conversions: ${totalConversions}`);
  console.log(`   Total errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.log(`\n⚠️  Some files had errors. Please review manually.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All imports successfully converted to aliases!`);
  }
}

// Run the conversion
console.log('🚀 Starting conversion script...');
convertAllFiles().catch(console.error);
