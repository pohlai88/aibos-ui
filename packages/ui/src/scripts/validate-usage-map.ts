#!/usr/bin/env node

/**
 * Comprehensive Usage Map Validator
 *
 * Validates usage map against schema and enforces CI-friendly rules
 * for coverage, a11y, theming, and performance. Combines basic and enhanced validation.
 */

import { safeGet } from '@aibos/utils';
import { safeRegExpFromUser } from '@aibos/utils/security';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ComponentDefaults {
  requiredTags: string[];
  requiredStories: string[];
  standardSuites: {
    core: string[];
    states: string[];
    layout: string[];
    content: string[];
    perf: string[];
    a11y: string[];
    meta: string[];
  };
}

interface Component {
  owner: string;
  priority: string;
  status: string;
  risk?: string[];
  contracts?: {
    tokens: string[];
    variants: string[];
  };
  pages: string[];
  stories: string[];
  description: string;
  tags: string[];
}

interface UsageMap {
  $schemaVersion?: string;
  componentDefaults?: ComponentDefaults;
  components: Record<string, Component>;
  hooks?: Record<
    string,
    {
      pages: string[];
      stories: string[];
      description: string;
    }
  >;
  icons?: Record<
    string,
    {
      pages: string[];
      stories: string[];
      description: string;
    }
  >;
  utils?: Record<
    string,
    {
      pages: string[];
      stories: string[];
      description: string;
    }
  >;
  tokens?: Record<
    string,
    {
      pages: string[];
      stories: string[];
      description: string;
    }
  >;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  orphanedComponents: string[];
  unusedPages: string[];
  coverage: {
    missingRequiredStories: string[];
    missingRequiredTags: string[];
    p0ComponentsNotReady: string[];
    componentsWithoutOwner: string[];
  };
  recommendations: string[];
  codeScan?: {
    usedComponents: string[];
    trueOrphans: string[];
    missingInMap: string[];
    scannedFiles: number;
    importPattern: string;
  };
  routes?: {
    discoveredRoutes: string[];
    pagesNotInRoutes: string[]; // listed in usage-map but no actual Next.js page
    routesNotInMap: string[]; // actual Next.js page exists but missing from usage-map
    appRoot: string;
    dynamicStyle: 'brackets' | 'colon' | 'wildcard';
  };
}

function parseArgument(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index >= 0 && index + 1 < process.argv.length) return process.argv[index + 1];
  return undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function loadUsageMap(): UsageMap {
  const cliMapPath = parseArgument('--map');
  const usageMapPath = cliMapPath
    ? path.resolve(process.cwd(), cliMapPath)
    : path.join(__dirname, '../docs/usage-map.json');

  if (!fs.existsSync(usageMapPath)) {
    throw new Error(`Usage map not found at ${usageMapPath}`);
  }

  const content = fs.readFileSync(usageMapPath, 'utf8');
  return JSON.parse(content);
}

// --- Code scan utilities -----------------------------------------------------
type ScanResult = { usedNames: Set<string>; files: number };

const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function scanDirectory(root: string, importPattern: RegExp): ScanResult {
  const usedNames = new Set<string>();
  let files = 0;
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const filePath = path.join(dir, e.name);
      if (e.isDirectory()) {
        // skip common noisy dirs
        if (['node_modules', '.next', 'dist', 'build', 'coverage'].includes(e.name)) continue;
        walk(filePath);
      } else {
        const extension = path.extname(e.name);
        if (!EXTS.has(extension)) continue;
        const source = safeRead(filePath);
        if (!source) continue;
        files++;
        parseImports(source, importPattern).forEach((n) => usedNames.add(n));
      }
    }
  }
  if (fs.existsSync(root) && fs.statSync(root).isDirectory()) {
    walk(root);
  }
  return { usedNames, files };
}

function safeRead(fp: string): string | undefined {
  try {
    return fs.readFileSync(fp, 'utf8');
  } catch {
    return undefined;
  }
}

/**
 * Parse named/default imports. We keep it simple and fast:
 *  - import { Button, Input as TextInput } from '...'
 *  - import Button from '...'
 *  - import * as UI from '...'  (ignored; too ambiguous to map reliably)
 */
