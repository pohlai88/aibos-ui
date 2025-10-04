/**
 * Trash Icon - Enterprise Production Ready
 *
 * CRUD operation icon for deleting/removing items.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const TrashIcon = createIcon('TrashIcon', () => (
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </>
));

export type TrashIconProperties = IconProperties;
export type TrashIconReference = IconReference;
export type TrashIconElement = IconElement;
