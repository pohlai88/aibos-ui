// Shared Utilities and Helpers
// This package will contain all shared utility functions, helpers, and common logic

export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const generateId = (): string => {
  return Math.random().toString(36).slice(2, 11);
};

// Security utilities
export {
  assertAllowedKey,
  safeGet,
  safeMapGet,
  safeJoin,
  safeRegExpFromUser,
  isValidPathComponent,
  safePathJoin,
} from './security';

// Safe object utilities
export {
  hasOwn,
  createDict,
  isSafeKey,
  safeSet,
  assertAllowed,
  setIfAllowed,
  getIfAllowed,
  incrementCounter,
  getCounter,
  type Whitelist,
} from './safe-object';

// Safe filesystem utilities
export {
  safeResolve,
  isPathSafe,
  safePath,
  readFileSafe,
  writeFileSafe,
  readDirectorySafe,
  existsSafe,
  statSafe,
  EXTENSIONS,
} from './safeFs';

// CLI argument validation utilities
export {
  AnalyzeBundleArgs,
  ConvertAliasesArgs,
  FixDoublePathsArgs,
  ScanComponentsArgs,
  ValidateUsageMapArgs,
  parseArgs,
  showHelp,
  COMMON_PATTERNS,
} from './args';

// Type guards and utilities
export {
  isNonNullish,
  toNullable,
  toUndefinable,
  toNullableString,
  toUndefinableString,
  isString,
  isNumber,
  isRecord,
  narrowToElements,
  isReactElement,
  elementsOf,
} from './type-guards';

// Code quality utilities
export {
  nullToUndefined,
  undefinedToNull,
  safeCoalesce,
  stringRegistry,
  createStringConstant,
  getStringConstant,
  SafeArray,
  createSafeArray,
  SafeSet,
  createSafeSet,
  SafeObjectBuilder,
  createSafeObjectBuilder,
  COMMON_STRINGS,
  isNullish,
  isNotNullish,
  safeToString,
  createSafeCounter,
  safeIncrement,
  safeGetCount,
} from './code-quality';

// Backward compatibility alias
// export { sanitizePlainText as sanitizeInput } from './security';

// Placeholder for future utility functions
export const UTILS_VERSION = '0.1.0';