function parseImports(code: string, importPattern: RegExp): Set<string> {
  const names = new Set<string>();
  // match lines like: import ... from 'module'
  const importRe = /import\s+([^;]+?)\s+from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(code))) {
    const clause = m[1];
    const module_ = m[2];
    if (!module_ || !importPattern.test(module_)) continue;
    // named: { A, B as C }
    const named = clause?.match(/\{([^}]+)\}/);
    if (named && named[1]) {
      const parts = named[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const p of parts) {
        // "Name as Alias" => take local alias
        const alias = p.includes(' as ') ? p.split(' as ').pop()?.trim() : p;
        if (alias) names.add(alias);
      }
    }
    // default import: Foo
    const defaultMatch = clause?.match(/^([A-Za-z_$][\w$]*)\s*(,|\s*$)/);
    if (defaultMatch && defaultMatch[1]) {
      names.add(defaultMatch[1]);
    }
    // ignore namespace import: * as UI
  }
  return names;
}
// -----------------------------------------------------------------------------

// --- Next.js App Router route discovery -------------------------------------
type DynamicStyle = 'brackets' | 'colon' | 'wildcard';

const PAGE_FILE_NAMES = new Set(['page.tsx', 'page.jsx', 'page.ts', 'page.js']);
const IGNORE_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'coverage']);

function normalizeSegment(seg: string, dynamicStyle: DynamicStyle): string {
  // strip (group) folders
  if (seg.startsWith('(') && seg.endsWith(')')) return '';
  // strip route groups like @slot (rare)
  if (seg.startsWith('@')) return '';
  // handle dynamic routes
  // [id] , [...slug], [[...slug]]
  const isDynamic = /^\[.*\]$/.test(seg);
  if (!isDynamic) return seg;
  // detect catchalls
  const catchAll = /^\[\.\.\.(.+)\]$/.exec(seg);
  const optCatchAll = /^\[\[\.\.\.(.+)\]\]$/.exec(seg);
  const single = /^\[([^\]]+)\]$/.exec(seg);
  if (dynamicStyle === 'colon') {
    if (catchAll) return `:${catchAll[1]}*`;
    if (optCatchAll) return `:${optCatchAll[1]}*?`;
    if (single) return `:${single[1]}`;
  } else if (dynamicStyle === 'wildcard') {
    if (catchAll) return `*`;
    if (optCatchAll) return `*?`;
    if (single) return `*`;
  }
  // default 'brackets'
  return seg; // keep [id], [...slug], [[...slug]]
}

function toRoutePath(fromAppSubPath: string[], dynamicStyle: DynamicStyle): string {
  const parts = fromAppSubPath
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => normalizeSegment(seg, dynamicStyle))
    .filter(Boolean);
  const routePath = '/' + parts.join('/');
  return routePath === '/' ? '/' : routePath.replace(/\/+/g, '/');
}

function discoverAppRoutes(appRoot: string, dynamicStyle: DynamicStyle): string[] {
  const routes = new Set<string>();
  function walk(dir: string, trail: string[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    // If this folder contains a page.* file, record a route
    for (const e of entries) {
      if (e.isFile() && PAGE_FILE_NAMES.has(e.name)) {
        routes.add(toRoutePath(trail, dynamicStyle));
        break;
      }
    }
    // Recurse into subfolders (skip special/ignored)
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (IGNORE_DIRS.has(e.name)) continue;
      const subDirectory = path.join(dir, e.name);
      // ignore folders that only contain special files and no page.* down the line? we still traverse to find nested pages.
      walk(subDirectory, [...trail, e.name]);
    }
  }
  if (fs.existsSync(appRoot) && fs.statSync(appRoot).isDirectory()) {
    walk(appRoot, []);
  }
  // Always include "/" if there's a root page.* at appRoot
  return Array.from(routes).sort();
}
// -----------------------------------------------------------------------------

