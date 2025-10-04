/**
 * Chevron Up Icon - Enterprise Production Ready
 *
 * SVG-in-JS chevron up icon with semantic tokens,
 * comprehensive accessibility features, and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const ChevronUpIcon = createIcon('ChevronUpIcon', () => (
  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
));

export type ChevronUpIconProperties = IconProperties;
export type ChevronUpIconReference = IconReference;
export type ChevronUpIconElement = IconElement;
