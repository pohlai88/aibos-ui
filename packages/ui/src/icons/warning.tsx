/**
 * Warning Icon - Enterprise Production Ready
 *
 * Internal SVG icon component for warning display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const WarningIcon = createIcon('WarningIcon', () => (
  <>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="12" cy="17" r="1" />
  </>
));

export type WarningIconProperties = IconProperties;
export type WarningIconReference = IconReference;
export type WarningIconElement = IconElement;
