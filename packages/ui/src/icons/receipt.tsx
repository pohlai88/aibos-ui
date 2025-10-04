/**
 * Receipt Icon - Enterprise Production Ready
 *
 * Finance icon for receipts/invoices display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const ReceiptIcon = createIcon('ReceiptIcon', () => (
  <>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
    <path d="M14 8H8" />
    <path d="M16 12H8" />
    <path d="M10 16H8" />
  </>
));

export type ReceiptIconProperties = IconProperties;
export type ReceiptIconReference = IconReference;
export type ReceiptIconElement = IconElement;
