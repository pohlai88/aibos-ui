/**
 * Filter Icon - Enterprise Production Ready
 *
 * Navigation icon for filtering/search functionality.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const FilterIcon = createIcon('FilterIcon', () => (
  <>
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
    <circle cx="10" cy="12.46" r="1" />
    <circle cx="14" cy="12.46" r="1" />
  </>
));

export type FilterIconProperties = IconProperties;
export type FilterIconReference = IconReference;
export type FilterIconElement = IconElement;
