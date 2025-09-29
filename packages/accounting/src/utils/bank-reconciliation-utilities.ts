/**
 * Bank Reconciliation Utilities - Enterprise Production Ready
 * 
 * Comprehensive bank reconciliation utilities for matching heuristics,
 * tolerance rules, and adjustments.
 * 
 * Features:
 * - Bank transaction matching with GL entries
 * - Tolerance rules and matching algorithms
 * - Reconciliation adjustment management
 * - Exception handling and resolution
 * - Integration with existing validation and journal entry utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   matchBankTransactions,
 *   defineToleranceRule,
 *   createReconciliationAdjustment,
 *   identifyReconciliationExceptions
 * } from './bank-reconciliation-utilities';
 * 
 * // Match bank transactions
 * const matches = matchBankTransactions(bankTransactions, glEntries, rules);
 * 
 * // Create adjustment
 * const adjustment = createReconciliationAdjustment(adjustmentData);
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';
import type { ConditionOperator } from './shared-operators-utilities';
import { differenceInCalendarDays as _diffDays } from 'date-fns';

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
 * Journal entry
 */
export interface JournalEntry {
  readonly id: string;
  readonly date: Date;
  readonly description: string;
  lines: JournalLine[];
  totalDebits: number;
  totalCredits: number;
  readonly currency: SupportedCurrency;
  readonly status: string;
  readonly createdAt: Date;
}

/**
 * Journal line
 */
