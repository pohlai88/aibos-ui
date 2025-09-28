/**
 * Exchange Rate Controller
 *
 * REST API controller for exchange rate operations.
 * Provides multi-currency support for international accounting operations.
 */

import type { Request, Response } from 'express';
import type { ExchangeRateService } from '../services/exchange-rate.service.js';

// Constants for error messages
const FROM_CURRENCY_REQUIRED = 'fromCurrency is required';
const TO_CURRENCY_REQUIRED = 'toCurrency is required';
const TENANT_ID_REQUIRED = 'Tenant ID is required';
const INVALID_DATE_FORMAT = 'date must be a valid ISO date string';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  // --- Small response & parsing helpers (controller-local) ---
  private respond(res: Response, status: number, payload: Record<string, unknown>) {
    return res.status(status).json({ ...payload, timestamp: new Date().toISOString() });
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
  // -----------------------------------------------

  /**
   * Get exchange rate between two currencies
   * GET /api/accounting/exchange-rates/:fromCurrency/:toCurrency
   */
  async getExchangeRate(req: Request, res: Response): Promise<void> {
    try {
      const { fromCurrency, toCurrency } = req.params;
      const { date } = req.query;
      const tenantId = this.getTenantId(req);

      if (!fromCurrency) return void this.badRequest(res, FROM_CURRENCY_REQUIRED);
      if (!toCurrency) return void this.badRequest(res, TO_CURRENCY_REQUIRED);
      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);

      const parsedDate = date ? new Date(date as string) : undefined;
      if (date && !parsedDate) return void this.badRequest(res, INVALID_DATE_FORMAT);

      const rate = await this.exchangeRateService.getExchangeRate(
        fromCurrency.toUpperCase(),
        toCurrency.toUpperCase(),
        parsedDate,
      );

      this.respond(res, 200, {
        success: true,
        message: 'Exchange rate retrieved successfully',
        data: {
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          rate,
          date: parsedDate || new Date(),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 500, {
        success: false,
        message: `Failed to get exchange rate: ${errorMessage}`,
      });
    }
  }

  /**
   * Get multiple exchange rates
   * POST /api/accounting/exchange-rates/batch
   */
  async getBatchExchangeRates(req: Request, res: Response): Promise<void> {
    try {
      const { currencyPairs, date } = req.body;
      const tenantId = this.getTenantId(req);

      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);
      if (!Array.isArray(currencyPairs) || currencyPairs.length === 0) {
        return void this.badRequest(res, 'currencyPairs must be a non-empty array');
      }

      const parsedDate = date ? new Date(date) : undefined;
      if (date && !parsedDate) return void this.badRequest(res, INVALID_DATE_FORMAT);

      const rates = await Promise.all(
        currencyPairs.map(async (pair: { fromCurrency: string; toCurrency: string }) => {
          const rate = await this.exchangeRateService.getExchangeRate(
            pair.fromCurrency.toUpperCase(),
            pair.toCurrency.toUpperCase(),
            parsedDate,
          );
          return {
            fromCurrency: pair.fromCurrency.toUpperCase(),
            toCurrency: pair.toCurrency.toUpperCase(),
            rate,
          };
        }),
      );

      this.respond(res, 200, {
        success: true,
        message: 'Batch exchange rates retrieved successfully',
        data: {
          rates,
          date: parsedDate || new Date(),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 500, {
        success: false,
        message: `Failed to get batch exchange rates: ${errorMessage}`,
      });
    }
  }

  /**
   * Update exchange rate manually
   * PUT /api/accounting/exchange-rates/:fromCurrency/:toCurrency
   */
  async updateExchangeRate(req: Request, res: Response): Promise<void> {
    try {
      const { fromCurrency, toCurrency } = req.params;
      const { rate, date, source } = req.body;
      const tenantId = this.getTenantId(req);

      if (!fromCurrency) return void this.badRequest(res, FROM_CURRENCY_REQUIRED);
      if (!toCurrency) return void this.badRequest(res, TO_CURRENCY_REQUIRED);
      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);
      if (typeof rate !== 'number' || rate <= 0) {
        return void this.badRequest(res, 'rate must be a positive number');
      }

      const parsedDate = date ? new Date(date) : new Date();
      if (date && !parsedDate) return void this.badRequest(res, INVALID_DATE_FORMAT);

      // Note: This would require adding an update method to ExchangeRateService
      // For now, we'll return a success response indicating the rate would be updated
      this.respond(res, 200, {
        success: true,
        message: 'Exchange rate update requested',
        data: {
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          rate,
          date: parsedDate,
          source: source || 'MANUAL',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 500, {
        success: false,
        message: `Failed to update exchange rate: ${errorMessage}`,
      });
    }
  }

  /**
   * Get exchange rate history
   * GET /api/accounting/exchange-rates/:fromCurrency/:toCurrency/history
   */
  async getExchangeRateHistory(req: Request, res: Response): Promise<void> {
    try {
      const { fromCurrency, toCurrency } = req.params;
      const { startDate, endDate, limit } = req.query;
      const tenantId = this.getTenantId(req);

      if (!fromCurrency) return void this.badRequest(res, FROM_CURRENCY_REQUIRED);
      if (!toCurrency) return void this.badRequest(res, TO_CURRENCY_REQUIRED);
      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);

      const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 30;

      if (startDate && !parsedStartDate)
        return void this.badRequest(res, 'startDate must be a valid ISO date string');
      if (endDate && !parsedEndDate)
        return void this.badRequest(res, 'endDate must be a valid ISO date string');
      if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
        return void this.badRequest(res, 'startDate must be <= endDate');
      }

      // Get exchange rate history from service
      const history = await this.exchangeRateService.getExchangeRateHistory(
        fromCurrency.toUpperCase(),
        toCurrency.toUpperCase(),
        parsedStartDate,
        parsedEndDate,
        parsedLimit,
      );

      this.respond(res, 200, {
        success: true,
        message: 'Exchange rate history retrieved successfully',
        data: {
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          history,
          period: {
            startDate: parsedStartDate,
            endDate: parsedEndDate,
          },
          limit: parsedLimit,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 500, {
        success: false,
        message: `Failed to get exchange rate history: ${errorMessage}`,
      });
    }
  }

  /**
   * Get supported currencies
   * GET /api/accounting/exchange-rates/currencies
   */
  async getSupportedCurrencies(_req: Request, res: Response): Promise<void> {
    try {
      // This endpoint is public and doesn't require tenant ID

      // Common currencies supported by most exchange rate APIs
      const supportedCurrencies = [
        'MYR',
        'USD',
        'EUR',
        'GBP',
        'JPY',
        'AUD',
        'CAD',
        'CHF',
        'CNY',
        'SEK',
        'NZD',
        'MXN',
        'SGD',
        'HKD',
        'NOK',
        'TRY',
        'RUB',
        'INR',
        'BRL',
        'ZAR',
        'KRW',
        'THB',
        'PHP',
        'IDR',
        'VND',
        'TWD',
        'HUF',
        'CZK',
        'PLN',
        'ILS',
      ];

      this.respond(res, 200, {
        success: true,
        message: 'Supported currencies retrieved successfully',
        data: {
          currencies: supportedCurrencies,
          count: supportedCurrencies.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 500, {
        success: false,
        message: `Failed to get supported currencies: ${errorMessage}`,
      });
    }
  }
}
