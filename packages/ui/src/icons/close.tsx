/**
 * Close Icon - Enterprise Production Ready
 *
 * SVG-in-JS close/X icon with semantic tokens,
 * comprehensive accessibility features, and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const CloseIcon = createIcon('CloseIcon', () => (
  <path 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    d="M6.5 6.5L17.5 17.5M6.5 17.5L17.5 6.5" 
  />
));

export type CloseIconProperties = IconProperties;
export type CloseIconReference = IconReference;
export type CloseIconElement = IconElement;
