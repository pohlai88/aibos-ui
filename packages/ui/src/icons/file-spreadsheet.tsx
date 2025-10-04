/**
 * File Spreadsheet Icon - Enterprise Production Ready
 *
 * Finance icon for spreadsheet/file display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const FileSpreadsheetIcon = createIcon('FileSpreadsheetIcon', () => (
  <>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14,2 14,8 20,8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </>
));

export type FileSpreadsheetIconProperties = IconProperties;
export type FileSpreadsheetIconReference = IconReference;
export type FileSpreadsheetIconElement = IconElement;