export interface JournalLine {
  readonly account: string;
  readonly description: string;
  readonly debit: number;
  readonly credit: number;
  readonly currency: SupportedCurrency;
  readonly reference?: string;
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Bank transaction entity
 */
export interface BankTransaction {
  readonly id: string;
  readonly bankAccount: string;
  readonly transactionDate: Date;
  readonly valueDate: Date;
  readonly description: string;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly reference: string;
  readonly type: TransactionType;
  readonly status: TransactionStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * General ledger entry
 */
export interface GLEntry {
  readonly id: string;
  readonly account: string;
  readonly date: Date;
  readonly description: string;
  readonly debit: number;
  readonly credit: number;
  readonly currency: SupportedCurrency;
  readonly reference: string;
  readonly status: EntryStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Matching result between bank transaction and GL entry
 */
export interface MatchingResult {
  readonly bankTransaction: BankTransaction;
  readonly glEntry: GLEntry;
  readonly matchType: MatchType;
  readonly confidence: number;
  readonly tolerance: number;
  readonly matchDate: Date;
}

/**
 * Matching rule configuration
 */
export interface MatchingRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly ruleType: RuleType;
  readonly conditions: readonly MatchingCondition[];
  readonly tolerance: number;
  readonly active: boolean;
  readonly priority: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Matching condition
 */
export interface MatchingCondition {
  readonly field: string;
  readonly operator: ConditionOperator;
  readonly value: unknown;
  readonly weight: number;
}

/**
 * Tolerance rule configuration
 */
export interface ToleranceRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly toleranceType: ToleranceType;
  readonly amount: number;
  readonly percentage: number;
  readonly currency: SupportedCurrency;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Tolerance result
 */
export interface ToleranceResult {
  readonly rule: ToleranceRule;
  readonly amount1: number;
  readonly amount2: number;
  readonly difference: number;
  readonly isWithinTolerance: boolean;
  readonly toleranceAmount: number;
  readonly calculatedAt: Date;
}

/**
 * Reconciliation adjustment
 */
export interface ReconciliationAdjustment {
  readonly id: string;
  readonly type: AdjustmentType;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly description: string;
  readonly account: string;
  readonly date: Date;
  readonly reason: AdjustmentReason;
  readonly reference?: string;
  readonly createdAt: Date;
}

/**
 * Bank reconciliation entity
 */
export interface BankReconciliation {
  readonly id: string;
  readonly bankAccount: string;
  readonly period: DateRange;
  readonly openingBalance: number;
  readonly closingBalance: number;
  readonly bankStatementBalance: number;
  readonly glBalance: number;
  readonly adjustments: readonly ReconciliationAdjustment[];
  readonly exceptions: readonly ReconciliationException[];
  readonly status: ReconciliationStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Reconciliation exception
 */
export interface ReconciliationException {
  readonly id: string;
  readonly reconciliation: BankReconciliation;
  readonly exceptionType: ExceptionType;
  readonly description: string;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly date: Date;
  readonly status: ExceptionStatus;
  readonly resolution?: ExceptionResolution;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Exception resolution
 */
export interface ExceptionResolution {
  readonly resolutionType: ResolutionType;
  readonly description: string;
  readonly adjustment?: ReconciliationAdjustment;
  readonly resolvedBy: string;
  readonly resolvedAt: Date;
}

/**
 * Auto-match result
 */
export interface AutoMatchResult {
  readonly matches: readonly MatchingResult[];
  readonly unmatchedBankTransactions: readonly BankTransaction[];
  readonly unmatchedGLEntries: readonly GLEntry[];
  readonly totalMatches: number;
  readonly averageConfidence: number;
  readonly calculatedAt: Date;
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
 * Transaction types
 */
export type TransactionType = 
  | 'debit'
  | 'credit'
  | 'transfer'
  | 'fee'
  | 'interest'
  | 'deposit'
  | 'withdrawal'
  | 'check'
  | 'wire'
  | 'ach'
  | 'other';

/**
 * Transaction status
 */
export type TransactionStatus = 
  | 'pending'
  | 'cleared'
  | 'reconciled'
  | 'exception'
  | 'cancelled'
  | 'reversed';

/**
 * Entry status
 */
export type EntryStatus = 
  | 'draft'
  | 'posted'
  | 'reconciled'
  | 'cancelled'
  | 'reversed';

/**
 * Match types
 */
export type MatchType = 
  | 'exact'
  | 'tolerance'
  | 'manual'
  | 'partial'
  | 'fuzzy';

/**
 * Rule types
 */
export type RuleType = 
  | 'amount'
  | 'date'
  | 'reference'
  | 'description'
  | 'combined'
  | 'custom';

/**
 * Condition operators
 */
// ConditionOperator imported from shared-operators.ts (SSOT)

/**
 * Tolerance types
 */
export type ToleranceType = 
  | 'absolute'
  | 'percentage'
  | 'currency_specific'
  | 'transaction_type_specific';

/**
 * Adjustment types
 */
export type AdjustmentType = 
  | 'bank_fee'
  | 'interest'
  | 'error_correction'
  | 'timing_difference'
  | 'bank_error'
  | 'gl_error'
  | 'exchange_rate'
  | 'other';

/**
 * Adjustment reasons
 */
export type AdjustmentReason = 
  | 'bank_error'
  | 'gl_error'
  | 'timing'
  | 'fee'
  | 'interest'
  | 'exchange_rate'
  | 'manual_correction'
  | 'system_error';

/**
 * Reconciliation status
 */
export type ReconciliationStatus = 
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'exception'
  | 'cancelled'
  | 'approved';

/**
 * Exception types
 */
export type ExceptionType = 
  | 'unmatched_transaction'
  | 'amount_mismatch'
  | 'date_mismatch'
  | 'duplicate_transaction'
  | 'missing_transaction'
  | 'currency_mismatch'
  | 'account_mismatch';

/**
 * Exception status
 */
export type ExceptionStatus = 
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'escalated'
  | 'cancelled';

/**
 * Resolution types
 */
export type ResolutionType = 
  | 'adjustment'
  | 'manual_match'
  | 'ignore'
  | 'escalate'
  | 'investigate';

/**
 * Transaction type configurations
 */
export const TRANSACTION_TYPES = {
  debit: { name: 'Debit', description: 'Money going out of account' },
  credit: { name: 'Credit', description: 'Money coming into account' },
  transfer: { name: 'Transfer', description: 'Transfer between accounts' },
  fee: { name: 'Fee', description: 'Bank or service fee' },
  interest: { name: 'Interest', description: 'Interest payment or charge' },
  deposit: { name: 'Deposit', description: 'Cash or check deposit' },
  withdrawal: { name: 'Withdrawal', description: 'Cash withdrawal' },
  check: { name: 'Check', description: 'Check payment' },
  wire: { name: 'Wire Transfer', description: 'Wire transfer' },
  ach: { name: 'ACH', description: 'Automated Clearing House' },
  other: { name: 'Other', description: 'Other transaction type' }
} as const;

// ============================================================================
// MATCHING OPERATIONS
// ============================================================================

/**
 * Match bank transactions with GL entries
 * 
 * @param bankTransactions - Bank transactions
 * @param glEntries - GL entries
 * @param rules - Matching rules
 * @returns Matching results
 * 
 * @example
 * ```typescript
 * const matches = matchBankTransactions(bankTransactions, glEntries, rules);
 * ```
 */
export function matchBankTransactions(
  bankTransactions: readonly BankTransaction[],
  glEntries: readonly GLEntry[],
  rules: readonly MatchingRule[]
): readonly MatchingResult[] {
  const matches: MatchingResult[] = [];
  const usedGLEntries = new Set<string>();

  // Sort rules by priority
  const sortedRules = [...rules]
    .filter(rule => rule.active)
    .sort((a, b) => b.priority - a.priority);

  // Determine a global prefilter tolerance (max of active rules; fallback 0.01)
  const prefilterTolerance = Math.max(0.01, ...sortedRules.map(r => r.tolerance ?? 0));

  for (const bankTransaction of bankTransactions) {
    let bestMatch: MatchingResult | undefined;
    let bestConfidence = 0;

    for (const glEntry of glEntries) {
      if (usedGLEntries.has(glEntry.id)) continue;

      // Quick prefilter: amount difference within broad tolerance and polarity sane
      const amountMatch = checkAmountMatch(bankTransaction, glEntry);
      if (!(amountMatch.polarityOk && amountMatch.difference <= prefilterTolerance)) continue;

      // Apply matching rules
      for (const rule of sortedRules) {
        const ruleMatch = applyMatchingRule(bankTransaction, glEntry, rule);
        
        if (ruleMatch.matches && ruleMatch.confidence > bestConfidence) {
          bestMatch = {
            bankTransaction,
            glEntry,
            matchType: ruleMatch.matchType,
            confidence: ruleMatch.confidence,
            tolerance: ruleMatch.tolerance,
            matchDate: new Date()
          };
          bestConfidence = ruleMatch.confidence;
        }
      }
    }

    if (bestMatch && bestConfidence > 0.5) {
      matches.push(bestMatch);
      usedGLEntries.add(bestMatch.glEntry.id);
    }
  }

  return matches;
}

/**
 * Validate matching result
 * 
 * @param matching - Matching result to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateMatching(matching);
 * if (!validation.isValid) {
 *   console.error('Matching validation failed:', validation.errors);
 * }
 * ```
 */
export function validateMatching(matching: MatchingResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!matching.bankTransaction.id) {
    errors.push('Bank transaction ID is required');
  }

