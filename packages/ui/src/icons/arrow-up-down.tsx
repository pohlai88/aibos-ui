/**
 * Arrow Up Down Icon - Enterprise Production Ready
 *
 * Arrow up down icon with AIBOS aesthetic refinements.
 * Optimized for 24px display with sophisticated stroke weight.
 */

import { createIcon } from './_base';

export const ArrowUpDownIcon = createIcon('ArrowUpDownIcon', () => (
  <>
    <path d="M21 16V8" />
    <path d="M7 16v8" />
    <path d="m21 8-4-4-4 4" />
    <path d="m7 16 4 4 4-4" />
    <circle cx="17" cy="6" r="1" fill="currentColor" />
    <circle cx="7" cy="18" r="1" fill="currentColor" />
  </>
));
