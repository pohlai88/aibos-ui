import type { AccountingController } from './accounting-controller';
import type { Router, RequestHandler } from 'express';

import { Router as ExpressRouter } from 'express';

export interface AccountingRouteValidators {
  postAccount?: RequestHandler[];
  postJournal?: RequestHandler[];
  reverseJournal?: RequestHandler[];
  reconcile?: RequestHandler[];
  /** Applied to all GET endpoints in this router (e.g., query validation) */
  getQuery?: RequestHandler[];
}

export function createAccountingRoutes(
  accountingController: AccountingController,
  validators: AccountingRouteValidators = {},
): Router {
  const router = ExpressRouter();
  const v: Required<AccountingRouteValidators> = {
    postAccount: [],
    postJournal: [],
    reverseJournal: [],
    reconcile: [],
    getQuery: [],
    ...validators,
  };

  // Async error wrapper so thrown/rejected handlers reach error middleware
  const wrap =
    <T extends RequestHandler>(function_: T): RequestHandler =>
    (req, res, next) =>
      Promise.resolve(function_(req, res, next)).catch(next);

  // Helper to auto-apply shared GET validators
  const GET = (path: string, ...handlers: RequestHandler[]) =>
    router.get(path, ...v.getQuery, ...handlers.map(wrap));

  // Account Management Routes
  router.post(
    '/accounts',
    ...v.postAccount,
    wrap((req, res) => accountingController.createAccount(req, res)),
  );

  // Journal Entry Routes
  router.post(
    '/journal-entries',
    ...v.postJournal,
    wrap((req, res) => accountingController.postJournalEntry(req, res)),
  );
  router.post(
    '/journal-entries/:journalEntryId/reverse',
    ...v.reverseJournal,
    wrap((req, res) => accountingController.reverseJournalEntry(req, res)),
  );

  // Trial Balance Routes
  GET('/trial-balance/:period', (req, res) => accountingController.getTrialBalance(req, res));

  // Financial Reporting Routes
  GET('/reports/pnl/:period', (req, res) => accountingController.getProfitAndLoss(req, res));
  GET('/reports/balance-sheet', (req, res) => accountingController.getBalanceSheet(req, res));
  GET('/reports/cash-flow/:period', (req, res) =>
    accountingController.getCashFlowStatement(req, res),
  );
  GET('/reports/ratios', (req, res) => accountingController.getFinancialRatios(req, res));
  GET('/reports/comprehensive/:period', (req, res) =>
    accountingController.getComprehensiveReport(req, res),
  );

  // Validation and Reconciliation Routes
  GET('/validation/integrity', (req, res) => accountingController.validateGLIntegrity(req, res));
  router.post(
    '/reconciliation/:period',
    ...v.reconcile,
    wrap((req, res) => accountingController.reconcileTrialBalance(req, res)),
  );
  GET('/reports/exceptions/:period', (req, res) =>
    accountingController.generateExceptionReport(req, res),
  );

  return router;
}
