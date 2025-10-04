/**
 * Alert Circle Icon - Enterprise Production Ready
 *
 * Internal SVG icon component for alert circles.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const AlertCircleIcon = createIcon('AlertCircleIcon', () => (
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </>
));

export type AlertCircleIconProperties = IconProperties;
export type AlertCircleIconReference = IconReference;
export type AlertCircleIconElement = IconElement;
