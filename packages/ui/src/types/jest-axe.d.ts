/**
 * Type declarations for jest-axe
 * Provides type definitions for accessibility testing matchers
 */

declare module 'jest-axe' {
  import type { AxeResults, RunOptions, Spec } from 'axe-core';

  export interface JestAxeConfigureOptions {
    globalOptions?: Spec;
    impactLevels?: string[];
  }

  export function configureAxe(options?: JestAxeConfigureOptions): (node: Element) => Promise<AxeResults>;
  export function axe(node: Element, options?: RunOptions): Promise<AxeResults>;
  export const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): {
      pass: boolean;
      message(): string;
    };
  };
}
