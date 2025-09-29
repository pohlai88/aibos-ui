/**
 * Shared Operators - Single Source of Truth
 * 
 * Centralized definitions for ConditionOperator and LogicalOperator types
 * used across all accounting utilities to prevent duplication and conflicts.
 * 
 * @fileoverview SSOT for operator types and validation
 */

// ============================================================================
// OPERATOR TYPES
// ============================================================================

/**
 * Condition operators for filtering and validation
 */
export type ConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'greater_than' 
  | 'less_than' 
  | 'contains' 
  | 'starts_with' 
  | 'ends_with' 
  | 'between';

/**
 * Logical operators for combining conditions
 */
export type LogicalOperator = 'and' | 'or' | 'not';

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for ConditionOperator validation
 */
export function isConditionOperator(value: unknown): value is ConditionOperator {
  return typeof value === 'string' && [
    'equals', 'not_equals', 'greater_than', 'less_than',
    'contains', 'starts_with', 'ends_with', 'between'
  ].includes(value);
}

/**
 * Type guard for LogicalOperator validation
 */
export function isLogicalOperator(value: unknown): value is LogicalOperator {
  return typeof value === 'string' && ['and', 'or', 'not'].includes(value);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate condition operator with error message
 */
export function validateConditionOperator(value: unknown): ConditionOperator {
  if (!isConditionOperator(value)) {
    throw new Error(`Invalid condition operator: ${value}. Must be one of: equals, not_equals, greater_than, less_than, contains, starts_with, ends_with, between`);
  }
  return value;
}

/**
 * Validate logical operator with error message
 */
export function validateLogicalOperator(value: unknown): LogicalOperator {
  if (!isLogicalOperator(value)) {
    throw new Error(`Invalid logical operator: ${value}. Must be one of: and, or, not`);
  }
  return value;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * All valid condition operators
 */
export const CONDITION_OPERATORS: readonly ConditionOperator[] = [
  'equals', 'not_equals', 'greater_than', 'less_than',
  'contains', 'starts_with', 'ends_with', 'between'
] as const;

/**
 * All valid logical operators
 */
export const LOGICAL_OPERATORS: readonly LogicalOperator[] = [
  'and', 'or', 'not'
] as const;
