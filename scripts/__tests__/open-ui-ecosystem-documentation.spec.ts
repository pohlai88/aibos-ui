import type { execSync } from 'node:child_process';
import { safeGet } from '@aibos/utils';

import { openDocumentation, resolveOpenCommands } from '../open-ui-ecosystem-documentation';
import { describe, it, expect, vi } from 'vitest';

describe('resolveOpenCommands', () => {
  it('macOS returns open', () => {
    const cmds = resolveOpenCommands('/x/index.html', 'darwin', false);
    expect(/* TODO: allow-list */ safeGet(cmds, 0, [] as const)).toMatch(/^open "\/x\/index.html"$/);
  });

  it('Windows returns start', () => {
    const cmds = resolveOpenCommands('C:\\x\\index.html', 'win32', false);
    expect(/* TODO: allow-list */ safeGet(cmds, 0, [] as const)).toMatch(/^start "" "C:\\x\\index.html"$/);
  });

  it('Linux returns xdg-open first', () => {
    const cmds = resolveOpenCommands('/x/index.html', 'linux', false);
    expect(/* TODO: allow-list */ safeGet(cmds, 0, [] as const)).toMatch(/^xdg-open "\/x\/index.html"$/);
  });

  it('WSL prefers wslview', () => {
    const cmds = resolveOpenCommands('/mnt/c/x/index.html', 'linux', true);
    expect(/* TODO: allow-list */ safeGet(cmds, 0, [] as const)).toMatch(/^wslview "/);
  });
});

describe('openDocumentation (runtime-injected)', () => {
  it('generates then opens when docs are missing initially', () => {
    // Arrange: first existsSync = false (before gen), second = true (after gen)
    let existsCalls = 0;
    const existsSync = vi.fn((p: unknown) => {
      existsCalls += 1;
      return existsCalls >= 2; // false on first call, true thereafter
    });

    const execCalls: string[] = [];
    const execSync = vi.fn((cmd: string) => {
      execCalls.push(cmd);
      return Buffer.from('');
    }) as unknown as execSync;

    // Act
    openDocumentation({
      platform: 'darwin',
      isWSL: false,
      execSync,
      existsSync,
      cwd: () => '/repo',
    });

    // Assert: first call is generator, subsequent one(s) include opener
    expect(/* TODO: allow-list */ safeGet(execCalls, 0, [] as const)).toBe('node scripts/generate-ui-ecosystem-docs.js');
    expect(
      execCalls.some(
        (c) =>
          c.includes('open') &&
          c.includes('packages') &&
          c.includes('ui') &&
          c.includes('docs') &&
          c.includes('index.html'),
      ),
    ).toBe(true);
  });
});
