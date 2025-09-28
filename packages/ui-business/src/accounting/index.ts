// AIBOS ERP: Essential Accounting Business UI
// Main export file for accounting components

export * from './components';

// Re-export backend types
export type {
  Account,
  AccountType,
  JournalEntry,
  JournalEntryStatus,
  CreateAccountCommand,
  PostJournalEntryCommand,
} from '@aibos/accounting';

// Export UI-specific types (excluding JournalEntryLine to avoid conflict)
export type {
  AccountHierarchyNode,
  AccountHierarchy,
  AccountBalanceSummary,
  JournalEntryFormData,
  TrialBalanceData,
  TrialBalanceFilters,
  FinancialReportData,
  ReportParameters,
  AccountSelectorProperties,
  AmountInputProperties,
  BalanceDisplayProperties,
  StatusIndicatorProperties,
  UseAccountingDataReturn,
  UseJournalEntryReturn,
  UseTrialBalanceReturn,
  ValidationError,
  ValidationResult,
  AccountingStore,
} from './types';

export * from './hooks';
export * from './services';
export * from './utils';
export * from './constants';
