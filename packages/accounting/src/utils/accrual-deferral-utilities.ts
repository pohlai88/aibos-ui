/**
 * Accrual & Deferral Utilities - Phase 1 Implementation
 * 
 * Generate accrual and deferral schedules with reversing entry assistance.
 * Provides comprehensive accrual and deferral management.
 * 
 * Features:
 * - Schedule generation for accruals and deferrals
 * - Reversing entries generation
 * - Schedule management and tracking
 * - Calculation engine for accrual amounts and timing
 * - Validation for schedules and entries
 */

import {
  type SupportedCurrency,
  roundToCurrency,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';
import type { JournalEntry, JournalLine } from './journal-entry-utilities';
import type { FiscalPeriod } from './fiscal-period-utilities';
import { addDaysFns, addMonthsFns, addYearsFns, isAfterFns, isBeforeFns, isSameDate } from './date-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AccrualTransaction {
  id: string;
  description: string;
  totalAmount: number;
  currency: SupportedCurrency;
  startDate: Date;
  endDate: Date;
  accountCode: string;
  offsetAccountCode: string;
  dimensions?: Record<string, string>;
}

export interface DeferralTransaction {
  id: string;
  description: string;
  totalAmount: number;
  currency: SupportedCurrency;
  startDate: Date;
  endDate: Date;
  accountCode: string;
  offsetAccountCode: string;
  dimensions?: Record<string, string>;
}

export interface AccrualOptions {
  method: 'straight-line' | 'pro-rata' | 'custom';
  includeReversingEntries: boolean;
  reversalDelay: number; // days
  autoPost: boolean;
}

export interface DeferralOptions {
  method: 'straight-line' | 'pro-rata' | 'custom';
  includeReversingEntries: boolean;
  reversalDelay: number; // days
  autoPost: boolean;
}

export interface AccrualEntry {
  period: FiscalPeriod;
  amount: number;
  posted: boolean;
  postedAt?: Date;
  journalEntryId?: string;
}

export interface AccrualSchedule {
  id: string;
  transactionId: string;
  description: string;
  totalAmount: number;
  currency: SupportedCurrency;
  startDate: Date;
  endDate: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  entries: AccrualEntry[];
  status: 'active' | 'completed' | 'cancelled';
  accountCode: string;
  offsetAccountCode: string;
  dimensions?: Record<string, string>;
}

export interface DeferralSchedule {
  id: string;
  transactionId: string;
  description: string;
  totalAmount: number;
  currency: SupportedCurrency;
  startDate: Date;
  endDate: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  entries: AccrualEntry[];
  status: 'active' | 'completed' | 'cancelled';
  accountCode: string;
  offsetAccountCode: string;
  dimensions?: Record<string, string>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// SCHEDULE GENERATION
// ============================================================================

/**
 * Create an accrual schedule
 */
export function createAccrualSchedule(
  transaction: AccrualTransaction,
  options: AccrualOptions
): AccrualSchedule {
  if (!transaction) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Accrual transaction is required',
      transaction,
      { operation: 'create-accrual-schedule' }
    );
  }

  if (!options) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Accrual options are required',
      options,
      { operation: 'create-accrual-schedule' }
    );
  }

  // Validate transaction
  const transactionValidation = validateAccrualTransaction(transaction);
  if (!transactionValidation.isValid) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `Invalid accrual transaction: ${transactionValidation.errors.join(', ')}`,
      transaction,
      { operation: 'create-accrual-schedule' }
    );
  }

  // Calculate frequency based on duration
  const frequency = calculateFrequency(transaction.startDate, transaction.endDate);
  
  // Generate accrual entries
  const entries = generateAccrualEntries(transaction, options, frequency);

  const schedule: AccrualSchedule = {
    id: `ACC-${Date.now()}`,
    transactionId: transaction.id,
    description: transaction.description,
    totalAmount: transaction.totalAmount,
    currency: transaction.currency,
    startDate: transaction.startDate,
    endDate: transaction.endDate,
    frequency,
    entries,
    status: 'active',
    accountCode: transaction.accountCode,
    offsetAccountCode: transaction.offsetAccountCode,
    dimensions: transaction.dimensions || {},
  };

  return schedule;
}

/**
 * Create a deferral schedule
 */
