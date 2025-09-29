/**
 * Accounting Period Management Service
 *
 * Provides comprehensive accounting period management with MFRS compliance:
 * - Period creation and validation
 * - Period status management (OPEN, CLOSED, LOCKED, FINALIZED)
 * - Period-based workflow controls
 * - Multi-fiscal year support
 * - SEA market compliance
 */

import { Injectable, Logger } from '@nestjs/common';
import { addMonthsToDate, getEndOfMonth, isEmpty } from '../utils';
import { createBusinessError, createValidationError, ErrorContext } from '../utils/error-utilities';
import { PerformanceProfiler, createProfiler, PerformanceTimer, Cache, createCache } from '../utils/performance-utilities';

// Constants for error messages
const PERIOD_CREATION_FAILED_MESSAGE = 'Failed to create accounting period: {error}';
const ACCOUNTING_PERIOD_ENTITY = 'AccountingPeriod';
const PERIOD_CREATION_FAILED_ERROR_CODE = 'period-creation-failed';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

export type PeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED' | 'FINALIZED';

export type FiscalYearEnd = 'DEC' | 'MAR' | 'JUN' | 'SEP';

export interface AccountingPeriod {
  periodId: string; // Format: "2024-01", "2024-Q1", "2024"
  periodName: string; // "January 2024", "Q1 2024", "FY 2024"
  fiscalYear: number;
  periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  status: PeriodStatus;
  startDate: Date;
  endDate: Date;
  lockDate?: Date;
  finalizeDate?: Date;
  allowAdjustments: boolean;
  allowClosingEntries: boolean;
  jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH';
  reportingStandard: 'MFRS' | 'IFRS' | 'GAAP' | 'LOCAL';
  createdAt: Date;
  updatedAt: Date;
}

export interface PeriodValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canPost: boolean;
  requiresAdjustingEntry: boolean;
  requiresClosingEntry: boolean;
}

export interface PeriodWorkflowOptions {
  allowAdjustments: boolean;
  allowClosingEntries: boolean;
  autoLockAfterDays: number;
  requireApprovalForAdjustments: boolean;
  requireApprovalForClosing: boolean;
}

@Injectable()
export class AccountingPeriodService {
  private readonly logger = new Logger(AccountingPeriodService.name);
  private readonly profiler: PerformanceProfiler;
  private readonly periods: Map<string, AccountingPeriod> = new Map();
  private readonly workflowOptions: Map<string, PeriodWorkflowOptions> = new Map();
  private readonly periodCache: Cache<AccountingPeriod>;
  private readonly validationCache: Cache<PeriodValidationResult>;

  constructor() {
    this.profiler = createProfiler();
    this.periodCache = createCache<AccountingPeriod>({
      maxSize: 500,
      ttl: 300000, // 5 minutes
    });
    this.validationCache = createCache<PeriodValidationResult>({
      maxSize: 1000,
      ttl: 60000, // 1 minute
    });
    this.initializeDefaultWorkflowOptions();
  }

  /**
   * Create a new accounting period
   */
  createPeriod(
    fiscalYear: number,
    periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
    periodNumber: number,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH' = 'MY',
    reportingStandard: 'MFRS' | 'IFRS' | 'GAAP' | 'LOCAL' = 'MFRS',
  ): AccountingPeriod {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId: 'system',
      operation: 'createPeriod',
      data: { fiscalYear, periodType, periodNumber, jurisdiction, reportingStandard },
    };

