#!/usr/bin/env node

/**
 * Component Scanner
 *
 * Scans the codebase for components used in ERP pages and flags
 * unmapped components in the usage map.
 */

import {
  safeGet,
  safeSet,
  hasOwn,
  safePath,
  readFileSafe,
  readDirectorySafe,
  existsSafe,
  EXTENSIONS,
  ScanComponentsArgs,
  parseArgs,
  showHelp,
} from '@aibos/utils';
import { safeRegExpFromUser } from '@aibos/utils/security';
import type fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

interface UsageMap {
  components?: Record<
    string,
    {
      pages?: string[];
      stories?: string[];
      description?: string;
    }
  >;
}

interface ScanResult {
  unmappedComponents: string[];
  unusedComponents: string[];
  importPatterns: Record<string, string[]>;
  recommendations: string[];
}

type CliOptions = {
  webRoot: string;
  usageMapPath: string;
  pkgName: string;
  extensions: string[];
  json: boolean;
  failOnUnmapped: boolean;
};

// Reduce complexity via helpers & allowlists; prevent object injection
const ALLOWED_EXT = new Set(['.tsx', '.ts']);

function isAllowedExtension(f: string) {
  return ALLOWED_EXT.has(path.extname(f));
}

// This function is now replaced by the shared utility

function parseCli(): CliOptions {
  try {
    const args = parseArgs(ScanComponentsArgs);

    if (args.help) {
      showHelp(
        'Component Scanner',
        'Scans the codebase for components used in ERP pages and flags unmapped components',
        [
          'pnpm run scan-components -- --input src/components --verbose',
          'pnpm run scan-components -- --input src --output report.json',
        ],
      );
      process.exit(0);
    }

    // Use safe path resolution
    const webRoot = safePath(PROJECT_ROOT, args.input || 'apps/web/src');
    const usageMapPath = safePath(PROJECT_ROOT, 'packages/ui/docs/usage-map.json');
    const packageName = '@aibos/ui';
    const extensions = args.extensions || ['.ts', '.tsx'];
    const json = !!args.output;
    const failOnUnmapped = false; // Could be added to schema if needed

    return { webRoot, usageMapPath, pkgName: packageName, extensions, json, failOnUnmapped };
  } catch (error) {
    console.error('❌ Failed to parse arguments:', error);
    process.exit(1);
  }
}

const DEFAULT_IGNORES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.storybook',
  'storybook-static',
  '.turbo',
  '.cache',
]);

