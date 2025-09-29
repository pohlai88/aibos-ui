/**
 * Journal Entry Utilities - Phase 1 Implementation
 * 
 * Core GL & Posting utilities for building, validating, and balancing journal entries.
 * Provides automatic suspense account handling and multi-currency support.
 * 
 * Features:
 * - Entry building from business transactions
 * - Balance validation with configurable tolerance
 * - Auto-plug to suspense account
 * - Entry normalization and line ordering
 * - Multi-currency support
 * - Line item validation
 */

import {
  type SupportedCurrency,
  roundToCurrency,
  toMinor,
  fromMinor,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface JournalLine {
  id: string;
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
  currency: SupportedCurrency;
  dimensions?: Record<string, string>;
}

export interface JournalEntry {
  id: string;
  date: Date;
  reference: string;
  description: string;
  lines: JournalLine[];
  totalDebits: number;
  totalCredits: number;
  currency: SupportedCurrency;
  status: 'draft' | 'posted' | 'cancelled';
}

export interface BusinessTransaction {
  id: string;
  date: Date;
  reference: string;
  description: string;
  amount: number;
  currency: SupportedCurrency;
  type: 'sale' | 'purchase' | 'payment' | 'receipt' | 'adjustment' | 'other';
  accountMappings: Array<{
    accountCode: string;
    description: string;
    debit?: number;
    credit?: number;
    dimensions?: Record<string, string>;
  }>;
}

export interface BalanceOptions {
  tolerance?: number;
  suspenseAccount?: string;
  autoBalance?: boolean;
}

export interface BalanceValidationResult {
  isBalanced: boolean;
  difference: number;
  tolerance: number;
  withinTolerance: boolean;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  code: 'BALANCE' | 'CURRENCY' | 'ACCOUNT' | 'AMOUNT' | 'FORMAT';
  message: string;
  severity: 'error' | 'warning';
  lineId?: string;
}

// ============================================================================
// ENTRY BUILDING
// ============================================================================

/**
 * Build a journal entry from a business transaction
 */
export function buildJournalEntry(transaction: BusinessTransaction): JournalEntry {
  if (!transaction) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Business transaction is required',
      transaction,
      { operation: 'build-journal-entry' }
    );
  }

  const lines: JournalLine[] = transaction.accountMappings.map((mapping, index) => {
    const line: JournalLine = {
      id: `${transaction.id}-${index}`,
      accountCode: mapping.accountCode,
      description: mapping.description,
      debit: mapping.debit || 0,
      credit: mapping.credit || 0,
      currency: transaction.currency,
      ...(mapping.dimensions && { dimensions: mapping.dimensions }),
    };

    // Validate line
    if (line.debit < 0 || line.credit < 0) {
      throw createValidationError(
        'INVALID_ACCOUNTING_INPUT',
        `Line ${index + 1}: Debit and credit amounts cannot be negative`,
        line,
        { operation: 'build-journal-entry' }
      );
    }

    if (line.debit > 0 && line.credit > 0) {
      throw createValidationError(
        'INVALID_ACCOUNTING_INPUT',
        `Line ${index + 1}: Cannot have both debit and credit amounts`,
        line,
        { operation: 'build-journal-entry' }
      );
    }

    if (line.debit === 0 && line.credit === 0) {
      throw createValidationError(
        'INVALID_ACCOUNTING_INPUT',
        `Line ${index + 1}: Must have either debit or credit amount`,
        line,
        { operation: 'build-journal-entry' }
      );
    }

    return line;
  });

  const entry: JournalEntry = {
    id: transaction.id,
    date: transaction.date,
    reference: transaction.reference,
    description: transaction.description,
    lines,
    totalDebits: lines.reduce((sum, line) => sum + line.debit, 0),
    totalCredits: lines.reduce((sum, line) => sum + line.credit, 0),
    currency: transaction.currency,
    status: 'draft',
  };

  return entry;
}

/**
 * Build a balanced journal entry from lines with optional auto-balancing
 */
