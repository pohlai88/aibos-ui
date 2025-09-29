/**
 * Financial Statements Utilities
 * 
 * Financial statements builder for P&L, Balance Sheet, and Cash Flow from trial balance with mapping rules.
 * Provides comprehensive statement generation, mapping, and validation operations.
 * 
 * @fileoverview P&L, Balance Sheet, Cash Flow statement generation and mapping
 */

import type {
  SupportedCurrency,
  AccountType,
} from './accounting-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import type { DateRange } from './date-utilities';
import type { TrialBalance, TrialBalanceAccount } from './trial-balance-utilities';
import type { ConditionOperator, LogicalOperator } from './shared-operators-utilities';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface FinancialStatement {
  id: string;
  type: StatementType;
  period: DateRange;
  entity: string;
  currency: SupportedCurrency;
  lines: StatementLine[];
  subtotals: SubtotalGroup[];
  notes: StatementNote[];
  generatedAt: Date;
  status: StatementStatus;
}

export interface StatementLine {
  id: string;
  lineNumber: number;
  description: string;
  accountCode: string;
  amount: number;
  sign: 'positive' | 'negative';
  level: number;
  isSubtotal: boolean;
  parentLine?: string;
  children: string[];
  notes: string[];
}

export interface StatementMapping {
  id: string;
  accountCode: string;
  statementType: StatementType;
  lineNumber: number;
  lineDescription: string;
  signConvention: SignConvention;
  subtotalGroup?: string;
  priority: number;
  active: boolean;
  conditions: MappingCondition[];
}

export interface PAndLStatement extends FinancialStatement {
  type: 'profit_loss';
  revenue: StatementLine[];
  expenses: StatementLine[];
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  ebitda: number;
}

