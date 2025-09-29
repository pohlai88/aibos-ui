#!/usr/bin/env ts-node
/**
 * apply-ssot-policies-enhanced.ts
 * 
 * Enhanced codemod to migrate duplicate types to SSOT modules and resolve conflicts.
 * Addresses specific issues found in our accounting utils audit:
 * - 27 duplicate type definitions
 * - 7 conflicting RoundingMethod definitions
 * - Circular dependency risks
 * - Mixed naming conventions
 * 
 * Usage:
 *   pnpm ts-node scripts/codemods/apply-ssot-policies-enhanced.ts
 */

import { Project, SyntaxKind, Node, ts } from "ts-morph";
import { join } from "path";

const ROOT = process.cwd();
const PKG = join(ROOT, "packages", "accounting");
const SRC = join(PKG, "src");
const UTILS = join(SRC, "utils");

// Enhanced mapping for our specific conflicts
const ROUNDING_MIGRATION_MAP = {
  // From accounting-utilities.ts enum
  'RoundingMethod.HALF_UP': 'RoundingMethod.HALF_UP',
  'RoundingMethod.HALF_DOWN': 'RoundingMethod.HALF_DOWN',
  'RoundingMethod.HALF_EVEN': 'RoundingMethod.HALF_EVEN',
  'RoundingMethod.CEILING': 'RoundingMethod.CEILING',
  'RoundingMethod.FLOOR': 'RoundingMethod.FLOOR',
  
  // From string literals found in codebase
  'round_half_up': 'RoundingMethod.HALF_UP',
  'round_half_down': 'RoundingMethod.HALF_DOWN',
  'round_half_even': 'RoundingMethod.HALF_EVEN',
  'round_up': 'RoundingMethod.CEILING',
  'round_down': 'RoundingMethod.FLOOR',
  'truncate': 'RoundingMethod.TRUNCATE',
} as const;

// Dependency order to avoid circular imports
const DEPENDENCY_ORDER = [
  'shared-operators.ts',
  'policies/currency-policy.ts', 
  'policies/rounding-policy.ts',
  'money-helpers.ts',
  'safe-object.ts',
  'accounting-utilities.ts',
  // Add other files as needed
];

const project = new Project({
  tsConfigFilePath: join(ROOT, "tsconfig.json"),
  skipAddingFilesFromTsConfig: false,
});

// Get all utility files
const files = project.getSourceFiles("**/packages/accounting/src/utils/*.ts");

console.log(`🔍 Found ${files.length} files to process`);

// Helper function to ensure named import
const ensureNamedImport = (sf: any, moduleSpecifier: string, name: string, isType = false) => {
  const existing = sf.getImportDeclarations().find((d: any) => d.getModuleSpecifierValue() === moduleSpecifier);
  if (existing) {
    const named = existing.getNamedImports().some((n: any) => n.getName() === name);
    if (!named) existing.addNamedImport({ name, isTypeOnly: isType });
  } else {
    sf.addImportDeclaration({ moduleSpecifier, namedImports: [{ name, isTypeOnly: isType }] });
  }
};

// Helper function to remove duplicate type definitions
const removeDuplicateTypes = (sf: any) => {
  let changed = false;
  
  // Remove local ConditionOperator definitions
  sf.forEachChild((node: any) => {
    if (Node.isTypeAliasDeclaration(node)) {
      const name = node.getName();
      if (name === 'ConditionOperator' || name === 'LogicalOperator') {
        console.log(`  ❌ Removing duplicate ${name} from ${sf.getBaseName()}`);
        node.remove();
        changed = true;
      }
    }
  });
  
  // Remove local RoundingMethod definitions
  sf.forEachChild((node: any) => {
    if (Node.isEnumDeclaration(node) && node.getName() === 'RoundingMethod') {
      console.log(`  ❌ Removing duplicate RoundingMethod enum from ${sf.getBaseName()}`);
      node.remove();
      changed = true;
    }
    if (Node.isTypeAliasDeclaration(node) && node.getName() === 'RoundingMethod') {
      console.log(`  ❌ Removing duplicate RoundingMethod type from ${sf.getBaseName()}`);
      node.remove();
      changed = true;
    }
  });
  
  return changed;
};

