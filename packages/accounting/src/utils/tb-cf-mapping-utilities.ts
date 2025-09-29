/**
 * Trial Balance to Cash Flow Mapping Utilities
 * 
 * Thin adapter from trial balance to cash flow categories to keep statements consistent.
 * Provides comprehensive TB to CF mapping, validation, and reconciliation operations.
 * 
 * @fileoverview Trial balance to cash flow mapping and statement consistency
 */

import type {
  AccountType,
} from './accounting-utilities';
import type { ValidationIssue } from './validation-utilities';
import type { TrialBalance, TrialBalanceAccount } from './trial-balance-utilities';
import type { CashFlowStatement, StatementLine } from './financial-statements-utilities';
import type { ConditionOperator, LogicalOperator } from './shared-operators-utilities';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface TBCFMapping {
  id: string;
  name: string;
  description: string;
  accountCode: string;
  cfCategory: string;
  cfSubcategory: string;
  mappingType: MappingType;
  conditions: MappingCondition[];
  /** How to derive the amount to map (default: closingBalance for backward compat) */
  amountSource?: AmountSource;
  /** How to set the CF sign/direction (default: natural) */
  signStrategy?: SignStrategy;
  priority: number;
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface CFCategory {
  id: string;
  name: string;
  type: CFCategoryType;
  description: string;
  parentCategory?: string;
  childCategories: string[];
  displayOrder: number;
  active: boolean;
}

export interface MappingResult {
  account: TrialBalanceAccount;
  mapping: TBCFMapping;
  cfLine: StatementLine;
  amount: number;
  isMapped: boolean;
  confidence: number;
  issues: ValidationIssue[];
}

export interface CFReconciliation {
  id: string;
  trialBalance: TrialBalance;
  cashFlowStatement: CashFlowStatement;
  mappings: MappingResult[];
  totalOperating: number;
  totalInvesting: number;
  totalFinancing: number;
  netCashFlow: number;
  isBalanced: boolean;
  differences: ReconciliationDifference[];
  generatedAt: Date;
}

export interface ReconciliationDifference {
  type: DifferenceType;
  accountCode: string;
  tbAmount: number;
  cfAmount: number;
  difference: number;
  tolerance: number;
  withinTolerance: boolean;
  reason: string;
}

export interface MappingRule {
  id: string;
  name: string;
  description: string;
  accountPattern: string;
  cfCategory: string;
  conditions: MappingCondition[];
  priority: number;
  active: boolean;
}

export interface MappingValidation {
  mapping: TBCFMapping;
  isValid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  recommendations: string[];
}

export interface CFStatementBuilder {
  trialBalance: TrialBalance;
  mappings: TBCFMapping[];
  operatingLines: StatementLine[];
  investingLines: StatementLine[];
  financingLines: StatementLine[];
  totalOperating: number;
  totalInvesting: number;
  totalFinancing: number;
  netCashFlow: number;
}

export interface AccountCFAnalysis {
  account: TrialBalanceAccount;
  cfCategory: CFCategory;
  historicalMappings: TBCFMapping[];
  consistency: number;
  recommendations: string[];
  issues: ValidationIssue[];
}

export interface CFConsistencyCheck {
  statement: CashFlowStatement;
  trialBalance: TrialBalance;
  isConsistent: boolean;
  inconsistencies: ConsistencyIssue[];
  recommendations: string[];
}

export interface ConsistencyIssue {
  type: ConsistencyType;
  accountCode: string;
  tbAmount: number;
  cfAmount: number;
  difference: number;
  severity: 'error' | 'warning' | 'info';
  description: string;
}

export interface MappingAudit {
  id: string;
  mapping: TBCFMapping;
  action: AuditAction;
  timestamp: Date;
  user: string;
  changes: MappingChange[];
  reason: string;
}

export interface MappingChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  description: string;
}