export function buildBalancedEntry(
  lines: JournalLine[],
  options: BalanceOptions = {}
): JournalEntry {
  if (!lines || lines.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Journal lines are required',
      lines,
      { operation: 'build-balanced-entry' }
    );
  }

  // Validate all lines have the same currency
  const currencies = new Set(lines.map(line => line.currency));
  if (currencies.size > 1) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'All lines must have the same currency',
      { currencies: Array.from(currencies) },
      { operation: 'build-balanced-entry' }
    );
  }

  const currency = lines[0]!.currency;
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  let balancedLines = [...lines];

  // Auto-balance if requested and entry is not balanced
  if (options.autoBalance && totalDebits !== totalCredits) {
    balancedLines = autoBalanceEntry(
      { id: 'temp', date: new Date(), reference: '', description: '', lines, totalDebits, totalCredits, currency, status: 'draft' },
      options.suspenseAccount || 'SUSPENSE'
    ).lines;
  }

  const entry: JournalEntry = {
    id: `JE-${Date.now()}`,
    date: new Date(),
    reference: '',
    description: 'Balanced Journal Entry',
    lines: balancedLines,
    totalDebits: balancedLines.reduce((sum, line) => sum + line.debit, 0),
    totalCredits: balancedLines.reduce((sum, line) => sum + line.credit, 0),
    currency,
    status: 'draft',
  };

  return entry;
}

/**
 * Normalize a journal entry by standardizing formats and line ordering
 */
export function normalizeJournalEntry(entry: JournalEntry): JournalEntry {
  if (!entry) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Journal entry is required',
      entry,
      { operation: 'normalize-journal-entry' }
    );
  }

  // Sort lines by account code, then by debit amount (descending), then by credit amount (descending)
  const sortedLines = [...entry.lines].sort((a, b) => {
    if (a.accountCode !== b.accountCode) {
      return a.accountCode.localeCompare(b.accountCode);
    }
    if (a.debit !== b.debit) {
      return b.debit - a.debit;
    }
    return b.credit - a.credit;
  });

  // Round amounts to currency precision
  const normalizedLines = sortedLines.map(line => ({
    ...line,
    debit: roundToCurrency(line.debit, line.currency),
    credit: roundToCurrency(line.credit, line.currency),
  }));

  const totalDebits = normalizedLines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = normalizedLines.reduce((sum, line) => sum + line.credit, 0);

  return {
    ...entry,
    lines: normalizedLines,
    totalDebits: roundToCurrency(totalDebits, entry.currency),
    totalCredits: roundToCurrency(totalCredits, entry.currency),
  };
}

// ============================================================================
// BALANCE VALIDATION
// ============================================================================

/**
 * Validate journal entry balance with configurable tolerance
 */
export function validateEntryBalance(
  entry: JournalEntry,
  tolerance: number = 0
): BalanceValidationResult {
  if (!entry) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Journal entry is required',
      entry,
      { operation: 'validate-entry-balance' }
    );
  }

  const issues: ValidationIssue[] = [];

  // Convert to minor units for precise comparison
  const totalDebitsMinor = toMinor(entry.totalDebits, entry.currency);
  const totalCreditsMinor = toMinor(entry.totalCredits, entry.currency);
  const toleranceMinor = toMinor(tolerance, entry.currency);

  const difference = Math.abs(totalDebitsMinor - totalCreditsMinor);
  const isBalanced = difference === 0;
  const withinTolerance = difference <= toleranceMinor;

  if (!isBalanced) {
    const differenceMajor = fromMinor(difference, entry.currency);
    issues.push({
      code: 'BALANCE',
      message: `Entry is not balanced. Difference: ${differenceMajor} ${entry.currency}`,
      severity: 'error',
    });
  }

  // Validate individual lines
  entry.lines.forEach((line, index) => {
    if (line.debit < 0 || line.credit < 0) {
      issues.push({
        code: 'AMOUNT',
        message: `Line ${index + 1}: Amounts cannot be negative`,
        severity: 'error',
        lineId: line.id,
      });
    }

    if (line.debit > 0 && line.credit > 0) {
      issues.push({
        code: 'AMOUNT',
        message: `Line ${index + 1}: Cannot have both debit and credit amounts`,
        severity: 'error',
        lineId: line.id,
      });
    }

    if (line.debit === 0 && line.credit === 0) {
      issues.push({
        code: 'AMOUNT',
        message: `Line ${index + 1}: Must have either debit or credit amount`,
        severity: 'error',
        lineId: line.id,
      });
    }

    if (line.currency !== entry.currency) {
      issues.push({
        code: 'CURRENCY',
        message: `Line ${index + 1}: Currency mismatch with entry currency`,
        severity: 'error',
        lineId: line.id,
      });
    }
  });

  return {
    isBalanced,
    difference: fromMinor(difference, entry.currency),
    tolerance,
    withinTolerance,
    issues,
  };
}

