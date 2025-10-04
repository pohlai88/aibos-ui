/**
 * Banknote Icon - Enterprise Production Ready
 *
 * Finance icon for currency/money display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const BanknoteIcon = createIcon('BanknoteIcon', () => (
  <>
    <rect width="20" height="12" x="2" y="6" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </>
));

export type BanknoteIconProperties = IconProperties;
export type BanknoteIconReference = IconReference;
export type BanknoteIconElement = IconElement;