export interface CFValidationResult {
  statement: CashFlowStatement;
  trialBalance: TrialBalance;
  isValid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  recommendations: string[];
}

export interface AccountCFHistory {
  account: TrialBalanceAccount;
  mappings: TBCFMapping[];
  changes: MappingChange[];
  lastUpdated: Date;
  consistency: number;
}

export type CFCategoryType = 'operating' | 'investing' | 'financing';
export type MappingType = 'direct' | 'calculated' | 'derived' | 'manual';
export type DifferenceType = 'amount' | 'category' | 'timing' | 'classification';
export type ConsistencyType = 'amount' | 'category' | 'timing' | 'classification' | 'completeness';
export type AuditAction = 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
export type AmountSource = 'closingBalance' | 'movement';
export type SignStrategy = 'natural' | 'invert' | 'byCategory';

export interface MappingCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

// ConditionOperator and LogicalOperator imported from shared-operators.ts (SSOT)

// ============================================================================
// Mapping Management
// ============================================================================

/**
 * Create TB to CF mapping
 */
export function createTBCFMapping(accountCode: string, cfCategory: CFCategory, mappingType: MappingType): TBCFMapping {
  return {
    id: `mapping_${accountCode}_${cfCategory.id}_${Date.now()}`,
    name: `Mapping ${accountCode} to ${cfCategory.name}`,
    description: `Map account ${accountCode} to cash flow category ${cfCategory.name}`,
    accountCode,
    cfCategory: cfCategory.id,
    cfSubcategory: cfCategory.name,
    mappingType,
    conditions: [],
    amountSource: 'closingBalance',
    signStrategy: 'natural',
    priority: 1,
    active: true,
    effectiveDate: new Date(),
  };
}

/**
 * Validate TB to CF mapping
 */
export function validateTBCFMapping(mapping: TBCFMapping): MappingValidation {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const recommendations: string[] = [];
  
  // Validate account code
  if (!mapping.accountCode || mapping.accountCode.trim() === '') {
    issues.push({
      path: 'accountCode',
      message: 'Account code is required',
      severity: 'error',
      code: 'REQUIRED',
    });
  }
  
  // Validate CF category
  if (!mapping.cfCategory || mapping.cfCategory.trim() === '') {
    issues.push({
      path: 'cfCategory',
      message: 'Cash flow category is required',
      severity: 'error',
      code: 'REQUIRED',
    });
  }
  
  // Validate mapping type
  if (!mapping.mappingType) {
    issues.push({
      path: 'mappingType',
      message: 'Mapping type is required',
      severity: 'error',
      code: 'REQUIRED',
    });
  }
  
  // Validate effective date
  if (mapping.effectiveDate > new Date()) {
    warnings.push({
      path: 'effectiveDate',
      message: 'Effective date is in the future',
      severity: 'warning',
      code: 'RANGE',
    });
  }
  
  // Validate expiry date
  if (mapping.expiryDate && mapping.expiryDate <= mapping.effectiveDate) {
    issues.push({
      path: 'expiryDate',
      message: 'Expiry date must be after effective date',
      severity: 'error',
      code: 'RANGE',
    });
  }
  
  // Validate conditions
  mapping.conditions.forEach((condition, index) => {
    if (!condition.field || !condition.operator) {
      issues.push({
        path: `conditions[${index}]`,
        message: 'Condition missing required fields',
        severity: 'error',
        code: 'REQUIRED',
      });
    }
  });
  
  // Add recommendations
  if (mapping.mappingType === 'manual') {
    recommendations.push('Consider automating this mapping if possible');
  }
  
  if (mapping.conditions.length === 0) {
    recommendations.push('Add conditions to make mapping more specific');
  }
  
  return {
    mapping,
    isValid: issues.length === 0,
    issues,
    warnings,
    recommendations,
  };
}

/**
 * Update TB to CF mapping
 */
