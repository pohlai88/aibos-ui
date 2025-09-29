/**
 * Withholding Tax Validation - SSOT Implementation
 * 
 * Validation logic for withholding tax operations.
 * Imports from withholding-tax-types.ts and policies/validation-policy.ts for consistency.
 */

import type { 
  WithholdingTaxRule,
  WithholdingValidationResult,
  WithholdingRuleValidation,
  WithholdingTransaction,
  WithholdingPayable,
  TaxCondition
} from './withholding-tax-types-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import { createValidationIssue, createBusinessValidationResult } from './policies/validation-policy';
import { isValidDate } from './date-utilities';

// ============================================================================
// WITHHOLDING TAX VALIDATOR
// ============================================================================

export class WithholdingTaxValidator {
  /**
   * Validate withholding tax rule
   */
  static validateRule(rule: WithholdingTaxRule): WithholdingRuleValidation {
    const issues: ValidationIssue[] = [];
    
    // Validate rule ID
    if (!rule.id || rule.id.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_RULE_ID',
        'Rule ID is required',
        'error',
        'id',
        rule.id
      ));
    }
    
    // Validate jurisdiction
    if (!rule.jurisdiction || rule.jurisdiction.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_JURISDICTION',
        'Jurisdiction is required',
        'error',
        'jurisdiction',
        rule.jurisdiction
      ));
    }
    
    // Validate tax type
    if (!rule.taxType || !this.isValidTaxType(rule.taxType)) {
      issues.push(createValidationIssue(
        'INVALID_TAX_TYPE',
        'Invalid tax type',
        'error',
        'taxType',
        rule.taxType
      ));
    }
    
    // Validate rate
    if (rule.rate < 0 || rule.rate > 1) {
      issues.push(createValidationIssue(
        'INVALID_RATE',
        'Tax rate must be between 0 and 1',
        'error',
        'rate',
        rule.rate
      ));
    }
    
    // Validate minimum amount
    if (rule.minimumAmount < 0) {
      issues.push(createValidationIssue(
        'INVALID_MINIMUM_AMOUNT',
        'Minimum amount must be positive',
        'error',
        'minimumAmount',
        rule.minimumAmount
      ));
    }
    
    // Validate maximum amount
    if (rule.maximumAmount < rule.minimumAmount) {
      issues.push(createValidationIssue(
        'INVALID_MAXIMUM_AMOUNT',
        'Maximum amount must be greater than minimum amount',
        'error',
        'maximumAmount',
        rule.maximumAmount
      ));
    }
    
    // Validate effective date
    if (!rule.effectiveDate || !isValidDate(rule.effectiveDate)) {
      issues.push(createValidationIssue(
        'INVALID_EFFECTIVE_DATE',
        'Effective date must be valid',
        'error',
        'effectiveDate',
        rule.effectiveDate
      ));
    }
    
    // Validate expiry date
    if (rule.expiryDate && !isValidDate(rule.expiryDate)) {
      issues.push(createValidationIssue(
        'INVALID_EXPIRY_DATE',
        'Expiry date must be valid',
        'error',
        'expiryDate',
        rule.expiryDate
      ));
    }
    
    // Validate expiry date is after effective date
    if (rule.expiryDate && rule.effectiveDate && rule.expiryDate <= rule.effectiveDate) {
      issues.push(createValidationIssue(
        'INVALID_DATE_RANGE',
        'Expiry date must be after effective date',
        'error',
        'expiryDate',
        rule.expiryDate
      ));
    }
    
    // Validate conditions
    if (rule.conditions && rule.conditions.length > 0) {
      const conditionIssues = this.validateConditions(rule.conditions);
      issues.push(...conditionIssues);
    }
    
    const errors = issues.filter(issue => issue.severity === 'error');
    const warnings = issues.filter(issue => issue.severity === 'warning');
    
    return {
      rule,
      isValid: errors.length === 0,
      errors: errors.map(issue => issue.message),
      warnings: warnings.map(issue => issue.message),
      validationDate: new Date()
    };
  }

  /**
   * Validate withholding tax transaction
   */
  static validateTransaction(transaction: WithholdingTransaction): BusinessValidationResult {
    const issues: ValidationIssue[] = [];
    
    // Validate transaction ID
    if (!transaction.id || transaction.id.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_TRANSACTION_ID',
        'Transaction ID is required',
        'error',
        'id',
        transaction.id
      ));
    }
    
    // Validate vendor
    if (!transaction.vendor || transaction.vendor.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_VENDOR',
        'Vendor is required',
        'error',
        'vendor',
        transaction.vendor
      ));
    }
    
    // Validate amount
    if (transaction.amount < 0) {
      issues.push(createValidationIssue(
        'NEGATIVE_AMOUNT',
        'Transaction amount must be positive',
        'error',
        'amount',
        transaction.amount
      ));
    }
    
    // Validate currency
    if (!transaction.currency || transaction.currency.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_CURRENCY',
        'Currency is required',
        'error',
        'currency',
        transaction.currency
      ));
    }
    
    // Validate transaction date
    if (!transaction.transactionDate || !isValidDate(transaction.transactionDate)) {
      issues.push(createValidationIssue(
        'INVALID_TRANSACTION_DATE',
        'Transaction date must be valid',
        'error',
        'transactionDate',
        transaction.transactionDate
      ));
    }
    
    // Validate jurisdiction
    if (!transaction.jurisdiction || transaction.jurisdiction.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_JURISDICTION',
        'Jurisdiction is required',
        'error',
        'jurisdiction',
        transaction.jurisdiction
      ));
    }
    
    // Validate tax type
    if (!transaction.taxType || !this.isValidTaxType(transaction.taxType)) {
      issues.push(createValidationIssue(
        'INVALID_TAX_TYPE',
        'Invalid tax type',
        'error',
        'taxType',
        transaction.taxType
      ));
    }
    
    // Validate vendor type
    if (!transaction.vendorType || !this.isValidVendorType(transaction.vendorType)) {
      issues.push(createValidationIssue(
        'INVALID_VENDOR_TYPE',
        'Invalid vendor type',
        'error',
        'vendorType',
        transaction.vendorType
      ));
    }
    
    return createBusinessValidationResult(issues.length === 0, issues);
  }

  /**
   * Validate withholding tax payable
   */
  static validatePayable(payable: WithholdingPayable): BusinessValidationResult {
    const issues: ValidationIssue[] = [];
    
    // Validate payable ID
    if (!payable.id || payable.id.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_PAYABLE_ID',
        'Payable ID is required',
        'error',
        'id',
        payable.id
      ));
    }
    
    // Validate vendor
    if (!payable.vendor || payable.vendor.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_VENDOR',
        'Vendor is required',
        'error',
        'vendor',
        payable.vendor
      ));
    }
    
    // Validate period
    if (!payable.period) {
      issues.push(createValidationIssue(
        'MISSING_PERIOD',
        'Period is required',
        'error',
        'period',
        payable.period
      ));
    }
    
    // Validate total withholding
    if (payable.totalWithholding < 0) {
      issues.push(createValidationIssue(
        'NEGATIVE_WITHHOLDING',
        'Total withholding must be positive',
        'error',
        'totalWithholding',
        payable.totalWithholding
      ));
    }
    
    // Validate currency
    if (!payable.currency || payable.currency.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_CURRENCY',
        'Currency is required',
        'error',
        'currency',
        payable.currency
      ));
    }
    
    // Validate status
    if (!payable.status || !this.isValidPayableStatus(payable.status)) {
      issues.push(createValidationIssue(
        'INVALID_STATUS',
        'Invalid payable status',
        'error',
        'status',
        payable.status
      ));
    }
    
    // Validate due date
    if (!payable.dueDate || !isValidDate(payable.dueDate)) {
      issues.push(createValidationIssue(
        'INVALID_DUE_DATE',
        'Due date must be valid',
        'error',
        'dueDate',
        payable.dueDate
      ));
    }
    
    // Validate paid date
    if (payable.paidDate && !isValidDate(payable.paidDate)) {
      issues.push(createValidationIssue(
        'INVALID_PAID_DATE',
        'Paid date must be valid',
        'error',
        'paidDate',
        payable.paidDate
      ));
    }
    
    // Validate paid date is after due date
    if (payable.paidDate && payable.dueDate && payable.paidDate < payable.dueDate) {
      issues.push(createValidationIssue(
        'INVALID_PAID_DATE_RANGE',
        'Paid date cannot be before due date',
        'warning',
        'paidDate',
        payable.paidDate
      ));
    }
    
    return createBusinessValidationResult(issues.length === 0, issues);
  }

  /**
   * Validate withholding tax calculation
   */
  static validateCalculation(
    grossAmount: number,
    rule: WithholdingTaxRule,
    vendorType: string
  ): WithholdingValidationResult {
    const issues: ValidationIssue[] = [];
    const applicableRules: WithholdingTaxRule[] = [];
    
    // Validate gross amount
    if (grossAmount < 0) {
      issues.push(createValidationIssue(
        'NEGATIVE_AMOUNT',
        'Gross amount must be positive',
        'error',
        'grossAmount',
        grossAmount
      ));
    }
    
    // Validate rule
    const ruleValidation = this.validateRule(rule);
    if (!ruleValidation.isValid) {
      issues.push(...ruleValidation.errors.map(error => 
        createValidationIssue('RULE_VALIDATION_ERROR', error, 'error')
      ));
    }
    
    // Check if amount is within rule limits
    if (grossAmount < rule.minimumAmount) {
      issues.push(createValidationIssue(
        'AMOUNT_BELOW_MINIMUM',
        `Amount ${grossAmount} is below minimum ${rule.minimumAmount}`,
        'error',
        'grossAmount',
        grossAmount
      ));
    }
    
    if (grossAmount > rule.maximumAmount) {
      issues.push(createValidationIssue(
        'AMOUNT_ABOVE_MAXIMUM',
        `Amount ${grossAmount} is above maximum ${rule.maximumAmount}`,
        'error',
        'grossAmount',
        grossAmount
      ));
    }
    
    // Check if rule is applicable
    if (rule.active && this.isRuleApplicable(rule, grossAmount, vendorType)) {
      applicableRules.push(rule);
    }
    
    const errors = issues.filter(issue => issue.severity === 'error');
    const warnings = issues.filter(issue => issue.severity === 'warning');
    
    return {
      isValid: errors.length === 0,
      errors: errors.map(issue => issue.message),
      warnings: warnings.map(issue => issue.message),
      applicableRules,
      ...(applicableRules.length > 0 && { recommendedRule: applicableRules[0] }),
      validationDate: new Date()
    };
  }

  /**
   * Validate conditions
   */
  private static validateConditions(conditions: TaxCondition[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    conditions.forEach((condition, index) => {
      if (!condition.field || condition.field.trim().length === 0) {
        issues.push(createValidationIssue(
          'MISSING_CONDITION_FIELD',
          `Condition ${index + 1}: Field is required`,
          'error',
          `conditions[${index}].field`,
          condition.field
        ));
      }
      
      if (!condition.operator || !this.isValidOperator(condition.operator)) {
        issues.push(createValidationIssue(
          'INVALID_CONDITION_OPERATOR',
          `Condition ${index + 1}: Invalid operator`,
          'error',
          `conditions[${index}].operator`,
          condition.operator
        ));
      }
      
      if (condition.value === undefined || condition.value === null) {
        issues.push(createValidationIssue(
          'MISSING_CONDITION_VALUE',
          `Condition ${index + 1}: Value is required`,
          'error',
          `conditions[${index}].value`,
          condition.value
        ));
      }
    });
    
    return issues;
  }

  /**
   * Check if rule is applicable
   */
  private static isRuleApplicable(
    rule: WithholdingTaxRule,
    amount: number,
    vendorType: string
  ): boolean {
    if (!rule.active) return false;
    if (amount < rule.minimumAmount || amount > rule.maximumAmount) return false;
    
    // Check conditions
    if (rule.conditions && rule.conditions.length > 0) {
      return rule.conditions.every(condition => {
        if (condition.field === 'vendorType') {
          return condition.value === vendorType;
        }
        return true;
      });
    }
    
    return true;
  }

  /**
   * Validate tax type
   */
  private static isValidTaxType(taxType: string): boolean {
    const validTypes = [
      'INCOME_TAX',
      'SERVICE_TAX',
      'PROFESSIONAL_TAX',
      'CONTRACTOR_TAX',
      'ROYALTY_TAX',
      'DIVIDEND_TAX',
      'INTEREST_TAX',
      'RENTAL_TAX'
    ];
    return validTypes.includes(taxType);
  }

  /**
   * Validate vendor type
   */
  private static isValidVendorType(vendorType: string): boolean {
    const validTypes = [
      'INDIVIDUAL',
      'COMPANY',
      'PARTNERSHIP',
      'TRUST',
      'GOVERNMENT',
      'NON_PROFIT'
    ];
    return validTypes.includes(vendorType);
  }

  /**
   * Validate payable status
   */
  private static isValidPayableStatus(status: string): boolean {
    const validStatuses = [
      'PENDING',
      'DUE',
      'OVERDUE',
      'PAID',
      'CANCELLED'
    ];
    return validStatuses.includes(status);
  }

  /**
   * Validate operator
   */
  private static isValidOperator(operator: string): boolean {
    const validOperators = [
      'EQUALS',
      'NOT_EQUALS',
      'GREATER_THAN',
      'LESS_THAN',
      'GREATER_THAN_OR_EQUALS',
      'LESS_THAN_OR_EQUALS',
      'CONTAINS',
      'NOT_CONTAINS',
      'IN',
      'NOT_IN'
    ];
    return validOperators.includes(operator);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate withholding tax rule
 */
export function validateWithholdingTaxRule(rule: WithholdingTaxRule): WithholdingRuleValidation {
  return WithholdingTaxValidator.validateRule(rule);
}

/**
 * Validate withholding tax transaction
 */
export function validateWithholdingTransaction(transaction: WithholdingTransaction): BusinessValidationResult {
  return WithholdingTaxValidator.validateTransaction(transaction);
}

/**
 * Validate withholding tax payable
 */
export function validateWithholdingPayable(payable: WithholdingPayable): BusinessValidationResult {
  return WithholdingTaxValidator.validatePayable(payable);
}

/**
 * Validate withholding tax calculation
 */
export function validateWithholdingCalculation(
  grossAmount: number,
  rule: WithholdingTaxRule,
  vendorType: string
): WithholdingValidationResult {
  return WithholdingTaxValidator.validateCalculation(grossAmount, rule, vendorType);
}
