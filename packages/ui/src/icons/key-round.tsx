/**
 * Key Round Icon - Enterprise Production Ready
 *
 * Security icon for key/authentication display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const KeyRoundIcon = createIcon('KeyRoundIcon', () => (
  <>
    <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
    <circle cx="16.5" cy="7.5" r="2.5" />
  </>
));

export type KeyRoundIconProperties = IconProperties;
export type KeyRoundIconReference = IconReference;
export type KeyRoundIconElement = IconElement;