export function updateTBCFMapping(mapping: TBCFMapping, updates: Partial<TBCFMapping>): TBCFMapping {
  return {
    ...mapping,
    ...updates,
    // Preserve original creation date
    effectiveDate: mapping.effectiveDate,
  };
}

/**
 * Deactivate TB to CF mapping
 */
export function deactivateTBCFMapping(mapping: TBCFMapping): TBCFMapping {
  return {
    ...mapping,
    active: false,
    expiryDate: new Date(),
  };
}

// ============================================================================
// Mapping Application
// ============================================================================

/**
 * Apply TB to CF mapping to trial balance
 */
export function applyTBCFMapping(trialBalance: TrialBalance, mappings: TBCFMapping[]): MappingResult[] {
  const results: MappingResult[] = [];
  
  trialBalance.accounts.forEach(account => {
    const applicableMapping = findApplicableMapping(account, mappings);
    
    if (applicableMapping) {
      const cfLine = createCFStatementLine(account, applicableMapping);
      const amount = calculateCFAmount(account, applicableMapping);
      const confidence = calculateMappingConfidence(account, applicableMapping);
      const issues: ValidationIssue[] = [];
      
      // Validate mapping
      if (confidence < 0.8) {
        issues.push({
          path: 'mapping',
          message: `Low confidence mapping for account ${account.accountCode}`,
          severity: 'warning',
          code: 'CONSISTENCY',
        });
      }
      
      results.push({
        account,
        mapping: applicableMapping,
        cfLine,
        amount,
        isMapped: true,
        confidence,
        issues,
      });
    } else {
      // No mapping found
      results.push({
        account,
        mapping: {} as TBCFMapping,
        cfLine: {} as StatementLine,
        amount: 0,
        isMapped: false,
        confidence: 0,
        issues: [{
          path: 'mapping',
          message: `No mapping found for account ${account.accountCode}`,
          severity: 'warning',
          code: 'REQUIRED',
        }],
      });
    }
  });
  
  return results;
}

/**
 * Build cash flow statement from trial balance
 */
export function buildCashFlowFromTrialBalance(trialBalance: TrialBalance, mappings: TBCFMapping[]): CFStatementBuilder {
  const mappingResults = applyTBCFMapping(trialBalance, mappings);
  
  const operatingLines: StatementLine[] = [];
  const investingLines: StatementLine[] = [];
  const financingLines: StatementLine[] = [];
  
  let totalOperating = 0;
  let totalInvesting = 0;
  let totalFinancing = 0;
  
  mappingResults.forEach(result => {
    if (!result.isMapped) {
      return;
    }
    
    const cfCategory = getCFCategoryById(result.mapping.cfCategory);
    if (!cfCategory) {
      return;
    }
    
    switch (cfCategory.type) {
      case 'operating':
        operatingLines.push(result.cfLine);
        totalOperating += result.amount;
        break;
      case 'investing':
        investingLines.push(result.cfLine);
        totalInvesting += result.amount;
        break;
      case 'financing':
        financingLines.push(result.cfLine);
        totalFinancing += result.amount;
        break;
    }
  });
  
  const netCashFlow = totalOperating + totalInvesting + totalFinancing;
  
  return {
    trialBalance,
    mappings,
    operatingLines,
    investingLines,
    financingLines,
    totalOperating,
    totalInvesting,
    totalFinancing,
    netCashFlow,
  };
}

/**
 * Reconcile trial balance with cash flow statement
 */
