/**
 * Calendar Icon - Enterprise Production Ready
 *
 * Calendar icon with AIBOS aesthetic refinements.
 * Optimized for 24px display with sophisticated stroke weight.
 */

import { createIcon } from './_base';

export const CalendarIcon = createIcon('CalendarIcon', () => (
  <>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
    <circle cx="12" cy="14" r="1.5" fill="currentColor" />
  </>
));
