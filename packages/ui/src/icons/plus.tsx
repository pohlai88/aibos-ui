/**
 * Plus Icon - Enterprise Production Ready
 *
 * CRUD operation icon for adding/creating items.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const PlusIcon = createIcon('PlusIcon', () => (
  <path 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    d="M12 5.5v13m6.5-6.5H5.5" 
  />
));

export type PlusIconProperties = IconProperties;
export type PlusIconReference = IconReference;
export type PlusIconElement = IconElement;
