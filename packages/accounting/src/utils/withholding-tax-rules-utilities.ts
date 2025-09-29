/**
 * Withholding Tax Rules - SSOT Implementation
 * 
 * Rule definitions and management for withholding tax operations.
 * Imports from withholding-tax-types.ts and shared-operators.ts for consistency.
 */

import type {
  WithholdingTaxRule,
  WithholdingTaxType,
  TaxCondition,
  WithholdingConfiguration,
  WithholdingPolicy
} from './withholding-tax-types-utilities';
import type { LogicalOperator } from './shared-operators-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import { createValidationIssue, createBusinessValidationResult } from './policies/validation-policy';

// ============================================================================
// DEFAULT WITHHOLDING TAX RULES
// ============================================================================

export const DEFAULT_WITHHOLDING_RULES: WithholdingTaxRule[] = [
  {
    id: 'WT001',
    jurisdiction: 'MY',
    taxType: 'INCOME_TAX',
    rate: 0.10,
    minimumAmount: 1000,
    maximumAmount: 100000,
    conditions: [
      {
        field: 'vendorType',
        operator: 'equals',
        value: 'INDIVIDUAL'
      }
    ],
    active: true,
    effectiveDate: new Date('2024-01-01')
  },
  {
    id: 'WT002',
    jurisdiction: 'MY',
    taxType: 'SERVICE_TAX',
    rate: 0.06,
    minimumAmount: 500,
    maximumAmount: 50000,
    conditions: [
      {
        field: 'vendorType',
        operator: 'equals',
        value: 'COMPANY'
      }
    ],
    active: true,
    effectiveDate: new Date('2024-01-01')
  },
  {
    id: 'WT003',
    jurisdiction: 'MY',
    taxType: 'PROFESSIONAL_TAX',
    rate: 0.08,
    minimumAmount: 2000,
    maximumAmount: 75000,
    conditions: [
      {
        field: 'vendorType',
        operator: 'equals',
        value: 'PARTNERSHIP'
      }
    ],
    active: true,
    effectiveDate: new Date('2024-01-01')
  }
];

// ============================================================================
// WITHHOLDING TAX CONFIGURATIONS
// ============================================================================

export const WITHHOLDING_CONFIGURATIONS: WithholdingConfiguration[] = [
  {
    id: 'CONFIG001',
    name: 'Malaysia Standard Configuration',
    description: 'Standard withholding tax configuration for Malaysia',
    jurisdiction: 'MY',
    defaultTaxType: 'INCOME_TAX',
    defaultRate: 0.10,
    minimumAmount: 1000,
    maximumAmount: 100000,
    active: true,
    effectiveDate: new Date('2024-01-01'),
    rules: DEFAULT_WITHHOLDING_RULES
  }
];

// ============================================================================
// WITHHOLDING TAX POLICIES
// ============================================================================

export const WITHHOLDING_POLICIES: WithholdingPolicy[] = [
  {
    id: 'POLICY001',
    name: 'Malaysia Withholding Tax Policy',
    description: 'Comprehensive withholding tax policy for Malaysia',
    jurisdiction: 'MY',
    taxTypes: ['INCOME_TAX', 'SERVICE_TAX', 'PROFESSIONAL_TAX'],
    defaultRates: {
      'INCOME_TAX': 0.10,
      'SERVICE_TAX': 0.06,
      'PROFESSIONAL_TAX': 0.08,
      'CONTRACTOR_TAX': 0.05,
      'ROYALTY_TAX': 0.15,
      'DIVIDEND_TAX': 0.25,
      'INTEREST_TAX': 0.15,
      'RENTAL_TAX': 0.10
    },
    minimumAmounts: {
      'INCOME_TAX': 1000,
      'SERVICE_TAX': 500,
      'PROFESSIONAL_TAX': 2000,
      'CONTRACTOR_TAX': 1000,
      'ROYALTY_TAX': 5000,
      'DIVIDEND_TAX': 1000,
      'INTEREST_TAX': 1000,
      'RENTAL_TAX': 1000
    },
    maximumAmounts: {
      'INCOME_TAX': 100000,
      'SERVICE_TAX': 50000,
      'PROFESSIONAL_TAX': 75000,
      'CONTRACTOR_TAX': 100000,
      'ROYALTY_TAX': 200000,
      'DIVIDEND_TAX': 500000,
      'INTEREST_TAX': 100000,
      'RENTAL_TAX': 100000
    },
    active: true,
    effectiveDate: new Date('2024-01-01')
  }
];

// ============================================================================
// WITHHOLDING TAX RULE MANAGER
// ============================================================================