export interface BalanceSheet extends FinancialStatement {
  type: 'balance_sheet';
  assets: StatementLine[];
  liabilities: StatementLine[];
  equity: StatementLine[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  workingCapital: number;
}

export interface CashFlowStatement extends FinancialStatement {
  type: 'cash_flow';
  operating: StatementLine[];
  investing: StatementLine[];
  financing: StatementLine[];
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
}

export interface EquityStatement extends FinancialStatement {
  type: 'equity';
  openingEquity: StatementLine[];
  changes: StatementLine[];
  closingEquity: StatementLine[];
  totalOpeningEquity: number;
  totalChanges: number;
  totalClosingEquity: number;
}

export interface SubtotalGroup {
  id: string;
  name: string;
  description: string;
  lineNumbers: number[];
  calculationMethod: SubtotalMethod;
  displayOrder: number;
  level: number;
  parentGroup?: string;
}

export interface SubtotalResult {
  group: SubtotalGroup;
  amount: number;
  lines: StatementLine[];
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface StatementNote {
  id: string;
  lineNumber: number;
  noteType: NoteType;
  content: string;
  references: string[];
  disclosureLevel: DisclosureLevel;
  required: boolean;
}

export interface StatementTotals {
  totalDebits: number;
  totalCredits: number;
  netAmount: number;
  subtotals: Map<string, number>;
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface LineOrdering {
  field: string;
  direction: 'asc' | 'desc';
  priority: number;
}

export interface DisclosureRequirement {
  id: string;
  type: DisclosureType;
  description: string;
  required: boolean;
  level: DisclosureLevel;
}

export interface DisclosureNote {
  id: string;
  requirement: DisclosureRequirement;
  content: string;
  lineNumbers: number[];
  generatedAt: Date;
}

export interface BalanceCheckResult {
  statement: FinancialStatement;
  isBalanced: boolean;
  differences: BalanceDifference[];
  issues: ValidationIssue[];
}

export interface BalanceDifference {
  type: 'debit_credit' | 'subtotal' | 'total';
  expected: number;
  actual: number;
  difference: number;
  tolerance: number;
  withinTolerance: boolean;
}

export interface StatementFormat {
  id: string;
  name: string;
  type: StatementType;
  requirements: FormatRequirement[];
  validations: FormatValidation[];
}

export interface FormatRequirement {
  field: string;
  required: boolean;
  format: string;
  description: string;
}

export interface FormatValidation {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface MappingCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export type StatementType = 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'equity' | 'notes';
export type SignConvention = 'natural' | 'inverted' | 'absolute' | 'conditional';
export type SubtotalMethod = 'sum' | 'difference' | 'ratio' | 'percentage';
export type NoteType = 'disclosure' | 'explanation' | 'reconciliation' | 'policy' | 'contingency';
export type DisclosureLevel = 'basic' | 'detailed' | 'comprehensive' | 'regulatory';
export type StatementStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
// ConditionOperator and LogicalOperator imported from shared-operators.ts (SSOT)
export type DisclosureType = 'accounting_policy' | 'contingency' | 'related_party' | 'segment' | 'other';

// ============================================================================
// Statement Generation
// ============================================================================

/**
 * Build Profit & Loss statement from trial balance
 */
export function buildProfitLossStatement(trialBalance: TrialBalance, mapping: StatementMapping[]): PAndLStatement {
  const revenueLines: StatementLine[] = [];
  const expenseLines: StatementLine[] = [];
  const allLines: StatementLine[] = [];
  
  // Process trial balance accounts
  trialBalance.accounts.forEach(account => {
    const accountMapping = mapping.find(m => m.accountCode === account.accountCode);
    if (!accountMapping || accountMapping.statementType !== 'profit_loss') {
      return;
    }
    
    const amount = normalizePresentationSigned(account.closingBalance, account.accountType);
    const line: StatementLine = {
      id: `pl_${account.accountCode}`,
      lineNumber: accountMapping.lineNumber,
      description: accountMapping.lineDescription,
      accountCode: account.accountCode,
      amount: Math.abs(amount),
      sign: amount >= 0 ? 'positive' : 'negative',
      level: 0,
      isSubtotal: false,
      children: [],
      notes: [],
    };
    
    allLines.push(line);
    
    // Categorize as revenue or expense based on account type
    if (account.accountType === 'REVENUE') {
      revenueLines.push(line);
    } else if (account.accountType === 'EXPENSE') {
      expenseLines.push(line);
    }
  });
  
  // Sort lines by line number
  allLines.sort((a, b) => a.lineNumber - b.lineNumber);
  
  // Calculate subtotals
  const cogs = pickByKeywords(expenseLines, ['cost', 'cogs', 'cost of sales', 'cost of goods']);
  const opex = expenseLines.filter(l => !cogs.includes(l));
  const grossProfit = calculateSubtotal(revenueLines) - calculateSubtotal(cogs);
  const operatingIncome = grossProfit - calculateSubtotal(opex);

  // EBITDA = Operating Income + D&A (if tagged; else keyword fallback)
  const da = pickByKeywords(expenseLines, ['depreciation', 'amortization']);
  const ebitda = operatingIncome + calculateSubtotal(da);

  const netIncome = calculateSubtotal(revenueLines) - calculateSubtotal(expenseLines);
  
  return {
    id: `pl_${trialBalance.period.start.getFullYear()}_${trialBalance.period.start.getMonth() + 1}`,
    type: 'profit_loss',
    period: trialBalance.period,
    entity: 'Company',
    currency: 'USD' as SupportedCurrency,
    lines: allLines,
    subtotals: [],
    notes: [],
    generatedAt: new Date(),
    status: 'draft',
    revenue: revenueLines,
    expenses: expenseLines,
    grossProfit,
    operatingIncome,
    netIncome,
    ebitda,
  };
}

/**
 * Build Balance Sheet from trial balance
 */
export function buildBalanceSheet(trialBalance: TrialBalance, mapping: StatementMapping[]): BalanceSheet {
  const assetLines: StatementLine[] = [];
  const liabilityLines: StatementLine[] = [];
  const equityLines: StatementLine[] = [];
  const allLines: StatementLine[] = [];
  
  // Process trial balance accounts
  trialBalance.accounts.forEach(account => {
    const accountMapping = mapping.find(m => m.accountCode === account.accountCode);
    if (!accountMapping || accountMapping.statementType !== 'balance_sheet') {
      return;
    }
    
    const amount = normalizePresentationSigned(account.closingBalance, account.accountType);
    const line: StatementLine = {
      id: `bs_${account.accountCode}`,
      lineNumber: accountMapping.lineNumber,
      description: accountMapping.lineDescription,
      accountCode: account.accountCode,
      amount: Math.abs(amount),
      sign: amount >= 0 ? 'positive' : 'negative',
      level: 0,
      isSubtotal: false,
      children: [],
      notes: [],
    };
    
    allLines.push(line);
    
    // Categorize by account type
    switch (account.accountType) {
      case 'ASSET':
        assetLines.push(line);
        break;
      case 'LIABILITY':
        liabilityLines.push(line);
        break;
      case 'EQUITY':
        equityLines.push(line);
        break;
    }
  });
  
  // Sort lines by line number
  allLines.sort((a, b) => a.lineNumber - b.lineNumber);
  
  // Calculate totals
  const totalAssets = calculateSubtotal(assetLines);
  const totalLiabilities = calculateSubtotal(liabilityLines);
  const totalEquity = calculateSubtotal(equityLines);
  
  // Calculate working capital (current assets - current liabilities)
  const currentAssets = preferMappingGroup(assetLines, mapping, 'current_assets')
    ?? assetLines.filter(l => hasAny(l.description, ['current', 'cash', 'bank']));
  const currentLiabilities = preferMappingGroup(liabilityLines, mapping, 'current_liabilities')
    ?? liabilityLines.filter(l => hasAny(l.description, ['current', 'payable', 'overdraft']));
  const workingCapital = calculateSubtotal(currentAssets) - calculateSubtotal(currentLiabilities);
  
  return {
    id: `bs_${trialBalance.period.end.getFullYear()}_${trialBalance.period.end.getMonth() + 1}`,
    type: 'balance_sheet',
    period: trialBalance.period,
    entity: 'Company',
    currency: 'USD' as SupportedCurrency,
    lines: allLines,
    subtotals: [],
    notes: [],
    generatedAt: new Date(),
    status: 'draft',
    assets: assetLines,
    liabilities: liabilityLines,
    equity: equityLines,
    totalAssets,
    totalLiabilities,
    totalEquity,
    workingCapital,
  };
}

/**
 * Build Cash Flow statement from trial balance
 */
export function buildCashFlowStatement(trialBalance: TrialBalance, mapping: StatementMapping[]): CashFlowStatement {
  const operatingLines: StatementLine[] = [];
  const investingLines: StatementLine[] = [];
  const financingLines: StatementLine[] = [];
  const allLines: StatementLine[] = [];
  
  // Process trial balance accounts
  trialBalance.accounts.forEach(account => {
    const accountMapping = mapping.find(m => m.accountCode === account.accountCode);
    if (!accountMapping || accountMapping.statementType !== 'cash_flow') {
      return;
    }
    
    const amount = normalizePresentationSigned(account.closingBalance, account.accountType);
    const line: StatementLine = {
      id: `cf_${account.accountCode}`,
      lineNumber: accountMapping.lineNumber,
      description: accountMapping.lineDescription,
      accountCode: account.accountCode,
      amount: Math.abs(amount),
      sign: amount >= 0 ? 'positive' : 'negative',
      level: 0,
      isSubtotal: false,
      children: [],
      notes: [],
    };
    
    allLines.push(line);
    
    // Categorize by cash flow type based on mapping
    if (accountMapping.subtotalGroup === 'operating') {
      operatingLines.push(line);
    } else if (accountMapping.subtotalGroup === 'investing') {
      investingLines.push(line);
    } else if (accountMapping.subtotalGroup === 'financing') {
      financingLines.push(line);
    }
  });
  
  // Sort lines by line number
  allLines.sort((a, b) => a.lineNumber - b.lineNumber);
  
  // Calculate cash flow totals
  const operatingCashFlow = calculateSubtotal(operatingLines);
  const investingCashFlow = calculateSubtotal(investingLines);
  const financingCashFlow = calculateSubtotal(financingLines);
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
  
  // Opening & closing cash: prefer mapping group 'cash', else keyword fallback
  const cashMappedCodes = mapping
    .filter(m => m.statementType === 'cash_flow' && (m.subtotalGroup === 'cash' || /cash|bank/i.test(m.lineDescription)))
    .map(m => m.accountCode);
  const cashAccounts = trialBalance.accounts.filter(a =>
    cashMappedCodes.includes(a.accountCode) || /cash|bank|overdraft/i.test(a.accountCode + ' ' + (a as unknown).description || ''));
  const openingCash = sumOpeningCash(cashAccounts);
  const closingCash = openingCash + netCashFlow;
  
  return {
    id: `cf_${trialBalance.period.start.getFullYear()}_${trialBalance.period.start.getMonth() + 1}`,
    type: 'cash_flow',
    period: trialBalance.period,
    entity: 'Company',
    currency: 'USD' as SupportedCurrency,
    lines: allLines,
    subtotals: [],
    notes: [],
    generatedAt: new Date(),
    status: 'draft',
    operating: operatingLines,
    investing: investingLines,
    financing: financingLines,
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
    netCashFlow,
    openingCash,
    closingCash,
  };
}

/**
 * Build Statement of Equity from trial balance
 */
export function buildStatementOfEquity(trialBalance: TrialBalance, mapping: StatementMapping[]): EquityStatement {
  const openingEquityLines: StatementLine[] = [];
  const changesLines: StatementLine[] = [];
  const closingEquityLines: StatementLine[] = [];
  const allLines: StatementLine[] = [];
  
  // Process trial balance accounts
  trialBalance.accounts.forEach(account => {
    const accountMapping = mapping.find(m => m.accountCode === account.accountCode);
    if (!accountMapping || accountMapping.statementType !== 'equity') {
      return;
    }
    
    const amount = normalizePresentationSigned(account.closingBalance, account.accountType);
    const line: StatementLine = {
      id: `eq_${account.accountCode}`,
      lineNumber: accountMapping.lineNumber,
      description: accountMapping.lineDescription,
      accountCode: account.accountCode,
      amount: Math.abs(amount),
      sign: amount >= 0 ? 'positive' : 'negative',
      level: 0,
      isSubtotal: false,
      children: [],
      notes: [],
    };
    
    allLines.push(line);
    
    // Categorize by equity type
    if (accountMapping.subtotalGroup === 'opening') {
      openingEquityLines.push(line);
    } else if (accountMapping.subtotalGroup === 'changes') {
      changesLines.push(line);
    } else if (accountMapping.subtotalGroup === 'closing') {
      closingEquityLines.push(line);
    }
  });
  
  // Sort lines by line number
  allLines.sort((a, b) => a.lineNumber - b.lineNumber);
  
  // Calculate totals
  const totalOpeningEquity = calculateSubtotal(openingEquityLines);
  const totalChanges = calculateSubtotal(changesLines);
  const totalClosingEquity = totalOpeningEquity + totalChanges;
  
  return {
    id: `eq_${trialBalance.period.start.getFullYear()}_${trialBalance.period.start.getMonth() + 1}`,
    type: 'equity',
    period: trialBalance.period,
    entity: 'Company',
    currency: 'USD' as SupportedCurrency,
    lines: allLines,
    subtotals: [],
    notes: [],
    generatedAt: new Date(),
    status: 'draft',
    openingEquity: openingEquityLines,
    changes: changesLines,
    closingEquity: closingEquityLines,
    totalOpeningEquity,
    totalChanges,
    totalClosingEquity,
  };
}

// ============================================================================
// Mapping and Rules
// ============================================================================

/**
 * Define statement mapping for an account
 */
export function defineStatementMapping(account: TrialBalanceAccount, statementLine: StatementLine): StatementMapping {
  return {
    id: `mapping_${account.accountCode}_${statementLine.id}`,
    accountCode: account.accountCode,
    statementType: 'balance_sheet', // Default - would be determined by business logic
    lineNumber: statementLine.lineNumber,
    lineDescription: statementLine.description,
    signConvention: 'natural',
    priority: 1,
    active: true,
    conditions: [],
  };
}

/**
 * Validate statement mapping
 */
export function validateStatementMapping(mapping: StatementMapping): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Validate account code
  if (!mapping.accountCode || mapping.accountCode.trim() === '') {
    issues.push({
      path: 'accountCode',
      message: 'Account code is required',
      severity: 'error',
      code: 'REQUIRED',
    });
  }
  
