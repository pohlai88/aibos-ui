/**
 * Clock Icon - Enterprise Production Ready
 *
 * Clock icon with AIBOS aesthetic refinements.
 * Optimized for 24px display with sophisticated stroke weight.
 */

import { createIcon } from './_base';

export const ClockIcon = createIcon('ClockIcon', () => (
  <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </>
));
