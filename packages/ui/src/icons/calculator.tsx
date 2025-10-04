/**
 * Calculator Icon - Enterprise Production Ready
 *
 * Finance icon for calculator/calculation display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const CalculatorIcon = createIcon('CalculatorIcon', () => (
  <>
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <rect width="4" height="2" x="8" y="6" rx="1" />
    <circle cx="8" cy="14" r="1" />
    <circle cx="12" cy="14" r="1" />
    <circle cx="16" cy="14" r="1" />
    <circle cx="8" cy="18" r="1" />
    <circle cx="12" cy="18" r="1" />
    <circle cx="16" cy="18" r="1" />
    <circle cx="12" cy="10" r="1" />
    <circle cx="16" cy="10" r="1" />
  </>
));

export type CalculatorIconProperties = IconProperties;
export type CalculatorIconReference = IconReference;
export type CalculatorIconElement = IconElement;