export function reconcileTBCF(
  trialBalance: TrialBalance,
  cashFlowStatement: CashFlowStatement,
  mappings: TBCFMapping[],
  opts: { tolerance?: number } = {}
): CFReconciliation {
  const mappingResults = applyTBCFMapping(trialBalance, mappings);
  const differences: ReconciliationDifference[] = [];
  
  // Calculate totals from trial balance
  const tbOperating = mappingResults
    .filter(r => r.isMapped && getCFCategoryById(r.mapping.cfCategory)?.type === 'operating')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const tbInvesting = mappingResults
    .filter(r => r.isMapped && getCFCategoryById(r.mapping.cfCategory)?.type === 'investing')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const tbFinancing = mappingResults
    .filter(r => r.isMapped && getCFCategoryById(r.mapping.cfCategory)?.type === 'financing')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const tbNetCashFlow = tbOperating + tbInvesting + tbFinancing;
  
  // Compare with cash flow statement
  const cfOperating = cashFlowStatement.operatingCashFlow;
  const cfInvesting = cashFlowStatement.investingCashFlow;
  const cfFinancing = cashFlowStatement.financingCashFlow;
  const cfNetCashFlow = cashFlowStatement.netCashFlow;
  
  // Check for differences
  const operatingDiff = Math.abs(tbOperating - cfOperating);
  const investingDiff = Math.abs(tbInvesting - cfInvesting);
  const financingDiff = Math.abs(tbFinancing - cfFinancing);
  const netDiff = Math.abs(tbNetCashFlow - cfNetCashFlow);
  
  const tolerance = opts.tolerance ?? 0.01;
  
  if (operatingDiff > tolerance) {
    differences.push({
      type: 'amount',
      accountCode: 'OPERATING',
      tbAmount: tbOperating,
      cfAmount: cfOperating,
      difference: tbOperating - cfOperating,
      tolerance,
      withinTolerance: false,
      reason: 'Operating cash flow difference',
    });
  }
  
  if (investingDiff > tolerance) {
    differences.push({
      type: 'amount',
      accountCode: 'INVESTING',
      tbAmount: tbInvesting,
      cfAmount: cfInvesting,
      difference: tbInvesting - cfInvesting,
      tolerance,
      withinTolerance: false,
      reason: 'Investing cash flow difference',
    });
  }
  
  if (financingDiff > tolerance) {
    differences.push({
      type: 'amount',
      accountCode: 'FINANCING',
      tbAmount: tbFinancing,
      cfAmount: cfFinancing,
      difference: tbFinancing - cfFinancing,
      tolerance,
      withinTolerance: false,
      reason: 'Financing cash flow difference',
    });
  }
  
  if (netDiff > tolerance) {
    differences.push({
      type: 'amount',
      accountCode: 'NET_CASH_FLOW',
      tbAmount: tbNetCashFlow,
      cfAmount: cfNetCashFlow,
      difference: tbNetCashFlow - cfNetCashFlow,
      tolerance,
      withinTolerance: false,
      reason: 'Net cash flow difference',
    });
  }
  
  const isBalanced = differences.length === 0;
  
  return {
    id: `reconciliation_${trialBalance.period.start.getFullYear()}_${trialBalance.period.start.getMonth() + 1}`,
    trialBalance,
    cashFlowStatement,
    mappings: mappingResults,
    totalOperating: tbOperating,
    totalInvesting: tbInvesting,
    totalFinancing: tbFinancing,
    netCashFlow: tbNetCashFlow,
    isBalanced,
    differences,
    generatedAt: new Date(),
  };
}

// ============================================================================
// Validation and Consistency
// ============================================================================

/**
 * Validate cash flow statement consistency
 */
