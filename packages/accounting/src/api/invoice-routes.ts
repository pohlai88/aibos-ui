/**
 * Invoice Routes
 *
 * Express router configuration for invoice API endpoints.
 */

import { Router, type RequestHandler, type Request, type Response, type NextFunction } from 'express';
import { type InvoiceController } from './invoice-controller.js';

export interface InvoiceRouteValidators {
  postInvoice?: RequestHandler[];
  putSend?: RequestHandler[];
  putPay?: RequestHandler[];
  putCancel?: RequestHandler[];
  /** Applied to all GET endpoints (e.g., shared query validator) */
  getQuery?: RequestHandler[];
}

export function createInvoiceRoutes(
  controller: InvoiceController,
  validators: InvoiceRouteValidators = {},
): Router {
  const router = Router();
  const v: Required<InvoiceRouteValidators> = {
    postInvoice: [],
    putSend: [],
    putPay: [],
    putCancel: [],
    getQuery: [],
    ...validators,
  };

  // Async error wrapper: ensure thrown/rejected handlers reach error middleware
  const wrap =
    (function_: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler =>
    (req, res, next) =>
      Promise.resolve(function_(req, res, next)).catch(next);

  // Helper to apply shared GET validators to every GET
  const GET = (path: string, ...handlers: RequestHandler[]) =>
    router.get(path, ...v.getQuery, ...handlers.map(wrap));

  // Issue new invoice
  router.post(
    '/',
    ...v.postInvoice,
    wrap((req, res) => controller.issueInvoice(req, res)),
  );

  // Mark invoice as sent
  router.put(
    '/:invoiceId/send',
    ...v.putSend,
    wrap((req, res) => controller.markAsSent(req, res)),
  );

  // Mark invoice as paid
  router.put(
    '/:invoiceId/pay',
    ...v.putPay,
    wrap((req, res) => controller.markAsPaid(req, res)),
  );

  // Cancel invoice
  router.put(
    '/:invoiceId/cancel',
    ...v.putCancel,
    wrap((req, res) => controller.cancelInvoice(req, res)),
  );

  // --- Static GET paths FIRST (prevent shadowing by param route) ---
  // Check overdue invoices
  GET('/overdue', (req, res) => controller.checkOverdueInvoices(req, res));

  // Get customer balance
  GET('/customer/:customerId/balance', (req, res) => controller.getCustomerBalance(req, res));

  // Get accounts receivable summary
  GET('/accounts-receivable', (req, res) => controller.getAccountsReceivableSummary(req, res));

  // Get invoice summary
  GET('/:invoiceId', (req, res) => controller.getInvoiceSummary(req, res));

  return router;
}
