/**
 * Boxes Icon - Enterprise Production Ready
 *
 * Inventory icon for multiple boxes/containers display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const BoxesIcon = createIcon('BoxesIcon', () => (
  <>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </>
));

export type BoxesIconProperties = IconProperties;
export type BoxesIconReference = IconReference;
export type BoxesIconElement = IconElement;
