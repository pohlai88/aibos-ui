/**
 * Withholding Tax Utilities
 * 
 * Withholding tax base definition, gross-up helpers, and separate payable mapping.
 * Provides comprehensive withholding tax rule management and calculation operations.
 * 
 * @fileoverview Withholding tax rules, gross-up calculations, and payable mapping
 */

import {
  SupportedCurrency,
  roundToCurrency,
} from './accounting-utilities';
import { formatDate, isValidDate, addDaysFns } from './date-utilities';
import { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import { FiscalPeriod } from './fiscal-period-utilities';
import type { ConditionOperator, LogicalOperator } from './shared-operators';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface WithholdingTaxRule {
  id: string;
  jurisdiction: string;
  taxType: WithholdingTaxType;
  rate: number;
  minimumAmount: number;
  maximumAmount: number;
  conditions: TaxCondition[];
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface GrossUpResult {
  netAmount: number;
  withholdingTax: number;
  grossAmount: number;
  withholdingRate: number;
  grossUpFactor: number;
  calculationMethod: GrossUpMethod;
}

export interface WithholdingResult {
  grossAmount: number;
  withholdingTax: number;
  netAmount: number;
  withholdingRate: number;
  applicableRule: WithholdingTaxRule;
  jurisdiction: string;
}

export interface WithholdingPayable {
  id: string;
  vendor: string;
  period: FiscalPeriod;
  totalWithholding: number;
  currency: SupportedCurrency;
  status: PayableStatus;
  dueDate: Date;
  paidDate?: Date;
}

export interface WithholdingTransaction {
  id: string;
  vendor: string;
  amount: number;
  currency: SupportedCurrency;
  transactionDate: Date;
  jurisdiction: string;
  taxType: WithholdingTaxType;
  vendorType: VendorType;
}

export interface TaxCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

export interface GrossUpOptions {
  method?: GrossUpMethod;
  precision?: number;
  includeBreakdown?: boolean;
}

export interface WithholdingOptions {
  rule?: WithholdingTaxRule;
  jurisdiction?: string;
  precision?: number;
  includeBreakdown?: boolean;
}

export interface PayableMapping {
  id: string;
  withholding: WithholdingTax;
  payableAccount: string;
  vendor: string;
  period: FiscalPeriod;
  amount: number;
  currency: SupportedCurrency;
  status: PayableStatus;
  createdDate: Date;
}

export interface WithholdingTax {
  id: string;
  transaction: WithholdingTransaction;
  rule: WithholdingTaxRule;
  grossAmount: number;
  withholdingTax: number;
  netAmount: number;
  rate: number;
  jurisdiction: string;
  calculatedDate: Date;
}

export type WithholdingTaxType = 'income_tax' | 'vat' | 'gst' | 'service_tax' | 'royalty';
export type GrossUpMethod = 'simple' | 'compound' | 'reverse';
export type PayableStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type VendorType = 'individual' | 'corporation' | 'partnership' | 'trust' | 'government';

// ============================================================================
// Rule Storage and Management
// ============================================================================

// In-memory storage for withholding tax rules
const withholdingTaxRules = new Map<string, WithholdingTaxRule[]>();

/**
 * Define withholding tax rule
 */
export function defineWithholdingTaxRule(
  jurisdiction: string,
  taxType: WithholdingTaxType,
  rate: number,
  conditions: TaxCondition[]
): WithholdingTaxRule {
  const rule: WithholdingTaxRule = {
    id: `WHT-${jurisdiction}-${taxType}-${Date.now()}`,
    jurisdiction,
    taxType,
    rate,
    minimumAmount: 0,
    maximumAmount: Number.MAX_SAFE_INTEGER,
    conditions,
    active: true,
    effectiveDate: new Date(),
  };
  
  const validation = validateWithholdingTaxRule(rule);
  if (!validation.isValid) {
    throw new Error('Invalid withholding tax rule provided');
  }
  
  const existing = withholdingTaxRules.get(jurisdiction) || [];
  existing.push(rule);
  withholdingTaxRules.set(jurisdiction, existing);
  
  return rule;
}

/**
 * Validate withholding tax rule
 */
export function validateWithholdingTaxRule(rule: WithholdingTaxRule): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!rule.id) {
    issues.push({
      code: 'REQUIRED',
      path: 'id',
      message: 'Rule ID is required',
    });
  }
  
  if (!rule.jurisdiction) {
    issues.push({
      code: 'REQUIRED',
      path: 'jurisdiction',
      message: 'Jurisdiction is required',
    });
  }
  
  if (!rule.taxType) {
    issues.push({
      code: 'REQUIRED',
      path: 'taxType',
      message: 'Tax type is required',
    });
  }
  
  if (rule.rate < 0 || rule.rate > 1) {
    issues.push({
      code: 'RANGE',
      path: 'rate',
      message: 'Tax rate must be between 0 and 1',
    });
  }
  
  if (rule.minimumAmount < 0) {
    issues.push({
      code: 'RANGE',
      path: 'minimumAmount',
      message: 'Minimum amount cannot be negative',
    });
  }
  
  if (rule.maximumAmount < rule.minimumAmount) {
    issues.push({
      code: 'RANGE',
      path: 'maximumAmount',
      message: 'Maximum amount must be greater than minimum amount',
    });
  }
  
  if (!isValidDate(rule.effectiveDate)) {
    issues.push({
      code: 'FORMAT',
      path: 'effectiveDate',
      message: 'Effective date must be valid',
    });
  }
  
  if (rule.expiryDate && !isValidDate(rule.expiryDate)) {
    issues.push({
      code: 'FORMAT',
      path: 'expiryDate',
      message: 'Expiry date must be valid',
    });
  }
  
  if (rule.expiryDate && rule.expiryDate < rule.effectiveDate) {
    issues.push({
      code: 'RANGE',
      path: 'expiryDate',
      message: 'Expiry date cannot be before effective date',
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.map(issue => issue.message),
    warnings: [],
    issues,
  };
}

/**
 * Find applicable rules
 */
export function findApplicableRule(
  transaction: WithholdingTransaction,
  jurisdiction: string
): WithholdingTaxRule[] {
  const rules = withholdingTaxRules.get(jurisdiction) || [];
  
  return rules.filter(rule => {
    if (!rule.active) return false;
    if (transaction.transactionDate > rule.effectiveDate) return false;
    if (rule.expiryDate && transaction.transactionDate < rule.expiryDate) return false;
    if (rule.taxType !== transaction.taxType) return false;
    if (transaction.amount < rule.minimumAmount) return false;
    if (transaction.amount > rule.maximumAmount) return false;
    
    // Check conditions
    for (const condition of rule.conditions) {
      if (!validateTaxCondition(condition, transaction)) return false;
    }
    
    return true;
  });
}

// ============================================================================
// Gross-Up Calculations
// ============================================================================

/**
 * Calculate gross-up
 */
export function calculateGrossUp(
  netAmount: number,
  withholdingRate: number,
  options?: GrossUpOptions
): GrossUpResult {
  if (netAmount < 0) {
    throw new Error('Net amount cannot be negative');
  }
  
  if (withholdingRate < 0 || withholdingRate > 1) {
    throw new Error('Withholding rate must be between 0 and 1');
  }
  
  const method = options?.method || 'simple';
  
  let grossAmount: number;
  let withholdingTax: number;
  let grossUpFactor: number;
  
  switch (method) {
    case 'simple':
      grossUpFactor = 1 / (1 - withholdingRate);
      grossAmount = roundToCurrency(netAmount * grossUpFactor, 'USD');
      withholdingTax = roundToCurrency(grossAmount - netAmount, 'USD');
      break;
      
    case 'compound':
      // Compound gross-up calculation
      grossUpFactor = 1 / (1 - withholdingRate);
      grossAmount = roundToCurrency(netAmount * grossUpFactor, 'USD');
      withholdingTax = roundToCurrency(grossAmount * withholdingRate, 'USD');
      break;
      
    case 'reverse':
      // Reverse calculation
      grossAmount = roundToCurrency(netAmount / (1 - withholdingRate), 'USD');
      withholdingTax = roundToCurrency(grossAmount * withholdingRate, 'USD');
      grossUpFactor = grossAmount / netAmount;
      break;
      
    default:
      throw new Error(`Unsupported gross-up method: ${method}`);
  }
  
  return {
    netAmount,
    withholdingTax,
    grossAmount,
    withholdingRate,
    grossUpFactor,
    calculationMethod: method,
  };
}

/**
 * Calculate withholding tax
 */
export function calculateWithholdingTax(
  grossAmount: number,
  withholdingRate: number,
  options?: WithholdingOptions
): WithholdingResult {
  if (grossAmount < 0) {
    throw new Error('Gross amount cannot be negative');
  }
  
  if (withholdingRate < 0 || withholdingRate > 1) {
    throw new Error('Withholding rate must be between 0 and 1');
  }
  
  const withholdingTax = roundToCurrency(grossAmount * withholdingRate, 'USD');
  const netAmount = roundToCurrency(grossAmount - withholdingTax, 'USD');
  
  return {
    grossAmount,
    withholdingTax,
    netAmount,
    withholdingRate,
    applicableRule: options?.rule || {
      id: 'DEFAULT',
      jurisdiction: options?.jurisdiction || 'DEFAULT',
      taxType: 'income_tax',
      rate: withholdingRate,
      minimumAmount: 0,
      maximumAmount: Number.MAX_SAFE_INTEGER,
      conditions: [],
      active: true,
      effectiveDate: new Date(),
    },
    jurisdiction: options?.jurisdiction || 'DEFAULT',
  };
}

/**
 * Validate gross-up calculation
 */
export function validateGrossUpCalculation(result: GrossUpResult): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (result.netAmount < 0) {
    issues.push({
      code: 'RANGE',
      path: 'netAmount',
      message: 'Net amount cannot be negative',
    });
  }
  
  if (result.withholdingTax < 0) {
    issues.push({
      code: 'RANGE',
      path: 'withholdingTax',
      message: 'Withholding tax cannot be negative',
    });
  }
  
  if (result.grossAmount < 0) {
    issues.push({
      code: 'RANGE',
      path: 'grossAmount',
      message: 'Gross amount cannot be negative',
    });
  }
  
  if (result.withholdingRate < 0 || result.withholdingRate > 1) {
    issues.push({
      code: 'RANGE',
      path: 'withholdingRate',
      message: 'Withholding rate must be between 0 and 1',
    });
  }
  
  if (result.grossUpFactor < 1) {
    issues.push({
      code: 'RANGE',
      path: 'grossUpFactor',
      message: 'Gross-up factor must be greater than or equal to 1',
    });
  }
  
  // Validate calculation consistency
  const expectedGross = result.netAmount + result.withholdingTax;
  const tolerance = 0.01;
  if (Math.abs(result.grossAmount - expectedGross) > tolerance) {
    issues.push({
      code: 'CONSISTENCY',
      path: 'grossAmount',
      message: 'Gross amount does not equal net amount plus withholding tax',
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.map(issue => issue.message),
    warnings: [],
    issues,
  };
}

// ============================================================================
// Payable Mapping
// ============================================================================

/**
 * Map withholding payable
 */
export function mapWithholdingPayable(
  withholding: WithholdingTax,
  payableAccount: string
): PayableMapping {
  if (!payableAccount) {
    throw new Error('Payable account is required');
  }
  
  const mapping: PayableMapping = {
    id: `PAYABLE-${withholding.id}-${Date.now()}`,
    withholding,
    payableAccount,
    vendor: withholding.transaction.vendor,
    period: {
      id: `P-${formatDate(new Date())}`,
      year: new Date().getFullYear(),
      period: 1,
      name: formatDate(new Date()),
      startDate: new Date(),
      endDate: new Date(),
      status: { status: 'open' },
      backdateWindow: 30,
    },
    amount: withholding.withholdingTax,
    currency: withholding.transaction.currency,
    status: 'pending',
    createdDate: new Date(),
  };
  
  return mapping;
}

/**
 * Create withholding payable
 */
export function createWithholdingPayable(
  withholding: WithholdingTax,
  vendor: string,
  period: FiscalPeriod
): WithholdingPayable {
  if (!vendor) {
    throw new Error('Vendor is required');
  }
  
  const payable: WithholdingPayable = {
    id: `WHT-PAYABLE-${withholding.id}-${Date.now()}`,
    vendor,
    period,
    totalWithholding: withholding.withholdingTax,
    currency: withholding.transaction.currency,
    status: 'pending',
    dueDate: addDaysFns(new Date(), 30), // 30 days from now
  };
  
  return payable;
}

/**
 * Validate payable mapping
 */
export function validatePayableMapping(mapping: PayableMapping): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!mapping.id) {
    issues.push({
      code: 'REQUIRED',
      path: 'id',
      message: 'Mapping ID is required',
    });
  }
  
  if (!mapping.payableAccount) {
    issues.push({
      code: 'REQUIRED',
      path: 'payableAccount',
      message: 'Payable account is required',
    });
  }
  
  if (!mapping.vendor) {
    issues.push({
      code: 'REQUIRED',
      path: 'vendor',
      message: 'Vendor is required',
    });
  }
  
  if (!mapping.amount || mapping.amount <= 0) {
    issues.push({
      code: 'RANGE',
      path: 'amount',
      message: 'Amount must be greater than zero',
    });
  }
  
  if (!mapping.currency) {
    issues.push({
      code: 'REQUIRED',
      path: 'currency',
      message: 'Currency is required',
    });
  }
  
  if (!mapping.status || !['pending', 'paid', 'overdue', 'cancelled'].includes(mapping.status)) {
    issues.push({
      code: 'FORMAT',
      path: 'status',
      message: 'Invalid payable status',
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.map(issue => issue.message),
    warnings: [],
    issues,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate tax condition
 */
function validateTaxCondition(
  _condition: TaxCondition,
  _transaction: WithholdingTransaction
): boolean {
  // Simplified condition validation
  // In a real implementation, this would check transaction properties
  return true;
}

/**
 * Get withholding tax summary
 */
export function getWithholdingTaxSummary(
  transactions: WithholdingTransaction[],
  jurisdiction: string
): {
  totalTransactions: number;
  totalGrossAmount: number;
  totalWithholdingTax: number;
  totalNetAmount: number;
  averageRate: number;
  ruleCount: number;
} {
  const applicableRules = findApplicableRule(transactions[0] || {} as WithholdingTransaction, jurisdiction);
  
  let totalGrossAmount = 0;
  let totalWithholdingTax = 0;
  let totalNetAmount = 0;
  
  for (const transaction of transactions) {
    const rules = findApplicableRule(transaction, jurisdiction);
    if (rules.length > 0) {
      const rule = rules[0]!; // Use first applicable rule
      const grossAmount = transaction.amount;
      const withholdingTax = grossAmount * rule.rate;
      const netAmount = grossAmount - withholdingTax;
      
      totalGrossAmount += grossAmount;
      totalWithholdingTax += withholdingTax;
      totalNetAmount += netAmount;
    }
  }
  
  const averageRate = totalGrossAmount > 0 ? totalWithholdingTax / totalGrossAmount : 0;
  
  return {
    totalTransactions: transactions.length,
    totalGrossAmount,
    totalWithholdingTax,
    totalNetAmount,
    averageRate,
    ruleCount: applicableRules.length,
  };
}

/**
 * Clear withholding tax rules (for testing)
 */
export function clearWithholdingTaxRules(): void {
  withholdingTaxRules.clear();
}

/**
 * Get withholding tax statistics
 */
export function getWithholdingTaxStatistics(
  jurisdiction: string
): {
  totalRules: number;
  activeRules: number;
  inactiveRules: number;
  taxTypes: WithholdingTaxType[];
  averageRate: number;
  minRate: number;
  maxRate: number;
} {
  const rules = withholdingTaxRules.get(jurisdiction) || [];
  
  const activeRules = rules.filter(rule => rule.active);
  const inactiveRules = rules.filter(rule => !rule.active);
  
  const rates = rules.map(rule => rule.rate);
  const averageRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
  const minRate = rates.length > 0 ? Math.min(...rates) : 0;
  const maxRate = rates.length > 0 ? Math.max(...rates) : 0;
  
  const taxTypes = [...new Set(rules.map(rule => rule.taxType))];
  
  return {
    totalRules: rules.length,
    activeRules: activeRules.length,
    inactiveRules: inactiveRules.length,
    taxTypes,
    averageRate,
    minRate,
    maxRate,
  };
}
