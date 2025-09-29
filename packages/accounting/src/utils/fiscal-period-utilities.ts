/**
 * Fiscal Period Utilities - Phase 1 Implementation
 * 
 * Manage configurable fiscal periods (4-4-5, monthly) with open/close rules and backdate windows.
 * Provides comprehensive fiscal period management and validation.
 * 
 * Features:
 * - Period configuration for different fiscal year structures
 * - Period status management (open/close/soft-lock)
 * - Backdate windows control
 * - Period validation and calculations
 * - Audit trail for status changes
 */

import { createValidationError } from './error-utilities';
import { addDaysFns, getEndOfMonth, isAfterFns, isBeforeFns, isSameDate } from './date-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PeriodStructure {
  type: 'monthly' | 'quarterly' | '4-4-5' | 'custom';
  periods: number;
  customPeriods?: CustomPeriodDefinition[];
}

export interface CustomPeriodDefinition {
  period: number;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface FiscalPeriod {
  id: string;
  year: number;
  period: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
  backdateWindow: number; // days
}

export interface FiscalYear {
  year: number;
  structure: PeriodStructure;
  periods: FiscalPeriod[];
  startDate: Date;
  endDate: Date;
}

export interface PeriodStatus {
  status: 'open' | 'closed' | 'soft-locked';
  openedAt?: Date;
  closedAt?: Date;
  openedBy?: string;
  closedBy?: string;
}

export interface PeriodStatusChange {
  period: FiscalPeriod;
  previousStatus: PeriodStatus;
  newStatus: PeriodStatus;
  changedAt: Date;
  changedBy: string;
  reason?: string;
}

export interface PeriodBoundary {
  period: number;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface BackdateValidationResult {
  isValid: boolean;
  isWithinWindow: boolean;
  daysRemaining: number;
  windowStart: Date;
  windowEnd: Date;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// PERIOD CONFIGURATION
// ============================================================================

/**
 * Create a fiscal year with specified structure
 */
export function createFiscalYear(year: number, structure: PeriodStructure): FiscalYear {
  if (typeof year !== 'number' || year < 1900 || year > 2100) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Year must be a valid number between 1900 and 2100',
      year,
      { operation: 'create-fiscal-year' }
    );
  }

  if (!structure) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Period structure is required',
      structure,
      { operation: 'create-fiscal-year' }
    );
  }

  // Validate period structure
  const structureValidation = validatePeriodStructure(structure);
  if (!structureValidation.isValid) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `Invalid period structure: ${structureValidation.errors.join(', ')}`,
      structure,
      { operation: 'create-fiscal-year' }
    );
  }

  // Calculate period boundaries
  const boundaries = calculatePeriodBoundaries(year, structure);
  
  // Create fiscal periods
  const periods: FiscalPeriod[] = boundaries.map(boundary => ({
    id: `FY${year}-P${boundary.period}`,
    year,
    period: boundary.period,
    name: boundary.name,
    startDate: boundary.startDate,
    endDate: boundary.endDate,
    status: {
      status: 'open',
      openedAt: new Date(),
    },
    backdateWindow: 30, // Default 30 days
  }));

  // Calculate fiscal year start and end dates
  const startDate = periods[0]?.startDate || new Date(year, 0, 1);
  const endDate = periods[periods.length - 1]?.endDate || new Date(year, 11, 31);

  return {
    year,
    structure,
    periods,
    startDate,
    endDate,
  };
}

/**
 * Validate period structure
 */
