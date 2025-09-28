/**
 * UI Validation Schemas
 *
 * Enterprise-grade validation schemas for UI-specific accounting operations.
 * Provides comprehensive validation for frontend components.
 *
 * Phase 1: Foundation Architecture - Core UI validation patterns
 */

import { z } from 'zod';

// Account Type Enum
export const AccountTypeSchema = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);

// Currency Schema
export const CurrencySchema = z
  .string()
  .min(3)
  .max(3)
  .regex(/^[A-Z]{3}$/);

// Account Code Schema
export const AccountCodeSchema = z
  .string()
  .min(1)
  .max(20)
  .regex(/^[0-9]+$/, 'Account code must contain only numbers');

// Account Name Schema
export const AccountNameSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9\s\-_&.,()]+$/, 'Account name contains invalid characters');

// Money Amount Schema
export const MoneyAmountSchema = z
  .number()
  .min(0)
  .max(999999999.99)
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

// Date Schema
export const DateSchema = z.string().datetime();

// Journal Entry Line Schema
export const JournalEntryLineSchema = z
  .object({
    accountCode: AccountCodeSchema,
    debitAmount: MoneyAmountSchema,
    creditAmount: MoneyAmountSchema,
    currency: CurrencySchema,
    description: z.string().min(1).max(200),
  })
  .refine(
    (data) =>
      (data.debitAmount > 0 && data.creditAmount === 0) ||
      (data.debitAmount === 0 && data.creditAmount > 0),
    {
      message: 'Each line must have either debit or credit amount, not both',
      path: ['debitAmount', 'creditAmount'],
    },
  );

// Create Account Request Schema
export const CreateAccountRequestSchema = z.object({
  accountCode: AccountCodeSchema,
  accountName: AccountNameSchema,
  accountType: AccountTypeSchema,
  parentAccountCode: AccountCodeSchema.optional(),
  postingAllowed: z.boolean(),
});

// Post Journal Entry Request Schema
export const PostJournalEntryRequestSchema = z
  .object({
    journalEntryId: z.string().uuid(),
    reference: z.string().min(1).max(50),
    description: z.string().min(1).max(200),
    postingDate: DateSchema,
    entries: z
      .array(JournalEntryLineSchema)
      .min(2, 'At least two journal entry lines are required'),
  })
  .refine(
    (data) => {
      const totalDebits = data.entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
      const totalCredits = data.entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
      return Math.abs(totalDebits - totalCredits) < 0.01;
    },
    {
      message: 'Total debits and credits must balance',
      path: ['entries'],
    },
  );

// Validate Balance Request Schema
export const ValidateBalanceRequestSchema = z.object({
  entries: z.array(JournalEntryLineSchema).min(1, 'At least one journal entry line is required'),
});

// Get Accounts Query Schema
export const GetAccountsQuerySchema = z.object({
  includeInactive: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  parentCode: AccountCodeSchema.optional(),
  accountType: AccountTypeSchema.optional(),
  searchTerm: z.string().min(1).max(50).optional(),
});

// Get Journal Entries Query Schema
export const GetJournalEntriesQuerySchema = z.object({
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  accountCode: AccountCodeSchema.optional(),
  reference: z.string().min(1).max(50).optional(),
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : undefined)),
  offset: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : undefined)),
});

// Real-time Balances Request Schema
export const RealTimeBalancesRequestSchema = z.object({
  accountCodes: z.array(AccountCodeSchema).min(1, 'At least one account code is required'),
});

// UI Account Summary Schema
export const UIAccountSummarySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  type: z.string(),
  balance: z.number(),
  currency: z.string(),
  isActive: z.boolean(),
  parentCode: z.string().optional(),
  childrenCount: z.number().min(0),
});

// UI Journal Entry Summary Schema
export const UIJournalEntrySummarySchema = z.object({
  id: z.string().uuid(),
  reference: z.string(),
  description: z.string(),
  postingDate: z.date(),
  totalDebits: z.number(),
  totalCredits: z.number(),
  isBalanced: z.boolean(),
  status: z.string(),
  lineCount: z.number().min(0),
});

// UI Balance Validation Schema
export const UIBalanceValidationSchema = z.object({
  isBalanced: z.boolean(),
  totalDebits: z.number(),
  totalCredits: z.number(),
  difference: z.number(),
  errors: z.array(z.string()),
});

// UI Accounting Context Schema
export const UIAccountingContextSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  currentPeriod: z.string(),
  baseCurrency: CurrencySchema,
  userRole: z.enum(['CFO', 'Accountant', 'Auditor', 'Bookkeeper']),
  permissions: z.array(z.string()),
});

// Error Response Schema
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.string(),
  timestamp: z.string().datetime(),
});

// Success Response Schema
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

// API Response Schema
export const APIResponseSchema = z.union([SuccessResponseSchema, ErrorResponseSchema]);

// Export all schemas
export const UISchemas = {
  AccountTypeSchema,
  CurrencySchema,
  AccountCodeSchema,
  AccountNameSchema,
  MoneyAmountSchema,
  DateSchema,
  JournalEntryLineSchema,
  CreateAccountRequestSchema,
  PostJournalEntryRequestSchema,
  ValidateBalanceRequestSchema,
  GetAccountsQuerySchema,
  GetJournalEntriesQuerySchema,
  RealTimeBalancesRequestSchema,
  UIAccountSummarySchema,
  UIJournalEntrySummarySchema,
  UIBalanceValidationSchema,
  UIAccountingContextSchema,
  ErrorResponseSchema,
  SuccessResponseSchema,
  APIResponseSchema,
};

// Type exports for TypeScript
export type AccountType = z.infer<typeof AccountTypeSchema>;
export type Currency = z.infer<typeof CurrencySchema>;
export type AccountCode = z.infer<typeof AccountCodeSchema>;
export type AccountName = z.infer<typeof AccountNameSchema>;
export type MoneyAmount = z.infer<typeof MoneyAmountSchema>;
export type JournalEntryLine = z.infer<typeof JournalEntryLineSchema>;
export type CreateAccountRequest = z.infer<typeof CreateAccountRequestSchema>;
export type PostJournalEntryRequest = z.infer<typeof PostJournalEntryRequestSchema>;
export type ValidateBalanceRequest = z.infer<typeof ValidateBalanceRequestSchema>;
export type GetAccountsQuery = z.infer<typeof GetAccountsQuerySchema>;
export type GetJournalEntriesQuery = z.infer<typeof GetJournalEntriesQuerySchema>;
export type RealTimeBalancesRequest = z.infer<typeof RealTimeBalancesRequestSchema>;
export type UIAccountSummary = z.infer<typeof UIAccountSummarySchema>;
export type UIJournalEntrySummary = z.infer<typeof UIJournalEntrySummarySchema>;
export type UIBalanceValidation = z.infer<typeof UIBalanceValidationSchema>;
export type UIAccountingContext = z.infer<typeof UIAccountingContextSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type APIResponse = z.infer<typeof APIResponseSchema>;