export class WithholdingTaxRuleManager {
  private rules: Map<string, WithholdingTaxRule> = new Map();
  private configurations: Map<string, WithholdingConfiguration> = new Map();
  private policies: Map<string, WithholdingPolicy> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default rules
   */
  private initializeDefaultRules(): void {
    DEFAULT_WITHHOLDING_RULES.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    WITHHOLDING_CONFIGURATIONS.forEach(config => {
      this.configurations.set(config.id, config);
    });

    WITHHOLDING_POLICIES.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  /**
   * Get withholding tax rule by ID
   */
  getRule(ruleId: string): WithholdingTaxRule | null {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get withholding tax rules by jurisdiction
   */
  getRulesByJurisdiction(jurisdiction: string): WithholdingTaxRule[] {
    return Array.from(this.rules.values()).filter(rule => 
      rule.jurisdiction === jurisdiction && rule.active
    );
  }

  /**
   * Get withholding tax rules by tax type
   */
  getRulesByTaxType(taxType: WithholdingTaxType): WithholdingTaxRule[] {
    return Array.from(this.rules.values()).filter(rule => 
      rule.taxType === taxType && rule.active
    );
  }

  /**
   * Get applicable withholding tax rules
   */
  getApplicableRules(
    jurisdiction: string,
    taxType: WithholdingTaxType,
    amount: number,
    vendorType: string
  ): WithholdingTaxRule[] {
    return Array.from(this.rules.values()).filter(rule => {
      if (!rule.active) return false;
      if (rule.jurisdiction !== jurisdiction) return false;
      if (rule.taxType !== taxType) return false;
      if (amount < rule.minimumAmount || amount > rule.maximumAmount) return false;
      
      // Check conditions
      return this.evaluateConditions(rule.conditions, { vendorType, amount });
    });
  }

  /**
   * Add new withholding tax rule
   */
  addRule(rule: WithholdingTaxRule): boolean {
    if (this.rules.has(rule.id)) {
      return false;
    }
    
    this.rules.set(rule.id, rule);
    return true;
  }

  /**
   * Update existing withholding tax rule
   */
  updateRule(ruleId: string, updates: Partial<WithholdingTaxRule>): boolean {
    const existingRule = this.rules.get(ruleId);
    if (!existingRule) {
      return false;
    }
    
    const updatedRule = { ...existingRule, ...updates };
    this.rules.set(ruleId, updatedRule);
    return true;
  }

  /**
   * Delete withholding tax rule
   */
  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Validate withholding tax rule
   */
  validateRule(rule: WithholdingTaxRule): BusinessValidationResult {
    const issues: ValidationIssue[] = [];

    if (!rule.id || rule.id.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_RULE_ID',
        'Rule ID is required',
        'error',
        'id',
        rule.id
      ));
    }

    if (!rule.jurisdiction || rule.jurisdiction.trim().length === 0) {
      issues.push(createValidationIssue(
        'MISSING_JURISDICTION',
        'Jurisdiction is required',
        'error',
        'jurisdiction',
        rule.jurisdiction
      ));
    }

    if (rule.rate < 0 || rule.rate > 1) {
      issues.push(createValidationIssue(
        'INVALID_RATE',
        'Tax rate must be between 0 and 1',
        'error',
        'rate',
        rule.rate
      ));
    }

    if (rule.minimumAmount < 0) {
      issues.push(createValidationIssue(
        'INVALID_MINIMUM_AMOUNT',
        'Minimum amount must be positive',
        'error',
        'minimumAmount',
        rule.minimumAmount
      ));
    }

    if (rule.maximumAmount < rule.minimumAmount) {
      issues.push(createValidationIssue(
        'INVALID_MAXIMUM_AMOUNT',
        'Maximum amount must be greater than minimum amount',
        'error',
        'maximumAmount',
        rule.maximumAmount
      ));
    }

    if (!rule.effectiveDate || isNaN(rule.effectiveDate.getTime())) {
      issues.push(createValidationIssue(
        'INVALID_EFFECTIVE_DATE',
        'Effective date must be valid',
        'error',
        'effectiveDate',
        rule.effectiveDate
      ));
    }

    return createBusinessValidationResult(issues.length === 0, issues);
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateConditions(
    conditions: TaxCondition[],
    context: Record<string, unknown>
  ): boolean {
    if (conditions.length === 0) {
      return true;
    }

    let result = true;
    let logicalOperator: LogicalOperator = 'and';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context);
      
      if (logicalOperator === 'and') {
        result = result && conditionResult;
      } else if (logicalOperator === 'or') {
        result = result || conditionResult;
      }
      
      logicalOperator = condition.logicalOperator || 'and';
    }

    return result;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(
    condition: TaxCondition,
    context: Record<string, unknown>
  ): boolean {
    const fieldValue = context[condition.field];
    const operator = condition.operator;
    const expectedValue = condition.value;

    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'greater_than':
        return fieldValue > expectedValue;
      case 'less_than':
        return fieldValue < expectedValue;
      case 'contains':
        return String(fieldValue).includes(String(expectedValue));
      case 'starts_with':
        return String(fieldValue).startsWith(String(expectedValue));
      case 'ends_with':
        return String(fieldValue).endsWith(String(expectedValue));
      case 'between':
        return Array.isArray(expectedValue) && expectedValue.length === 2 && 
               fieldValue >= expectedValue[0] && fieldValue <= expectedValue[1];
      case 'regex':
        return new RegExp(String(expectedValue)).test(String(fieldValue));
      default:
        return false;
    }
  }

  /**
   * Get all rules
   */
  getAllRules(): WithholdingTaxRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get all configurations
   */
  getAllConfigurations(): WithholdingConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Get all policies
   */
  getAllPolicies(): WithholdingPolicy[] {
    return Array.from(this.policies.values());
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get withholding tax rule manager instance
 */
export function getWithholdingTaxRuleManager(): WithholdingTaxRuleManager {
  return new WithholdingTaxRuleManager();
}

/**
 * Get default withholding tax rules
 */
export function getDefaultWithholdingRules(): WithholdingTaxRule[] {
  return [...DEFAULT_WITHHOLDING_RULES];
}

/**
 * Get withholding tax rules by jurisdiction
 */
export function getWithholdingRulesByJurisdiction(jurisdiction: string): WithholdingTaxRule[] {
  return DEFAULT_WITHHOLDING_RULES.filter(rule => 
    rule.jurisdiction === jurisdiction && rule.active
  );
}

/**
 * Get withholding tax rules by tax type
 */
export function getWithholdingRulesByTaxType(taxType: WithholdingTaxType): WithholdingTaxRule[] {
  return DEFAULT_WITHHOLDING_RULES.filter(rule => 
    rule.taxType === taxType && rule.active
  );
}