function validateUsageMap(usageMap: UsageMap): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const orphanedComponents: string[] = [];
  const unusedPages: string[] = [];
  const missingRequiredStories: string[] = [];
  const missingRequiredTags: string[] = [];
  const p0ComponentsNotReady: string[] = [];
  const componentsWithoutOwner: string[] = [];
  const recommendations: string[] = [];

  // Collect all referenced pages
  const allReferencedPages = new Set<string>();

  // Enhanced validation for schema version and defaults
  if (usageMap.$schemaVersion && usageMap.$schemaVersion !== '1.1') {
    errors.push(`Invalid schema version: ${usageMap.$schemaVersion}. Expected: 1.1`);
  }

  const componentDefaults = usageMap.componentDefaults;
  if (componentDefaults) {
    if (!componentDefaults.requiredTags || componentDefaults.requiredTags.length === 0) {
      errors.push('componentDefaults.requiredTags is required and cannot be empty');
    }

    if (!componentDefaults.requiredStories || componentDefaults.requiredStories.length === 0) {
      errors.push('componentDefaults.requiredStories is required and cannot be empty');
    }
  }

  // Validate components
  Object.entries(usageMap.components).forEach(([componentName, component]) => {
    // Basic validation
    if (component.pages?.length === 0 && component.stories?.length === 0) {
      orphanedComponents.push(`Component ${componentName} has no usage references`);
    }

    if (component.pages?.length === 0) {
      warnings.push(`Component ${componentName} has no page references`);
    }

    if (component.stories?.length === 0) {
      warnings.push(`Component ${componentName} has no story references`);
    }

    if (!component.description || component.description.trim() === '') {
      errors.push(`Component ${componentName} is missing description`);
    }

    // Enhanced validation
    if (componentDefaults) {
      // Check required fields
      if (!component.owner) {
        componentsWithoutOwner.push(componentName);
        errors.push(`Component ${componentName} is missing required field: owner`);
      }

      if (!component.priority) {
        errors.push(`Component ${componentName} is missing required field: priority`);
      }

      if (!component.status) {
        errors.push(`Component ${componentName} is missing required field: status`);
      }

      // Check P0 components are ready
      if (component.priority === 'p0' && component.status !== 'ready') {
        p0ComponentsNotReady.push(componentName);
        errors.push(
          `P0 component ${componentName} must have status 'ready', got '${component.status}'`,
        );
      }

      // Check required stories
      const missingStories = componentDefaults.requiredStories.filter(
        (requiredStory) => !component.stories?.includes(requiredStory),
      );

      if (missingStories.length > 0) {
        missingRequiredStories.push(`${componentName}: ${missingStories.join(', ')}`);
        errors.push(
          `Component ${componentName} missing required stories: ${missingStories.join(', ')}`,
        );
      }

      // Check required tags
      const missingTags = componentDefaults.requiredTags.filter(
        (requiredTag) => !component.tags?.includes(requiredTag),
      );

      if (missingTags.length > 0) {
        missingRequiredTags.push(`${componentName}: ${missingTags.join(', ')}`);
        errors.push(`Component ${componentName} missing required tags: ${missingTags.join(', ')}`);
      }

      // Check for interactive components missing keyboard navigation
      const interactiveComponents = [
        'Button',
        'Input',
        'Checkbox',
        'Radio',
        'Switch',
        'Select',
        'Modal',
        'Table',
        'Form',
        'Navigation',
      ];
      if (
        interactiveComponents.includes(componentName) &&
        !component.stories?.includes('KeyboardNav')
      ) {
        errors.push(`Interactive component ${componentName} must have 'KeyboardNav' story`);
      }

      // Check for components missing focus stories
      if (!component.stories?.includes('Focus')) {
        errors.push(`Component ${componentName} must have 'Focus' story`);
      }

      // Check for components missing dark mode
      if (!component.stories?.includes('Dark')) {
        warnings.push(`Component ${componentName} should have 'Dark' story for theming`);
      }

      // Check for components missing RTL
      if (!component.stories?.includes('RTL')) {
        warnings.push(
          `Component ${componentName} should have 'RTL' story for internationalization`,
        );
      }

      // Check for components missing reduced motion
      if (!component.stories?.includes('ReducedMotion')) {
        warnings.push(
          `Component ${componentName} should have 'ReducedMotion' story for accessibility`,
        );
      }

      // Check for meta stories (Gallery)
      if (!component.stories?.includes('Gallery')) {
        recommendations.push(
          `Consider adding 'Gallery' story for ${componentName} to showcase all variants`,
        );
      }
    }

    // Check description quality
    if (!component.description || component.description.length < 10) {
      errors.push(`Component ${componentName} description is too short (minimum 10 characters)`);
    }

    // Collect referenced pages
    component.pages?.forEach((page) => allReferencedPages.add(page));
  });

  // Validate hooks
  if (usageMap.hooks) {
    Object.entries(usageMap.hooks).forEach(([hook, usage]) => {
      if (usage.pages.length === 0 && usage.stories.length === 0) {
        orphanedComponents.push(`Hook ${hook} has no usage references`);
      }

      if (!usage.description || usage.description.trim() === '') {
        errors.push(`Hook ${hook} is missing description`);
      }

      usage.pages.forEach((page) => allReferencedPages.add(page));
    });
  }

  // Validate icons
  if (usageMap.icons) {
    Object.entries(usageMap.icons).forEach(([icon, usage]) => {
      if (usage.pages.length === 0 && usage.stories.length === 0) {
        orphanedComponents.push(`Icon ${icon} has no usage references`);
      }

      if (!usage.description || usage.description.trim() === '') {
        errors.push(`Icon ${icon} is missing description`);
      }

      usage.pages.forEach((page) => allReferencedPages.add(page));
    });
  }

  // Validate utils
  if (usageMap.utils) {
    Object.entries(usageMap.utils).forEach(([utility, usage]) => {
      if (usage.pages.length === 0 && usage.stories.length === 0) {
        orphanedComponents.push(`Utility ${utility} has no usage references`);
      }

      if (!usage.description || usage.description.trim() === '') {
        errors.push(`Utility ${utility} is missing description`);
      }

      usage.pages.forEach((page) => allReferencedPages.add(page));
    });
  }

  // Validate tokens
  if (usageMap.tokens) {
    Object.entries(usageMap.tokens).forEach(([token, usage]) => {
      if (usage.pages.length === 0 && usage.stories.length === 0) {
        orphanedComponents.push(`Token ${token} has no usage references`);
      }

      if (!usage.description || usage.description.trim() === '') {
        errors.push(`Token ${token} is missing description`);
      }

      usage.pages.forEach((page) => allReferencedPages.add(page));
    });
  }

  // Check for common ERP pages that might be missing
  const commonERPPages = [
    '/dashboard',
    '/settings',
    '/profile',
    '/login',
    '/register',
    '/reports',
    '/analytics',
    '/forms',
    '/help',
    '/faq',
  ];

  commonERPPages.forEach((page) => {
    if (!allReferencedPages.has(page)) {
      unusedPages.push(`Page ${page} is not referenced by any components`);
    }
  });

  // Generate recommendations based on gaps
  if (componentDefaults) {
    const allComponents = Object.keys(usageMap.components);
    const componentsWithA11y = allComponents.filter((name) => {
      const component = safeGet(usageMap.components, name, Object.keys(usageMap.components));
      return component?.tags?.includes('a11y');
    });

    if (componentsWithA11y.length < allComponents.length) {
      recommendations.push(
        `${allComponents.length - componentsWithA11y.length} components missing 'a11y' tag`,
      );
    }

    const componentsWithDark = allComponents.filter((name) => {
      const component = safeGet(usageMap.components, name, Object.keys(usageMap.components));
      return component?.stories?.includes('Dark');
    });

    if (componentsWithDark.length < allComponents.length) {
      recommendations.push(
        `${allComponents.length - componentsWithDark.length} components missing 'Dark' story`,
      );
    }

    const componentsWithRTL = allComponents.filter((name) => {
      const component = safeGet(usageMap.components, name, Object.keys(usageMap.components));
      return component?.stories?.includes('RTL');
    });

    if (componentsWithRTL.length < allComponents.length) {
      recommendations.push(
        `${allComponents.length - componentsWithRTL.length} components missing 'RTL' story`,
      );
    }
  }

  // Optional: source-code import scan
  let codeScan: ValidationResult['codeScan'] | undefined;
  const scanRoot = parseArgument('--scan');
  const importPatternArgument = parseArgument('--import-pattern') ?? '';
  const importPattern = importPatternArgument ? safeRegExpFromUser(importPatternArgument) : /.*/; // accept all modules by default
  if (scanRoot) {
    const { usedNames, files } = scanDirectory(
      path.resolve(process.cwd(), scanRoot),
      importPattern,
    );
    const mapComponents = new Set(Object.keys(usageMap.components));
    const usedComponents = Array.from(usedNames)
      .filter((n) => mapComponents.has(n))
      .sort();
    const trueOrphans = Array.from(mapComponents)
      .filter((n) => !usedNames.has(n))
      .sort();
    const missingInMap = Array.from(usedNames)
      .filter((n) => !mapComponents.has(n))
      .sort();
    codeScan = {
      usedComponents,
      trueOrphans,
      missingInMap,
      scannedFiles: files,
      importPattern: importPattern.toString(),
    };
  }

  // Optional: Next.js routes discovery & comparison
  let routesInfo: ValidationResult['routes'] | undefined;
  const routesRootArgument = parseArgument('--routes'); // e.g., apps/web/app
  const dynamicStyleArgument = (parseArgument('--dynamic-style') as DynamicStyle) ?? 'brackets';
  const dynamicStyle: DynamicStyle = (['brackets', 'colon', 'wildcard'] as const).includes(
    dynamicStyleArgument,
  )
    ? dynamicStyleArgument
    : 'brackets';
  if (routesRootArgument) {
    const appRoot = path.resolve(process.cwd(), routesRootArgument);
    const discoveredRoutes = discoverAppRoutes(appRoot, dynamicStyle);
    // Compare with usage-map referenced pages (collect from all categories)
    const referencedPages = new Set<string>();
    const collectPages = (object: Record<string, { pages: string[] }>) => {
      Object.values(object).forEach((v) => v.pages.forEach((p) => referencedPages.add(p)));
    };
    collectPages(usageMap.components);
    if (usageMap.hooks) collectPages(usageMap.hooks);
    if (usageMap.icons) collectPages(usageMap.icons);
    if (usageMap.utils) collectPages(usageMap.utils);
    if (usageMap.tokens) collectPages(usageMap.tokens);

    // Normalize both sides for comparison (trim trailing slashes)
    const norm = (p: string) => (p === '/' ? '/' : p.replace(/\/+$/, ''));
    const mapPagesNorm = new Set(Array.from(referencedPages).map(norm));
    const discoveredNorm = new Set(discoveredRoutes.map(norm));

    const pagesNotInRoutes = Array.from(mapPagesNorm)
      .filter((p) => !discoveredNorm.has(p))
      .sort();
    const routesNotInMap = Array.from(discoveredNorm)
      .filter((r) => !mapPagesNorm.has(r))
      .sort();

    // Warn for obviously wrong formats (no leading '/')
    Array.from(referencedPages).forEach((p) => {
      if (!p.startsWith('/')) errors.push(`Usage-map page "${p}" must start with '/'`);
    });

    routesInfo = {
      discoveredRoutes: Array.from(discoveredNorm).sort(),
      pagesNotInRoutes,
      routesNotInMap,
      appRoot,
      dynamicStyle,
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    orphanedComponents,
    unusedPages,
    coverage: {
      missingRequiredStories,
      missingRequiredTags,
      p0ComponentsNotReady,
      componentsWithoutOwner,
    },
    recommendations,
    codeScan,
    routes: routesInfo,
  };
}

