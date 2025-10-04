/**
 * Barcode Icon - Enterprise Production Ready
 *
 * Inventory icon for barcode/scanning display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const BarcodeIcon = createIcon('BarcodeIcon', () => (
  <>
    <path d="M3 5v14" />
    <path d="M8 5v14" />
    <path d="M12 5v14" />
    <path d="M17 5v14" />
    <path d="M21 5v14" />
  </>
));

export type BarcodeIconProperties = IconProperties;
export type BarcodeIconReference = IconReference;
export type BarcodeIconElement = IconElement;
