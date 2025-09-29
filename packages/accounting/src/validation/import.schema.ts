/**
 * Import/Export Schemas using Zod
 *
 * These schemas validate external data during import/export operations,
 * such as Chart of Accounts templates, journal entry imports, etc.
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

// ============================================================================
// Chart of Accounts Template Schema
// ============================================================================

export const ChartOfAccountsTemplateSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format'),
  standards: z.array(z.string()).min(1, 'At least one standard must be specified'),
  metadata: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    currency: z.string().length(3, 'Currency must be 3 characters'),
    fiscalYearStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fiscal year start must be YYYY-MM-DD'),
    createdBy: z.string().min(1),
    createdAt: z.string().datetime(),
  }),
  accounts: z
    .array(
      z.object({
        code: z.string().min(1).max(20),
        name: z.string().min(1).max(100),
        type: AccountTypeValidator,
        parentCode: z.string().optional(),
        specialAccountType: z.string().optional(),
        postingAllowed: z.boolean().default(true),
        description: z.string().max(500).optional(),
        openingBalance: z.number().default(0),
        // Companion links for depreciation accounts
        companionLinks: z
          .object({
            accumulatedDepreciationCode: z.string().optional(),
            depreciationExpenseCode: z.string().optional(),
            allowanceAccountCode: z.string().optional(),
          })
          .optional(),
      }),
    )
    .min(1, 'At least one account must be defined'),
});

// ============================================================================
// Journal Entry Import Schema
// ============================================================================

export const JournalEntryImportSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required'),
  description: z.string().min(1, 'Batch description is required'),
  postingDate: z.string().datetime('Invalid posting date format'),
  entries: z
    .array(
      z.object({
        reference: z.string().min(1).max(50),
        description: z.string().min(1).max(200),
        lines: z
          .array(
            z.object({
              accountCode: z.string().min(1).max(20),
              description: z.string().min(1).max(200),
              debitAmount: z.number().min(0).multipleOf(0.01),
              creditAmount: z.number().min(0).multipleOf(0.01),
            }),
          )
          .min(1, 'At least one line required per entry'),
      }),
    )
    .min(1, 'At least one journal entry required'),
});

// ============================================================================
// Configuration Import Schema
// ============================================================================

export const AccountingConfigImportSchema = z.object({
  currency: z.string().length(3, 'Currency must be 3 characters'),
  decimalPlaces: z.number().int().min(0).max(4).default(2),
  fiscalYearStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reportingStandards: z.array(z.string()).min(1),
  chartOfAccounts: z.object({
    templateId: z.string().min(1),
    customizations: z.record(z.unknown()).optional(),
  }),
  postingRules: z.object({
    allowNegativeBalances: z.boolean().default(false),
    requireApproval: z.boolean().default(false),
    maxLinesPerEntry: z.number().int().min(1).max(1000).default(100),
  }),
});

// ============================================================================
// Data Export Schema
// ============================================================================

export const DataExportRequestSchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx'], {
    errorMap: () => ({ message: 'Export format must be json, csv, or xlsx' }),
  }),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  includeAccounts: z.boolean().default(true),
  includeJournalEntries: z.boolean().default(true),
  includeCompanionLinks: z.boolean().default(true),
  filters: z
    .object({
      accountTypes: z.array(z.string()).optional(),
      statuses: z.array(z.string()).optional(),
      accountCodes: z.array(z.string()).optional(),
    })
    .optional(),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate and parse a Chart of Accounts template
 */
export function validateChartOfAccountsTemplate(data: unknown): {
  success: boolean;
  data?: ChartOfAccountsTemplate;
  error?: z.ZodError;
} {
  return ChartOfAccountsTemplateSchema.safeParse(data);
}

/**
 * Validate and parse journal entry import data
 */
export function validateJournalEntryImport(data: unknown): {
  success: boolean;
  data?: JournalEntryImport;
  error?: z.ZodError;
} {
  return JournalEntryImportSchema.safeParse(data);
}

/**
 * Validate and parse accounting configuration
 */
export function validateAccountingConfig(data: unknown): {
  success: boolean;
  data?: AccountingConfigImport;
  error?: z.ZodError;
} {
  return AccountingConfigImportSchema.safeParse(data);
}

/**
 * Validate export request
 */
export function validateExportRequest(data: unknown): {
  success: boolean;
  data?: DataExportRequest;
  error?: z.ZodError;
} {
  return DataExportRequestSchema.safeParse(data);
}

// ============================================================================
// Type Exports
// ============================================================================

export type ChartOfAccountsTemplate = z.infer<typeof ChartOfAccountsTemplateSchema>;
export type JournalEntryImport = z.infer<typeof JournalEntryImportSchema>;
export type AccountingConfigImport = z.infer<typeof AccountingConfigImportSchema>;
export type DataExportRequest = z.infer<typeof DataExportRequestSchema>;
