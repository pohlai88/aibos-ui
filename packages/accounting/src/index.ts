// Core Module
export * from './accounting.module';

// Domain Models
export * from './domain/account.domain';
export * from './domain/chart-of-accounts.domain';
export * from './domain/journal-entry';
export * from './domain/journal-entry-line';
export * from './domain/journal-entry-status.domain';
export * from './domain/Money';
export * from './utils';
export * from './domain/repositories.interface';
export * from './domain/invoice.domain';

// Commands
export * from './commands/create-account.command';
export * from './commands/post-journal-entry.command';
export * from './commands/issue-invoice.command';

// Services
export * from './services/accounting.service';
export * from './services/invoice.service';
export * from './services/invoice-event-handler.service';
export * from './services/ui-integration.service';

// AI Services - Phase 2 Scaffold (not yet implemented)
export * from './services/ai-assistant.service';
export * from './services/predictive-analytics.service';
export * from './services/natural-language.service';
export * from './services/intelligent-validation.service';

// Projections
export * from './projections/invoice.projection';
export * from './projections/general-ledger.projection';

// API
export * from './api/accounting-api-module';
export * from './api/accounting-controller';
export * from './api/invoice-controller';

// API Schemas
export {
  CreateAccountRequestSchema,
  UpdateAccountRequestSchema,
  JournalEntryLineSchema,
  CreateJournalEntryRequestSchema,
  PostJournalEntryRequestSchema,
  SetCompanionLinksRequestSchema,
  AccountQuerySchema,
  JournalEntryQuerySchema,
  AccountResponseSchema,
  JournalEntryResponseSchema,
  ErrorResponseSchema,
  SuccessResponseSchema,
} from './validation/api.schema';
export type {
  CreateAccountRequest,
  UpdateAccountRequest,
  CreateJournalEntryRequest,
  PostJournalEntryRequest,
  SetCompanionLinksRequest,
  AccountQuery,
  JournalEntryQuery,
  AccountResponse,
  JournalEntryResponse,
  ErrorResponse,
  SuccessResponse,
} from './validation/api.schema';
export { JournalEntryLine as JournalEntryLineClass } from './domain/journal-entry-line';
export * from './validation/import.schema';
export * from './validation/ui.schema';

// Accounting Events
export * from './events/account-created.event';
export * from './events/account-updated.event';
export * from './events/journal-entry-posted.event';
export * from './events/account-parent-changed.event';
export * from './events/account-posting-policy-changed.event';
export * from './events/account-companion-links-set.event';

// Accounting Commands
export * from './commands/create-account.command';
export * from './commands/post-journal-entry.command';

// Accounting Services
export * from './services/depreciable-asset-bundle.factory';
export * from './services/group-coa.factory';
export * from './services/intercompany-validator.utility';
export * from './services/template-registry.utility';
export * from './services/template-importer.utility';
export * from './services/standards-compliance.service';
export * from './services/accounting-period.service';
export * from './services/tax-compliance.service';
export * from './services/multi-currency.service';
export * from './services/trial-balance.service';
export * from './services/financial-reporting.service';
export * from './services/accounting.service';
export * from './services/error-handling.service';
export * from './services/financial-analytics.service';
export * from './services/fx-policy.service';
export * from './services/period-close.service';
export * from './services/migration-orchestrator.service';
export * from './services/ui-integration.service';

// Accounting Projections
export * from './projections/general-ledger.projection';

// Resilience Infrastructure
export * from './infrastructure/resilience-manager.infrastructure';

// Accounting API
export * from './api/accounting-api-module.js';
export * from './api/accounting-controller.js';
export * from './api/accounting-routes.js';
export * from './api/validation.middleware.js';
export * from './api/ui-controller-express.js';

// Standards Compliance
export * from './types/standards';
