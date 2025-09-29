/**
 * FX Ledger Validation Schemas
 * 
 * Zod schemas for runtime validation of FX ledger types and operations.
 * Provides type-safe validation for exchange rates and lookup options.
 * 
 * @fileoverview Runtime validation schemas for FX ledger utilities
 */

import { z } from 'zod';
import type { SupportedCurrency } from './accounting-utilities';
import type { ExchangeRate, RateType } from './fx-ledger-utilities';

export const RateTypeSchema = z.custom<RateType>((v) =>
  v === 'mid' || v === 'buy' || v === 'sell' || v === 'spot' || v === 'forward'
);

export const CurrencySchema = z.custom<SupportedCurrency>((v) => typeof v === 'string' && v.length === 3);

export const ExchangeRateSchema: z.ZodType<ExchangeRate> = z.object({
  fromCurrency: CurrencySchema,
  toCurrency: CurrencySchema,
  rateType: RateTypeSchema,
  rate: z.number().positive(),
  date: z.instanceof(Date),
  source: z.string().min(1),
  valid: z.boolean(),
});

export const RateLookupOptionsSchema = z.object({
  date: z.instanceof(Date).optional(),
  rateType: RateTypeSchema.optional(),
  source: z.string().optional(),
  allowTriangulation: z.boolean().optional(),
  baseCurrency: CurrencySchema.optional(),
  toleranceDays: z.number().int().min(0).optional(),
  allowInverse: z.boolean().optional(),
  fallbackToLatest: z.boolean().optional(),
});

export type ExchangeRateInput = z.input<typeof ExchangeRateSchema>;
export type RateLookupOptionsInput = z.input<typeof RateLookupOptionsSchema>;
