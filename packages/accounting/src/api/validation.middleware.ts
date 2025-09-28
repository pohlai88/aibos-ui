import type { Request, Response, NextFunction } from 'express';

import { z } from 'zod';
import {
  CreateAccountRequestSchema,
  PostJournalEntryRequestSchema,
  ValidateBalanceRequestSchema,
  GetAccountsQuerySchema,
  GetJournalEntriesQuerySchema,
  RealTimeBalancesRequestSchema,
} from '../validation/ui.schema.js';

// Validation schemas for API requests (using comprehensive UI schemas)
const CreateAccountSchema = CreateAccountRequestSchema;
const PostJournalEntrySchema = PostJournalEntryRequestSchema;
const ValidateBalanceSchema = ValidateBalanceRequestSchema;

// Additional schemas for core accounting operations
const ReverseJournalEntrySchema = z.object({
  reason: z.string().min(1).max(500),
  reversedBy: z.string().min(1),
});

const ReconciliationSchema = z.object({
  expectedBalances: z.record(z.string(), z.number()).optional(),
});

// Exchange Rate schemas
const ExchangeRateQuerySchema = z.object({
  fromCurrency: z
    .string()
    .length(3)
    .transform((s) => s.toUpperCase()),
  toCurrency: z
    .string()
    .length(3)
    .transform((s) => s.toUpperCase()),
  date: z.string().datetime().optional(),
});

const ExchangeRateUpdateSchema = z.object({
  fromCurrency: z
    .string()
    .length(3)
    .transform((s) => s.toUpperCase()),
  toCurrency: z
    .string()
    .length(3)
    .transform((s) => s.toUpperCase()),
  rate: z.number().positive(),
  date: z.string().datetime(),
  source: z.string().optional(),
});

const ExchangeRateBatchSchema = z.object({
  pairs: z
    .array(
      z.object({
        fromCurrency: z
          .string()
          .length(3)
          .transform((s) => s.toUpperCase()),
        toCurrency: z
          .string()
          .length(3)
          .transform((s) => s.toUpperCase()),
      }),
    )
    .min(1)
    .max(50), // Limit batch size
  date: z.string().datetime().optional(),
});

// Compliance schemas
const ComplianceReportSchema = z.object({
  reportType: z.enum(['TAX', 'REGULATORY', 'AUDIT', 'FINANCIAL']),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Period must be YYYY-MM'),
  jurisdiction: z.string().min(2).max(10),
  format: z.enum(['PDF', 'EXCEL', 'XML', 'JSON']).default('PDF'),
});

// Invoice validation schemas
const IssueInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(50),
  customerId: z.string().min(1),
  customerName: z.string().min(1).max(255),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  currencyCode: z
    .string()
    .length(3)
    .transform((s) => s.toUpperCase())
    .default('MYR'),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1).max(500),
        quantity: z.number().positive(),
        unitPrice: z.number().min(0),
        totalAmount: z.number().min(0),
      }),
    )
    .min(1, 'At least one line item is required'),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  notes: z.string().max(1000).optional(),
});

const MarkAsSentSchema = z.object({
  sentDate: z.string().datetime().optional(),
  sentBy: z.string().min(1),
  method: z.enum(['EMAIL', 'POST', 'FAX', 'HAND_DELIVERY']).optional(),
});

const MarkAsPaidSchema = z.object({
  paidDate: z.string().datetime(),
  paidAmount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'CHECK', 'BANK_TRANSFER', 'CREDIT_CARD', 'OTHER']),
  reference: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
});

const CancelInvoiceSchema = z.object({
  reason: z.string().min(1).max(500),
  cancelledBy: z.string().min(1),
  cancelledDate: z.string().datetime().optional(),
});

const TaxFormSchema = z.object({
  formType: z.string().min(1).max(50),
  taxYear: z.number().int().min(2000).max(2100),
  jurisdiction: z.string().min(2).max(10),
  data: z.record(z.string(), z.unknown()),
});

// Validation middleware factory
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((error_) => ({
            field: error_.path.join('.'),
            message: error_.message,
            code: error_.code,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

// Query validation via Zod (enhanced with UI schemas)
const CommonQuerySchema = z
  .object({
    asOfDate: z.string().datetime().optional(),
    currencyCode: z
      .string()
      .length(3)
      .transform((s) => s.toUpperCase())
      .optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(0).max(1000).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .refine(
    (q) => {
      if (q.startDate && q.endDate) return new Date(q.startDate) <= new Date(q.endDate);
      return true;
    },
    { message: 'startDate must be <= endDate', path: ['startDate'] },
  );

// Enhanced query schemas using UI validation
// Note: Using comprehensive schemas directly from validation directory

export function createQueryValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as unknown as Request['query'];
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
        return;
      }
      next(error as Error);
    }
  };
}

// Specific validation middlewares
export const validateCreateAccount = createValidationMiddleware(CreateAccountSchema);
export const validatePostJournalEntry = createValidationMiddleware(PostJournalEntrySchema);
export const validateReverseJournalEntry = createValidationMiddleware(ReverseJournalEntrySchema);
export const validateReconciliation = createValidationMiddleware(ReconciliationSchema);
export const validateBalance = createValidationMiddleware(ValidateBalanceSchema);

// Invoice validation middlewares
export const validateIssueInvoice = createValidationMiddleware(IssueInvoiceSchema);
export const validateMarkAsSent = createValidationMiddleware(MarkAsSentSchema);
export const validateMarkAsPaid = createValidationMiddleware(MarkAsPaidSchema);
export const validateCancelInvoice = createValidationMiddleware(CancelInvoiceSchema);

// Exchange Rate validation middlewares
export const validateExchangeRateQuery = createQueryValidationMiddleware(ExchangeRateQuerySchema);
export const validateExchangeRateUpdate = createValidationMiddleware(ExchangeRateUpdateSchema);
export const validateExchangeRateBatch = createValidationMiddleware(ExchangeRateBatchSchema);

// Compliance validation middlewares
export const validateComplianceReport = createValidationMiddleware(ComplianceReportSchema);
export const validateTaxForm = createValidationMiddleware(TaxFormSchema);

// UI-specific validation middlewares (using comprehensive schemas)
export const validateUIAccountsQuery = createQueryValidationMiddleware(
  GetAccountsQuerySchema as unknown,
);
export const validateUIJournalEntriesQuery = createQueryValidationMiddleware(
  GetJournalEntriesQuerySchema as unknown,
);
export const validateUIRealTimeBalances = createValidationMiddleware(RealTimeBalancesRequestSchema);

// Query parameter validation (Zod-based, reusable)
export const validateQueryParameters = createQueryValidationMiddleware(CommonQuerySchema);

// Error handling middleware
export function errorHandler(error: Error, _req: Request, res: Response, next: NextFunction): void {
  console.error('Accounting API Error:', error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(
      `${new Date().toISOString()} - ${method} ${url} - ${statusCode} - ${duration}ms - ${ip} - ${userAgent}`,
    );
  });

  next();
}