function generateReport(result: ValidationResult): void {
  console.log('🔍 Comprehensive Usage Map Validation Report');
  console.log('============================================');

  if (result.isValid) {
    console.log('✅ Usage map validation passed');
  } else {
    console.log('❌ Usage map validation failed');
  }

  if (result.errors.length > 0) {
    console.log('\n🚨 Errors (CI Blocking):');
    result.errors.forEach((error) => {
      console.log(`  - ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach((warning) => {
      console.log(`  - ${warning}`);
    });
  }

  if (result.orphanedComponents.length > 0) {
    console.log('\n🔍 Orphaned Components:');
    result.orphanedComponents.forEach((orphaned) => {
      console.log(`  - ${orphaned}`);
    });
  }

  if (result.unusedPages.length > 0) {
    console.log('\n📄 Unused Pages:');
    result.unusedPages.forEach((page) => {
      console.log(`  - ${page}`);
    });
  }

  if (result.coverage.missingRequiredStories.length > 0) {
    console.log('\n📋 Missing Required Stories:');
    result.coverage.missingRequiredStories.forEach((item) => {
      console.log(`  - ${item}`);
    });
  }

  if (result.coverage.missingRequiredTags.length > 0) {
    console.log('\n🏷️  Missing Required Tags:');
    result.coverage.missingRequiredTags.forEach((item) => {
      console.log(`  - ${item}`);
    });
  }

  if (result.coverage.p0ComponentsNotReady.length > 0) {
    console.log('\n🔴 P0 Components Not Ready:');
    result.coverage.p0ComponentsNotReady.forEach((component) => {
      console.log(`  - ${component}`);
    });
  }

  if (result.coverage.componentsWithoutOwner.length > 0) {
    console.log('\n👤 Components Without Owner:');
    result.coverage.componentsWithoutOwner.forEach((component) => {
      console.log(`  - ${component}`);
    });
  }

  if (result.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    result.recommendations.forEach((rec) => {
      console.log(`  - ${rec}`);
    });
  }

  if (result.codeScan) {
    const codeScan = result.codeScan;
    console.log('\n🧭 Code Usage:');
    console.log(`  - Scanned files: ${codeScan.scannedFiles}`);
    console.log(`  - Import pattern: ${codeScan.importPattern}`);
    if (codeScan.usedComponents.length) {
      console.log('  - Used components (found in code):');
      codeScan.usedComponents.forEach((n) => console.log(`    • ${n}`));
    } else {
      console.log('  - Used components: none found');
    }
    if (codeScan.trueOrphans.length) {
      console.log('  - True orphans (in map, not imported anywhere):');
      codeScan.trueOrphans.forEach((n) => console.log(`    • ${n}`));
    }
    if (codeScan.missingInMap.length) {
      console.log('  - Missing in map (imported in code but absent in usage-map):');
      codeScan.missingInMap.forEach((n) => console.log(`    • ${n}`));
    }
  }

  if (result.routes) {
    const routes = result.routes;
    console.log('\n🗺️  Routes:');
    console.log(`  - App root: ${routes.appRoot}`);
    console.log(`  - Dynamic style: ${routes.dynamicStyle}`);
    console.log(`  - Discovered routes (${routes.discoveredRoutes.length}):`);
    routes.discoveredRoutes.forEach((routePath) => console.log(`    • ${routePath}`));
    if (routes.pagesNotInRoutes.length) {
      console.log('  - Listed in usage-map but no actual page (pagesNotInRoutes):');
      routes.pagesNotInRoutes.forEach((routePath) => console.log(`    • ${routePath}`));
    }
    if (routes.routesNotInMap.length) {
      console.log('  - Actual page exists but missing in usage-map (routesNotInMap):');
      routes.routesNotInMap.forEach((routePath) => console.log(`    • ${routePath}`));
    }
  }

  console.log('\n📊 Coverage Summary:');
  console.log(`  - Errors: ${result.errors.length}`);
  console.log(`  - Warnings: ${result.warnings.length}`);
  console.log(`  - Orphaned Components: ${result.orphanedComponents.length}`);
  console.log(`  - Unused Pages: ${result.unusedPages.length}`);
  console.log(`  - Missing Required Stories: ${result.coverage.missingRequiredStories.length}`);
  console.log(`  - Missing Required Tags: ${result.coverage.missingRequiredTags.length}`);
  console.log(`  - P0 Components Not Ready: ${result.coverage.p0ComponentsNotReady.length}`);
  console.log(`  - Components Without Owner: ${result.coverage.componentsWithoutOwner.length}`);
  console.log(`  - Recommendations: ${result.recommendations.length}`);
}

function main(): void {
  try {
    const usageMap = loadUsageMap();
    const result = validateUsageMap(usageMap);
    generateReport(result);

    const strict = hasFlag('--strict');
    const strictWarnings = result.warnings.length > 0;
    const strictMissingInMap = !!result.codeScan && result.codeScan.missingInMap.length > 0;
    const strictRouteMismatches =
      !!result.routes &&
      (result.routes.pagesNotInRoutes.length > 0 || result.routes.routesNotInMap.length > 0);
    if (
      !result.isValid ||
      (strict && (strictWarnings || strictMissingInMap || strictRouteMismatches))
    ) {
      process.exit(1);
    }

    console.log('\n🎉 All validations passed!');
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (import.meta.url.includes('validate-usage-map.ts')) {
  main();
}

export { validateUsageMap, loadUsageMap, type UsageMap, type ValidationResult };
