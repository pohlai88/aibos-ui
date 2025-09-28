import type { AccountingService } from '../services/accounting.service';
import type { Request, Response } from 'express';

import { CreateAccountCommand } from '../commands/create-account.command';
import { PostJournalEntryCommand } from '../commands/post-journal-entry.command';
// import { JournalEntryLine } from '../../domain/journal-entry-line'; // No longer needed

// Constants for error messages
const INVALID_AS_OF_DATE = 'Invalid asOfDate';

// Types
interface JournalEntryLineData {
  accountCode: string;
  debitAmount?: number;
  creditAmount?: number;
  description?: string;
}

// Constants
const DEFAULT_CURRENCY = 'MYR';
const TENANT_ID_REQUIRED = 'Tenant ID is required';
const TENANT_ID_AND_PERIOD_REQUIRED = 'Tenant ID and period are required';
const TENANT_ID_AND_JOURNAL_ENTRY_ID_REQUIRED = 'Tenant ID and Journal Entry ID are required';
const FAILED_TO_CREATE_ACCOUNT = 'Failed to create account';
const FAILED_TO_POST_JOURNAL_ENTRY = 'Failed to post journal entry';
const UNKNOWN_ERROR = 'Unknown error';
const AS_OF_DATE_REQUIRED = 'asOfDate parameter is required';

// Small helpers (controller-local; keep service API unchanged)
const respond = (res: Response, status: number, payload: Record<string, unknown>) =>
  res.status(status).json({ ...payload, timestamp: new Date().toISOString() });

const badRequest = (res: Response, message: string) =>
  respond(res, 400, { success: false, message, error: message });

