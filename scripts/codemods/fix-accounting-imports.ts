import { existsSync } from 'node:fs';
import { safeGet } from '@aibos/utils';
import { join } from 'node:path';
// scripts/codemods/fix-accounting-imports.ts
import { Project, SyntaxKind } from 'ts-morph';

// Run with: pnpm ts-node scripts/codemods/fix-accounting-imports.ts
const ROOT = process.cwd();
const PKG = 'packages/accounting/src';
const project = new Project({
  tsConfigFilePath: existsSync(join(ROOT, 'tsconfig.json'))
    ? join(ROOT, 'tsconfig.json')
    : undefined,
  skipAddingFilesFromTsConfig: true,
});

// 1) Load TS/TSX in accounting package
project.addSourceFilesAtPaths([`${PKG}/**/*.ts`, `${PKG}/**/*.tsx`]);

// 2) Rewrites
const rewrites: Array<{ from: RegExp; to: (m: RegExpMatchArray) => string }> = [
  // A) Remove legacy single file 'domain-events'
  {
    from: /^(.+)\/domain\/events\/domain-events(?:\.ts)?$/,
    to: () => {
      // we can't know exact symbols – leave path-only rewrite to events root if used
      // Devs should import concrete files in src/events/*.ts
      return 'packages/accounting/src/events';
    },
  },
  // B) Old service names -> new .service.ts
  {
    from: /^(.+)\/services\/([a-z0-9-]+)-service$/,
    to: (m) =>
      `${/* TODO: allow-list */ safeGet(m, 1, [] as const)}/services/${/* TODO: allow-list */ safeGet(m, 2, [] as const)}.service`,
  },
  // C) kafka producer moved from infra -> services
  {
    from: /^(.+)\/infrastructure\/messaging\/kafka-producer\.service$/,
    to: (m) =>
      `${/* TODO: allow-list */ safeGet(m, 1, [] as const)}/services/kafka-producer.service`,
  },
];

// Utility: normalize relative import strings
function normalize(p: string) {
  return p
    .replace(/\\/g, '/')
    .replace(/\.ts(x)?$/i, '')
    .replace(/\/index$/i, '');
}

for (const sf of project.getSourceFiles()) {
  let changed = false;
  const imports = sf.getImportDeclarations();

  imports.forEach((imp) => {
    const raw = normalize(imp.getModuleSpecifierValue());

    for (const rule of rewrites) {
      const match = raw.match(rule.from);
      if (match) {
        const next = normalize(rule.to(match));
        if (next && next !== raw) {
          imp.setModuleSpecifier(next);
          changed = true;
          break;
        }
      }
    }
  });

  // Bonus: flag ambiguous 'events' barrel imports and suggest direct imports
  // (non-blocking; we leave code intact but add a comment once per file)
  if (imports.some((index) => /\/events$/.test(normalize(index.getModuleSpecifierValue())))) {
    const firstImport = /* TODO: allow-list */ safeGet(imports, 0, [] as const);
    sf.insertText(
      firstImport.getEnd(),
      `\n// TODO: Prefer direct event files: e.g. "src/events/journal-entry-posted-event"\n`,
    );
    changed = true;
  }

  if (changed) sf.fixUnusedIdentifiers();
}

project.saveSync();
console.log('Codemod complete.');