export function createDeferralSchedule(
  transaction: DeferralTransaction,
  options: DeferralOptions
): DeferralSchedule {
  if (!transaction) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Deferral transaction is required',
      transaction,
      { operation: 'create-deferral-schedule' }
    );
  }

  if (!options) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Deferral options are required',
      options,
      { operation: 'create-deferral-schedule' }
    );
  }

  // Validate transaction
  const transactionValidation = validateDeferralTransaction(transaction);
  if (!transactionValidation.isValid) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `Invalid deferral transaction: ${transactionValidation.errors.join(', ')}`,
      transaction,
      { operation: 'create-deferral-schedule' }
    );
  }

  // Calculate frequency based on duration
  const frequency = calculateFrequency(transaction.startDate, transaction.endDate);
  
  // Generate deferral entries
  const entries = generateDeferralEntries(transaction, options, frequency);

  const schedule: DeferralSchedule = {
    id: `DEF-${Date.now()}`,
    transactionId: transaction.id,
    description: transaction.description,
    totalAmount: transaction.totalAmount,
    currency: transaction.currency,
    startDate: transaction.startDate,
    endDate: transaction.endDate,
    frequency,
    entries,
    status: 'active',
    accountCode: transaction.accountCode,
    offsetAccountCode: transaction.offsetAccountCode,
    dimensions: transaction.dimensions || {},
  };

  return schedule;
}

/**
 * Generate reversing entries for an accrual schedule
 */
export function generateReversingEntries(schedule: AccrualSchedule): JournalEntry[] {
  if (!schedule) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Accrual schedule is required',
      schedule,
      { operation: 'generate-reversing-entries' }
    );
  }

  const entries: JournalEntry[] = [];

  for (const accrualEntry of schedule.entries) {
    if (accrualEntry.posted && accrualEntry.journalEntryId) {
      const reversingEntry = generateReversingEntry(
        accrualEntry,
        schedule,
        addDaysFns(accrualEntry.postedAt || new Date(), 1) // Default 1 day delay
      );
      entries.push(reversingEntry);
    }
  }

  return entries;
}

// ============================================================================
// SCHEDULE MANAGEMENT
// ============================================================================

/**
 * Update an accrual schedule
 */
export function updateAccrualSchedule(
  schedule: AccrualSchedule,
  updates: Partial<AccrualSchedule>
): AccrualSchedule {
  if (!schedule) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Accrual schedule is required',
      schedule,
      { operation: 'update-accrual-schedule' }
    );
  }

  if (!updates) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Updates are required',
      updates,
      { operation: 'update-accrual-schedule' }
    );
  }

  const updatedSchedule = { ...schedule, ...updates };

  // Validate updated schedule
  const validation = validateAccrualSchedule(updatedSchedule);
  if (!validation.isValid) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `Invalid updated schedule: ${validation.errors.join(', ')}`,
      updatedSchedule,
      { operation: 'update-accrual-schedule' }
    );
  }

  return updatedSchedule;
}

/**
 * Validate an accrual schedule
 */
export function validateAccrualSchedule(schedule: AccrualSchedule): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!schedule) {
    errors.push('Accrual schedule is required');
    return { isValid: false, errors, warnings };
  }

  // Validate basic fields
  if (!schedule.id) {
    errors.push('Schedule ID is required');
  }

  if (!schedule.transactionId) {
    errors.push('Transaction ID is required');
  }

  if (!schedule.description) {
    errors.push('Description is required');
  }

  if (typeof schedule.totalAmount !== 'number' || schedule.totalAmount <= 0) {
    errors.push('Total amount must be a positive number');
  }

  if (!schedule.currency) {
    errors.push('Currency is required');
  }

  if (!schedule.startDate || !schedule.endDate) {
    errors.push('Start and end dates are required');
  }

  if (schedule.startDate && schedule.endDate && isAfterFns(schedule.startDate, schedule.endDate)) {
    errors.push('Start date must be before end date');
  }

  if (!schedule.accountCode) {
    errors.push('Account code is required');
  }

  if (!schedule.offsetAccountCode) {
    errors.push('Offset account code is required');
  }

  // Validate entries
  if (!schedule.entries || schedule.entries.length === 0) {
    errors.push('Schedule must have at least one entry');
  } else {
    let totalEntryAmount = 0;
    for (let i = 0; i < schedule.entries.length; i++) {
      const entry = schedule.entries[i]!;
      
      if (typeof entry.amount !== 'number' || entry.amount < 0) {
        errors.push(`Entry ${i + 1}: Amount must be a non-negative number`);
      }
      
      totalEntryAmount += entry.amount;
    }

    // Check if total entry amount matches schedule total
    const difference = Math.abs(totalEntryAmount - schedule.totalAmount);
    if (difference > 0.01) {
      warnings.push(`Total entry amount (${totalEntryAmount}) does not match schedule total (${schedule.totalAmount})`);
    }
  }

  // Validate status
  const validStatuses = ['active', 'completed', 'cancelled'];
  if (!validStatuses.includes(schedule.status)) {
    errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate accrual amount for a specific date
 */
export function calculateAccrualAmount(schedule: AccrualSchedule, asOfDate: Date): number {
  if (!schedule) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Accrual schedule is required',
      schedule,
      { operation: 'calculate-accrual-amount' }
    );
  }

  if (!asOfDate) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'As of date is required',
      asOfDate,
      { operation: 'calculate-accrual-amount' }
    );
  }

  // Find entries up to the as of date
  const applicableEntries = schedule.entries.filter(entry => 
    entry.period && isBeforeFns(entry.period.endDate, asOfDate) || isSameDate(entry.period.endDate, asOfDate)
  );

  // Calculate total accrued amount
  const totalAccrued = applicableEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return roundToCurrency(totalAccrued, schedule.currency);
}

