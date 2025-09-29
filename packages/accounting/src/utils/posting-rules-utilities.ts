/**
 * Posting Rules Utilities - Phase 1 Implementation
 * 
 * Map business intents to standardized double-entry templates for consistent posting.
 * Provides a rule engine for dynamic posting based on business context.
 * 
 * Features:
 * - Rule engine for posting rules
 * - Template management for double-entry templates
 * - Business intent mapping
 * - Rule validation
 * - Dynamic posting based on business context
 */

import {
  type SupportedCurrency,
  roundToCurrency,
} from './accounting-utilities';
import type { JournalEntry, JournalLine } from './journal-entry-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BusinessIntent {
  type: 'invoice_posted' | 'payment_received' | 'expense_incurred' | 'asset_purchased' | 'inventory_received' | 'depreciation' | 'adjustment';
  context: Record<string, any>;
}

export interface BusinessContext {
  date: Date;
  amount: number;
  currency: SupportedCurrency;
  reference: string;
  description: string;
  [key: string]: any;
}

export interface TemplateLine {
  accountCode: string;
  description: string;
  debitFormula: string;
  creditFormula: string;
  conditions?: LineCondition[];
}

export interface LineCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: any;
}

export interface PostingTemplate {
  id: string;
  name: string;
  description: string;
  lines: TemplateLine[];
  validationRules: TemplateValidationRule[];
}

export interface TemplateValidationRule {
  type: 'balance' | 'currency' | 'account' | 'amount';
  message: string;
  severity: 'error' | 'warning';
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists' | 'in' | 'not_in';
  value: any;
}