const isValidDate = (d: Date) => !Number.isNaN(d.getTime());
const parseISO = (v: string) => new Date(v);
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  /**
   * Create a new account in the chart of accounts
   * POST /api/accounting/accounts
   */
  public async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      if (!tenantId) return void badRequest(res, TENANT_ID_REQUIRED);

      const {
        accountCode,
        accountName,
        accountType,
        parentAccountCode,
        isActive,
        // @ts-ignore - intentionally unused fields for API compatibility
        ..._unusedAccountFields
      } = req.body;

      const command = new CreateAccountCommand({
        tenantId,
        userId: 'user123', // Default user ID for API calls
        accountCode,
        accountName,
        accountType,
        parentAccountCode,
        postingAllowed: isActive,
      });

      await this.accountingService.createAccount(command);

      respond(res, 201, {
        success: true,
        message: 'Account created successfully',
        data: { accountCode, accountName, accountType },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : FAILED_TO_CREATE_ACCOUNT;
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Post a journal entry
   * POST /api/accounting/journal-entries
   */
  public async postJournalEntry(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      if (!tenantId) return void badRequest(res, TENANT_ID_REQUIRED);

      const {
        journalEntryId,
        entries,
        reference,
        description,
        postedBy,
        _currencyCode,
        // @ts-ignore - intentionally unused fields for API compatibility
        ..._unusedJournalEntryFields
      } = req.body;

      // Lightweight guards (heavy validation should live in middleware)
      if (!Array.isArray(entries) || entries.length === 0) {
        return void badRequest(res, 'entries array is required and cannot be empty');
      }
      const normalized = entries.map((e: JournalEntryLineData) => ({
        accountCode: e.accountCode,
        debitAmount: Number(e.debitAmount ?? 0),
        creditAmount: Number(e.creditAmount ?? 0),
        currency: _currencyCode || DEFAULT_CURRENCY,
        description: e.description ?? '',
      }));
      // Non-negative and not both sides populated per line
      for (let index = 0; index < normalized.length; index++) {
        const line = normalized[index];
        if (!line) continue; // Skip undefined entries
        if (line.debitAmount < 0 || line.creditAmount < 0) {
          return void badRequest(res, `Line ${index + 1}: amounts cannot be negative`);
        }
        if (line.debitAmount > 0 && line.creditAmount > 0) {
          return void badRequest(res, `Line ${index + 1}: cannot have both debit and credit > 0`);
        }
      }
      const totalDebits = round2(normalized.reduce((s, l) => s + l.debitAmount, 0));
      const totalCredits = round2(normalized.reduce((s, l) => s + l.creditAmount, 0));
      if (totalDebits !== totalCredits) {
        return void badRequest(
          res,
          `Unbalanced entry: debits ${totalDebits} != credits ${totalCredits}`,
        );
      }

      const command = new PostJournalEntryCommand({
        journalEntryId,
        tenantId,
        userId: postedBy ?? 'system',
        entries: normalized,
        reference,
        description,
        postingDate: new Date(), // consider passing validated _postingDate later
      });

      // Extract idempotency key from headers
      const idempotencyKey = req.headers['idempotency-key'] as string;

      await this.accountingService.postJournalEntry(command, idempotencyKey);

      respond(res, 201, {
        success: true,
        message: 'Journal entry posted successfully',
        data: {
          journalEntryId,
          reference,
          description,
          totalDebits: command.getTotalDebit(),
          totalCredits: command.getTotalCredit(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : FAILED_TO_POST_JOURNAL_ENTRY;
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Reverse a journal entry
   * POST /api/accounting/journal-entries/:journalEntryId/reverse
   */
  public async reverseJournalEntry(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, journalEntryId } = req.params;
      if (!tenantId || !journalEntryId) {
        return void badRequest(res, TENANT_ID_AND_JOURNAL_ENTRY_ID_REQUIRED);
      }

      const { reason, reversedBy } = req.body;

      await this.accountingService.reverseJournalEntry(
        journalEntryId,
        reason,
        reversedBy,
        tenantId,
      );

      respond(res, 200, {
        success: true,
        message: 'Journal entry reversed successfully',
        data: { journalEntryId, reason, reversedBy },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reverse journal entry';
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get trial balance
   * GET /api/accounting/trial-balance/:tenantId/:period
   */
  public async getTrialBalance(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      const { period } = req.params;
      if (!tenantId || !period) {
        return void badRequest(res, TENANT_ID_AND_PERIOD_REQUIRED);
      }
      const { asOfDate } = req.query;

      let parsedDate: Date | undefined;
      if (asOfDate) {
        parsedDate = parseISO(String(asOfDate));
        if (!isValidDate(parsedDate)) return void badRequest(res, INVALID_AS_OF_DATE);
      }

      const trialBalance = await this.accountingService.getTrialBalance(
        tenantId,
        period,
        parsedDate,
      );

      respond(res, 200, {
        success: true,
        message: 'Trial balance retrieved successfully',
        data: trialBalance,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get trial balance';
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get profit and loss statement
   * GET /api/accounting/reports/pnl/:tenantId/:period
   */
  public async getProfitAndLoss(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      const { period } = req.params;
      if (!tenantId || !period) {
        return void badRequest(res, TENANT_ID_AND_PERIOD_REQUIRED);
      }
      const { currencyCode = DEFAULT_CURRENCY } = req.query;

      const pnl = await this.accountingService.getProfitAndLoss(
        tenantId,
        period,
        currencyCode as string,
      );

      respond(res, 200, {
        success: true,
        message: 'Profit and loss report retrieved successfully',
        data: pnl,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to get profit and loss statement';
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get balance sheet
   * GET /api/accounting/reports/balance-sheet/:tenantId
   */
  public async getBalanceSheet(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      if (!tenantId) return void badRequest(res, TENANT_ID_REQUIRED);
      const { asOfDate, currencyCode = DEFAULT_CURRENCY } = req.query;

      if (!asOfDate) {
        return void badRequest(res, AS_OF_DATE_REQUIRED);
      }

      const parsed = parseISO(String(asOfDate));
      if (!isValidDate(parsed)) return void badRequest(res, INVALID_AS_OF_DATE);
      const balanceSheet = await this.accountingService.getBalanceSheet(
        tenantId,
        parsed,
        currencyCode as string,
      );

      respond(res, 200, {
        success: true,
        message: 'Balance sheet retrieved successfully',
        data: balanceSheet,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get balance sheet';
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get cash flow statement
   * GET /api/accounting/reports/cash-flow/:tenantId/:period
   */
  public async getCashFlowStatement(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      const { period } = req.params;
      if (!tenantId || !period) {
        return void badRequest(res, TENANT_ID_AND_PERIOD_REQUIRED);
      }
      const { currencyCode = DEFAULT_CURRENCY } = req.query;

      const cashFlow = await this.accountingService.getCashFlowStatement(
        tenantId,
        period,
        currencyCode as string,
      );

      respond(res, 200, {
        success: true,
        message: 'Cash flow statement retrieved successfully',
        data: cashFlow,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get cash flow statement';
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get financial ratios
   * GET /api/accounting/reports/ratios/:tenantId
   */
  public async getFinancialRatios(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      if (!tenantId) return void badRequest(res, TENANT_ID_REQUIRED);
      const { asOfDate, currencyCode = DEFAULT_CURRENCY } = req.query;

      if (!asOfDate) {
        return void badRequest(res, AS_OF_DATE_REQUIRED);
      }

      const parsed = parseISO(String(asOfDate));
      if (!isValidDate(parsed)) return void badRequest(res, INVALID_AS_OF_DATE);
      const ratios = await this.accountingService.getFinancialRatios(
        tenantId,
        parsed,
        currencyCode as string,
      );

      respond(res, 200, {
        success: true,
        message: 'Financial ratios retrieved successfully',
        data: ratios,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get financial ratios';
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get comprehensive financial report
   * GET /api/accounting/reports/comprehensive/:tenantId/:period
   */
  public async getComprehensiveReport(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      const { period } = req.params;
      if (!tenantId || !period) {
        return void badRequest(res, TENANT_ID_AND_PERIOD_REQUIRED);
      }
      const { asOfDate, currencyCode = DEFAULT_CURRENCY } = req.query;

      if (!asOfDate) {
        return void badRequest(res, AS_OF_DATE_REQUIRED);
      }

      const parsed = parseISO(String(asOfDate));
      if (!isValidDate(parsed)) return void badRequest(res, INVALID_AS_OF_DATE);
      const report = await this.accountingService.getComprehensiveReport(
        tenantId,
        period,
        parsed,
        currencyCode as string,
      );

      respond(res, 200, {
        success: true,
        message: 'Comprehensive report retrieved successfully',
        data: report,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get comprehensive report';
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Validate GL integrity
   * GET /api/accounting/validation/integrity/:tenantId
   */
  public async validateGLIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      if (!tenantId) return void badRequest(res, TENANT_ID_REQUIRED);

      const integrityReport = await this.accountingService.validateGLIntegrity(tenantId);

      respond(res, 200, {
        success: true,
        message: 'Data integrity check completed successfully',
        data: integrityReport,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to validate GL integrity';
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Reconcile trial balance variances
   * POST /api/accounting/reconciliation/:tenantId/:period
   */
  public async reconcileTrialBalance(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      const { period } = req.params;
      if (!tenantId || !period) {
        return void badRequest(res, TENANT_ID_AND_PERIOD_REQUIRED);
      }
      const { expectedBalances } = req.body;

      const reconciliationReport = await this.accountingService.reconcileTrialBalance(
        tenantId,
        period,
        expectedBalances ? new Map(Object.entries(expectedBalances)) : undefined,
      );

      respond(res, 200, {
        success: true,
        message: 'Trial balance reconciliation completed successfully',
        data: reconciliationReport,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reconcile trial balance';
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Generate exception report
   * GET /api/accounting/reports/exceptions/:tenantId/:period
   */
  public async generateExceptionReport(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      const { period } = req.params;
      if (!tenantId || !period) {
        return void badRequest(res, TENANT_ID_AND_PERIOD_REQUIRED);
      }

      const exceptionReport = await this.accountingService.generateExceptionReport(
        tenantId,
        period,
      );

      respond(res, 200, {
        success: true,
        message: 'Exception report generated successfully',
        data: exceptionReport,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate exception report';
      respond(res, 400, {
        success: false,
        message: message,
        error: error instanceof Error ? message : UNKNOWN_ERROR,
      });
    }
  }
}
