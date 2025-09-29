/**
 * Utility functions for the AI-BOS UI package
 *
 * This module provides essential utilities for component development
 * including class name merging, variant management, and polymorphic behavior.
 */

// Internal utilities (self-contained, no external dependencies)
export * from './internal';

// Class name utilities
export { cn, cx, makeCn } from './cn.utility';

// Variant management
export {
  variants,
  type VariantProps,
  composeVariants,
  defineVariants,
  type VariantOf,
} from './variants.utility';

// Polymorphic component utilities
export {
  polymorphic,
  type AsProperty,
  type PolymorphicProperties,
  type PolymorphicReference,
  type PolymorphicOptions,
} from './polymorphic.utility';

// Performance utilities
export { isPerfMode, resetPerfMode } from './perf.utility';

// Variance reduction utilities
export {
  varianceAttributes,
  stabilizeRender,
  useStableCallback,
} from './variance-reduction.utility';
