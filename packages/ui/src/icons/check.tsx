/**
 * Check Icon - Enterprise Production Ready
 *
 * SVG-in-JS checkmark icon with semantic tokens,
 * comprehensive accessibility features, and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const CheckIcon = createIcon('CheckIcon', () => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
));

export type CheckIconProperties = IconProperties;
export type CheckIconReference = IconReference;
export type CheckIconElement = IconElement;
