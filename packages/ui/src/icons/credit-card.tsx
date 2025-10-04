/**
 * Credit Card Icon - Enterprise Production Ready
 *
 * Finance icon for payment/credit card display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const CreditCardIcon = createIcon('CreditCardIcon', () => (
  <>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <rect width="6" height="2" x="6" y="12" rx="1" />
    <rect width="4" height="2" x="14" y="12" rx="1" />
  </>
));

export type CreditCardIconProperties = IconProperties;
export type CreditCardIconReference = IconReference;
export type CreditCardIconElement = IconElement;
