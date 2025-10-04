/**
 * Home Icon - Enterprise Production Ready
 *
 * Navigation icon for home/dashboard display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const HomeIcon = createIcon('HomeIcon', () => (
  <>
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" 
    />
    <path d="M9 21V12h6v9" />
  </>
));

export type HomeIconProperties = IconProperties;
export type HomeIconReference = IconReference;
export type HomeIconElement = IconElement;
