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
// CONSTANTS
// ============================================================================

// Error messages
const ERROR_MESSAGES = {
  PERIOD_STRUCTURE_REQUIRED: 'Period structure is required',
  FISCAL_PERIOD_REQUIRED: 'Fiscal period is required',
  FISCAL_YEAR_REQUIRED: 'Fiscal year is required',
} as const;

// Period status values
const PERIOD_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  SOFT_LOCKED: 'soft-locked',
} as const;

// Operation types
const OPERATION_TYPES = {
  CREATE_FISCAL_YEAR: 'create-fiscal-year',
  CALCULATE_PERIOD_BOUNDARIES: 'calculate-period-boundaries',
  OPEN_PERIOD: 'open-period',
  CLOSE_PERIOD: 'close-period',
  SOFT_LOCK_PERIOD: 'soft-lock-period',
  FIND_PERIOD_BY_DATE: 'find-period-by-date',
} as const;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PeriodStructure {
  type: 'monthly' | 'quarterly' | '4-4-5' | 'custom';
  periods: number;
  customPeriods?: CustomPeriodDefinition[];
  /**
   * Optional fiscal start month (0 = Jan, 11 = Dec). Defaults to 0 (January).
   * Applies to 'monthly', 'quarterly', and '4-4-5' structures.
   */
  startMonth?: number;
  /**
   * Higher-precision alternative to startMonth.
   * If provided, this takes precedence over startMonth for the fiscal year start anchor.
   * Example: new Date(2025, 3, 1) for an Apr 1 start.
   */
  fiscalYearStartDate?: Date;
  /**
   * For 4-4-5 calendars: if true, extend the FINAL period by +7 days
   * to create a 53-week fiscal year when needed. Default: false.
   * (Keeps naming stable; we annotate the last period's name.)
   */
  addExtraWeekAtYearEnd?: boolean;
  /**
   * Rule-based 53-week handling for 4-4-5 calendars.
   * - 'auto': Automatically detect when fiscal year ending Saturday would spill into next month
   * - 'never': Always use 52 weeks (standard year)
   * - 'always': Always use 53 weeks (extended year)
   * Default: 'auto'
   */
  fiftyThreeWeekRule?: 'auto' | 'never' | 'always';
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
      { operation: OPERATION_TYPES.CREATE_FISCAL_YEAR }
    );
  }

  if (!structure) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      ERROR_MESSAGES.PERIOD_STRUCTURE_REQUIRED,
      structure,
      { operation: OPERATION_TYPES.CREATE_FISCAL_YEAR }
    );
  }

  // Validate period structure
  const structureValidation = validatePeriodStructure(structure);
  if (!structureValidation.isValid) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      `Invalid period structure: ${structureValidation.errors.join(', ')}`,
      structure,
      { operation: OPERATION_TYPES.CREATE_FISCAL_YEAR }
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine if a 53-week year is needed based on calendar rules.
 * Rule: Add 53rd week when fiscal year ending Saturday would spill into next month.
 */
function shouldUse53WeekYear(startDate: Date, rule: 'auto' | 'never' | 'always'): boolean {
  switch (rule) {
    case 'never':
      return false;
    case 'always':
      return true;
    case 'auto':
    default:
      // Calculate what the 52-week year end would be
      const fiftyTwoWeekEnd = addDaysFns(startDate, 52 * 7 - 1);
      
      // Check if the 52-week end date falls on a Saturday
      const isSaturday = fiftyTwoWeekEnd.getDay() === 6; // 6 = Saturday
      
      // Check if adding one more week would push us into the next month
      const fiftyThreeWeekEnd = addDaysFns(fiftyTwoWeekEnd, 7);
      const wouldSpillIntoNextMonth = fiftyThreeWeekEnd.getMonth() !== fiftyTwoWeekEnd.getMonth();
      
      // Use 53 weeks if it's Saturday and would spill into next month
      return isSaturday && wouldSpillIntoNextMonth;
  }
}

// ============================================================================
// PERIOD STRUCTURE VALIDATION
// ============================================================================

/**
 * Validate period structure
 */