/**
 * Check if journal entry is balanced within tolerance
 */
export function isEntryBalanced(
  entry: JournalEntry,
  tolerance: number = 0
): boolean {
  const validation = validateEntryBalance(entry, tolerance);
  return validation.isBalanced || validation.withinTolerance;
}

// ============================================================================
// AUTO-PLUG TO SUSPENSE
// ============================================================================

/**
 * Create a suspense entry line to balance an unbalanced entry
 */
export function createSuspenseEntry(
  unbalancedLines: JournalLine[],
  suspenseAccount: string
): JournalLine {
  if (!unbalancedLines || unbalancedLines.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Unbalanced lines are required',
      unbalancedLines,
      { operation: 'create-suspense-entry' }
    );
  }

  // Validate all lines have the same currency
  const currencies = new Set(unbalancedLines.map(line => line.currency));
  if (currencies.size > 1) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'All lines must have the same currency',
      { currencies: Array.from(currencies) },
      { operation: 'create-suspense-entry' }
    );
  }

  const currency = unbalancedLines[0]!.currency;
  const totalDebits = unbalancedLines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = unbalancedLines.reduce((sum, line) => sum + line.credit, 0);
  const difference = totalDebits - totalCredits;

  if (difference === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Lines are already balanced',
      { totalDebits, totalCredits },
      { operation: 'create-suspense-entry' }
    );
  }

  const suspenseLine: JournalLine = {
    id: `SUSPENSE-${Date.now()}`,
    accountCode: suspenseAccount,
    description: `Suspense entry to balance difference of ${Math.abs(difference)} ${currency}`,
    debit: difference > 0 ? 0 : Math.abs(difference),
    credit: difference > 0 ? difference : 0,
    currency,
  };

  return suspenseLine;
}

/**
 * Automatically balance a journal entry using suspense account
 */
export function autoBalanceEntry(
  entry: JournalEntry,
  suspenseAccount: string
): JournalEntry {
  if (!entry) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Journal entry is required',
      entry,
      { operation: 'auto-balance-entry' }
    );
  }

  const validation = validateEntryBalance(entry);
  if (validation.isBalanced) {
    return entry; // Already balanced
  }

  const suspenseLine = createSuspenseEntry(entry.lines, suspenseAccount);
  const balancedLines = [...entry.lines, suspenseLine];

  const totalDebits = balancedLines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = balancedLines.reduce((sum, line) => sum + line.credit, 0);

  return {
    ...entry,
    lines: balancedLines,
    totalDebits: roundToCurrency(totalDebits, entry.currency),
    totalCredits: roundToCurrency(totalCredits, entry.currency),
  };
}

// ============================================================================
// LINE ITEM OPERATIONS
// ============================================================================

/**
 * Add a line to a journal entry
 */
export function addLineToEntry(entry: JournalEntry, line: JournalLine): JournalEntry {
  if (!entry) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Journal entry is required',
      entry,
      { operation: 'add-line-to-entry' }
    );
  }

  if (!line) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Journal line is required',
      line,
      { operation: 'add-line-to-entry' }
    );
  }

  // Validate currency match
  if (line.currency !== entry.currency) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Line currency must match entry currency',
      { entryCurrency: entry.currency, lineCurrency: line.currency },
      { operation: 'add-line-to-entry' }
    );
  }

  // Check for duplicate line ID
  if (entry.lines.some(existingLine => existingLine.id === line.id)) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Line ID already exists in entry',
      { lineId: line.id },
      { operation: 'add-line-to-entry' }
    );
  }

  const newLines = [...entry.lines, line];
  const totalDebits = newLines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = newLines.reduce((sum, line) => sum + line.credit, 0);

  return {
    ...entry,
    lines: newLines,
    totalDebits: roundToCurrency(totalDebits, entry.currency),
    totalCredits: roundToCurrency(totalCredits, entry.currency),
  };
}