function scanDirectory(dirPath: string, extensions: string[] = ['.tsx', '.ts']): string[] {
  const files: string[] = [];
  const entries = readDirectorySafe(PROJECT_ROOT, dirPath, {
    withFileTypes: true,
    recursive: true,
  }) as fs.Dirent[];

  for (const entry of entries) {
    if (DEFAULT_IGNORES.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath, extensions));
    } else if (entry.isFile() && isAllowedExtension(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractImports(filePath: string, packageName: string): string[] {
  const content = readFileSafe(PROJECT_ROOT, filePath, {
    allowedExtensions: [...EXTENSIONS.ALL_SOURCE],
  });
  const imports: string[] = [];

  // Handle ESM imports with optional deep subpaths & multiline named imports
  // e.g. import { Button, Card as UICard } from '@scope/pkg';
  //      import Button from '@scope/pkg/button';
  const esmRegex = safeRegExpFromUser(
    String.raw`import[\s\S]*?from\s+['"]${packageName.replace('/', String.raw`\/`)}(?:\/([^'"]+))?['"]`,
    'g',
  );
  let match: RegExpExecArray | null;

  while ((match = esmRegex.exec(content)) !== null) {
    if (match[1]) {
      const importPath = match[1];
      const componentName = path.posix.basename(importPath);
      imports.push(componentName);
    } else {
      // find the closest named import block preceding this "from"
      const beforeFrom = content.slice(0, esmRegex.lastIndex);
      const namedBlock = beforeFrom.match(/import\s+{([\s\S]*?)}\s+from\s+['"][^'"]+['"]\s*$/m);
      if (namedBlock && namedBlock[1]) {
        imports.push(
          ...namedBlock[1]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => s.split(/\s+as\s+/i)[0]?.trim() || ''), // strip alias
        );
      } else {
        // default import without subpath, we can't know component name reliably — skip
      }
    }
  }

  // Handle CommonJS requires with subpaths: const Button = require('@aibos/ui/button')
  const cjsRegex = safeRegExpFromUser(
    String.raw`require\(\s*['"]${packageName.replace('/', String.raw`\/`)}\/([^'"]+)['"]\s*\)`,
    'g',
  );
  while ((match = cjsRegex.exec(content)) !== null) {
    const componentName = path.posix.basename(match[1]!);
    imports.push(componentName);
  }

  return imports;
}

function loadUsageMap(usageMapPath: string): UsageMap {
  if (!existsSafe(PROJECT_ROOT, usageMapPath)) {
    throw new Error(`Usage map not found at ${usageMapPath}`);
  }
  const content = readFileSafe(PROJECT_ROOT, usageMapPath, {
    allowedExtensions: [...EXTENSIONS.JSON],
  });
  return JSON.parse(content) as UsageMap;
}

function scanComponents(options: CliOptions): ScanResult {
  const usageMap = loadUsageMap(options.usageMapPath);
  const mappedComponents = new Set(Object.keys(usageMap.components || {}));

  const webAppPath = options.webRoot;
  const erpFiles = scanDirectory(webAppPath, options.extensions);

  const importPatterns: Record<string, string[]> = {};
  const foundComponents = new Set<string>();

  // Scan each file for imports
  erpFiles.forEach((filePath) => {
    const imports = extractImports(filePath, options.pkgName);
    const relativePath = path.relative(webAppPath, filePath);

    imports.forEach((component) => {
      foundComponents.add(component);
      if (!hasOwn(importPatterns, component)) {
        safeSet(importPatterns, component, []);
      }
      const patterns = safeGet(importPatterns, component, Object.keys(importPatterns)) as string[];
      if (patterns) {
        patterns.push(relativePath);
      }
    });
  });

  // Find unmapped components
  const unmappedComponents = Array.from(foundComponents).filter(
    (component) => !mappedComponents.has(component),
  );

  // Find unused components
  const unusedComponents = Array.from(mappedComponents).filter(
    (component) => !foundComponents.has(component),
  );

  // Generate recommendations
  const recommendations: string[] = [];

  if (unmappedComponents.length > 0) {
    recommendations.push(`Add ${unmappedComponents.length} unmapped components to usage-map.json`);
  }

  if (unusedComponents.length > 0) {
    recommendations.push(
      `Review ${unusedComponents.length} unused components for potential removal`,
    );
  }

  // Check for common patterns
  const commonComponents = ['Button', 'Input', 'Card', 'Modal', 'Table', 'Form'];
  const missingCommon = commonComponents.filter((comp) => !foundComponents.has(comp));

  if (missingCommon.length > 0) {
    recommendations.push(`Consider using common components: ${missingCommon.join(', ')}`);
  }

  return {
    unmappedComponents,
    unusedComponents,
    importPatterns,
    recommendations,
  };
}

function generateReport(result: ScanResult, asJson = false): void {
  if (asJson) {
    console.log(JSON.stringify(result, undefined, 2));
    return;
  }
  console.log('🔍 Component Usage Scanner Report');
  console.log('=================================');

  if (result.unmappedComponents.length > 0) {
    console.log('\n🚨 Unmapped Components (Used but not in usage-map.json):');
    result.unmappedComponents.forEach((component) => {
      console.log(`  - ${component}`);
      const patterns = safeGet(
        result.importPatterns,
        component,
        Object.keys(result.importPatterns),
      );
      if (patterns) {
        console.log(`    Used in: ${patterns.join(', ')}`);
      }
    });
  }

  if (result.unusedComponents.length > 0) {
    console.log('\n⚠️  Unused Components (In usage-map.json but not used):');
    result.unusedComponents.forEach((component) => {
      console.log(`  - ${component}`);
    });
  }

  if (result.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    result.recommendations.forEach((rec) => {
      console.log(`  - ${rec}`);
    });
  }

  console.log('\n📊 Scan Summary:');
  console.log(`  - Unmapped Components: ${result.unmappedComponents.length}`);
  console.log(`  - Unused Components: ${result.unusedComponents.length}`);
  console.log(`  - Total Components Found: ${Object.keys(result.importPatterns).length}`);
  console.log(`  - Recommendations: ${result.recommendations.length}`);

  if (result.unmappedComponents.length > 0) {
    console.log('\n❌ Unmapped components found! Add them to usage-map.json');
  } else {
    console.log('\n✅ All used components are mapped!');
  }
}

function main(): void {
  try {
    const options = parseCli();
    const result = scanComponents(options);
    generateReport(result, options.json);
    if (options.failOnUnmapped && result.unmappedComponents.length > 0) process.exit(1);
  } catch (error) {
    console.error('❌ Component scanning failed:', error);
    process.exit(1);
  }
}

// Run scan if this script is executed directly
if (import.meta.url.includes('scan-components.ts')) {
  main();
}

export { scanComponents, type ScanResult };
