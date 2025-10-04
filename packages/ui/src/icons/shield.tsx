/**
 * Shield Icon - Enterprise Production Ready
 *
 * Security icon for protection/shield display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const ShieldIcon = createIcon('ShieldIcon', () => (
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </>
));

export type ShieldIconProperties = IconProperties;
export type ShieldIconReference = IconReference;
export type ShieldIconElement = IconElement;