export function validatePeriodStructure(structure: PeriodStructure): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!structure) {
    errors.push(ERROR_MESSAGES.PERIOD_STRUCTURE_REQUIRED);
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

  // Validate optional startMonth
  if (structure.startMonth !== undefined) {
    if (
      typeof structure.startMonth !== 'number' ||
      structure.startMonth < 0 ||
      structure.startMonth > 11
    ) {
      errors.push('startMonth must be an integer between 0 (Jan) and 11 (Dec)');
    }
  }

  // Validate optional fiscalYearStartDate
  if (structure.fiscalYearStartDate !== undefined) {
    if (!(structure.fiscalYearStartDate instanceof Date) || isNaN(structure.fiscalYearStartDate.getTime())) {
      errors.push('fiscalYearStartDate must be a valid Date');
    }
    if (structure.startMonth !== undefined) {
      // Not an error: we allow both, but clarify precedence
      warnings.push('fiscalYearStartDate takes precedence over startMonth when both are provided');
    }
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

  // Gentle guidance for monthly/quarterly period counts
  if (structure.type === 'monthly' && structure.periods !== 12) {
    warnings.push('Monthly structure typically has 12 periods');
  }
  if (structure.type === 'quarterly' && structure.periods !== 4) {
    warnings.push('Quarterly structure typically has 4 periods');
  }

  // 4-4-5 specific flags
  if (structure.type === '4-4-5' && structure.addExtraWeekAtYearEnd !== undefined && typeof structure.addExtraWeekAtYearEnd !== 'boolean') {
    errors.push('addExtraWeekAtYearEnd must be a boolean when provided');
  }
  if (structure.type === '4-4-5' && structure.fiftyThreeWeekRule !== undefined) {
    const validRules = ['auto', 'never', 'always'];
    if (!validRules.includes(structure.fiftyThreeWeekRule)) {
      errors.push(`fiftyThreeWeekRule must be one of: ${validRules.join(', ')}`);
    }
  }
  
  // Warn when both 53-week options are provided
  if (structure.type === '4-4-5' && structure.addExtraWeekAtYearEnd !== undefined && structure.fiftyThreeWeekRule !== undefined) {
    warnings.push('addExtraWeekAtYearEnd takes precedence over fiftyThreeWeekRule when both are provided');
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
      { operation: OPERATION_TYPES.CALCULATE_PERIOD_BOUNDARIES }
    );
  }

  if (!structure) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      ERROR_MESSAGES.PERIOD_STRUCTURE_REQUIRED,
      structure,
      { operation: OPERATION_TYPES.CALCULATE_PERIOD_BOUNDARIES }
    );
  }

  const boundaries: PeriodBoundary[] = [];

  const startMonth = structure.startMonth ?? 0; // default Jan
  const startOfFiscalYear = structure.fiscalYearStartDate
    ? new Date(structure.fiscalYearStartDate) // take precedence if provided
    : new Date(year, startMonth, 1);

  // Helper to add months with year wrap
  const addMonths = (d: Date, m: number) => {
    const copy = new Date(d);
    copy.setMonth(copy.getMonth() + m);
    return copy;
  };

  switch (structure.type) {
    case 'monthly':
      for (let i = 0; i < 12; i++) {
        const startDate = addMonths(startOfFiscalYear, i);
        const endDate = getEndOfMonth(startDate);
        
        boundaries.push({
          period: i + 1,
          name: `Month ${i + 1}`,
          startDate,
          endDate,
        });
      }
      break;

    case 'quarterly':
      for (let quarter = 0; quarter < 4; quarter++) {
        const qm = quarter * 3;
        const startDate = addMonths(startOfFiscalYear, qm);
        // Use end-of-month for the quarter's third month to avoid invalid date bugs
        const quarterThirdMonth = addMonths(startOfFiscalYear, qm + 2);
        const endDate = getEndOfMonth(quarterThirdMonth);
        
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
      let currentDate = new Date(startOfFiscalYear);
      
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

      // Rule-based 53-week adjustment
      const rule = structure.fiftyThreeWeekRule ?? 'auto';
      const use53Weeks = shouldUse53WeekYear(startOfFiscalYear, rule);
      
      // Legacy support: addExtraWeekAtYearEnd takes precedence if explicitly set
      const shouldExtend = structure.addExtraWeekAtYearEnd ?? use53Weeks;
      
      if (shouldExtend) {
        const last = boundaries[boundaries.length - 1];
        if (last) {
          last.endDate = addDaysFns(last.endDate, 7);
          last.name = `${last.name} (53w)`;
        }
      }
      break;

    case 'custom':
      if (!structure.customPeriods) {
        throw createValidationError(
          'INVALID_ACCOUNTING_INPUT',
          'Custom periods are required for custom structure',
          structure,
          { operation: OPERATION_TYPES.CALCULATE_PERIOD_BOUNDARIES }
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
        { operation: OPERATION_TYPES.CALCULATE_PERIOD_BOUNDARIES }
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
      ERROR_MESSAGES.FISCAL_PERIOD_REQUIRED,
      period,
      { operation: OPERATION_TYPES.OPEN_PERIOD }
    );
  }

  const previousStatus = { ...period.status };
  
  if (period.status.status === 'open') {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Period is already open',
      period,
      { operation: OPERATION_TYPES.OPEN_PERIOD }
    );
  }

  const newStatus: PeriodStatus = {
    status: 'open',
    openedAt: new Date(),
    openedBy: 'system', // Would be passed as parameter in real implementation
  };

  // Apply mutation so caller's period reflects the new status
  period.status = newStatus;

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
      ERROR_MESSAGES.FISCAL_PERIOD_REQUIRED,
      period,
      { operation: OPERATION_TYPES.CLOSE_PERIOD }
    );
  }

  const previousStatus = { ...period.status };
  
  if (period.status.status === 'closed') {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Period is already closed',
      period,
      { operation: OPERATION_TYPES.CLOSE_PERIOD }
    );
  }

  const newStatus: PeriodStatus = {
    ...previousStatus,
    status: 'closed',
    closedAt: new Date(),
    closedBy: 'system', // Would be passed as parameter in real implementation
  };

  // Apply mutation so caller's period reflects the new status
  period.status = newStatus;

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
      ERROR_MESSAGES.FISCAL_PERIOD_REQUIRED,
      period,
      { operation: OPERATION_TYPES.SOFT_LOCK_PERIOD }
    );
  }

  const previousStatus = { ...period.status };
  
  if (period.status.status === PERIOD_STATUS.SOFT_LOCKED) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Period is already soft-locked',
      period,
      { operation: OPERATION_TYPES.SOFT_LOCK_PERIOD }
    );
  }

  const newStatus: PeriodStatus = {
    ...previousStatus,
    status: PERIOD_STATUS.SOFT_LOCKED,
  };

  // Apply mutation so caller's period reflects the new status
  period.status = newStatus;

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
      ERROR_MESSAGES.FISCAL_PERIOD_REQUIRED,
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
      ERROR_MESSAGES.FISCAL_PERIOD_REQUIRED,
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
      ERROR_MESSAGES.FISCAL_PERIOD_REQUIRED,
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
      ERROR_MESSAGES.FISCAL_PERIOD_REQUIRED,
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
      ERROR_MESSAGES.FISCAL_YEAR_REQUIRED,
      fiscalYear,
      { operation: OPERATION_TYPES.FIND_PERIOD_BY_DATE }
    );
  }

  if (!date) {
    throw createValidationError(
      'INVALID_ACCOUNTING_INPUT',
      'Date is required',
      date,
      { operation: OPERATION_TYPES.FIND_PERIOD_BY_DATE }
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
      ERROR_MESSAGES.FISCAL_YEAR_REQUIRED,
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
      ERROR_MESSAGES.FISCAL_YEAR_REQUIRED,
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
      ERROR_MESSAGES.FISCAL_YEAR_REQUIRED,
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
      ERROR_MESSAGES.FISCAL_YEAR_REQUIRED,
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
      ERROR_MESSAGES.FISCAL_YEAR_REQUIRED,
      fiscalYear,
      { operation: 'get-current-period' }
    );
  }

  const openPeriods = getOpenPeriods(fiscalYear);
  // Prefer the open period with the earliest start date (first open chronologically)
  if (openPeriods.length === 0) return null;
  return openPeriods.slice().sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0]!;
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
      ERROR_MESSAGES.FISCAL_YEAR_REQUIRED,
      fiscalYear,
      { operation: 'get-fiscal-year-summary' }
    );
  }

  const openPeriods = getOpenPeriods(fiscalYear);
  const closedPeriods = getClosedPeriods(fiscalYear);
  const softLockedPeriods = fiscalYear.periods.filter(period => period.status.status === PERIOD_STATUS.SOFT_LOCKED);
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
