/**
 * Line Chart Icon - Enterprise Production Ready
 *
 * Analytics icon for line chart display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const LineChartIcon = createIcon('LineChartIcon', () => (
  <>
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </>
));

export type LineChartIconProperties = IconProperties;
export type LineChartIconReference = IconReference;
export type LineChartIconElement = IconElement;
