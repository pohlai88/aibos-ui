/**
 * Package Icon - Enterprise Production Ready
 *
 * Inventory icon for package/product display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const PackageIcon = createIcon('PackageIcon', () => (
  <>
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8" />
    <polyline points="3.3,7 12,12 20.7,7" />
    <line x1="12" y1="22" x2="12" y2="12" />
  </>
));

export type PackageIconProperties = IconProperties;
export type PackageIconReference = IconReference;
export type PackageIconElement = IconElement;
