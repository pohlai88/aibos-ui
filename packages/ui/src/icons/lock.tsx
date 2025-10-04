/**
 * Lock Icon - Enterprise Production Ready
 *
 * Security icon for lock/security display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const LockIcon = createIcon('LockIcon', () => (
  <>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="1" />
  </>
));

export type LockIconProperties = IconProperties;
export type LockIconReference = IconReference;
export type LockIconElement = IconElement;
