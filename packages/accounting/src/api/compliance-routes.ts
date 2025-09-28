/**
 * Compliance Routes
 *
 * Express router configuration for compliance API endpoints.
 * Provides tax compliance, regulatory reporting, and standards adherence.
 */

import type { Router, RequestHandler } from 'express';
import { Router as ExpressRouter } from 'express';
import type { ComplianceController } from './compliance-controller.js';

export interface ComplianceRouteValidators {
  generateReport?: RequestHandler[];
  getStatus?: RequestHandler[];
  generateTaxForm?: RequestHandler[];
  getRequirements?: RequestHandler[];
  validateData?: RequestHandler[];
  getCalendar?: RequestHandler[];
  /** Applied to all GET endpoints (e.g., shared query validator) */
  getQuery?: RequestHandler[];
}

export function createComplianceRoutes(
  controller: ComplianceController,
  validators: ComplianceRouteValidators = {},
): Router {
  const router = ExpressRouter();
  const v: Required<ComplianceRouteValidators> = {
    generateReport: [],
    getStatus: [],
    generateTaxForm: [],
    getRequirements: [],
    validateData: [],
    getCalendar: [],
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

  // Compliance Routes
  POST('/reports', v.generateReport, (req, res) => controller.generateComplianceReport(req, res));
  GET('/status', (req, res) => controller.getComplianceStatus(req, res));
  POST('/tax-forms', v.generateTaxForm, (req, res) => controller.generateTaxForm(req, res));
  GET('/requirements/:jurisdiction', (req, res) => controller.getRegulatoryRequirements(req, res));
  POST('/validate', v.validateData, (req, res) => controller.validateComplianceData(req, res));
  GET('/calendar', (req, res) => controller.getComplianceCalendar(req, res));

  return router;
}