export interface PostingRule {
  id: string;
  name: string;
  businessIntent: BusinessIntent;
  template: PostingTemplate;
  conditions: RuleCondition[];
  priority: number;
  active: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// RULE MANAGEMENT
// ============================================================================

/**
 * Define a posting rule for a business intent
 */
export function definePostingRule(
  intent: BusinessIntent,
  template: PostingTemplate
): PostingRule {
  if (!intent) {
    throw new Error('Business intent is required');
  }

  if (!template) {
    throw new Error('Posting template is required');
  }

  const rule: PostingRule = {
    id: `RULE-${Date.now()}`,
    name: `${intent.type}_${template.name}`,
    businessIntent: intent,
    template,
    conditions: [],
    priority: 100,
    active: true,
  };

  return rule;
}

/**
 * Validate a posting rule
 */
export function validatePostingRule(rule: PostingRule): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rule) {
    errors.push('Posting rule is required');
    return { isValid: false, errors, warnings };
  }

  // Validate rule structure
  if (!rule.id) {
    errors.push('Rule ID is required');
  }

  if (!rule.name) {
    errors.push('Rule name is required');
  }

  if (!rule.businessIntent) {
    errors.push('Business intent is required');
  }

  if (!rule.template) {
    errors.push('Posting template is required');
  }

  if (typeof rule.priority !== 'number' || rule.priority < 0) {
    errors.push('Priority must be a non-negative number');
  }

  if (typeof rule.active !== 'boolean') {
    errors.push('Active flag must be a boolean');
  }

  // Validate business intent
  if (rule.businessIntent) {
    if (!rule.businessIntent.type) {
      errors.push('Business intent type is required');
    }

    if (!rule.businessIntent.context || typeof rule.businessIntent.context !== 'object') {
      errors.push('Business intent context must be an object');
    }
  }

  // Validate template
  if (rule.template) {
    const templateValidation = validateTemplate(rule.template);
    if (!templateValidation.isValid) {
      errors.push(...templateValidation.errors);
    }
    warnings.push(...templateValidation.warnings);
  }

  // Validate conditions
  if (rule.conditions) {
    rule.conditions.forEach((condition, index) => {
      if (!condition.field) {
        errors.push(`Condition ${index + 1}: Field is required`);
      }

      if (!condition.operator) {
        errors.push(`Condition ${index + 1}: Operator is required`);
      }

      const validOperators = ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'exists', 'in', 'not_in'];
      if (condition.operator && !validOperators.includes(condition.operator)) {
        errors.push(`Condition ${index + 1}: Invalid operator '${condition.operator}'`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Execute a posting rule against business context
 */
export function executePostingRule(
  rule: PostingRule,
  context: BusinessContext
): JournalEntry {
  if (!rule) {
    throw new Error('Posting rule is required');
  }

  if (!context) {
    throw new Error('Business context is required');
  }

  // Validate rule
  const ruleValidation = validatePostingRule(rule);
  if (!ruleValidation.isValid) {
    throw new Error(`Invalid posting rule: ${ruleValidation.errors.join(', ')}`);
  }

  // Check if rule is active
  if (!rule.active) {
    throw new Error('Posting rule is not active');
  }

  // Check conditions
  if (!evaluateConditions(rule.conditions, context)) {
    throw new Error('Business context does not match rule conditions');
  }

  // Apply template to generate journal entry
  return applyTemplate(rule.template, context);
}

// ============================================================================
// TEMPLATE OPERATIONS
// ============================================================================

/**
 * Create a posting template
 */
export function createPostingTemplate(
  name: string,
  lines: TemplateLine[]
): PostingTemplate {
  if (!name) {
    throw new Error('Template name is required');
  }

  if (!lines || lines.length === 0) {
    throw new Error('Template lines are required');
  }

  const template: PostingTemplate = {
    id: `TEMPLATE-${Date.now()}`,
    name,
    description: `Template for ${name}`,
    lines,
    validationRules: [
      {
        type: 'balance',
        message: 'Template must be balanced',
        severity: 'error',
      },
    ],
  };

  return template;
}

/**
 * Validate a posting template
 */
export function validateTemplate(template: PostingTemplate): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!template) {
    errors.push('Posting template is required');
    return { isValid: false, errors, warnings };
  }

  // Validate template structure
  if (!template.id) {
    errors.push('Template ID is required');
  }

  if (!template.name) {
    errors.push('Template name is required');
  }

  if (!template.lines || template.lines.length === 0) {
    errors.push('Template must have at least one line');
  }

  // Validate template lines
  if (template.lines) {
    template.lines.forEach((line, index) => {
      if (!line.accountCode) {
        errors.push(`Line ${index + 1}: Account code is required`);
      }

      if (!line.description) {
        errors.push(`Line ${index + 1}: Description is required`);
      }

      if (!line.debitFormula && !line.creditFormula) {
        errors.push(`Line ${index + 1}: Must have either debit or credit formula`);
      }

      if (line.debitFormula && line.creditFormula) {
        warnings.push(`Line ${index + 1}: Has both debit and credit formulas`);
      }

      // Validate formulas
      if (line.debitFormula) {
        try {
          parseFormula(line.debitFormula);
        } catch (error) {
          errors.push(`Line ${index + 1}: Invalid debit formula: ${line.debitFormula}`);
        }
      }

      if (line.creditFormula) {
        try {
          parseFormula(line.creditFormula);
        } catch (error) {
          errors.push(`Line ${index + 1}: Invalid credit formula: ${line.creditFormula}`);
        }
      }
    });
  }

  // Validate template balance
  if (template.lines && template.lines.length > 0) {
    const testContext: BusinessContext = {
      date: new Date(),
      amount: 1000,
      currency: 'MYR',
      reference: 'TEST',
      description: 'Test',
    };

    try {
      const testEntry = applyTemplate(template, testContext);
      const totalDebits = testEntry.totalDebits;
      const totalCredits = testEntry.totalCredits;
      const difference = Math.abs(totalDebits - totalCredits);
      const tolerance = 0.01; // 1 cent tolerance

      if (difference > tolerance) {
        errors.push(`Template is not balanced. Difference: ${difference}`);
      }
    } catch (error) {
      errors.push(`Template validation failed: ${error}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Apply a template to business context to generate a journal entry
 */
export function applyTemplate(
  template: PostingTemplate,
  context: BusinessContext
): JournalEntry {
  if (!template) {
    throw new Error('Posting template is required');
  }

  if (!context) {
    throw new Error('Business context is required');
  }

  const lines: JournalLine[] = [];

  for (const templateLine of template.lines) {
    // Check line conditions
    if (templateLine.conditions && !evaluateLineConditions(templateLine.conditions, context)) {
      continue; // Skip this line
    }

    // Calculate amounts using formulas
    const debitAmount = templateLine.debitFormula
      ? evaluateFormula(templateLine.debitFormula, context)
      : 0;

    const creditAmount = templateLine.creditFormula
      ? evaluateFormula(templateLine.creditFormula, context)
      : 0;

    // Round amounts to currency precision
    const roundedDebit = roundToCurrency(debitAmount, context.currency);
    const roundedCredit = roundToCurrency(creditAmount, context.currency);

    // Skip zero-amount lines
    if (roundedDebit === 0 && roundedCredit === 0) {
      continue;
    }

    const line: JournalLine = {
      id: `${template.id}-${lines.length}`,
      accountCode: templateLine.accountCode,
      description: templateLine.description,
      debit: roundedDebit,
      credit: roundedCredit,
      currency: context.currency,
    };

    lines.push(line);
  }

  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  const entry: JournalEntry = {
    id: `JE-${Date.now()}`,
    date: context.date,
    reference: context.reference,
    description: context.description,
    lines,
    totalDebits: roundToCurrency(totalDebits, context.currency),
    totalCredits: roundToCurrency(totalCredits, context.currency),
    currency: context.currency,
    status: 'draft',
  };

  return entry;
}

// ============================================================================
// BUSINESS INTENT MAPPING
// ============================================================================

/**
 * Map business intent to applicable posting rules
 */
export function mapIntentToRule(intent: BusinessIntent): PostingRule[] {
  if (!intent) {
    throw new Error('Business intent is required');
  }

  // This would typically query a rule repository
  // For now, return empty array as placeholder
  return [];
}

/**
 * Find posting rules by business intent
 */
export function findRulesByIntent(intent: BusinessIntent): PostingRule[] {
  if (!intent) {
    throw new Error('Business intent is required');
  }

  // This would typically query a rule repository
  // For now, return empty array as placeholder
  return [];
}

// ============================================================================
// FORMULA EVALUATION
// ============================================================================

/**
 * Parse and validate a formula string
 */
function parseFormula(formula: string): void {
  if (!formula || typeof formula !== 'string') {
    throw new Error('Formula must be a non-empty string');
  }

  // Basic validation - check for common formula patterns
  const validPatterns = [
    /^amount$/i,
    /^amount\s*[\+\-\*\/]\s*\d+(\.\d+)?$/i,
    /^amount\s*\*\s*\d+(\.\d+)?$/i,
    /^amount\s*\/\s*\d+(\.\d+)?$/i,
    /^amount\s*\+\s*\d+(\.\d+)?$/i,
    /^amount\s*\-\s*\d+(\.\d+)?$/i,
    /^\d+(\.\d+)?$/,
    /^0$/,
  ];

  const isValid = validPatterns.some(pattern => pattern.test(formula.trim()));
  if (!isValid) {
    throw new Error(`Invalid formula pattern: ${formula}`);
  }
}

/**
 * Evaluate a formula against business context
 */
function evaluateFormula(formula: string, context: BusinessContext): number {
  if (!formula || typeof formula !== 'string') {
    return 0;
  }

  const trimmedFormula = formula.trim().toLowerCase();

  // Handle simple amount reference
  if (trimmedFormula === 'amount') {
    return context.amount || 0;
  }

  // Handle zero
  if (trimmedFormula === '0') {
    return 0;
  }

  // Handle simple number
  const numberMatch = trimmedFormula.match(/^\d+(\.\d+)?$/);
  if (numberMatch) {
    return parseFloat(numberMatch[0]);
  }

  // Handle amount with operations
  const amountOpMatch = trimmedFormula.match(/^amount\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)$/);
  if (amountOpMatch) {
    const operator = amountOpMatch[1]!;
    const value = parseFloat(amountOpMatch[2]!);
    const amount = context.amount || 0;

    switch (operator) {
      case '+':
        return amount + value;
      case '-':
        return amount - value;
      case '*':
        return amount * value;
      case '/':
        return value !== 0 ? amount / value : 0;
      default:
        return amount;
    }
  }

  // Handle percentage calculations
  const percentageMatch = trimmedFormula.match(/^amount\s*\*\s*(\d+(?:\.\d+)?)\s*\/\s*100$/);
  if (percentageMatch) {
    const percentage = parseFloat(percentageMatch[1]!);
    const amount = context.amount || 0;
    return (amount * percentage) / 100;
  }

  // Default to 0 for unrecognized formulas
  return 0;
}

// ============================================================================
// CONDITION EVALUATION
// ============================================================================

/**
 * Evaluate rule conditions against business context
 */
function evaluateConditions(conditions: RuleCondition[], context: BusinessContext): boolean {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions means always match
  }

  return conditions.every(condition => evaluateCondition(condition, context));
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(condition: RuleCondition, context: BusinessContext): boolean {
  const fieldValue = getFieldValue(context, condition.field);

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'greater_than':
      return typeof fieldValue === 'number' && fieldValue > condition.value;
    case 'less_than':
      return typeof fieldValue === 'number' && fieldValue < condition.value;
    case 'contains':
      return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    default:
      return false;
  }
}

/**
 * Evaluate line conditions
 */
function evaluateLineConditions(conditions: LineCondition[], context: BusinessContext): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every(condition => {
    const fieldValue = getFieldValue(context, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return typeof fieldValue === 'number' && fieldValue > condition.value;
      case 'less_than':
        return typeof fieldValue === 'number' && fieldValue < condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  });
}

/**
 * Get field value from context using dot notation
 */
function getFieldValue(context: BusinessContext, field: string): any {
  if (!field) {
    return undefined;
  }

  const parts = field.split('.');
  let value: any = context;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a simple invoice posting template
 */
export function createInvoiceTemplate(): PostingTemplate {
  return createPostingTemplate('Invoice Posted', [
    {
      accountCode: 'ACCOUNTS_RECEIVABLE',
      description: 'Customer receivable',
      debitFormula: 'amount',
      creditFormula: '',
    },
    {
      accountCode: 'SALES_REVENUE',
      description: 'Sales revenue',
      debitFormula: '',
      creditFormula: 'amount',
    },
  ]);
}

/**
 * Create a simple payment received template
 */
export function createPaymentTemplate(): PostingTemplate {
  return createPostingTemplate('Payment Received', [
    {
      accountCode: 'CASH',
      description: 'Cash received',
      debitFormula: 'amount',
      creditFormula: '',
    },
    {
      accountCode: 'ACCOUNTS_RECEIVABLE',
      description: 'Customer receivable',
      debitFormula: '',
      creditFormula: 'amount',
    },
  ]);
}

/**
 * Create a simple expense template
 */
export function createExpenseTemplate(): PostingTemplate {
  return createPostingTemplate('Expense Incurred', [
    {
      accountCode: 'EXPENSE',
      description: 'Business expense',
      debitFormula: 'amount',
      creditFormula: '',
    },
    {
      accountCode: 'ACCOUNTS_PAYABLE',
      description: 'Vendor payable',
      debitFormula: '',
      creditFormula: 'amount',
    },
  ]);
}

/**
 * Create a simple asset purchase template
 */
export function createAssetPurchaseTemplate(): PostingTemplate {
  return createPostingTemplate('Asset Purchased', [
    {
      accountCode: 'FIXED_ASSETS',
      description: 'Fixed asset',
      debitFormula: 'amount',
      creditFormula: '',
    },
    {
      accountCode: 'CASH',
      description: 'Cash paid',
      debitFormula: '',
      creditFormula: 'amount',
    },
  ]);
}