/**
 * Remove a line from a journal entry
 */
export function removeLineFromEntry(entry: JournalEntry, lineId: string): JournalEntry {
  if (!entry) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Journal entry is required',
      entry,
      { operation: 'remove-line-from-entry' }
    );
  }

  if (!lineId) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Line ID is required',
      lineId,
      { operation: 'remove-line-from-entry' }
    );
  }

  const lineIndex = entry.lines.findIndex(line => line.id === lineId);
  if (lineIndex === -1) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Line not found in entry',
      { lineId },
      { operation: 'remove-line-from-entry' }
    );
  }

  const newLines = entry.lines.filter(line => line.id !== lineId);
  const totalDebits = newLines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = newLines.reduce((sum, line) => sum + line.credit, 0);

  return {
    ...entry,
    lines: newLines,
    totalDebits: roundToCurrency(totalDebits, entry.currency),
    totalCredits: roundToCurrency(totalCredits, entry.currency),
  };
}

/**
 * Update the amount of a specific line in a journal entry
 */
export function updateLineAmount(
  entry: JournalEntry,
  lineId: string,
  amount: number
): JournalEntry {
  if (!entry) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Journal entry is required',
      entry,
      { operation: 'update-line-amount' }
    );
  }

  if (!lineId) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Line ID is required',
      lineId,
      { operation: 'update-line-amount' }
    );
  }

  if (typeof amount !== 'number' || amount < 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Amount must be a non-negative number',
      amount,
      { operation: 'update-line-amount' }
    );
  }

  const lineIndex = entry.lines.findIndex(line => line.id === lineId);
  if (lineIndex === -1) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Line not found in entry',
      { lineId },
      { operation: 'update-line-amount' }
    );
  }

  const line = entry.lines[lineIndex]!;
  const isDebit = line.debit > 0;
  const updatedLine: JournalLine = {
    ...line,
    debit: isDebit ? roundToCurrency(amount, entry.currency) : 0,
    credit: isDebit ? 0 : roundToCurrency(amount, entry.currency),
  };

  const newLines = [...entry.lines];
  newLines[lineIndex] = updatedLine;

  const totalDebits = newLines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = newLines.reduce((sum, line) => sum + line.credit, 0);

  return {
    ...entry,
    lines: newLines,
    totalDebits: roundToCurrency(totalDebits, entry.currency),
    totalCredits: roundToCurrency(totalCredits, entry.currency),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert journal entry to validation input format
 */
export function toValidationInput(entry: JournalEntry): any {
  return {
    date: entry.date.toISOString(),
    description: entry.description,
    entries: entry.lines.map(line => ({
      account: line.accountCode,
      debit: line.debit,
      credit: line.credit,
      currency: line.currency,
    })),
    currency: entry.currency,
  };
}

/**
 * Create an empty journal entry
 */
export function createEmptyEntry(
  currency: SupportedCurrency = 'MYR',
  reference: string = '',
  description: string = ''
): JournalEntry {
  return {
    id: `JE-${Date.now()}`,
    date: new Date(),
    reference,
    description,
    lines: [],
    totalDebits: 0,
    totalCredits: 0,
    currency,
    status: 'draft',
  };
}

/**
 * Clone a journal entry with new ID
 */
export function cloneEntry(entry: JournalEntry, newId?: string): JournalEntry {
  return {
    ...entry,
    id: newId || `JE-${Date.now()}`,
    lines: entry.lines.map(line => ({ ...line })),
    status: 'draft',
  };
}

/**
 * Get entry summary for reporting
 */
export function getEntrySummary(entry: JournalEntry): {
  id: string;
  date: string;
  reference: string;
  description: string;
  lineCount: number;
  totalDebits: number;
  totalCredits: number;
  currency: SupportedCurrency;
  isBalanced: boolean;
  status: string;
} {
  const validation = validateEntryBalance(entry);
  
  return {
    id: entry.id,
    date: entry.date.toISOString(),
    reference: entry.reference,
    description: entry.description,
    lineCount: entry.lines.length,
    totalDebits: entry.totalDebits,
    totalCredits: entry.totalCredits,
    currency: entry.currency,
    isBalanced: validation.isBalanced,
    status: entry.status,
  };
}
