/**
 * Refresh Icon - Enterprise Production Ready
 *
 * Action icon for refreshing/reloading data.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const RefreshIcon = createIcon('RefreshIcon', () => (
  <>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
    <circle cx="12" cy="12" r="1" />
  </>
));

export type RefreshIconProperties = IconProperties;
export type RefreshIconReference = IconReference;
export type RefreshIconElement = IconElement;
