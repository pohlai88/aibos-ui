/**
 * Table Icon - Enterprise Production Ready
 *
 * Analytics icon for table/grid display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const TableIcon = createIcon('TableIcon', () => (
  <>
    <path d="M12 3v18" />
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M3 9h18M3 15h18" />
  </>
));

export type TableIconProperties = IconProperties;
export type TableIconReference = IconReference;
export type TableIconElement = IconElement;
