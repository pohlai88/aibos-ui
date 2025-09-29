/**
 * Rounding Policy Utilities
 * 
 * Central registry for currency, tax, and report rounding steps to keep reconciliations consistent.
 * Provides comprehensive rounding policy management, application, and validation operations.
 * 
 * @fileoverview Central rounding policy registry and consistency validation
 */

import type {
  SupportedCurrency,
} from './accounting-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import type { ConditionOperator, LogicalOperator } from './shared-operators-utilities';
import { RoundingMethod } from './policies/rounding-policy';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface RoundingPolicy {
  id: string;
  name: string;
  description: string;
  context: RoundingContext;
  method: RoundingMethod;
  precision: number;
  rules: RoundingRule[];
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface RoundingContext {
  id: string;
  name: string;
  type: ContextType;
  description: string;
  rules: ContextRules;
  parentContext?: string;
  childContexts: string[];
  priority: number;
}

export interface RoundedAmount {
  original: number;
  rounded: number;
  difference: number;
  method: RoundingMethod;
  precision: number;
  context: RoundingContext;
  roundedAt: Date;
}

export interface RoundingRule {
  id: string;
  name: string;
  condition: RoundingCondition;
  action: RoundingAction;
  priority: number;
  active: boolean;
}

export interface RoundingDecision {
  amount: number;
  context: RoundingContext;
  method: RoundingMethod;
  precision: number;
  result: number;
  difference: number;
  timestamp: Date;
  user: string;
  reason: string;
}

export interface AuditEntry {
  id: string;
  amount: number;
  context: RoundingContext;
  decision: RoundingDecision;
  timestamp: Date;
  user: string;
  action: AuditAction;
  details: string;
}

export interface PolicyUpdates {
  name?: string;
  description?: string;
  method?: RoundingMethod;
  precision?: number;
  rules?: RoundingRule[];
  active?: boolean;
  expiryDate?: Date;
}

export interface ContextRules {
  currency?: SupportedCurrency;
  amountRange?: AmountRange;
  userRole?: string;
  department?: string;
  reportType?: string;
}

export interface AmountRange {
  min: number;
  max: number;
  inclusive: boolean;
}

export interface RoundingCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export interface RoundingAction {
  type: ActionType;
  parameters: ActionParameters;
  description: string;
}

export interface ActionParameters {
  method?: RoundingMethod;
  precision?: number;
  threshold?: number;
  fallback?: RoundingMethod;
}

export interface ContextHierarchy {
  context: RoundingContext;
  parent?: RoundingContext;
  children: RoundingContext[];
  level: number;
  path: string[];
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  framework: ComplianceFramework;
  rules: ComplianceRule[];
  active: boolean;
}

export interface ComplianceRule {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  message: string;
  severity: 'error' | 'warning';
}

export interface ComplianceResult {
  requirement: ComplianceRequirement;
  isCompliant: boolean;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface RoundingDifference {
  original: number;
  rounded: number;
  difference: number;
  percentage: number;
  withinTolerance: boolean;
  tolerance: number;
}

export type ContextType = 'currency' | 'tax' | 'reporting' | 'calculation' | 'display';
// RoundingMethod, ConditionOperator, and LogicalOperator imported from SSOT modules
export type ActionType = 'round' | 'truncate' | 'ceiling' | 'floor' | 'no_action';
export type AuditAction = 'create' | 'update' | 'delete' | 'apply' | 'validate';
export type ComplianceFramework = 'ifrs' | 'gaap' | 'basel' | 'local' | 'internal';

// ============================================================================
// Policy Management
// ============================================================================

/**
 * Define rounding policy for a context
 */
export function defineRoundingPolicy(context: RoundingContext, method: RoundingMethod): RoundingPolicy {
  return {
    id: `policy_${context.id}_${Date.now()}`,
    name: `Rounding Policy for ${context.name}`,
    description: `Rounding policy for ${context.description}`,
    context,
    method,
    precision: 2, // Default 2 decimal places
    rules: [],
    active: true,
    effectiveDate: new Date(),
  };
}

/**
 * Get rounding policy for a context
 */
export function getRoundingPolicy(context: RoundingContext): RoundingPolicy | undefined {
  // In practice, this would query a policy registry
  // For now, return a default policy
  return defineRoundingPolicy(context, RoundingMethod.HALF_UP);
}

/**
 * Update rounding policy
 */
export function updateRoundingPolicy(policy: RoundingPolicy, updates: PolicyUpdates): RoundingPolicy {
  return {
    ...policy,
    ...updates,
    // Preserve original creation date
    effectiveDate: policy.effectiveDate,
  };
}

/**
 * Validate rounding policy
 */
export function validateRoundingPolicy(policy: RoundingPolicy): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Validate policy name
  if (!policy.name || policy.name.trim() === '') {
      issues.push({
        path: 'name',
        message: 'Policy name is required',
        severity: 'error',
        code: 'REQUIRED',
      });
  }
  
  // Validate context
  if (!policy.context) {
    issues.push({
        path: 'context',
      message: 'Rounding context is required',
      severity: 'error',
        code: 'REQUIRED',
    });
  }
  
  // Validate method
  if (!policy.method) {
    issues.push({
      path: 'method',
      message: 'Rounding method is required',
      severity: 'error',
        code: 'REQUIRED',
    });
  }
  
  // Validate precision
  if (policy.precision < 0 || policy.precision > 10) {
    issues.push({
      path: 'precision',
      message: 'Precision must be between 0 and 10',
      severity: 'error',
        code: 'REQUIRED',
    });
  }
  
  // Validate effective date
  if (policy.effectiveDate > new Date()) {
    issues.push({
        path: 'effectiveDate',
      message: 'Effective date cannot be in the future',
      severity: 'warning',
        code: 'FORMAT',
    });
  }
  
  // Validate expiry date
  if (policy.expiryDate && policy.expiryDate <= policy.effectiveDate) {
    issues.push({
        path: 'expiryDate',
      message: 'Expiry date must be after effective date',
      severity: 'error',
        code: 'REQUIRED',
    });
  }
  
  // Validate rules
  policy.rules.forEach((rule, index) => {
    if (!rule.name || rule.name.trim() === '') {
      issues.push({
        path: `rules[${index}].name`,
        message: 'Rule name is required',
        severity: 'error',
        code: 'REQUIRED',
      });
    }
    
    if (!rule.condition) {
      issues.push({
        path: `rules[${index}].condition`,
        message: 'Rule condition is required',
        severity: 'error',
        code: 'REQUIRED',
      });
    }
    
    if (!rule.action) {
      issues.push({
        path: `rules[${index}].action`,
        message: 'Rule action is required',
        severity: 'error',
        code: 'REQUIRED',
      });
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

// ============================================================================
// Policy Application
// ============================================================================

/**
 * Apply rounding policy to an amount
 */
export function applyRoundingPolicy(amount: number, context: RoundingContext): RoundedAmount {
  const policy = getRoundingPolicy(context);
  if (!policy) {
    throw new Error(`No rounding policy found for context ${context.id}`);
  }
  
  const rounded = applyRoundingMethod(amount, policy.method, policy.precision);
  const difference = rounded - amount;
  
  return {
    original: amount,
    rounded,
    difference,
    method: policy.method,
    precision: policy.precision,
    context,
    roundedAt: new Date(),
  };
}

/**
 * Apply rounding policy to an array of amounts
 */
export function applyRoundingToArray(amounts: number[], context: RoundingContext): RoundedAmount[] {
  return amounts.map(amount => applyRoundingPolicy(amount, context));
}

/**
 * Validate rounding consistency across amounts
 */
export function validateRoundingConsistency(amounts: number[], context: RoundingContext): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  const roundedAmounts = applyRoundingToArray(amounts, context);
  
  // Check for consistent rounding method
  const methods = new Set(roundedAmounts.map(ra => ra.method));
  if (methods.size > 1) {
    issues.push({
      path: 'method',
      message: 'Inconsistent rounding methods applied',
      severity: 'error',
        code: 'REQUIRED',
    });
  }
  
  // Check for consistent precision
  const precisions = new Set(roundedAmounts.map(ra => ra.precision));
  if (precisions.size > 1) {
    issues.push({
      path: 'precision',
      message: 'Inconsistent precision applied',
      severity: 'error',
        code: 'REQUIRED',
    });
  }
  
  // Check for excessive rounding differences (precision-aware)
  const unit = Math.pow(10, - (roundedAmounts[0]?.precision ?? 2));
  const excessiveDifferences = roundedAmounts.filter(ra => Math.abs(ra.difference) > unit + 1e-12);
  if (excessiveDifferences.length > 0) {
    issues.push({
        path: 'difference',
      message: `${excessiveDifferences.length} amounts have excessive rounding differences`,
      severity: 'warning',
        code: 'FORMAT',
    });
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Calculate rounding difference
 */
export function calculateRoundingDifference(original: number, rounded: number, precision: number = 2): RoundingDifference {
  const difference = rounded - original;
  const percentage = original !== 0 ? (difference / original) * 100 : 0;
  const tolerance = Math.pow(10, -precision);
  const withinTolerance = Math.abs(difference) <= tolerance + 1e-12;
  
  return {
    original,
    rounded,
    difference,
    percentage,
    withinTolerance,
    tolerance,
  };
}

// ============================================================================
// Context Management
// ============================================================================

/**
 * Define rounding context
 */
export function defineRoundingContext(name: string, type: ContextType, rules: ContextRules): RoundingContext {
  return {
    id: `context_${name}_${Date.now()}`,
    name,
    type,
    description: `Rounding context for ${name}`,
    rules,
    childContexts: [],
    priority: 1,
  };
}

/**
 * Validate rounding context
 */
export function validateRoundingContext(context: RoundingContext): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Validate context name
  if (!context.name || context.name.trim() === '') {
    issues.push({
      path: 'name',
      message: 'Context name is required',
      severity: 'error',
        code: 'REQUIRED',
    });
  }
  
  // Validate context type
  if (!context.type) {
    issues.push({
        path: 'type',
      message: 'Context type is required',
      severity: 'error',
        code: 'REQUIRED',
    });
  }
  
  // Validate rules
  if (context.rules.amountRange) {
    const range = context.rules.amountRange;
    if (range.min >= range.max) {
      issues.push({
        path: 'rules.amountRange',
        message: 'Minimum amount must be less than maximum amount',
        severity: 'error',
        code: 'REQUIRED',
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Get context hierarchy
 */
export function getContextHierarchy(context: RoundingContext): ContextHierarchy {
  const path: string[] = [];
  const children: RoundingContext[] = [];
  let level = 0;
  
  // Build path from current context to root
  let current: RoundingContext | undefined = context;
  while (current) {
    path.unshift(current.id);
    level++;
    current = current.parentContext ? getContextById(current.parentContext) : undefined;
  }
  
  // Get children
  context.childContexts.forEach(childId => {
    const child = getContextById(childId);
    if (child) {
      children.push(child);
    }
  });
  
  return {
    context,
    children,
    level,
    path,
  };
}

/**
 * Merge rounding contexts
 */
export function mergeRoundingContexts(contexts: RoundingContext[]): RoundingContext {
  if (contexts.length === 0) {
    throw new Error('Cannot merge empty context list');
  }
  
  if (contexts.length === 1) {
    return contexts[0]!;
  }
  
  // Use the highest priority context as base
  const baseContext = contexts.reduce((highest, current) => 
    current.priority > highest.priority ? current : highest
  );
  
  if (!baseContext) {
    throw new Error('No contexts provided for merging');
  }
  
  // Merge rules from all contexts
  const mergedRules: ContextRules = { ...baseContext.rules };
  
  contexts.forEach(context => {
    if (context.rules.currency && !mergedRules.currency) {
      mergedRules.currency = context.rules.currency;
    }
    if (context.rules.userRole && !mergedRules.userRole) {
      mergedRules.userRole = context.rules.userRole;
    }
    if (context.rules.department && !mergedRules.department) {
      mergedRules.department = context.rules.department;
    }
    if (context.rules.reportType && !mergedRules.reportType) {
      mergedRules.reportType = context.rules.reportType;
    }
  });
  
  return {
    ...baseContext,
    name: `Merged Context (${contexts.map(c => c.name).join(', ')})`,
    description: `Merged context from ${contexts.length} contexts`,
    rules: mergedRules,
    childContexts: contexts.flatMap(c => c.childContexts),
  };
}

// ============================================================================
// Consistency and Validation
// ============================================================================

/**
 * Check rounding compliance
 */
export function checkRoundingCompliance(amount: number, policy: RoundingPolicy, requirements: ComplianceRequirement[]): ComplianceResult[] {
  return requirements.map(requirement => {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    
    // Check IFRS compliance
    if (requirement.framework === 'ifrs') {
      // IFRS requires consistent rounding methods
      if (policy.method === RoundingMethod.TRUNCATE) {
        issues.push({
          path: 'method',
          message: 'IFRS does not allow truncation for financial reporting',
          severity: 'error',
          code: 'REQUIRED',
        });
        recommendations.push('Use round_half_up or round_half_even method');
      }
      
      // IFRS requires appropriate precision
      if (policy.precision < 2) {
        issues.push({
          path: 'precision',
          message: 'IFRS requires at least 2 decimal places for currency amounts',
          severity: 'warning',
          code: 'FORMAT',
        });
        recommendations.push('Increase precision to at least 2 decimal places');
      }
    }
    
    // Check GAAP compliance
    if (requirement.framework === 'gaap') {
      // GAAP allows various rounding methods but requires consistency
      if (policy.method === RoundingMethod.HALF_DOWN) {
        issues.push({
          path: 'method',
          message: 'GAAP typically uses round_half_up for financial reporting',
          severity: 'warning',
          code: 'FORMAT',
        });
        recommendations.push('Consider using round_half_up method');
      }
    }
    
    // Check Basel compliance
    if (requirement.framework === 'basel') {
      // Basel requires conservative rounding for risk calculations
      if (policy.method === RoundingMethod.HALF_UP && amount < 0) {
        issues.push({
          path: 'method',
          message: 'Basel requires conservative rounding for negative amounts',
          severity: 'warning',
          code: 'FORMAT',
        });
        recommendations.push('Consider using round_half_down for negative amounts');
      }
    }
    
    return {
      requirement,
      isCompliant: issues.length === 0,
      issues,
      recommendations,
    };
  });
}

/**
 * Audit rounding decision
 */
export function auditRoundingDecision(amount: number, context: RoundingContext, decision: RoundingDecision): AuditEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount,
    context,
    decision,
    timestamp: new Date(),
    user: decision.user,
    action: 'apply',
    details: `Applied ${decision.method} rounding with precision ${decision.precision}`,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function applyRoundingMethod(amount: number, method: RoundingMethod, precision: number): number {
  const factor = Math.pow(10, precision);
  const scaled = amount * factor;
  const EPS = 1e-10; // tie tolerance for FP

  // Helper to split integer & fractional parts with sign safety
  const split = (x: number) => {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const int = Math.floor(ax);
    const frac = ax - int;
    return { sign, int, frac };
  };

  switch (method) {
    case RoundingMethod.HALF_UP: {
      // ties (.5) go AWAY from zero
      const { sign, int, frac } = split(scaled);
      if (frac > 0.5 + EPS) return (sign * (int + 1)) / factor;
      if (frac < 0.5 - EPS) return (sign * int) / factor;
      // tie
      return (sign * (int + 1)) / factor;
    }
    case RoundingMethod.HALF_DOWN: {
      // ties (.5) go TOWARD zero
      const { sign, int, frac } = split(scaled);
      if (frac > 0.5 + EPS) return (sign * (int + 1)) / factor;
      if (frac < 0.5 - EPS) return (sign * int) / factor;
      // tie
      return (sign * int) / factor;
    }
    case RoundingMethod.HALF_EVEN: {
      // banker's rounding: ties (.5) to nearest EVEN integer
      const { sign, int, frac } = split(scaled);
      if (frac > 0.5 + EPS) return (sign * (int + 1)) / factor;
      if (frac < 0.5 - EPS) return (sign * int) / factor;
      // tie: choose even neighbor
      const up = int + 1;
      const chosen = up % 2 === 0 ? up : int; // if up is even, go up; else stay
      return (sign * chosen) / factor;
    }
    case RoundingMethod.CEILING:
      return Math.ceil(scaled) / factor;
    case RoundingMethod.FLOOR:
      return Math.floor(scaled) / factor;
    case RoundingMethod.TRUNCATE:
      return Math.trunc(scaled) / factor;
    default:
      // Sensible default is HALF_UP
      const { sign, int, frac } = split(scaled);
      if (frac > 0.5 + EPS) return (sign * (int + 1)) / factor;
      if (frac < 0.5 - EPS) return (sign * int) / factor;
      return (sign * (int + 1)) / factor;
  }
}

function getContextById(_contextId: string): RoundingContext | undefined {
  // In practice, this would query a context registry
  // For now, return undefined
  return undefined;
}

// ============================================================================
// Predefined Contexts
// ============================================================================

/**
 * Get currency rounding context
 */
export function getCurrencyRoundingContext(currency: SupportedCurrency): RoundingContext {
  return defineRoundingContext(
    `Currency_${currency}`,
    'currency',
    {
      currency,
      amountRange: {
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        inclusive: true,
      },
    }
  );
}

/**
 * Get tax rounding context
 */
export function getTaxRoundingContext(): RoundingContext {
  return defineRoundingContext(
    'Tax_Calculation',
    'tax',
    {
      amountRange: {
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        inclusive: true,
      },
    }
  );
}

/**
 * Get reporting rounding context
 */
export function getReportingRoundingContext(reportType: string): RoundingContext {
  return defineRoundingContext(
    `Reporting_${reportType}`,
    'reporting',
    {
      reportType,
      amountRange: {
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        inclusive: true,
      },
    }
  );
}

/**
 * Get calculation rounding context
 */
export function getCalculationRoundingContext(): RoundingContext {
  return defineRoundingContext(
    'Calculation',
    'calculation',
    {
      amountRange: {
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
        inclusive: true,
      },
    }
  );
}

/**
 * Get display rounding context
 */
export function getDisplayRoundingContext(): RoundingContext {
  return defineRoundingContext(
    'Display',
    'display',
    {
      amountRange: {
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
        inclusive: true,
      },
    }
  );
}
