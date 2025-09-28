/**
 * Exchange Rate Routes
 *
 * Express router configuration for exchange rate API endpoints.
 * Provides multi-currency support for international accounting operations.
 */

import type { Router, RequestHandler } from 'express';
import { Router as ExpressRouter } from 'express';
import type { ExchangeRateController } from './exchange-rate-controller.js';

export interface ExchangeRateRouteValidators {
  getRate?: RequestHandler[];
  postBatch?: RequestHandler[];
  updateRate?: RequestHandler[];
  getHistory?: RequestHandler[];
  getCurrencies?: RequestHandler[];
  /** Applied to all GET endpoints (e.g., shared query validator) */
  getQuery?: RequestHandler[];
}

export function createExchangeRateRoutes(
  controller: ExchangeRateController,
  validators: ExchangeRateRouteValidators = {},
): Router {
  const router = ExpressRouter();
  const v: Required<ExchangeRateRouteValidators> = {
    getRate: [],
    postBatch: [],
    updateRate: [],
    getHistory: [],
    getCurrencies: [],
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

  // Helper to apply shared POST/PUT validators
  const POST = (path: string, validators: RequestHandler[], ...handlers: RequestHandler[]) =>
    router.post(path, ...validators, ...handlers.map(wrap));
  const PUT = (path: string, validators: RequestHandler[], ...handlers: RequestHandler[]) =>
    router.put(path, ...validators, ...handlers.map(wrap));

  // Exchange Rate Routes
  GET('/currencies', (req, res) => controller.getSupportedCurrencies(req, res));
  GET('/:fromCurrency/:toCurrency', (req, res) => controller.getExchangeRate(req, res));
  POST('/batch', v.postBatch, (req, res) => controller.getBatchExchangeRates(req, res));
  PUT('/:fromCurrency/:toCurrency', v.updateRate, (req, res) =>
    controller.updateExchangeRate(req, res),
  );
  GET('/:fromCurrency/:toCurrency/history', (req, res) =>
    controller.getExchangeRateHistory(req, res),
  );

  return router;
}
