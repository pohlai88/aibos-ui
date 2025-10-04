/**
 * Alert Triangle Icon - Enterprise Production Ready
 *
 * Internal SVG icon component for alert triangles.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const AlertTriangleIcon = createIcon('AlertTriangleIcon', () => (
  <>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>
));

export type AlertTriangleIconProperties = IconProperties;
export type AlertTriangleIconReference = IconReference;
export type AlertTriangleIconElement = IconElement;
