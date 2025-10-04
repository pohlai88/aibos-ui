/**
 * Progress Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over custom progress implementation with semantic tokens.
 * Provides accessible progress components with proper ARIA attributes.
 */

import { Progress, CircularProgress } from '../primitives/progress';

// Re-export the primitive components as Radix wrappers
const ProgressRoot = Progress;
const CircularProgressRoot = CircularProgress;

export { ProgressRoot as Progress, CircularProgressRoot as CircularProgress };