  // Validate line number
  if (mapping.lineNumber < 1) {
    issues.push({
      path: 'lineNumber',
      message: 'Line number must be greater than 0',
      severity: 'error',
      code: 'FORMAT',
    });
  }
  
  // Validate line description
  if (!mapping.lineDescription || mapping.lineDescription.trim() === '') {
    issues.push({
      path: 'lineDescription',
      message: 'Line description is required',
      severity: 'error',
      code: 'REQUIRED',
    });
  }
  
  // Validate conditions
  mapping.conditions.forEach((condition, index) => {
    if (!condition.field || !condition.operator) {
      issues.push({
        path: `conditions[${index}]`,
        message: 'Condition missing required fields',
        severity: 'error',
        code: 'FORMAT',
      });
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Apply sign conventions to amounts
 */
export function applySignConventions(amount: number, accountType: AccountType): number {
  // Kept for backward compatibility; now routes to normalized helper
  return normalizePresentationSigned(amount, accountType);
}

/**
 * Calculate statement totals
 */
export function calculateStatementTotals(statement: FinancialStatement): StatementTotals {
  const issues: ValidationIssue[] = [];
  const subtotals = new Map<string, number>();
  
  let totalDebits = 0;
  let totalCredits = 0;
  
  // Calculate line totals
  statement.lines.forEach(line => {
    if (line.sign === 'positive') {
      totalDebits += line.amount;
    } else {
      totalCredits += line.amount;
    }
  });
  
  // Calculate subtotals
  statement.subtotals.forEach(subtotal => {
    const subtotalAmount = calculateSubtotalByMethod(statement.lines, subtotal);
    subtotals.set(subtotal.id, subtotalAmount);
  });
  
  const netAmount = totalDebits - totalCredits;
  
  // Validate balance
  if (Math.abs(netAmount) > 0.01) {
    issues.push({
      path: 'balance',
      message: `Statement is not balanced. Net amount: ${netAmount}`,
      severity: 'error',
      code: 'BALANCE',
    });
  }
  
  return {
    totalDebits,
    totalCredits,
    netAmount,
    subtotals,
    isValid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// Subtotal Management
// ============================================================================

/**
 * Define subtotal group
 */
export function defineSubtotalGroup(lines: StatementLine[], groupName: string): SubtotalGroup {
  return {
    id: `subtotal_${groupName}`,
    name: groupName,
    description: `Subtotal for ${groupName}`,
    lineNumbers: lines.map(line => line.lineNumber),
    calculationMethod: 'sum',
    displayOrder: 1,
    level: 1,
  };
}

/**
 * Calculate subtotals for a statement
 */
export function calculateSubtotals(statement: FinancialStatement, groups: SubtotalGroup[]): SubtotalResult[] {
  return groups.map(group => {
    const groupLines = statement.lines.filter(line => 
      group.lineNumbers.includes(line.lineNumber)
    );
    
    const amount = calculateSubtotalByMethod(statement.lines, group);
    const issues: ValidationIssue[] = [];
    
    // Validate subtotal calculation
    if (groupLines.length === 0) {
      issues.push({
        path: 'subtotal',
        message: `No lines found for subtotal group ${group.name}`,
        severity: 'warning',
        code: 'FORMAT',
      });
    }
    
    return {
      group,
      amount,
      lines: groupLines,
      isValid: issues.length === 0,
      issues,
    };
  });
}

/**
 * Validate subtotal calculation
 */
export function validateSubtotalCalculation(subtotal: SubtotalResult): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check if subtotal has lines
  if (subtotal.lines.length === 0) {
    issues.push({
      path: 'lines',
      message: `Subtotal group ${subtotal.group.name} has no lines`,
      severity: 'error',
      code: 'FORMAT',
    });
  }
  
  // Validate calculation method
  const expectedAmount = subtotalByMethod(subtotal.group.calculationMethod, subtotal.lines);
  if (Math.abs(subtotal.amount - expectedAmount) > 0.01) {
    issues.push({
      path: 'amount',
      message: `Subtotal amount ${subtotal.amount} does not match calculated amount ${expectedAmount}`,
      severity: 'error',
      code: 'BALANCE',
    });
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Order statement lines
 */
export function orderStatementLines(lines: StatementLine[], ordering: LineOrdering): StatementLine[] {
  return [...lines].sort((a, b) => {
    const aValue = getLineFieldValue(a, ordering.field);
    const bValue = getLineFieldValue(b, ordering.field);
    
    // Handle different types for comparison
    let comparison = 0;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else {
      // Fallback to string comparison
      comparison = String(aValue).localeCompare(String(bValue));
    }
    
    return ordering.direction === 'asc' ? comparison : -comparison;
  });
}

// ============================================================================
// Notes Integration
// ============================================================================

/**
 * Attach statement note
 */
export function attachStatementNote(statement: FinancialStatement, note: StatementNote): FinancialStatement {
  return {
    ...statement,
    notes: [...statement.notes, note],
  };
}

/**
 * Validate statement notes
 */
export function validateStatementNotes(notes: StatementNote[]): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  notes.forEach((note, index) => {
    if (!note.content || note.content.trim() === '') {
      issues.push({
        path: `notes[${index}].content`,
        message: 'Note content is required',
        severity: 'error',
        code: 'REQUIRED',
      });
    }
    
    if (note.lineNumber < 1) {
      issues.push({
        path: `notes[${index}].lineNumber`,
        message: 'Line number must be greater than 0',
        severity: 'error',
        code: 'FORMAT',
      });
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Generate disclosure notes
 */
export function generateDisclosureNotes(requirements: DisclosureRequirement[]): DisclosureNote[] {
  return requirements
    .filter(req => req.required)
    .map(req => ({
      id: `disclosure_${req.id}`,
      requirement: req,
      content: `Disclosure for ${req.description}`,
      lineNumbers: [],
      generatedAt: new Date(),
    }));
}

// ============================================================================
// Statement Validation
// ============================================================================

/**
 * Validate statement completeness
 */
export function validateStatementCompleteness(statement: FinancialStatement): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check if statement has lines
  if (statement.lines.length === 0) {
    issues.push({
      path: 'lines',
      message: 'Statement has no lines',
      severity: 'error',
      code: 'FORMAT',
    });
  }
  
  // Check if statement has required fields
  if (!statement.entity || statement.entity.trim() === '') {
    issues.push({
      path: 'entity',
      message: 'Entity name is required',
      severity: 'error',
      code: 'REQUIRED',
    });
  }
  
  // Check if statement has valid period
  if (!statement.period.start || !statement.period.end) {
    issues.push({
      path: 'period',
      message: 'Statement period is required',
      severity: 'error',
      code: 'REQUIRED',
    });
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Validate statement accuracy against trial balance
 */
export function validateStatementAccuracy(statement: FinancialStatement, trialBalance: TrialBalance): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check if statement amounts match trial balance
  statement.lines.forEach(line => {
    const tbAccount = trialBalance.accounts.find(acc => acc.accountCode === line.accountCode);
    if (!tbAccount) {
      issues.push({
        path: 'line',
        message: `Account ${line.accountCode} not found in trial balance`,
        severity: 'error',
        code: 'FORMAT',
      });
    } else {
      const tbAmount = Math.abs(tbAccount.closingBalance);
      if (Math.abs(line.amount - tbAmount) > 0.01) {
        issues.push({
          path: 'line',
          message: `Line amount ${line.amount} does not match trial balance amount ${tbAmount}`,
          severity: 'error',
          code: 'BALANCE',
        });
      }
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Check statement balances
 */
export function checkStatementBalances(statement: FinancialStatement): BalanceCheckResult {
  const differences: BalanceDifference[] = [];
  const issues: ValidationIssue[] = [];
  
  // Check debit/credit balance
  const totals = calculateStatementTotals(statement);
  if (Math.abs(totals.netAmount) > 0.01) {
    differences.push({
      type: 'debit_credit',
      expected: 0,
      actual: totals.netAmount,
      difference: totals.netAmount,
      tolerance: 0.01,
      withinTolerance: false,
    });
    
    issues.push({
      path: 'balance',
      message: `Statement is not balanced. Net amount: ${totals.netAmount}`,
      severity: 'error',
      code: 'BALANCE',
    });
  }
  
  // Check subtotals
  statement.subtotals.forEach(group => {
    const actual = calculateSubtotalByMethod(statement.lines, group);
    const expected = subtotalByMethod(group.calculationMethod, statement.lines.filter(l => group.lineNumbers.includes(l.lineNumber)));
    if (Math.abs(actual - expected) > 0.01) {
      differences.push({
        type: 'subtotal',
        expected,
        actual,
        difference: actual - expected,
        tolerance: 0.01,
        withinTolerance: Math.abs(actual - expected) <= 0.01,
      });
    }
  });
  
  return {
    statement,
    isBalanced: differences.length === 0,
    differences,
    issues,
  };
}

/**
 * Validate statement format
 */
export function validateStatementFormat(statement: FinancialStatement, format: StatementFormat): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check format requirements
  format.requirements.forEach(req => {
    if (req.required) {
      const value = getStatementFieldValue(statement, req.field);
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        issues.push({
          path: req.field,
          message: `Required field ${req.field} is missing`,
          severity: 'error',
          code: 'REQUIRED',
        });
      }
    }
  });
  
  // Check format validations
  format.validations.forEach(validation => {
    const value = getStatementFieldValue(statement, validation.field);
    if (!evaluateFormatValidation(value, validation.rule)) {
      issues.push({
        path: validation.field,
        message: validation.message,
        severity: validation.severity,
        code: 'FORMAT',
      });
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateSubtotal(lines: StatementLine[]): number {
  return lines.reduce((sum, line) => {
    return sum + (line.sign === 'positive' ? line.amount : -line.amount);
  }, 0);
}

function getLineFieldValue(line: StatementLine, field: string): unknown {
  switch (field) {
    case 'lineNumber':
      return line.lineNumber;
    case 'amount':
      return line.amount;
    case 'description':
      return line.description;
    case 'accountCode':
      return line.accountCode;
    default:
      return undefined;
  }
}

function getStatementFieldValue(statement: FinancialStatement, field: string): unknown {
  switch (field) {
    case 'id':
      return statement.id;
    case 'type':
      return statement.type;
    case 'entity':
      return statement.entity;
    case 'currency':
      return statement.currency;
    case 'status':
      return statement.status;
    default:
      return undefined;
  }
}

function evaluateFormatValidation(value: unknown, rule: string): boolean {
  // Simplified validation - in practice, this would be more comprehensive
  switch (rule) {
    case 'not_empty':
      return value !== undefined && value !== null && value !== '';
    case 'positive_number':
      return typeof value === 'number' && value > 0;
    case 'valid_currency':
      return typeof value === 'string' && value.length >= 3; // defer strict check to SSOT
    default:
      return true;
  }
}

// ============================================================================
// Internal helpers (pure)
// ============================================================================

function normalizePresentationSigned(closingBalance: number, accountType: AccountType): number {
  // Trial balance: debit-positive/credit-negative (typical). Present as:
  // ASSET/EXPENSE positive, LIABILITY/EQUITY/REVENUE negative.
  const creditNaturals = new Set<AccountType>(['LIABILITY','EQUITY','REVENUE'] as unknown);
  const magnitude = Math.abs(closingBalance);
  return creditNaturals.has(accountType) ? -magnitude : magnitude;
}

function hasAny(s: string, keys: string[]): boolean {
  const lower = s.toLowerCase();
  return keys.some(k => lower.includes(k));
}

function pickByKeywords(lines: StatementLine[], keys: string[]): StatementLine[] {
  return lines.filter(l => hasAny(l.description, keys));
}

function preferMappingGroup(lines: StatementLine[], mapping: StatementMapping[], groupName: string): StatementLine[] | null {
  const set = new Set(
    mapping.filter(m => m.subtotalGroup === groupName).map(m => m.lineNumber)
  );
  const picked = lines.filter(l => set.has(l.lineNumber));
  return picked.length ? picked : null;
}

function sumOpeningCash(accounts: TrialBalanceAccount[]): number {
  return accounts.reduce((s, a) => s + (a.openingBalance ?? 0), 0);
}

function subtotalByMethod(method: SubtotalMethod, lines: StatementLine[]): number {
  switch (method) {
    case 'sum': return calculateSubtotal(lines);
    case 'difference': {
      if (lines.length === 0) return 0;
      const first = lines[0];
      if (!first) return 0;
      const rest = lines.slice(1);
      return (first.sign === 'positive' ? first.amount : -first.amount) -
             rest.reduce((acc, l) => acc + (l.sign === 'positive' ? l.amount : -l.amount), 0);
    }
    case 'ratio': {
      if (lines.length < 2) return 0;
      const first = lines[0];
      const second = lines[1];
      if (!first || !second) return 0;
      const a = calculateSubtotal([first]);
      const b = calculateSubtotal([second]);
      return b === 0 ? 0 : a / b;
    }
    case 'percentage': {
      if (lines.length < 2) return 0;
      const first = lines[0];
      const second = lines[1];
      if (!first || !second) return 0;
      const a = calculateSubtotal([first]);
      const b = calculateSubtotal([second]);
      return b === 0 ? 0 : (a / b) * 100;
    }
    default: return calculateSubtotal(lines);
  }
}

function calculateSubtotalByMethod(lines: StatementLine[], group: SubtotalGroup): number {
  const groupLines = lines.filter(l => group.lineNumbers.includes(l.lineNumber));
  return subtotalByMethod(group.calculationMethod, groupLines);
}
