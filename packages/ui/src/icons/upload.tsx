/**
 * Upload Icon - Enterprise Production Ready
 *
 * Internal SVG icon component for upload actions.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const UploadIcon = createIcon('UploadIcon', () => (
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,5 17,10" />
    <line x1="12" y1="5" x2="12" y2="15" />
  </>
));

export type UploadIconProperties = IconProperties;
export type UploadIconReference = IconReference;
export type UploadIconElement = IconElement;
