/**
 * User Icon - Enterprise Production Ready
 *
 * Internal SVG icon component for user display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const UserIcon = createIcon('UserIcon', () => (
  <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4.5" />
  </>
));

export type UserIconProperties = IconProperties;
export type UserIconReference = IconReference;
export type UserIconElement = IconElement;
