/**
 * Check Circle Icon - Enterprise Production Ready
 *
 * Internal SVG icon component for check circles.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const CheckCircleIcon = createIcon('CheckCircleIcon', () => (
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </>
));

export type CheckCircleIconProperties = IconProperties;
export type CheckCircleIconReference = IconReference;
export type CheckCircleIconElement = IconElement;
