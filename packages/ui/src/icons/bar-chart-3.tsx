/**
 * Bar Chart 3 Icon - Enterprise Production Ready
 *
 * Analytics icon for bar chart display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const BarChart3Icon = createIcon('BarChart3Icon', () => (
  <>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
    <circle cx="18" cy="9" r="1" />
    <circle cx="13" cy="5" r="1" />
    <circle cx="8" cy="14" r="1" />
  </>
));

export type BarChart3IconProperties = IconProperties;
export type BarChart3IconReference = IconReference;
export type BarChart3IconElement = IconElement;
