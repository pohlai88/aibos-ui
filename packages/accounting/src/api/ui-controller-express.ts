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

const TENANT_ID_HEADER = 'x-tenant-id';
const USER_ID_HEADER = 'x-user-id';

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
    const tenantId = req.headers[TENANT_ID_HEADER] as string;
    const userId = req.headers[USER_ID_HEADER] as string;
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
    if (!Array.isArray(entries) || entries.length === 0) {
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
    if (Math.round((deb - cred) * 100) / 100 !== 0) {
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
      if (!Array.isArray(accountCodes) || accountCodes.length === 0) {
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
}
