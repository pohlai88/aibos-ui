/**
 * Dunning Utilities
 * 
 * Dunning rule evaluation, fee/interest calculation helpers, and collection management.
 * Provides comprehensive dunning rule management, fee calculations, and escalation handling.
 * 
 * @fileoverview Dunning rules, fee calculations, escalation management, and collection integration
 */

import type {
  SupportedCurrency,
} from './accounting-utilities';
import { roundToCurrency } from './accounting-utilities';
import { createValidationError } from './error-utilities';
import { type ValidationIssue, type BusinessValidationResult, type ValidationCode } from './validation-utilities';
import { isValidDate } from './date-utilities';
import type { ConditionOperator, LogicalOperator } from './shared-operators-utilities';
import { z } from 'zod';

// ============================================================================
// Zod Schemas (exported) — validate config at module boundaries
// ============================================================================

export const LogicalOperatorSchema = z.enum(['and', 'or']);
export const ConditionOperatorSchema = z.enum([
  'equals', 'not_equals', 'greater_than', 'less_than',
  'contains', 'starts_with', 'ends_with', 'between', 'regex'
] as [ConditionOperator, ...ConditionOperator[]] as unknown as [string, ...string[]]);

export const DunningConditionSchema = z.object({
  field: z.string().min(1),
  operator: ConditionOperatorSchema as unknown as z.ZodType<ConditionOperator>,
  value: z.unknown().optional(),
  logicalOperator: LogicalOperatorSchema.optional() as unknown as z.ZodType<LogicalOperator | undefined>,
});

export const DunningActionSchema = z.object({
  type: z.enum(['sendLetter', 'chargeFee', 'calculateInterest', 'escalate', 'suspendAccount', 'sendToCollection']) as unknown as z.ZodType<ActionType>,
  parameters: z.record(z.unknown()),
  delay: z.number().int().nonnegative().optional(),
});

export const DunningRuleSchema = z.object({
  id: z.string().min(1),
  level: z.enum(['reminder', 'warning', 'final_notice', 'collection', 'legal']) as unknown as z.ZodType<DunningLevel>,
  name: z.string().min(1),
  description: z.string().min(1),
  conditions: z.array(DunningConditionSchema).min(1),
  actions: z.array(DunningActionSchema).min(1),
  active: z.boolean(),
  priority: z.number().int().min(0),
}) as unknown as z.ZodType<DunningRule>;

export const EscalationRuleSchema = z.object({
  id: z.string().min(1),
  fromLevel: z.enum(['reminder', 'warning', 'final_notice', 'collection', 'legal']) as unknown as z.ZodType<DunningLevel>,
  toLevel: z.enum(['reminder', 'warning', 'final_notice', 'collection', 'legal']) as unknown as z.ZodType<DunningLevel>,
  conditions: z.array(DunningConditionSchema).optional().default([]),
  delay: z.number().int(),
  active: z.boolean(),
}) as unknown as z.ZodType<EscalationRule>;

/**
 * Validate dunning rule using Zod schema
 */
