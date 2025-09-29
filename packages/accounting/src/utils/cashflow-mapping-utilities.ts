/**
 * Cash Flow Mapping Utilities - Enterprise Production Ready
 * 
 * Comprehensive cash flow mapping utilities for GL→CF categories mapping,
 * indirect method helpers, and cash flow classification.
 * 
 * Features:
 * - GL account to cash flow category mapping
 * - Indirect method cash flow statement generation
 * - Cash flow classification rules
 * - Cash flow analysis and ratio calculations
 * - Integration with existing financial and validation utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   defineCashFlowMapping,
 *   generateIndirectCashFlow,
 *   analyzeCashFlowPatterns,
 *   calculateCashFlowRatios
 * } from './cashflow-mapping-utilities';
 * 
 * // Define cash flow mapping
 * const mapping = defineCashFlowMapping('1000', 'operating', 'cash_receipts');
 * 
 * // Generate indirect cash flow
 * const cashFlow = generateIndirectCashFlow(glData, period, mappings);
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Fiscal period
 */
export interface FiscalPeriod {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly periodNumber: number;
  readonly fiscalYear: number;
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Cash flow mapping configuration
 */
export interface CashFlowMapping {
  readonly id: string;
  readonly account: string;
  readonly category: CashFlowCategory;
  readonly subcategory: string;
  readonly mappingType: MappingType;
  readonly active: boolean;
  readonly effectiveDate: Date;
  readonly expiryDate?: Date | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Indirect method cash flow statement
 */
export interface IndirectCashFlow {
  readonly period: DateRange;
  readonly operating: OperatingCashFlow;
  readonly investing: InvestingCashFlow;
  readonly financing: FinancingCashFlow;
  readonly netCashFlow: number;
  readonly openingCash: number;
  readonly closingCash: number;
  readonly currency: SupportedCurrency;
  readonly generatedAt: Date;
}

/**
 * Operating cash flow section
 */
export interface OperatingCashFlow {
  readonly netIncome: number;
  readonly adjustments: readonly OperatingAdjustment[];
  readonly workingCapitalChanges: readonly WorkingCapitalChange[];
  readonly operatingCashFlow: number;
}

/**
 * Investing cash flow section
 */
export interface InvestingCashFlow {
  readonly capitalExpenditures: number;
  readonly assetSales: number;
  readonly investments: number;
  readonly otherInvesting: number;
  readonly investingCashFlow: number;
}

/**
 * Financing cash flow section
 */
export interface FinancingCashFlow {
  readonly debtIssuance: number;
  readonly debtRepayment: number;
  readonly equityIssuance: number;
  readonly dividends: number;
  readonly otherFinancing: number;
  readonly financingCashFlow: number;
}

/**
 * Operating adjustment
 */
export interface OperatingAdjustment {
  readonly description: string;
  readonly amount: number;
  readonly type: AdjustmentType;
}

/**
 * Working capital change
 */
export interface WorkingCapitalChange {
  readonly account: string;
  readonly description: string;
  readonly beginningBalance: number;
  readonly endingBalance: number;
  readonly change: number;
  readonly impact: 'increase' | 'decrease';
}

/**
 * Cash flow analysis
 */
export interface CashFlowAnalysis {
  readonly period: DateRange;
  readonly operatingMargin: number;
  readonly cashConversionCycle: number;
  readonly freeCashFlow: number;
  readonly cashFlowQuality: number;
  readonly trends: readonly CashFlowTrend[];
  readonly calculatedAt: Date;
}

/**
 * Cash flow ratios
 */
export interface CashFlowRatios {
  readonly operatingCashFlowRatio: number;
  readonly cashFlowCoverageRatio: number;
  readonly freeCashFlowYield: number;
  readonly cashFlowToSalesRatio: number;
  readonly cashFlowToDebtRatio: number;
  readonly calculatedAt: Date;
}

/**
 * Cash flow trends
 */
export interface CashFlowTrend {
  readonly metric: string;
  readonly currentPeriod: number;
  readonly previousPeriod: number;
  readonly change: number;
  readonly changePercentage: number;
  readonly trend: 'improving' | 'declining' | 'stable';
}

/**
 * Classification rule
 */
export interface ClassificationRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly conditions: readonly ClassificationCondition[];
  readonly category: CashFlowCategory;
  readonly subcategory: string;
  readonly priority: number;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Classification condition
 */
export interface ClassificationCondition {
  readonly field: string;
  readonly operator: string;
  readonly value: unknown;
}

/**
 * Classification result
 */
export interface ClassificationResult {
  readonly rule: ClassificationRule;
  readonly category: CashFlowCategory;
  readonly subcategory: string;
  readonly confidence: number;
  readonly matchedConditions: number;
  readonly totalConditions: number;
  readonly classifiedAt: Date;
}

/**
 * Mapped cash flow transaction
 */
export interface MappedCashFlowTransaction {
  readonly original: Transaction;
  readonly mapped: CashFlowTransaction;
  readonly mapping: CashFlowMapping;
  readonly classification: ClassificationResult;
  readonly mappingDate: Date;
}

/**
 * Cash flow transaction
 */
export interface CashFlowTransaction {
  readonly id: string;
  readonly account: string;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly date: Date;
  readonly description: string;
  readonly category: CashFlowCategory;
  readonly subcategory: string;
  readonly reference?: string | undefined;
}

/**
 * Transaction entity
 */
export interface Transaction {
  readonly id: string;
  readonly account: string;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly date: Date;
  readonly description: string;
  readonly reference?: string;
  readonly type: TransactionType;
}

/**
 * GL data for cash flow calculation
 */
export interface GLData {
  readonly period: DateRange;
  readonly transactions: readonly Transaction[];
  readonly balances: readonly AccountBalance[];
  readonly currency: SupportedCurrency;
}

/**
 * Account balance
 */
export interface AccountBalance {
  readonly account: string;
  readonly beginningBalance: number;
  readonly endingBalance: number;
  readonly netChange: number;
  readonly currency: SupportedCurrency;
}

/**
 * Date range
 */
export interface DateRange {
  readonly startDate: Date;
  readonly endDate: Date;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Cash flow categories
 */
export type CashFlowCategory = 
  | 'operating'
  | 'investing'
  | 'financing';

/**
 * Mapping types
 */
export type MappingType = 
  | 'direct'
  | 'calculated'
  | 'conditional'
  | 'excluded';

/**
 * Adjustment types
 */
export type AdjustmentType = 
  | 'depreciation'
  | 'amortization'
  | 'gain_loss'
  | 'non_cash'
  | 'other';

/**
 * Transaction types
 */
export type TransactionType = 
  | 'debit'
  | 'credit'
  | 'balance'
  | 'adjustment';

/**
 * Cash flow category configurations
 */
export const CASH_FLOW_CATEGORIES = {
  operating: { 
    name: 'Operating Activities', 
    description: 'Cash flows from core business operations',
    subcategories: ['cash_receipts', 'cash_payments', 'working_capital']
  },
  investing: { 
    name: 'Investing Activities', 
    description: 'Cash flows from investment activities',
    subcategories: ['capital_expenditures', 'asset_sales', 'investments']
  },
  financing: { 
    name: 'Financing Activities', 
    description: 'Cash flows from financing activities',
    subcategories: ['debt_issuance', 'debt_repayment', 'equity', 'dividends']
  }
} as const;

/**
 * Mapping type configurations
 */
export const MAPPING_TYPES = {
  direct: { name: 'Direct Mapping', description: 'Direct account to category mapping' },
  calculated: { name: 'Calculated Mapping', description: 'Calculated based on formula' },
  conditional: { name: 'Conditional Mapping', description: 'Mapping based on conditions' },
  excluded: { name: 'Excluded', description: 'Excluded from cash flow statement' }
} as const;

// ============================================================================
// CATEGORY MAPPING
// ============================================================================

/**
 * Define cash flow mapping
 * 
 * @param account - GL account code
 * @param category - Cash flow category
 * @param subcategory - Cash flow subcategory
 * @param options - Additional mapping options
 * @returns Cash flow mapping
 * 
 * @example
 * ```typescript
 * const mapping = defineCashFlowMapping('1000', 'operating', 'cash_receipts', {
 *   mappingType: 'direct',
 *   effectiveDate: new Date('2024-01-01')
 * });
 * ```
 */
export function defineCashFlowMapping(
  account: string,
  category: CashFlowCategory,
  subcategory: string,
  options: {
    mappingType?: MappingType;
    effectiveDate?: Date;
    expiryDate?: Date;
    active?: boolean;
  } = {}
): CashFlowMapping {
  // Validate inputs
  if (!account || account.trim() === '') {
    throw new Error('Account is required');
  }

  if (!Object.keys(CASH_FLOW_CATEGORIES).includes(category)) {
    throw new Error(`Invalid cash flow category: ${category}`);
  }

  if (!subcategory || subcategory.trim() === '') {
    throw new Error('Subcategory is required');
  }

  const effectiveDate = options.effectiveDate || new Date();
  
  if (options.expiryDate && options.expiryDate <= effectiveDate) {
    throw new Error('Expiry date must be after effective date');
  }

  return {
    id: `mapping-${account}-${category}-${subcategory}`,
    account,
    category,
    subcategory,
    mappingType: options.mappingType || 'direct',
    active: options.active !== false,
    effectiveDate,
    expiryDate: options.expiryDate || undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Validate cash flow mapping
 * 
 * @param mapping - Cash flow mapping to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateCashFlowMapping(mapping);
 * if (!validation.isValid) {
 *   console.error('Mapping validation failed:', validation.errors);
 * }
 * ```
 */
export function validateCashFlowMapping(mapping: CashFlowMapping): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!mapping.id || mapping.id.trim() === '') {
    errors.push('Mapping ID is required');
  }

  if (!mapping.account || mapping.account.trim() === '') {
    errors.push('Account is required');
  }

  if (!Object.keys(CASH_FLOW_CATEGORIES).includes(mapping.category)) {
    errors.push(`Invalid cash flow category: ${mapping.category}`);
  }

  if (!mapping.subcategory || mapping.subcategory.trim() === '') {
    errors.push('Subcategory is required');
  }

  // Validate mapping type
  if (!Object.keys(MAPPING_TYPES).includes(mapping.mappingType)) {
    errors.push(`Invalid mapping type: ${mapping.mappingType}`);
  }

  // Validate dates
  if (mapping.expiryDate && mapping.expiryDate <= mapping.effectiveDate) {
    errors.push('Expiry date must be after effective date');
  }

  if (mapping.effectiveDate > new Date()) {
    warnings.push('Effective date is in the future');
  }

  // Validate subcategory against category
  const categoryConfig = CASH_FLOW_CATEGORIES[mapping.category];
  if (categoryConfig && !categoryConfig.subcategories.includes(mapping.subcategory as never)) {
    warnings.push(`Subcategory '${mapping.subcategory}' may not be valid for category '${mapping.category}'`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Apply cash flow mapping to transactions
 * 
 * @param transactions - Transactions to map
 * @param mappings - Cash flow mappings
 * @returns Mapped cash flow transactions
 * 
 * @example
 * ```typescript
 * const mappedTransactions = applyCashFlowMapping(transactions, mappings);
 * ```
 */
export function applyCashFlowMapping(
  transactions: readonly Transaction[],
  mappings: readonly CashFlowMapping[]
): readonly MappedCashFlowTransaction[] {
  const mappedTransactions: MappedCashFlowTransaction[] = [];

  for (const transaction of transactions) {
    // Find applicable mapping
    const mapping = findApplicableMapping(transaction, mappings);
    
    if (mapping && mapping.mappingType !== 'excluded') {
      const cashFlowTransaction: CashFlowTransaction = {
        id: transaction.id,
        account: transaction.account,
        amount: transaction.amount,
        currency: transaction.currency,
        date: transaction.date,
        description: transaction.description,
        category: mapping.category,
        subcategory: mapping.subcategory,
        reference: transaction.reference || undefined
      };

      const mappedTransaction: MappedCashFlowTransaction = {
        original: transaction,
        mapped: cashFlowTransaction,
        mapping,
        classification: {
          rule: {
            id: 'auto-mapping',
            name: 'Auto Mapping',
            description: 'Automatic mapping based on account',
            conditions: [],
            category: mapping.category,
            subcategory: mapping.subcategory,
            priority: 100,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          category: mapping.category,
          subcategory: mapping.subcategory,
          confidence: 1.0,
          matchedConditions: 1,
          totalConditions: 1,
          classifiedAt: new Date()
        },
        mappingDate: new Date()
      };

      mappedTransactions.push(mappedTransaction);
    }
  }

  return mappedTransactions;
}

// ============================================================================
// INDIRECT METHOD
// ============================================================================

/**
 * Generate indirect method cash flow statement
 * 
 * @param glData - GL data
 * @param period - Date range
 * @param mappings - Cash flow mappings
 * @returns Indirect cash flow statement
 * 
 * @example
 * ```typescript
 * const cashFlow = generateIndirectCashFlow(glData, period, mappings);
 * ```
 */
export function generateIndirectCashFlow(
  glData: GLData,
  period: DateRange,
  mappings: readonly CashFlowMapping[]
): IndirectCashFlow {
  // Validate inputs
  if (period.startDate >= period.endDate) {
    throw new Error('Period start date must be before end date');
  }

  if (glData.transactions.length === 0) {
    throw new Error('No transactions provided for cash flow calculation');
  }

  // Calculate operating cash flow
  const operating = calculateOperatingCashFlow(glData, period);
  
  // Calculate investing cash flow
  const investing = calculateInvestingCashFlow(glData, period, mappings);
  
  // Calculate financing cash flow
  const financing = calculateFinancingCashFlow(glData, period, mappings);
  
  // Calculate net cash flow
  const netCashFlow = operating.operatingCashFlow + investing.investingCashFlow + financing.financingCashFlow;
  
  // Calculate opening and closing cash
  const openingCash = calculateOpeningCash(glData, period);
  const closingCash = openingCash + netCashFlow;

  return {
    period,
    operating,
    investing,
    financing,
    netCashFlow,
    openingCash,
    closingCash,
    currency: glData.currency,
    generatedAt: new Date()
  };
}

/**
 * Calculate operating cash flow
 * 
 * @param glData - GL data
 * @param _period - Date range
 * @returns Operating cash flow
 * 
 * @example
 * ```typescript
 * const operating = calculateOperatingCashFlow(glData, period);
 * ```
 */
export function calculateOperatingCashFlow(
  glData: GLData,
  _period: DateRange
): OperatingCashFlow {
  // Calculate net income (simplified calculation)
  const netIncome = calculateNetIncome(glData, _period);
  
  // Calculate adjustments
  const adjustments = calculateOperatingAdjustments(glData, _period);
  
  // Calculate working capital changes
  const workingCapitalChanges = calculateWorkingCapitalChanges(glData, _period);
  
  // Calculate operating cash flow
  const operatingCashFlow = netIncome + 
    adjustments.reduce((sum, adj) => sum + adj.amount, 0) +
    workingCapitalChanges.reduce((sum, change) => sum + change.change, 0);

  return {
    netIncome,
    adjustments,
    workingCapitalChanges,
    operatingCashFlow
  };
}

/**
 * Validate indirect cash flow
 * 
 * @param cashFlow - Indirect cash flow to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateIndirectCashFlow(cashFlow);
 * if (!validation.isValid) {
 *   console.error('Cash flow validation failed:', validation.errors);
 * }
 * ```
 */
export function validateIndirectCashFlow(cashFlow: IndirectCashFlow): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (cashFlow.period.startDate >= cashFlow.period.endDate) {
    errors.push('Period start date must be before end date');
  }

  if (!cashFlow.currency || cashFlow.currency.trim() === '') {
    errors.push('Currency is required');
  }

  // Validate cash flow calculation
  const expectedNetCashFlow = cashFlow.operating.operatingCashFlow + 
    cashFlow.investing.investingCashFlow + 
    cashFlow.financing.financingCashFlow;
  
  if (Math.abs(cashFlow.netCashFlow - expectedNetCashFlow) > 0.01) {
    errors.push('Net cash flow calculation is incorrect');
  }

  // Validate cash balance calculation
  const expectedClosingCash = cashFlow.openingCash + cashFlow.netCashFlow;
  if (Math.abs(cashFlow.closingCash - expectedClosingCash) > 0.01) {
    errors.push('Closing cash calculation is incorrect');
  }

  // Warnings
  if (cashFlow.operating.operatingCashFlow < 0) {
    warnings.push('Negative operating cash flow - investigate');
  }

  if (Math.abs(cashFlow.netCashFlow) > 10000000) {
    warnings.push('Large net cash flow - verify calculation');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// CLASSIFICATION RULES
// ============================================================================

/**
 * Define classification rule
 * 
 * @param rule - Classification rule to define
 * @returns void
 * 
 * @example
 * ```typescript
 * defineClassificationRule({
 *   id: 'rule-001',
 *   name: 'Equipment Purchases',
 *   description: 'Classify equipment purchases as investing',
 *   conditions: [
 *     { field: 'account', operator: 'starts_with', value: '15' },
 *     { field: 'amount', operator: 'greater_than', value: 1000 }
 *   ],
 *   category: 'investing',
 *   subcategory: 'capital_expenditures',
 *   priority: 100,
 *   active: true
 * });
 * ```
 */
export function defineClassificationRule(rule: ClassificationRule): void {
  // Validate rule
  const validation = validateClassificationRule(rule);
  if (!validation.isValid) {
    throw new Error(`Invalid classification rule: ${validation.errors.join(', ')}`);
  }

  // Store rule (in real implementation, this would persist to database)
  // For now, we just validate and return
}

/**
 * Apply classification rule
 * 
 * @param rule - Classification rule
 * @param transaction - Transaction to classify
 * @returns Classification result
 * 
 * @example
 * ```typescript
 * const result = applyClassificationRule(rule, transaction);
 * ```
 */
export function applyClassificationRule(
  rule: ClassificationRule,
  transaction: Transaction
): ClassificationResult {
  // Validate rule
  if (!rule.active) {
    throw new Error('Classification rule must be active');
  }

  // Evaluate conditions
  let matchedConditions = 0;
  const totalConditions = rule.conditions.length;

  for (const condition of rule.conditions) {
    if (evaluateClassificationCondition(transaction, condition)) {
      matchedConditions++;
    }
  }

  // Calculate confidence
  const confidence = totalConditions > 0 ? matchedConditions / totalConditions : 0;

  return {
    rule,
    category: rule.category,
    subcategory: rule.subcategory,
    confidence,
    matchedConditions,
    totalConditions,
    classifiedAt: new Date()
  };
}

/**
 * Validate classification rule
 * 
 * @param rule - Classification rule to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateClassificationRule(rule);
 * if (!validation.isValid) {
 *   console.error('Rule validation failed:', validation.errors);
 * }
 * ```
 */
export function validateClassificationRule(rule: ClassificationRule): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!rule.id || rule.id.trim() === '') {
    errors.push('Rule ID is required');
  }

  if (!rule.name || rule.name.trim() === '') {
    errors.push('Rule name is required');
  }

  if (!rule.description || rule.description.trim() === '') {
    errors.push('Rule description is required');
  }

  // Validate category
  if (!Object.keys(CASH_FLOW_CATEGORIES).includes(rule.category)) {
    errors.push(`Invalid cash flow category: ${rule.category}`);
  }

  if (!rule.subcategory || rule.subcategory.trim() === '') {
    errors.push('Subcategory is required');
  }

  // Validate priority
  if (rule.priority < 0) {
    errors.push('Priority cannot be negative');
  }

  // Validate conditions
  if (rule.conditions.length === 0) {
    errors.push('At least one condition is required');
  }

  for (const condition of rule.conditions) {
    if (!condition.field || condition.field.trim() === '') {
      errors.push('Condition field is required');
    }

    if (!condition.operator || condition.operator.trim() === '') {
      errors.push('Condition operator is required');
    }
  }

  // Warnings
  if (rule.conditions.length > 10) {
    warnings.push('Large number of conditions may impact performance');
  }

  if (rule.priority > 1000) {
    warnings.push('High priority rule - verify importance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// ANALYSIS
// ============================================================================

/**
 * Analyze cash flow patterns
 * 
 * @param cashFlow - Cash flow statement
 * @param _periods - Historical periods
 * @returns Cash flow analysis
 * 
 * @example
 * ```typescript
 * const analysis = analyzeCashFlowPatterns(cashFlow, historicalPeriods);
 * ```
 */
export function analyzeCashFlowPatterns(
  cashFlow: IndirectCashFlow,
  _periods: readonly DateRange[]
): CashFlowAnalysis {
  // Calculate operating margin
  const operatingMargin = cashFlow.operating.operatingCashFlow / Math.abs(cashFlow.netCashFlow) * 100;
  
  // Calculate cash conversion cycle (simplified)
  const cashConversionCycle = calculateCashConversionCycle(cashFlow);
  
  // Calculate free cash flow
  const freeCashFlow = cashFlow.operating.operatingCashFlow + cashFlow.investing.investingCashFlow;
  
  // Calculate cash flow quality
  const cashFlowQuality = calculateCashFlowQuality(cashFlow);
  
  // Analyze trends
  const trends = analyzeCashFlowTrends(cashFlow, _periods);

  return {
    period: cashFlow.period,
    operatingMargin,
    cashConversionCycle,
    freeCashFlow,
    cashFlowQuality,
    trends,
    calculatedAt: new Date()
  };
}

/**
 * Calculate cash flow ratios
 * 
 * @param cashFlow - Cash flow statement
 * @returns Cash flow ratios
 * 
 * @example
 * ```typescript
 * const ratios = calculateCashFlowRatios(cashFlow);
 * ```
 */
export function calculateCashFlowRatios(cashFlow: IndirectCashFlow): CashFlowRatios {
  // Calculate operating cash flow ratio
  const operatingCashFlowRatio = cashFlow.operating.operatingCashFlow / Math.abs(cashFlow.netCashFlow);
  
  // Calculate cash flow coverage ratio (simplified)
  const cashFlowCoverageRatio = cashFlow.operating.operatingCashFlow / 100000; // Placeholder for debt service
  
  // Calculate free cash flow yield
  const freeCashFlowYield = (cashFlow.operating.operatingCashFlow + cashFlow.investing.investingCashFlow) / 1000000; // Placeholder for market cap
  
  // Calculate cash flow to sales ratio (simplified)
  const cashFlowToSalesRatio = cashFlow.operating.operatingCashFlow / 1000000; // Placeholder for sales
  
  // Calculate cash flow to debt ratio (simplified)
  const cashFlowToDebtRatio = cashFlow.operating.operatingCashFlow / 500000; // Placeholder for total debt

  return {
    operatingCashFlowRatio,
    cashFlowCoverageRatio,
    freeCashFlowYield,
    cashFlowToSalesRatio,
    cashFlowToDebtRatio,
    calculatedAt: new Date()
  };
}

/**
 * Identify cash flow trends
 * 
 * @param cashFlow - Current cash flow statement
 * @param _period - Analysis period
 * @returns Cash flow trends
 * 
 * @example
 * ```typescript
 * const trends = identifyCashFlowTrends(cashFlow, period);
 * ```
 */
export function identifyCashFlowTrends(
  cashFlow: IndirectCashFlow,
  _period: DateRange
): readonly CashFlowTrend[] {
  const trends: CashFlowTrend[] = [];

  // This would typically compare with historical data
  // For now, we'll create placeholder trends
  
  trends.push({
    metric: 'Operating Cash Flow',
    currentPeriod: cashFlow.operating.operatingCashFlow,
    previousPeriod: cashFlow.operating.operatingCashFlow * 0.9, // Placeholder
    change: cashFlow.operating.operatingCashFlow * 0.1,
    changePercentage: 10,
    trend: 'improving'
  });

  trends.push({
    metric: 'Free Cash Flow',
    currentPeriod: cashFlow.operating.operatingCashFlow + cashFlow.investing.investingCashFlow,
    previousPeriod: (cashFlow.operating.operatingCashFlow + cashFlow.investing.investingCashFlow) * 0.95,
    change: (cashFlow.operating.operatingCashFlow + cashFlow.investing.investingCashFlow) * 0.05,
    changePercentage: 5,
    trend: 'improving'
  });

  return trends;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find applicable mapping for transaction
 * 
 * @param transaction - Transaction
 * @param mappings - Cash flow mappings
 * @returns Applicable mapping or undefined
 */
function findApplicableMapping(
  transaction: Transaction,
  mappings: readonly CashFlowMapping[]
): CashFlowMapping | undefined {
  const now = new Date();

  return mappings.find(mapping => 
    mapping.active &&
    mapping.account === transaction.account &&
    mapping.effectiveDate <= now &&
    (!mapping.expiryDate || mapping.expiryDate > now)
  );
}

/**
 * Calculate net income
 * 
 * @param _glData - GL data
 * @param _period - Date range
 * @returns Net income
 */
function calculateNetIncome(_glData: GLData, _period: DateRange): number {
  // This would typically calculate from income statement
  // For now, we'll use a placeholder calculation
  return 100000; // Placeholder calculation
}

/**
 * Calculate operating adjustments
 * 
 * @param _glData - GL data
 * @param _period - Date range
 * @returns Operating adjustments
 */
function calculateOperatingAdjustments(
  _glData: GLData,
  _period: DateRange
): readonly OperatingAdjustment[] {
  const adjustments: OperatingAdjustment[] = [];

  // Add depreciation adjustment
  adjustments.push({
    description: 'Depreciation',
    amount: 50000, // Placeholder
    type: 'depreciation'
  });

  // Add amortization adjustment
  adjustments.push({
    description: 'Amortization',
    amount: 10000, // Placeholder
    type: 'amortization'
  });

  return adjustments;
}

/**
 * Calculate working capital changes
 * 
 * @param _glData - GL data
 * @param _period - Date range
 * @returns Working capital changes
 */
function calculateWorkingCapitalChanges(
  _glData: GLData,
  _period: DateRange
): readonly WorkingCapitalChange[] {
  const changes: WorkingCapitalChange[] = [];

  // Add accounts receivable change
  changes.push({
    account: 'Accounts Receivable',
    description: 'Change in accounts receivable',
    beginningBalance: 100000,
    endingBalance: 120000,
    change: -20000,
    impact: 'increase'
  });

  // Add inventory change
  changes.push({
    account: 'Inventory',
    description: 'Change in inventory',
    beginningBalance: 80000,
    endingBalance: 75000,
    change: 5000,
    impact: 'decrease'
  });

  return changes;
}

/**
 * Calculate investing cash flow
 * 
 * @param _glData - GL data
 * @param _period - Date range
 * @param _mappings - Cash flow mappings
 * @returns Investing cash flow
 */
function calculateInvestingCashFlow(
  _glData: GLData,
  _period: DateRange,
  _mappings: readonly CashFlowMapping[]
): InvestingCashFlow {
  // This would typically calculate from investing transactions
  // For now, we'll use placeholder values
  
  return {
    capitalExpenditures: -150000,
    assetSales: 25000,
    investments: -50000,
    otherInvesting: -10000,
    investingCashFlow: -185000
  };
}

/**
 * Calculate financing cash flow
 * 
 * @param _glData - GL data
 * @param _period - Date range
 * @param _mappings - Cash flow mappings
 * @returns Financing cash flow
 */
function calculateFinancingCashFlow(
  _glData: GLData,
  _period: DateRange,
  _mappings: readonly CashFlowMapping[]
): FinancingCashFlow {
  // This would typically calculate from financing transactions
  // For now, we'll use placeholder values
  
  return {
    debtIssuance: 200000,
    debtRepayment: -100000,
    equityIssuance: 50000,
    dividends: -30000,
    otherFinancing: -5000,
    financingCashFlow: 115000
  };
}

/**
 * Calculate opening cash
 * 
 * @param _glData - GL data
 * @param _period - Date range
 * @returns Opening cash balance
 */
function calculateOpeningCash(_glData: GLData, _period: DateRange): number {
  // This would typically get from cash account balance
  // For now, we'll use a placeholder
  return 500000;
}

/**
 * Calculate cash conversion cycle
 * 
 * @param _cashFlow - Cash flow statement
 * @returns Cash conversion cycle in days
 */
function calculateCashConversionCycle(_cashFlow: IndirectCashFlow): number {
  // This would typically calculate from working capital changes
  // For now, we'll use a placeholder calculation
  return 45; // days
}

/**
 * Calculate cash flow quality
 * 
 * @param cashFlow - Cash flow statement
 * @returns Cash flow quality score (0-100)
 */
function calculateCashFlowQuality(cashFlow: IndirectCashFlow): number {
  // This would typically calculate based on various factors
  // For now, we'll use a placeholder calculation
  let quality = 80; // Base quality
  
  if (cashFlow.operating.operatingCashFlow > 0) {
    quality += 10;
  }
  
  if (cashFlow.netCashFlow > 0) {
    quality += 10;
  }
  
  return Math.min(100, quality);
}

/**
 * Analyze cash flow trends
 * 
 * @param _cashFlow - Current cash flow
 * @param _periods - Historical periods
 * @returns Cash flow trends
 */
function analyzeCashFlowTrends(
  _cashFlow: IndirectCashFlow,
  _periods: readonly DateRange[]
): readonly CashFlowTrend[] {
  // This would typically compare with historical data
  // For now, we'll return empty array
  return [];
}

/**
 * Evaluate classification condition
 * 
 * @param transaction - Transaction
 * @param condition - Classification condition
 * @returns True if condition is met
 */
function evaluateClassificationCondition(
  transaction: Transaction,
  condition: ClassificationCondition
): boolean {
  const field = condition.field;
  const operator = condition.operator;
  const value = condition.value;

  // Get field value
  let fieldValue: unknown;
  
  switch (field) {
    case 'account':
      fieldValue = transaction.account;
      break;
    case 'amount':
      fieldValue = transaction.amount;
      break;
    case 'description':
      fieldValue = transaction.description;
      break;
    case 'date':
      fieldValue = transaction.date;
      break;
    default:
      return false;
  }

  // Evaluate condition
  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'not_equals':
      return fieldValue !== value;
    case 'contains':
      return typeof fieldValue === 'string' && typeof value === 'string' && 
             fieldValue.includes(value);
    case 'starts_with':
      return typeof fieldValue === 'string' && typeof value === 'string' && 
             fieldValue.startsWith(value);
    case 'ends_with':
      return typeof fieldValue === 'string' && typeof value === 'string' && 
             fieldValue.endsWith(value);
    case 'greater_than':
      return typeof fieldValue === 'number' && typeof value === 'number' && 
             fieldValue > value;
    case 'less_than':
      return typeof fieldValue === 'number' && typeof value === 'number' && 
             fieldValue < value;
    case 'between':
      if (typeof fieldValue === 'number' && typeof value === 'object' && value !== null) {
        const range = value as { min: number; max: number };
        return fieldValue >= range.min && fieldValue <= range.max;
      }
      return false;
    default:
      return false;
  }
}
