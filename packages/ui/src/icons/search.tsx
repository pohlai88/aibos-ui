/**
 * Search Icon - Enterprise Production Ready
 *
 * Navigation icon for search functionality.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const SearchIcon = createIcon('SearchIcon', () => (
  <>
    <circle cx="11" cy="11" r="8.5" />
    <path d="m21 21-4.5-4.5" />
  </>
));

export type SearchIconProperties = IconProperties;
export type SearchIconReference = IconReference;
export type SearchIconElement = IconElement;
