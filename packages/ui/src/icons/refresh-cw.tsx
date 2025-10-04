/**
 * Refresh Cw Icon - Enterprise Production Ready
 *
 * Refresh clockwise icon with AIBOS aesthetic refinements.
 * Optimized for 24px display with sophisticated stroke weight.
 */

import { createIcon } from './_base';

export const RefreshCwIcon = createIcon('RefreshCwIcon', () => (
  <>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </>
));
