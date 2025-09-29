/**
 * UI Controller (Express-compatible)
 *
 * Enterprise-grade REST API controller for UI-specific accounting operations.
 * Provides optimized endpoints for frontend components.
 *
 * Express-compatible version of the NestJS UIController
 */

import type { Request, Response } from 'express';
import type { UIIntegrationService } from '../services/ui-integration.service.js';
import { isEmpty, roundAmount } from '../utils';

const TENANT_ID_HEADER = 'x-tenant-id';
const USER_ID_HEADER = 'x-user-id';
const INVALID_DATE_FORMAT_MESSAGE = 'Invalid date or period format';

export class UIControllerExpress {
  constructor(private readonly uiIntegrationService: UIIntegrationService) {}

  // --------- helpers (controller-local) ----------
  private respond(res: Response, status: number, payload: Record<string, unknown>): void {
    res.status(status).json({ ...payload, timestamp: new Date().toISOString() });
  }

  private fail(res: Response, status: number, message: string, error?: unknown): void {
    this.respond(res, status, {
      success: false,
      message,
      error: error instanceof Error ? error.message : (error ?? message),
    });
  }
  private requireContext(req: Request, res: Response): { tenantId: string; userId: string } | null {
    const tenantId = req.headers[TENANT_ID_HEADER as keyof typeof req.headers] as string;
    const userId = req.headers[USER_ID_HEADER as keyof typeof req.headers] as string;
    if (!tenantId) {
      this.fail(res, 400, 'Tenant ID is required');
      return null;
    }
    if (!userId) {
      this.fail(res, 400, 'User ID is required');
      return null;
    }
    return { tenantId, userId };
  }
  private parseBool(v?: string): boolean | undefined {
    if (v == null) return undefined;
    if (v === 'true') return true;
    if (v === 'false') return false;
    return undefined;
  }
  private parseIntSafe(v?: string): number | undefined {
    if (v == null) return undefined;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }
  private parseDateISO(v?: string): Date | undefined {
    if (!v) return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  private parseAccountingPeriod(v?: string): 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | undefined {
    if (!v) return undefined;
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    return validPeriods.includes(v) ? v as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' : undefined;
  }
  private ensureLinesValid(
    res: Response,
    entries: Array<{
      accountCode: string;
      debitAmount: number;
      creditAmount: number;
      currency: string;
      description: string;
    }>,
  ): boolean {
    if (!Array.isArray(entries) || isEmpty(entries)) {
      this.fail(res, 400, 'entries is required and cannot be empty');
      return false;
    }
    let deb = 0,
      cred = 0;
    for (const [index, e] of entries.entries()) {
      if (!e || typeof e !== 'object') {
        this.fail(res, 400, `entries[${index}] must be an object`);
        return false;
      }
      if (!e.accountCode) {
        this.fail(res, 400, `entries[${index}].accountCode is required`);
        return false;
      }
      const d = Number(e.debitAmount ?? 0);
      const c = Number(e.creditAmount ?? 0);
      if (!Number.isFinite(d) || d < 0) {
        this.fail(res, 400, `entries[${index}].debitAmount must be a non-negative number`);
        return false;
      }
      if (!Number.isFinite(c) || c < 0) {
        this.fail(res, 400, `entries[${index}].creditAmount must be a non-negative number`);
        return false;
      }
      if (d > 0 && c > 0) {
        this.fail(res, 400, `entries[${index}] cannot have both debit and credit > 0`);
        return false;
      }
      deb += d;
      cred += c;
    }
    // UI balance check is cheap; service does the authoritative validation anyway
    if (roundAmount(deb - cred) !== 0) {
      this.fail(res, 400, `Unbalanced journal: debits ${deb} != credits ${cred}`);
      return false;
    }
    return true;
  }
  // -----------------------------------------------

  /**
   * Get accounts optimized for UI display
   * GET /api/v1/accounting/ui/accounts
   */
  async getAccountsForUI(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const { includeInactive, parentCode, accountType, searchTerm } = req.query;
      const uiContext = await this.uiIntegrationService.getAccountingContext(
        context.tenantId,
        context.userId,
      );

      const parsedInclude = this.parseBool(includeInactive as string);
      if (includeInactive != null && parsedInclude == null) {
        this.fail(res, 400, "includeInactive must be 'true' or 'false'");
        return;
      }
      const options = {
        includeInactive: parsedInclude ?? false,
        ...(parentCode && { parentCode: parentCode as string }),
        ...(accountType && { accountType: accountType as string }),
        ...(searchTerm && { searchTerm: searchTerm as string }),
      };

      const result = await this.uiIntegrationService.getAccountsForUI(uiContext, options);
      this.respond(res, 200, {
        success: true,
        message: 'Accounts retrieved successfully',
        data: result,
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to get accounts for UI', error);
    }
  }

  /**
   * Get journal entries optimized for UI display
   * GET /api/v1/accounting/ui/journal-entries
   */
  async getJournalEntriesForUI(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const { startDate, endDate, accountCode, reference, limit, offset } = req.query;
      const uiContext = await this.uiIntegrationService.getAccountingContext(
        context.tenantId,
        context.userId,
      );

      const start = this.parseDateISO(startDate as string);
      const end = this.parseDateISO(endDate as string);
      if (startDate && !start) {
        this.fail(res, 400, 'startDate must be a valid ISO date');
        return;
      }
      if (endDate && !end) {
        this.fail(res, 400, 'endDate must be a valid ISO date');
        return;
      }
      if (start && end && start > end) {
        this.fail(res, 400, 'startDate must be <= endDate');
        return;
      }
      const lim = this.parseIntSafe(limit as string);
      const off = this.parseIntSafe(offset as string);
      if (limit && lim == null) {
        this.fail(res, 400, 'limit must be a non-negative integer');
        return;
      }
      if (offset && off == null) {
        this.fail(res, 400, 'offset must be a non-negative integer');
        return;
      }
      const options = {
        ...(start && { startDate: start }),
        ...(end && { endDate: end }),
        ...(accountCode && { accountCode: accountCode as string }),
        ...(reference && { reference: reference as string }),
        ...(lim !== undefined && { limit: lim }),
        ...(off !== undefined && { offset: off }),
      };

      const result = await this.uiIntegrationService.getJournalEntriesForUI(uiContext, options);
      res.status(200).json({
        success: true,
        message: 'Journal entries retrieved successfully',
        data: result,
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to get journal entries for UI', error);
    }
  }

  /**
   * Validate journal entry balance for real-time UI feedback
   * POST /api/v1/accounting/ui/validate-balance
   */
  async validateJournalEntryBalance(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const uiContext = await this.uiIntegrationService.getAccountingContext(
        context.tenantId,
        context.userId,
      );
      if (!this.ensureLinesValid(res, req.body?.entries)) return;

      const result = await this.uiIntegrationService.validateJournalEntryBalance(
        uiContext,
        req.body.entries,
      );
      res.status(200).json({
        success: true,
        message: 'Journal entry balance validated',
        data: result,
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to validate journal entry balance', error);
    }
  }

  /**
   * Create account from UI
   * POST /api/v1/accounting/ui/accounts
   */
  async createAccountFromUI(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const { accountCode, accountName, accountType, parentAccountCode, postingAllowed } = req.body;
      if (!accountCode) {
        this.fail(res, 400, 'accountCode is required');
        return;
      }
      if (!accountName) {
        this.fail(res, 400, 'accountName is required');
        return;
      }
      if (!accountType) {
        this.fail(res, 400, 'accountType is required');
        return;
      }
      if (typeof postingAllowed !== 'boolean') {
        this.fail(res, 400, 'postingAllowed must be boolean');
        return;
      }

      const uiContext = await this.uiIntegrationService.getAccountingContext(
        context.tenantId,
        context.userId,
      );
      const result = await this.uiIntegrationService.createAccountFromUI(uiContext, {
        accountCode,
        accountName,
        accountType,
        parentAccountCode,
        postingAllowed,
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: result,
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to create account from UI', error);
    }
  }

  /**
   * Post journal entry from UI
   * POST /api/v1/accounting/ui/journal-entries
   */
  async postJournalEntryFromUI(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const { journalEntryId, reference, description, postingDate, entries } = req.body;
      if (!journalEntryId) {
        this.fail(res, 400, 'journalEntryId is required');
        return;
      }
      const parsedPostingDate = this.parseDateISO(postingDate);
      if (!parsedPostingDate) {
        this.fail(res, 400, 'postingDate must be a valid ISO date');
        return;
      }
      if (!this.ensureLinesValid(res, entries)) return;

      const uiContext = await this.uiIntegrationService.getAccountingContext(
        context.tenantId,
        context.userId,
      );
      const journalEntryData = {
        journalEntryId,
        reference,
        description,
        postingDate: parsedPostingDate,
        entries,
      };

      // Extract idempotency key from headers
      const idempotencyKey = req.headers['idempotency-key'] as string;

      const result = await this.uiIntegrationService.postJournalEntryFromUI(
        uiContext,
        journalEntryData,
        idempotencyKey,
      );
      res.status(201).json({
        success: true,
        message: 'Journal entry posted successfully',
        data: result,
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to post journal entry from UI', error);
    }
  }

  /**
   * Get real-time balances for UI components
   * POST /api/v1/accounting/ui/real-time-balances
   */
  async getRealTimeBalances(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const { accountCodes } = req.body;
      if (!Array.isArray(accountCodes) || isEmpty(accountCodes)) {
        this.fail(res, 400, 'accountCodes must be a non-empty string array');
        return;
      }

      const uiContext = await this.uiIntegrationService.getAccountingContext(
        context.tenantId,
        context.userId,
      );
      const balances = await this.uiIntegrationService.getRealTimeBalances(uiContext, accountCodes);

      res.status(200).json({
        success: true,
        message: 'Real-time balances retrieved successfully',
        data: Object.fromEntries(balances),
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to get real-time balances', error);
    }
  }

  /**
   * Get accounting context for UI components
   * GET /api/v1/accounting/ui/context
   */
  async getAccountingContext(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const result = await this.uiIntegrationService.getAccountingContext(
        context.tenantId,
        context.userId,
      );
      res.status(200).json({
        success: true,
        message: 'Accounting context retrieved successfully',
        data: result,
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to get accounting context', error);
    }
  }

  // ============================================================================
  // KPI ANALYTICS ENDPOINTS
  // ============================================================================

  /**
   * Get composite KPI analysis for dashboard
   * POST /api/v1/accounting/ui/kpi/composite
   */
  async getCompositeKPI(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const { 
        period, 
        startDate, 
        endDate, 
        timezone, 
        currentMap, 
        priorMap,
        fiscalYearStart,
        fiscalQuarterMode,
        trendWindow 
      } = req.body;

      // Validate required fields
      if (!period) {
        this.fail(res, 400, 'period is required');
        return;
      }
      if (!startDate) {
        this.fail(res, 400, 'startDate is required');
        return;
      }
      if (!endDate) {
        this.fail(res, 400, 'endDate is required');
        return;
      }
      if (!timezone) {
        this.fail(res, 400, 'timezone is required');
        return;
      }
      if (!currentMap || typeof currentMap !== 'object') {
        this.fail(res, 400, 'currentMap is required and must be an object');
        return;
      }

      // Parse and validate dates
      const start = this.parseDateISO(startDate);
      const end = this.parseDateISO(endDate);
      if (!start) {
        this.fail(res, 400, 'startDate must be a valid ISO date');
        return;
      }
      if (!end) {
        this.fail(res, 400, 'endDate must be a valid ISO date');
        return;
      }
      if (start >= end) {
        this.fail(res, 400, 'startDate must be before endDate');
        return;
      }

      // Validate period
      const parsedPeriod = this.parseAccountingPeriod(period);
      if (!parsedPeriod) {
        this.fail(res, 400, 'period must be one of: daily, weekly, monthly, quarterly, yearly');
        return;
      }

      // Parse optional fiscal year start
      const fiscalStart = fiscalYearStart ? this.parseDateISO(fiscalYearStart) : undefined;
      if (fiscalYearStart && !fiscalStart) {
        this.fail(res, 400, 'fiscalYearStart must be a valid ISO date');
        return;
      }

      // Import the KPI functions from date utilities
      const { buildKPIComposite } = await import('../utils/date-utilities.js');
      
      const kpiConfig = {
        period: parsedPeriod,
        start,
        end,
        timezone,
        currentMap,
        ...(priorMap && { priorMap }),
        ...(fiscalStart && { fiscalYearStart: fiscalStart }),
        ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode: Boolean(fiscalQuarterMode) }),
        ...(trendWindow !== undefined && { trendWindow: Number(trendWindow) }),
        fillWith: 0,
        round: roundAmount, // Round to 2 decimal places
      };

      const result = buildKPIComposite(kpiConfig);

      this.respond(res, 200, {
        success: true,
        message: 'Composite KPI analysis completed successfully',
        data: result,
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to generate composite KPI analysis', error);
    }
  }

  /**
   * Get YoY comparison analysis
   * POST /api/v1/accounting/ui/kpi/year-over-year
   */
  async getYearOverYearAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const { 
        period, 
        startDate, 
        endDate, 
        timezone, 
        currentMap, 
        priorMap,
        fiscalYearStart,
        fiscalQuarterMode 
      } = req.body;

      // Validate required fields
      if (!period || !startDate || !endDate || !timezone || !currentMap || !priorMap) {
        this.fail(res, 400, 'period, startDate, endDate, timezone, currentMap, and priorMap are required');
        return;
      }

      const start = this.parseDateISO(startDate);
      const end = this.parseDateISO(endDate);
      const parsedPeriod = this.parseAccountingPeriod(period);
      const fiscalStart = fiscalYearStart ? this.parseDateISO(fiscalYearStart) : undefined;

      if (!start || !end || !parsedPeriod) {
        this.fail(res, 400, INVALID_DATE_FORMAT_MESSAGE);
        return;
      }

      const { buildYoY } = await import('../utils/date-utilities.js');
      
      const yoyConfig = {
        period: parsedPeriod,
        start,
        end,
        timezone,
        currentMap,
        priorMap,
        ...(fiscalStart && { fiscalYearStart: fiscalStart }),
        ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode: Boolean(fiscalQuarterMode) }),
        fillWith: 0,
        round: roundAmount,
      };

      const result = buildYoY(yoyConfig);

      this.respond(res, 200, {
        success: true,
        message: 'Year-over-year analysis completed successfully',
        data: result,
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to generate year-over-year analysis', error);
    }
  }

  /**
   * Get YoY-to-date analysis
   * POST /api/v1/accounting/ui/kpi/year-to-date
   */
  async getYearToDateAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const { 
        period, 
        anchorDate, 
        timezone, 
        currentMap, 
        priorMap,
        fiscalYearStart,
        fiscalQuarterMode 
      } = req.body;

      // Validate required fields
      if (!period || !anchorDate || !timezone || !currentMap || !priorMap) {
        this.fail(res, 400, 'period, anchorDate, timezone, currentMap, and priorMap are required');
        return;
      }

      const anchor = this.parseDateISO(anchorDate);
      const parsedPeriod = this.parseAccountingPeriod(period);
      const fiscalStart = fiscalYearStart ? this.parseDateISO(fiscalYearStart) : undefined;

      if (!anchor || !parsedPeriod) {
        this.fail(res, 400, INVALID_DATE_FORMAT_MESSAGE);
        return;
      }

      const { buildYoYToDate } = await import('../utils/date-utilities.js');
      
      const ytdConfig = {
        period: parsedPeriod,
        anchor,
        timezone,
        currentMap,
        priorMap,
        ...(fiscalStart && { fiscalYearStart: fiscalStart }),
        ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode: Boolean(fiscalQuarterMode) }),
        fillWith: 0,
        round: roundAmount,
      };

      const result = buildYoYToDate(ytdConfig);

      this.respond(res, 200, {
        success: true,
        message: 'Year-to-date analysis completed successfully',
        data: result,
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to generate year-to-date analysis', error);
    }
  }

  /**
   * Get period-over-period analysis (MoM/QoQ)
   * POST /api/v1/accounting/ui/kpi/period-over-period
   */
  async getPeriodOverPeriodAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const { 
        period, 
        startDate, 
        endDate, 
        timezone, 
        valuesByKey,
        fiscalYearStart,
        fiscalQuarterMode 
      } = req.body;

      // Validate required fields
      if (!period || !startDate || !endDate || !timezone || !valuesByKey) {
        this.fail(res, 400, 'period, startDate, endDate, timezone, and valuesByKey are required');
        return;
      }

      const start = this.parseDateISO(startDate);
      const end = this.parseDateISO(endDate);
      const parsedPeriod = this.parseAccountingPeriod(period);
      const fiscalStart = fiscalYearStart ? this.parseDateISO(fiscalYearStart) : undefined;

      if (!start || !end || !parsedPeriod) {
        this.fail(res, 400, INVALID_DATE_FORMAT_MESSAGE);
        return;
      }

      const { buildPeriodOverPeriod } = await import('../utils/date-utilities.js');
      
      const popConfig = {
        period: parsedPeriod,
        start,
        end,
        timezone,
        valuesByKey,
        ...(fiscalStart && { fiscalYearStart: fiscalStart }),
        ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode: Boolean(fiscalQuarterMode) }),
        fillWith: 0,
        round: roundAmount,
      };

      const result = buildPeriodOverPeriod(popConfig);

      this.respond(res, 200, {
        success: true,
        message: 'Period-over-period analysis completed successfully',
        data: result,
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to generate period-over-period analysis', error);
    }
  }

  /**
   * Get seasonality analysis
   * POST /api/v1/accounting/ui/kpi/seasonality
   */
  async getSeasonalityAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const { 
        period, 
        startDate, 
        endDate, 
        timezone, 
        valuesByKey,
        method,
        includeCurrentInBaseline 
      } = req.body;

      // Validate required fields
      if (!period || !startDate || !endDate || !timezone || !valuesByKey) {
        this.fail(res, 400, 'period, startDate, endDate, timezone, and valuesByKey are required');
        return;
      }

      // Validate period (only monthly or weekly allowed)
      if (period !== 'monthly' && period !== 'weekly') {
        this.fail(res, 400, 'period must be either "monthly" or "weekly" for seasonality analysis');
        return;
      }

      const start = this.parseDateISO(startDate);
      const end = this.parseDateISO(endDate);

      if (!start || !end) {
        this.fail(res, 400, 'Invalid date format');
        return;
      }

      // Validate method
      const validMethods = ['mean', 'median'];
      const analysisMethod = method && validMethods.includes(method) ? method : 'median';

      const { buildSeasonalityIndex } = await import('../utils/date-utilities.js');
      
      const seasonalityConfig = {
        period: period as 'monthly' | 'weekly',
        start,
        end,
        timezone,
        valuesByKey,
        method: analysisMethod as 'mean' | 'median',
        includeCurrentInBaseline: Boolean(includeCurrentInBaseline),
        isoWeek: true, // Default to ISO weeks for weekly analysis
      };

      const result = buildSeasonalityIndex(seasonalityConfig);

      this.respond(res, 200, {
        success: true,
        message: 'Seasonality analysis completed successfully',
        data: result,
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to generate seasonality analysis', error);
    }
  }

  /**
   * Get trend classification for a series
   * POST /api/v1/accounting/ui/kpi/trend-classification
   */
  async getTrendClassification(req: Request, res: Response): Promise<void> {
    try {
      const context = this.requireContext(req, res);
      if (!context) return;

      const { 
        values, 
        window, 
        epsAbs, 
        epsPct 
      } = req.body;

      // Validate required fields
      if (!Array.isArray(values) || isEmpty(values)) {
        this.fail(res, 400, 'values must be a non-empty number array');
        return;
      }

      // Validate values are numbers
      if (!values.every(v => typeof v === 'number' && Number.isFinite(v))) {
        this.fail(res, 400, 'All values must be finite numbers');
        return;
      }

      const { classifySeriesTrend } = await import('../utils/date-utilities.js');
      
      const options = {
        ...(window !== undefined && { window: Number(window) }),
        ...(epsAbs !== undefined && { epsAbs: Number(epsAbs) }),
        ...(epsPct !== undefined && { epsPct: Number(epsPct) }),
      };

      const trend = classifySeriesTrend(values, options);

      this.respond(res, 200, {
        success: true,
        message: 'Trend classification completed successfully',
        data: {
          trend,
          values,
          options,
        },
      });
    } catch (error) {
      this.fail(res, 500, 'Failed to classify trend', error);
    }
  }
}
