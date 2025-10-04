/**
 * Chevron Left Icon - Enterprise Production Ready
 *
 * Chevron pointing left icon component with semantic tokens
 * and comprehensive accessibility features.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const ChevronLeftIcon = createIcon('ChevronLeftIcon', () => (
  <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
), 2, true); // Enable RTL flip for directional icon

export type ChevronLeftIconProperties = IconProperties;
export type ChevronLeftIconReference = IconReference;
export type ChevronLeftIconElement = IconElement;
