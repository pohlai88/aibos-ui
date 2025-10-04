/**
 * File Cog Icon - Enterprise Production Ready
 *
 * File operation icon for file settings/configuration display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const FileCogIcon = createIcon('FileCogIcon', () => (
  <>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14,2 14,8 20,8" />
    <circle cx="10" cy="13" r="2" />
    <path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22l4.78-4.78a2 2 0 0 0 0-2.82L16 13" />
  </>
));

export type FileCogIconProperties = IconProperties;
export type FileCogIconReference = IconReference;
export type FileCogIconElement = IconElement;