// ============================================================================
// ENTRY GENERATION
// ============================================================================

/**
 * Generate accrual entry for a specific period
 */
export function generateAccrualEntry(
  schedule: AccrualSchedule,
  period: FiscalPeriod
): JournalEntry {
  if (!schedule) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Accrual schedule is required',
      schedule,
      { operation: 'generate-accrual-entry' }
    );
  }

  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'generate-accrual-entry' }
    );
  }

  // Find the accrual entry for this period
  const accrualEntry = schedule.entries.find(entry => 
    entry.period && entry.period.id === period.id
  );

  if (!accrualEntry) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `No accrual entry found for period ${period.id}`,
      { schedule: schedule.id, period: period.id },
      { operation: 'generate-accrual-entry' }
    );
  }

  // Create journal lines
  const lines: JournalLine[] = [
    {
      id: `${schedule.id}-${period.id}-accrual`,
      accountCode: schedule.accountCode,
      description: `Accrual: ${schedule.description}`,
      debit: roundToCurrency(accrualEntry.amount, schedule.currency),
      credit: 0,
      currency: schedule.currency,
      dimensions: schedule.dimensions || {},
    },
    {
      id: `${schedule.id}-${period.id}-offset`,
      accountCode: schedule.offsetAccountCode,
      description: `Accrual offset: ${schedule.description}`,
      debit: 0,
      credit: roundToCurrency(accrualEntry.amount, schedule.currency),
      currency: schedule.currency,
      dimensions: schedule.dimensions || {},
    },
  ];

  // Create journal entry
  const entry: JournalEntry = {
    id: `JE-${schedule.id}-${period.id}-${Date.now()}`,
    date: period.endDate,
    reference: `ACC-${schedule.id}-${period.period}`,
    description: `Accrual entry for ${schedule.description}`,
    lines,
    totalDebits: roundToCurrency(accrualEntry.amount, schedule.currency),
    totalCredits: roundToCurrency(accrualEntry.amount, schedule.currency),
    currency: schedule.currency,
    status: 'draft',
  };

  return entry;
}

/**
 * Generate deferral entry for a specific period
 */
export function generateDeferralEntry(
  schedule: DeferralSchedule,
  period: FiscalPeriod
): JournalEntry {
  if (!schedule) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Deferral schedule is required',
      schedule,
      { operation: 'generate-deferral-entry' }
    );
  }

  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'generate-deferral-entry' }
    );
  }

  // Find the deferral entry for this period
  const deferralEntry = schedule.entries.find(entry => 
    entry.period && entry.period.id === period.id
  );

  if (!deferralEntry) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `No deferral entry found for period ${period.id}`,
      { schedule: schedule.id, period: period.id },
      { operation: 'generate-deferral-entry' }
    );
  }

  // Create journal lines
  const lines: JournalLine[] = [
    {
      id: `${schedule.id}-${period.id}-deferral`,
      accountCode: schedule.accountCode,
      description: `Deferral: ${schedule.description}`,
      debit: 0,
      credit: roundToCurrency(deferralEntry.amount, schedule.currency),
      currency: schedule.currency,
      dimensions: schedule.dimensions || {},
    },
    {
      id: `${schedule.id}-${period.id}-offset`,
      accountCode: schedule.offsetAccountCode,
      description: `Deferral offset: ${schedule.description}`,
      debit: roundToCurrency(deferralEntry.amount, schedule.currency),
      credit: 0,
      currency: schedule.currency,
      dimensions: schedule.dimensions || {},
    },
  ];

  // Create journal entry
  const entry: JournalEntry = {
    id: `JE-${schedule.id}-${period.id}-${Date.now()}`,
    date: period.endDate,
    reference: `DEF-${schedule.id}-${period.period}`,
    description: `Deferral entry for ${schedule.description}`,
    lines,
    totalDebits: roundToCurrency(deferralEntry.amount, schedule.currency),
    totalCredits: roundToCurrency(deferralEntry.amount, schedule.currency),
    currency: schedule.currency,
    status: 'draft',
  };

  return entry;
}