export function validatePeriodStructure(structure: PeriodStructure): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!structure) {
    errors.push('Period structure is required');
    return { isValid: false, errors, warnings };
  }

  // Validate structure type
  const validTypes = ['monthly', 'quarterly', '4-4-5', 'custom'];
  if (!structure.type || !validTypes.includes(structure.type)) {
    errors.push(`Invalid structure type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Validate periods count
  if (typeof structure.periods !== 'number' || structure.periods < 1 || structure.periods > 13) {
    errors.push('Periods count must be between 1 and 13');
  }

  // Validate custom periods
  if (structure.type === 'custom') {
    if (!structure.customPeriods || structure.customPeriods.length === 0) {
      errors.push('Custom periods are required for custom structure type');
    } else {
      // Validate each custom period
      for (let i = 0; i < structure.customPeriods.length; i++) {
        const customPeriod = structure.customPeriods[i]!;
        
        if (!customPeriod.name) {
          errors.push(`Custom period ${i + 1}: Name is required`);
        }
        
        if (!customPeriod.startDate || !customPeriod.endDate) {
          errors.push(`Custom period ${i + 1}: Start and end dates are required`);
        }
        
        if (customPeriod.startDate && customPeriod.endDate && isAfterFns(customPeriod.startDate, customPeriod.endDate)) {
          errors.push(`Custom period ${i + 1}: Start date must be before end date`);
        }
      }
      
      // Check for overlapping periods
      const sortedPeriods = [...structure.customPeriods].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      for (let i = 1; i < sortedPeriods.length; i++) {
        const prev = sortedPeriods[i - 1]!;
        const curr = sortedPeriods[i]!;
        
        if (isAfterFns(prev.endDate, curr.startDate)) {
          errors.push(`Overlapping periods detected: ${prev.name} and ${curr.name}`);
        }
      }
    }
  }

  // Validate 4-4-5 structure
  if (structure.type === '4-4-5' && structure.periods !== 12) {
    warnings.push('4-4-5 structure typically has 12 periods');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate period boundaries for a fiscal year
 */
export function calculatePeriodBoundaries(year: number, structure: PeriodStructure): PeriodBoundary[] {
  if (typeof year !== 'number' || year < 1900 || year > 2100) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Year must be a valid number between 1900 and 2100',
      year,
      { operation: 'calculate-period-boundaries' }
    );
  }

  if (!structure) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Period structure is required',
      structure,
      { operation: 'calculate-period-boundaries' }
    );
  }

  const boundaries: PeriodBoundary[] = [];

  switch (structure.type) {
    case 'monthly':
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(year, month, 1);
        const endDate = getEndOfMonth(startDate);
        
        boundaries.push({
          period: month + 1,
          name: `Month ${month + 1}`,
          startDate,
          endDate,
        });
      }
      break;

    case 'quarterly':
      for (let quarter = 0; quarter < 4; quarter++) {
        const startMonth = quarter * 3;
        const startDate = new Date(year, startMonth, 1);
        const endDate = new Date(year, startMonth + 2, 31);
        
        boundaries.push({
          period: quarter + 1,
          name: `Q${quarter + 1}`,
          startDate,
          endDate,
        });
      }
      break;

    case '4-4-5':
      // 4-4-5 structure: 4 weeks, 4 weeks, 5 weeks pattern
      const weeksPerPeriod = [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5];
      let currentDate = new Date(year, 0, 1);
      
      for (let period = 0; period < 12; period++) {
        const startDate = new Date(currentDate);
        const endDate = addDaysFns(currentDate, weeksPerPeriod[period]! * 7 - 1);
        
        boundaries.push({
          period: period + 1,
          name: `Period ${period + 1}`,
          startDate,
          endDate,
        });
        
        currentDate = addDaysFns(endDate, 1);
      }
      break;

    case 'custom':
      if (!structure.customPeriods) {
        throw createValidationError(
          'INVALID_ACCOUNTING_INPUT',
          'Custom periods are required for custom structure',
          structure,
          { operation: 'calculate-period-boundaries' }
        );
      }
      
      for (const customPeriod of structure.customPeriods) {
        boundaries.push({
          period: customPeriod.period,
          name: customPeriod.name,
          startDate: customPeriod.startDate,
          endDate: customPeriod.endDate,
        });
      }
      break;

    default:
      throw createValidationError(
        'INVALID_ACCOUNTING_INPUT',
        `Unsupported period structure type: ${structure.type}`,
        structure,
        { operation: 'calculate-period-boundaries' }
      );
  }

  return boundaries;
}

// ============================================================================
// STATUS MANAGEMENT
// ============================================================================

/**
 * Open a fiscal period
 */
export function openPeriod(period: FiscalPeriod): PeriodStatusChange {
  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'open-period' }
    );
  }

  const previousStatus = { ...period.status };
  
  if (period.status.status === 'open') {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Period is already open',
      period,
      { operation: 'open-period' }
    );
  }

  const newStatus: PeriodStatus = {
    status: 'open',
    openedAt: new Date(),
    openedBy: 'system', // Would be passed as parameter in real implementation
  };

  return {
    period,
    previousStatus,
    newStatus,
    changedAt: new Date(),
    changedBy: 'system',
    reason: 'Period opened for transactions',
  };
}

/**
 * Close a fiscal period
 */
export function closePeriod(period: FiscalPeriod): PeriodStatusChange {
  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'close-period' }
    );
  }

  const previousStatus = { ...period.status };
  
  if (period.status.status === 'closed') {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Period is already closed',
      period,
      { operation: 'close-period' }
    );
  }

  const newStatus: PeriodStatus = {
    ...previousStatus,
    status: 'closed',
    closedAt: new Date(),
    closedBy: 'system', // Would be passed as parameter in real implementation
  };

  return {
    period,
    previousStatus,
    newStatus,
    changedAt: new Date(),
    changedBy: 'system',
    reason: 'Period closed for month-end',
  };
}

/**
 * Soft lock a fiscal period
 */
export function softLockPeriod(period: FiscalPeriod): PeriodStatusChange {
  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'soft-lock-period' }
    );
  }

  const previousStatus = { ...period.status };
  
  if (period.status.status === 'soft-locked') {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Period is already soft-locked',
      period,
      { operation: 'soft-lock-period' }
    );
  }

  const newStatus: PeriodStatus = {
    ...previousStatus,
    status: 'soft-locked',
  };

  return {
    period,
    previousStatus,
    newStatus,
    changedAt: new Date(),
    changedBy: 'system',
    reason: 'Period soft-locked for review',
  };
}

/**
 * Get current period status
 */
export function getPeriodStatus(period: FiscalPeriod): PeriodStatus {
  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'get-period-status' }
    );
  }

  return { ...period.status };
}

// ============================================================================
// BACKDATE CONTROL
// ============================================================================

/**
 * Validate backdate window for a transaction
 */
export function validateBackdateWindow(
  period: FiscalPeriod,
  transactionDate: Date
): BackdateValidationResult {
  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'validate-backdate-window' }
    );
  }

  if (!transactionDate) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Transaction date is required',
      transactionDate,
      { operation: 'validate-backdate-window' }
    );
  }

  const window = calculateBackdateWindow(period);
  const isWithinWindow = isWithinBackdateWindow(period, transactionDate);
  
  let daysRemaining = 0;
  if (isWithinWindow) {
    daysRemaining = Math.ceil((window.end.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  const message = isWithinWindow
    ? `Transaction date is within backdate window. ${daysRemaining} days remaining.`
    : `Transaction date is outside backdate window. Window: ${window.start.toISOString().split('T')[0]} to ${window.end.toISOString().split('T')[0]}`;

  return {
    isValid: isWithinWindow,
    isWithinWindow,
    daysRemaining,
    windowStart: window.start,
    windowEnd: window.end,
    message,
  };
}

/**
 * Calculate backdate window for a period
 */
export function calculateBackdateWindow(period: FiscalPeriod): { start: Date; end: Date } {
  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'calculate-backdate-window' }
    );
  }

  const windowStart = period.startDate;
  const windowEnd = addDaysFns(period.endDate, period.backdateWindow);

  return {
    start: windowStart,
    end: windowEnd,
  };
}

/**
 * Check if a date is within backdate window
 */
export function isWithinBackdateWindow(period: FiscalPeriod, date: Date): boolean {
  if (!period) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal period is required',
      period,
      { operation: 'is-within-backdate-window' }
    );
  }

  if (!date) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Date is required',
      date,
      { operation: 'is-within-backdate-window' }
    );
  }

  const window = calculateBackdateWindow(period);
  
  return (isAfterFns(date, window.start) || isSameDate(date, window.start)) &&
         (isBeforeFns(date, window.end) || isSameDate(date, window.end));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Find fiscal period by date
 */
export function findPeriodByDate(fiscalYear: FiscalYear, date: Date): FiscalPeriod | null {
  if (!fiscalYear) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal year is required',
      fiscalYear,
      { operation: 'find-period-by-date' }
    );
  }

  if (!date) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Date is required',
      date,
      { operation: 'find-period-by-date' }
    );
  }

  for (const period of fiscalYear.periods) {
    if ((isAfterFns(date, period.startDate) || isSameDate(date, period.startDate)) &&
        (isBeforeFns(date, period.endDate) || isSameDate(date, period.endDate))) {
      return period;
    }
  }

  return null;
}

/**
 * Get next fiscal period
 */
export function getNextPeriod(currentPeriod: FiscalPeriod, fiscalYear: FiscalYear): FiscalPeriod | null {
  if (!currentPeriod) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Current period is required',
      currentPeriod,
      { operation: 'get-next-period' }
    );
  }

  if (!fiscalYear) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal year is required',
      fiscalYear,
      { operation: 'get-next-period' }
    );
  }

  const nextPeriodNumber = currentPeriod.period + 1;
  return fiscalYear.periods.find(period => period.period === nextPeriodNumber) || null;
}

/**
 * Get previous fiscal period
 */
export function getPreviousPeriod(currentPeriod: FiscalPeriod, fiscalYear: FiscalYear): FiscalPeriod | null {
  if (!currentPeriod) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Current period is required',
      currentPeriod,
      { operation: 'get-previous-period' }
    );
  }

  if (!fiscalYear) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal year is required',
      fiscalYear,
      { operation: 'get-previous-period' }
    );
  }

  const previousPeriodNumber = currentPeriod.period - 1;
  return fiscalYear.periods.find(period => period.period === previousPeriodNumber) || null;
}

/**
 * Get all open periods
 */
export function getOpenPeriods(fiscalYear: FiscalYear): FiscalPeriod[] {
  if (!fiscalYear) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal year is required',
      fiscalYear,
      { operation: 'get-open-periods' }
    );
  }

  return fiscalYear.periods.filter(period => period.status.status === 'open');
}

/**
 * Get all closed periods
 */
export function getClosedPeriods(fiscalYear: FiscalYear): FiscalPeriod[] {
  if (!fiscalYear) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal year is required',
      fiscalYear,
      { operation: 'get-closed-periods' }
    );
  }

  return fiscalYear.periods.filter(period => period.status.status === 'closed');
}

/**
 * Get current period (first open period)
 */
export function getCurrentPeriod(fiscalYear: FiscalYear): FiscalPeriod | null {
  if (!fiscalYear) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal year is required',
      fiscalYear,
      { operation: 'get-current-period' }
    );
  }

  const openPeriods = getOpenPeriods(fiscalYear);
  return openPeriods.length > 0 ? openPeriods[0]! : null;
}

/**
 * Create a monthly period structure
 */
export function createMonthlyStructure(): PeriodStructure {
  return {
    type: 'monthly',
    periods: 12,
  };
}

/**
 * Create a quarterly period structure
 */
export function createQuarterlyStructure(): PeriodStructure {
  return {
    type: 'quarterly',
    periods: 4,
  };
}

/**
 * Create a 4-4-5 period structure
 */
export function create445Structure(): PeriodStructure {
  return {
    type: '4-4-5',
    periods: 12,
  };
}

/**
 * Create a custom period structure
 */
export function createCustomStructure(customPeriods: CustomPeriodDefinition[]): PeriodStructure {
  if (!customPeriods || customPeriods.length === 0) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Custom periods are required',
      customPeriods,
      { operation: 'create-custom-structure' }
    );
  }

  return {
    type: 'custom',
    periods: customPeriods.length,
    customPeriods,
  };
}

/**
 * Get fiscal year summary
 */
export function getFiscalYearSummary(fiscalYear: FiscalYear): {
  year: number;
  totalPeriods: number;
  openPeriods: number;
  closedPeriods: number;
  softLockedPeriods: number;
  currentPeriod: FiscalPeriod | null;
  startDate: Date;
  endDate: Date;
} {
  if (!fiscalYear) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Fiscal year is required',
      fiscalYear,
      { operation: 'get-fiscal-year-summary' }
    );
  }

  const openPeriods = getOpenPeriods(fiscalYear);
  const closedPeriods = getClosedPeriods(fiscalYear);
  const softLockedPeriods = fiscalYear.periods.filter(period => period.status.status === 'soft-locked');
  const currentPeriod = getCurrentPeriod(fiscalYear);

  return {
    year: fiscalYear.year,
    totalPeriods: fiscalYear.periods.length,
    openPeriods: openPeriods.length,
    closedPeriods: closedPeriods.length,
    softLockedPeriods: softLockedPeriods.length,
    currentPeriod,
    startDate: fiscalYear.startDate,
    endDate: fiscalYear.endDate,
  };
}