export function validateDunningRule(rule: unknown): { isValid: boolean; errors: string[]; data?: unknown } {
  try {
    const validatedRule = DunningRuleSchema.parse(rule);
    return { isValid: true, errors: [], data: validatedRule };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate dunning rule with business logic and Zod schema validation
 */
export function validateDunningRuleWithSchema(rule: DunningRule): BusinessValidationResult {
  const issues: ValidationIssue[] = [];

  // ---------------------------------------------------------------------------
  // Zod schema validation (adds guardrails without breaking existing API)
  // ---------------------------------------------------------------------------
  const zres = DunningRuleSchema.safeParse(rule);
  if (!zres.success) {
    for (const err of zres.error.issues) {
      issues.push({
        code: 'FORMAT' as ValidationCode,
        message: `Schema: ${err.message}`,
        path: err.path.join('.') || 'rule',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Business logic validation (existing logic)
  // ---------------------------------------------------------------------------
  if (!rule.id) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'Rule ID is required',
      path: 'id',
    });
  }
  
  if (!rule.level) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'Dunning level is required',
      path: 'level',
    });
  }
  
  if (!rule.name) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'Rule name is required',
      path: 'name',
    });
  }
  
  if (!rule.conditions || rule.conditions.length === 0) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'At least one condition is required',
      path: 'conditions',
    });
  }
  
  if (!rule.actions || rule.actions.length === 0) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'At least one action is required',
      path: 'actions',
    });
  }
  
  if (rule.priority < 0) {
    issues.push({
      code: 'RANGE' as ValidationCode,
      message: 'Priority cannot be negative',
      path: 'priority',
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(i => i.severity !== 'warning').map(i => i.message),
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    issues,
  };
}

/**
 * Validate escalation rule using Zod schema
 */
export function validateEscalationRule(rule: unknown): { isValid: boolean; errors: string[]; data?: unknown } {
  try {
    const validatedRule = EscalationRuleSchema.parse(rule);
    return { isValid: true, errors: [], data: validatedRule };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate dunning condition using Zod schema
 */
export function validateDunningCondition(condition: unknown): { isValid: boolean; errors: string[]; data?: unknown } {
  try {
    const validatedCondition = DunningConditionSchema.parse(condition);
    return { isValid: true, errors: [], data: validatedCondition };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DunningRule {
  id: string;
  level: DunningLevel;
  name: string;
  description: string;
  conditions: DunningCondition[];
  actions: DunningAction[];
  active: boolean;
  priority: number;
}

export interface DunningCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export interface DunningAction {
  type: ActionType;
  parameters: Record<string, unknown>;
  delay?: number; // days
}

export interface DunningEvaluation {
  customer: string;
  asOfDate: Date;
  applicableRules: DunningRule[];
  recommendedActions: DunningAction[];
  escalationLevel: DunningLevel;
  totalFees: number;
  totalInterest: number;
}

export interface FeeCalculation {
  principal: number;
  feeRate: number;
  daysOverdue: number;
  feeAmount: number;
  method: FeeMethod;
  calculationDate: Date;
}

export interface InterestCalculation {
  principal: number;
  rate: number;
  days: number;
  interestAmount: number;
  method: InterestMethod;
  calculationDate: Date;
}

export interface CompoundInterestResult {
  principal: number;
  rate: number;
  periods: number;
  frequency: InterestFrequency;
  compoundAmount: number;
  interestAmount: number;
  calculationDate: Date;
}

export interface EscalationRule {
  id: string;
  fromLevel: DunningLevel;
  toLevel: DunningLevel;
  conditions: DunningCondition[];
  delay: number; // days
  active: boolean;
}

export interface EscalationResult {
  customer: string;
  fromLevel: DunningLevel;
  toLevel: DunningLevel;
  escalationDate: Date;
  reason: string;
  applicableRule: EscalationRule;
}

export interface DunningLetter {
  id: string;
  customer: string;
  level: DunningLevel;
  template: DunningTemplate;
  content: string;
  generatedDate: Date;
  sentDate?: Date;
  status: LetterStatus;
}

export interface DunningTemplate {
  id: string;
  level: DunningLevel;
  name: string;
  subject: string;
  content: string;
  active: boolean;
}

export interface DunningActivity {
  id: string;
  customer: string;
  date: Date;
  type: ActivityType;
  description: string;
  amount: number;
  currency: SupportedCurrency;
  status: ActivityStatus;
  followUpDate?: Date;
}

export interface DunningEffectiveness {
  customer: string;
  period: DateRange;
  totalLetters: number;
  totalFees: number;
  totalInterest: number;
  collectionRate: number;
  averageResponseDays: number;
  escalationRate: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type DunningLevel = 'reminder' | 'warning' | 'final_notice' | 'collection' | 'legal';
// ConditionOperator and LogicalOperator imported from shared-operators.ts (SSOT)
export type ActionType = 'send_letter' | 'charge_fee' | 'calculate_interest' | 'escalate' | 'suspend_account';
export type FeeMethod = 'fixed' | 'percentage' | 'tiered' | 'progressive';
export type InterestMethod = 'simple' | 'compound' | 'daily' | 'monthly';
export type InterestFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
export type LetterStatus = 'draft' | 'sent' | 'delivered' | 'failed';
export type ActivityType = 'letter' | 'call' | 'email' | 'payment' | 'promise' | 'dispute';
export type ActivityStatus = 'completed' | 'pending' | 'cancelled' | 'rescheduled';

// ============================================================================
// Rule Management
// ============================================================================

// In-memory storage for dunning rules
const dunningRules = new Map<DunningLevel, DunningRule[]>();

/**
 * Define dunning rule
 */
export function defineDunningRule(
  level: DunningLevel,
  conditions: DunningCondition[],
  actions: DunningAction[]
): DunningRule {
  const rule: DunningRule = {
    id: `DUNNING-${level}-${Date.now()}`,
    level,
    name: `${level} Rule`,
    description: `Dunning rule for ${level} level`,
    conditions,
    actions,
    active: true,
    priority: 1,
  };
  
  const validation = validateDunningRule(rule);
  if (!validation.isValid) {
    throw createValidationError(
      'INVALID_DUNNING_RULE',
      'Invalid dunning rule provided',
      rule,
      { operation: 'define-dunning-rule' }
    );
  }
  
  const existing = dunningRules.get(level) || [];
  existing.push(rule);
  dunningRules.set(level, existing);
  
  return rule;
}

/**
 * Evaluate dunning rules
 */
export function evaluateDunningRules(
  customer: string,
  asOfDate: Date,
  /**
   * Optional condition context used by the evaluator.
   * Provide any fields referenced by DunningCondition.field (e.g., "daysOverdue", "balance", "segment", etc.)
   */
  context: Record<string, unknown> = {}
): DunningEvaluation {
  if (!isValidDate(asOfDate)) {
    throw createValidationError(
      'INVALID_AS_OF_DATE',
      'As-of date must be valid',
      asOfDate,
      { operation: 'evaluate-dunning-rules' }
    );
  }
  
  const applicableRules: DunningRule[] = [];
  const recommendedActions: DunningAction[] = [];
  let escalationLevel: DunningLevel = 'reminder';
  let totalFees = 0;
  let totalInterest = 0;
  
  // Evaluate rules for each level
  const levels: DunningLevel[] = ['reminder', 'warning', 'final_notice', 'collection', 'legal'];
  
  for (const level of levels) {
    const rules = dunningRules.get(level) || [];
    
    for (const rule of rules) {
      if (rule.active && evaluateConditions(rule.conditions, customer, asOfDate, context)) {
        applicableRules.push(rule);
        recommendedActions.push(...rule.actions);
        escalationLevel = level;
        
        // Calculate fees and interest for applicable actions
        for (const action of rule.actions) {
          if (action.type === 'charge_fee') {
            totalFees += action.parameters.amount || 0;
          } else if (action.type === 'calculate_interest') {
            totalInterest += action.parameters.amount || 0;
          }
        }
      }
    }
  }
  
  return {
    customer,
    asOfDate,
    applicableRules,
    recommendedActions,
    escalationLevel,
    totalFees,
    totalInterest,
  };
}

// ============================================================================
// Fee Calculations
// ============================================================================

/**
 * Calculate late payment fee
 */
export function calculateLatePaymentFee(
  amount: number,
  daysOverdue: number,
  feeRate: number,
  method: FeeMethod,
  /**
   * Currency used for rounding the computed fee. Defaults to 'USD' to preserve existing behavior.
   */
  currency: SupportedCurrency = 'USD'
): FeeCalculation {
  if (amount < 0) {
    throw createValidationError(
      'NEGATIVE_AMOUNT',
      'Amount cannot be negative',
      amount,
      { operation: 'calculate-late-payment-fee' }
    );
  }
  
  if (daysOverdue < 0) {
    throw createValidationError(
      'NEGATIVE_DAYS_OVERDUE',
      'Days overdue cannot be negative',
      daysOverdue,
      { operation: 'calculate-late-payment-fee' }
    );
  }
  
  if (feeRate < 0) {
    throw createValidationError(
      'NEGATIVE_FEE_RATE',
      'Fee rate cannot be negative',
      feeRate,
      { operation: 'calculate-late-payment-fee' }
    );
  }
  
  let feeAmount: number;
  
  switch (method) {
    case 'fixed':
      // feeRate represents a fixed amount when method === 'fixed'
      feeAmount = feeRate;
      break;
    case 'percentage':
      // feeRate is interpreted as a percentage (e.g., 2.5 means 2.5%)
      feeAmount = amount * (feeRate / 100);
      break;
    case 'tiered':
      // Simplified tiered calculation
      if (daysOverdue <= 30) {
        feeAmount = amount * 0.01; // 1% for first 30 days
      } else if (daysOverdue <= 60) {
        feeAmount = amount * 0.02; // 2% for 31-60 days
      } else {
        feeAmount = amount * 0.03; // 3% for over 60 days
      }
      break;
    case 'progressive':
      feeAmount = amount * (feeRate / 100) * (daysOverdue / 30); // Progressive based on days
      break;
    default:
      throw createValidationError(
        'UNSUPPORTED_FEE_METHOD',
        `Unsupported fee method: ${method}`,
        method,
        { operation: 'calculate-late-payment-fee' }
      );
  }
  
  return {
    principal: amount,
    feeRate,
    daysOverdue,
    feeAmount: roundToCurrency(feeAmount, currency),
    method,
    calculationDate: new Date(),
  };
}

/**
 * Calculate interest
 */
export function calculateInterest(
  principal: number,
  rate: number,
  days: number,
  method: InterestMethod,
  /**
   * Currency used for rounding the computed interest. Defaults to 'USD' to preserve existing behavior.
   */
  currency: SupportedCurrency = 'USD'
): InterestCalculation {
  if (principal < 0) {
    throw createValidationError(
      'NEGATIVE_PRINCIPAL',
      'Principal cannot be negative',
      principal,
      { operation: 'calculate-interest' }
    );
  }
  
  if (rate < 0) {
    throw createValidationError(
      'NEGATIVE_RATE',
      'Interest rate cannot be negative',
      rate,
      { operation: 'calculate-interest' }
    );
  }
  
  if (days < 0) {
    throw createValidationError(
      'NEGATIVE_DAYS',
      'Days cannot be negative',
      days,
      { operation: 'calculate-interest' }
    );
  }
  
  let interestAmount: number;
  
  switch (method) {
    case 'simple':
      // 'rate' is expected as a decimal per annum (e.g., 0.06 for 6%)
      interestAmount = principal * rate * (days / 365);
      break;
    case 'compound':
      interestAmount = principal * Math.pow(1 + rate, days / 365) - principal;
      break;
    case 'daily':
      interestAmount = principal * rate * (days / 365);
      break;
    case 'monthly':
      interestAmount = principal * rate * (days / 30);
      break;
    default:
      throw createValidationError(
        'UNSUPPORTED_INTEREST_METHOD',
        `Unsupported interest method: ${method}`,
        method,
        { operation: 'calculate-interest' }
      );
  }
  
  return {
    principal,
    rate,
    days,
    interestAmount: roundToCurrency(interestAmount, currency),
    method,
    calculationDate: new Date(),
  };
}

/**
 * Calculate compound interest
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  periods: number,
  frequency: InterestFrequency,
  /**
   * Currency used for rounding the computed amounts. Defaults to 'USD' to preserve existing behavior.
   */
  currency: SupportedCurrency = 'USD'
): CompoundInterestResult {
  if (principal < 0) {
    throw createValidationError(
      'NEGATIVE_PRINCIPAL',
      'Principal cannot be negative',
      principal,
      { operation: 'calculate-compound-interest' }
    );
  }
  
  if (rate < 0) {
    throw createValidationError(
      'NEGATIVE_RATE',
      'Interest rate cannot be negative',
      rate,
      { operation: 'calculate-compound-interest' }
    );
  }
  
  if (periods < 0) {
    throw createValidationError(
      'NEGATIVE_PERIODS',
      'Periods cannot be negative',
      periods,
      { operation: 'calculate-compound-interest' }
    );
  }
  // Guard against non-integer periods that can creep in from upstream math.
  if (!Number.isFinite(periods) || Math.floor(periods) !== periods) {
    periods = Math.floor(periods);
  }
  
  let periodsPerYear: number;
  
  switch (frequency) {
    case 'daily':
      periodsPerYear = 365;
      break;
    case 'weekly':
      periodsPerYear = 52;
      break;
    case 'monthly':
      periodsPerYear = 12;
      break;
    case 'quarterly':
      periodsPerYear = 4;
      break;
    case 'annually':
      periodsPerYear = 1;
      break;
    default:
      throw createValidationError(
        'UNSUPPORTED_FREQUENCY',
        `Unsupported interest frequency: ${frequency}`,
        frequency,
        { operation: 'calculate-compound-interest' }
      );
  }
  
  const compoundAmount = principal * Math.pow(1 + (rate / periodsPerYear), periods);
  const interestAmount = compoundAmount - principal;
  
  return {
    principal,
    rate,
    periods,
    frequency,
    compoundAmount: roundToCurrency(compoundAmount, currency),
    interestAmount: roundToCurrency(interestAmount, currency),
    calculationDate: new Date(),
  };
}

// ============================================================================
// Escalation Management
// ============================================================================

/**
 * Escalate dunning level
 */
export function escalateDunningLevel(
  customer: string,
  currentLevel: DunningLevel,
  escalationRule: EscalationRule
): EscalationResult {
  if (!escalationRule.active) {
    throw createValidationError(
      'INACTIVE_ESCALATION_RULE',
      'Escalation rule is not active',
      escalationRule,
      { operation: 'escalate-dunning-level' }
    );
  }
  
  if (escalationRule.fromLevel !== currentLevel) {
    throw createValidationError(
      'INVALID_ESCALATION_LEVEL',
      'Escalation rule does not match current level',
      { currentLevel, fromLevel: escalationRule.fromLevel },
      { operation: 'escalate-dunning-level' }
    );
  }
  
  // Honor the rule's delay in days when computing the escalation date.
  const DAY_MS = 24 * 60 * 60 * 1000;
  const escalationDate = new Date(Date.now() + (Math.max(0, escalationRule.delay) * DAY_MS));

  return {
    customer,
    fromLevel: currentLevel,
    toLevel: escalationRule.toLevel,
    escalationDate,
    reason: 'Automatic escalation based on rule',
    applicableRule: escalationRule,
  };
}

/**
 * Validate escalation
 */
export function validateEscalation(escalation: EscalationResult): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!escalation.customer) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'Customer is required',
      path: 'customer',
    });
  }
  
  if (!escalation.fromLevel) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'From level is required',
      path: 'fromLevel',
    });
  }
  
  if (!escalation.toLevel) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'To level is required',
      path: 'toLevel',
    });
  }
  
  if (!isValidDate(escalation.escalationDate)) {
    issues.push({
      code: 'FORMAT' as ValidationCode,
      message: 'Escalation date must be valid',
      path: 'escalationDate',
    });
  }
  
  if (!escalation.reason) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'Escalation reason is required',
      path: 'reason',
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(i => i.severity !== 'warning').map(i => i.message),
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    issues,
  };
}

