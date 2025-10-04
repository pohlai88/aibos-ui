/**
 * Chevron Down Icon - Enterprise Production Ready
 *
 * SVG-in-JS chevron down icon with semantic tokens,
 * comprehensive accessibility features, and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const ChevronDownIcon = createIcon('ChevronDownIcon', () => (
  <path 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    d="m19.25 8.75-7.25 7.25-7.25-7.25" 
  />
));

export type ChevronDownIconProperties = IconProperties;
export type ChevronDownIconReference = IconReference;
export type ChevronDownIconElement = IconElement;
