/**
 * Separator Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over custom separator implementation with semantic tokens.
 * Provides accessible separator component with proper ARIA attributes.
 */

import { Separator } from '../primitives/separator';

// Re-export the primitive component as Radix wrapper
const SeparatorRoot = Separator;

export { SeparatorRoot as Separator };