/**
 * Track escalation history
 */
export function trackEscalationHistory(_customer: string, escalation: EscalationResult): void {
  // In a real implementation, this would persist to database/event store
  // For now, we'll use a structured logging approach
  const escalationEvent = {
    type: 'dunning.escalation',
    timestamp: new Date().toISOString(),
    customer: escalation.customer,
    fromLevel: escalation.fromLevel,
    toLevel: escalation.toLevel,
    escalationDate: escalation.escalationDate.toISOString(),
    reason: escalation.reason,
    ruleId: escalation.applicableRule.id,
    metadata: {
      ruleId: escalation.applicableRule.id,
      delay: escalation.applicableRule.delay,
    }
  };

  // TODO: Replace with actual persistence mechanism
  // Examples: EventStore, Database, Message Queue, etc.
  console.log('DUNNING_ESCALATION_EVENT:', JSON.stringify(escalationEvent, null, 2));
}

// ============================================================================
// Collection Integration
// ============================================================================

/**
 * Generate dunning letter
 */
export function generateDunningLetter(
  customer: string,
  level: DunningLevel,
  template: DunningTemplate
): DunningLetter {
  if (!template.active) {
    throw createValidationError(
      'INACTIVE_TEMPLATE',
      'Dunning template is not active',
      template,
      { operation: 'generate-dunning-letter' }
    );
  }
  
  if (template.level !== level) {
    throw createValidationError(
      'TEMPLATE_LEVEL_MISMATCH',
      'Template level does not match dunning level',
      { templateLevel: template.level, dunningLevel: level },
      { operation: 'generate-dunning-letter' }
    );
  }
  
  return {
    id: `LETTER-${customer}-${level}-${Date.now()}`,
    customer,
    level,
    template,
    content: template.content,
    generatedDate: new Date(),
    status: 'draft',
  };
}

