/**
 * Trial Balance Types - SSOT Implementation
 * 
 * Centralized type definitions for trial balance operations.
 * Imports from core-types.ts and accounting-utilities.ts for consistency.
 */

import { 
  type SupportedCurrency,
  type AccountType
} from './accounting-utilities';
import { 
  type DateRange
} from './date-utilities';
import { 
  type BaseAccount
} from './core-types-utilities';

// Re-export for external use
export { type SupportedCurrency, AccountType, type DateRange };

// ============================================================================
// TRIAL BALANCE TYPES
// ============================================================================

export type BalanceType = 'debit' | 'credit';

export type TrialBalanceStatus = 
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type AccountGroupingType = 
  | 'BY_TYPE'
  | 'BY_CATEGORY'
  | 'BY_PARENT'
  | 'BY_CURRENCY'
  | 'NONE';

export type VarianceThreshold = 
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

// ============================================================================
// TRIAL BALANCE INTERFACES
// ============================================================================

export interface Account extends BaseAccount {
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
  isActive: boolean;
  currency: SupportedCurrency;
  openingBalance: number;
  balanceType: BalanceType;
}

export interface TrialBalanceAccount {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  openingBalance: number;
  periodDebits: number;
  periodCredits: number;
  closingBalance: number;
  balanceType: BalanceType;
  currency: SupportedCurrency;
  parentCode?: string;
  isActive: boolean;
}

export interface TrialBalance {
  id: string;
  title: string;
  period: DateRange;
  accounts: TrialBalanceAccount[];
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  generatedAt: Date;
  generatedBy: string;
  status: TrialBalanceStatus;
  /** Reporting currency used for totals/net; accounts remain in their own currency */
  reportingCurrency?: SupportedCurrency;
  metadata: Record<string, unknown>;
}

export interface ComparativeTrialBalance {
  id: string;
  title: string;
  current: TrialBalance;
  prior: TrialBalance;
  variances: TrialBalanceVariance[];
  summary: {
    totalVariance: number;
    significantVariances: number;
    accountsWithVariances: number;
    variancePercentage: number;
  };
  generatedAt: Date;
  generatedBy: string;
}

export interface TrialBalanceVariance {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  currentBalance: number;
  priorBalance: number;
  variance: number;
  variancePercentage: number;
  isSignificant: boolean;
  threshold: VarianceThreshold;
  currency: SupportedCurrency;
}

export interface EquationValidationResult {
  isValid: boolean;
  assets: number;
  liabilities: number;
  equity: number;
  difference: number;
  withinTolerance: boolean;
  tolerance: number;
  validationDate: Date;
  details: {
    assetAccounts: number;
    liabilityAccounts: number;
    equityAccounts: number;
    totalAccounts: number;
  };
}

// ============================================================================
// TRIAL BALANCE BUILDER INTERFACES
// ============================================================================

export interface TrialBalanceBuilderOptions {
  period: DateRange;
  accounts?: Account[];
  includeInactive?: boolean;
  grouping?: AccountGroupingType;
  reportingCurrency?: SupportedCurrency;
  includeVariances?: boolean;
  priorPeriod?: DateRange;
  varianceThreshold?: number;
}

export interface TrialBalanceBuilderResult {
  trialBalance: TrialBalance;
  validationResult: EquationValidationResult;
  variances?: TrialBalanceVariance[];
  metadata: {
    totalAccounts: number;
    activeAccounts: number;
    inactiveAccounts: number;
    multiCurrencyAccounts: number;
    generationTime: number;
  };
}

// ============================================================================
// TRIAL BALANCE VALIDATION INTERFACES
// ============================================================================

export interface TrialBalanceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validationDate: Date;
  checks: {
    equationCheck: EquationValidationResult;
    balanceCheck: boolean;
    currencyCheck: boolean;
    periodCheck: boolean;
    accountCheck: boolean;
  };
}

export interface TrialBalanceValidationOptions {
  checkEquation?: boolean;
  checkBalances?: boolean;
  checkCurrencies?: boolean;
  checkPeriod?: boolean;
  checkAccounts?: boolean;
  tolerance?: number;
  strictMode?: boolean;
}

// ============================================================================
// TRIAL BALANCE FORMATTING INTERFACES
// ============================================================================

export interface TrialBalanceFormatOptions {
  includeInactive?: boolean;
  groupByType?: boolean;
  groupByCategory?: boolean;
  sortByCode?: boolean;
  sortByName?: boolean;
  sortByBalance?: boolean;
  includeVariances?: boolean;
  includeMetadata?: boolean;
  currency?: SupportedCurrency;
}

export interface TrialBalanceExportOptions {
  format: 'CSV' | 'Excel' | 'PDF' | 'JSON';
  includeInactive?: boolean;
  groupByType?: boolean;
  includeVariances?: boolean;
  includeMetadata?: boolean;
  filename?: string;
  template?: string;
}

export interface TrialBalanceReport {
  id: string;
  title: string;
  trialBalance: TrialBalance;
  summary: {
    totalAccounts: number;
    totalDebits: number;
    totalCredits: number;
    netBalance: number;
    currency: SupportedCurrency;
  };
  generatedAt: Date;
  generatedBy: string;
  format: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// TRIAL BALANCE ANALYSIS INTERFACES
// ============================================================================

export interface TrialBalanceAnalysis {
  id: string;
  title: string;
  trialBalance: TrialBalance;
  analysis: {
    accountDistribution: Record<AccountType, number>;
    balanceDistribution: {
      positiveBalances: number;
      negativeBalances: number;
      zeroBalances: number;
    };
    currencyDistribution: Record<SupportedCurrency, number>;
    varianceAnalysis?: {
      significantVariances: number;
      totalVariance: number;
      averageVariance: number;
    };
  };
  generatedAt: Date;
  generatedBy: string;
}

export interface TrialBalanceTrend {
  id: string;
  title: string;
  periods: TrialBalance[];
  trends: {
    totalDebitsTrend: number;
    totalCreditsTrend: number;
    netBalanceTrend: number;
    accountGrowthTrend: number;
  };
  generatedAt: Date;
  generatedBy: string;
}

// ============================================================================
// TRIAL BALANCE CONFIGURATION INTERFACES
// ============================================================================

export interface TrialBalanceConfiguration {
  id: string;
  name: string;
  description: string;
  defaultOptions: TrialBalanceBuilderOptions;
  validationOptions: TrialBalanceValidationOptions;
  formatOptions: TrialBalanceFormatOptions;
  exportOptions: TrialBalanceExportOptions;
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface TrialBalancePolicy {
  id: string;
  name: string;
  description: string;
  jurisdiction: string;
  accountingStandard: string;
  requirements: {
    equationValidation: boolean;
    balanceValidation: boolean;
    currencyValidation: boolean;
    periodValidation: boolean;
    accountValidation: boolean;
  };
  tolerances: {
    equationTolerance: number;
    balanceTolerance: number;
    currencyTolerance: number;
  };
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}
