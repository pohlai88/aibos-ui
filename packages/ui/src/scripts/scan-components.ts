#!/usr/bin/env node

/**
 * Component Scanner - Simplified Version
 *
 * Scans the codebase for components used in ERP pages and flags
 * unmapped components in the usage map.
 */

import {
  safeGet,
  safeSet,
  safeRegExpFromUser,
  hasOwn,
} from '../utils/internal';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

interface CliOptions {
  usageMapPath: string;
  webRoot: string;
  pkgName: string;
  extensions: string[];
  json: boolean;
  failOnUnmapped: boolean;
}

interface UsageMap {
  components: Record<string, { pages: string[]; stories: string[]; tags: string[] }>;
}

interface ScanResult {
  unmappedComponents: string[];
  unusedComponents: string[];
  importPatterns: Record<string, string[]>;
  recommendations: string[];
}

function parseCli(): CliOptions {
  const args = process.argv.slice(2);
  
  return {
    usageMapPath: 'docs/usage-map.json',
    webRoot: 'apps/web',
    pkgName: '@aibos/ui',
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    json: args.includes('--json'),
    failOnUnmapped: false,
  };
}

function scanDirectory(dirPath: string, extensions: string[] = ['.tsx', '.ts']): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) continue;
      
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...scanDirectory(fullPath, extensions));
      } else if (entry.isFile() && extensions.includes(path.extname(fullPath))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dirPath}:`, error);
  }
  
  return files;
}

function extractImports(filePath: string, packageName: string): string[] {
  const imports: string[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Handle ESM imports with optional deep subpaths
    const esmRegex = safeRegExpFromUser(
      String.raw`import[\s\S]*?from\s+['"]${packageName.replace('/', String.raw`\/`)}(?:\/([^'"]+))?['"]`,
      'g',
    );
    
    if (esmRegex) {
      let match: RegExpExecArray | null;
      while ((match = esmRegex.exec(content)) !== null) {
        if (match[1]) {
          const importPath = match[1];
          const componentName = path.posix.basename(importPath);
          imports.push(componentName);
        } else {
          // Handle named imports
          const beforeFrom = content.slice(0, esmRegex.lastIndex);
          const namedBlock = beforeFrom.match(/import\s+{([\s\S]*?)}\s+from\s+['"][^'"]+['"]\s*$/m);
          if (namedBlock && namedBlock[1]) {
            imports.push(
              ...namedBlock[1]
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => s.split(/\s+as\s+/i)[0]?.trim() || ''),
            );
          }
        }
      }
    }
    
    // Handle CommonJS requires
    const cjsRegex = safeRegExpFromUser(
      String.raw`require\(\s*['"]${packageName.replace('/', String.raw`\/`)}\/([^'"]+)['"]\s*\)`,
      'g',
    );
    
    if (cjsRegex) {
      let match: RegExpExecArray | null;
      while ((match = cjsRegex.exec(content)) !== null) {
        const componentName = path.posix.basename(match[1]!);
        imports.push(componentName);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error);
  }
  
  return imports;
}

function loadUsageMap(usageMapPath: string): UsageMap {
  const fullPath = path.join(PROJECT_ROOT, usageMapPath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Usage map not found at ${usageMapPath}`);
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(content) as UsageMap;
}

function scanComponents(options: CliOptions): ScanResult {
  const usageMap = loadUsageMap(options.usageMapPath);
  const mappedComponents = new Set(Object.keys(usageMap.components || {}));

  const webAppPath = path.join(PROJECT_ROOT, options.webRoot);
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
      const patterns = safeGet(importPatterns, component) as string[];
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
      const patterns = safeGet(result.importPatterns, component);
      if (patterns && Array.isArray(patterns)) {
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

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { scanComponents, loadUsageMap, type UsageMap, type ScanResult };