export function validateCFConsistency(
  statement: CashFlowStatement,
  trialBalance: TrialBalance,
  mappings: TBCFMapping[],
  _opts: { tolerance?: number } = {}
): CFConsistencyCheck {
  const inconsistencies: ConsistencyIssue[] = [];
  const recommendations: string[] = [];
  
  // Check if all trial balance accounts are mapped
  const unmappedAccounts = trialBalance.accounts.filter(account => {
    const mapping = findApplicableMapping(account, mappings);
    return !mapping;
  });
  
  if (unmappedAccounts.length > 0) {
    inconsistencies.push({
      type: 'completeness',
      accountCode: 'UNMAPPED',
      tbAmount: unmappedAccounts.reduce((sum, acc) => sum + acc.closingBalance, 0),
      cfAmount: 0,
      difference: 0,
      severity: 'warning',
      description: `${unmappedAccounts.length} accounts are not mapped to cash flow categories`,
    });
    
    recommendations.push('Create mappings for unmapped accounts');
  }
  
  // Check for duplicate mappings
  const duplicateMappings = findDuplicateMappings(mappings);
  if (duplicateMappings.length > 0) {
    inconsistencies.push({
      type: 'classification',
      accountCode: 'DUPLICATE',
      tbAmount: 0,
      cfAmount: 0,
      difference: 0,
      severity: 'error',
      description: `${duplicateMappings.length} duplicate mappings found`,
    });
    
    recommendations.push('Resolve duplicate mappings');
  }
  
  // Check for conflicting mappings
  const conflictingMappings = findConflictingMappings(mappings);
  if (conflictingMappings.length > 0) {
    inconsistencies.push({
      type: 'classification',
      accountCode: 'CONFLICT',
      tbAmount: 0,
      cfAmount: 0,
      difference: 0,
      severity: 'error',
      description: `${conflictingMappings.length} conflicting mappings found`,
    });
    
    recommendations.push('Resolve conflicting mappings');
  }
  
  const isConsistent = inconsistencies.filter(i => i.severity === 'error').length === 0;
  
  return {
    statement,
    trialBalance,
    isConsistent,
    inconsistencies,
    recommendations,
  };
}

/**
 * Validate cash flow statement
 */
