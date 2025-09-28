/**
 * Common CSS class name constants to avoid duplication
 *
 * This file contains frequently used CSS class combinations to comply with
 * sonarjs/no-duplicate-string ESLint rule.
 */

// Icon size constants
export const ICON_SIZE_SMALL = 'h-4 w-4';
export const ICON_SIZE_MEDIUM = 'h-5 w-5';
export const ICON_SIZE_LARGE = 'h-6 w-6';

// Common layout patterns
export const FLEX_CENTER = 'flex items-center justify-center';
export const FLEX_CENTER_COLUMN = 'flex flex-col items-center justify-center';

// Select component specific classes
export const SELECT_ITEM_ICON_CONTAINER =
  'absolute left-2 flex h-3.5 w-3.5 items-center justify-center';
export const SELECT_ITEM_ICON = ICON_SIZE_SMALL;

// Common spacing
export const PADDING_SMALL = 'p-1';
export const PADDING_MEDIUM = 'p-2';
export const PADDING_LARGE = 'p-4';

// Common positioning
export const ABSOLUTE_CENTER = 'absolute inset-0 flex items-center justify-center';
export const RELATIVE_CONTAINER = 'relative';

// Common borders and backgrounds
export const BORDER_DEFAULT = 'border border-semantic-border';
export const BACKGROUND_DEFAULT = 'bg-semantic-background';
export const TEXT_DEFAULT = 'text-semantic-foreground';
