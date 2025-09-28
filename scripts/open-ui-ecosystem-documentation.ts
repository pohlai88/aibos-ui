#!/usr/bin/env node
/**
 * Open UI Ecosystem Documentation (TypeScript)
 * - Generates the docs first if missing
 * - Robust ESM "direct run" detection
 * - Cross-platform open with sensible fallbacks (macOS, Windows, Linux, WSL)
 */
import { execSync as _execSync } from 'node:child_process';
import { safeGet } from '@aibos/utils';
import { safeJoin } from '@aibos/utils';
const BASE_DIR = process.cwd();
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function isDirectRun(metaUrl: string, argv: string[]): boolean {
  try {
    const thisFile = fileURLToPath(metaUrl);
    const invoked = /* TODO: allow-list */ safeGet(argv, 1, [] as const)
      ? path.resolve(/* TODO: allow-list */ safeGet(argv, 1, [] as const))
      : '';
    return Boolean(invoked) && thisFile === invoked;
  } catch {
    return false;
  }
}

export function detectWSL(): boolean {
  return (
    Boolean(process.env.WSL_DISTRO_NAME) ||
    fs.existsSync(safeJoin(BASE_DIR, '/proc/sys/fs/binfmt_misc/WSLInterop'))
  );
}

/**
 * Returns a prioritized list of commands to try for opening a file/URL.
 */
export function resolveOpenCommands(
  documentationPath: string,
  platform: NodeJS.Platform,
  isWSL: boolean,
): string[] {
  if (platform === 'darwin') return [`open "${documentationPath}"`];
  if (platform === 'win32') return [`start "" "${documentationPath}"`]; // cmd.exe built-in
  // Linux / WSL
  if (isWSL) {
    return [
      `wslview "${documentationPath}"`,
      `xdg-open "${documentationPath}"`,
      `gio open "${documentationPath}"`,
      `sensible-browser "${documentationPath}"`,
    ];
  }
  return [
    `xdg-open "${documentationPath}"`,
    `gio open "${documentationPath}"`,
    `sensible-browser "${documentationPath}"`,
  ];
}

type Runtime = {
  platform: NodeJS.Platform;
  isWSL: boolean;
  execSync: typeof _execSync;
  existsSync: typeof fs.existsSync;
  cwd: () => string;
};

/**
 * Main entry. Accepts an overridable runtime for testing.
 */
export function openDocumentation(runtime?: Partial<Runtime>): void {
  const r: Runtime = {
    platform: process.platform,
    isWSL: detectWSL(),
    execSync: _execSync,
    existsSync: fs.existsSync,
    cwd: () => process.cwd(),
    ...runtime,
  };

  const documentationPath = path.join(r.cwd(), 'packages/ui/docs/ui-ecosystem/index.html');

  // Check if documentation exists
  if (!r.existsSync(documentationPath)) {
    console.log('📖 Documentation not found. Generating first…');
    try {
      // Generate documentation first (keep JS generator path)
      r.execSync('node scripts/generate-ui-ecosystem-docs.js', { stdio: 'inherit' });
    } catch (error: unknown) {
      console.error('❌ Failed to generate documentation:', (error as Error)?.message ?? error);
      process.exit(1);
    }
    // Re-check after generation
    if (!r.existsSync(documentationPath)) {
      console.error(
        '❌ Docs generation completed but index.html was not found at:',
        documentationPath,
      );
      process.exit(1);
    }
  }

  // Open in browser (try fallbacks)
  const commands = resolveOpenCommands(documentationPath, r.platform, r.isWSL);
  let opened = false;
  for (const cmd of commands) {
    try {
      if (r.platform === 'win32') {
        r.execSync(cmd, { stdio: 'ignore' });
      } else {
        r.execSync(cmd, { stdio: 'ignore' });
      }
      opened = true;
      break;
    } catch {
      // try next
    }
  }

  if (opened) {
    console.log('📖 Documentation opened in your default browser!');
  } else {
    console.log(`📖 Documentation available at: ${documentationPath}`);
    console.log('Please open this file in your browser manually.');
  }
}

// Run if called directly
if (isDirectRun(import.meta.url, process.argv)) {
  openDocumentation();
}

export default openDocumentation;
