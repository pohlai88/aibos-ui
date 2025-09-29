import { describe, it, expect } from 'vitest';
import {
  CONDITION_OPERATORS,
  LOGICAL_OPERATORS,
  CONDITION_OPERATOR_SET,
  LOGICAL_OPERATOR_SET,
  isConditionOperator,
  isLogicalOperator,
  validateConditionOperator,
  validateLogicalOperator,
  type ConditionOperator,
  type LogicalOperator,
} from '../shared-operators';

describe('shared-operators SSOT', () => {
  it('CONDITION_OPERATORS contains regex and matches the set', () => {
    expect(CONDITION_OPERATORS).toContain('regex');
    // ensure arrays and sets are in sync
    for (const op of CONDITION_OPERATORS) {
      expect(CONDITION_OPERATOR_SET.has(op)).toBe(true);
    }
  });

  it('LOGICAL_OPERATORS are in sync with set', () => {
    for (const op of LOGICAL_OPERATORS) {
      expect(LOGICAL_OPERATOR_SET.has(op)).toBe(true);
    }
  });
});

describe('type guards', () => {
  it('isConditionOperator: happy path', () => {
    const samples: ConditionOperator[] = [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'contains',
      'starts_with',
      'ends_with',
      'between',
      'regex',
    ];
    for (const s of samples) {
      expect(isConditionOperator(s)).toBe(true);
    }
  });

  it('isConditionOperator: unhappy path', () => {
    const bad: unknown[] = [null, undefined, 123, {}, [], 'EQUALS', 'gte', '!=', 'and'];
    for (const b of bad) {
      expect(isConditionOperator(b)).toBe(false);
    }
  });

  it('isLogicalOperator: happy path', () => {
    const samples: LogicalOperator[] = ['and', 'or', 'not'];
    for (const s of samples) {
      expect(isLogicalOperator(s)).toBe(true);
    }
  });

  it('isLogicalOperator: unhappy path', () => {
    const bad: unknown[] = [null, undefined, 0, {}, [], 'AND', '||', 'equals'];
    for (const b of bad) {
      expect(isLogicalOperator(b)).toBe(false);
    }
  });
});

describe('validators', () => {
  it('validateConditionOperator returns the operator when valid', () => {
    expect(validateConditionOperator('regex')).toBe('regex');
    expect(validateConditionOperator('equals')).toBe('equals');
  });

  it('validateConditionOperator throws when invalid', () => {
    expect(() => validateConditionOperator('EQUALS' as unknown)).toThrowError(
      /Invalid condition operator:/,
    );
  });

  it('validateLogicalOperator returns the operator when valid', () => {
    expect(validateLogicalOperator('and')).toBe('and');
  });

  it('validateLogicalOperator throws when invalid', () => {
    expect(() => validateLogicalOperator('&&' as unknown)).toThrowError(
      /Invalid logical operator:/,
    );
  });
});
