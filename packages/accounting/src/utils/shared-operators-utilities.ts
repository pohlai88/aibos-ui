/**
 * Shared Operators - Single Source of Truth
 *
 * Centralized definitions for ConditionOperator and LogicalOperator types
 * used across all accounting utilities to prevent duplication and conflicts.
 *
 * @fileoverview SSOT for operator types and validation
 */

// ============================================================================
// CONSTANTS (single source of truth)
// ============================================================================

/**
 * All valid condition operators
 * (This array is the SSOT; types & guards derive from it.)
 */
export const CONDITION_OPERATORS = [
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'contains',
  'starts_with',
  'ends_with',
  'between',
  'regex',
] as const;

/**
 * All valid logical operators
 * (SSOT; types & guards derive from it.)
 */
export const LOGICAL_OPERATORS = ['and', 'or', 'not'] as const;

// ============================================================================
// OPERATOR TYPES (derived from constants)
// ============================================================================

/**
 * Condition operators for filtering and validation
 */
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

/**
 * Logical operators for combining conditions
 */
export type LogicalOperator = (typeof LOGICAL_OPERATORS)[number];

// ============================================================================
// TYPE GUARDS
// ============================================================================

// Precomputed sets for O(1) membership checks (side-effect free & treeshakeable)
export const CONDITION_OPERATOR_SET: ReadonlySet<ConditionOperator> =
  /* @__PURE__ */ new Set(CONDITION_OPERATORS);
export const LOGICAL_OPERATOR_SET: ReadonlySet<LogicalOperator> =
  /* @__PURE__ */ new Set(LOGICAL_OPERATORS);

/**
 * Type guard for ConditionOperator validation
 */
export function isConditionOperator(value: unknown): value is ConditionOperator {
  return typeof value === 'string' && CONDITION_OPERATOR_SET.has(value as ConditionOperator);
}

/**
 * Type guard for LogicalOperator validation
 */
export function isLogicalOperator(value: unknown): value is LogicalOperator {
  return typeof value === 'string' && LOGICAL_OPERATOR_SET.has(value as LogicalOperator);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate condition operator with error message
 */
export function validateConditionOperator(value: unknown): ConditionOperator {
  if (!isConditionOperator(value)) {
    throw new Error(
      `Invalid condition operator: ${value}. Must be one of: ${CONDITION_OPERATORS.join(', ')}`
    );
  }
  return value;
}

/**
 * Validate logical operator with error message
 */
export function validateLogicalOperator(value: unknown): LogicalOperator {
  if (!isLogicalOperator(value)) {
    throw new Error(`Invalid logical operator: ${value}. Must be one of: ${LOGICAL_OPERATORS.join(', ')}`);
  }
  return value;
}
