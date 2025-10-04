/**
 * Pie Chart Icon - Enterprise Production Ready
 *
 * Analytics icon for pie chart display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const PieChartIcon = createIcon('PieChartIcon', () => (
  <>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
    <circle cx="12" cy="12" r="2" />
  </>
));

export type PieChartIconProperties = IconProperties;
export type PieChartIconReference = IconReference;
export type PieChartIconElement = IconElement;
