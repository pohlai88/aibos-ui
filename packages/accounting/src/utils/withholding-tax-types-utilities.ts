/**
 * Withholding Tax Types - SSOT Implementation
 * 
 * Centralized type definitions for withholding tax operations.
 * Imports from core-types.ts and shared-operators.ts for consistency.
 */

import type { SupportedCurrency } from './accounting-utilities';
import type { FiscalPeriod } from './fiscal-period-utilities';
import type { ConditionOperator, LogicalOperator } from './shared-operators-utilities';

// ============================================================================
// WITHHOLDING TAX TYPES
// ============================================================================

export type WithholdingTaxType = 
  | 'INCOME_TAX'
  | 'SERVICE_TAX'
  | 'PROFESSIONAL_TAX'
  | 'CONTRACTOR_TAX'
  | 'ROYALTY_TAX'
  | 'DIVIDEND_TAX'
  | 'INTEREST_TAX'
  | 'RENTAL_TAX';

export type GrossUpMethod = 
  | 'STANDARD'
  | 'REVERSE'
  | 'COMPOUND'
  | 'SIMPLE';

export type PayableStatus = 
  | 'PENDING'
  | 'DUE'
  | 'OVERDUE'
  | 'PAID'
  | 'CANCELLED';

export type VendorType = 
  | 'INDIVIDUAL'
  | 'COMPANY'
  | 'PARTNERSHIP'
  | 'TRUST'
  | 'GOVERNMENT'
  | 'NON_PROFIT';

// ============================================================================
// WITHHOLDING TAX INTERFACES
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
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export interface GrossUpOptions {
  method?: GrossUpMethod;
  precision?: number;
  includeBreakdown?: boolean;
  /** Optional soft opt-in currency override (non-breaking duck type) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currency?: SupportedCurrency | (any & {});
}

export interface WithholdingOptions {
  rule?: WithholdingTaxRule;
  jurisdiction?: string;
  precision?: number;
  includeBreakdown?: boolean;
  /** Optional soft opt-in currency override (non-breaking duck type) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currency?: SupportedCurrency | (any & {});
}

// ============================================================================
// WITHHOLDING TAX CALCULATION INTERFACES
// ============================================================================

export interface WithholdingCalculation {
  grossAmount: number;
  netAmount: number;
  withholdingTax: number;
  withholdingRate: number;
  calculationMethod: string;
  applicableRule: WithholdingTaxRule;
  jurisdiction: string;
  currency: SupportedCurrency;
  calculationDate: Date;
}

export interface WithholdingBreakdown {
  grossAmount: number;
  withholdingTax: number;
  netAmount: number;
  withholdingRate: number;
  grossUpFactor: number;
  calculationMethod: GrossUpMethod;
  applicableRule: WithholdingTaxRule;
  jurisdiction: string;
  currency: SupportedCurrency;
  calculationDate: Date;
  breakdown: {
    baseAmount: number;
    taxAmount: number;
    grossUpAmount: number;
    finalAmount: number;
  };
}

// ============================================================================
// WITHHOLDING TAX VALIDATION INTERFACES
// ============================================================================

export interface WithholdingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  applicableRules: WithholdingTaxRule[];
  recommendedRule?: WithholdingTaxRule;
  validationDate: Date;
}

export interface WithholdingRuleValidation {
  rule: WithholdingTaxRule;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validationDate: Date;
}

// ============================================================================
// WITHHOLDING TAX REPORTING INTERFACES
// ============================================================================

export interface WithholdingReport {
  id: string;
  title: string;
  period: {
    start: Date;
    end: Date;
  };
  jurisdiction: string;
  totalWithholding: number;
  currency: SupportedCurrency;
  transactionCount: number;
  generatedAt: Date;
  generatedBy: string;
}

export interface WithholdingSummary {
  jurisdiction: string;
  taxType: WithholdingTaxType;
  totalGrossAmount: number;
  totalWithholding: number;
  totalNetAmount: number;
  transactionCount: number;
  currency: SupportedCurrency;
  period: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// WITHHOLDING TAX CONFIGURATION INTERFACES
// ============================================================================

export interface WithholdingConfiguration {
  id: string;
  name: string;
  description: string;
  jurisdiction: string;
  defaultTaxType: WithholdingTaxType;
  defaultRate: number;
  minimumAmount: number;
  maximumAmount: number;
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  rules: WithholdingTaxRule[];
}

export interface WithholdingPolicy {
  id: string;
  name: string;
  description: string;
  jurisdiction: string;
  taxTypes: WithholdingTaxType[];
  defaultRates: Record<WithholdingTaxType, number>;
  minimumAmounts: Record<WithholdingTaxType, number>;
  maximumAmounts: Record<WithholdingTaxType, number>;
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}
