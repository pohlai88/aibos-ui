/**
 * Contrast Smoke Suite (AAA by default)
 * - Checks a small set of representative components.
 * - Keep fast & deterministic; no fonts or layout assumptions.
 */
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { getElementContrast } from './contrast.util';
import { renderWithA11yShell } from './a11y-shell.util';

import { Button } from '@primitives/button';
import { Input } from '@primitives/input';
import { Badge } from '@primitives/badge';

// Thresholds
const AAA = 7.0;

describe('Color Contrast (token-based)', () => {
  const THEMES: Array<'light' | 'dark'> = ['light', 'dark'];

  it.each(THEMES)('Button meets AAA (theme: %s)', (theme) => {
    renderWithA11yShell(<Button data-testid="btn">Primary Action</Button>, { theme });
    const btn = screen.getByTestId('btn');
    const ratio = getElementContrast(btn);
    // If your primary button uses large/bold text by design, loosen to AA_LARGE
    expect(ratio).toBeGreaterThanOrEqual(AAA);
  });

  it.each(THEMES)('Input text meets AAA (theme: %s)', (theme) => {
    renderWithA11yShell(<Input aria-label="Email" placeholder="john@doe.com" data-testid="in" />, { theme });
    const input = screen.getByTestId('in');
    const ratio = getElementContrast(input);
    expect(ratio).toBeGreaterThanOrEqual(AAA);
  });

  it.each(THEMES)('Badge text meets AAA (theme: %s)', (theme) => {
    renderWithA11yShell(<Badge data-testid="badge">New</Badge>, { theme });
    const badge = screen.getByTestId('badge');
    const ratio = getElementContrast(badge);
    expect(ratio).toBeGreaterThanOrEqual(AAA);
  });
});