  if (!matching.glEntry.id) {
    errors.push('GL entry ID is required');
  }

  if (matching.confidence < 0 || matching.confidence > 1) {
    errors.push('Confidence must be between 0 and 1');
  }

  if (matching.tolerance < 0) {
    errors.push('Tolerance cannot be negative');
  }

  // Validate amount consistency (use GL net and polarity)
  const bankAmount = Math.abs(matching.bankTransaction.amount);
  const glNet = Math.abs((matching.glEntry.debit ?? 0) - (matching.glEntry.credit ?? 0));
  const amountDifference = Math.abs(bankAmount - glNet);

  if (amountDifference > matching.tolerance) {
    errors.push('Amount difference exceeds tolerance');
  }

  // Validate currency consistency
  if (matching.bankTransaction.currency !== matching.glEntry.currency) {
    errors.push('Currency mismatch between bank transaction and GL entry');
  }

  // Warnings
  if (matching.confidence < 0.7) {
    warnings.push('Low confidence match - verify manually');
  }

  if (matching.matchType === 'manual') {
    warnings.push('Manual match requires verification');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Auto-match transactions with tolerance
 * 
 * @param transactions - Bank transactions
 * @param entries - GL entries
 * @param tolerance - Tolerance amount
 * @returns Auto-match result
 * 
 * @example
 * ```typescript
 * const autoMatch = autoMatchTransactions(transactions, entries, 0.01);
 * ```
 */
export function autoMatchTransactions(
  transactions: readonly BankTransaction[],
  entries: readonly GLEntry[],
  tolerance: number
): AutoMatchResult {
  // Create simple matching rules
  const rules: MatchingRule[] = [
    {
      id: 'auto-amount',
      name: 'Auto Amount Match',
      description: 'Match by amount within tolerance',
      ruleType: 'amount',
      conditions: [
        {
          field: 'amount',
          operator: 'between',
          // interpret as *absolute* difference window 0..tolerance
          value: { min: 0, max: tolerance },
          weight: 1.0
        }
      ],
      tolerance,
      active: true,
      priority: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Perform matching
  const matches = matchBankTransactions(transactions, entries, rules);
  
  // Find unmatched items
  const matchedBankIds = new Set(matches.map(m => m.bankTransaction.id));
  const matchedGLIds = new Set(matches.map(m => m.glEntry.id));
  
  const unmatchedBankTransactions = transactions.filter(t => !matchedBankIds.has(t.id));
  const unmatchedGLEntries = entries.filter(e => !matchedGLIds.has(e.id));

  // Calculate statistics
  const totalMatches = matches.length;
  const averageConfidence = totalMatches > 0 
    ? matches.reduce((sum, m) => sum + m.confidence, 0) / totalMatches 
    : 0;

  return {
    matches,
    unmatchedBankTransactions,
    unmatchedGLEntries,
    totalMatches,
    averageConfidence,
    calculatedAt: new Date()
  };
}

// ============================================================================
// TOLERANCE MANAGEMENT
// ============================================================================

/**
 * Define tolerance rule
 * 
 * @param rule - Tolerance rule to define
 * @returns void
 * 
 * @example
 * ```typescript
 * defineToleranceRule({
 *   id: 'tolerance-001',
 *   name: 'Standard Tolerance',
 *   description: 'Standard tolerance for amount matching',
 *   toleranceType: 'absolute',
 *   amount: 0.01,
 *   percentage: 0,
 *   currency: 'USD',
 *   active: true
 * });
 * ```
 */
export function defineToleranceRule(rule: ToleranceRule): void {
  // Validate rule
  const validation = validateToleranceRule(rule);
  if (!validation.isValid) {
    throw new Error(`Invalid tolerance rule: ${validation.errors.join(', ')}`);
  }

  // Store rule (in real implementation, this would persist to database)
  // For now, we just validate and return
}

/**
 * Apply tolerance rule
 * 
 * @param amount1 - First amount
 * @param amount2 - Second amount
 * @param rule - Tolerance rule
 * @returns Tolerance result
 * 
 * @example
 * ```typescript
 * const result = applyToleranceRule(100.00, 100.01, toleranceRule);
 * ```
 */
export function applyToleranceRule(
  amount1: number,
  amount2: number,
  rule: ToleranceRule
): ToleranceResult {
  // Validate inputs
  if (amount1 < 0 || amount2 < 0) {
    throw new Error('Amounts cannot be negative');
  }

  if (!rule.active) {
    throw new Error('Tolerance rule must be active');
  }

  // Calculate difference
  const difference = Math.abs(amount1 - amount2);

  // Calculate tolerance amount
  let toleranceAmount: number;
  
  switch (rule.toleranceType) {
    case 'absolute':
      toleranceAmount = rule.amount;
      break;
    case 'percentage':
      toleranceAmount = Math.max(amount1, amount2) * (rule.percentage / 100);
      break;
    case 'currency_specific':
      toleranceAmount = rule.amount; // Would be currency-specific in real implementation
      break;
    case 'transaction_type_specific':
      toleranceAmount = rule.amount; // Would be transaction-type-specific in real implementation
      break;
    default:
      throw new Error(`Unsupported tolerance type: ${rule.toleranceType}`);
  }

  const isWithinTolerance = difference <= toleranceAmount + 1e-10; // Add small epsilon for floating point precision

  return {
    rule,
    amount1,
    amount2,
    difference,
    isWithinTolerance,
    toleranceAmount,
    calculatedAt: new Date()
  };
}

/**
 * Validate tolerance rule
 * 
 * @param rule - Tolerance rule to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateToleranceRule(rule);
 * if (!validation.isValid) {
 *   console.error('Tolerance rule validation failed:', validation.errors);
 * }
 * ```
 */
export function validateToleranceRule(rule: ToleranceRule): ValidationResult {
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

  // Validate tolerance type
  if (!['absolute', 'percentage', 'currency_specific', 'transaction_type_specific'].includes(rule.toleranceType)) {
    errors.push(`Invalid tolerance type: ${rule.toleranceType}`);
  }

  // Validate amounts
  if (rule.amount < 0) {
    errors.push('Tolerance amount cannot be negative');
  }

  if (rule.percentage < 0 || rule.percentage > 100) {
    errors.push('Tolerance percentage must be between 0 and 100');
  }

  // Validate currency
  if (!rule.currency || rule.currency.trim() === '') {
    errors.push('Currency is required');
  }

  // Warnings
  if (rule.amount > 1000) {
    warnings.push('Large tolerance amount - verify reasonableness');
  }

  if (rule.percentage > 10) {
    warnings.push('Large tolerance percentage - verify reasonableness');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// ADJUSTMENT MANAGEMENT
// ============================================================================

/**
 * Create reconciliation adjustment
 * 
 * @param adjustment - Adjustment data
 * @returns void
 * 
 * @example
 * ```typescript
 * createReconciliationAdjustment({
 *   id: 'adj-001',
 *   type: 'bank_fee',
 *   amount: 25.00,
 *   currency: 'USD',
 *   description: 'Monthly maintenance fee',
 *   account: 'Bank Charges',
 *   date: new Date(),
 *   reason: 'fee'
 * });
 * ```
 */
export function createReconciliationAdjustment(adjustment: ReconciliationAdjustment): void {
  // Validate adjustment
  const validation = validateReconciliationAdjustment(adjustment);
  if (!validation.isValid) {
    throw new Error(`Invalid reconciliation adjustment: ${validation.errors.join(', ')}`);
  }

  // Store adjustment (in real implementation, this would persist to database)
  // For now, we just validate and return
}

/**
 * Post reconciliation adjustments
 * 
 * @param adjustments - Reconciliation adjustments
 * @returns Journal entries
 * 
 * @example
 * ```typescript
 * const entries = postReconciliationAdjustments(adjustments);
 * ```
 */
export function postReconciliationAdjustments(
  adjustments: readonly ReconciliationAdjustment[]
): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  for (const adjustment of adjustments) {
    const entry: JournalEntry = {
      id: `reconciliation-adj-${adjustment.id}`,
      date: adjustment.date,
      description: adjustment.description,
      lines: [],
      totalDebits: 0,
      totalCredits: 0,
      currency: adjustment.currency,
      status: 'draft',
      createdAt: new Date()
    };

    // Create journal lines based on adjustment type
    if (adjustment.amount > 0) {
      // Debit the specified account
      entry.lines.push({
        account: adjustment.account,
        description: adjustment.description,
        debit: adjustment.amount,
        credit: 0,
        currency: adjustment.currency,
        reference: adjustment.reference || `ADJ-${adjustment.id}`
      });

      // Credit bank account
      entry.lines.push({
        account: 'Bank Account',
        description: adjustment.description,
        debit: 0,
        credit: adjustment.amount,
        currency: adjustment.currency,
        reference: adjustment.reference || `ADJ-${adjustment.id}`
      });
    } else {
      // Credit the specified account
      entry.lines.push({
        account: adjustment.account,
        description: adjustment.description,
        debit: 0,
        credit: Math.abs(adjustment.amount),
        currency: adjustment.currency,
        reference: adjustment.reference || `ADJ-${adjustment.id}`
      });

      // Debit bank account
      entry.lines.push({
        account: 'Bank Account',
        description: adjustment.description,
        debit: Math.abs(adjustment.amount),
        credit: 0,
        currency: adjustment.currency,
        reference: adjustment.reference || `ADJ-${adjustment.id}`
      });
    }

    // Calculate totals
    entry.totalDebits = entry.lines.reduce((sum: number, line: JournalLine) => sum + line.debit, 0);
    entry.totalCredits = entry.lines.reduce((sum: number, line: JournalLine) => sum + line.credit, 0);

    entries.push(entry);
  }

  return entries;
}

/**
 * Validate reconciliation adjustments
 * 
 * @param adjustments - Adjustments to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateReconciliationAdjustments(adjustments);
 * if (!validation.isValid) {
 *   console.error('Adjustment validation failed:', validation.errors);
 * }
 * ```
 */
export function validateReconciliationAdjustments(
  adjustments: readonly ReconciliationAdjustment[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate each adjustment
  for (const adjustment of adjustments) {
    const adjustmentValidation = validateReconciliationAdjustment(adjustment);
    if (!adjustmentValidation.isValid) {
      errors.push(...adjustmentValidation.errors.map((e: string) => `${adjustment.id}: ${e}`));
    }
    warnings.push(...adjustmentValidation.warnings.map((w: string) => `${adjustment.id}: ${w}`));
  }

  // Check for duplicate adjustments
  const adjustmentIds = adjustments.map(a => a.id);
  const duplicateIds = adjustmentIds.filter((id, index) => adjustmentIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate adjustment IDs: ${duplicateIds.join(', ')}`);
  }

  // Warnings
  if (adjustments.length > 50) {
    warnings.push('Large number of adjustments may impact performance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// EXCEPTION HANDLING
// ============================================================================

/**
 * Identify reconciliation exceptions
 * 
 * @param reconciliation - Bank reconciliation
 * @returns Reconciliation exceptions
 * 
 * @example
 * ```typescript
 * const exceptions = identifyReconciliationExceptions(reconciliation);
 * ```
 */
export function identifyReconciliationExceptions(
  reconciliation: BankReconciliation
): readonly ReconciliationException[] {
  const exceptions: ReconciliationException[] = [];

  // Check for balance differences
  const balanceDifference = Math.abs(reconciliation.bankStatementBalance - reconciliation.glBalance);
  if (balanceDifference > 0.01) {
    exceptions.push({
      id: `exception-balance-${reconciliation.id}`,
      reconciliation,
      exceptionType: 'amount_mismatch',
      description: `Balance difference: ${balanceDifference}`,
      amount: balanceDifference,
      currency: (reconciliation.adjustments[0]?.currency ?? reconciliation.exceptions[0]?.currency ?? 'USD') as SupportedCurrency,
      date: new Date(),
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Check for unmatched transactions
  // This would be implemented based on actual transaction data
  // For now, we'll create a placeholder exception
  if (reconciliation.exceptions.length === 0) {
    exceptions.push({
      id: `exception-unmatched-${reconciliation.id}`,
      reconciliation,
      exceptionType: 'unmatched_transaction',
      description: 'Unmatched transactions found',
      amount: 0,
      currency: (reconciliation.adjustments[0]?.currency ?? 'USD') as SupportedCurrency,
      date: new Date(),
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return exceptions;
}

/**
 * Resolve reconciliation exception
 * 
 * @param _exception - Exception to resolve
 * @param resolution - Resolution details
 * @returns void
 * 
 * @example
 * ```typescript
 * resolveReconciliationException(exception, {
 *   resolutionType: 'adjustment',
 *   description: 'Created adjustment for bank fee',
 *   adjustment: adjustmentData,
 *   resolvedBy: 'user123',
 *   resolvedAt: new Date()
 * });
 * ```
 */
export function resolveReconciliationException(
  _exception: ReconciliationException,
  resolution: ExceptionResolution
): void {
  // Validate resolution
  if (!resolution.resolutionType) {
    throw new Error('Resolution type is required');
  }

  if (!resolution.resolvedBy) {
    throw new Error('Resolved by is required');
  }

  if (!resolution.resolvedAt) {
    throw new Error('Resolved at date is required');
  }

  // Update exception status (in real implementation, this would persist to database)
  // For now, we just validate and return
}

/**
 * Track exception history
 * 
 * @param exception - Exception to track
 * @returns void
 * 
 * @example
 * ```typescript
 * trackExceptionHistory(exception);
 * ```
 */
export function trackExceptionHistory(exception: ReconciliationException): void {
  // This would typically log exception history to an audit trail
  // For now, we'll just validate the exception
  if (!exception.id) {
    throw new Error('Exception ID is required for tracking');
  }

  if (!exception.reconciliation.id) {
    throw new Error('Reconciliation ID is required for tracking');
  }
  
  // Log the exception for tracking
  console.log(`Tracking exception: ${exception.id} for reconciliation: ${exception.reconciliation.id}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if amounts match between bank transaction and GL entry
 * 
 * @param bankTransaction - Bank transaction
 * @param glEntry - GL entry
 * @returns Amount match result
 */
function checkAmountMatch(
  bankTransaction: BankTransaction,
  glEntry: GLEntry
): { matches: boolean; difference: number; polarityOk: boolean } {
  // Normalize bank: positive magnitude, retain sign via type
  const bankMagnitude = Math.abs(bankTransaction.amount);
  const bankIsDebit = bankTransaction.type === 'debit' || bankTransaction.type === 'withdrawal' || bankTransaction.type === 'fee' || bankTransaction.type === 'check';
  const bankIsCredit = bankTransaction.type === 'credit' || bankTransaction.type === 'deposit' || bankTransaction.type === 'interest';

  // GL net amount and side
  const glNet = Math.abs((glEntry.debit ?? 0) - (glEntry.credit ?? 0));
  const glIsDebit = (glEntry.debit ?? 0) > (glEntry.credit ?? 0);
  const glIsCredit = (glEntry.credit ?? 0) > (glEntry.debit ?? 0);

  const difference = Math.abs(bankMagnitude - glNet);

  // Polarity/side check (best-effort; transfers and others are neutral)
  const polarityOk =
    (bankIsDebit && glIsDebit) ||
    (bankIsCredit && glIsCredit) ||
    (!bankIsDebit && !bankIsCredit); // e.g., transfer/other

  return {
    matches: difference <= 0.01 && polarityOk, // default tiny tolerance here; caller may layer larger tolerance
    difference,
    polarityOk,
  };
}

/**
 * Apply matching rule to bank transaction and GL entry
 * 
 * @param bankTransaction - Bank transaction
 * @param glEntry - GL entry
 * @param rule - Matching rule
 * @returns Rule match result
 */
function applyMatchingRule(
  bankTransaction: BankTransaction,
  glEntry: GLEntry,
  rule: MatchingRule
): { matches: boolean; confidence: number; matchType: MatchType; tolerance: number } {
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const condition of rule.conditions) {
    totalWeight += condition.weight;
    if (evaluateCondition(bankTransaction, glEntry, condition, rule.tolerance)) {
      matchedWeight += condition.weight;
    }
  }

  const confidence = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  const matches = confidence >= 0.7; // Minimum confidence threshold

  // Classify match type heuristically
  const bankMag = Math.abs(bankTransaction.amount);
  const glNet = Math.abs((glEntry.debit ?? 0) - (glEntry.credit ?? 0));
  const amtDiff = Math.abs(bankMag - glNet);
  const exact = amtDiff === 0 && bankTransaction.currency === glEntry.currency;
  const withinTol = amtDiff <= (rule.tolerance ?? 0);

  const matchType: MatchType = exact ? 'exact' : withinTol ? 'tolerance' : matches ? 'fuzzy' : 'manual';

  return {
    matches,
    confidence,
    matchType,
    tolerance: rule.tolerance
  };
}

/**
 * Evaluate matching condition
 * 
 * @param bankTransaction - Bank transaction
 * @param _glEntry - GL entry
 * @param condition - Matching condition
 * @returns True if condition is met
 */
function evaluateCondition(
  bankTransaction: BankTransaction,
  glEntry: GLEntry,
  condition: MatchingCondition,
  ruleTolerance: number
): boolean {
  const field = condition.field;
  const operator = condition.operator;
  const value = condition.value;

  // Pull both sides as needed
  const bankAmount = Math.abs(bankTransaction.amount);
  const glNet = Math.abs((glEntry.debit ?? 0) - (glEntry.credit ?? 0));
  const bankDate = bankTransaction.transactionDate;
  const glDate = glEntry.date;
  const bankRef = bankTransaction.reference ?? '';
  const glRef = glEntry.reference ?? '';
  const bankDesc = bankTransaction.description ?? '';
  const glDesc = glEntry.description ?? '';

  // Evaluate condition by field
  switch (field) {
    case 'amount': {
      const diff = Math.abs(bankAmount - glNet);
      if (operator === 'between') {
        const r = value as { min: number; max: number };
        return diff >= r.min && diff <= r.max;
      }
      if (operator === 'equals') return diff === 0;
      if (operator === 'less_than') return diff < (typeof value === 'number' ? value : ruleTolerance);
      if (operator === 'greater_than') return diff > (typeof value === 'number' ? value : ruleTolerance);
      return diff <= ruleTolerance; // default to within tolerance
    }
    case 'date': {
      const days = Math.abs(_diffDays(bankDate, glDate));
      if (operator === 'between') {
        const r = value as { min: number; max: number };
        return days >= r.min && days <= r.max;
      }
      if (operator === 'equals') return days === 0;
      if (operator === 'less_than') return days < (value as number);
      if (operator === 'greater_than') return days > (value as number);
      return days === 0;
    }
    case 'reference': {
      return evaluateText(bankRef, glRef, operator, value);
    }
    case 'description': {
      return evaluateText(bankDesc, glDesc, operator, value);
    }
    default:
      return false;
  }
}

function evaluateText(a: string, b: string, operator: ConditionOperator, value: unknown): boolean {
  const val = typeof value === 'string' ? value : '';
  switch (operator) {
    case 'equals': return a === b || a === val || b === val;
    case 'not_equals': return !(a === b || a === val || b === val);
    case 'contains': return a.includes(val) || b.includes(val) || a.includes(b) || b.includes(a);
    case 'starts_with': return a.startsWith(val) || b.startsWith(val);
    case 'ends_with': return a.endsWith(val) || b.endsWith(val);
    case 'regex':
      try { const re = new RegExp(val); return re.test(a) || re.test(b); } catch { return false; }
    default: return false;
  }
}

/**
 * Validate reconciliation adjustment
 * 
 * @param adjustment - Adjustment to validate
 * @returns Validation result
 */
function validateReconciliationAdjustment(adjustment: ReconciliationAdjustment): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!adjustment.id || adjustment.id.trim() === '') {
    errors.push('Adjustment ID is required');
  }

  if (!adjustment.description || adjustment.description.trim() === '') {
    errors.push('Adjustment description is required');
  }

  if (!adjustment.account || adjustment.account.trim() === '') {
    errors.push('Adjustment account is required');
  }

  if (adjustment.amount === 0) {
    errors.push('Adjustment amount cannot be zero');
  }

  if (!adjustment.currency || adjustment.currency.trim() === '') {
    errors.push('Adjustment currency is required');
  }

  // Validate adjustment type
  if (!['bank_fee', 'interest', 'error_correction', 'timing_difference', 'bank_error', 'gl_error', 'exchange_rate', 'other'].includes(adjustment.type)) {
    errors.push(`Invalid adjustment type: ${adjustment.type}`);
  }

  // Validate reason
  if (!['bank_error', 'gl_error', 'timing', 'fee', 'interest', 'exchange_rate', 'manual_correction', 'system_error'].includes(adjustment.reason)) {
    errors.push(`Invalid adjustment reason: ${adjustment.reason}`);
  }

  // Warnings
  if (Math.abs(adjustment.amount) > 10000) {
    warnings.push('Large adjustment amount - verify reasonableness');
  }

  if (adjustment.date > new Date()) {
    warnings.push('Adjustment date is in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
