/**
 * Info Icon - Enterprise Production Ready
 *
 * Internal SVG icon component for information display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const InfoIcon = createIcon('InfoIcon', () => (
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <circle cx="12" cy="8" r="1" />
  </>
));

export type InfoIconProperties = IconProperties;
export type InfoIconReference = IconReference;
export type InfoIconElement = IconElement;