/**
 * Generate reversing entry for an original entry
 */
export function generateReversingEntry(
  originalEntry: AccrualEntry,
  schedule: AccrualSchedule,
  reverseDate: Date
): JournalEntry {
  if (!originalEntry) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Original entry is required',
      originalEntry,
      { operation: 'generate-reversing-entry' }
    );
  }

  if (!schedule) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Accrual schedule is required',
      schedule,
      { operation: 'generate-reversing-entry' }
    );
  }

  if (!reverseDate) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Reverse date is required',
      reverseDate,
      { operation: 'generate-reversing-entry' }
    );
  }

  // Create reversing journal lines (opposite of original)
  const lines: JournalLine[] = [
    {
      id: `${schedule.id}-${originalEntry.period?.id}-reverse-accrual`,
      accountCode: schedule.accountCode,
      description: `Reverse accrual: ${schedule.description}`,
      debit: 0,
      credit: roundToCurrency(originalEntry.amount, schedule.currency),
      currency: schedule.currency,
      dimensions: schedule.dimensions || {},
    },
    {
      id: `${schedule.id}-${originalEntry.period?.id}-reverse-offset`,
      accountCode: schedule.offsetAccountCode,
      description: `Reverse accrual offset: ${schedule.description}`,
      debit: roundToCurrency(originalEntry.amount, schedule.currency),
      credit: 0,
      currency: schedule.currency,
      dimensions: schedule.dimensions || {},
    },
  ];

  // Create reversing journal entry
  const entry: JournalEntry = {
    id: `JE-REV-${schedule.id}-${originalEntry.period?.id}-${Date.now()}`,
    date: reverseDate,
    reference: `REV-${schedule.id}-${originalEntry.period?.period}`,
    description: `Reversing entry for ${schedule.description}`,
    lines,
    totalDebits: roundToCurrency(originalEntry.amount, schedule.currency),
    totalCredits: roundToCurrency(originalEntry.amount, schedule.currency),
    currency: schedule.currency,
    status: 'draft',
  };

  return entry;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate accrual transaction
 */