/**
 * Track dunning activity
 */
export function trackDunningActivity(_customer: string, activity: DunningActivity): void {
  // In a real implementation, this would persist to database/event store
  // For now, we'll use a structured logging approach
  const activityEvent = {
    type: 'dunning.activity',
    timestamp: new Date().toISOString(),
    customer: activity.customer,
    activityType: activity.type,
    description: activity.description,
    amount: activity.amount,
    currency: activity.currency,
    date: activity.date.toISOString(),
    metadata: {
      status: activity.status,
      followUpDate: activity.followUpDate?.toISOString(),
    }
  };

  // TODO: Replace with actual persistence mechanism
  // Examples: EventStore, Database, Message Queue, etc.
  console.log('DUNNING_ACTIVITY_EVENT:', JSON.stringify(activityEvent, null, 2));
}

/**
 * Calculate dunning effectiveness
 */
export function calculateDunningEffectiveness(
  customer: string,
  period: DateRange
): DunningEffectiveness {
  // This would typically fetch data from database
  const totalLetters = 0; // Placeholder
  const totalFees = 0; // Placeholder
  const totalInterest = 0; // Placeholder
  const collectionRate = 0; // Placeholder
  const averageResponseDays = 0; // Placeholder
  const escalationRate = 0; // Placeholder
  
  return {
    customer,
    period,
    totalLetters,
    totalFees,
    totalInterest,
    collectionRate,
    averageResponseDays,
    escalationRate,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Minimal, dependency-light condition evaluator
 * - Evaluates left-to-right, honoring condition.logicalOperator (default AND)
 * - Works against a provided context object
 * - Supported operators (string-based): eq, neq, gt, gte, lt, lte, in, nin, contains, starts_with, ends_with, is_set, is_not_set, between
 * - You can feed any domain values into 'context' when calling evaluateDunningRules(..., context)
 */
export function evaluateConditions(
  conditions: DunningCondition[],
  customer: string,
  asOfDate: Date,
  context: Record<string, unknown> = {}
): boolean {
  if (!conditions || conditions.length === 0) return true;

  // Merge default implicit context
  const ctx: Record<string, unknown> = {
    customer,
    asOfDate,
    ...context,
  };

  const get = (path: string): unknown => ctx[path];

  const ops: Record<string, (fieldVal: unknown, condVal: unknown) => boolean> = {
    eq: (a, b) => a === b,
    neq: (a, b) => a !== b,
    gt: (a, b) => toNum(a) > toNum(b),
    gte: (a, b) => toNum(a) >= toNum(b),
    lt: (a, b) => toNum(a) < toNum(b),
    lte: (a, b) => toNum(a) <= toNum(b),
    in: (a, b) => Array.isArray(b) && b.includes(a as never),
    nin: (a, b) => Array.isArray(b) && !b.includes(a as never),
    contains: (a, b) => String(a ?? '').includes(String(b ?? '')),
    starts_with: (a, b) => String(a ?? '').startsWith(String(b ?? '')),
    ends_with: (a, b) => String(a ?? '').endsWith(String(b ?? '')),
    is_set: (a) => a !== undefined && a !== null,
    is_not_set: (a) => a === undefined || a === null,
    between: (a, b) => {
      if (!Array.isArray(b) || b.length !== 2) return false;
      const [min, max] = b;
      const n = toNum(a);
      return n >= toNum(min) && n <= toNum(max);
    },
  };

  let acc = true;
  let first = true;

  for (const cond of conditions) {
    const fieldVal = get(cond.field);
    const op = ops[String(cond.operator)];
    const result = op ? op(fieldVal, cond.value) : false;

    if (first) {
      acc = result;
      first = false;
    } else {
      const logic: LogicalOperator = (cond.logicalOperator as LogicalOperator) || ('and' as LogicalOperator);
      acc = logic === 'or' ? (acc || result) : (acc && result);
    }
  }

  return acc;
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Get dunning level hierarchy
 */
export function getDunningLevelHierarchy(): DunningLevel[] {
  return ['reminder', 'warning', 'final_notice', 'collection', 'legal'];
}

/**
 * Get next dunning level
 */
export function getNextDunningLevel(currentLevel: DunningLevel): DunningLevel | null {
  const hierarchy = getDunningLevelHierarchy();
  const currentIndex = hierarchy.indexOf(currentLevel);
  
  if (currentIndex === -1 || currentIndex === hierarchy.length - 1) {
    return null;
  }
  
  return hierarchy[currentIndex + 1] || null;
}

/**
 * Clear dunning rules (for testing)
 */
export function clearDunningRules(): void {
  dunningRules.clear();
}

/**
 * Get dunning summary
 */
export function getDunningSummary(
  evaluations: DunningEvaluation[]
): {
  totalCustomers: number;
  totalFees: number;
  totalInterest: number;
  levelBreakdown: Record<DunningLevel, number>;
  averageFees: number;
  averageInterest: number;
} {
  const totalCustomers = evaluations.length;
  const totalFees = evaluations.reduce((sum, evaluation) => sum + evaluation.totalFees, 0);
  const totalInterest = evaluations.reduce((sum, evaluation) => sum + evaluation.totalInterest, 0);
  
  const levelBreakdown: Record<DunningLevel, number> = {
    reminder: 0,
    warning: 0,
    final_notice: 0,
    collection: 0,
    legal: 0,
  };
  
  for (const evaluation of evaluations) {
    levelBreakdown[evaluation.escalationLevel]++;
  }
  
  const averageFees = totalCustomers > 0 ? totalFees / totalCustomers : 0;
  const averageInterest = totalCustomers > 0 ? totalInterest / totalCustomers : 0;
  
  return {
    totalCustomers,
    totalFees,
    totalInterest,
    levelBreakdown,
    averageFees,
    averageInterest,
  };
}