export function validateCashFlowStatement(statement: CashFlowStatement, trialBalance: TrialBalance): CFValidationResult {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const recommendations: string[] = [];
  
  // Check if statement has required sections
  if (statement.operating.length === 0) {
    issues.push({
      path: 'operating',
      message: 'Cash flow statement must have operating activities',
      severity: 'error',
      code: 'REQUIRED',
    });
  }
  
  if (statement.investing.length === 0) {
    warnings.push({
      path: 'investing',
      message: 'No investing activities found',
      severity: 'warning',
      code: 'REQUIRED',
    });
  }
  
  if (statement.financing.length === 0) {
    warnings.push({
      path: 'financing',
      message: 'No financing activities found',
      severity: 'warning',
      code: 'REQUIRED',
    });
  }
  
  // Check if net cash flow is reasonable
  if (Math.abs(statement.netCashFlow) > 1000000) {
    warnings.push({
      path: 'netCashFlow',
      message: 'Net cash flow is unusually large',
      severity: 'warning',
      code: 'RANGE',
    });
  }
  
  // Check if statement balances
  const calculatedNetCashFlow = statement.operatingCashFlow + statement.investingCashFlow + statement.financingCashFlow;
  if (Math.abs(statement.netCashFlow - calculatedNetCashFlow) > 0.01) {
    issues.push({
      path: 'netCashFlow',
      message: `Net cash flow ${statement.netCashFlow} does not match calculated total ${calculatedNetCashFlow}`,
      severity: 'error',
      code: 'BALANCE',
    });
  }
  
  // Add recommendations
  if (statement.operatingCashFlow < 0) {
    recommendations.push('Consider improving operating cash flow');
  }
  
  if (statement.investingCashFlow > 0) {
    recommendations.push('Review investing activities - positive cash flow may indicate asset sales');
  }
  
  if (statement.financingCashFlow < 0) {
    recommendations.push('Review financing activities - negative cash flow may indicate debt repayment');
  }
  
  return {
    statement,
    trialBalance,
    isValid: issues.length === 0,
    issues,
    warnings,
    recommendations,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function findApplicableMapping(account: TrialBalanceAccount, mappings: TBCFMapping[]): TBCFMapping | undefined {
  // Find active mappings for this account
  const applicableMappings = mappings.filter(mapping => 
    mapping.active && 
    mapping.accountCode === account.accountCode &&
    (!mapping.expiryDate || mapping.expiryDate > new Date())
  );
  
  if (applicableMappings.length === 0) {
    return undefined;
  }
  
  // Return the highest priority mapping
  return applicableMappings.reduce((highest, current) => 
    current.priority > highest.priority ? current : highest
  );
}

function createCFStatementLine(account: TrialBalanceAccount, _mapping: TBCFMapping): StatementLine {
  return {
    id: `cf_line_${account.accountCode}_${Date.now()}`,
    lineNumber: 1, // Would be determined by CF statement structure
    description: account.accountName,
    accountCode: account.accountCode,
    amount: Math.abs(account.closingBalance),
    sign: account.closingBalance >= 0 ? 'positive' : 'negative',
    level: 0,
    isSubtotal: false,
    children: [],
    notes: [],
  };
}

function calculateCFAmount(account: TrialBalanceAccount, mapping: TBCFMapping): number {
  // 1) choose source
  const amountSource = mapping.amountSource ?? 'closingBalance';
  const raw =
    amountSource === 'movement'
      ? computeAccountMovement(account)
      : account.closingBalance;

  // 2) apply condition chain (doesn't mutate by default, but allows capping via greater_than/less_than)
  let amount = raw;
  const matches = evaluateConditionsChain(account, mapping.conditions);
  if (matches) {
    for (const condition of mapping.conditions) {
      switch (condition.operator) {
        case 'greater_than':
          if (typeof condition.value === 'number' && amount > condition.value) amount = condition.value;
          break;
        case 'less_than':
          if (typeof condition.value === 'number' && amount < condition.value) amount = condition.value;
          break;
        default:
          // no-op for non-mutating operators
          break;
      }
    }
  }

  // 3) normalize sign
  return applySignStrategy(amount, mapping.signStrategy ?? 'natural', mapping.cfCategory);
}

function calculateMappingConfidence(account: TrialBalanceAccount, mapping: TBCFMapping): number {
  let confidence = 0.8; // Base confidence
  
  // Increase confidence for direct mappings
  if (mapping.mappingType === 'direct') {
    confidence += 0.1;
  }
  
  // Decrease confidence for manual mappings
  if (mapping.mappingType === 'manual') {
    confidence -= 0.2;
  }
  
  // Adjust based on account type
  switch (account.accountType) {
    case AccountType.ASSET:
      if (mapping.cfCategory.includes('operating')) {
        confidence += 0.05;
      }
      break;
    case AccountType.LIABILITY:
      if (mapping.cfCategory.includes('financing')) {
        confidence += 0.05;
      }
      break;
    case AccountType.EQUITY:
      if (mapping.cfCategory.includes('financing')) {
        confidence += 0.1;
      }
      break;
  }
  
  return Math.max(0, Math.min(1, confidence));
}

function getCFCategoryById(categoryId: string, registry?: Record<string, CFCategory>): CFCategory | undefined {
  if (registry && registry[categoryId]) return registry[categoryId];
  // Fallback: default to operating but keep id/name (upgrade path keeps API stable)
  return {
    id: categoryId,
    name: categoryId,
    type: 'operating',
    description: `Cash flow category ${categoryId}`,
    childCategories: [],
    displayOrder: 1,
    active: true,
  };
}

function evaluateCondition(account: TrialBalanceAccount, condition: MappingCondition): boolean {
  const value = getAccountFieldValue(account, condition.field);
  
  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'not_equals':
      return value !== condition.value;
    case 'greater_than':
      return typeof value === 'number' && typeof condition.value === 'number' && value > condition.value;
    case 'less_than':
      return typeof value === 'number' && typeof condition.value === 'number' && value < condition.value;
    case 'contains':
      return typeof value === 'string' && typeof condition.value === 'string' && value.includes(condition.value);
    case 'starts_with':
      return typeof value === 'string' && typeof condition.value === 'string' && value.startsWith(condition.value);
    case 'ends_with':
      return typeof value === 'string' && typeof condition.value === 'string' && value.endsWith(condition.value);
    case 'between':
      if (typeof value === 'number' && Array.isArray(condition.value) && condition.value.length === 2) {
        return value >= condition.value[0] && value <= condition.value[1];
      }
      return false;
    default:
      return false;
  }
}

/** Evaluate conditions with left-to-right logical chaining using condition.logicalOperator (default 'and') */
function evaluateConditionsChain(account: TrialBalanceAccount, conditions: MappingCondition[]): boolean {
  if (conditions.length === 0) return true;
  const firstCondition = conditions[0];
  if (!firstCondition) return true;
  let acc = evaluateCondition(account, firstCondition);
  for (let i = 1; i < conditions.length; i++) {
    const condition = conditions[i];
    if (!condition) continue;
    const op = condition.logicalOperator ?? 'and';
    const cur = evaluateCondition(account, condition);
    if (op === 'or') acc = acc || cur;
    else if (op === 'not') acc = acc && !cur;
    else acc = acc && cur; // 'and' default
  }
  return acc;
}

function getAccountFieldValue(account: TrialBalanceAccount, field: string): unknown {
  switch (field) {
    case 'accountCode':
      return account.accountCode;
    case 'accountName':
      return account.accountName;
    case 'accountType':
      return account.accountType;
    case 'openingBalance':
      return account.openingBalance;
    case 'closingBalance':
      return account.closingBalance;
    case 'periodDebits':
      return account.periodDebits;
    case 'periodCredits':
      return account.periodCredits;
    default:
      return undefined;
  }
}

function findDuplicateMappings(mappings: TBCFMapping[]): TBCFMapping[] {
  const duplicates: TBCFMapping[] = [];
  const seen = new Set<string>();
  
  mappings.forEach(mapping => {
    const key = `${mapping.accountCode}_${mapping.cfCategory}`;
    if (seen.has(key)) {
      duplicates.push(mapping);
    } else {
      seen.add(key);
    }
  });
  
  return duplicates;
}

function findConflictingMappings(mappings: TBCFMapping[]): TBCFMapping[] {
  const conflicts: TBCFMapping[] = [];
  const accountMappings = new Map<string, TBCFMapping[]>();
  
  // Group mappings by account code
  mappings.forEach(mapping => {
    if (!accountMappings.has(mapping.accountCode)) {
      accountMappings.set(mapping.accountCode, []);
    }
    accountMappings.get(mapping.accountCode)!.push(mapping);
  });
  
  // Check for conflicts
  accountMappings.forEach(accountMaps => {
    if (accountMaps.length > 1) {
      // Check if mappings have different CF categories
      const categories = new Set(accountMaps.map(m => m.cfCategory));
      if (categories.size > 1) {
        conflicts.push(...accountMaps);
      }
    }
  });
  
  return conflicts;
}

// =========================
// Amount helpers
// =========================
function computeAccountMovement(account: TrialBalanceAccount): number {
  // Uses Δbalance for now (closing - opening). If you prefer debits/credits, swap logic later.
  if (typeof account.openingBalance === 'number' && typeof account.closingBalance === 'number') {
    return account.closingBalance - account.openingBalance;
  }
  // Fallback to period debits/credits if balances unavailable
  if (typeof account.periodDebits === 'number' && typeof account.periodCredits === 'number') {
    return account.periodDebits - account.periodCredits;
  }
  return account.closingBalance ?? 0;
}

function applySignStrategy(amount: number, strategy: SignStrategy, _cfCategoryId: string): number {
  if (strategy === 'invert') return -amount;
  if (strategy === 'byCategory') {
    // Conventional: positive = cash inflow, negative = outflow
    // Operating: ↑assets => outflow; ↑liabilities => inflow (handled upstream by choosing movement sign)
    // Keep simple here; caller chooses movement; byCategory can be extended later with a registry.
    return amount;
  }
  // 'natural'
  return amount;
}