function validateAccrualTransaction(transaction: AccrualTransaction): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!transaction) {
    errors.push('Accrual transaction is required');
    return { isValid: false, errors, warnings };
  }

  if (!transaction.id) {
    errors.push('Transaction ID is required');
  }

  if (!transaction.description) {
    errors.push('Description is required');
  }

  if (typeof transaction.totalAmount !== 'number' || transaction.totalAmount <= 0) {
    errors.push('Total amount must be a positive number');
  }

  if (!transaction.currency) {
    errors.push('Currency is required');
  }

  if (!transaction.startDate || !transaction.endDate) {
    errors.push('Start and end dates are required');
  }

  if (transaction.startDate && transaction.endDate && isAfterFns(transaction.startDate, transaction.endDate)) {
    errors.push('Start date must be before end date');
  }

  if (!transaction.accountCode) {
    errors.push('Account code is required');
  }

  if (!transaction.offsetAccountCode) {
    errors.push('Offset account code is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate deferral transaction
 */
function validateDeferralTransaction(transaction: DeferralTransaction): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!transaction) {
    errors.push('Deferral transaction is required');
    return { isValid: false, errors, warnings };
  }

  if (!transaction.id) {
    errors.push('Transaction ID is required');
  }

  if (!transaction.description) {
    errors.push('Description is required');
  }

  if (typeof transaction.totalAmount !== 'number' || transaction.totalAmount <= 0) {
    errors.push('Total amount must be a positive number');
  }

  if (!transaction.currency) {
    errors.push('Currency is required');
  }

  if (!transaction.startDate || !transaction.endDate) {
    errors.push('Start and end dates are required');
  }

  if (transaction.startDate && transaction.endDate && isAfterFns(transaction.startDate, transaction.endDate)) {
    errors.push('Start date must be before end date');
  }

  if (!transaction.accountCode) {
    errors.push('Account code is required');
  }

  if (!transaction.offsetAccountCode) {
    errors.push('Offset account code is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate frequency based on date range
 */
function calculateFrequency(startDate: Date, endDate: Date): 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' {
  const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays <= 7) {
    return 'daily';
  } else if (diffInDays <= 30) {
    return 'weekly';
  } else if (diffInDays <= 90) {
    return 'monthly';
  } else if (diffInDays <= 365) {
    return 'quarterly';
  } else {
    return 'annually';
  }
}

/**
 * Generate accrual entries for a schedule
 */
function generateAccrualEntries(
  transaction: AccrualTransaction,
  _options: AccrualOptions,
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
): AccrualEntry[] {
  const entries: AccrualEntry[] = [];
  const totalDays = Math.ceil((transaction.endDate.getTime() - transaction.startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let currentDate = new Date(transaction.startDate);
  let periodNumber = 1;
  
  while (isBeforeFns(currentDate, transaction.endDate) || isSameDate(currentDate, transaction.endDate)) {
    let periodEndDate: Date;
    let periodAmount: number;
    
    switch (frequency) {
      case 'daily':
        periodEndDate = addDaysFns(currentDate, 1);
        periodAmount = transaction.totalAmount / totalDays;
        break;
      case 'weekly':
        periodEndDate = addDaysFns(currentDate, 7);
        periodAmount = transaction.totalAmount / Math.ceil(totalDays / 7);
        break;
      case 'monthly':
        periodEndDate = addMonthsFns(currentDate, 1);
        periodAmount = transaction.totalAmount / Math.ceil(totalDays / 30);
        break;
      case 'quarterly':
        periodEndDate = addMonthsFns(currentDate, 3);
        periodAmount = transaction.totalAmount / Math.ceil(totalDays / 90);
        break;
      case 'annually':
        periodEndDate = addYearsFns(currentDate, 1);
        periodAmount = transaction.totalAmount / Math.ceil(totalDays / 365);
        break;
      default:
        periodEndDate = addDaysFns(currentDate, 1);
        periodAmount = transaction.totalAmount / totalDays;
    }
    
    // Ensure we don't exceed the end date
    if (isAfterFns(periodEndDate, transaction.endDate)) {
      periodEndDate = new Date(transaction.endDate);
    }
    
    // Create a mock fiscal period for the entry
    const mockPeriod: FiscalPeriod = {
      id: `P${periodNumber}`,
      year: currentDate.getFullYear(),
      period: periodNumber,
      name: `Period ${periodNumber}`,
      startDate: new Date(currentDate),
      endDate: new Date(periodEndDate),
      status: { status: 'open' },
      backdateWindow: 30,
    };
    
    entries.push({
      period: mockPeriod,
      amount: roundToCurrency(periodAmount, transaction.currency),
      posted: false,
    });
    
    currentDate = addDaysFns(periodEndDate, 1);
    periodNumber++;
  }
  
  return entries;
}

/**
 * Generate deferral entries for a schedule
 */
function generateDeferralEntries(
  transaction: DeferralTransaction,
  options: DeferralOptions,
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
): AccrualEntry[] {
  // Deferral entries are similar to accrual entries but with different accounting treatment
  return generateAccrualEntries(transaction as AccrualTransaction, options as AccrualOptions, frequency);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a simple accrual transaction
 */
export function createAccrualTransaction(
  description: string,
  amount: number,
  startDate: Date,
  endDate: Date,
  accountCode: string,
  offsetAccountCode: string,
  currency: SupportedCurrency = 'MYR'
): AccrualTransaction {
  return {
    id: `ACC-TXN-${Date.now()}`,
    description,
    totalAmount: amount,
    currency,
    startDate,
    endDate,
    accountCode,
    offsetAccountCode,
  };
}

/**
 * Create a simple deferral transaction
 */
export function createDeferralTransaction(
  description: string,
  amount: number,
  startDate: Date,
  endDate: Date,
  accountCode: string,
  offsetAccountCode: string,
  currency: SupportedCurrency = 'MYR'
): DeferralTransaction {
  return {
    id: `DEF-TXN-${Date.now()}`,
    description,
    totalAmount: amount,
    currency,
    startDate,
    endDate,
    accountCode,
    offsetAccountCode,
  };
}

/**
 * Get schedule summary
 */
export function getScheduleSummary(schedule: AccrualSchedule | DeferralSchedule): {
  id: string;
  description: string;
  totalAmount: number;
  currency: SupportedCurrency;
  totalEntries: number;
  postedEntries: number;
  remainingEntries: number;
  status: string;
} {
  if (!schedule) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Schedule is required',
      schedule,
      { operation: 'get-schedule-summary' }
    );
  }

  const postedEntries = schedule.entries.filter(entry => entry.posted).length;
  const remainingEntries = schedule.entries.length - postedEntries;

  return {
    id: schedule.id,
    description: schedule.description,
    totalAmount: schedule.totalAmount,
    currency: schedule.currency,
    totalEntries: schedule.entries.length,
    postedEntries,
    remainingEntries,
    status: schedule.status,
  };
}
