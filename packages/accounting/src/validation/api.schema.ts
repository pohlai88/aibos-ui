/**
 * API Request/Response Schemas using Zod
 *
 * These schemas validate external input at the API boundary (BFF layer)
 * before it reaches our domain objects. This provides:
 * - Detailed error messages for API consumers
 * - Type safety for external data
 * - Input sanitization and normalization
 */

import { z } from 'zod';
import { validateAccountType } from '../utils/validation-utilities';

// Custom account type validator using Phase 2 utility
const AccountTypeValidator = z.string().refine(
  (type) => {
    const result = validateAccountType(type);
    return result.isValid;
  },
  {
    message: 'Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE',
  }
);

// Constants for error messages
const ACCOUNT_CODE_ERROR: string = 'Account code is required';
const ACCOUNT_CODE_LENGTH_ERROR: string = 'Account code must be 20 characters or less';

// ============================================================================
// Account Management Schemas
// ============================================================================

export const CreateAccountRequestSchema = z.object({
  accountCode: z
    .string()
    .min(1, ACCOUNT_CODE_ERROR)
    .max(20, ACCOUNT_CODE_LENGTH_ERROR)
    .regex(
      /^[A-Z0-9_-]+$/,
      'Account code must contain only uppercase letters, numbers, hyphens, and underscores',
    ),
  name: z
    .string()
    .min(1, 'Account name is required')
    .max(100, 'Account name must be 100 characters or less'),
  accountType: AccountTypeValidator,
  parentCode: z
    .string()
    .min(1, ACCOUNT_CODE_ERROR)
    .max(20, ACCOUNT_CODE_LENGTH_ERROR)
    .regex(/^[A-Z0-9_-]+$/)
    .optional(),
  specialAccountType: z
    .enum(['CASH', 'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'INVENTORY', 'FIXED_ASSET'])
    .optional(),
  postingAllowed: z.boolean().default(true),
  description: z.string().max(500).optional(),
});

export const UpdateAccountRequestSchema = CreateAccountRequestSchema.partial().extend({
  accountCode: z.string().min(1, ACCOUNT_CODE_ERROR), // Required for identification
});

// ============================================================================
// Journal Entry Schemas
// ============================================================================

export const JournalEntryLineSchema = z
  .object({
    accountCode: z.string().min(1, ACCOUNT_CODE_ERROR).max(20, ACCOUNT_CODE_LENGTH_ERROR),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(200, 'Description must be 200 characters or less'),
    debitAmount: z
      .number()
      .min(0, 'Debit amount must be non-negative')
      .multipleOf(0.01, 'Debit amount must have at most 2 decimal places'),
    creditAmount: z
      .number()
      .min(0, 'Credit amount must be non-negative')
      .multipleOf(0.01, 'Credit amount must have at most 2 decimal places'),
    reference: z.string().max(50, 'Reference must be 50 characters or less').optional(),
  })
  .refine((data) => data.debitAmount > 0 !== data.creditAmount > 0, {
    message: 'Exactly one of debit or credit amount must be greater than 0',
    path: ['debitAmount', 'creditAmount'],
  });

export const CreateJournalEntryRequestSchema = z.object({
  lines: z
    .array(JournalEntryLineSchema)
    .min(1, 'At least one journal entry line is required')
    .max(100, 'Maximum 100 lines allowed per journal entry'),
  postingDate: z.string().datetime('Invalid posting date format').optional(),
  reference: z
    .string()
    .max(100, 'Journal entry reference must be 100 characters or less')
    .optional(),
});

export const PostJournalEntryRequestSchema = z.object({
  journalEntryId: z.string().uuid('Invalid journal entry ID format'),
  postingDate: z.string().datetime('Invalid posting date format').optional(),
});

// ============================================================================
// Companion Links Schemas
// ============================================================================

export const SetCompanionLinksRequestSchema = z
  .object({
    accountCode: z.string().min(1, ACCOUNT_CODE_ERROR).max(20, ACCOUNT_CODE_LENGTH_ERROR),
    accumulatedDepreciationCode: z.string().min(1).max(20).optional().nullable(),
    depreciationExpenseCode: z.string().min(1).max(20).optional().nullable(),
    allowanceAccountCode: z.string().min(1).max(20).optional().nullable(),
  })
  .refine(
    (data) => {
      const codes = [
        data.accumulatedDepreciationCode,
        data.depreciationExpenseCode,
        data.allowanceAccountCode,
      ].filter((code): code is string => typeof code === 'string');

      return new Set(codes).size === codes.length; // All codes must be distinct
    },
    {
      message: 'All provided companion codes must be distinct',
      path: ['accumulatedDepreciationCode', 'depreciationExpenseCode', 'allowanceAccountCode'],
    },
  )
  .refine(
    (data) => {
      const codes = [
        data.accumulatedDepreciationCode,
        data.depreciationExpenseCode,
        data.allowanceAccountCode,
      ].filter((code): code is string => typeof code === 'string');

      return !codes.includes(data.accountCode); // No self-linking
    },
    {
      message: 'Companion codes cannot equal the primary account code',
      path: ['accountCode'],
    },
  );

// ============================================================================
// Query/Filter Schemas
// ============================================================================

export const AccountQuerySchema = z.object({
  accountType: AccountTypeValidator.optional(),
  parentCode: z.string().optional(),
  specialAccountType: z.string().optional(),
  postingAllowed: z.boolean().optional(),
  search: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(1000).default(50),
  offset: z.number().int().min(0).default(0),
});

export const JournalEntryQuerySchema = z.object({
  accountCode: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'POSTED', 'ADJUSTED', 'VOIDED', 'REVERSED']).optional(),
  limit: z.number().int().min(1).max(1000).default(50),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const AccountResponseSchema = z.object({
  accountCode: z.string(),
  name: z.string(),
  accountType: z.string(),
  parentCode: z.string().optional(),
  specialAccountType: z.string().optional(),
  postingAllowed: z.boolean(),
  balance: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  companionLinks: z
    .object({
      accumulatedDepreciationCode: z.string().optional(),
      depreciationExpenseCode: z.string().optional(),
      allowanceAccountCode: z.string().optional(),
    })
    .optional(),
});

export const JournalEntryResponseSchema = z.object({
  id: z.string().uuid(),
  lines: z.array(JournalEntryLineSchema),
  status: z.string(),
  postingDate: z.string().datetime().optional(),
  reference: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// Error Response Schema
// ============================================================================

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
});

// ============================================================================
// Success Response Schema
// ============================================================================

export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  timestamp: z.string().datetime(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateAccountRequest = z.infer<typeof CreateAccountRequestSchema>;
export type UpdateAccountRequest = z.infer<typeof UpdateAccountRequestSchema>;
export type JournalEntryLine = z.infer<typeof JournalEntryLineSchema>;
export type CreateJournalEntryRequest = z.infer<typeof CreateJournalEntryRequestSchema>;
export type PostJournalEntryRequest = z.infer<typeof PostJournalEntryRequestSchema>;
export type SetCompanionLinksRequest = z.infer<typeof SetCompanionLinksRequestSchema>;
export type AccountQuery = z.infer<typeof AccountQuerySchema>;
export type JournalEntryQuery = z.infer<typeof JournalEntryQuerySchema>;
export type AccountResponse = z.infer<typeof AccountResponseSchema>;
export type JournalEntryResponse = z.infer<typeof JournalEntryResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
