/**
 * Chart of Accounts Governance Utilities
 * 
 * Chart of Accounts governance helpers for tree operations, rollups, normal balance checks, and posting flags.
 * Provides comprehensive COA management, validation, and reporting category mapping.
 * 
 * @fileoverview COA tree operations, rollups, normal balance validation, and posting flags
 */

import {
  SupportedCurrency,
  AccountType,
} from './accounting-utilities';
import { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import { DateRange } from './date-utilities';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Account {
  code: string;
  name: string;
  type: AccountType;
  class: AccountClass;
  parentCode?: string;
  normalBalance: 'debit' | 'credit';
  postingFlags: PostingFlags;
  reportingCategory: string;
  active: boolean;
  description: string;
  currency?: SupportedCurrency;
  level: number;
  path: string;
}

export interface COATree {
  root: Account;
  children: Map<string, Account[]>;
  parents: Map<string, Account>;
  depth: number;
  maxDepth: number;
  totalAccounts: number;
  accounts: Map<string, Account>;
}

export interface PostingFlags {
  allowPosting: boolean;
  requireApproval: boolean;
  allowNegativeBalance: boolean;
  allowZeroBalance: boolean;
  postingRestrictions: PostingRestriction[];
  userPermissions: UserPermission[];
}

export interface RollupResult {
  account: Account;
  children: Account[];
  childBalances: AccountBalance[];
  rolledUpBalance: number;
  rollupMethod: RollupMethod;
  calculationDate: Date;
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface AccountBalance {
  accountCode: string;
  balance: number;
  currency: SupportedCurrency;
  period: DateRange;
  lastUpdated: Date;
}

export interface BalanceValidationResult {
  account: Account;
  balance: number;
  normalBalance: 'debit' | 'credit';
  isValid: boolean;
  expectedSign: 'positive' | 'negative';
  actualSign: 'positive' | 'negative';
  issues: ValidationIssue[];
}

export interface ReportingCategory {
  id: string;
  name: string;
  type: ReportingType;
  parentCategory?: string;
  accounts: string[];
  mappingRules: MappingRule[];
  displayOrder: number;
  active: boolean;
}

export interface MappingRule {
  id: string;
  accountPattern: string;
  reportingCategory: string;
  priority: number;
  active: boolean;
  conditions: MappingCondition[];
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface MappingCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export interface UserPermission {
  userId: string;
  permissions: Permission[];
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface Permission {
  type: PermissionType;
  scope: PermissionScope;
  restrictions?: string[];
}

export interface AccountPath {
  account: Account;
  path: string[];
  depth: number;
  ancestors: Account[];
  descendants: Account[];
}

export interface RollupBalance {
  account: Account;
  balance: number;
  method: RollupMethod;
  children: AccountBalance[];
  calculatedAt: Date;
}

export interface ParentBalance {
  parent: Account;
  balance: number;
  children: AccountBalance[];
  rollupMethod: RollupMethod;
  calculatedAt: Date;
}

export interface BalanceTypeResult {
  account: Account;
  balance: number;
  expectedType: 'debit' | 'credit';
  actualType: 'debit' | 'credit';
  isValid: boolean;
  correction: number;
}

export interface PostingValidationResult {
  account: Account;
  transaction: Transaction;
  isValid: boolean;
  issues: ValidationIssue[];
  requiredApprovals: string[];
  restrictions: PostingRestriction[];
}

export interface PermissionResult {
  user: string;
  account: Account;
  transaction: Transaction;
  hasPermission: boolean;
  missingPermissions: Permission[];
  restrictions: string[];
}

export interface RestrictionResult {
  account: Account;
  transaction: Transaction;
  isRestricted: boolean;
  restrictions: PostingRestriction[];
  canProceed: boolean;
  requiredActions: string[];
}

export interface ClassificationResult {
  account: Account;
  classification: AccountClass;
  isValid: boolean;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface AccountRule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  active: boolean;
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export interface RuleAction {
  type: ActionType;
  parameters: Record<string, unknown>;
  description: string;
}

export interface ReportingPath {
  account: Account;
  path: string[];
  categories: ReportingCategory[];
  mappings: MappingRule[];
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: SupportedCurrency;
  date: Date;
  description: string;
  lines: TransactionLine[];
}

export interface TransactionLine {
  accountCode: string;
  debit: number;
  credit: number;
  description: string;
}

export interface User {
  id: string;
  name: string;
  roles: string[];
  permissions: Permission[];
}

export type AccountClass = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type RollupMethod = 'sum' | 'average' | 'weighted_average' | 'first' | 'last';
export type ReportingType = 'balance_sheet' | 'income_statement' | 'cash_flow' | 'equity' | 'notes';
export type PostingRestriction = 'debit_only' | 'credit_only' | 'no_posting' | 'approval_required';
export type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with';
export type LogicalOperator = 'and' | 'or' | 'not';
export type PermissionType = 'read' | 'write' | 'post' | 'approve' | 'delete';
export type PermissionScope = 'account' | 'category' | 'all';
export type TransactionType = 'journal' | 'payment' | 'receipt' | 'adjustment' | 'reversal';
export type ActionType = 'validate' | 'transform' | 'block' | 'approve' | 'notify';

// ============================================================================
// COA Tree Operations
// ============================================================================

/**
 * Build a hierarchical COA tree from a flat list of accounts
 */
export function buildCOATree(accounts: Account[]): COATree {
  const accountsMap = new Map<string, Account>();
  const childrenMap = new Map<string, Account[]>();
  const parentsMap = new Map<string, Account>();
  
  // Initialize maps
  accounts.forEach(account => {
    accountsMap.set(account.code, account);
    childrenMap.set(account.code, []);
  });
  
  // Build parent-child relationships
  let root: Account | undefined;
  let maxDepth = 0;
  
  accounts.forEach(account => {
    if (account.parentCode) {
      const parent = accountsMap.get(account.parentCode);
      if (parent) {
        parentsMap.set(account.code, parent);
        childrenMap.get(account.parentCode)?.push(account);
        account.level = parent.level + 1;
        account.path = `${parent.path}.${account.code}`;
      } else {
        throw new Error(`Parent account ${account.parentCode} not found for account ${account.code}`);
      }
    } else {
      root = account;
      account.level = 0;
      account.path = account.code;
    }
    
    maxDepth = Math.max(maxDepth, account.level);
  });
  
  if (!root) {
    throw new Error('No root account found in COA');
  }
  
  return {
    root,
    children: childrenMap,
    parents: parentsMap,
    depth: maxDepth,
    maxDepth,
    totalAccounts: accounts.length,
    accounts: accountsMap,
  };
}

/**
 * Validate COA hierarchy for consistency and completeness
 */
export function validateCOAHierarchy(tree: COATree): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check for circular references
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function checkCircular(accountCode: string): void {
    if (recursionStack.has(accountCode)) {
      issues.push({
        path: 'hierarchy',
        message: `Circular reference detected involving account ${accountCode}`,
        severity: 'error',
        code: 'CONSISTENCY',
      });
      return;
    }
    
    if (visited.has(accountCode)) {
      return;
    }
    
    visited.add(accountCode);
    recursionStack.add(accountCode);
    
    const account = tree.accounts.get(accountCode);
    if (account?.parentCode) {
      checkCircular(account.parentCode);
    }
    
    recursionStack.delete(accountCode);
  }
  
  // Check all accounts for circular references
  tree.accounts.forEach((_, accountCode) => {
    checkCircular(accountCode);
  });
  
  // Check for orphaned accounts
  tree.accounts.forEach((account, accountCode) => {
    if (account.parentCode && !tree.accounts.has(account.parentCode)) {
      issues.push({
        path: 'parentCode',
        message: `Account ${accountCode} references non-existent parent ${account.parentCode}`,
        severity: 'error',
        code: 'REQUIRED',
      });
    }
  });
  
  // Check for duplicate account codes
  const codes = new Set<string>();
  tree.accounts.forEach((_, accountCode) => {
    if (codes.has(accountCode)) {
      issues.push({
        path: 'code',
        message: `Duplicate account code: ${accountCode}`,
        severity: 'error',
        code: 'CONSISTENCY',
      });
    }
    codes.add(accountCode);
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Find the complete path from root to a specific account
 */
export function findAccountPath(tree: COATree, accountCode: string): AccountPath {
  const account = tree.accounts.get(accountCode);
  if (!account) {
    throw new Error(`Account ${accountCode} not found in COA tree`);
  }
  
  const path: string[] = [];
  const ancestors: Account[] = [];
  let current: Account | undefined = account;
  
  // Build path from leaf to root
  while (current) {
    path.unshift(current.code);
    ancestors.unshift(current);
    current = tree.parents.get(current.code);
  }
  
  // Get descendants
  const descendants: Account[] = [];
  function collectDescendants(acc: Account): void {
    const children = tree.children.get(acc.code) || [];
    descendants.push(...children);
    children.forEach(collectDescendants);
  }
  collectDescendants(account);
  
  return {
    account,
    path,
    depth: account.level,
    ancestors,
    descendants,
  };
}

/**
 * Get all direct children of an account
 */
export function getAccountChildren(tree: COATree, parentCode: string): Account[] {
  return tree.children.get(parentCode) || [];
}

/**
 * Get all parent accounts up to the root
 */
export function getAccountParents(tree: COATree, accountCode: string): Account[] {
  const parents: Account[] = [];
  let current = tree.parents.get(accountCode);
  
  while (current) {
    parents.push(current);
    current = tree.parents.get(current.code);
  }
  
  return parents;
}

// ============================================================================
// Rollup Calculations
// ============================================================================

/**
 * Calculate account rollups from child account balances
 */
export function calculateAccountRollups(tree: COATree, balances: AccountBalance[]): RollupResult {
  const issues: ValidationIssue[] = [];
  const rollupResults: RollupResult[] = [];
  
  // Group balances by account code
  const balanceMap = new Map<string, AccountBalance>();
  balances.forEach(balance => {
    balanceMap.set(balance.accountCode, balance);
  });
  
  // Process each account that has children
  tree.accounts.forEach((account) => {
    const children = tree.children.get(account.code) || [];
    if (children.length === 0) {
      return; // Skip leaf accounts
    }
    
    const childBalances: AccountBalance[] = [];
    let rolledUpBalance = 0;
    
    // Collect child balances
    children.forEach(child => {
      const balance = balanceMap.get(child.code);
      if (balance) {
        childBalances.push(balance);
        rolledUpBalance += balance.balance;
      } else {
        issues.push({
          path: 'balance',
          message: `No balance found for child account ${child.code}`,
          severity: 'warning',
          code: 'FORMAT',
        });
      }
    });
    
    rollupResults.push({
      account,
      children,
      childBalances,
      rolledUpBalance,
      rollupMethod: 'sum',
      calculationDate: new Date(),
      isValid: issues.length === 0,
      issues: issues.filter(i => i.path === 'balance'),
    });
  });
  
  // Return the first rollup result (or create a summary)
  if (rollupResults.length === 0) {
    throw new Error('No rollup calculations performed');
  }
  
  return rollupResults[0]!;
}

/**
 * Rollup account balances using specified method
 */
export function rollupAccountBalances(account: Account, children: Account[]): RollupBalance {
  // This is a simplified implementation - in practice, you'd need actual balance data
  const childBalances: AccountBalance[] = children.map(child => ({
    accountCode: child.code,
    balance: 0, // Would be populated from actual data
    currency: 'USD' as SupportedCurrency,
    period: { start: new Date(), end: new Date() },
    lastUpdated: new Date(),
  }));
  
  const balance = childBalances.reduce((sum, cb) => sum + cb.balance, 0);
  
  return {
    account,
    balance,
    method: 'sum',
    children: childBalances,
    calculatedAt: new Date(),
  };
}

/**
 * Validate rollup calculation for accuracy
 */
export function validateRollupCalculation(rollup: RollupResult): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check if rollup balance matches sum of children
  const expectedBalance = rollup.childBalances.reduce((sum, cb) => sum + cb.balance, 0);
  const difference = Math.abs(rollup.rolledUpBalance - expectedBalance);
  
  if (difference > 0.01) { // Allow for minor rounding differences
    issues.push({
      path: 'rolledUpBalance',
      message: `Rollup balance ${rollup.rolledUpBalance} does not match sum of children ${expectedBalance}`,
      severity: 'error',
        code: 'BALANCE',
    });
  }
  
  // Check for missing child balances
  if (rollup.children.length !== rollup.childBalances.length) {
    issues.push({
      path: 'childBalances',
      message: `Expected ${rollup.children.length} child balances, found ${rollup.childBalances.length}`,
      severity: 'warning',
        code: 'FORMAT',
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
 * Calculate parent balances for all accounts in the tree
 */
export function calculateParentBalances(tree: COATree, balances: AccountBalance[]): ParentBalance[] {
  const parentBalances: ParentBalance[] = [];
  const balanceMap = new Map<string, AccountBalance>();
  
  // Group balances by account code
  balances.forEach(balance => {
    balanceMap.set(balance.accountCode, balance);
  });
  
  // Process each parent account
  tree.accounts.forEach((account) => {
    const children = tree.children.get(account.code) || [];
    if (children.length === 0) {
      return; // Skip leaf accounts
    }
    
    const childBalances: AccountBalance[] = [];
    let totalBalance = 0;
    
    children.forEach(child => {
      const balance = balanceMap.get(child.code);
      if (balance) {
        childBalances.push(balance);
        totalBalance += balance.balance;
      }
    });
    
    parentBalances.push({
      parent: account,
      balance: totalBalance,
      children: childBalances,
      rollupMethod: 'sum',
      calculatedAt: new Date(),
    });
  });
  
  return parentBalances;
}

// ============================================================================
// Normal Balance Checks
// ============================================================================

/**
 * Validate account balance against its normal balance type
 */
export function validateNormalBalance(account: Account, balance: number): BalanceValidationResult {
  const expectedSign = account.normalBalance === 'debit' ? 'positive' : 'negative';
  const actualSign = balance >= 0 ? 'positive' : 'negative';
  const isValid = expectedSign === actualSign;
  
  const issues: ValidationIssue[] = [];
  if (!isValid) {
    issues.push({
      path: 'balance',
      message: `Account ${account.code} has ${actualSign} balance but normal balance is ${account.normalBalance}`,
      severity: 'error',
        code: 'BALANCE',
    });
  }
  
  return {
    account,
    balance,
    normalBalance: account.normalBalance,
    isValid,
    expectedSign,
    actualSign,
    issues,
  };
}

/**
 * Check account balance type and provide correction
 */
export function checkAccountBalanceType(account: Account, balance: number): BalanceTypeResult {
  const expectedType = account.normalBalance;
  const actualType = balance >= 0 ? 'debit' : 'credit';
  const isValid = expectedType === actualType;
  
  let correction = 0;
  if (!isValid) {
    correction = -balance; // Flip the sign
  }
  
  return {
    account,
    balance,
    expectedType,
    actualType,
    isValid,
    correction,
  };
}

/**
 * Validate balance against normal balance for debit/credit amounts
 */
export function validateBalanceAgainstNormal(account: Account, debit: number, credit: number): BalanceValidationResult {
  const netBalance = debit - credit;
  return validateNormalBalance(account, netBalance);
}

/**
 * Correct balance sign to match normal balance
 */
export function correctBalanceSign(account: Account, balance: number): number {
  const validation = validateNormalBalance(account, balance);
  if (!validation.isValid) {
    return -balance;
  }
  return balance;
}

// ============================================================================
// Posting Flag Management
// ============================================================================

/**
 * Validate posting flags for a transaction
 */
export function validatePostingFlags(account: Account, transaction: Transaction): PostingValidationResult {
  const issues: ValidationIssue[] = [];
  const requiredApprovals: string[] = [];
  const restrictions: PostingRestriction[] = [];
  
  // Check if posting is allowed
  if (!account.postingFlags.allowPosting) {
    issues.push({
      path: 'posting',
      message: `Posting not allowed for account ${account.code}`,
      severity: 'error',
        code: 'REQUIRED',
    });
  }
  
  // Check if approval is required
  if (account.postingFlags.requireApproval) {
    requiredApprovals.push(`Account ${account.code} requires approval`);
  }
  
  // Check posting restrictions
  account.postingFlags.postingRestrictions.forEach(restriction => {
    restrictions.push(restriction);
    
    switch (restriction) {
      case 'debit_only':
        if (transaction.lines.some(line => line.credit > 0)) {
          issues.push({
            path: 'posting',
            message: `Account ${account.code} only allows debit postings`,
            severity: 'error',
            code: 'BALANCE',
          });
        }
        break;
      case 'credit_only':
        if (transaction.lines.some(line => line.debit > 0)) {
          issues.push({
            path: 'posting',
            message: `Account ${account.code} only allows credit postings`,
            severity: 'error',
            code: 'BALANCE',
          });
        }
        break;
      case 'no_posting':
        issues.push({
          path: 'posting',
          message: `No posting allowed for account ${account.code}`,
          severity: 'error',
          code: 'REQUIRED',
        });
        break;
    }
  });
  
  return {
    account,
    transaction,
    isValid: issues.length === 0,
    issues,
    requiredApprovals,
    restrictions,
  };
}

/**
 * Check user permissions for posting to an account
 */
export function checkPostingPermissions(account: Account, user: User, transaction: Transaction): PermissionResult {
  const missingPermissions: Permission[] = [];
  const restrictions: string[] = [];
  
  // Check user permissions
  const hasWritePermission = user.permissions.some(p => 
    p.type === 'write' && (p.scope === 'all' || p.scope === 'account')
  );
  
  if (!hasWritePermission) {
    missingPermissions.push({
      type: 'write',
      scope: 'account',
    });
  }
  
  // Check account-specific permissions
  const accountPermission = account.postingFlags.userPermissions.find(up => up.userId === user.id);
  if (accountPermission) {
    const hasAccountPermission = accountPermission.permissions.some(p => p.type === 'write');
    if (!hasAccountPermission) {
      missingPermissions.push({
        type: 'write',
        scope: 'account',
      });
    }
  }
  
  return {
    user: user.id,
    account,
    transaction,
    hasPermission: missingPermissions.length === 0,
    missingPermissions,
    restrictions,
  };
}

/**
 * Update posting flags for an account
 */
export function updatePostingFlags(account: Account, flags: PostingFlags): Account {
  return {
    ...account,
    postingFlags: flags,
  };
}

/**
 * Validate posting restrictions
 */
export function validatePostingRestrictions(account: Account, transaction: Transaction): RestrictionResult {
  const restrictions: PostingRestriction[] = [];
  const requiredActions: string[] = [];
  let isRestricted = false;
  let canProceed = true;
  
  account.postingFlags.postingRestrictions.forEach(restriction => {
    restrictions.push(restriction);
    
    switch (restriction) {
      case 'debit_only':
        if (transaction.lines.some(line => line.credit > 0)) {
          isRestricted = true;
          canProceed = false;
          requiredActions.push('Remove credit entries');
        }
        break;
      case 'credit_only':
        if (transaction.lines.some(line => line.debit > 0)) {
          isRestricted = true;
          canProceed = false;
          requiredActions.push('Remove debit entries');
        }
        break;
      case 'no_posting':
        isRestricted = true;
        canProceed = false;
        requiredActions.push('Account does not allow posting');
        break;
      case 'approval_required':
        isRestricted = true;
        requiredActions.push('Obtain approval before posting');
        break;
    }
  });
  
  return {
    account,
    transaction,
    isRestricted,
    restrictions,
    canProceed,
    requiredActions,
  };
}

// ============================================================================
// Account Class Validation
// ============================================================================

/**
 * Validate account class against expected class
 */
export function validateAccountClass(account: Account, expectedClass: AccountClass): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (account.class !== expectedClass) {
    issues.push({
      path: 'class',
      message: `Account ${account.code} has class ${account.class} but expected ${expectedClass}`,
      severity: 'error',
        code: 'CONSISTENCY',
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
 * Check account classification and provide recommendations
 */
export function checkAccountClassification(account: Account): ClassificationResult {
  const issues: ValidationIssue[] = [];
  const recommendations: string[] = [];
  
  // Validate account type vs class consistency
  const expectedClass = getExpectedClassFromType(account.type);
  if (account.class !== expectedClass) {
    issues.push({
      path: 'class',
      message: `Account class ${account.class} does not match type ${account.type}`,
      severity: 'warning',
        code: 'CONSISTENCY',
    });
    recommendations.push(`Consider changing class to ${expectedClass}`);
  }
  
  // Validate normal balance vs class
  const expectedNormalBalance = getExpectedNormalBalance(account.class);
  if (account.normalBalance !== expectedNormalBalance) {
    issues.push({
      path: 'normalBalance',
      message: `Normal balance ${account.normalBalance} does not match class ${account.class}`,
      severity: 'warning',
        code: 'CONSISTENCY',
    });
    recommendations.push(`Consider changing normal balance to ${expectedNormalBalance}`);
  }
  
  return {
    account,
    classification: account.class,
    isValid: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Validate account hierarchy consistency
 */
export function validateAccountHierarchy(account: Account, parent: Account): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check if parent and child have compatible classes
  if (!areClassesCompatible(parent.class, account.class)) {
    issues.push({
      path: 'hierarchy',
      message: `Account ${account.code} class ${account.class} is not compatible with parent ${parent.code} class ${parent.class}`,
      severity: 'error',
        code: 'CONSISTENCY',
    });
  }
  
  // Check if parent and child have compatible normal balances
  if (parent.normalBalance !== account.normalBalance) {
    issues.push({
      path: 'hierarchy',
      message: `Account ${account.code} normal balance ${account.normalBalance} does not match parent ${parent.code} normal balance ${parent.normalBalance}`,
      severity: 'warning',
        code: 'CONSISTENCY',
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
 * Enforce account rules
 */
export function enforceAccountRules(account: Account, rules: AccountRule[]): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  rules.forEach(rule => {
    if (!rule.active) {
      return;
    }
    
    // Check if rule conditions are met
    const conditionsMet = rule.conditions.every(condition => {
      return evaluateCondition(account, condition);
    });
    
    if (conditionsMet) {
      // Execute rule actions
      rule.actions.forEach(action => {
        switch (action.type) {
          case 'validate':
            // Add validation issue
            issues.push({
              path: 'rule',
              message: `Rule ${rule.name}: ${action.description}`,
              severity: 'error',
              code: 'REQUIRED',
            });
            break;
          case 'block':
            issues.push({
              path: 'rule',
              message: `Rule ${rule.name} blocks operation: ${action.description}`,
              severity: 'error',
              code: 'REQUIRED',
            });
            break;
          case 'notify':
            // In a real implementation, this would trigger notifications
            break;
        }
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
// Reporting Category Mapping
// ============================================================================

/**
 * Map account to reporting category
 */
export function mapAccountToReportingCategory(account: Account, rules: MappingRule[]): ReportingCategory {
  // Find applicable mapping rule
  const applicableRule = rules.find(rule => {
    if (!rule.active) {
      return false;
    }
    
    // Check if account code matches pattern
    if (!account.code.match(new RegExp(rule.accountPattern))) {
      return false;
    }
    
    // Check additional conditions
    return rule.conditions.every(condition => {
      return evaluateCondition(account, condition);
    });
  });
  
  if (!applicableRule) {
    throw new Error(`No mapping rule found for account ${account.code}`);
  }
  
  // Return the reporting category (simplified - in practice, you'd look up the actual category)
  return {
    id: applicableRule.reportingCategory,
    name: applicableRule.reportingCategory,
    type: 'balance_sheet',
    accounts: [account.code],
    mappingRules: [applicableRule],
    displayOrder: 1,
    active: true,
  };
}

/**
 * Define reporting mapping rule
 */
export function defineReportingMapping(account: Account, category: ReportingCategory): MappingRule {
  return {
    id: `rule_${account.code}_${category.id}`,
    accountPattern: account.code,
    reportingCategory: category.id,
    priority: 1,
    active: true,
    conditions: [],
    effectiveDate: new Date(),
  };
}

/**
 * Validate reporting mapping
 */
export function validateReportingMapping(mapping: MappingRule): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Validate account pattern
  try {
    new RegExp(mapping.accountPattern);
  } catch {
    issues.push({
      path: 'accountPattern',
      message: `Invalid regex pattern: ${mapping.accountPattern}`,
      severity: 'error',
        code: 'FORMAT',
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
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Get reporting category path for an account
 */
export function getReportingCategoryPath(account: Account, mappings: MappingRule[]): ReportingPath {
  const path: string[] = [];
  const categories: ReportingCategory[] = [];
  const applicableMappings: MappingRule[] = [];
  const issues: ValidationIssue[] = [];
  
  try {
    const category = mapAccountToReportingCategory(account, mappings);
    path.push(category.id);
    categories.push(category);
    applicableMappings.push(...category.mappingRules);
  } catch (error) {
    issues.push({
      path: 'mapping',
      message: `Failed to map account ${account.code} to reporting category`,
      severity: 'error',
        code: 'FORMAT',
    });
  }
  
  return {
    account,
    path,
    categories,
    mappings: applicableMappings,
    isValid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getExpectedClassFromType(type: AccountType): AccountClass {
  switch (type) {
    case 'ASSET':
      return 'asset';
    case 'LIABILITY':
      return 'liability';
    case 'EQUITY':
      return 'equity';
    case 'REVENUE':
      return 'revenue';
    case 'EXPENSE':
      return 'expense';
    default:
      return 'asset';
  }
}

function getExpectedNormalBalance(class_: AccountClass): 'debit' | 'credit' {
  switch (class_) {
    case 'asset':
    case 'expense':
      return 'debit';
    case 'liability':
    case 'equity':
    case 'revenue':
      return 'credit';
    default:
      return 'debit';
  }
}

function areClassesCompatible(parentClass: AccountClass, childClass: AccountClass): boolean {
  // Assets can contain assets
  if (parentClass === 'asset' && childClass === 'asset') {
    return true;
  }
  
  // Liabilities can contain liabilities
  if (parentClass === 'liability' && childClass === 'liability') {
    return true;
  }
  
  // Equity can contain equity
  if (parentClass === 'equity' && childClass === 'equity') {
    return true;
  }
  
  // Revenue can contain revenue
  if (parentClass === 'revenue' && childClass === 'revenue') {
    return true;
  }
  
  // Expenses can contain expenses
  if (parentClass === 'expense' && childClass === 'expense') {
    return true;
  }
  
  return false;
}

function evaluateCondition(account: Account, condition: RuleCondition): boolean {
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
    default:
      return false;
  }
}

function getAccountFieldValue(account: Account, field: string): unknown {
  switch (field) {
    case 'code':
      return account.code;
    case 'name':
      return account.name;
    case 'type':
      return account.type;
    case 'class':
      return account.class;
    case 'normalBalance':
      return account.normalBalance;
    case 'active':
      return account.active;
    case 'level':
      return account.level;
    default:
      return undefined;
  }
}
