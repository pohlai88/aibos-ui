/**
 * UI Routes (Express-compatible)
 *
 * Express router configuration for UI-specific accounting API endpoints.
 * Provides optimized endpoints for frontend components.
 */

import type { Router, RequestHandler } from 'express';
import { Router as ExpressRouter } from 'express';
import type { UIControllerExpress } from './ui-controller-express.js';

export interface UIRouteValidators {
  postAccount?: RequestHandler[];
  postJournal?: RequestHandler[];
  postValidate?: RequestHandler[];
  postBalances?: RequestHandler[];
  getAccountsQuery?: RequestHandler[];
  getJournalEntriesQuery?: RequestHandler[];
  getContextQuery?: RequestHandler[];
  /** Applied to all GET endpoints (e.g., shared query validator) */
  getQuery?: RequestHandler[];
}

export function createUIRoutes(
  controller: UIControllerExpress,
  validators: UIRouteValidators = {},
): Router {
  const router = ExpressRouter();
  const v: Required<UIRouteValidators> = {
    postAccount: [],
    postJournal: [],
    postValidate: [],
    postBalances: [],
    getAccountsQuery: [],
    getJournalEntriesQuery: [],
    getContextQuery: [],
    getQuery: [],
    ...validators,
  };

  // Async error wrapper: ensure thrown/rejected handlers reach error middleware
  const wrap =
    (function_: (req: unknown, res: unknown, next: unknown) => unknown): RequestHandler =>
    (req, res, next) =>
      Promise.resolve(function_(req, res, next)).catch(next);

  // Helper to apply shared GET validators to every GET
  const GET = (path: string, ...handlers: RequestHandler[]) =>
    router.get(path, ...v.getQuery, ...handlers.map(wrap));

  // Helper to apply shared POST validators
  const POST = (path: string, validators: RequestHandler[], ...handlers: RequestHandler[]) =>
    router.post(path, ...validators, ...handlers.map(wrap));

  // UI Account Management Routes
  GET('/accounts', ...v.getAccountsQuery, (req, res) => controller.getAccountsForUI(req, res));
  POST('/accounts', v.postAccount, (req, res) => controller.createAccountFromUI(req, res));

  // UI Journal Entry Routes
  GET('/journal-entries', ...v.getJournalEntriesQuery, (req, res) =>
    controller.getJournalEntriesForUI(req, res),
  );
  POST('/journal-entries', v.postJournal, (req, res) =>
    controller.postJournalEntryFromUI(req, res),
  );

  // UI Validation Routes
  POST('/validate-balance', v.postValidate, (req, res) =>
    controller.validateJournalEntryBalance(req, res),
  );

  // UI Real-time Data Routes
  POST('/real-time-balances', v.postBalances, (req, res) =>
    controller.getRealTimeBalances(req, res),
  );

  // UI Context Routes
  GET('/context', ...v.getContextQuery, (req, res) => controller.getAccountingContext(req, res));

  return router;
}
