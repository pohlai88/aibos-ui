/**
 * Dunning Utilities
 * 
 * Dunning rule evaluation, fee/interest calculation helpers, and collection management.
 * Provides comprehensive dunning rule management, fee calculations, and escalation handling.
 * 
 * @fileoverview Dunning rules, fee calculations, escalation management, and collection integration
 */

import {
  SupportedCurrency,
  roundToCurrency,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';
import { type ValidationIssue, type BusinessValidationResult, type ValidationCode } from './validation-utilities';
import { isValidDate } from './date-utilities';

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
  value: any;
  logicalOperator?: LogicalOperator;
}

export interface DunningAction {
  type: ActionType;
  parameters: Record<string, any>;
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
export type ConditionOperator = 'equals' | 'greater_than' | 'less_than' | 'between' | 'contains';
export type LogicalOperator = 'and' | 'or' | 'not';
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
 * Validate dunning rule
 */
export function validateDunningRule(rule: DunningRule): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
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
 * Evaluate dunning rules
 */
export function evaluateDunningRules(
  customer: string,
  asOfDate: Date
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
      if (rule.active && evaluateConditions(rule.conditions, customer, asOfDate)) {
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
  method: FeeMethod
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
      feeAmount = feeRate;
      break;
    case 'percentage':
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
    feeAmount: roundToCurrency(feeAmount, 'USD'),
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
  method: InterestMethod
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
    interestAmount: roundToCurrency(interestAmount, 'USD'),
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
  frequency: InterestFrequency
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
    compoundAmount: roundToCurrency(compoundAmount, 'USD'),
    interestAmount: roundToCurrency(interestAmount, 'USD'),
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
  
  return {
    customer,
    fromLevel: currentLevel,
    toLevel: escalationRule.toLevel,
    escalationDate: new Date(),
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
export function trackEscalationHistory(customer: string, escalation: EscalationResult): void {
  // This would typically store in database
  console.log(`Tracking escalation for customer ${customer}:`, escalation);
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
export function trackDunningActivity(customer: string, activity: DunningActivity): void {
  // This would typically store in database
  console.log(`Tracking dunning activity for customer ${customer}:`, activity);
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
 * Evaluate conditions
 */
function evaluateConditions(
  _conditions: DunningCondition[],
  _customer: string,
  _asOfDate: Date
): boolean {
  // Simplified condition evaluation
  // In a real implementation, this would check customer data against conditions
  return true;
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