// Helper function to replace string literals with enum values
const replaceStringLiterals = (sf: any) => {
  let changed = false;
  
  sf.forEachDescendant((node: any) => {
    if (Node.isStringLiteral(node)) {
      const literal = node.getLiteralText();
      const replacement = ROUNDING_MIGRATION_MAP[literal as keyof typeof ROUNDING_MIGRATION_MAP];
      if (replacement) {
        console.log(`  🔄 Replacing "${literal}" with ${replacement} in ${sf.getBaseName()}`);
        node.replaceWithText(replacement);
        ensureNamedImport(sf, './policies/rounding-policy', 'RoundingMethod', false);
        changed = true;
      }
    }
  });
  
  return changed;
};

// Helper function to add necessary imports
const addSSOTImports = (sf: any) => {
  const text = sf.getFullText();
  let changed = false;
  
  // Check if file uses operators
  if (text.includes('ConditionOperator') || text.includes('LogicalOperator')) {
    ensureNamedImport(sf, './shared-operators', 'ConditionOperator', true);
    ensureNamedImport(sf, './shared-operators', 'LogicalOperator', true);
    console.log(`  ➕ Added operator imports to ${sf.getBaseName()}`);
    changed = true;
  }
  
  // Check if file uses rounding methods
  if (text.includes('RoundingMethod') || text.includes('round_')) {
    ensureNamedImport(sf, './policies/rounding-policy', 'RoundingMethod', false);
    console.log(`  ➕ Added rounding imports to ${sf.getBaseName()}`);
    changed = true;
  }
  
  // Check if file uses currency operations
  if (text.includes('toMinorUnits') || text.includes('fromMinorUnits') || text.includes('roundToCurrency')) {
    ensureNamedImport(sf, './money-helpers', 'toMinorUnits');
    ensureNamedImport(sf, './money-helpers', 'fromMinorUnits');
    ensureNamedImport(sf, './money-helpers', 'roundToCurrency');
    console.log(`  ➕ Added money helper imports to ${sf.getBaseName()}`);
    changed = true;
  }
  
  return changed;
};

// Process files in dependency order
let totalChanged = 0;

for (const fileName of DEPENDENCY_ORDER) {
  const matchingFiles = files.filter(f => f.getBaseName() === fileName);
  
  for (const sf of matchingFiles) {
    console.log(`\n📁 Processing ${sf.getBaseName()}`);
    let fileChanged = false;
    
    // Remove duplicate types
    if (removeDuplicateTypes(sf)) fileChanged = true;
    
    // Replace string literals
    if (replaceStringLiterals(sf)) fileChanged = true;
    
    // Add SSOT imports
    if (addSSOTImports(sf)) fileChanged = true;
    
    if (fileChanged) {
      sf.saveSync();
      totalChanged++;
      console.log(`  ✅ Updated ${sf.getBaseName()}`);
    } else {
      console.log(`  ⏭️  No changes needed for ${sf.getBaseName()}`);
    }
  }
}

// Process remaining files
const processedFiles = new Set(DEPENDENCY_ORDER);
const remainingFiles = files.filter(f => !processedFiles.has(f.getBaseName()));

console.log(`\n📁 Processing ${remainingFiles.length} remaining files`);

for (const sf of remainingFiles) {
  console.log(`\n📁 Processing ${sf.getBaseName()}`);
  let fileChanged = false;
  
  // Remove duplicate types
  if (removeDuplicateTypes(sf)) fileChanged = true;
  
  // Replace string literals
  if (replaceStringLiterals(sf)) fileChanged = true;
  
  // Add SSOT imports
  if (addSSOTImports(sf)) fileChanged = true;
  
  if (fileChanged) {
    sf.saveSync();
    totalChanged++;
    console.log(`  ✅ Updated ${sf.getBaseName()}`);
  } else {
    console.log(`  ⏭️  No changes needed for ${sf.getBaseName()}`);
  }
}

project.saveSync();

console.log(`\n🎉 SSOT policies codemod completed!`);
console.log(`📊 Summary:`);
console.log(`   - Files processed: ${files.length}`);
console.log(`   - Files changed: ${totalChanged}`);
console.log(`   - Duplicate types removed: ConditionOperator, LogicalOperator, RoundingMethod`);
console.log(`   - String literals replaced with enum values`);
console.log(`   - SSOT imports added where needed`);
console.log(`\n✅ Next steps:`);
console.log(`   1. Run tests: pnpm vitest run packages/accounting`);
console.log(`   2. Check for linting issues: pnpm eslint packages/accounting/src/utils`);
console.log(`   3. Verify no circular dependencies: pnpm madge --circular packages/accounting/src/utils`);
