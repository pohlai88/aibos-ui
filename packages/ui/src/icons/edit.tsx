/**
 * Edit Icon - Enterprise Production Ready
 *
 * CRUD operation icon for editing/modifying items.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const EditIcon = createIcon('EditIcon', () => (
  <>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    <circle cx="18.5" cy="5.5" r="1" />
  </>
));

export type EditIconProperties = IconProperties;
export type EditIconReference = IconReference;
export type EditIconElement = IconElement;