    try {
      // Validate input parameters
      if (!fiscalYear || fiscalYear < 1900 || fiscalYear > 2100) {
        throw createValidationError('fiscalYear', 'Fiscal year must be between 1900 and 2100', fiscalYear, errorContext);
      }

      if (!['MONTHLY', 'QUARTERLY', 'ANNUAL'].includes(periodType)) {
        throw createValidationError('periodType', 'Invalid period type', periodType, errorContext);
      }

      if (periodType === 'MONTHLY' && (periodNumber < 1 || periodNumber > 12)) {
        throw createValidationError('periodNumber', 'Monthly period number must be between 1 and 12', periodNumber, errorContext);
      }

      if (periodType === 'QUARTERLY' && (periodNumber < 1 || periodNumber > 4)) {
        throw createValidationError('periodNumber', 'Quarterly period number must be between 1 and 4', periodNumber, errorContext);
      }

      if (periodType === 'ANNUAL' && periodNumber !== 1) {
        throw createValidationError('periodNumber', 'Annual period number must be 1', periodNumber, errorContext);
      }

      const periodId = this.generatePeriodId(fiscalYear, periodType, periodNumber);
      
      // Check if period already exists
      if (this.periods.has(periodId)) {
        throw createBusinessError(
          'period-already-exists',
          `Period ${periodId} already exists`,
          ACCOUNTING_PERIOD_ENTITY,
          errorContext
        );
      }

      const periodName = this.generatePeriodName(fiscalYear, periodType, periodNumber);
      const { startDate, endDate } = this.calculatePeriodDates(
        fiscalYear,
        periodType,
        periodNumber,
        jurisdiction,
      );

      const period: AccountingPeriod = {
        periodId,
        periodName,
        fiscalYear,
        periodType,
        status: 'OPEN',
        startDate,
        endDate,
        allowAdjustments: true,
        allowClosingEntries: false,
        jurisdiction,
        reportingStandard,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.periods.set(periodId, period);
      this.periodCache.set(periodId, period);

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);

      this.logger.log(`Created accounting period: ${periodId} (${periodName})`);
      return period;
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      if (error instanceof Error && (error.name === 'ValidationError' || error.name === 'BusinessRuleError')) {
        throw error;
      }
      
      this.logger.error(`Failed to create period:`, error);
      throw createBusinessError(
        PERIOD_CREATION_FAILED_ERROR_CODE,
        PERIOD_CREATION_FAILED_MESSAGE.replace('{error}', error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE),
        ACCOUNTING_PERIOD_ENTITY,
        errorContext
      );
    }
  }

  /**
   * Get accounting period by ID
   */
  getPeriod(periodId: string): AccountingPeriod | undefined {
    const timer = new PerformanceTimer();
    
    try {
      // Check cache first
      const cached = this.periodCache.get(periodId);
      if (cached) {
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return cached;
      }

      // Get from memory store
      const period = this.periods.get(periodId);
      if (period) {
        this.periodCache.set(periodId, period);
      }

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      return period;
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      this.logger.error(`Failed to get period ${periodId}:`, error);
      return undefined;
    }
  }

  /**
   * Get current accounting period for a date
   */
  getCurrentPeriod(
    date: Date,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH' = 'MY',
  ): AccountingPeriod | undefined {
    const fiscalYear = this.getFiscalYear(date, jurisdiction);
    const periodType = 'MONTHLY';
    const periodNumber = this.getPeriodNumber(date, jurisdiction);

    const periodId = this.generatePeriodId(fiscalYear, periodType, periodNumber);
    return this.getPeriod(periodId);
  }

  /**
   * Validate if posting is allowed to a period
   */
  validatePosting(
    periodId: string,
    isAdjustingEntry: boolean = false,
    isClosingEntry: boolean = false,
  ): PeriodValidationResult {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId: 'system',
      operation: 'validatePosting',
      data: { periodId, isAdjustingEntry, isClosingEntry },
    };

    try {
      // Validate input
      if (!periodId) {
        throw createValidationError('periodId', 'Period ID is required', periodId, errorContext);
      }

      // Check cache first
      const cacheKey = `${periodId}-${isAdjustingEntry}-${isClosingEntry}`;
      const cached = this.validationCache.get(cacheKey);
      if (cached) {
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return cached;
      }

      const period = this.getPeriod(periodId);
      if (!period) {
        const result: PeriodValidationResult = {
          isValid: false,
          errors: [`Period ${periodId} not found`],
          warnings: [],
          canPost: false,
          requiresAdjustingEntry: false,
          requiresClosingEntry: false,
        };
        this.validationCache.set(cacheKey, result);
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return result;
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      let canPost = true;
      let requiresAdjustingEntry = false;
      let requiresClosingEntry = false;

      // Check period status
      switch (period.status) {
        case 'OPEN':
          // Can post normally
          break;
        case 'CLOSED':
          if (!isAdjustingEntry) {
            errors.push(`Period ${periodId} is closed. Adjusting entries only.`);
            requiresAdjustingEntry = true;
            canPost = false;
          } else if (!period.allowAdjustments) {
            errors.push(`Period ${periodId} does not allow adjustments.`);
            canPost = false;
          }
          break;
        case 'LOCKED':
          errors.push(`Period ${periodId} is locked and cannot accept any entries.`);
          canPost = false;
          break;
        case 'FINALIZED':
          errors.push(`Period ${periodId} is finalized and cannot accept any entries.`);
          canPost = false;
          break;
      }

      // Check closing entry requirements
      if (isClosingEntry && !period.allowClosingEntries) {
        errors.push(`Period ${periodId} does not allow closing entries.`);
        canPost = false;
      }

      // Check workflow options
      const workflowOptions = this.workflowOptions.get(period.jurisdiction);
      if (workflowOptions) {
        if (isAdjustingEntry && workflowOptions.requireApprovalForAdjustments) {
          warnings.push('Adjusting entries require approval for this period.');
        }
        if (isClosingEntry && workflowOptions.requireApprovalForClosing) {
          warnings.push('Closing entries require approval for this period.');
        }
      }

      const result: PeriodValidationResult = {
        isValid: isEmpty(errors),
        errors,
        warnings,
        canPost,
        requiresAdjustingEntry,
        requiresClosingEntry,
      };

      // Cache the result
      this.validationCache.set(cacheKey, result);

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);

      return result;
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      if (error instanceof Error && error.name === 'ValidationError') {
        throw error;
      }
      
      this.logger.error(`Failed to validate posting for period ${periodId}:`, error);
      throw createBusinessError(
        'posting-validation-failed',
        `Failed to validate posting: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        ACCOUNTING_PERIOD_ENTITY,
        errorContext
      );
    }
  }

  /**
   * Update period status
   */
  updatePeriodStatus(periodId: string, status: PeriodStatus, updatedBy: string): AccountingPeriod {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId: 'system',
      operation: 'updatePeriodStatus',
      data: { periodId, status, updatedBy },
    };

    try {
      // Validate input
      if (!periodId) {
        throw createValidationError('periodId', 'Period ID is required', periodId, errorContext);
      }

      if (!status) {
        throw createValidationError('status', 'Status is required', status, errorContext);
      }

      if (!updatedBy) {
        throw createValidationError('updatedBy', 'Updated by is required', updatedBy, errorContext);
      }

      const period = this.getPeriod(periodId);
      if (!period) {
        throw createBusinessError(
          'period-not-found',
          `Period ${periodId} not found`,
          ACCOUNTING_PERIOD_ENTITY,
          errorContext
        );
      }

      // Validate status transition
      this.validateStatusTransition(period.status, status);

      const updatedPeriod: AccountingPeriod = {
        ...period,
        status,
        updatedAt: new Date(),
      };

      // Set lock/finalize dates
      if (status === 'LOCKED' && !period.lockDate) {
        updatedPeriod.lockDate = new Date();
      }
      if (status === 'FINALIZED' && !period.finalizeDate) {
        updatedPeriod.finalizeDate = new Date();
      }

      this.periods.set(periodId, updatedPeriod);
      this.periodCache.set(periodId, updatedPeriod);
      
      // Clear validation cache for this period
      this.clearValidationCacheForPeriod(periodId);

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);

      this.logger.log(`Updated period ${periodId} status to ${status} by ${updatedBy}`);
      return updatedPeriod;
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      if (error instanceof Error && (error.name === 'ValidationError' || error.name === 'BusinessRuleError')) {
        throw error;
      }
      
      this.logger.error(`Failed to update period status for ${periodId}:`, error);
      throw createBusinessError(
        'period-status-update-failed',
        `Failed to update period status: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        ACCOUNTING_PERIOD_ENTITY,
        errorContext
      );
    }
  }

  /**
   * Get periods for a fiscal year
   */
  getPeriodsForFiscalYear(
    fiscalYear: number,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH' = 'MY',
  ): AccountingPeriod[] {
    return Array.from(this.periods.values()).filter(
      (period) => period.fiscalYear === fiscalYear && period.jurisdiction === jurisdiction,
    );
  }

  /**
   * Get all periods for a jurisdiction
   */
  getPeriodsForJurisdiction(
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): AccountingPeriod[] {
    return Array.from(this.periods.values()).filter(
      (period) => period.jurisdiction === jurisdiction,
    );
  }

  /**
   * Generate period ID
   */
  private generatePeriodId(
    fiscalYear: number,
    periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
    periodNumber: number,
  ): string {
    const errorContext: ErrorContext = {
      tenantId: 'system',
      operation: 'generatePeriodId',
      data: { fiscalYear, periodType, periodNumber },
    };

    switch (periodType) {
      case 'MONTHLY':
        return `${fiscalYear}-${periodNumber.toString().padStart(2, '0')}`;
      case 'QUARTERLY':
        return `${fiscalYear}-Q${periodNumber}`;
      case 'ANNUAL':
        return `${fiscalYear}`;
      default:
        throw createValidationError('periodType', `Invalid period type: ${periodType}`, periodType, errorContext);
    }
  }

  /**
   * Generate period name
   */
  private generatePeriodName(
    fiscalYear: number,
    periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
    periodNumber: number,
  ): string {
    const errorContext: ErrorContext = {
      tenantId: 'system',
      operation: 'generatePeriodName',
      data: { fiscalYear, periodType, periodNumber },
    };

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    switch (periodType) {
      case 'MONTHLY':
        if (periodNumber < 1 || periodNumber > 12) {
          throw createValidationError('periodNumber', 'Monthly period number must be between 1 and 12', periodNumber, errorContext);
        }
        return `${monthNames[periodNumber - 1]} ${fiscalYear}`;
      case 'QUARTERLY':
        return `Q${periodNumber} ${fiscalYear}`;
      case 'ANNUAL':
        return `FY ${fiscalYear}`;
      default:
        throw createValidationError('periodType', `Invalid period type: ${periodType}`, periodType, errorContext);
    }
  }

  /**
   * Calculate period dates based on jurisdiction
   */
  private calculatePeriodDates(
    fiscalYear: number,
    periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
    periodNumber: number,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): { startDate: Date; endDate: Date } {
    const fiscalYearStart = this.getFiscalYearStart(fiscalYear, jurisdiction);

    switch (periodType) {
      case 'MONTHLY': {
        const startDate = addMonthsToDate(fiscalYearStart, periodNumber - 1);
        const endDate = getEndOfMonth(startDate);
        return { startDate, endDate };
      }
      case 'QUARTERLY': {
        const startDate = addMonthsToDate(fiscalYearStart, (periodNumber - 1) * 3);
        const endDate = addMonthsToDate(startDate, 3);
        endDate.setDate(0); // Last day of the quarter
        return { startDate, endDate };
      }
      case 'ANNUAL': {
        const startDate = new Date(fiscalYearStart);
        const endDate = new Date(fiscalYearStart);
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1); // Last day of the fiscal year
        return { startDate, endDate };
      }
      default:
        throw createValidationError(
          'INVALID_PERIOD_TYPE',
          `Invalid period type: ${periodType}`,
          periodType,
          { operation: 'calculate-period-dates' }
        );
    }
  }

  /**
   * Get fiscal year for a date based on jurisdiction
   */
  private getFiscalYear(
    date: Date,
    _jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): number {
    const year = date.getFullYear();

    // Most jurisdictions use calendar year (January to December)
    // Some use different fiscal years
    switch (_jurisdiction) {
      case 'MY': // Malaysia: Calendar year
      case 'SG': // Singapore: Calendar year
      case 'VN': // Vietnam: Calendar year
      case 'ID': // Indonesia: Calendar year
      case 'TH': // Thailand: Calendar year
      case 'PH': // Philippines: Calendar year
        return year;
      default:
        return year;
    }
  }

  /**
   * Get fiscal year start date
   */
  private getFiscalYearStart(
    fiscalYear: number,
    _jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): Date {
    // Most jurisdictions start fiscal year in January
    return new Date(fiscalYear, 0, 1); // January 1st
  }

  /**
   * Get period number for a date
   */
  private getPeriodNumber(
    date: Date,
    _jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): number {
    return date.getMonth() + 1;
  }

  /**
   * Clear validation cache for a specific period
   */
  private clearValidationCacheForPeriod(periodId: string): void {
    // Since we can't iterate over cache keys directly, we'll use a pattern-based approach
    // This is a simplified approach - in a real implementation, you might want to track cache keys
    const patterns = [
      `${periodId}-true-true`,
      `${periodId}-true-false`,
      `${periodId}-false-true`,
      `${periodId}-false-false`,
    ];
    
    patterns.forEach(key => {
      this.validationCache.delete(key);
    });
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: PeriodStatus, newStatus: PeriodStatus): void {
    const errorContext: ErrorContext = {
      tenantId: 'system',
      operation: 'validateStatusTransition',
      data: { currentStatus, newStatus },
    };

    const validTransitions: Record<PeriodStatus, PeriodStatus[]> = {
      OPEN: ['CLOSED', 'LOCKED'],
      CLOSED: ['OPEN', 'LOCKED'],
      LOCKED: ['FINALIZED'],
      FINALIZED: [], // Cannot transition from finalized
    };

    // Safe access to prevent object injection
    let allowedTransitions: PeriodStatus[];
    switch (currentStatus) {
      case 'OPEN':
        allowedTransitions = validTransitions.OPEN;
        break;
      case 'CLOSED':
        allowedTransitions = validTransitions.CLOSED;
        break;
      case 'LOCKED':
        allowedTransitions = validTransitions.LOCKED;
        break;
      case 'FINALIZED':
        allowedTransitions = validTransitions.FINALIZED;
        break;
      default:
        throw createValidationError('currentStatus', `Invalid current status: ${currentStatus}`, currentStatus, errorContext);
    }

    if (!allowedTransitions.includes(newStatus)) {
      throw createBusinessError(
        'invalid-status-transition',
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        ACCOUNTING_PERIOD_ENTITY,
        errorContext
      );
    }
  }

  /**
   * Initialize default workflow options for each jurisdiction
   */
  private initializeDefaultWorkflowOptions(): void {
    // Malaysia (MFRS)
    this.workflowOptions.set('MY', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 30,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });

    // Singapore (IFRS)
    this.workflowOptions.set('SG', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 45,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });

    // Vietnam (VAS)
    this.workflowOptions.set('VN', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 30,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });

    // Indonesia (PSAK)
    this.workflowOptions.set('ID', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 30,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });

    // Thailand (TFRS)
    this.workflowOptions.set('TH', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 30,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });

    // Philippines (PFRS)
    this.workflowOptions.set('PH', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 30,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });
  }

  /**
   * Set workflow options for a jurisdiction
   */
  setWorkflowOptions(
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
    options: PeriodWorkflowOptions,
  ): void {
    this.workflowOptions.set(jurisdiction, options);
  }

  /**
   * Get workflow options for a jurisdiction
   */
  getWorkflowOptions(
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): PeriodWorkflowOptions | undefined {
    return this.workflowOptions.get(jurisdiction);
  }
}
