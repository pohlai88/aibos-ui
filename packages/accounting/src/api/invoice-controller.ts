/**
 * Invoice Controller
 *
 * REST API controller for invoice operations.
 * Handles HTTP requests and delegates to InvoiceService.
 */

import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { isEmpty } from '../utils';

// Constants for error messages
const TENANT_ID_REQUIRED = 'Tenant ID is required';
const USER_ID_REQUIRED = 'User ID is required';
const INVOICE_ID_REQUIRED = 'invoiceId is required';
const CUSTOMER_ID_REQUIRED = 'customerId is required';
const LINE_ITEMS_REQUIRED = 'lineItems is required and cannot be empty';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';
import { InvoiceEventHandlerService } from '../services/invoice-event-handler.service';
import { IssueInvoiceCommand } from '../commands/issue-invoice.command';
import { PaymentTerms } from '../domain/invoice.domain';

@Injectable()
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly eventHandler: InvoiceEventHandlerService,
  ) {}

  // --- Small response & parsing helpers (controller-local) ---
  private respond(res: Response, status: number, payload: Record<string, unknown>) {
    return res.status(status).json(payload);
  }
  private badRequest(res: Response, message: string) {
    return this.respond(res, 400, { success: false, message });
  }
  private getTenantId(req: Request): string | undefined {
    return (
      (req.params as Record<string, string | undefined>).tenantId ??
      (req.headers['x-tenant-id'] as string | undefined) ??
      (req.headers['X-Tenant-Id'] as unknown as string | undefined)
    );
  }
  private getUserId(req: Request): string | undefined {
    return (
      (req.headers['x-user-id'] as string | undefined) ??
      (req.headers['X-User-Id'] as unknown as string | undefined)
    );
  }
  private parseISO(v: unknown): Date | undefined {
    if (typeof v !== 'string') return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  private isValidPaymentTerms(v: unknown): v is PaymentTerms {
    return typeof v === 'string' && Object.values(PaymentTerms).includes(v as PaymentTerms);
  }
  private isPosNumber(n: unknown): n is number {
    return typeof n === 'number' && Number.isFinite(n) && n >= 0;
  }

  /**
   * Issue a new invoice
   * POST /api/accounting/invoices
   */
  async issueInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceId, customerId, invoiceNumber, lineItems, issueDate, paymentTerms, notes } =
        req.body;

      const tenantId = this.getTenantId(req);
      const userId = this.getUserId(req);
      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);
      if (!userId) return void this.badRequest(res, USER_ID_REQUIRED);
      if (!invoiceId) return void this.badRequest(res, INVOICE_ID_REQUIRED);
      if (!customerId) return void this.badRequest(res, CUSTOMER_ID_REQUIRED);
      if (!Array.isArray(lineItems) || isEmpty(lineItems)) {
        return void this.badRequest(res, LINE_ITEMS_REQUIRED);
      }
      // Basic line validation (amounts non-negative)
      for (const [index, li] of lineItems.entries()) {
        if (!li || typeof li !== 'object') {
          return void this.badRequest(res, `lineItems[${index}] must be an object`);
        }
        if (!this.isPosNumber(li.quantity)) {
          return void this.badRequest(
            res,
            `lineItems[${index}].quantity must be a non-negative number`,
          );
        }
        if (!this.isPosNumber(li.unitPrice)) {
          return void this.badRequest(
            res,
            `lineItems[${index}].unitPrice must be a non-negative number`,
          );
        }
      }

      const parsedIssueDate = this.parseISO(issueDate);
      if (!parsedIssueDate)
        return void this.badRequest(res, 'issueDate must be a valid ISO date string');
      if (!this.isValidPaymentTerms(paymentTerms)) {
        return void this.badRequest(
          res,
          `paymentTerms must be one of: ${Object.values(PaymentTerms).join(', ')}`,
        );
      }

      const command = new IssueInvoiceCommand({
        invoiceId,
        tenantId,
        userId,
        customerId,
        invoiceNumber,
        lineItems,
        issueDate: parsedIssueDate,
        paymentTerms,
        notes,
      });

      // Extract idempotency key from headers
      const idempotencyKey = req.headers['idempotency-key'] as string;

      await this.invoiceService.issueInvoice(command, idempotencyKey);

      this.respond(res, 201, {
        success: true,
        message: 'Invoice issued successfully',
        data: {
          invoiceId: command.invoiceId,
          invoiceNumber: command.invoiceNumber,
          status: 'ISSUED',
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 400, {
        success: false,
        message: `Failed to issue invoice: ${errorMessage}`,
      });
    }
  }

  /**
   * Mark invoice as sent
   * PUT /api/accounting/invoices/:invoiceId/send
   */
  async markAsSent(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const tenantId = this.getTenantId(req);
      const sentBy = this.getUserId(req);
      if (!invoiceId) return void this.badRequest(res, INVOICE_ID_REQUIRED);
      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);
      if (!sentBy) return void this.badRequest(res, USER_ID_REQUIRED);

      await this.invoiceService.markInvoiceAsSent(invoiceId, tenantId, sentBy);

      this.respond(res, 200, {
        success: true,
        message: 'Invoice marked as sent',
        data: { invoiceId, status: 'SENT' },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 400, {
        success: false,
        message: `Failed to mark invoice as sent: ${errorMessage}`,
      });
    }
  }

  /**
   * Mark invoice as paid
   * PUT /api/accounting/invoices/:invoiceId/pay
   */
  async markAsPaid(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const tenantId = this.getTenantId(req);
      const paidBy = this.getUserId(req);
      const { paidAmount, paymentDate } = req.body;
      if (!invoiceId) return void this.badRequest(res, INVOICE_ID_REQUIRED);
      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);
      if (!paidBy) return void this.badRequest(res, USER_ID_REQUIRED);
      if (!this.isPosNumber(paidAmount)) {
        return void this.badRequest(res, 'paidAmount must be a non-negative number');
      }
      const parsedPaymentDate = this.parseISO(paymentDate);
      if (!parsedPaymentDate)
        return void this.badRequest(res, 'paymentDate must be a valid ISO date string');

      await this.invoiceService.markInvoiceAsPaid(
        invoiceId,
        tenantId,
        paidAmount,
        paidBy,
        parsedPaymentDate,
      );

      this.respond(res, 200, {
        success: true,
        message: 'Invoice marked as paid',
        data: { invoiceId, status: 'PAID' },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 400, {
        success: false,
        message: `Failed to mark invoice as paid: ${errorMessage}`,
      });
    }
  }

  /**
   * Cancel invoice
   * PUT /api/accounting/invoices/:invoiceId/cancel
   */
  async cancelInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const tenantId = this.getTenantId(req);
      const cancelledBy = this.getUserId(req);
      const { reason } = req.body;
      if (!invoiceId) return void this.badRequest(res, INVOICE_ID_REQUIRED);
      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);
      if (!cancelledBy) return void this.badRequest(res, USER_ID_REQUIRED);
      if (!reason || typeof reason !== 'string') {
        return void this.badRequest(res, 'reason is required');
      }

      await this.invoiceService.cancelInvoice(invoiceId, tenantId, reason, cancelledBy);

      this.respond(res, 200, {
        success: true,
        message: 'Invoice cancelled',
        data: { invoiceId, status: 'CANCELLED' },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 400, {
        success: false,
        message: `Failed to cancel invoice: ${errorMessage}`,
      });
    }
  }

  /**
   * Check overdue invoices
   * GET /api/accounting/invoices/overdue
   */
  async checkOverdueInvoices(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);

      const overdueInvoiceIds = await this.invoiceService.checkOverdueInvoices(tenantId);

      this.respond(res, 200, {
        success: true,
        message: 'Overdue invoices checked',
        data: { overdueCount: overdueInvoiceIds.length, overdueInvoiceIds },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 400, {
        success: false,
        message: `Failed to check overdue invoices: ${errorMessage}`,
      });
    }
  }

  /**
   * Get invoice summary
   * GET /api/accounting/invoices/:invoiceId
   */
  async getInvoiceSummary(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceId } = req.params;
      if (!invoiceId) return void this.badRequest(res, INVOICE_ID_REQUIRED);

      const summary = await this.eventHandler.getInvoiceSummary(invoiceId);

      this.respond(res, 200, {
        success: true,
        message: 'Invoice summary retrieved',
        data: summary,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 400, {
        success: false,
        message: `Failed to get invoice summary: ${errorMessage}`,
      });
    }
  }

  /**
   * Get customer balance
   * GET /api/accounting/invoices/customer/:customerId/balance
   */
  async getCustomerBalance(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const tenantId = this.getTenantId(req);
      if (!customerId) return void this.badRequest(res, CUSTOMER_ID_REQUIRED);
      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);

      const balance = await this.eventHandler.getCustomerBalance(customerId, tenantId);

      this.respond(res, 200, {
        success: true,
        message: 'Customer balance retrieved',
        data: balance,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 400, {
        success: false,
        message: `Failed to get customer balance: ${errorMessage}`,
      });
    }
  }

  /**
   * Get accounts receivable summary
   * GET /api/accounting/invoices/accounts-receivable
   */
  async getAccountsReceivableSummary(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);

      const summary = await this.eventHandler.getAccountsReceivableSummary(tenantId);

      this.respond(res, 200, {
        success: true,
        message: 'Accounts receivable summary retrieved',
        data: summary,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 400, {
        success: false,
        message: `Failed to get accounts receivable summary: ${errorMessage}`,
      });
    }
  }
}
