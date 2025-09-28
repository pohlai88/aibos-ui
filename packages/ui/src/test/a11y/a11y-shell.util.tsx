import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';

type Theme = 'light' | 'dark';

/**
 * A11yShell wraps children with your tokenized backgrounds so
 * computed styles (and thus axe & contrast) match the real app.
 *
 * - Outer: app background (semantic background)
 * - Inner: typical card/content surface
 */
export const A11yShell: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <div className={`min-h-screen bg-semantic-background p-6 ${className ?? ''}`}>
      <div className="mx-auto max-w-3xl rounded-2xl bg-semantic-card p-6 shadow-lg">
        {children}
      </div>
    </div>
  );
};

/**
 * renderWithA11yShell
 * - Applies light/dark class to <html>
 * - Renders inside A11yShell (tokenized backgrounds)
 * - Lets you pass extra container classes if needed
 */
export function renderWithA11yShell(
  ui: React.ReactElement,
  {
    theme = 'light',
    containerClassName,
    ...options
  }: RenderOptions & { theme?: Theme; containerClassName?: string } = {}
): RenderResult {
  // Toggle Tailwind dark mode via class strategy
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  const shell = (
    <A11yShell className={containerClassName}>
      {ui}
    </A11yShell>
  );
  return render(shell, options);
}
