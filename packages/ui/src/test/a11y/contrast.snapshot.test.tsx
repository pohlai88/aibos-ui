/**
 * Contrast Snapshot Suite
 * - Computes numeric contrast for key components across themes.
 * - Asserts thresholds AND emits a JSON snapshot for CI trending.
 *
 * Set CONTRAST_SNAPSHOT_PATH to also write a JSON file (optional).
 */
import { screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getElementContrast } from './contrast.util';
import { renderWithA11yShell } from './a11y-shell.util';

// Components under test (add more as needed)
import { Button } from '@primitives/button';
import { Input } from '@primitives/input';
import { Badge } from '@primitives/badge';
import { Checkbox } from '@primitives/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/tabs';

type Case = {
  id: string;
  render: () => JSX.Element;
  selector?: string; // optional finer selector if the root isn't textual
  threshold?: number; // override if large text (AA_LARGE)
};

const AAA = 7.0;

const CASES: Case[] = [
  { id: 'button.primary', render: () => <Button data-testid="c">Primary</Button> },
  { id: 'input.field', render: () => <Input aria-label="Email" placeholder="email" data-testid="c" /> },
  { id: 'badge.neutral', render: () => <Badge data-testid="c">New</Badge> },
  { id: 'checkbox.base', render: () => <Checkbox aria-label="Accept" data-testid="c" /> },
  {
    id: 'tabs.trigger',
    render: () => (
      <Tabs defaultValue="a" aria-label="demo">
        <TabsList>
          <TabsTrigger value="a" data-testid="c">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
        <TabsContent value="b">Panel B</TabsContent>
      </Tabs>
    ),
  },
  // Example of large text override:
  // { id: 'hero.cta', render: () => <Button className="text-2xl font-semibold" data-testid="c">Get started</Button>, threshold: AA_LARGE },
];

// Theme applicator — adjust if your Tailwind uses a different dark-mode selector
const THEMES: Array<'light' | 'dark'> = ['light', 'dark'];

const SNAP: Record<string, Record<string, number>> = {}; // { theme: { caseId: ratio } }

beforeEach(() => {
  // Provide a stable background container so tokens compute consistently
  document.body.innerHTML = '<div id="mount" class="bg-semantic-background p-4"></div>';
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('Contrast Snapshot (light & dark)', () => {
  it.each(THEMES)('theme: %s meets thresholds and records snapshot', (theme) => {
    if (!SNAP[theme]) SNAP[theme] = {};

    for (const c of CASES) {
      const { container } = renderWithA11yShell(
        // render inside your tokenized shell so computed styles match production
        <div id="wrap" className="bg-semantic-background p-4">{c.render()}</div>,
        { theme, container: document.getElementById('mount') as HTMLElement }
      );
      const el =
        (c.selector ? container.querySelector(c.selector) : screen.getByTestId('c')) as HTMLElement | null;
      expect(el, `missing element for ${c.id}`).toBeTruthy();

      const ratio = getElementContrast(el!);
      // Fail fast if we couldn't compute colors (usually a token/class issue)
      expect(Number.isFinite(ratio), `${theme}:${c.id} produced NaN contrast`).toBe(true);

      const rounded = Number((ratio as number).toFixed(2));
      SNAP[theme][c.id] = rounded;

      // Assert threshold (AAA default unless overridden)
      const min = c.threshold ?? AAA;
      expect(rounded, `${theme}:${c.id} contrast ${rounded} < ${min}`).toBeGreaterThanOrEqual(min);
    }
  });
});

// Emit snapshot once after this file's tests complete
afterAll(() => {
  const json = JSON.stringify({ generatedAt: new Date().toISOString(), snapshot: SNAP }, null, 2);
  // Prefer file write if path is provided
  const out = process.env.CONTRAST_SNAPSHOT_PATH;
  if (out) {
    const p = path.resolve(out);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, json, 'utf8');
    // Also echo a short line for CI logs
    // eslint-disable-next-line no-console
    console.log(`[contrast] snapshot written: ${p}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[contrast] snapshot:\n${json}`);
  }
});
